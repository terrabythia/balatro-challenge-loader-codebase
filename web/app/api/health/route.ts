import { NextResponse } from "next/server";

// GET /api/health — simple health check for the mod to verify connectivity
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
