import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/content/:code/play — increment play count (only if published, no auth needed)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const result = await db.query(
    "UPDATE content SET plays = plays + 1 WHERE code = $1 AND status = 'published' RETURNING id",
    [code],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found or not published" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
