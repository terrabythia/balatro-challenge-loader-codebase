import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// POST /api/content/:code/publish (auth required, author only)
export async function POST(
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
    `UPDATE content SET status = 'published', updated_at = NOW()
     WHERE code = $1 AND author_id = $2 AND status = 'draft'
     RETURNING code`,
    [code, session.userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "Not found, not a draft, or not yours" },
      { status: 404 }
    );
  }

  return NextResponse.json({ code: result.rows[0].code });
}
