import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";

// GET /api/content/:code — get single by code
// Returns published content for everyone. Returns drafts to the owner when authenticated.
// Mod can access drafts with ?secret= query param (matches MOD_API_SECRET env var).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();
  const url = new URL(req.url);
  const modSecret = url.searchParams.get("secret");
  const isMod = modSecret !== null && modSecret === process.env.MOD_API_SECRET;

  let result;
  if (session || isMod) {
    // Authenticated or mod — can view all published + own drafts (or all drafts if mod)
    const statusFilter = isMod
      ? "" // mod can see anything
      : "AND (c.status = 'published' OR (c.status = 'draft' AND c.author_id = $2))";

    result = await db.query(
      `SELECT c.*, u.username as author,
              COALESCE(AVG(r.score), 0) as avg_rating,
              COUNT(r.id)::int as rating_count
       FROM content c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN ratings r ON r.content_id = c.id
       WHERE c.code = $1 ${statusFilter}
       GROUP BY c.id, u.username`,
      isMod ? [code] : [code, session!.userId]
    );
  } else {
    // Unauthenticated — only see published
    result = await db.query(
      `SELECT c.*, u.username as author,
              COALESCE(AVG(r.score), 0) as avg_rating,
              COUNT(r.id)::int as rating_count
       FROM content c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN ratings r ON r.content_id = c.id
       WHERE c.code = $1 AND c.status = 'published'
       GROUP BY c.id, u.username`,
      [code]
    );
  }

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PUT /api/content/:code — update draft (auth required, author only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const body = await req.json();

  // Verify ownership
  const existing = await db.query(
    "SELECT author_id FROM content WHERE code = $1",
    [code]
  );
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.rows[0].author_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build update (only allowed fields)
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const field of ["name", "description"] as const) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      values.push(body[field]);
    }
  }
  if (body.tags !== undefined) {
    updates.push(`tags = $${i++}`);
    values.push(body.tags);
  }
  if (body.json_data !== undefined) {
    // Prefix key with user ID for uniqueness
    const prefixed = {
      ...body.json_data,
      key: session.userId + "_" + ((body.json_data as Record<string, unknown>).key || "untitled"),
    };
    updates.push(`json_data = $${i++}::jsonb`);
    values.push(JSON.stringify(prefixed));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(code);

  await db.query(
    `UPDATE content SET ${updates.join(", ")} WHERE code = $${i}`,
    values
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/content/:code — delete draft (auth required, author only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const result = await db.query(
    "DELETE FROM content WHERE code = $1 AND author_id = $2 RETURNING id",
    [code, session.userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
