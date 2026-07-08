import { db } from "@/lib/db";
import { generateCode } from "@/lib/code";
import { requireAuth, type Session } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Call requireAuth() and return a 401 response on failure.
 * The caller receives a Session on success, or a NextResponse to return.
 */
export async function requireAuthSafe(
  opts?: { allowGuest?: boolean },
): Promise<Session | NextResponse> {
  try {
    return await requireAuth(opts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Verify that a content row exists and belongs to the given user.
 * Returns the row on success, or a NextResponse error on failure.
 * Caller must check if the result is a NextResponse (error) or a row.
 */
export async function verifyContentOwnership(
  code: string,
  userId: string,
  selectFields: string = "author_id, status",
): Promise<Record<string, unknown> | NextResponse> {
  const existing = await db.query(
    `SELECT ${selectFields} FROM content WHERE code = $1`,
    [code],
  );

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ((existing.rows[0] as { author_id: string | null }).author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return existing.rows[0] as Record<string, unknown>;
}

/**
 * Insert a new content row with a unique code, retrying on collision.
 * Returns { code } on success, or throws on persistent collision.
 */
export async function insertWithUniqueCode(
  insertFn: (code: string) => Promise<void>,
): Promise<string> {
  let code: string;
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    code = generateCode();
    try {
      await insertFn(code);
      return code;
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

  throw new Error("Failed to generate unique code");
}
