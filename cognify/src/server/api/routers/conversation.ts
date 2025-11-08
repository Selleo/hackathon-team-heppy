import { z } from "zod";
import { eq, desc, asc, sql } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { conversations, messages, knowledgeItems } from "@/server/db/schema";
import { buildSystemPrompt } from "@/server/ai/prompts";
import { createUpdateKnowledgeItemTool } from "@/server/ai/tools";

export const conversationRouter = createTRPCRouter({
  // Get all conversations for the logged-in user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get conversations with message count
    const conversationList = await ctx.db
      .select({
        id: conversations.id,
        title: conversations.title,
        updatedAt: conversations.updatedAt,
        messageCount: sql<number>`cast(count(${messages.id}) as int)`,
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, userId))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    return conversationList;
  }),

  // Create a new conversation
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          userId,
          title: input.title,
        })
        .returning();

      return conversation;
    }),

  // Get conversation history with all messages
  getHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns this conversation
      const conversation = await ctx.db.query.conversations.findFirst({
        where: eq(conversations.id, input.conversationId),
      });

      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }

      // Get all messages for this conversation
      const messageList = await ctx.db.query.messages.findMany({
        where: eq(messages.conversationId, input.conversationId),
        orderBy: [asc(messages.timestamp)],
      });

      return {
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        messages: messageList.map((msg) => ({
          id: msg.id,
          content: msg.content,
          authorType: msg.authorType,
          timestamp: msg.timestamp,
          metadata: msg.metadata as Record<string, unknown> | null,
        })),
      };
    }),

  // Send a message (AI integration will be added in Phase 3)
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1, "Message cannot be empty"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns this conversation
      const conversation = await ctx.db.query.conversations.findFirst({
        where: eq(conversations.id, input.conversationId),
      });

      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }

      // Save user message
      const [userMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          content: input.content,
          authorType: "user",
        })
        .returning();

      // Update conversation's updatedAt timestamp
      await ctx.db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      // Get conversation history for AI context
      const history = await ctx.db.query.messages.findMany({
        where: eq(messages.conversationId, input.conversationId),
        orderBy: [asc(messages.timestamp)],
      });

      // Get user's knowledge graph
      const userKnowledgeItems = await ctx.db.query.knowledgeItems.findMany({
        where: eq(knowledgeItems.userId, userId),
      });

      // Build AI context
      const systemPrompt = buildSystemPrompt(userKnowledgeItems);
      const conversationMessages = history.map((msg) => ({
        role: msg.authorType === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

      // Call AI with tools
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          updateKnowledgeItem: createUpdateKnowledgeItemTool(
            ctx.db,
            userId,
            input.conversationId,
          ),
        },
      });

      // Extract updated knowledge item IDs from tool results
      const updatedKnowledgeItemIds: string[] = [];
      for (const step of result.steps) {
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            if (
              toolResult.toolName === "updateKnowledgeItem" &&
              "args" in toolResult &&
              toolResult.args &&
              typeof toolResult.args === "object" &&
              "result" in toolResult.args &&
              typeof toolResult.args.result === "object" &&
              toolResult.args.result !== null &&
              "id" in toolResult.args.result
            ) {
              updatedKnowledgeItemIds.push(
                (toolResult.args.result as { id: string }).id,
              );
            }
          }
        }
      }

      // Save AI response with metadata
      const [aiMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          content: result.text,
          authorType: "ai",
          metadata: {
            updatedKnowledgeItemIds,
          },
        })
        .returning();

      if (!aiMessage || !userMessage) {
        throw new Error("Failed to save messages");
      }

      return {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        },
        aiMessage: {
          id: aiMessage.id,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp,
          metadata: aiMessage.metadata as Record<string, unknown> | null,
        },
      };
    }),
});

