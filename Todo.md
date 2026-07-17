Here is a comprehensive, production-grade implementation plan for your Next.js application. This plan covers **Persistent Authentication** (closing and reopening the browser) combined with **Robust Security** (Rate Limiting and Login protections).

### Technology Stack Assumptions
- **Framework:** Next.js 14+ (App Router).
- **Auth Library:** NextAuth.js (v5) or Auth.js.
- **Database:** PostgreSQL / MongoDB (to store sessions and rate-limit data).
- **Caching/State:** Upstash Redis or in-memory store (for rate limiting).

---

### Phase 1: Persistent Authentication (The "Stay Logged In" Feature)

#### 1. Database Schema Update
- **Action:** Modify the `Session` model in your database.
- **Implementation:**
  - Add an `expires` field (if not already present).
  - Set the `expires` date to **7 days** or **30 days** instead of the default browser-session length.
  - Ensure the `sessionToken` is hashed securely in the DB.

#### 2. Configure NextAuth/Auth.js
- **Action:** Update the `auth.ts` configuration.
- **Implementation:**
  - Set `session.strategy: "database"` (to store sessions in DB, not JWT, for better invalidation control).
  - Set `cookies.sessionToken.maxAge: 60 * 60 * 24 * 7` (7 days).
  - Set `cookies.sessionToken.expires: 7 * 24 * 60 * 60` (matches the DB).
- **Code Snippet:**
  ```typescript
  export const { handlers, auth } = NextAuth({
    session: { strategy: "database", maxAge: 7 * 24 * 60 * 60 }, // 7 days
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          maxAge: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // ... providers
  });
  ```

#### 3. Middleware for Automatic Redirection
- **Action:** Create/update `middleware.ts` in the project root.
- **Implementation:**
  - Check if the user has a valid session on every request.
  - If authenticated and trying to access `/login` or `/register` → redirect to `/dashboard`.
  - If **not** authenticated and trying to access `/dashboard` or protected routes → redirect to `/login`.
- **Code Snippet:**
  ```typescript
  import { auth } from "@/auth";
  import { NextResponse } from "next/server";

  export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
    const isOnAuthPage = req.nextUrl.pathname === "/login";

    if (isLoggedIn && isOnAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (!isLoggedIn && isOnDashboard) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  });

  export const config = { matcher: ["/dashboard/:path*", "/login"] };
  ```

#### 4. Client-Side Session Refresh (Silent Renewal)
- **Action:** Create a `SessionProvider` wrapper in `app/providers.tsx`.
- **Implementation:**
  - Wrap the app with `<SessionProvider refetchInterval={60 * 10}>` (refetch every 10 minutes) to keep the client in sync with the server session without requiring a full page reload.

---

### Phase 2: Rate Limiting (Login Endpoint)

#### 1. Server-Side Rate Limiter Setup
- **Action:** Install a rate-limiting library (e.g., `@upstash/ratelimit` or `express-rate-limit` for API routes).
- **Implementation:**
  - Use **Upstash Redis** (recommended for serverless/Edge) or a global `Map` (for development only).
  - Define **two tiers** of rate limits:
    - **Tier 1:** 5 attempts per IP per 15 minutes.
    - **Tier 2:** 15 attempts per IP per 24 hours (hard block).

#### 2. API Route Protection (`/api/auth/callback/credentials`)
- **Action:** Wrap the authentication endpoint logic with a rate limiter.
- **Implementation:**
  - Extract the user's IP address from `req.headers.get("x-forwarded-for")` or `req.ip`.
  - Before validating credentials, run the rate limiter.
  - If the limit is exceeded, return a `429 Too Many Requests` response immediately (do not check the database password).
- **Code Snippet (in `auth.ts` or route handler):**
  ```typescript
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

  if (!success) {
    return new Response("Too many login attempts. Please try again later.", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
      },
    });
  }
  ```

---

### Phase 3: Additional Security Features

#### 1. Brute Force Protection (Account Locking)
- **Action:** Implement **graduated delays**.
- **Implementation:**
  - Track failed attempts per **email** in Redis.
  - After 3 failures: Add a 5-second artificial delay (`setTimeout` or `sleep` before response).
  - After 10 failures: Lock the account for 30 minutes (regardless of correct password).
  - *Note:* Do not disclose if the email exists or the password is wrong. Use a generic error: *"Invalid email or password."*

#### 2. CSRF Protection
- **Action:** Ensure NextAuth.js has CSRF token validation enabled (it does by default for credentials).
- **Implementation:**
  - Use `next-auth/csrf` to ensure all login POST requests include a valid `csrfToken`.

#### 3. Session Invalidation on Password Change
- **Action:** When a user changes their password, invalidate all existing sessions.
- **Implementation:**
  - Update the user's `password` hash in the DB.
  - Delete all `Session` entries in the database where `userId` matches the user.
  - Force a re-login.

#### 4. Secure HTTP Headers (Helmet)
- **Action:** Use Next.js built-in security headers in `next.config.js`.
- **Implementation:**
  ```javascript
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  }
  ```

---

### Phase 4: User Experience & Edge Cases

#### 1. "Remember Me" Checkbox
- **Action:** On the login form, add a checkbox.
- **Implementation:**
  - If unchecked: Set `session.maxAge` to `24 * 60 * 60` (1 day).
  - If checked: Set `session.maxAge` to `7 * 24 * 60 * 60` (7 days).
  - Pass this value dynamically to the `signIn` function.

#### 2. Logout Flow
- **Action:** Explicitly invalidate the session on logout.
- **Implementation:**
  - Call `signOut({ redirect: true, callbackUrl: "/login" })`.
  - This deletes the session from the database and clears the browser cookie.

#### 3. Handling Multiple Tabs
- **Action:** Use the `useSession` hook with `required: true` in `app/dashboard/layout.tsx`.
- **Implementation:**
  - If the session expires while the user is inactive, redirect them to login automatically when they interact with the app.

---

### Phase 5: Monitoring & Alerting (Optional but Recommended)

- **Action:** Log all failed login attempts (IP, Email, Timestamp).
- **Implementation:**
  - Use a logging service (e.g., Vercel Logs, Datadog) to track `429` responses.
  - Set up an alert if a single IP generates > 50 rate-limit hits in 1 hour (potential DDoS).

---

### Summary Execution Checklist

| Step | Task | Status |
| :--- | :--- | :--- |
| 1 | Update database session model with extended `expires` field. | |
| 2 | Configure NextAuth `maxAge` and cookie expiration to 7 days. | |
| 3 | Implement `middleware.ts` for automatic route protection. | |
| 4 | Deploy Redis and implement rate limiter on the login endpoint. | |
| 5 | Add artificial delays and account locking after failed attempts. | |
| 6 | Add "Remember Me" logic to the login UI. | |
| 7 | Add security headers in `next.config.js`. | |
| 8 | Test flow: Login → Close browser → Reopen → Auto-redirect to Dashboard. | |
| 9 | Test limit: Attempt login 6 times in 15 minutes → Verify 429 error. | |

This plan ensures your users have a seamless experience (persistent sessions) while your application remains hardened against automated attacks (rate limiting, brute force, and session management).