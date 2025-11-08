# Cognify - Implementation Roadmap

This is the step-by-step implementation guide for building Cognify. Check off items as you complete them.

---

## Phase 1: Setup & Foundation

### 1.1 Environment Setup
- [ ] Install dependencies (`ai`, `@ai-sdk/openai`)
- [ ] Set up environment variables (`.env`)
  - [ ] `OPENAI_API_KEY` (already exists)
  - [ ] `DATABASE_URL` (already exists)
  - [ ] `BETTER_AUTH_SECRET` (already exists)
- [ ] Verify database connection works

### 1.2 Database Schema
- [ ] Update `src/server/db/schema.ts` with new tables and removing boilerplate ones:
  - [ ] Add `knowledgeStatusEnum` 
  - [ ] Add `authorTypeEnum`
  - [ ] Add `conversations` table
  - [ ] Add `messages` table
  - [ ] Add `knowledgeItems` table
  - [ ] Add all relations
- [ ] Generate migration (`pnpm db:generate`)
- [ ] Run migration (`pnpm db:push`)
- [ ] Verify tables in database

---

## Phase 2: Backend API (tRPC)

### 2.1 Conversation Router
- [ ] Create `src/server/api/routers/conversation.ts`
- [ ] Implement `conversation.list` query
- [ ] Implement `conversation.create` mutation
- [ ] Implement `conversation.getHistory` query
- [ ] Add router to `src/server/api/root.ts`

### 2.2 Knowledge Router
- [ ] Create `src/server/api/routers/knowledge.ts`
- [ ] Implement `knowledge.list` query (with filters)
- [ ] Implement `knowledge.getById` query
- [ ] Implement `knowledge.updateStatus` mutation
- [ ] Add router to `src/server/api/root.ts`

### 2.3 Dashboard Router
- [ ] Create `src/server/api/routers/dashboard.ts`
- [ ] Implement `dashboard.getSummary` query
  - [ ] Calculate stats
  - [ ] Get recent activity
  - [ ] Group by category
- [ ] Add router to `src/server/api/root.ts`

---

## Phase 3: AI Integration

### 3.1 Setup AI SDK
- [ ] Create `src/server/ai/prompts.ts` for system prompts
- [ ] Create `src/server/ai/tools.ts` for tool definitions
- [ ] Create `src/server/ai/client.ts` for AI client setup

### 3.2 Implement Knowledge Tool
- [ ] Create `updateKnowledgeItem` tool in tools.ts
- [ ] Implement fuzzy matching logic for duplicate detection
- [ ] Handle create vs update logic
- [ ] Return proper response format

### 3.3 Conversation AI Handler
- [ ] Update `conversation.sendMessage` to call AI
- [ ] Build system prompt with user knowledge state
- [ ] Pass conversation history to AI
- [ ] Handle tool execution
- [ ] Save AI response with metadata

---

## Phase 4: Frontend - Chat UI

### 4.1 Chat Layout
- [ ] Create `src/app/chat/page.tsx` (main chat page)
- [ ] Create `src/app/chat/[conversationId]/page.tsx` (specific conversation)
- [ ] Add navigation to chat from home page

### 4.2 Chat Components
- [ ] Create `src/app/_components/conversation-list.tsx`
  - [ ] Fetch conversations
  - [ ] Display as sidebar
  - [ ] Highlight active conversation
  - [ ] Add "New Conversation" button
- [ ] Create `src/app/_components/message-list.tsx`
  - [ ] Fetch messages for conversation
  - [ ] Display user/AI messages with different styles
  - [ ] Auto-scroll to bottom
- [ ] Create `src/app/_components/message-input.tsx`
  - [ ] Text input field
  - [ ] Send button
  - [ ] Handle enter key
  - [ ] Optimistic UI update

### 4.3 Chat Functionality
- [ ] Wire up send message mutation
- [ ] Show loading state while AI responds
- [ ] Handle errors gracefully
- [ ] Add markdown rendering for AI messages
- [ ] Add code syntax highlighting

---

## Phase 5: Frontend - Atlas Dashboard

### 5.1 Dashboard Layout
- [ ] Create `src/app/dashboard/page.tsx`
- [ ] Add navigation to dashboard from home page

### 5.2 Dashboard Components
- [ ] Create `src/app/_components/dashboard-stats.tsx`
  - [ ] Total items card
  - [ ] Mastered count card
  - [ ] Learning count card
  - [ ] Gaps count card
  - [ ] Latent count card
- [ ] Create `src/app/_components/recent-activity.tsx`
  - [ ] Timeline view
  - [ ] Show recent status changes
- [ ] Create `src/app/_components/category-breakdown.tsx`
  - [ ] Group items by category
  - [ ] Show status distribution per category
- [ ] Create `src/app/_components/knowledge-repository.tsx`
  - [ ] List all knowledge items
  - [ ] Search bar
  - [ ] Status filter dropdown
  - [ ] Category filter dropdown
  - [ ] Display items with status indicators

### 5.3 Dashboard Functionality
- [ ] Wire up dashboard summary query
- [ ] Implement client-side search
- [ ] Implement client-side filtering
- [ ] Handle empty states

---

## Phase 6: Knowledge Item Detail

### 6.1 Detail View
- [ ] Create `src/app/_components/knowledge-detail-modal.tsx` (or separate page)
- [ ] Display item title, status, category
- [ ] Show description
- [ ] Show source conversation link
- [ ] Show created/updated dates

### 6.2 Status Update
- [ ] Add status dropdown
- [ ] Wire up `knowledge.updateStatus` mutation
- [ ] Show confirmation for status changes
- [ ] Update UI optimistically

---

## Phase 7: Polish & UX

### 7.1 Responsive Design
- [ ] Test on mobile (< 640px)
- [ ] Make conversation list a drawer on mobile
- [ ] Ensure all buttons are touch-friendly
- [ ] Test dashboard on tablet

### 7.2 Loading States
- [ ] Add skeleton loaders for dashboard
- [ ] Add loading spinner for chat
- [ ] Add typing indicator for AI

### 7.3 Error Handling
- [ ] Add error boundaries
- [ ] Add toast notifications for errors
- [ ] Add retry buttons where appropriate
- [ ] Handle network failures

### 7.4 Empty States
- [ ] Design empty state for no conversations
- [ ] Design empty state for no knowledge items
- [ ] Design empty state for no messages

---

## Phase 8: First-Time User Experience

### 8.1 Onboarding
- [ ] Create welcome modal for new users
- [ ] Auto-create first conversation on signup
- [ ] Send AI greeting message

### 8.2 Landing Page
- [ ] Update `src/app/page.tsx` with proper hero section
- [ ] Add "Get Started" CTA
- [ ] Show feature highlights

---

## Phase 9: Deployment

### 9.1 Pre-Deployment
- [ ] Ensure all environment variables are set
- [ ] Test auth flow end-to-end
- [ ] Test chat flow end-to-end
- [ ] Test dashboard flow end-to-end

### 9.2 Deploy
- [ ] Push to Git
- [ ] Deploy to Vercel
- [ ] Run database migrations on production
- [ ] Test production deployment
- [ ] Monitor for errors

---

## Optional Enhancements (Post-MVP)

### Streaming AI Responses
- [ ] Update AI integration to use `streamText` instead of `generateText`
- [ ] Update frontend to handle streaming responses
- [ ] Add streaming UI indicators

### Advanced Search
- [ ] Implement fuzzy search on knowledge items
- [ ] Add search highlighting
- [ ] Add search history

### Conversation Management
- [ ] Add conversation rename
- [ ] Add conversation delete
- [ ] Add conversation archive

### Knowledge Item Enhancements
- [ ] Allow manual knowledge item creation
- [ ] Allow editing descriptions
- [ ] Add notes field

---

## Development Tips

- **Work in order**: Complete each phase before moving to the next
- **Test as you go**: Don't wait until the end to test features
- **Commit often**: Commit after completing each major task
- **Check the spec**: Refer to `specification.md` for detailed requirements
- **Check user flows**: Refer to `user-flows.md` for UX details

---

## Estimated Timeline

- **Phase 1-3 (Backend)**: 2-3 days
- **Phase 4-6 (Frontend)**: 3-4 days
- **Phase 7-8 (Polish)**: 1-2 days
- **Phase 9 (Deploy)**: 1 day

**Total MVP: 7-10 days**

