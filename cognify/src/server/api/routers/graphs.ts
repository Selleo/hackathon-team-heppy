import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { graphs, nodeDetails } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const graphsRouter = createTRPCRouter({
  /**
   * List all graphs for the authenticated user, ordered by creation date (newest first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userGraphs = await ctx.db
      .select({
        id: graphs.id,
        name: graphs.name,
        icon: graphs.icon,
        sourceType: graphs.sourceType,
        status: graphs.status,
        createdAt: graphs.createdAt,
        updatedAt: graphs.updatedAt,
      })
      .from(graphs)
      .where(eq(graphs.userId, ctx.session.user.id))
      .orderBy(desc(graphs.createdAt));

    return userGraphs;
  }),

  /**
   * Get a single graph by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [graph] = await ctx.db
        .select()
        .from(graphs)
        .where(eq(graphs.id, input.id))
        .limit(1);

      if (!graph) {
        throw new Error("Graph not found");
      }

      // Verify ownership
      if (graph.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return graph;
    }),

  /**
   * Delete a graph by ID
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership first
      const [graph] = await ctx.db
        .select({ userId: graphs.userId })
        .from(graphs)
        .where(eq(graphs.id, input.id))
        .limit(1);

      if (!graph) {
        throw new Error("Graph not found");
      }

      if (graph.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Delete the graph
      await ctx.db.delete(graphs).where(eq(graphs.id, input.id));

      return { success: true };
    }),

  /**
   * Get cached node details if they exist.
   * Returns null if not yet generated - frontend should then stream generation.
   */
  getNodeDetails: protectedProcedure
    .input(
      z.object({
        graphId: z.string(),
        nodeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // 1. Verify graph ownership
      const [graph] = await ctx.db
        .select({ userId: graphs.userId })
        .from(graphs)
        .where(eq(graphs.id, input.graphId))
        .limit(1);

      if (!graph) {
        throw new Error("Graph not found");
      }

      if (graph.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // 2. Check if we already have cached content
      const [existingDetail] = await ctx.db
        .select()
        .from(nodeDetails)
        .where(
          and(
            eq(nodeDetails.graphId, input.graphId),
            eq(nodeDetails.nodeId, input.nodeId),
          ),
        )
        .limit(1);

      if (existingDetail) {
        console.log(
          `[NodeDetails] Returning cached content for node ${input.nodeId}`,
        );
        return {
          content: existingDetail.content,
          relationships: existingDetail.relationships as {
            incoming: Array<{ source: string; relation: string }>;
            outgoing: Array<{ relation: string; target: string }>;
          },
        };
      }

      // No cached content - return null
      console.log(
        `[NodeDetails] No cached content for node ${input.nodeId}, returning null`,
      );
      return null;
    }),
});
