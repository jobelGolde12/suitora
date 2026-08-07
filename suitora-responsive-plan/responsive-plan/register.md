# Responsive Plan: Register (`/register`)

**Route:** `app/(auth)/register/page.tsx`  
**Shell:** [layout-auth.md](layout-auth.md)

---

## 1. Goals

- Multi-field registration remains scannable and usable on narrow screens.
- Validation messages align under the correct fields without shifting the whole form chaotically.
- Legal consent (terms/privacy) is readable and tappable.

---

## 2. Element-by-Element Alignment

### Form field order (typical)
1. Name  
2. Email  
3. Password  
4. Confirm password (if used)  
5. Terms checkbox  
6. Submit  

### Rules
| Element | Alignment |
|---------|-----------|
| All text inputs | Full width of card content; labels above; consistent `gap` between groups |
| Password fields | Same as login — visibility toggle vertically centered in the field |
| Terms row | Checkbox top-aligned with multi-line label text; label wraps within remaining width; link styles do not overflow |
| Submit | Full width, min-height 44px |
| “Already have an account?” | Centered under card; touch-friendly |

### Validation
- Per-field errors under inputs, left-aligned with value text.
- Password strength meter (if any): full width of input, directly under password field; does not extend outside card.

---

## 3. Breakpoints

- Same as login: single column form, `max-w-md` on larger screens.
- On very short viewports (landscape phone), ensure the form can scroll within the page — do not trap focus in a non-scrollable card.

---

## 4. Testing Checklist

- [ ] 320px: terms text wraps; checkbox still hittable
- [ ] Long name/email values do not overflow the input box
- [ ] Confirm-password mismatch error does not push submit off-screen without scroll
- [ ] Keyboard + autocomplete flows on mobile Safari/Chrome

---

## 5. Implementation Tasks

1. [ ] Reuse AuthFormField + password toggle from login.
2. [ ] Terms row layout with `items-start` and flexible label.
3. [ ] Prevent layout jump when errors appear (reserve space or accept small shift consistently).

---

## 6. Risks

- Too many fields on one screen → consider progressive disclosure only if product requires; otherwise keep single page with good spacing.
