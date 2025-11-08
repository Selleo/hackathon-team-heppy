import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { messages, knowledgeItems } from "@/server/db/schema";
import { buildSystemPrompt } from "@/server/ai/prompts";
import { createUpdateKnowledgeItemTool } from "@/server/ai/tools";

export const chatRouter = createTRPCRouter({
  // Get chat history (last 100 messages for context)
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get last 100 messages for this user
    const messageList = await ctx.db.query.messages.findMany({
      where: eq(messages.userId, userId),
      orderBy: [desc(messages.timestamp)],
      limit: 100,
    });

    // Reverse to get chronological order
    return messageList.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      authorType: msg.authorType,
      timestamp: msg.timestamp,
      metadata: msg.metadata as Record<string, unknown> | null,
    }));
  }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1, "Message cannot be empty"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Save user message
      const [userMessage] = await ctx.db
        .insert(messages)
        .values({
          userId,
          content: input.content,
          authorType: "user",
        })
        .returning();

      // Get last 100 messages for AI context
      const history = await ctx.db.query.messages.findMany({
        where: eq(messages.userId, userId),
        orderBy: [desc(messages.timestamp)],
        limit: 100,
      });

      // Get user's knowledge graph
      const userKnowledgeItems = await ctx.db.query.knowledgeItems.findMany({
        where: eq(knowledgeItems.userId, userId),
      });

      // Build AI context
      const systemPrompt = buildSystemPrompt(userKnowledgeItems);
      const conversationMessages = history.reverse().map((msg) => ({
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
          ),
        },
        maxSteps: 10, // Allow multiple tool calls + final response
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

      // Get the final text response (after all tool calls)
      // The AI should ALWAYS provide text after tool calls based on the system prompt
      let aiResponseText = result.text;
      
      // Fallback if AI didn't respond (shouldn't happen with proper prompt)
      if (!aiResponseText || aiResponseText.trim() === "") {
        console.error("AI returned empty response, using fallback");
        aiResponseText = "What technologies do you work with most often?";
      }

      // Save AI response with metadata
      const [aiMessage] = await ctx.db
        .insert(messages)
        .values({
          userId,
          content: aiResponseText,
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

  // Clear chat history
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await ctx.db
      .delete(messages)
      .where(eq(messages.userId, userId));

    return { success: true };
  }),
});

