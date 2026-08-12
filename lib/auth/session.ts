import { cache } from "react";
import { headers } from "next/headers";
import { auth, type Session } from "./index";

/**
 * Per-request cached session lookup. Wrapping with React's `cache()` ensures a
 * single request that calls getSession()/requireUser() more than once performs
 * only one DB round-trip to resolve the session.
 */
export const getSession = cache(
  async (): Promise<Session | null> => {
    return auth.api.getSession({ headers: await headers() });
  }
);

/**
 * Resolve the authenticated user, or `null` when there is no valid session.
 * Route handlers should early-return a `401` when this is null. Always prefer
 * this over checking cookie presence, which does not verify the session.
 */
export async function requireUser(): Promise<Session["user"] | null> {
  const session = await getSession();
  return session?.user ?? null;
}
