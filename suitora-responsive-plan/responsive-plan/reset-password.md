# Responsive Plan: Reset Password (`/reset-password`)

**Route:** `app/(auth)/reset-password/page.tsx`  
**Shell:** [layout-auth.md](layout-auth.md)

---

## 1. Goals

- New password + confirm fields usable on mobile with visibility toggles.
- Invalid/expired token state is clear and aligned like other auth errors.

---

## 2. Element-by-Element Alignment

| Element | Rules |
|---------|--------|
| Title / subtitle | Centered |
| New password | Full width; visibility toggle centered vertically |
| Confirm password | Same |
| Strength meter | Full width under new password |
| Submit | Full width, min-height 44px |
| Invalid token view | Icon + message + link to forgot-password; same max-width card |

### Errors
- Mismatch / policy errors under the relevant field.
- Token errors as full-width alert at top of card.

---

## 3. Testing Checklist

- [ ] Both toggles tappable without overlapping text
- [ ] 320px: no overflow
- [ ] Success redirect or success message centered

---

## 4. Implementation Tasks

1. [ ] Reuse password field component.
2. [ ] Align invalid-token empty state with global error patterns.
3. [ ] Stable layout when validation errors appear.

---

## 5. Risks

- Token in URL makes page long to share — UI only; no responsive impact beyond normal.
