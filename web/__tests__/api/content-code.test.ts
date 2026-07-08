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
  requireDiscordAuth: mock((): { userId: string } => {
    if (!authedUserId) throw new Error("Unauthorized");
    return { userId: authedUserId };
  }),
  claimGuestContent: mock(() => Promise.resolve(0)),
  createSession: mock(() => {}),
  destroySession: mock(() => {}),
}));

const { GET, PUT, DELETE: DEL } = await import(
  "@/app/api/content/[code]/route"
);

describe("GET /api/content/:code", () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  test("returns 404 for missing code", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "NONEXISTENT" }),
    });
    expect(res.status).toBe(404);
  });

  test("returns content for valid code", async () => {
    mockQuery.mockReturnValueOnce({
      rows: [
        {
          code: "TEST-CD",
          type: "challenge",
          name: "Test Challenge",
          author: "tester",
          json_data: { key: "test", jokers: [] },
          avg_rating: 4.5,
          rating_count: 3,
        },
      ],
    });
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe("TEST-CD");
    expect(body.author).toBe("tester");
  });

  test("only returns published content", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "DRAFT-CODE" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/content/:code", () => {
  beforeEach(() => {
    mockQuery.mockClear();
    authedUserId = null; // unauthenticated
  });

  test("returns 401 when not authenticated", async () => {
    const res = await PUT(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 403 when not the author", async () => {
    authedUserId = "user999";
    mockQuery.mockReturnValueOnce({
      rows: [{ author_id: "other-user" }],
    });

    const res = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      }) as any,
      { params: Promise.resolve({ code: "TEST-CD" }) }
    );
    expect(res.status).toBe(403);
  });

  test("updates when authenticated as author", async () => {
    authedUserId = "user123";
    mockQuery.mockReturnValueOnce({
      rows: [{ author_id: "user123" }],
    });
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 1 });

    const res = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
        headers: { "content-type": "application/json" },
      }) as any,
      { params: Promise.resolve({ code: "TEST-CD" }) }
    );
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/content/:code", () => {
  beforeEach(() => {
    mockQuery.mockClear();
    authedUserId = null;
  });

  test("returns 401 when not authenticated", async () => {
    const res = await DEL(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(401);
  });

  test("deletes when authenticated as author", async () => {
    authedUserId = "user123";
    mockQuery.mockReturnValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

    const res = await DEL(new Request("http://localhost") as any, {
      params: Promise.resolve({ code: "TEST-CD" }),
    });
    expect(res.status).toBe(200);
  });
});
