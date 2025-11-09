CREATE TABLE "pg-drizzle_node_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"graph_id" text NOT NULL,
	"node_id" text NOT NULL,
	"node_label" text NOT NULL,
	"content" text NOT NULL,
	"relationships" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pg-drizzle_node_detail" ADD CONSTRAINT "pg-drizzle_node_detail_graph_id_pg-drizzle_graph_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."pg-drizzle_graph"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "node_detail_graph_id_idx" ON "pg-drizzle_node_detail" USING btree ("graph_id");--> statement-breakpoint
CREATE INDEX "node_detail_node_id_idx" ON "pg-drizzle_node_detail" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "node_detail_unique_idx" ON "pg-drizzle_node_detail" USING btree ("graph_id","node_id");