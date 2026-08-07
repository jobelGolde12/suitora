# Responsive Plan: AI Stylist (`/stylist`)

**Route:** `app/(dashboard)/stylist/page.tsx`  
**Components:** `components/stylist/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Chat interface feels native on mobile: messages readable, composer always reachable, chips tappable.
- Long messages wrap cleanly; code-like product names do not overflow.
- Header and chat share the content width grid.

---

## 2. Page Structure

1. Page header (title, description)  
2. Message list (scrollable)  
3. Suggestion chips  
4. Composer (input + send)  

---

## 3. Element-by-Element Alignment

### 3.1 Header
- Standard; keep description short on mobile or collapsible.

### 3.2 Message list
- Container: flex-1, `overflow-y-auto`, horizontal padding matching page (`px-4` etc.).
- Bubbles:
  - User: right-aligned, `max-w-[85%]` or `max-w-prose`.
  - Assistant: left-aligned, same max width.
  - Padding inside bubble consistent; text `text-sm sm:text-base`.
- Timestamps / meta: smaller text, aligned to bubble edge.
- Avoid full-viewport width bubbles on desktop — keep max width so lines stay readable.

### 3.3 Suggestion chips
- Horizontal scroll on one row **or** wrap.
- Chip min-height ~36–40px; padding comfortable.
- Placed above composer; same horizontal inset as messages.

### 3.4 Composer
| Viewport | Behavior |
|----------|----------|
| Mobile | Sticky bottom of content area (or viewport inside shell), safe-area padding |
| Desktop | Sticky or static at bottom of chat panel |

- Input: grows with content up to max rows; `text-base` to prevent iOS zoom.
- Send button: 44×44, vertically aligned with input.
- Layout: `flex items-end gap-2`; input `flex-1`.

### 3.5 Narrow page option
- Stylist often uses `narrow` PageContainer (`max-w-3xl`) — ensure this is centered and padding still applies so it does not stick to the sidebar edge awkwardly.

---

## 4. Testing Checklist

- [ ] 320px: bubbles max-width work; composer not covered by nav
- [ ] Keyboard open on iOS: message list resizes / scrolls to latest
- [ ] Chips scroll without widening page
- [ ] 1280: narrow column centered; readable line length
- [ ] Long unbroken strings break with `break-words`

---

## 5. Implementation Tasks

1. [ ] Chat column max-width + padding.
2. [ ] Bubble max-width rules.
3. [ ] Sticky composer with safe-area.
4. [ ] Chip row overflow handling.
5. [ ] Keyboard/viewport interaction testing on real devices.

---

## 6. Risks

- Mobile browser chrome + sticky composer + dashboard sticky header → carefully compute available height (`dvh` and flex layout).
- Auto-scroll to latest message fighting user scroll-up → only auto-scroll when user is near bottom.
