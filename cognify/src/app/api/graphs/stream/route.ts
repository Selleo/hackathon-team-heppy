import { type NextRequest } from "next/server";
import { db } from "@/server/db";
import { graphs } from "@/server/db/schema";
import { auth } from "@/server/better-auth";
import { eq } from "drizzle-orm";
import { generateNodeId } from "@/lib/graph-utils";

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

// Helper to delay (for stub data)
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const graphId = searchParams.get("graphId");

  if (!graphId) {
    return new Response(
      JSON.stringify({ error: "Missing graphId parameter" }),
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

    // 3. Update graph status to building
    await db
      .update(graphs)
      .set({ status: "building" })
      .where(eq(graphs.id, graphId));

    // 4. Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // STUB IMPLEMENTATION - Replace with real pipeline in Phase 7

          // Send status update
          sendEvent(controller, "status", {
            message: "Starting graph generation...",
          });
          await delay(500);

          // Create stub nodes
          const node1 = {
            id: generateNodeId("biology"),
            label: "biology",
            group: "extracted",
            weight: 1,
          };

          const node2 = {
            id: generateNodeId("cell"),
            label: "cell",
            group: "extracted",
            weight: 1,
          };

          const node3 = {
            id: generateNodeId("mitosis"),
            label: "mitosis",
            group: "extracted",
            weight: 1,
          };

          // Send nodes
          sendEvent(controller, "node", { node: node1 });
          await delay(300);

          sendEvent(controller, "node", { node: node2 });
          await delay(300);

          sendEvent(controller, "node", { node: node3 });
          await delay(300);

          // Send edges
          const edge1 = {
            source: node1.id,
            target: node2.id,
            relation: "studies",
            type: "extracted",
            confidence: 0.9,
          };

          const edge2 = {
            source: node2.id,
            target: node3.id,
            relation: "undergoes",
            type: "extracted",
            confidence: 0.85,
          };

          sendEvent(controller, "edge", { edge: edge1 });
          await delay(300);

          sendEvent(controller, "edge", { edge: edge2 });
          await delay(300);

          // Create stub graph JSON
          const graphJson = {
            nodes: [node1, node2, node3],
            edges: [edge1, edge2],
          };

          // Save to database
          await db
            .update(graphs)
            .set({
              status: "complete",
              graphJson,
            })
            .where(eq(graphs.id, graphId));

          // Send complete event
          sendEvent(controller, "complete", {
            summary: {
              nodes: 3,
              edges: 2,
            },
          });

          controller.close();
        } catch (error) {
          console.error("Error in stream:", error);

          // Update graph status to error
          await db
            .update(graphs)
            .set({ status: "error" })
            .where(eq(graphs.id, graphId));

          sendEvent(controller, "error", {
            message: "An error occurred during graph generation",
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
    console.error("Error setting up stream:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
