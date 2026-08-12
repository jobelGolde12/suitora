# 04 — Upload / Try It On Test Plan

**Routes:** `/upload`, `/analysis` (progress if used)  
**Auth:** Required  
**Key features:** Self-image management, clothing image upload, product URL input, validation, analysis start  
**Components:** Upload page, `SelfImageModal`, drag-and-drop zones, toasts, skeletons  
**Constraints:** `MAX_FILE_SIZE`, `ACCEPTED_IMAGE_TYPES` from validation utils  

---

## 4.1 Page Access & Initial State

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-001 | P0 | Functional | Logged in | Open `/upload` | Upload page loads; self-image section + product section visible |
| UP-002 | P0 | Functional | Logged out | Open `/upload` | Redirect to login |
| UP-003 | P1 | Functional | User has saved self-image | Open `/upload` | Existing self-image preview shown; option to change |
| UP-004 | P1 | Functional | User has no self-image | Open `/upload` | Prompt to add self-image (modal or empty state) |

---

## 4.2 Self-Image

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-010 | P0 | Functional | No self-image | Open self-image flow / modal | Can select image via file picker |
| UP-011 | P0 | Functional | Valid portrait image | Upload self-image | Preview shown; upload succeeds; image saved to profile |
| UP-012 | P0 | Validation | File > MAX_FILE_SIZE | Attempt upload | Error message about size limit; file rejected |
| UP-013 | P0 | Validation | Non-image / wrong MIME | Attempt upload | Error about accepted types |
| UP-014 | P1 | Functional | Drag-and-drop self zone | Drag valid image over zone → drop | Preview updates; upload proceeds |
| UP-015 | P1 | Functional | Existing self-image | Replace with new image | New image becomes active; old replaced |
| UP-016 | P1 | UX | During self upload | Observe UI | Loading indicator; cannot double-submit |
| UP-017 | P1 | Error | Upload API fails | Upload self-image | Error toast/message; previous state preserved if any |
| UP-018 | P2 | UI | SelfImageModal | Open/close modal | Focus trap / close on overlay or X; ESC closes if implemented |

---

## 4.3 Clothing / Product Image Upload

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-020 | P0 | Functional | Self-image present | Select clothing image via picker | Preview shown |
| UP-021 | P0 | Functional | Valid clothing image | Confirm and proceed | Image accepted for analysis |
| UP-022 | P0 | Validation | Oversized clothing file | Select file | Size error shown |
| UP-023 | P0 | Validation | Invalid type | Select file | Type error shown |
| UP-024 | P1 | Functional | Drag-and-drop clothing zone | Drop valid image | Preview + ready state |
| UP-025 | P1 | Functional | After selecting clothing | Clear / remove image | Preview cleared; can select again |
| UP-026 | P1 | UX | Drag over zone | Drag file over dropzone | Visual drag-over state |

---

## 4.4 Product URL Mode

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-030 | P0 | Functional | On upload page | Switch to “link” / URL mode | URL input appears |
| UP-031 | P0 | Functional | Supported product URL | Paste valid URL → continue | Product image extracted (or loading state then preview); ready for analysis |
| UP-032 | P1 | Validation | Empty URL | Submit | Validation error |
| UP-033 | P1 | Validation | Malformed URL | Submit | Validation error |
| UP-034 | P1 | Error | Unsupported / failed extraction | Paste bad URL | Clear error; stay in URL mode |
| UP-035 | P1 | Functional | Switch back to upload mode | Toggle mode | URL field hidden/cleared appropriately; upload zone available |

---

## 4.5 Start Analysis

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-040 | P0 | Functional | Self-image + clothing ready | Click Analyze / Try It On | Analysis starts; loading state; navigates to results or analysis progress route |
| UP-041 | P0 | Functional | Missing self-image | Click Analyze | Blocked with message to add self-image |
| UP-042 | P0 | Functional | Missing product | Click Analyze | Blocked with message to add clothing/URL |
| UP-043 | P1 | UX | During analysis | Observe UI | Progress indicator / skeleton; button disabled |
| UP-044 | P1 | Error | Analysis API fails | Start analysis | Error toast; user can retry without losing inputs if possible |
| UP-045 | P1 | Functional | Successful analysis | Complete flow | Lands on `/results/[id]` with scores and try-on |

---

## 4.6 Analysis Progress Page (if `/analysis` used)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-050 | P1 | Functional | Analysis in progress | Land on progress view | Status messages / steps visible |
| UP-051 | P1 | Functional | Analysis completes | Auto-redirect | Goes to results page |
| UP-052 | P2 | UX | Long-running | Wait | User informed analysis is still working; no silent hang |

---

## 4.7 Mobile Nav Behavior During Upload

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-060 | P1 | UX | Mobile | On `/upload` | Bottom nav / FAB behavior matches design (Try It On may be center FAB) |
| UP-061 | P2 | UX | Mobile | On analysis/results immersive routes | Bottom nav hidden per `isHiddenRoute` logic |

---

## 4.8 Accessibility & Responsive

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UP-070 | P1 | A11y | Keyboard | Navigate upload form | All controls reachable; file inputs operable |
| UP-071 | P1 | A11y | Screen reader | Self / clothing zones | Labels describe purpose |
| UP-072 | P1 | Responsive | Mobile | Full upload flow | Dropzones usable; buttons not obscured by bottom nav |
