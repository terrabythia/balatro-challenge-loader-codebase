import { describe, test, expect, mock, beforeEach } from "bun:test";
import { mockRequest } from "../helpers";

// Mock the database before importing routes
const mockQuery = mock(() => ({ rows: [], rowCount: 0 }));
mock.module("@/lib/db", () => ({
  db: { query: mockQuery },
}));

// Mock auth
mock.module("@/lib/auth", () => ({
  getSession: mock(() => null),
  requireAuth: mock(() => {
    throw new Error("Unauthorized");
  }),
  createSession: mock(() => {}),
  destroySession: mock(() => {}),
}));

const { GET } = await import("@/app/api/content/route");

describe("GET /api/content", () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  test("returns empty list with no content", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 }); // content query
    mockQuery.mockReturnValueOnce({ rows: [{ total: 0 }], rowCount: 0 }); // count query

    const req = mockRequest({ url: "http://localhost/api/content" });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  test("returns content with default type=challenge", async () => {
    mockQuery.mockReturnValueOnce({
      rows: [
        {
          code: "TEST-CD",
          type: "challenge",
          name: "Test Challenge",
          author: "tester",
          description: "A test",
          tags: ["hard"],
          downloads: 5,
          created_at: "2026-01-01",
          avg_rating: 4.2,
          rating_count: 10,
        },
      ],
    });
    mockQuery.mockReturnValueOnce({ rows: [{ total: 1 }] });

    const req = mockRequest({ url: "http://localhost/api/content" });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].name).toBe("Test Challenge");
    expect(body.total).toBe(1);

    // Verify query was called with type=challenge
    expect(mockQuery.mock.calls[0][1]).toContain("challenge");
  });

  test("filters by type parameter", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockReturnValueOnce({ rows: [{ total: 0 }] });

    const req = mockRequest({
      url: "http://localhost/api/content?type=joker",
    });
    await GET(req as any);

    expect(mockQuery.mock.calls[0][1]).toContain("joker");
  });

  test("filters by search parameter", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockReturnValueOnce({ rows: [{ total: 0 }] });

    const req = mockRequest({
      url: "http://localhost/api/content?search=glass",
    });
    await GET(req as any);

    expect(mockQuery.mock.calls[0][1]).toContain("glass");
  });

  test("applies pagination", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockReturnValueOnce({ rows: [{ total: 100 }] });

    const req = mockRequest({
      url: "http://localhost/api/content?page=3",
    });
    await GET(req as any);

    // Page 3 → offset 40, limit 20
    expect(mockQuery.mock.calls[0][1]).toContain(20); // limit
    expect(mockQuery.mock.calls[0][1]).toContain(40); // offset
  });

  test("handles invalid page gracefully", async () => {
    mockQuery.mockReturnValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockReturnValueOnce({ rows: [{ total: 0 }] });

    const req = mockRequest({
      url: "http://localhost/api/content?page=-5",
    });
    await GET(req as any);

    // Should default to page 1 (offset 0)
    expect(mockQuery.mock.calls[0][1]).toContain(0);
  });
});
