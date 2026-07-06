import { NextRequest, NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";

function baseUrl() {
  return process.env.BASE_URL || "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const deleteDrafts = req.nextUrl.searchParams.get("deleteDrafts") === "1";
  const session = await getSession();

  if (deleteDrafts && session?.isGuest) {
    await db.query("DELETE FROM content WHERE guest_id = $1", [
      session.userId,
    ]);
  }

  await destroySession();
  return NextResponse.redirect(new URL("/", baseUrl()));
}
