/**
 * Shared module mocks (Pillar 05, Action Item 5).
 *
 * Module stubs live in one place so suites reuse the same deterministic mocks
 * instead of re-inventing chain stubs per file. Tests still wire them up with
 * the `vi.hoisted` + `vi.mock` convention (see docs/testing_policy.md) because
 * vi.mock factories cannot reference outer-scope variables directly.
 */

/**
 * A thenable drizzle query-builder stub. Any chain of `.select().from().where()`
 * / `.insert().values()`. / `.update().set()` resolves to `resolveValue`, so
 * route handlers that build queries stay syntactically intact without a real DB.
 */
export function makeDrizzleChain(
  resolveValue: unknown = []
): Record<string, unknown> {
  const chain = {
    then: (onF: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(onF),
  } as Record<string, unknown> & { [k: string]: unknown };
  for (const m of [
    "select", "from", "where", "and", "or", "insert", "values",
    "onConflictDoNothing", "update", "set", "returning", "delete", "limit",
    "orderBy", "offset",
  ]) {
    chain[m] = () => chain;
  }
  return chain;
}

/**
 * A full `@/drizzle` module stub (dbWrite/dbRead/schema) whose `dbRead` and
 * `dbWrite` can be swapped per test via `makeChain`. The `schema` proxy returns
 * an empty object for any table/column access, so column references used inside
 * query builders (e.g. `eq(schema.users.id, …)`) never throw.
 */
export function makeDrizzleModule() {
  const schema = new Proxy(
    {},
    {
      get: () => ({}),
    }
  );
  return {
    dbWrite: makeDrizzleChain(),
    dbRead: makeDrizzleChain(),
    schema,
    makeChain: makeDrizzleChain,
  };
}
