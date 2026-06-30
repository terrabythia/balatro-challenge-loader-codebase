import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  try {
    // Step 1: Exchange code for access token
    console.log("[auth] Exchanging code for token...");
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[auth] Token exchange failed:", tokenRes.status, errText);
      return NextResponse.redirect(new URL("/login?error=token", req.url));
    }

    const tokenData = await tokenRes.json();
    console.log("[auth] Token received, fetching user...");

    // Step 2: Fetch user info from Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[auth] User fetch failed:", userRes.status);
      return NextResponse.redirect(new URL("/login?error=user", req.url));
    }

    const user = await userRes.json();
    console.log("[auth] User:", user.username, `(${user.id})`);

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null;

    // Step 3: Upsert user in database
    console.log("[auth] Upserting user in DB...");
    await db.query(
      `INSERT INTO users (id, username, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET username = $2, avatar_url = $3`,
      [user.id, user.username, avatarUrl]
    );
    console.log("[auth] User saved, creating session...");

    // Step 4: Create session and redirect home
    await createSession(user.id);
    console.log("[auth] Session created, redirecting home");

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("[auth] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=unknown", req.url));
  }
}
