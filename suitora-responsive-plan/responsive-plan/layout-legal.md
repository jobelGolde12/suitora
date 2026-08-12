# Responsive Plan: Legal Layout

**Scope:** `app/(legal)/layout.tsx` — Privacy Policy and future Terms pages

---

## 1. Goals

- Long-form legal text remains readable on small screens.
- Headings, lists, and paragraphs share a clear vertical rhythm and left alignment.
- No ultra-wide lines on desktop (measure constrained).

---

## 2. Breakpoint Strategy

| Range | Behavior |
|-------|----------|
| All | Single column prose |
| `< md` | `px-4`, slightly smaller headings |
| `≥ md` | `px-6`, `max-w-3xl` centered |
| `≥ lg` | `px-8`, comfortable line length (~65–75 characters) |

---

## 3. Element-by-Element Alignment

### 3.1 Page header
- Title: `text-2xl sm:text-3xl font-semibold`.
- Last-updated line: `text-sm text-muted`, directly under title, left-aligned with title.
- Optional back link above title, same left edge.

### 3.2 Prose body
- Container: `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12`.
- Paragraphs: `text-sm sm:text-base leading-relaxed`.
- Headings (h2/h3): consistent left alignment with paragraphs; spacing `mt-8 mb-3` (h2), `mt-6 mb-2` (h3).
- Lists: `pl-5` or design-token indent; markers aligned; nested lists further indented consistently.
- Links: underline or color; wrap without overflow.

### 3.3 Table of contents (if present)
- Mobile: collapsible at top, full width.
- Desktop: optional sticky side nav **only if** viewport is wide enough (`xl+`); otherwise keep inline at top so main column stays centered and aligned.

---

## 4. Testing Matrix

- 320px: no horizontal scroll; long words break with `break-words` where needed.
- 1280px: line length constrained; page does not look like a thin strip lost in whitespace (use reasonable vertical padding and optional subtle max width).

---

## 5. Implementation Tasks

1. [ ] Prose container with max-width and shared padding.
2. [ ] Typography classes for legal content (or `@tailwindcss/typography` with overrides).
3. [ ] Ensure code/email strings can wrap.

---

## 6. Risks

- Copy-pasted HTML with fixed widths → strip or override.
- Tables in policy text → convert to stacked definition lists on mobile if any appear.
