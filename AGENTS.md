# AGENTS.md

## Project Overview

This project is built with:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Turso (SQLite)
- Drizzle ORM

The goal is to create a clean, scalable, production-ready application with a strong focus on performance, accessibility, and maintainability.

---

# General Rules

- Always prefer Server Components.
- Use Client Components only when necessary.
- Never introduce unnecessary dependencies.
- Write clean, readable, strongly typed TypeScript.
- Follow existing project architecture.
- Keep components reusable.
- Avoid code duplication.
- Never disable TypeScript or ESLint rules unless absolutely necessary.
- Always preserve existing functionality.

---

# Folder Structure

Use this structure whenever possible.

app/
components/
features/
hooks/
lib/
services/
actions/
types/
utils/
db/
public/

Never create random folders.

---

# Component Guidelines

Create small reusable components.

Preferred:

- One responsibility per component
- Strongly typed props
- Functional components only
- No class components

If a component exceeds roughly 250 lines, consider splitting it.

---

# Styling

Use Tailwind CSS.

Rules:

- Reuse existing utility patterns.
- Prefer composition over custom CSS.
- Avoid inline styles.
- Keep spacing consistent.
- Use responsive design.
- Follow existing design language.

---

# State Management

Prefer:

1. React Server Components
2. URL Search Params
3. React Context
4. Local component state

Only introduce external state libraries when justified.

---

# Data Fetching

Prefer:

- Server Actions
- Route Handlers
- fetch()
- React cache()

Avoid unnecessary client-side fetching.

---

# Database

Use Drizzle ORM.

Rules:

- Never write raw SQL if Drizzle supports it.
- Keep queries typed.
- Create migrations when schema changes.

---

# API

Use Route Handlers.

Return consistent JSON.

Example:

{
  "success": true,
  "data": {},
  "message": ""
}

Handle errors gracefully.

---

# Error Handling

Always:

- Handle loading states
- Handle empty states
- Handle API errors
- Never silently ignore exceptions

---

# Performance

Always optimize for:

- Server Components
- Image optimization
- Lazy loading
- Code splitting
- Memoization only when needed

Avoid premature optimization.

---

# Accessibility

Always include:

- Semantic HTML
- Keyboard accessibility
- Proper aria labels
- Accessible forms

---

# Security

Never:

- Expose secrets
- Commit API keys
- Trust user input
- Skip validation

Validate all user input.

---

# Forms

Use:

- React Hook Form
- Zod validation

Display user-friendly validation messages.

---

# Authentication

Never bypass authentication.

Protect:

- API routes
- Server Actions
- Admin pages

---

# Code Style

Prefer:

- Early returns
- Small functions
- Named exports
- Async/await
- Descriptive variable names

Avoid:

- Nested ternaries
- Deep nesting
- Magic numbers

---

# Comments

Only add comments when explaining *why*, not *what*.

Avoid unnecessary comments.

---

# Testing

When modifying business logic:

- Update existing tests
- Add tests for new behavior
- Ensure no regression

---

# Git

Create focused commits.

Avoid unrelated code changes.

---

# Before Finishing

Verify:

- TypeScript passes
- ESLint passes
- Build succeeds
- No console errors
- No unused imports
- No dead code

---

# AI Agent Instructions

When making changes:

1. Read surrounding files first.
2. Preserve project conventions.
3. Prefer modifying existing files over creating new ones.
4. Explain significant architectural changes.
5. Keep diffs as small as possible.
6. Never rewrite working code without reason.
7. Ask for clarification if requirements are ambiguous.
8. Strictly do not read the .env and .env.local file
Always prioritize maintainability over clever solutions.