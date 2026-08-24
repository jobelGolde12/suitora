/**
 * Shared SWR fetcher with credentials and error handling.
 * Used by all client pages that fetch data via SWR.
 */

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const error = new Error("Fetch failed") as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}
