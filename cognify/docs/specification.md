# Cognify - Complete System Specification

## 1. Introduction

Cognify is an AI-powered learning companion that helps users map their knowledge through natural conversation. The system automatically tracks what users know and don't know, creating a dynamic knowledge graph that visualizes their learning journey.

### Core Capabilities
- **Conversational Learning**: Chat-based interface where AI discovers knowledge state
- **Knowledge Mapping**: Automatic tracking of what users know and don't know
- **Progress Visualization**: Dashboard (Atlas) showing knowledge state and growth over time

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (React Query)
- **Type Safety**: TypeScript

### Backend
- **API Layer**: tRPC (type-safe API)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth

### AI Integration
- **SDK**: Vercel AI SDK
- **Model**: OpenAI GPT-4 (or configurable)
- **Pattern**: Tool calling (agentic AI)

---

## 3. Data Models

### 3.1 User
The central entity representing a learner.

```typescript
{
  id: string;                    // Primary key
  name: string;                  // Display name
  email: string;                 // Unique email
  emailVerified: boolean;
  image?: string;                // Profile picture URL
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has many: `Conversations`, `KnowledgeItems`

---

### 3.2 Conversation
Represents a chat thread (e.g., "Web Development", "Python Learning").

```typescript
{
  id: string;                    // Primary key
  userId: string;                // Foreign key → User
  title: string;                 // e.g., "Web Development"
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to: `User`
- Has many: `Messages`

**Indexes:**
- `userId` (for fast user conversation lookup)
- `updatedAt` (for sorting by recent activity)

---

### 3.3 Message
A single chat bubble within a conversation.

```typescript
{
  id: string;                    // Primary key
  conversationId: string;        // Foreign key → Conversation
  content: string;               // Message text
  authorType: "user" | "ai";     // Who sent it
  timestamp: Date;
  metadata?: MessageMetadata;    // Structured data (see below)
}
```

**MessageMetadata Structure:**
```typescript
{
  toolCalls?: Array<{
    tool: "update_knowledge_item";
    params: Record<string, unknown>;
    result: unknown;
  }>;
  updatedKnowledgeItemIds?: string[]; // If AI updated items
}
```

**Purpose of Metadata:**
- Provides audit trail of AI actions
- Enables "undo" functionality (future)
- Helps debug AI behavior

**Indexes:**
- `conversationId` (for fetching conversation history)
- `timestamp` (for chronological ordering)

---

### 3.4 KnowledgeItem
Represents a single concept or skill in the user's knowledge base.

```typescript
{
  id: string;                    // Primary key
  userId: string;                // Foreign key → User
  title: string;                 // e.g., "JavaScript Closures"
  description?: string;          // AI-generated summary
  status: KnowledgeStatus;       // See enum below
  category?: string;             // e.g., "JavaScript", "Web Development"
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;         // Last time AI assessed this
  sourceConversationId?: string; // Where this was first mentioned
}
```

**KnowledgeStatus Enum:**
```typescript
type KnowledgeStatus = 
  | "Latent"          // Mentioned/claimed by user, not verified
  | "Identified Gap"  // Verified weakness
  | "Learning"        // Actively studying
  | "Mastered";       // Verified proficiency
```

**Status Flow:**
```
Latent → Identified Gap → Learning → Mastered
   ↓           ↓              ↓
   └───────────┴──────────────┘  (can transition between any states)
```

**UI Indicators:**
- 🟢 Green: `Mastered`
- 🔴 Red: `Identified Gap`
- 🟡 Yellow: `Learning`
- ⚪ Gray: `Latent`

**Relationships:**
- Belongs to: `User`

**Indexes:**
- `userId` (for user's knowledge graph)
- `userId + status` (for filtering by status)
- `userId + category` (for grouping by topic)
- `title` (for fuzzy search/duplicate detection)

**Unique Constraint:**
- `userId + title` (prevent duplicate items per user)

---

## 4. API Endpoints (tRPC Routers)

### 4.1 Conversation Router

#### `conversation.list`
**Type:** Query  
**Auth:** Required  
**Description:** Get all conversations for the logged-in user

**Input:**
```typescript
{} // No input
```

**Output:**
```typescript
Array<{
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
}>
```

**Sorting:** Most recently updated first

---

#### `conversation.create`
**Type:** Mutation  
**Auth:** Required  
**Description:** Create a new empty conversation

**Input:**
```typescript
{
  title: string; // e.g., "New Chat"
}
```

**Output:**
```typescript
{
  id: string;
  title: string;
  createdAt: Date;
}
```

---

#### `conversation.getHistory`
**Type:** Query  
**Auth:** Required  
**Description:** Get all messages in a conversation

**Input:**
```typescript
{
  conversationId: string;
}
```

**Output:**
```typescript
{
  conversation: {
    id: string;
    title: string;
  };
  messages: Array<{
    id: string;
    content: string;
    authorType: "user" | "ai";
    timestamp: Date;
    metadata?: MessageMetadata;
  }>;
}
```

---

#### `conversation.sendMessage`
**Type:** Mutation  
**Auth:** Required  
**Description:** Send a user message and get AI response

**Input:**
```typescript
{
  conversationId: string;
  content: string;
}
```

**Output:**
```typescript
{
  userMessage: {
    id: string;
    content: string;
    timestamp: Date;
  };
  aiMessage: {
    id: string;
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
  };
}
```

**Backend Flow:**
1. Save user message to database
2. Fetch conversation history + user's knowledge graph
3. Send to AI with tool definitions
4. AI may call tools (update knowledge items)
5. Execute tool calls and update database
6. Save AI response with metadata
7. Return both messages to frontend

---

### 4.2 Knowledge Router

#### `knowledge.list`
**Type:** Query  
**Auth:** Required  
**Description:** Get user's knowledge items with filtering

**Input:**
```typescript
{
  status?: KnowledgeStatus | KnowledgeStatus[];
  category?: string;
  search?: string; // Fuzzy search on title
}
```

**Output:**
```typescript
Array<{
  id: string;
  title: string;
  description?: string;
  status: KnowledgeStatus;
  category?: string;
  updatedAt: Date;
}>
```

---

#### `knowledge.getById`
**Type:** Query  
**Auth:** Required  
**Description:** Get detailed info about a knowledge item

**Input:**
```typescript
{
  id: string;
}
```

**Output:**
```typescript
{
  id: string;
  title: string;
  description?: string;
  status: KnowledgeStatus;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
  sourceConversation?: {
    id: string;
    title: string;
  };
}
```

---

#### `knowledge.updateStatus`
**Type:** Mutation  
**Auth:** Required  
**Description:** Manually update a knowledge item's status

**Input:**
```typescript
{
  id: string;
  status: KnowledgeStatus;
}
```

**Output:**
```typescript
{
  id: string;
  status: KnowledgeStatus;
  updatedAt: Date;
}
```

---

### 4.3 Dashboard Router

#### `dashboard.getSummary`
**Type:** Query  
**Auth:** Required  
**Description:** Get aggregated data for Atlas dashboard

**Input:**
```typescript
{} // No input
```

**Output:**
```typescript
{
  stats: {
    totalKnowledgeItems: number;
    masteredCount: number;
    learningCount: number;
    gapCount: number;
    latentCount: number;
  };
  recentActivity: Array<{
    type: "knowledge_created" | "status_changed";
    timestamp: Date;
    description: string;
    knowledgeItemId: string;
  }>;
  knowledgeByCategory: Record<string, {
    total: number;
    byStatus: Record<KnowledgeStatus, number>;
  }>;
}
```

---

## 5. AI Integration Architecture

### 5.1 Tool Definition

The AI has access to one primary tool to modify the database:

#### Tool: `updateKnowledgeItem`
**Purpose:** Create or update a knowledge item's status

**Parameters:**
```typescript
{
  title: string;                 // e.g., "JavaScript Closures"
  description?: string;          // AI-generated summary
  status: KnowledgeStatus;
  category?: string;
}
```

**Execution Logic:**
1. Fuzzy search for existing item with similar title
2. If found: Update status and description
3. If not found: Create new item
4. Return item ID to AI for reference

**Return Value:**
```typescript
{
  id: string;
  title: string;
  status: KnowledgeStatus;
  action: "created" | "updated";
}
```

---

### 5.2 AI Context Construction

When processing a user message, the AI receives:

```typescript
{
  messages: [
    // Conversation history
    { role: "user", content: "..." },
    { role: "assistant", content: "..." },
    // ... more messages
  ],
  systemPrompt: `
    You are Cognify, an AI learning companion. Your role is to:
    1. Identify what the user knows and doesn't know through conversation
    2. Track their learning progress over time
    3. Help them understand their knowledge state
    
    Current user knowledge state:
    - Mastered (${masteredCount}): ${masteredItems.map(i => i.title).join(", ")}
    - Learning (${learningCount}): ${learningItems.map(i => i.title).join(", ")}
    - Identified Gaps (${gapCount}): ${gapItems.map(i => i.title).join(", ")}
    - Latent (${latentCount}): ${latentItems.map(i => i.title).join(", ")}
    
    Guidelines:
    - When user mentions knowing something, mark it as "Latent" (unverified)
    - When user admits not knowing something, mark as "Identified Gap"
    - When user is actively studying something, mark as "Learning"
    - When user demonstrates clear proficiency, mark as "Mastered"
    - Periodically verify latent knowledge through questions
    - Use the updateKnowledgeItem tool to track all knowledge state changes
    - Be encouraging and supportive
    - Focus on understanding, not just cataloging
  `,
  tools: {
    updateKnowledgeItem: { /* definition */ }
  },
  maxSteps: 10 // Allow multiple tool calls
}
```

---

### 5.3 Multi-Step Tool Calling Flow

**Example Conversation:**

**User:** "I know React but I'm struggling with useEffect cleanup functions"

**AI Processing:**

**Step 1:** Call `updateKnowledgeItem`
```typescript
{
  title: "React",
  status: "Latent", // User claims to know it
  category: "Frontend"
}
```
→ Backend returns: `{ id: "ki_123", action: "created" }`

**Step 2:** Call `updateKnowledgeItem`
```typescript
{
  title: "useEffect Cleanup Functions",
  status: "Identified Gap", // User admits weakness
  category: "React"
}
```
→ Backend returns: `{ id: "ki_456", action: "created" }`

**Step 3:** Generate final response
```
I've noted that you know React (though we haven't verified your level yet) 
and identified that useEffect cleanup functions are a gap in your knowledge. 

Cleanup functions in useEffect are crucial for preventing memory leaks. 
They run before the component unmounts or before the effect runs again.

Would you like me to explain how they work with some examples?
```

---

### 5.4 Implementation with Vercel AI SDK

```typescript
// src/server/api/routers/conversation.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const conversationRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const userId = session.user.id;

      // 1. Save user message
      const [userMessage] = await db.insert(messages).values({
        conversationId: input.conversationId,
        content: input.content,
        authorType: "user",
        timestamp: new Date()
      }).returning();

      // 2. Get conversation history
      const history = await db.query.messages.findMany({
        where: eq(messages.conversationId, input.conversationId),
        orderBy: asc(messages.timestamp)
      });

      // 3. Get user's knowledge graph
      const knowledgeItems = await db.query.knowledgeItems.findMany({
        where: eq(knowledgeItems.userId, userId)
      });

      // 4. Build AI context
      const systemPrompt = buildSystemPrompt(knowledgeItems);
      const conversationMessages = history.map(m => ({
        role: m.authorType === "user" ? "user" : "assistant",
        content: m.content
      }));

      // 5. Call AI with tools
      const result = await generateText({
        model: openai('gpt-4'),
        system: systemPrompt,
        messages: conversationMessages,
        tools: {
          updateKnowledgeItem: tool({
            description: 'Create or update a knowledge item to track user learning',
            parameters: z.object({
              title: z.string().describe('The name of the concept or skill'),
              description: z.string().optional().describe('Brief explanation of what this is'),
              status: z.enum(['Latent', 'Identified Gap', 'Learning', 'Mastered']),
              category: z.string().optional().describe('Topic category like "JavaScript" or "Web Development"')
            }),
            execute: async (params) => {
              // Fuzzy match existing items
              const existing = await findSimilarKnowledgeItem(
                db, 
                userId, 
                params.title
              );

              if (existing) {
                // Update existing
                const [updated] = await db.update(knowledgeItems)
                  .set({
                    status: params.status,
                    description: params.description,
                    category: params.category,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                  })
                  .where(eq(knowledgeItems.id, existing.id))
                  .returning();

                return {
                  id: updated.id,
                  title: updated.title,
                  status: updated.status,
                  action: "updated"
                };
              } else {
                // Create new
                const [newItem] = await db.insert(knowledgeItems)
                  .values({
                    userId,
                    title: params.title,
                    description: params.description,
                    status: params.status,
                    category: params.category,
                    sourceConversationId: input.conversationId
                  })
                  .returning();

                return {
                  id: newItem.id,
                  title: newItem.title,
                  status: newItem.status,
                  action: "created"
                };
              }
            }
          })
        },
        maxSteps: 10
      });

      // 6. Save AI response
      const [aiMessage] = await db.insert(messages).values({
        conversationId: input.conversationId,
        content: result.text,
        authorType: "ai",
        timestamp: new Date(),
        metadata: {
          toolCalls: result.toolCalls,
          updatedKnowledgeItemIds: result.toolResults
            .filter(r => r.toolName === 'updateKnowledgeItem')
            .map(r => r.result.id)
        }
      }).returning();

      return {
        userMessage,
        aiMessage
      };
    })
});
```

---

## 6. Frontend Components

### 6.1 Chat View

**Components:**
- `ConversationList` - Sidebar with all conversations
- `MessageList` - Scrollable chat history
- `MessageInput` - Text input with send button
- `LoadingIndicator` - "Analyzing understanding..." state

**Key Features:**
- Auto-scroll to bottom on new messages
- Optimistic UI updates (show user message immediately)
- Streaming support (future enhancement)
- Rich message rendering (markdown, code blocks)

---

### 6.2 Atlas Dashboard

**Components:**
- `DashboardStats` - Summary cards (total items, mastered, gaps, etc.)
- `KnowledgeRepository` - Searchable/filterable list of all items
- `CategoryBreakdown` - Knowledge items grouped by category
- `RecentActivity` - Timeline of knowledge updates

**Key Features:**
- Real-time filtering and search
- Status indicators (colored dots)
- Click-through to detailed views
- Responsive grid layout
- Category-based organization

---

### 6.3 Knowledge Item Detail View

**Components:**
- `ItemHeader` - Title, status, category
- `StatusUpdater` - Dropdown to manually change status
- `RelatedItems` - Other items in same category
- `SourceConversation` - Link back to where it was mentioned

**Key Features:**
- Manual status updates
- View conversation context
- Related knowledge exploration

---

## 7. Database Schema (Drizzle)

```typescript
// src/server/db/schema.ts
import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const knowledgeStatusEnum = pgEnum("knowledge_status", [
  "Latent",
  "Identified Gap",
  "Learning",
  "Mastered",
]);

export const authorTypeEnum = pgEnum("author_type", ["user", "ai"]);

// Tables
export const conversations = pgTable(
  "conversation",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("conversation_user_id_idx").on(table.userId),
    updatedAtIdx: index("conversation_updated_at_idx").on(table.updatedAt),
  })
);

export const messages = pgTable(
  "message",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    authorType: authorTypeEnum("author_type").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    metadata: text("metadata"), // JSON stringified
  },
  (table) => ({
    conversationIdIdx: index("message_conversation_id_idx").on(
      table.conversationId
    ),
    timestampIdx: index("message_timestamp_idx").on(table.timestamp),
  })
);

export const knowledgeItems = pgTable(
  "knowledge_item",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: knowledgeStatusEnum("status").notNull(),
    category: text("category"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at"),
    sourceConversationId: text("source_conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" }
    ),
  },
  (table) => ({
    userIdIdx: index("knowledge_item_user_id_idx").on(table.userId),
    userIdStatusIdx: index("knowledge_item_user_id_status_idx").on(
      table.userId,
      table.status
    ),
    userIdCategoryIdx: index("knowledge_item_user_id_category_idx").on(
      table.userId,
      table.category
    ),
    titleIdx: index("knowledge_item_title_idx").on(table.title),
    userIdTitleUnique: uniqueIndex("knowledge_item_user_id_title_unique").on(
      table.userId,
      table.title
    ),
  })
);

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(user, {
    fields: [conversations.userId],
    references: [user.id],
  }),
  messages: many(messages),
  knowledgeItems: many(knowledgeItems),
}));

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
  })
);

// Helper function for generating IDs
function createId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## 8. Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cognify"

# AI Provider
OPENAI_API_KEY="sk-..."

# Auth (Better Auth)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID="..."
```


## 11. Development Phases

### MVP (1-2 weeks)
1. ✅ Database schema + migrations
2. ✅ Auth setup (Better Auth)
3. ✅ Basic chat UI
4. ✅ AI integration with tool calling
5. ✅ Knowledge item CRUD
6. ✅ Atlas dashboard (basic)

### Beta (1 week)
1. Polish UI/UX
2. Add search and filtering
3. Add category-based organization
4. User testing and feedback

### Launch (1 week)
1. Performance optimization
2. Error handling and logging
4. Documentation
5. Deploy to production

---

## 12. Technical Considerations

### Performance
- **Database indexing** on all foreign keys and frequently queried fields
- **Pagination** for large lists (conversations, knowledge items)
- **Caching** for user knowledge graph (Redis in future)
- **Lazy loading** for conversation history

### Security
- **Row-level security** via tRPC context (user can only access their data)
- **Input validation** with Zod schemas
- **Rate limiting** on AI endpoints (prevent abuse)
- **SQL injection prevention** (Drizzle ORM parameterized queries)

### Scalability
- **Stateless backend** (horizontal scaling)
- **Database connection pooling** (Postgres)
- **CDN for static assets** (Vercel Edge)
- **Background jobs** for long-running AI tasks (future: BullMQ)

### Monitoring
- **Error tracking** (Sentry)
- **Performance monitoring** (Vercel Analytics)
- **AI usage tracking** (token consumption, costs)
- **User behavior analytics** (PostHog or similar)

---

## Appendix: Glossary

- **Knowledge Item**: A single concept or skill tracked in the system
- **Latent Knowledge**: Items mentioned by user but not yet verified
- **Atlas**: The dashboard showing user's knowledge state
- **Tool Calling**: AI's ability to execute functions (create/update data)
- **Agentic AI**: AI that can make multiple decisions and tool calls autonomously
