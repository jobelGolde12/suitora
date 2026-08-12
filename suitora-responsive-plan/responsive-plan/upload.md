# Responsive Plan: Upload / New Analysis (`/upload`)

**Route:** `app/(dashboard)/upload/page.tsx`  
**Components:** `components/upload/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Self-image and product image (or URL) flows work with thumbs only.
- Drag-and-drop zones remain large enough on mobile (tap-to-upload fallback always available).
- Mode switch (upload vs link) and previews stay aligned and never overflow.

---

## 2. Page Structure

1. Page header  
2. Self-image section (preview / upload / change)  
3. Product input mode toggle (Upload image | Paste link)  
4. Product dropzone **or** URL field  
5. Primary “Analyze” CTA  
6. Helper notes / requirements  

---

## 3. Element-by-Element Alignment

### 3.1 Page header
- Same responsive header pattern as dashboard (`flex-col` → `sm:flex-row`).

### 3.2 Self-image block
| Element | Mobile | Desktop |
|---------|--------|---------|
| Preview | Square or 3:4, max width full column, centered | Same, optionally max-w-xs |
| Change / Upload button | Below preview, full width or centered | Adjacent or below |
| Modal (SelfImageModal) | Full-screen sheet on mobile; centered dialog `md+` | See modals rules |

**Alignment**
- Preview image `object-cover` inside a fixed aspect box so layout does not jump when image loads.
- Buttons under preview share the preview’s max width when centered.

### 3.3 Mode toggle (Upload | Link)
- Segmented control full width on mobile; equal segment widths.
- Active segment clearly indicated; min-height 40–44px.
- Toggle aligns to content left edge (not free-floating).

### 3.4 Product image dropzone
- Full width of content column.
- Min-height ~160–200px on mobile so it is an easy tap target.
- Icon + instructions centered inside zone.
- File type / size hints below zone, left-aligned with content.
- After file selected: preview image constrained; remove (X) button top-right of preview with 44px hit area (padding if icon is small).

### 3.5 Product URL mode
- URL input full width; `text-base`.
- Optional “Fetch” button:  
  - Mobile: full width below input  
  - `sm+`: inline to the right of input (`flex-col sm:flex-row gap-2`)
- Extracted product preview card: image + title + price; image fixed size; text truncates; card full width.

### 3.6 Analyze CTA
- Sticky bottom bar on mobile **or** inline at end of form.
- If sticky: full width button with safe-area padding; does not cover critical fields (add bottom padding to scroll area).
- Desktop: primary button right-aligned or full width of form column — pick one and keep consistent with other forms.

### 3.7 Progress / analyzing state
- Full-width progress or centered status card.
- Steps (upload → analyze → try-on) stack vertically on mobile; horizontal stepper on `md+` if used.
- Step labels must not overflow; allow wrap or shorten on mobile.

---

## 4. Modal: Self Image

| Viewport | Presentation |
|----------|----------------|
| `< md` | Full screen or bottom sheet (rounded top), drag handle optional |
| `≥ md` | Centered modal `max-w-lg`, max-height with internal scroll |

- Internal dropzone and actions follow same alignment as page dropzone.
- Close control top-right, 44px target.

---

## 5. Testing Checklist

- [ ] 320px: both dropzones usable; mode toggle equal segments
- [ ] URL + Fetch stack cleanly
- [ ] Preview images never exceed container
- [ ] Sticky CTA does not hide fields on small phones
- [ ] Modal focus trap + scroll on iOS
- [ ] Landscape: form still scrollable

---

## 6. Implementation Tasks

1. [ ] Responsive mode toggle.
2. [ ] Dropzone min-height and padding tokens.
3. [ ] URL field + button responsive flex.
4. [ ] Self-image modal mobile sheet variant.
5. [ ] Analyze CTA sticky vs inline decision implemented with scroll padding.
6. [ ] Aspect-ratio boxes for all previews.

---

## 7. Risks

- Sticky CTA + mobile browser chrome → use `pb-safe` and test iOS/Android.
- Very tall previews pushing CTA off-screen → max-height on previews with internal crop.
