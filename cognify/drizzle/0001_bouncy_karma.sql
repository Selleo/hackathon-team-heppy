CREATE TYPE "public"."author_type" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TYPE "public"."knowledge_status" AS ENUM('Latent', 'Identified Gap', 'Learning', 'Mastered');--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "knowledge_status" NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"source_conversation_id" text
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"content" text NOT NULL,
	"author_type" "author_type" NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
DROP TABLE "pg-drizzle_post" CASCADE;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item" ADD CONSTRAINT "knowledge_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item" ADD CONSTRAINT "knowledge_item_source_conversation_id_conversation_id_fk" FOREIGN KEY ("source_conversation_id") REFERENCES "public"."conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_user_id_idx" ON "conversation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversation_updated_at_idx" ON "conversation" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "knowledge_item_user_id_idx" ON "knowledge_item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_user_id_status_idx" ON "knowledge_item" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "knowledge_item_user_id_category_idx" ON "knowledge_item" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "knowledge_item_title_idx" ON "knowledge_item" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_item_user_id_title_unique" ON "knowledge_item" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX "message_conversation_id_idx" ON "message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_timestamp_idx" ON "message" USING btree ("timestamp");