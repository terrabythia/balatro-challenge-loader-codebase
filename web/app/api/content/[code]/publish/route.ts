import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDiscordAuth } from "@/lib/auth";
import {
  challengeJsonSchema,
  hasChallengeContent,
  publishValidationSchema,
  uniqueTitleSchema,
} from "@/lib/schemas";
import { verifyContentOwnership, insertWithUniqueCode } from "@/lib/api-helpers";

// Utility: deep-compare two values for equality (handles JSONB objects/arrays)
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (!deepEqual(aObj[aKeys[i]], bObj[bKeys[i]])) return false;
  }
  return true;
}

async function requireDiscordAuthSafe(guestError: string) {
  try {
    return await requireDiscordAuth(guestError);
  } catch (e: unknown) {
    const message = (e as Error).message;
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

// POST /api/content/:code/publish
// - Draft → published: validates JSON, sets version=1, transitions status
// - Published → published: validates, checks for changes, increments version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await requireDiscordAuthSafe("Log in with Discord to publish challenges");
  if (session instanceof NextResponse) return session;

  const { code } = await params;

  const existing = await verifyContentOwnership(code, session.userId, "json_data, author_id, status, version, name, description");
  if (existing instanceof NextResponse) return existing;
  const row = existing as Record<string, unknown>;

  const currentStatus = row.status as string;

  // Parse body (published updates carry updated name/description/json_data)
  const body =
    currentStatus === "published"
      ? await req.json().catch(() => ({}))
      : {};

  // For published challenges, accept updated json_data in the body
  let jsonData = row.json_data;
  let newName: string | null = null;
  let newDescription: string | null | undefined = undefined;
  if (currentStatus === "published") {
    if (body.json_data) {
      jsonData = {
        ...body.json_data,
        key:
          session.userId +
          "_" +
          ((body.json_data as Record<string, unknown>).key || "untitled"),
      };
    }
    newName = body.name || null;
    newDescription = body.description;
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

  // Server-side publish validation
  const publishDescription =
    (body.description as string) ?? (row.description as string) ?? "";
  const deckCards = parsed.data.deck?.cards;
  const deckCardCount = deckCards ? deckCards.length : 52;
  const bannedOther = parsed.data.restrictions?.banned_other ?? [];
  const bannedBlindCount = bannedOther.filter(
    (b) => b.type === "blind",
  ).length;

  const parsedPublish = publishValidationSchema.safeParse({
    description: publishDescription,
    bannedBlindCount,
    deckCardCount,
  });
  if (!parsedPublish.success) {
    return NextResponse.json(
      {
        error: parsedPublish.error.issues.map((i) => i.message).join(" "),
      },
      { status: 422 },
    );
  }

  // Title uniqueness check (server-only, uses DB)
  const name = ((body.name || row.name) as string) || "";
  if (name) {
    const dup = await db.query(
      `SELECT name FROM content WHERE author_id = $1 AND code != $2`,
      [session.userId, code],
    );
    const titleParsed = uniqueTitleSchema.safeParse({
      name,
      existingNames: dup.rows.map((r) => r.name as string),
    });
    if (!titleParsed.success) {
      return NextResponse.json(
        {
          error: titleParsed.error.issues.map((i) => i.message).join(" "),
        },
        { status: 422 },
      );
    }
  }

  if (currentStatus === "published") {
    const oldJson = row.json_data as Record<string, unknown>;
    const oldName = (row.name as string) || "";
    const oldDescription = (row.description as string) || "";

    const jsonChanged = !deepEqual(oldJson, jsonData as Record<string, unknown>);
    const nameChanged = newName !== null && newName !== oldName;
    const descChanged =
      newDescription !== undefined && newDescription !== oldDescription;

    if (!jsonChanged && !nameChanged && !descChanged) {
      return NextResponse.json(
        { error: "No changes since last publish." },
        { status: 422 },
      );
    }
  }

  // Apply updates and increment version
  const nextVersion =
    currentStatus === "published"
      ? ((row.version as number) || 1) + 1
      : 1;

  if (currentStatus === "published") {
    const parts: string[] = [
      "json_data = $1::jsonb",
      "version = $2",
      "updated_at = NOW()",
    ];
    const vals: unknown[] = [JSON.stringify(jsonData), nextVersion];
    let nextIdx = 3;

    if (newName !== null) {
      parts.push(`name = $${nextIdx++}`);
      vals.push(newName);
    }
    if (newDescription !== undefined) {
      parts.push(`description = $${nextIdx++}`);
      vals.push(newDescription || null);
    }

    vals.push(code);
    await db.query(
      `UPDATE content SET ${parts.join(", ")} WHERE code = $${nextIdx}`,
      vals,
    );
  } else {
    await db.query(
      `UPDATE content SET status = 'published', version = 1, updated_at = NOW()
       WHERE code = $1`,
      [code],
    );
  }

  return NextResponse.json({ code, version: nextVersion });
}

// DELETE /api/content/:code/publish — unpublish back to draft
// Generates a new code so old shared links 404.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await requireDiscordAuthSafe("Log in with Discord to manage publish status");
  if (session instanceof NextResponse) return session;

  const { code } = await params;

  const existing = await verifyContentOwnership(code, session.userId);
  if (existing instanceof NextResponse) return existing;
  if (existing.status !== "published") {
    return NextResponse.json(
      { error: "Not published" },
      { status: 409 },
    );
  }

  // Generate a new code so the old public link stops working
  let newCode: string;
  try {
    newCode = await insertWithUniqueCode(async (newCode) => {
      await db.query(
        `UPDATE content SET code = $1, status = 'draft', plays = 0, wins = 0, losses = 0, updated_at = NOW()
         WHERE code = $2`,
        [newCode, code],
      );
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate unique code" },
      { status: 500 },
    );
  }

  return NextResponse.json({ code: newCode });
}
