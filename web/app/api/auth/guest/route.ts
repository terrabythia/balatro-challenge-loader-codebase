import { NextResponse } from "next/server";
import { createGuestSession } from "@/lib/auth";

export async function POST() {
  const guestId = await createGuestSession();
  return NextResponse.json({ userId: guestId, isGuest: true });
}
