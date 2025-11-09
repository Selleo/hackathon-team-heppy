import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

// Enums for graphs table
export const sourceTypeEnum = pgEnum("source_type", ["topic", "upload"]);
export const graphStatusEnum = pgEnum("graph_status", [
  "pending",
  "building",
  "complete",
  "error",
]);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

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

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  graphs: many(graphs),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// Graphs table for knowledge graph generation
export const graphs = createTable(
  "graph",
  (d) => ({
    id: d
      .text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text().notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    inputMeta: d.jsonb("input_meta"),
    inputText: d.text("input_text").notNull(),
    status: graphStatusEnum("status").notNull().default("pending"),
    graphJson: d.jsonb("graph_json"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("graph_user_id_idx").on(t.userId),
    index("graph_created_at_idx").on(t.createdAt),
  ],
);

export const graphRelations = relations(graphs, ({ one }) => ({
  user: one(user, { fields: [graphs.userId], references: [user.id] }),
}));
