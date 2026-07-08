import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockQuery = mock(() => ({ rows: [], rowCount: 0 }));
mock.module("@/lib/db", () => ({
  db: { query: mockQuery },
}));

const { POST } = await import("@/app/api/content/[code]/result/route");

describe("POST /api/content/:code/result", () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  test("returns 400 for invalid body", async () => {
    const req = new Request("http://localhost/api/content/TEST/result", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ code: "TEST" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 when won is not a boolean", async () => {
    const req = new Request("http://localhost/api/content/TEST/result", {
      method: "POST",
      body: JSON.stringify({ won: "yes" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ code: "TEST" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("won");
  });

  test("returns 404 when challenge not found", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });

    const req = new Request("http://localhost/api/content/TEST/result", {
      method: "POST",
      body: JSON.stringify({ won: true }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ code: "NOPE" }),
    });
    expect(res.status).toBe(404);
  });

  test("records a win and updates stats", async () => {
    mockQuery
      .mockReturnValueOnce({ rows: [{ id: 42 }], rowCount: 1 })
      .mockReturnValueOnce({ rows: [], rowCount: 0 })
      .mockReturnValueOnce({ rows: [], rowCount: 0 });

    const req = new Request("http://localhost/api/content/TEST/result", {
      method: "POST",
      body: JSON.stringify({ won: true }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ code: "TEST" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify the UPDATE query incremented wins
    const updateCallArgs = mockQuery.mock.calls[1];
    expect(updateCallArgs[0]).toContain("wins = wins + 1");
  });

  test("records a loss and updates stats", async () => {
    mockQuery
      .mockReturnValueOnce({ rows: [{ id: 42 }], rowCount: 1 })
      .mockReturnValueOnce({ rows: [], rowCount: 0 })
      .mockReturnValueOnce({ rows: [], rowCount: 0 });

    const req = new Request("http://localhost/api/content/TEST/result", {
      method: "POST",
      body: JSON.stringify({ won: false }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ code: "TEST" }),
    });
    expect(res.status).toBe(200);

    const updateCallArgs = mockQuery.mock.calls[1];
    expect(updateCallArgs[0]).toContain("losses = losses + 1");
  });
});
