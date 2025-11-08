import { z } from "zod";
import { tool } from "ai";
import Fuse from "fuse.js";
import { eq, and } from "drizzle-orm";
import type { DB } from "@/server/db";
import { knowledgeItems } from "@/server/db/schema";

/**
 * Find similar knowledge items using fuzzy matching
 * This prevents duplicates like "JavaScript Closures" vs "JS Closures"
 */
async function findSimilarKnowledgeItem(
  db: DB,
  userId: string,
  title: string,
): Promise<{ id: string; title: string } | null> {
  // Get all user's knowledge items
  const userItems = await db.query.knowledgeItems.findMany({
    where: eq(knowledgeItems.userId, userId),
    columns: {
      id: true,
      title: true,
    },
  });

  if (userItems.length === 0) {
    return null;
  }

  // Use Fuse.js for fuzzy matching
  // Reference: https://www.fusejs.io/
  const fuse = new Fuse(userItems, {
    keys: ["title"],
    threshold: 0.3, // 0 = exact match, 1 = match anything
    includeScore: true,
  });

  const results = fuse.search(title);

  // If we have a good match (score < 0.3), return it
  if (results.length > 0 && results[0]!.score! < 0.3) {
    return results[0]!.item;
  }

  return null;
}

/**
 * Create the updateKnowledgeItem tool for AI
 */
export function createUpdateKnowledgeItemTool(
  db: DB,
  userId: string,
  conversationId: string,
) {
  return tool({
    description:
      "Create or update a knowledge item to track user learning. Use this whenever the user mentions knowing or not knowing something.",
    inputSchema: z.object({
      title: z
        .string()
        .describe(
          "The name of the concept or skill (e.g., 'JavaScript Closures', 'React Hooks')",
        ),
      description: z
        .string()
        .optional()
        .describe("Brief explanation of what this concept is"),
      status: z
        .enum(["Latent", "Identified Gap", "Learning", "Mastered"])
        .describe(
          "Latent = user claims to know it (unverified), Identified Gap = user doesn't know it, Learning = actively studying, Mastered = verified proficiency",
        ),
      category: z
        .string()
        .optional()
        .describe(
          "Topic category like 'JavaScript', 'Python', 'Web Development', etc.",
        ),
    }),
    execute: async ({ title, description, status, category }) => {
      try {
        // Check for similar existing items using fuzzy matching
        const existing = await findSimilarKnowledgeItem(
          db,
          userId,
          title,
        );

        if (existing) {
          // Update existing item
          const [updated] = await db
            .update(knowledgeItems)
            .set({
              status: status,
              description: description || existing.title,
              category: category,
              lastReviewedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(knowledgeItems.id, existing.id),
                eq(knowledgeItems.userId, userId),
              ),
            )
            .returning();

          return {
            id: updated!.id,
            title: updated!.title,
            status: updated!.status,
            action: "updated" as const,
          };
        } else {
          // Create new item
          const [newItem] = await db
            .insert(knowledgeItems)
            .values({
              userId,
              title: title,
              description: description,
              status: status,
              category: category,
              sourceConversationId: conversationId,
            })
            .returning();

          return {
            id: newItem!.id,
            title: newItem!.title,
            status: newItem!.status,
            action: "created" as const,
          };
        }
      } catch (error) {
        console.error("Error in updateKnowledgeItem tool:", error);
        throw new Error("Failed to update knowledge item");
      }
    },
  });
}

