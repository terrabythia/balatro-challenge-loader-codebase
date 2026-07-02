import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { challengeJsonSchema, hasChallengeContent } from "@/lib/schemas";
import { generateCode } from "@/lib/code";

// POST /api/content/:code/publish — publish a draft (auth required, author only)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  // Fetch the draft
  const draft = await db.query(
    "SELECT json_data, author_id, status FROM content WHERE code = $1",
    [code],
  );

  if (draft.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (draft.rows[0].author_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (draft.rows[0].status !== "draft") {
    return NextResponse.json(
      { error: "Already published" },
      { status: 409 },
    );
  }

  // Validate the JSON data
  const parsed = challengeJsonSchema.safeParse(draft.rows[0].json_data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid challenge data", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Ensure the challenge has meaningful content
  if (!hasChallengeContent(parsed.data)) {
    return NextResponse.json(
      { error: "Challenge has no content. Add jokers, deck changes, rules, or restrictions." },
      { status: 422 },
    );
  }

  await db.query(
    `UPDATE content SET status = 'published', updated_at = NOW()
     WHERE code = $1`,
    [code],
  );

  return NextResponse.json({ code });
}

// POST /api/content/:code/unpublish — unpublish back to draft (auth required, author only)
// Generates a new code so old shared links 404.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  const existing = await db.query(
    "SELECT author_id, status FROM content WHERE code = $1",
    [code],
  );

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.rows[0].author_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.rows[0].status !== "published") {
    return NextResponse.json(
      { error: "Not published" },
      { status: 409 },
    );
  }

  // Generate a new code so the old public link stops working
  let newCode: string;
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    newCode = generateCode();
    try {
      await db.query(
        `UPDATE content SET code = $1, status = 'draft', updated_at = NOW()
         WHERE code = $2`,
        [newCode, code],
      );
      return NextResponse.json({ code: newCode });
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "23505";

      if (!isUniqueViolation || attempt === maxRetries - 1) {
        throw err;
      }
    }
  }

  // Unreachable
  return NextResponse.json(
    { error: "Failed to generate unique code" },
    { status: 500 },
  );
}
