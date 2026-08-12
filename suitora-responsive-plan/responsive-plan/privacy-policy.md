# Responsive Plan: Privacy Policy (`/privacy-policy`)

**Route:** `app/(legal)/privacy-policy/page.tsx`  
**Shell:** [layout-legal.md](layout-legal.md)

---

## 1. Goals

- Long legal text is readable with comfortable line length on all devices.
- Headings and lists align to a single left edge.
- Navigation back to app is easy on mobile.

---

## 2. Element-by-Element Alignment

### 2.1 Container
- `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12`.

### 2.2 Title block
- H1 + last updated date; left-aligned with body.
- Optional print / back controls above, same edge.

### 2.3 Body
- Paragraphs, lists, and subheadings share left margin 0 within the container (no accidental nested indent from CMS HTML).
- Lists: consistent `padding-left`.
- Links: wrap; underline visible on mobile.

### 2.4 Table of contents (if added)
- Mobile: collapsible block at top.
- Desktop: inline at top (avoid competing sticky TOC unless `xl` and tested).

---

## 3. Testing Checklist

- [ ] 320px: no horizontal scroll; long URLs break
- [ ] 768–1280: measure ~65–75 characters
- [ ] Heading hierarchy visually clear when scrolling

---

## 4. Implementation Tasks

1. [ ] Apply legal layout container.
2. [ ] Normalize prose styles (or typography plugin).
3. [ ] `overflow-wrap: anywhere` for long tokens if needed.
4. [ ] Footer / back link spacing above home indicator.

---

## 5. Risks

- Pasted HTML with inline styles → sanitize and strip fixed widths.
