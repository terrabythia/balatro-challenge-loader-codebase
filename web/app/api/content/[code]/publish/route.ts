import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { challengeJsonSchema, hasChallengeContent } from "@/lib/schemas";
import { generateCode } from "@/lib/code";

// POST /api/content/:code/publish
// - Draft → published: validates JSON and transitions status
// - Published → published: validates and updates json_data in-place
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.isGuest) {
    return NextResponse.json(
      { error: "Log in with Discord to publish challenges" },
      { status: 403 },
    );
  }

  const { code } = await params;

  const existing = await db.query(
    "SELECT json_data, author_id, status FROM content WHERE code = $1",
    [code],
  );

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.rows[0].author_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentStatus = existing.rows[0].status as string;

  // For published challenges, accept updated json_data in the body
  let jsonData = existing.rows[0].json_data;
  if (currentStatus === "published") {
    const body = await req.json().catch(() => ({}));
    if (body.json_data) {
      jsonData = {
        ...body.json_data,
        key:
          session.userId +
          "_" +
          ((body.json_data as Record<string, unknown>).key || "untitled"),
      };
    }
    if (body.name) {
      await db.query("UPDATE content SET name = $1 WHERE code = $2", [
        body.name,
        code,
      ]);
    }
    if (body.description !== undefined) {
      await db.query(
        "UPDATE content SET description = $1 WHERE code = $2",
        [body.description || null, code],
      );
    }
  }

  // Validate the JSON data
  const parsed = challengeJsonSchema.safeParse(jsonData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid challenge data", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Ensure the challenge has meaningful content
  if (!hasChallengeContent(parsed.data)) {
    return NextResponse.json(
      {
        error:
          "Challenge has no content. Add jokers, deck changes, rules, or restrictions.",
      },
      { status: 422 },
    );
  }

  if (currentStatus === "published") {
    await db.query(
      `UPDATE content SET json_data = $1::jsonb, updated_at = NOW()
       WHERE code = $2`,
      [JSON.stringify(jsonData), code],
    );
  } else {
    await db.query(
      `UPDATE content SET status = 'published', updated_at = NOW()
       WHERE code = $1`,
      [code],
    );
  }

  return NextResponse.json({ code });
}

// DELETE /api/content/:code/publish — unpublish back to draft
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

  if (session.isGuest) {
    return NextResponse.json(
      { error: "Log in with Discord to manage publish status" },
      { status: 403 },
    );
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
        `UPDATE content SET code = $1, status = 'draft', plays = 0, wins = 0, losses = 0, updated_at = NOW()
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

  return NextResponse.json(
    { error: "Failed to generate unique code" },
    { status: 500 },
  );
}
