import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let draftCount = 0;
  if (session.isGuest) {
    const result = await db.query(
      "SELECT COUNT(*)::int as count FROM content WHERE guest_id = $1",
      [session.userId],
    );
    draftCount = result.rows[0]?.count ?? 0;
  }

  return NextResponse.json({
    userId: session.userId,
    isGuest: session.isGuest,
    draftCount,
  });
}
