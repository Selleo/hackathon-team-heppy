# Cognify - User Flows & Interaction Patterns

This document describes all major user journeys through the Cognify application, from onboarding to advanced features.

---

## Flow 1: First-Time User Onboarding

### Objective
Get a new user authenticated and into their first conversation.

### Steps

1. **Landing Page**
   - User visits `cognify.com`
   - Sees hero section: "Your AI-Powered Learning Companion"
   - CTA button: "Get Started"

2. **Authentication**
   - User clicks "Get Started"
   - Redirected to `/login`
   - Options:
     - Sign in with Google
     - Email + Password
   - User selects method and completes auth

3. **Welcome Screen** (First Login Only)
   - Modal overlay appears
   - Content:
     ```
     Welcome to Cognify! 👋
     
     I'm your AI learning companion. I'll help you:
     • Map what you know and don't know
     • Track your learning journey
     • Understand your knowledge state
     
     Let's start with a conversation about what you're learning!
     ```
   - Button: "Start Learning"

4. **Auto-Create First Conversation**
   - System creates conversation titled "Getting Started"
   - User lands in chat interface
   - AI sends first message:
     ```
     Hi! I'm excited to help you learn. 
     
     What are you currently studying or interested in learning about?
     ```

5. **User Responds**
   - User types: "I'm learning web development"
   - Flow continues to **Flow 2: Basic Chat Interaction**

### Technical Details
- **Endpoints Used:**
  - `POST /api/auth/login`
  - `POST /api/conversation/create`
  - `POST /api/conversation/sendMessage`
- **State Management:**
  - Auth state persisted via Better Auth session
  - First-time flag stored in user metadata

---

## Flow 2: Basic Chat Interaction

### Objective
User has a conversation with AI that discovers and maps knowledge state.

### Example Conversation

**User:** "I'm learning web development. I know HTML and CSS pretty well, but JavaScript is confusing, especially closures."

**AI Processing (Behind the Scenes):**
1. Calls `updateKnowledgeItem`:
   - Title: "HTML", Status: "Latent", Category: "Web Development"
2. Calls `updateKnowledgeItem`:
   - Title: "CSS", Status: "Latent", Category: "Web Development"
3. Calls `updateKnowledgeItem`:
   - Title: "JavaScript", Status: "Identified Gap", Category: "Web Development"
4. Calls `updateKnowledgeItem`:
   - Title: "JavaScript Closures", Status: "Identified Gap", Category: "JavaScript"

**AI Response:**
```
Great! I've noted that you're familiar with HTML and CSS. 

I can see that JavaScript, particularly closures, is an area where 
you'd like to improve. Closures can be tricky at first, but they're 
fundamental to understanding JavaScript's scope and memory model.

Let me explain: a closure is when a function "remembers" variables 
from its outer scope, even after that outer function has finished 
executing. 

Would you like me to walk through some examples?
```

**User:** "Yes, please show me an example!"

**AI Response:**
```javascript
// Here's a simple closure example:

function createCounter() {
  let count = 0;  // This variable is "closed over"
  
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// The inner function "remembers" the count variable even though
// createCounter has finished executing. That's a closure!

Does this make sense? Want to try another example?
```

### UI Elements

**Message Display:**
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, gray background
- Code blocks: Syntax highlighted

**Loading State:**
- After user sends message:
  - User message appears immediately (optimistic UI)
  - AI message area shows: "🤔 Thinking..."
  - Typing indicator animation

### Technical Details
- **Endpoints Used:**
  - `POST /api/conversation/sendMessage`
- **Real-time Updates:**
  - Message list auto-scrolls to bottom
- **Error Handling:**
  - If AI fails: Show retry button
  - If network fails: Queue message for retry

---

## Flow 3: AI Verifies Latent Knowledge

### Objective
AI probes user's claimed knowledge to verify proficiency.

### Example Conversation

**Context:** User previously said "I know HTML" (marked as Latent)

**AI (in a later conversation):**
```
By the way, you mentioned knowing HTML. Let me ask you a quick 
question to gauge your level:

What's the difference between <div> and <section> tags, and 
when would you use each?
```

**User Response A (Correct):**
```
<div> is a generic container with no semantic meaning, while 
<section> represents a thematic grouping of content. I'd use 
<section> for distinct parts of a page like "About Us" or 
"Services", and <div> for styling wrappers.
```

**AI Processing:**
- Calls `updateKnowledgeItem`:
  - Title: "HTML", Status: "Latent" → "Mastered"
- Calls `updateKnowledgeItem`:
  - Title: "HTML Semantic Elements", Status: "Mastered"

**AI Response:**
```
Excellent! You clearly understand HTML semantic elements well. 
I've updated your knowledge status to "Mastered" for HTML. 

Would you like to dive deeper into any advanced HTML topics, or 
shall we continue with JavaScript?
```

---

**User Response B (Incorrect):**
```
Hmm, I'm not really sure. Aren't they basically the same?
```

**AI Processing:**
- Calls `updateKnowledgeItem`:
  - Title: "HTML", Status: "Latent" → "Identified Gap"
- Calls `updateKnowledgeItem`:
  - Title: "HTML Semantic Elements", Status: "Identified Gap"

**AI Response:**
```
No worries! It seems there are some gaps in your HTML knowledge, 
particularly around semantic elements. This is actually really 
important for accessibility and SEO.

Let me explain the difference...
[provides explanation]

Would you like to practice identifying when to use semantic tags?
```

### Technical Details
- **AI Prompt Engineering:**
  - System prompt includes list of Latent items
  - Instruction: "Periodically verify latent knowledge through questions"
  - Frequency: Every 5-10 messages, pick one latent item
- **Status Transitions:**
  - Latent → Mastered (correct answer)
  - Latent → Identified Gap (incorrect answer)
  - Latent → Learning (user is actively studying)

---

## Flow 4: Viewing the Atlas Dashboard

### Objective
User explores their knowledge state and tracks learning progress.

### Steps

1. **Navigation**
   - User clicks "Atlas" in top navigation
   - Redirects to `/dashboard`

2. **Dashboard Loads**
   - Shows loading skeleton (cards with shimmer effect)
   - Fetches data via `dashboard.getSummary`

3. **Dashboard Displays**

   **Stats Section (Top):**
   ```
   [Card] Total Knowledge Items: 12
   [Card] Mastered: 3 (🟢)
   [Card] Learning: 2 (🟡)
   [Card] Gaps Identified: 5 (🔴)
   [Card] Latent: 2 (⚪)
   ```

   **Recent Activity Section:**
   ```
   📊 Recent Activity
   
   [Timeline]
   🟢 JavaScript Closures → Mastered
      2 hours ago in "Web Development"
   
   🟡 React Hooks → Learning
      Yesterday in "React Learning"
   
   🔴 TypeScript Generics → Identified Gap
      2 days ago in "TypeScript Study"
   
   ⚪ CSS Grid → Latent
      3 days ago in "Web Development"
   ```

   **Knowledge by Category:**
   ```
   📚 Knowledge by Category
   
   [Card] JavaScript (8 items)
   🟢 4  🟡 2  🔴 2  ⚪ 0
   
   [Card] Web Development (5 items)
   🟢 2  🟡 1  🔴 1  ⚪ 1
   
   [Card] React (4 items)
   🟢 1  🟡 2  🔴 1  ⚪ 0
   ```

   **Knowledge Repository Section:**
   ```
   📖 Knowledge Repository (12 items)
   
   [Search Bar] "Search knowledge..."
   [Filter Dropdown] All Statuses ▼
   [Category Dropdown] All Categories ▼
   
   [Grid View / List View Toggle]
   
   [List View]
   ✓ HTML                          🟢 Mastered        Web Dev
   ✓ CSS                           🟢 Mastered        Web Dev
   ✓ Git Basics                    🟢 Mastered        Tools
   ✓ JavaScript Closures           🟢 Mastered        JavaScript
   ⚡ JavaScript                    🟡 Learning        Web Dev
   ⚡ React Hooks                   🟡 Learning        React
   ✗ Async/Await                   🔴 Gap             JavaScript
   ✗ TypeScript Generics           🔴 Gap             TypeScript
   ✗ CSS Flexbox                   🔴 Gap             Web Dev
   ○ React Context API             ⚪ Latent          React
   ○ Redux                         ⚪ Latent          React
   ...
   ```

4. **User Interactions**

   **Click on Knowledge Item:**
   - Opens detail modal/page
   - Shows:
     - Title and description
     - Current status
     - Category
     - Source conversation (where it was first mentioned)
     - Date created and last updated
     - [Change Status] button

   **Search Knowledge:**
   - User types "async" in search bar
   - Real-time filtering of knowledge items
   - Shows: "Async/Await", "Asynchronous JavaScript"

   **Filter by Status:**
   - User selects "Identified Gap" from dropdown
   - List updates to show only gap items
   - Count updates: "5 items"

   **Filter by Category:**
   - User selects "JavaScript" from category dropdown
   - Shows only JavaScript-related items
   - Can combine with status filter

### Technical Details
- **Endpoints Used:**
  - `GET /api/dashboard/getSummary`
  - `GET /api/knowledge/list` (with filters)
- **Performance:**
  - Initial data loaded server-side (Next.js SSR)
  - Filters applied client-side (no refetch)
  - Search debounced (300ms)

---

## Flow 5: Manual Knowledge Status Update

### Objective
User manually changes a knowledge item's status.

### Steps

1. **From Dashboard**
   - User clicks on "React Hooks" (currently "Learning")
   - Detail modal opens

2. **Detail View**
   ```
   React Hooks 🟡
   
   Status: Learning
   Category: React
   
   Description:
   React Hooks allow you to use state and other React features 
   without writing a class. Common hooks include useState, 
   useEffect, useContext, and useReducer.
   
   First Mentioned:
   In "React Learning" conversation, 2 days ago
   
   Last Updated: Yesterday
   
   [Change Status ▼] [View Conversation]
   ```

3. **Update Status**
   - User clicks "Change Status" dropdown
   - Options: Latent, Identified Gap, Learning, Mastered
   - User selects "Mastered"
   - Confirmation modal:
     ```
     Update Status?
     
     Change "React Hooks" from Learning to Mastered?
     
     [Cancel] [Confirm]
     ```
   - User clicks "Confirm"

4. **Status Updated**
   - Modal closes
   - Dashboard refreshes
   - Toast notification: "✓ React Hooks marked as Mastered!"
   - Stats update: Learning (2→1), Mastered (3→4)

### Technical Details
- **Endpoints Used:**
  - `PATCH /api/knowledge/updateStatus`
- **Optimistic Updates:**
  - UI updates immediately
  - Revert on error
- **Validation:**
  - Ensure valid status transition
  - User must confirm significant changes

---

## Flow 6: Creating Multiple Conversations

### Objective
User organizes learning by topic using separate conversations.

### Steps

1. **Create New Conversation**
   - User in chat view
   - Clicks "+" button in conversation list sidebar
   - Modal appears:
     ```Mastered
     New Conversation
     
     [Input] Title: "Python Learning"
     
     [Cancel] [Create]
     ```
   - User enters title and clicks "Create"

2. **Conversation Created**
   - New conversation appears in sidebar
   - Automatically selected (active)
   - Empty message area
   - AI sends greeting:
     ```
     Welcome to your new conversation! What would you like to 
     learn about today?
     ```

3. **Switching Conversations**
   - User clicks different conversation in sidebar
   - Message area loads that conversation's history
   - AI context switches (knows different knowledge items)

4. **Conversation List Organization**
   ```
   Conversations
   
   [+] New
   
   🌐 Web Development (12 messages)
       Last: "Great! Let's start with..."
       2 hours ago
   
   🐍 Python Learning (5 messages)
       Last: "Functions in Python..."
       1 day ago
   
   🎨 Design Principles (8 messages)
       Last: "Color theory is important..."
       3 days ago
   ```

### Technical Details
- **Endpoints Used:**
  - `POST /api/conversation/create`
  - `GET /api/conversation/list`
  - `GET /api/conversation/getHistory`
- **State Management:**
  - Active conversation ID in URL: `/chat/[conversationId]`
  - Sidebar persists across navigation

---

## Flow 7: Search and Filter Knowledge

### Objective
User finds specific knowledge items quickly.

### Steps

1. **Navigate to Dashboard**
   - User on `/dashboard`
   - Scrolls to "Knowledge Repository" section

2. **Search by Text**
   - User types "react" in search bar
   - Results filter in real-time:
     ```
     📖 Knowledge Repository (4 results)
     
     ⚡ React Hooks               🟡 Learning
     ○ React Context API          ⚪ Latent
     ✗ React Performance          🔴 Gap
     ✓ React Basics               🟢 Mastered
     ```

3. **Filter by Status**
   - User clicks "All Statuses" dropdown
   - Selects "Identified Gap"
   - List updates to show only red items:
     ```
     📖 Knowledge Repository (5 results)
     
     ✗ JavaScript Closures        🔴 Gap
     ✗ Async/Await                🔴 Gap
     ✗ TypeScript Generics        🔴 Gap
     ✗ React Performance          🔴 Gap
     ✗ CSS Grid                   🔴 Gap
     ```

4. **Filter by Category**
   - User clicks "All Categories" dropdown
   - Sees categories: "JavaScript", "React", "CSS", "Python"
   - Selects "JavaScript"
   - Combined filters (Gap + JavaScript):
     ```
     📖 Knowledge Repository (2 results)
     
     ✗ JavaScript Closures        🔴 Gap
     ✗ Async/Await                🔴 Gap
     ```

5. **Clear Filters**
   - User clicks "Clear Filters" button
   - All items shown again
   - Search bar and dropdowns reset

### Technical Details
- **Endpoints Used:**
  - `GET /api/knowledge/list` (with query params)
- **Client-Side Filtering:**
  - All items loaded initially
  - Filters applied in React state
  - No network requests for filter changes
- **Search Algorithm:**
  - Fuzzy matching on title
  - Exact match prioritized
  - Partial match secondary

---

## Flow 8: Mobile Experience

### Objective
User accesses Cognify on mobile device.

### Responsive Adaptations

**Chat View:**
- Conversation sidebar becomes bottom sheet (swipe up)
- Message input fixed at bottom
- Full-screen chat area
- Tap outside to dismiss sidebar

**Dashboard:**
- Stats cards: 2x2 grid → 1 column
- Category cards: Full width
- Knowledge repository: Compact list view
- Filters in collapsible accordion

**Knowledge Detail:**
- Full-screen modal
- Scroll to see all content
- Large touch targets for buttons

### Technical Details
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Touch Interactions:**
  - Swipe to dismiss modals
  - Pull to refresh conversation list

---

## Flow 9: Error Handling & Edge Cases

### Scenario 1: AI Service Unavailable

**User Action:** Sends message in chat

**System Response:**
```
[Error Message Component]
⚠️ Oops! I'm having trouble connecting right now.

Your message has been saved and I'll respond as soon as I'm back online.

[Retry Now] [Continue Anyway]
```

**Technical:**
- Message saved to database
- Background job retries AI call
- User notified when response ready (future: push notification)

---

### Scenario 2: Duplicate Knowledge Item

**User:** "I want to learn about JavaScript closures"

**AI Processing:**
- Attempts to create "JavaScript Closures"
- Fuzzy match finds existing "JS Closures"
- Updates existing item instead

**AI Response:**
```
I see we've already discussed JavaScript closures before. You 
currently have it marked as "Learning" status.

Based on our conversation, would you like me to assess your 
current understanding with a few questions?
```

---

### Scenario 3: Network Failure

**User Action:** Sends message in chat

**System Response:**
- Message appears in chat (optimistic update)
- Network request fails
- Message marked with warning icon
- Toast notification:
  ```
  ⚠️ Message failed to send
  [Retry] [Dismiss]
  ```

---

### Scenario 4: Empty States

**New User Dashboard:**
```
📖 Knowledge Repository (0 items)

You haven't started any conversations yet!

Start chatting with me to build your knowledge graph.

[Start First Conversation]
```

**No Knowledge in Category:**
```
📚 JavaScript (0 items)

No JavaScript knowledge items yet.

Start a conversation about JavaScript to begin tracking!
```

---

## Summary of Key User Journeys

1. **Onboarding** → First conversation → Knowledge discovery
2. **Learning** → Chat interaction → Knowledge mapping
3. **Verification** → AI probing → Status updates
4. **Tracking** → Dashboard view → Progress monitoring
5. **Manual Updates** → Status changes → User control
6. **Organizing** → Multiple conversations → Topic separation
7. **Discovery** → Search/filter → Finding specific knowledge
8. **Mobile** → Responsive design → On-the-go learning
9. **Errors** → Graceful handling → User confidence

---

## User Experience Principles

### 1. Conversational First
- Natural language interaction
- No complex forms or menus
- AI guides the experience

### 2. Immediate Feedback
- Optimistic UI updates
- Loading states with context
- Clear error messages

### 3. Progressive Disclosure
- Simple initial interface
- Advanced features revealed as needed
- No overwhelming options

### 4. Transparent AI
- Show what AI is doing (tool calls in metadata)
- Explain status changes
- Allow user to override AI decisions

### 5. Motivating Progress
- Visual progress indicators
- Celebration of milestones
- Encouraging language

---

## Accessibility Considerations

### Screen Readers
- Semantic HTML throughout
- ARIA labels on interactive elements
- Status announcements for dynamic content

### Keyboard Navigation
- Tab order follows visual flow
- Keyboard shortcuts for common actions
- Focus indicators visible

### Visual Accessibility
- High contrast mode support
- Status indicators use color + icon
- Readable font sizes (16px minimum)

### Cognitive Accessibility
- Clear, simple language
- Consistent UI patterns
- Undo/redo for important actions

---

## Analytics & Tracking

### User Events to Track

**Engagement:**
- `conversation_created`
- `message_sent`
- `dashboard_viewed`

**Learning:**
- `knowledge_item_created`
- `status_changed` (with from/to states)
- `latent_verified`
- `gap_identified`
- `manual_status_update`

**Navigation:**
- `search_used`
- `filter_applied`
- `category_viewed`

**Conversion:**
- `user_signed_up`
- `first_conversation`
- `first_knowledge_item`

### Metrics to Monitor

**Engagement:**
- DAU / MAU ratio
- Average session duration
- Messages per session
- Conversation retention

**Learning:**
- Knowledge items per user
- Status distribution (% in each status)
- Time to mastery (Gap → Mastered)
- Verification rate (Latent → verified)

**Product:**
- Feature adoption rates
- Error rates by endpoint
- AI response time
- User satisfaction (NPS surveys)
