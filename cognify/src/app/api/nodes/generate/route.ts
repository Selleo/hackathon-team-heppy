import { type NextRequest } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { graphs, nodeDetails } from "@/server/db/schema";
import { auth } from "@/server/better-auth";
import { eq, and } from "drizzle-orm";
import { env } from "@/env";
import {
  NODE_DETAIL_SYSTEM_PROMPT,
  getNodeDetailPrompt,
} from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY as string,
  timeout: 30000,
});

// Helper to send SSE event
function sendEvent(
  controller: ReadableStreamDefaultController,
  eventType: string,
  data: unknown,
) {
  const encoder = new TextEncoder();
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const graphId = searchParams.get("graphId");
  const nodeId = searchParams.get("nodeId");
  const nodeLabel = searchParams.get("nodeLabel");

  if (!graphId || !nodeId || !nodeLabel) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 1. Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // 2. Fetch graph and verify ownership
    const [graph] = await db
      .select()
      .from(graphs)
      .where(eq(graphs.id, graphId))
      .limit(1);

    if (!graph) {
      return new Response(JSON.stringify({ error: "Graph not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (graph.userId !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Check if already exists (race condition protection)
    const [existing] = await db
      .select()
      .from(nodeDetails)
      .where(and(eq(nodeDetails.graphId, graphId), eq(nodeDetails.nodeId, nodeId)))
      .limit(1);

    if (existing) {
      console.log(
        `[NodeGenerate] Content already exists for node ${nodeId}, returning cached`,
      );
      // Return cached content via SSE
      const stream = new ReadableStream({
        start(controller) {
          sendEvent(controller, "content", { text: existing.content });
          sendEvent(controller, "complete", {
            relationships: existing.relationships,
          });
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 4. Parse graph data
    const graphData = graph.graphJson as {
      nodes: Array<{ id: string; label: string }>;
      edges: Array<{ source: string; target: string; relation: string }>;
    } | null;

    if (!graphData) {
      return new Response(JSON.stringify({ error: "Graph data not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all node labels
    const allNodeLabels = graphData.nodes.map((n) => n.label);

    // Find incoming and outgoing edges
    const incomingEdges = graphData.edges
      .filter((e) => e.target === nodeId)
      .map((e) => ({
        source:
          graphData.nodes.find((n) => n.id === e.source)?.label ?? "Unknown",
        relation: e.relation,
      }));

    const outgoingEdges = graphData.edges
      .filter((e) => e.source === nodeId)
      .map((e) => ({
        relation: e.relation,
        target:
          graphData.nodes.find((n) => n.id === e.target)?.label ?? "Unknown",
      }));

    const relationships = {
      incoming: incomingEdges,
      outgoing: outgoingEdges,
    };

    // Generate prompt
    const prompt = getNodeDetailPrompt(
      nodeLabel,
      graph.name,
      allNodeLabels,
      incomingEdges,
      outgoingEdges,
    );

    // 5. Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(
            `[NodeGenerate] Starting streaming generation for node ${nodeId}`,
          );

          sendEvent(controller, "status", {
            message: "Generating detailed explanation...",
          });

          // Stream from OpenAI
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: NODE_DETAIL_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_completion_tokens: 320,
            stream: true,
          });

          let fullContent = "";

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullContent += content;
              sendEvent(controller, "content", { text: content });
            }
          }

          // Save to database
          await db.insert(nodeDetails).values({
            graphId,
            nodeId,
            nodeLabel,
            content: fullContent,
            relationships,
          });

          console.log(
            `[NodeGenerate] Completed and saved content for node ${nodeId}`,
          );

          // Send completion event
          sendEvent(controller, "complete", { relationships });

          controller.close();
        } catch (error) {
          console.error("Error generating node details:", error);

          sendEvent(controller, "error", {
            message:
              error instanceof Error
                ? error.message
                : "Failed to generate node details",
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error setting up node generation stream:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

