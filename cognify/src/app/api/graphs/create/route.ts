import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "@/server/db";
import { graphs } from "@/server/db/schema";
import { auth } from "@/server/better-auth";
import { eq, and } from "drizzle-orm";
import { getTopicGenerationPrompt } from "@/lib/prompts";
import { env } from "@/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY as string,
});

// Input validation schema
const createGraphSchema = z
  .object({
    topic: z.string().optional(),
    inputText: z.string().optional(),
    name: z.string().optional(),
  })
  .refine(
    (data) => {
      // Must have either topic OR inputText, but not both
      return (
        (!!data.topic && !data.inputText) || (!data.topic && !!data.inputText)
      );
    },
    {
      message: "Must provide either 'topic' or 'inputText', but not both",
    },
  );

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Check for concurrent builds (max 1 building graph per user)
    const buildingGraphs = await db
      .select()
      .from(graphs)
      .where(and(eq(graphs.userId, userId), eq(graphs.status, "building")))
      .limit(1);

    if (buildingGraphs.length > 0) {
      return NextResponse.json(
        { error: "Please wait for current graph to complete" },
        { status: 429 },
      );
    }

    // 3. Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = createGraphSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { topic, inputText, name } = validationResult.data;

    // 4. Determine source text and metadata
    let sourceText: string;
    let graphName: string;
    let sourceType: "topic" | "upload";
    let inputMeta: Record<string, unknown> | null = null;

    if (topic) {
      // Generate text from topic using OpenAI
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: getTopicGenerationPrompt(topic),
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        sourceText = completion.choices[0]?.message?.content ?? "";

        if (!sourceText || sourceText.trim().length === 0) {
          return NextResponse.json(
            { error: "Failed to generate text from topic" },
            { status: 500 },
          );
        }
      } catch (error) {
        console.error("OpenAI generation error:", error);
        return NextResponse.json(
          { error: "Failed to generate text from topic. Please try again." },
          { status: 500 },
        );
      }

      graphName = name ?? topic;
      sourceType = "topic";
      inputMeta = { topic };
    } else if (inputText) {
      sourceText = inputText;

      // Validate input text size (max 50k chars)
      if (sourceText.length > 50000) {
        return NextResponse.json(
          { error: "Input text too large (max 50,000 characters)" },
          { status: 400 },
        );
      }

      graphName = name ?? `Graph ${new Date().toISOString().slice(0, 10)}`;
      sourceType = "upload";
      inputMeta = { length: sourceText.length };
    } else {
      // Should never reach here due to refinement, but TypeScript needs it
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // 5. Create graph record
    const [graph] = await db
      .insert(graphs)
      .values({
        userId,
        name: graphName,

        sourceType,
        inputMeta,
        inputText: sourceText,
        status: "pending", 
      })
      .returning({ id: graphs.id });

    if (!graph?.id) {
      return NextResponse.json(
        { error: "Failed to create graph" },
        { status: 500 },
      );
    }

    // 6. Return graph ID
    return NextResponse.json({
      graphId: graph.id,
    });
  } catch (error) {
    console.error("Error creating graph:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
