import { describe, test, expect, mock, beforeEach } from "bun:test";

let mockSession: { userId: string; isGuest: boolean } | null = null;

const mockQuery = mock(() => ({ rows: [] }));
mock.module("@/lib/db", () => ({
  db: { query: mockQuery },
}));

mock.module("@/lib/auth", () => ({
  getSession: mock(() => mockSession),
}));

const { GET } = await import("@/app/api/auth/me/route");

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockSession = null;
    mockQuery.mockClear();
  });

  test("returns 401 when not authenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test("returns user info for authenticated user", async () => {
    mockSession = { userId: "user123", isGuest: false };

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("user123");
    expect(body.isGuest).toBe(false);
    expect(body.draftCount).toBe(0);
  });

  test("returns guest info with draft count", async () => {
    mockSession = { userId: "guest-uuid", isGuest: true };
    mockQuery.mockReturnValueOnce({ rows: [{ count: 3 }] });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("guest-uuid");
    expect(body.isGuest).toBe(true);
    expect(body.draftCount).toBe(3);
  });

  test("returns 0 draft count when guest has no drafts", async () => {
    mockSession = { userId: "guest-uuid", isGuest: true };
    mockQuery.mockReturnValueOnce({ rows: [] });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draftCount).toBe(0);
  });
});
