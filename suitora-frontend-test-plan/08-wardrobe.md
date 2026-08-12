# 08 — Wardrobe Test Plan

**Route:** `/wardrobe`  
**Auth:** Required  
**Features:** Wardrobe items, folders, outfits, outfit suggestions, folder modal  
**Components:** `ItemFolderModal`, `OutfitSuggestions`, wardrobe list/grid  

---

## 8.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| WAR-001 | P0 | Functional | User with wardrobe items | Open `/wardrobe` | Items and/or folders visible |
| WAR-002 | P0 | Functional | Empty wardrobe | Open `/wardrobe` | Empty state with guidance to add from results |
| WAR-003 | P0 | Functional | Logged out | Open `/wardrobe` | Redirect to login |
| WAR-004 | P1 | UI | Load | Skeletons then content |

---

## 8.2 Items

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| WAR-010 | P1 | Functional | Items present | Click item | Opens detail or linked analysis/results as designed |
| WAR-011 | P1 | Functional | Remove item | Delete/remove | Item removed after confirm; list updates |
| WAR-012 | P1 | Error | Remove fails | Attempt delete | Error feedback; item remains |

---

## 8.3 Folders

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| WAR-020 | P1 | Functional | Open folder modal | Create folder | Folder created with name; appears in list |
| WAR-021 | P1 | Validation | Empty folder name | Submit | Validation error |
| WAR-022 | P1 | Functional | Assign item to folder | Move/add to folder | Item appears under folder |
| WAR-023 | P1 | Functional | Rename folder | Edit name | Name updates |
| WAR-024 | P1 | Functional | Delete folder | Confirm delete | Folder removed; items handled per design (orphaned or deleted) |
| WAR-025 | P2 | UI | ItemFolderModal | Open/close | Focus management; ESC/overlay close |

---

## 8.4 Outfits & Suggestions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| WAR-030 | P1 | Functional | Outfits exist | View outfits section | Outfit cards/strips render |
| WAR-031 | P1 | Functional | Favorite outfit (if supported) | Toggle | State persists |
| WAR-032 | P2 | Functional | OutfitSuggestions | View suggestions | Recommendations based on wardrobe/profile; links work |
| WAR-033 | P2 | Functional | Empty suggestions | View | Empty or hidden, not error |

---

## 8.5 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| WAR-040 | P1 | Responsive | Mobile | Wardrobe grid | Cards stack; modals full-screen friendly |
| WAR-041 | P1 | A11y | Folder modal | Keyboard | All fields operable; focus trapped while open |
