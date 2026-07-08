import { describe, test, expect, mock, beforeEach, afterAll } from "bun:test";

const mockQuery = mock(() => ({ rows: [], rowCount: 0 }));
mock.module("@/lib/db", () => ({
  db: { query: mockQuery },
}));

const mockCreateSession = mock(() => {});
const authedUserId: string | null = null;

mock.module("@/lib/auth", () => ({
  getSession: mock(() => null),
  requireAuth: mock(() => {
    if (!authedUserId) throw new Error("Unauthorized");
    return { userId: authedUserId };
  }),
  requireDiscordAuth: mock(() => {
    if (!authedUserId) throw new Error("Unauthorized");
    return { userId: authedUserId };
  }),
  claimGuestContent: mock(() => Promise.resolve(0)),
  createSession: mockCreateSession,
  destroySession: mock(() => {}),
}));

const { GET } = await import("@/app/api/auth/callback/route");

const originalFetch = globalThis.fetch;

// Build a minimal NextRequest-like object
function mockNextReq(path: string) {
  const url = new URL(`http://localhost${path}`);
  return {
    nextUrl: url,
    url: url.toString(),
  };
}

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    mockQuery.mockClear();
    mockCreateSession.mockClear();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test("redirects with error when no code provided", async () => {
    const req = mockNextReq("/api/auth/callback");
    const res = await GET(req as any);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=no_code");
  });

  test("redirects with error when token exchange fails", async () => {
    globalThis.fetch = mock((_url: string, _opts?: RequestInit) => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
        })
      );
    }) as any;

    const req = mockNextReq("/api/auth/callback?code=bad-code");
    const res = await GET(req as any);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=token");
  });

  test("successfully completes OAuth flow", async () => {
    let callCount = 0;
    globalThis.fetch = mock((_url: string, _opts?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: "test-token" }), {
            status: 200,
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "123456",
            username: "testuser",
            avatar: "abc123",
          }),
          { status: 200 }
        )
      );
    }) as any;

    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 1 });

    const req = mockNextReq("/api/auth/callback?code=valid-code");
    const res = await GET(req as any);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
    expect(mockCreateSession).toHaveBeenCalledWith("123456");
  });

  test("handles user without avatar", async () => {
    let callCount = 0;
    globalThis.fetch = mock((_url: string, _opts?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: "test-token" }), {
            status: 200,
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "789",
            username: "noavatar",
            avatar: null,
          }),
          { status: 200 }
        )
      );
    }) as any;

    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 1 });

    const req = mockNextReq("/api/auth/callback?code=valid-code");
    const res = await GET(req as any);
    expect(res.status).toBe(307);

    const dbCallArgs = mockQuery.mock.calls[0];
    expect(dbCallArgs[1][2]).toBeNull();
  });
});
