# 11 — AI Stylist Test Plan

**Route:** `/stylist`  
**Auth:** Required  
**Component:** `StylistChat`  
**Features:** Chat UI, suggested chips, streaming/response display, conversation continuity  

---

## 11.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-001 | P0 | Functional | Logged in | Open `/stylist` | Chat interface loads with input and optional starter chips |
| STY-002 | P0 | Functional | Logged out | Open `/stylist` | Redirect to login |
| STY-003 | P1 | UI | First visit | Empty conversation | Welcome / prompt message from stylist |

---

## 11.2 Sending Messages

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-010 | P0 | Functional | Open chat | Type question → Send | User message appears; loading indicator; assistant reply appears |
| STY-011 | P0 | Validation | Empty message | Send | Blocked; no empty bubble |
| STY-012 | P1 | Functional | Long message | Send | Handled (truncate or accept per limits) |
| STY-013 | P1 | UX | While waiting | Observe | Input disabled or send prevented; spinner on assistant side |
| STY-014 | P1 | Error | API `/api/stylist` fails | Send message | Error message in thread or toast; user can retry |
| STY-015 | P1 | Functional | Multiple turns | Ask follow-ups | Context retained within session as designed |

---

## 11.3 Starter Chips / Suggestions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-020 | P1 | Functional | Chips visible | Click a chip | Message sent with chip text; response returned |
| STY-021 | P2 | UI | After first message | Chips | May hide or update to contextual suggestions |

---

## 11.4 Content Quality Smoke (Front-end)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-030 | P1 | Functional | Ask style advice | “What goes with a black blazer?” | Coherent fashion response rendered (markdown/plain handled) |
| STY-031 | P2 | Functional | Ask off-topic | Irrelevant question | Graceful refusal or redirect to fashion topics |
| STY-032 | P2 | UI | Response with lists/links | Render | Formatting readable; links safe (noopener if external) |

---

## 11.5 History & Session UX

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-040 | P2 | Functional | Scroll long thread | Scroll | Stick to bottom on new messages; can scroll up |
| STY-041 | P2 | Functional | Leave and return | Navigate away → back | Thread restored or fresh per product decision (document actual behavior) |
| STY-042 | P2 | Functional | Clear chat (if control) | Clear | Thread resets |

---

## 11.6 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| STY-050 | P1 | Responsive | Mobile | Chat | Input above bottom nav / safe area; messages readable |
| STY-051 | P1 | A11y | Chat | Keyboard | Input focusable; Send via Enter; messages in accessible live region if implemented |
| STY-052 | P2 | A11y | Chips | Keyboard | Chips focusable and activatable |
