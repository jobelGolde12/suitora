# Feature Plan: AI Stylist Chatbot

## 1. Feature Overview

- **Name:** AI Stylist Chatbot
- **Current Status:** Fully functional (OpenAI chat + rule-based fallback)
- **Primary Goal:** Provide conversational, context-aware fashion advice that leverages the user’s body attributes, analysis history, wardrobe, and current season.
- **Key Stakeholders:** End-users, product, AI owners.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated `/stylist` page with `StylistChat` component.
- Context object includes body shape, skin tone, style tags, scores, wardrobe stats, season.
- Messages persisted in `stylistMessages` table.
- Graceful fallback when OpenAI is unavailable.
- Chip suggestions for common intents (`stylist-chips.ts`).

### Pain Points & Bugs
- Context window and token cost grow with long conversations.
- Advice quality depends on prompt and available user data (new users get thinner context).
- Limited tool use (e.g., cannot yet directly trigger a new analysis or open a product).

### Missing Functionality
- Tool calling: “Analyze this URL”, “Add to wardrobe”, “Show me similar trending items”.
- Proactive suggestions based on season or low-scoring categories.
- Conversation branching / “start over” with preserved context summary.

### Dependencies
- OpenAI (or compatible) chat API.
- User profile, analyses, wardrobe aggregates.
- Stylist messages persistence.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Function/tool calling for core actions (analyze URL, open trending, add to wardrobe).
- **High:** Context summarization for long threads to control cost.
- **Medium:** Proactive seasonal or gap-based prompts.
- **Medium:** Voice input (future mobile).
- **Low:** Multi-turn outfit planning mode.

### Required Fixes & Adjustments
- Cap message history sent to the model; store full history server-side.
- Clear indication when fallback (non-LLM) mode is active.
- Safety filters for inappropriate requests.

### Refactoring & Technical Debt
- Keep system prompt and context builder versioned.
- Isolate provider so swapping models is easy.
- Expand tests around context building and chip intents.

### KPIs for Success
- Stylist session engagement (messages per session).
- % of sessions that lead to an analysis or wardrobe action.
- User satisfaction rating on advice.

## 4. Actionable Roadmap

### Phase 1 – Cost & Quality (1–2 weeks)
- [ ] Context summarization + history windowing (Medium)
- [ ] Explicit fallback indicator (Small)
- [ ] Safety / topic filters (Medium)

### Phase 2 – Agency (2–3 weeks)
- [ ] Tool calling for analyze / wardrobe / trending (Large)
- [ ] Proactive suggestion chips based on data gaps (Medium)

### Phase 3 – Depth (later)
- [ ] Multi-turn outfit planning mode (Large)
- [ ] Voice (future)

### Potential Risks & Mitigation
- **Risk:** Hallucinated product claims or unsafe advice.  
  **Mitigation:** Ground answers in user data; refuse medical/body-shaming topics; cite scores when possible.
- **Risk:** Token cost.  
  **Mitigation:** Summarization, caching of common answers, rate limits per user.
