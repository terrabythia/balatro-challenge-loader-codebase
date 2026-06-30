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

const { POST } = await import("@/app/api/content/[code]/publish/route");

describe("POST /api/content/:code/publish", () => {
  beforeEach(() => {
    mockQuery.mockClear();
    authedUserId = null;
  });

  test("returns 401 when not authenticated", async () => {
    const res = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(401);
  });

  test("publishes draft owned by user", async () => {
    authedUserId = "user123";
    mockQuery.mockReturnValueOnce({
      rows: [{ code: "TEST-CD" }],
      rowCount: 1,
    });

    const res = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe("TEST-CD");
  });

  test("returns 404 for non-existent draft", async () => {
    authedUserId = "user123";
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });

    const res = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "NOPE" }),
    });
    expect(res.status).toBe(404);
  });
});
