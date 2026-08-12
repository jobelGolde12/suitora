# 12 — Settings Test Plan

**Route:** `/settings`  
**Auth:** Required  
**Components:** `ProfileForm`, password/appearance/preferences sections, self-image management  
**APIs:** `/api/user/profile`, `/api/user/self-image`, password change via auth  

---

## 12.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-001 | P0 | Functional | Logged in | Open `/settings` | Settings sections render (Profile, Security, Appearance, Preferences, etc.) |
| SET-002 | P0 | Functional | Logged out | Open `/settings` | Redirect to login |
| SET-003 | P1 | UI | Load | Form populated with current user data |

---

## 12.2 Profile Form

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-010 | P0 | Functional | Valid changes | Edit name / display fields → Save | Success toast; data persists on reload |
| SET-011 | P1 | Validation | Invalid field values | Save | Inline Zod/schema errors |
| SET-012 | P1 | Functional | Body attributes (shape, height, weight, skin tone, etc.) | Update → Save | Values saved; used later in analysis context |
| SET-013 | P1 | Functional | Fit preference | Change tight/regular/relaxed/oversized → Save | Preference persisted |
| SET-014 | P1 | Error | Profile API fails | Save | Error message; form values not falsely marked saved |
| SET-015 | P2 | UX | Dirty form | Navigate away | Warn if unsaved changes (if implemented) |

---

## 12.3 Self-Image in Settings

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-020 | P1 | Functional | No self-image | Upload from settings | Same validation as upload flow; image saved |
| SET-021 | P1 | Functional | Existing self-image | Replace | New image active across app |
| SET-022 | P1 | Functional | Remove self-image (if allowed) | Remove | Cleared; upload flow prompts again |

---

## 12.4 Password / Security

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-030 | P1 | Functional | Correct current password | Change to new valid password | Success; can login with new password |
| SET-031 | P1 | Validation | Wrong current password | Submit | Error |
| SET-032 | P1 | Validation | Weak / mismatched new password | Submit | Validation errors |
| SET-033 | P1 | Functional | Logout control | Log out | Session ended; redirect |

---

## 12.5 Appearance & Preferences

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-040 | P2 | Functional | Theme toggle (if present) | Switch light/dark | Theme applies and persists |
| SET-041 | P2 | Functional | Notification or other prefs | Toggle → Save | Preferences persist |
| SET-042 | P2 | Functional | Currency / locale (if present) | Change | Prices format accordingly where used |

---

## 12.6 Account Data

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-050 | P2 | Functional | Export / view data (if present) | Request | Data download or view works |
| SET-051 | P2 | Functional | Delete account (if present) | Confirm flow | Account removed per policy; session cleared |

---

## 12.7 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| SET-060 | P1 | Responsive | Mobile | Settings forms | Full-width inputs; sections stacked |
| SET-061 | P1 | A11y | Profile form | Labels | Every input has associated label; errors linked |
| SET-062 | P1 | A11y | Keyboard | Save / cancel | Fully operable without mouse |
