CREATE TYPE "public"."graph_status" AS ENUM('pending', 'building', 'complete', 'error');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('topic', 'upload');--> statement-breakpoint
CREATE TABLE "pg-drizzle_graph" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"input_meta" jsonb,
	"input_text" text NOT NULL,
	"status" "graph_status" DEFAULT 'pending' NOT NULL,
	"graph_json" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pg-drizzle_graph" ADD CONSTRAINT "pg-drizzle_graph_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "graph_user_id_idx" ON "pg-drizzle_graph" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "graph_created_at_idx" ON "pg-drizzle_graph" USING btree ("created_at");