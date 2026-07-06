import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/content/:code/result — record a play result (no auth needed)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  let body: { won?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.won !== "boolean") {
    return NextResponse.json(
      { error: "won (boolean) is required" },
      { status: 400 },
    );
  }

  const content = await db.query("SELECT id FROM content WHERE code = $1", [
    code,
  ]);

  if (content.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentId = content.rows[0].id;

  await db.query(
    `UPDATE content SET plays = plays + 1, ${body.won ? "wins = wins + 1" : "losses = losses + 1"} WHERE id = $1`,
    [contentId],
  );

  await db.query(
    "INSERT INTO challenge_results (content_id, won) VALUES ($1, $2)",
    [contentId, body.won],
  );

  return NextResponse.json({ ok: true });
}
