# Responsive Plan: Forgot Password (`/forgot-password`)

**Route:** `app/(auth)/forgot-password/page.tsx`  
**Shell:** [layout-auth.md](layout-auth.md)

---

## 1. Goals

- Minimal form (email only) feels balanced, not sparse or cramped.
- Success state (check your email) is equally well aligned on all devices.

---

## 2. Element-by-Element Alignment

### Request state
| Element | Rules |
|---------|--------|
| Title + description | Centered; description `max-w-sm` so lines stay short |
| Email field | Full width of card |
| Submit | Full width, 44px min height |
| Back to login | Centered link under card |

### Success state
- Icon centered.
- Message centered, readable measure.
- Optional “Open email app” / “Resend” buttons: full width on mobile, stacked with consistent gap.
- Same card max-width as request state so transition does not reflow page edges.

---

## 3. Testing Checklist

- [ ] 320–414: single field + button comfortable
- [ ] Success message wraps cleanly
- [ ] No horizontal overflow from long email addresses in confirmation text (break-all if shown)

---

## 4. Implementation Tasks

1. [ ] Shared card width with login/register.
2. [ ] Success view uses same padding and alignment tokens.
3. [ ] Resend control has loading state without size change.

---

## 5. Risks

- Showing the full email in success text on tiny screens → allow break or mask middle.
