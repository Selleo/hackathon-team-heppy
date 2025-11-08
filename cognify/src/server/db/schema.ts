import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Helper function for generating IDs
function createId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enums
export const knowledgeStatusEnum = pgEnum("knowledge_status", [
  "Latent",
  "Identified Gap",
  "Learning",
  "Mastered",
]);

export const authorTypeEnum = pgEnum("author_type", ["user", "ai"]);

// User table (already exists from Better Auth)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

// ===================================
// Cognify Tables
// ===================================

// Conversations table
export const conversations = pgTable(
  "conversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("conversation_user_id_idx").on(table.userId),
    updatedAtIdx: index("conversation_updated_at_idx").on(table.updatedAt),
  }),
);

// Messages table
export const messages = pgTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    authorType: authorTypeEnum("author_type").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb("metadata"), // Stores tool calls and other AI metadata
  },
  (table) => ({
    conversationIdIdx: index("message_conversation_id_idx").on(
      table.conversationId,
    ),
    timestampIdx: index("message_timestamp_idx").on(table.timestamp),
  }),
);

// Knowledge Items table
export const knowledgeItems = pgTable(
  "knowledge_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: knowledgeStatusEnum("status").notNull(),
    category: text("category"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    sourceConversationId: text("source_conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" },
    ),
  },
  (table) => ({
    userIdIdx: index("knowledge_item_user_id_idx").on(table.userId),
    userIdStatusIdx: index("knowledge_item_user_id_status_idx").on(
      table.userId,
      table.status,
    ),
    userIdCategoryIdx: index("knowledge_item_user_id_category_idx").on(
      table.userId,
      table.category,
    ),
    titleIdx: index("knowledge_item_title_idx").on(table.title),
    userIdTitleUnique: uniqueIndex("knowledge_item_user_id_title_unique").on(
      table.userId,
      table.title,
    ),
  }),
);

// ===================================
// Relations
// ===================================

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  conversations: many(conversations),
  knowledgeItems: many(knowledgeItems),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [conversations.userId],
      references: [user.id],
    }),
    messages: many(messages),
    knowledgeItems: many(knowledgeItems),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const knowledgeItemsRelations = relations(
  knowledgeItems,
  ({ one }) => ({
    user: one(user, {
      fields: [knowledgeItems.userId],
      references: [user.id],
    }),
    sourceConversation: one(conversations, {
      fields: [knowledgeItems.sourceConversationId],
      references: [conversations.id],
    }),
  }),
);
