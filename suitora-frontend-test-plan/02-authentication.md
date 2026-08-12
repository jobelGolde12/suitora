# 02 — Authentication Test Plan

**Routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`  
**Auth:** Guest-facing; authenticated users should be redirected away  
**Key libs:** Better Auth, React Hook Form, Zod (`loginSchema`, etc.), `loginAction` / auth actions  
**Components:** Auth layout, form inputs, password visibility toggle, Google OAuth button  

---

## 2.1 Login Page (`/login`)

### Structure & UI

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-001 | P0 | Functional | Logged out | Navigate to `/login` | Login form renders: email, password, Remember me (if present), Submit, link to Register, link to Forgot password |
| AUTH-002 | P1 | UI | None | View page | Branding/logo consistent; no layout overflow |
| AUTH-003 | P1 | Functional | None | Toggle password visibility (eye icon) | Password field switches between masked and visible |
| AUTH-004 | P1 | Functional | Logged in | Navigate to `/login` | Redirected to `/dashboard` (or configured post-login route) |

### Validation

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-010 | P0 | Validation | On login form | Submit empty form | Inline validation errors for required fields; no network call (or blocked) |
| AUTH-011 | P0 | Validation | On login form | Enter invalid email format | Email field shows validation error |
| AUTH-012 | P1 | Validation | On login form | Enter short/invalid password per schema | Password validation message shown |
| AUTH-013 | P1 | UX | On login form | Fix errors and re-submit | Errors clear when fields become valid |

### Success & Failure Paths

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-020 | P0 | Functional | Valid test user | Enter correct email + password → Submit | Success message; redirect to `/dashboard` within ~1s |
| AUTH-021 | P0 | Functional | Valid test user | Enter wrong password → Submit | Error message (“Invalid email or password” or similar); stay on page; password not cleared necessarily |
| AUTH-022 | P1 | Functional | None | Enter non-existent email → Submit | Same generic error (no user enumeration) |
| AUTH-023 | P1 | Error | Offline / API down | Submit valid form | Network/error toast or message; form remains usable |
| AUTH-024 | P1 | UX | During submit | Observe button state | Loading state on button; double-submit prevented |

### Google OAuth (if enabled)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-030 | P1 | Functional | Google OAuth configured | Click “Continue with Google” | Redirects to Google consent; returns and establishes session |
| AUTH-031 | P1 | UX | None | Click Google while request in flight | Button shows loading; prevents double click |
| AUTH-032 | P2 | Error | User cancels Google | Cancel on provider | Returns to login without crash; optional message |

### Navigation Links

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-040 | P1 | Functional | On login | Click “Create account” / Register link | Goes to `/register` |
| AUTH-041 | P1 | Functional | On login | Click “Forgot password” | Goes to `/forgot-password` |

---

## 2.2 Register Page (`/register`)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-050 | P0 | Functional | Logged out | Navigate to `/register` | Registration form: name (if required), email, password, confirm password, terms checkbox (if any) |
| AUTH-051 | P0 | Validation | Empty form | Submit | Required field errors |
| AUTH-052 | P0 | Validation | Mismatched passwords | Submit | Confirm password error |
| AUTH-053 | P0 | Validation | Weak password | Submit | Password strength/rules message per Zod schema |
| AUTH-054 | P0 | Functional | Unique valid data | Submit valid registration | Account created; success feedback; redirect to dashboard or onboarding |
| AUTH-055 | P1 | Functional | Existing email | Register with taken email | Clear error that email is already in use |
| AUTH-056 | P1 | Functional | Logged in | Visit `/register` | Redirect to dashboard |
| AUTH-057 | P1 | Functional | On register | Click Login link | Goes to `/login` |
| AUTH-058 | P1 | UX | During submit | Observe UI | Loading state; no double submit |

---

## 2.3 Forgot Password (`/forgot-password`)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-070 | P1 | Functional | Logged out | Open `/forgot-password` | Email input + submit |
| AUTH-071 | P1 | Validation | Empty / invalid email | Submit | Validation error |
| AUTH-072 | P1 | Functional | Valid email (existing or not) | Submit | Success message that does not reveal whether account exists; instructions to check email |
| AUTH-073 | P2 | Error | API failure | Submit | Error message; form remains usable |
| AUTH-074 | P1 | Functional | On page | Link back to Login | Goes to `/login` |

---

## 2.4 Reset Password (`/reset-password`)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-080 | P1 | Functional | Valid reset token in URL | Open reset page with token | New password + confirm fields shown |
| AUTH-081 | P1 | Validation | Mismatch / weak password | Submit | Validation errors |
| AUTH-082 | P1 | Functional | Valid token + strong password | Submit | Password updated; success; redirect to login or auto-login |
| AUTH-083 | P1 | Error | Missing / invalid / expired token | Open page | Error state explaining link is invalid or expired; CTA to request new link |
| AUTH-084 | P2 | Security UX | After successful reset | Try same token again | Token cannot be reused |

---

## 2.5 Session & Guards

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-090 | P0 | Functional | Logged out | Visit `/dashboard` | Redirected to login (middleware) |
| AUTH-091 | P0 | Functional | Logged in | Visit protected routes | Access granted |
| AUTH-092 | P1 | Functional | Logged in | Log out (from Settings or nav) | Session cleared; redirected to landing or login; protected routes no longer accessible |
| AUTH-093 | P1 | Functional | Remember me checked (if implemented) | Login → close browser → reopen | Session persists per policy |
| AUTH-094 | P2 | Functional | Session expired | Perform action requiring auth | Graceful re-auth prompt or redirect to login |

---

## 2.6 Auth Layout & Polish

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| AUTH-100 | P2 | UI | Auth pages | Compare login/register/forgot | Consistent layout, spacing, typography |
| AUTH-101 | P1 | A11y | Login form | Keyboard only | All fields and buttons reachable; errors announced |
| AUTH-102 | P1 | A11y | Password toggle | Activate with keyboard | Works; aria-label updates (Show/Hide password) |
| AUTH-103 | P2 | Responsive | Mobile | Auth forms | Inputs full-width; buttons not cut off; no horizontal scroll |
