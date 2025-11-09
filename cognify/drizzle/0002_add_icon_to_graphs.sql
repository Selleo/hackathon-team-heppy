-- Add icon column to graphs table
ALTER TABLE "pg-drizzle_graph" ADD COLUMN "icon" text NOT NULL DEFAULT '📊';

-- Remove default after adding the column
ALTER TABLE "pg-drizzle_graph" ALTER COLUMN "icon" DROP DEFAULT;

