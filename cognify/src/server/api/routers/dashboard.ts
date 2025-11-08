import { eq, sql, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { knowledgeItems } from "@/server/db/schema";

export const dashboardRouter = createTRPCRouter({
  // Get dashboard summary with stats and recent activity
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get all knowledge items for the user
    const items = await ctx.db.query.knowledgeItems.findMany({
      where: eq(knowledgeItems.userId, userId),
      orderBy: [desc(knowledgeItems.updatedAt)],
    });

    // Calculate stats
    const stats = {
      totalKnowledgeItems: items.length,
      masteredCount: items.filter((item) => item.status === "Mastered").length,
      learningCount: items.filter((item) => item.status === "Learning").length,
      gapCount: items.filter((item) => item.status === "Identified Gap").length,
      latentCount: items.filter((item) => item.status === "Latent").length,
    };

    // Get recent activity (last 10 updated items)
    const recentActivity = items.slice(0, 10).map((item) => ({
      type: "status_changed" as const,
      timestamp: item.updatedAt,
      description: `${item.title} → ${item.status}`,
      knowledgeItemId: item.id,
    }));

    // Group knowledge items by category
    const knowledgeByCategory: Record<
      string,
      {
        total: number;
        byStatus: Record<string, number>;
      }
    > = {};

    items.forEach((item) => {
      const category = item.category || "Uncategorized";

      if (!knowledgeByCategory[category]) {
        knowledgeByCategory[category] = {
          total: 0,
          byStatus: {
            Latent: 0,
            "Identified Gap": 0,
            Learning: 0,
            Mastered: 0,
          },
        };
      }

      const categoryData = knowledgeByCategory[category];
      if (categoryData && categoryData.byStatus) {
        categoryData.total++;
        const statusCount = categoryData.byStatus[item.status];
        if (statusCount !== undefined) {
          categoryData.byStatus[item.status] = statusCount + 1;
        }
      }
    });

    return {
      stats,
      recentActivity,
      knowledgeByCategory,
    };
  }),
});

