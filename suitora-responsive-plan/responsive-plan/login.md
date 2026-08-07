# Responsive Plan: Login (`/login`)

**Route:** `app/(auth)/login/page.tsx`  
**Shell:** [layout-auth.md](layout-auth.md)

---

## 1. Goals

- Email/password form completes without horizontal scroll or accidental zoom.
- Errors and loading states do not break alignment.
- Links to Register / Forgot password are easy to hit.

---

## 2. Element-by-Element Alignment

### Page structure
1. Logo (centered)
2. Heading “Welcome back” + short subtitle (centered)
3. Form card
4. Footer links

### Form fields (in order)
| Field | Layout rules |
|-------|----------------|
| Email | Full width of card; label above; `text-base` input |
| Password | Full width; show/hide toggle **inside** input on the right, vertically centered; toggle ≥ 44×44 hit area |
| Remember me (if any) | Checkbox + label on one row; adequate gap; min touch height |
| Submit | Full width, min-h-11 / 44px |
| Forgot password link | Below submit or beside Remember; `text-sm`; padding for touch |
| “Create account” | Below card or inside card footer; centered; clear separation |

### Error & status
- Field errors: directly under the field, left-aligned with input text, `text-sm`.
- Form-level error (invalid credentials): banner above fields, full card width, icon + text aligned horizontally.
- Loading: submit button shows spinner centered; button keeps same width/height to avoid layout shift.

### OAuth (if present)
- Full-width buttons stacked with equal height.
- Divider “or” centered with horizontal rules that do not overflow (`flex items-center gap-3`).

---

## 3. Breakpoints

| Width | Behavior |
|-------|----------|
| `< sm` | Card nearly full width with `px-4` page inset |
| `≥ sm` | Card `max-w-md`, more internal padding |
| `≥ lg` | Optional split brand panel (see auth layout) |

---

## 4. Testing Checklist

- [ ] 320px: password toggle tappable; no overflow
- [ ] iOS: focus email does not zoom (font-size ≥ 16px)
- [ ] Keyboard open: submit still reachable (no fixed obstructing footer)
- [ ] Long error messages wrap inside card
- [ ] Autofill does not break padding

---

## 5. Implementation Tasks

1. [ ] Shared AuthFormField component.
2. [ ] Password visibility control with accessible label.
3. [ ] Stable button size for loading state.
4. [ ] Align all links to the same horizontal center or start edge consistently.

---

## 6. Risks

- Third-party OAuth button iframes with fixed widths → constrain container.
