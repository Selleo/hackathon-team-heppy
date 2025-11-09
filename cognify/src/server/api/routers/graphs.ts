import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { graphs } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

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
});
