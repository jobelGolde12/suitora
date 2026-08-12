# Responsive Plan: Auth Layout

**Scope:** `app/(auth)/layout.tsx` — wraps `/login`, `/register`, `/forgot-password`, `/reset-password`

---

## 1. Goals

- Forms remain fully usable on narrow phones without zooming.
- Branding and form share a calm, centered layout that does not feel empty on large screens or cramped on small ones.
- No element overflows; inputs and buttons are full-width on mobile and constrained on desktop.

---

## 2. Breakpoint Strategy

| Range | Layout |
|-------|--------|
| `< md` | Single column, full-bleed background optional; form card with `px-4` page padding |
| `≥ md` | Centered card (`max-w-md` or `max-w-lg`), more vertical whitespace, optional split marketing panel on `lg+` |
| `≥ lg` (optional) | Two-column: left brand/illustration, right form — only if design includes it |

---

## 3. Element-by-Element Alignment

### 3.1 Page container
- `min-h-dvh flex flex-col justify-center` (or `items-center` with vertical padding).
- Horizontal: `px-4 sm:px-6`.
- Vertical: `py-8 sm:py-12` so content is never flush against notch or home indicator.

### 3.2 Brand / logo block
- Centered above form on all sizes.
- Logo height: `h-8 sm:h-10`; wordmark scales with it.
- Spacing below logo → form: `mb-6 sm:mb-8` (consistent).

### 3.3 Form card
| Property | Mobile | Desktop |
|----------|--------|---------|
| Width | `w-full` | `w-full max-w-md` |
| Padding | `p-5 sm:p-8` | Same |
| Radius / border | Design tokens | Same |
| Shadow | Optional softer on mobile | Slightly stronger |

**Internal form alignment**
- All fields: full width of card content box.
- Label above input (never side-by-side on mobile).
- Label → input gap: `gap-1.5` or `space-y-1.5`.
- Field → field gap: `space-y-4` or `space-y-5`.
- Error text: under input, left-aligned with input text (not centered).
- Primary button: full width of form, min-height 44px.
- Secondary links (“Forgot password?”, “Create account”): centered or left-aligned consistently; min touch height 44px.

### 3.4 Footer links (Terms / Privacy)
- Below card, centered, `text-sm`, adequate padding so they are not against the bottom edge.
- Wrap gracefully; never force one long line that overflows.

### 3.5 Optional split layout (`lg+`)
- Left panel: brand message / illustration, vertical center.
- Right panel: form card, vertical center.
- Both panels share the same vertical centerline; horizontal divider or gap is even.
- On `< lg`, collapse to form-only (hide or stack illustration above).

---

## 4. Typography

- Page heading: `text-2xl sm:text-3xl font-semibold text-center` (or left if split).
- Supporting text: `text-sm sm:text-base text-muted text-center`.
- Input text: ≥ 16px to avoid iOS zoom on focus (`text-base`).

---

## 5. Testing Matrix

| Width | Checks |
|-------|--------|
| 320 | Form usable; no overflow; button full width; errors readable |
| 375–414 | Comfortable padding; logo + form balanced |
| 768 | Card centered; max-width enforced |
| 1024+ | Optional split aligned; form not stretched beyond max-w |

---

## 6. Implementation Tasks

1. [ ] Shared Auth layout with centered flex container and safe padding.
2. [ ] Shared form field component (label, input, error) used by all auth pages.
3. [ ] Enforce `text-base` on inputs.
4. [ ] Full-width primary buttons on mobile; keep full-width on desktop for consistency in auth.
5. [ ] Test keyboard open on mobile (ensure focused field remains visible — avoid fixed footers covering inputs).

---

## 7. Risks

- Fixed bottom CTAs covering the virtual keyboard → avoid fixed footers on auth forms.
- Autofill styles breaking padding → test Chrome/Safari autofill.
