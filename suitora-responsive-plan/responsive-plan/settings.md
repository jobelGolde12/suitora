# Responsive Plan: Settings (`/settings`)

**Route:** `app/(dashboard)/settings/page.tsx`  
**Components:** `components/settings/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Profile, security, appearance, and subscription sections remain clear on mobile.
- Forms follow the same full-width mobile / constrained desktop field rules as auth.
- Section navigation (tabs or side nav) does not waste space on phones.

---

## 2. Page Structure

1. Header  
2. Section nav (Profile | Password | Appearance | Subscription | …)  
3. Active section panel  
4. Save actions  

---

## 3. Element-by-Element Alignment

### 3.1 Section navigation
| Viewport | Pattern |
|----------|---------|
| Mobile | Horizontal scroll tabs **or** vertical accordion (one section open) **or** select dropdown |
| `md+` | Horizontal tabs **or** left vertical nav + right panel |

- Tabs: equal height, min touch size, active indicator aligned.
- Vertical nav: fixed width (e.g. `w-48`), links left-aligned with identical padding; panel shares top edge with first nav item.

### 3.2 Forms (profile, password)
- Fields full width of panel.
- Label above input.
- Two-column field layouts **only** from `md` up (e.g. first/last name), collapsing to one column on mobile.
- Save button: full width on mobile; left or right aligned on desktop — consistent across sections.
- Avatar upload: preview + button stacked on mobile; horizontal on `sm+`.

### 3.3 Appearance
- Theme toggle: segmented control or cards in a responsive grid (`grid-cols-2` or `3`).
- Options equal height; labels centered or left consistently.

### 3.4 Subscription
- Plan cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- CTA full width inside card.
- Feature lists left-aligned with consistent checkmark column.

### 3.5 Danger zone (delete account)
- Clear separation (border/background).
- Destructive button full width on mobile; confirmation modal uses mobile sheet pattern.

---

## 4. Testing Checklist

- [ ] 320px: tabs scroll or accordion works; forms not overflow
- [ ] Two-column name fields collapse correctly
- [ ] Theme cards aligned
- [ ] 1024+: side nav + panel tops aligned
- [ ] Save success/error toasts do not cover inputs permanently

---

## 5. Implementation Tasks

1. [ ] Responsive section nav (tabs vs side).
2. [ ] Form field grid with mobile single-column.
3. [ ] Plan card grid.
4. [ ] Avatar row responsive flex.
5. [ ] Delete confirmation mobile-friendly modal.

---

## 6. Risks

- Many settings sections → prefer accordion or routed subpages on mobile over a long single scroll if performance/UX suffers.
- Sticky save bars covering content → prefer per-section save or careful sticky with padding.
