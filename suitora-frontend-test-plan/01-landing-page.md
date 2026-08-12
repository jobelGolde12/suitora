# 01 — Landing Page Test Plan

**Route:** `/`  
**Auth:** Public  
**Key components:** `Hero`, `TrustBar`, `Features`, `HowItWorks`, `ScrollSection`, `FAQ`, `CTA`, `Navbar`, `Footer`  
**Layouts:** `(landing)/layout.tsx`, root layout  

---

## 1.1 Page Load & Structure

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-001 | P0 | Functional | None | Navigate to `/` | Page loads without error; all main sections render in order: Hero → TrustBar → Features → How It Works → ScrollSection → FAQ → CTA |
| LP-002 | P1 | UI | None | Inspect page title and meta | Document title and primary meta tags present (SEO-friendly title/description related to Suitora / AI fashion) |
| LP-003 | P1 | UI | None | Scroll from top to bottom | Smooth scroll; sections appear; no overlapping content or broken layout |
| LP-004 | P2 | Performance | None | Hard refresh | Above-the-fold content (Hero) visible quickly; no long blank screen |

---

## 1.2 Hero Section

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-010 | P0 | Functional / UI | None | View Hero | Primary headline, subcopy, and primary CTA visible |
| LP-011 | P0 | Functional | Logged out | Click primary CTA (e.g. Get Started / Try It On) | Navigates to `/register` or `/login` (or intended onboarding path) |
| LP-012 | P1 | Functional | Logged in | Click primary CTA | Navigates to `/dashboard` or `/upload` (authenticated destination) |
| LP-013 | P1 | UI | None | View Hero visuals | Hero imagery / illustration loads; no broken images; alt text present |
| LP-014 | P2 | UX | None | Resize viewport while on Hero | Layout adapts; CTA remains tappable; text remains readable |

---

## 1.3 Trust Bar

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-020 | P2 | UI | None | View TrustBar | Trust indicators (logos, stats, or social proof) render without overflow |
| LP-021 | P2 | Responsive | Mobile viewport | View TrustBar | Content stacks or scrolls appropriately; no horizontal overflow |

---

## 1.4 Features Section

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-030 | P1 | UI | None | Scroll to Features | Feature cards/blocks display (virtual try-on, scores, recommendations, etc.) with icons and short descriptions |
| LP-031 | P2 | UI | None | Hover/focus feature cards (desktop) | Subtle hover/focus state if designed; no layout shift |
| LP-032 | P1 | Responsive | Mobile | View Features | Cards stack vertically; text and icons remain legible |

---

## 1.5 How It Works

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-040 | P1 | UI | None | Scroll to How It Works | Numbered or sequential steps visible (upload photo → analyze → see results) |
| LP-041 | P2 | UX | None | Follow step illustrations | Visuals match copy; no missing images |

---

## 1.6 Scroll Section (mid-page narrative)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-050 | P2 | UI / UX | None | Scroll through ScrollSection | Content animates or reveals as intended (Framer Motion); does not block scrolling |
| LP-051 | P2 | Performance | Reduced motion preference | Enable `prefers-reduced-motion` | Animations respect reduced motion (minimal or none) |

---

## 1.7 FAQ

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-060 | P1 | Functional | None | Open FAQ section | List of questions visible |
| LP-061 | P1 | Functional | None | Click a question | Answer expands; only one open or accordion behaves as designed |
| LP-062 | P1 | Functional | None | Click same question again | Answer collapses |
| LP-063 | P1 | A11y | None | Keyboard: Tab to question, Enter/Space | Accordion toggles; focus visible |
| LP-064 | P2 | UI | None | Open multiple FAQs if multi-open allowed | Layout does not break; spacing remains consistent |

---

## 1.8 CTA (bottom)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-070 | P0 | Functional | Logged out | Click bottom CTA | Navigates to register/login |
| LP-071 | P1 | Functional | Logged in | Click bottom CTA | Navigates to dashboard or upload |
| LP-072 | P2 | UI | None | View CTA section | Strong visual hierarchy; secondary link (e.g. Learn more / Login) works if present |

---

## 1.9 Navbar (Landing)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-080 | P0 | Functional | Logged out | View Navbar | Logo, Login, Sign up (or equivalent) visible |
| LP-081 | P0 | Functional | Logged out | Click Login | Goes to `/login` |
| LP-082 | P0 | Functional | Logged out | Click Sign up / Register | Goes to `/register` |
| LP-083 | P1 | Functional | Logged in | View Navbar | Shows account/dashboard entry instead of Login/Register |
| LP-084 | P1 | Functional | None | Click Logo | Stays on or returns to `/` |
| LP-085 | P1 | Responsive | Mobile | Open mobile menu (if hamburger) | Menu opens; links work; closes on navigation or outside click |
| LP-086 | P2 | UI | Scroll down | Sticky/fixed navbar behavior | Navbar remains usable; does not cover critical content permanently |

---

## 1.10 Footer

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-090 | P1 | Functional | None | View Footer | Links to Privacy Policy (and any other legal/product links) present |
| LP-091 | P1 | Functional | None | Click Privacy Policy | Navigates to `/privacy-policy` |
| LP-092 | P2 | UI | None | Footer on mobile | Content stacks cleanly; links remain tappable |

---

## 1.11 SEO & Discoverability (Front-end visible)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-100 | P2 | Functional | None | View page source / head | Title, description, Open Graph tags present as configured |
| LP-101 | P2 | Functional | None | Request `/sitemap.xml` and `/robots.txt` | Valid responses (covered more in SEO feature; smoke check here) |

---

## 1.12 Landing — Error / Edge

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LP-110 | P2 | Error | Slow network | Load `/` | Skeleton or progressive render; no permanent spinner without content |
| LP-111 | P1 | Error | Disable JS (smoke) | Load `/` | Critical content still readable if SSR; CTAs degrade gracefully where possible |
