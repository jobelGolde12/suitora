import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody, validateQuery } from "./request";

const schema = z.object({ name: z.string().min(2) });

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseBody", () => {
  it("returns typed data for a valid body", async () => {
    const result = await parseBody(schema, jsonRequest({ name: "ok" }));
    expect(result.data).toEqual({ name: "ok" });
    expect(result.error).toBeUndefined();
  });

  it("returns a 400 validation error for a non-conforming body", async () => {
    const result = await parseBody(schema, jsonRequest({ name: "x" }));
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
    const body = await result.error!.json();
    expect(body.code).toBe("VALIDATION");
    expect(body.issues[0].path).toBe("name");
    expect(body.issues[0].message).toMatch(/at least 2|>=2|2 character/);
  });

  it("returns a 400 when the body is invalid JSON", async () => {
    const req = new Request("http://localhost/api/x", {
      method: "POST",
      body: "{not json",
    });
    const result = await parseBody(schema, req);
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
    const body = await result.error!.json();
    expect(body.code).toBe("VALIDATION");
    expect(body.error).toContain("Invalid JSON body");
  });
});

describe("validateQuery", () => {
  const querySchema = z.object({ page: z.coerce.number().int().min(1).optional() });

  it("returns data from valid search params", () => {
    const result = validateQuery(querySchema, new URLSearchParams("page=3"));
    expect(result.data).toEqual({ page: 3 });
  });

  it("passes through empty params to the schema", () => {
    const result = validateQuery(querySchema, new URLSearchParams(""));
    expect(result.data).toEqual({});
  });

  it("returns a 400 validation error for invalid params", () => {
    const result = validateQuery(querySchema, new URLSearchParams("page=abc"));
    expect(result.data).toBeUndefined();
    expect(result.error!.status).toBe(400);
  });
});
