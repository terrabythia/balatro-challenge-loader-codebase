import { NextResponse } from "next/server";

export async function GET() {
  const url =
    "https://discord.com/api/oauth2/authorize" +
    `?client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI!)}` +
    "&response_type=code" +
    "&scope=identify";
  return NextResponse.redirect(url);
}
