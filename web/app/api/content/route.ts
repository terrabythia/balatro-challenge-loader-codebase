import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuthSafe, insertWithUniqueCode } from "@/lib/api-helpers";
import { z } from "zod";

// Validation — basic shape check, content is JSONB
const createSchema = z.object({
  type: z.enum(["challenge", "joker", "deck"]),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  json_data: z.record(z.string(), z.unknown()),
});

// GET /api/content — list published content
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "challenge";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "rating";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const offset = (page - 1) * limit;

  const result = await db.query(
    `SELECT c.code, c.type, c.name, u.username as author,
            c.description, c.tags, c.downloads, c.created_at,
            c.plays, c.wins, c.losses,
            COALESCE(AVG(r.score), 0) as avg_rating,
            COUNT(r.id)::int as rating_count
     FROM content c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE c.status = 'published'
       AND c.type = $1
       AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
     GROUP BY c.id, u.username
     ORDER BY
       CASE WHEN $3 = 'rating' THEN AVG(r.score) END DESC NULLS LAST,
       CASE WHEN $3 = 'new' THEN c.created_at END DESC,
       CASE WHEN $3 = 'downloads' THEN c.downloads END DESC
     LIMIT $4 OFFSET $5`,
    [type, search, sort, limit, offset],
  );

  const count = await db.query(
    `SELECT COUNT(*)::int as total FROM content
     WHERE status = 'published' AND type = $1
       AND ($2 = '' OR name ILIKE '%' || $2 || '%')`,
    [type, search],
  );

  return NextResponse.json({
    items: result.rows,
    total: count.rows[0]?.total ?? 0,
  });
}

// POST /api/content — create draft (auth required)
export async function POST(req: NextRequest) {
  const session = await requireAuthSafe({ allowGuest: true });
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Prefix the challenge key with user ID for global uniqueness
  const json_data = {
    ...parsed.data.json_data,
    key:
      session.userId +
      "_" +
      ((parsed.data.json_data as Record<string, unknown>).key || "untitled"),
  };

  // Generate a unique code with collision retry
  let code: string;
  try {
    code = await insertWithUniqueCode(async (newCode) => {
      await db.query(
        `INSERT INTO content (type, code, author_id, guest_id, name, description, tags, json_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          parsed.data.type,
          newCode,
          session.isGuest ? null : session.userId,
          session.isGuest ? session.userId : null,
          parsed.data.name,
          parsed.data.description || null,
          parsed.data.tags || [],
          JSON.stringify(json_data),
        ],
      );
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate unique code" },
      { status: 500 },
    );
  }

  return NextResponse.json({ code }, { status: 201 });
}
