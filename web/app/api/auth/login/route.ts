import { NextResponse } from "next/server";

function callbackUrl() {
  return (process.env.BASE_URL || "http://localhost:3000") + "/api/auth/callback";
}

export async function GET() {
  const url =
    "https://discord.com/api/oauth2/authorize" +
    `?client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl())}` +
    "&response_type=code" +
    "&scope=identify";
  return NextResponse.redirect(url);
}
