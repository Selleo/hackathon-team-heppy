import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { knowledgeItems } from "@/server/db/schema";

export const knowledgeRouter = createTRPCRouter({
  // Get all knowledge items with optional filtering
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["Latent", "Identified Gap", "Learning", "Mastered"])
          .optional()
          .or(
            z.array(
              z.enum(["Latent", "Identified Gap", "Learning", "Mastered"]),
            ),
          ),
        category: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build where conditions
      const conditions = [eq(knowledgeItems.userId, userId)];

      if (input.status) {
        if (Array.isArray(input.status)) {
          conditions.push(inArray(knowledgeItems.status, input.status));
        } else {
          conditions.push(eq(knowledgeItems.status, input.status));
        }
      }

      if (input.category) {
        conditions.push(eq(knowledgeItems.categoryPath, input.category));
      }

      // Get knowledge items
      let items = await ctx.db.query.knowledgeItems.findMany({
        where: and(...conditions),
        orderBy: (items, { desc }) => [desc(items.updatedAt)],
      });

      // Apply search filter client-side for now (can be optimized with full-text search later)
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        items = items.filter((item) =>
          item.title.toLowerCase().includes(searchLower),
        );
      }

      return items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        categoryPath: item.categoryPath,
        updatedAt: item.updatedAt,
      }));
    }),

  // Get a single knowledge item by ID
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const item = await ctx.db.query.knowledgeItems.findFirst({
        where: and(
          eq(knowledgeItems.id, input.id),
          eq(knowledgeItems.userId, userId),
        ),
      });

      if (!item) {
        throw new Error("Knowledge item not found");
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        categoryPath: item.categoryPath,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastReviewedAt: item.lastReviewedAt,
      };
    }),

  // Manually update a knowledge item's status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["Latent", "Identified Gap", "Learning", "Mastered"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns this item
      const item = await ctx.db.query.knowledgeItems.findFirst({
        where: and(
          eq(knowledgeItems.id, input.id),
          eq(knowledgeItems.userId, userId),
        ),
      });

      if (!item) {
        throw new Error("Knowledge item not found");
      }

      // Update the status
      const [updatedItem] = await ctx.db
        .update(knowledgeItems)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeItems.id, input.id))
        .returning();

      return {
        id: updatedItem!.id,
        status: updatedItem!.status,
        updatedAt: updatedItem!.updatedAt,
      };
    }),
});

