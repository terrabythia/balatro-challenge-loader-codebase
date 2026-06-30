import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockQuery = mock(() => ({ rows: [], rowCount: 0 }));
mock.module("@/lib/db", () => ({
  db: { query: mockQuery },
}));

let authedUserId: string | null = null;

mock.module("@/lib/auth", () => ({
  getSession: mock(() => null),
  requireAuth: mock((): { userId: string } => {
    if (!authedUserId) throw new Error("Unauthorized");
    return { userId: authedUserId };
  }),
  createSession: mock(() => {}),
  destroySession: mock(() => {}),
}));

const { POST } = await import("@/app/api/ratings/route");

describe("POST /api/ratings", () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  test("returns 401 when not authenticated", async () => {
    authedUserId = null;
    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ content_id: 1, score: 5 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  test("returns 400 for invalid score (too high)", async () => {
    authedUserId = "user123";
    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ content_id: 1, score: 6 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  test("returns 400 for negative score", async () => {
    authedUserId = "user123";
    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ content_id: 1, score: 0 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  test("returns 400 for missing content_id", async () => {
    authedUserId = "user123";
    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ score: 3 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  test("creates rating successfully", async () => {
    authedUserId = "user123";
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 1 });

    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ content_id: 1, score: 4, comment: "Nice!" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("rejects non-integer content_id", async () => {
    authedUserId = "user123";
    const req = new Request("http://localhost/api/ratings", {
      method: "POST",
      body: JSON.stringify({ content_id: "abc", score: 3 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});
