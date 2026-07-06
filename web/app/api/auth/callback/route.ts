import { NextRequest, NextResponse } from "next/server";
import { createSession, getSession, claimGuestContent } from "@/lib/auth";
import { db } from "@/lib/db";

function baseUrl() {
  return process.env.BASE_URL || "http://localhost:3000";
}

function callbackUrl() {
  return baseUrl() + "/api/auth/callback";
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", baseUrl()));
  }

  try {
    console.log("[auth] Exchanging code for token...");
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl(),
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[auth] Token exchange failed:", tokenRes.status, errText);
      return NextResponse.redirect(new URL("/login?error=token", baseUrl()));
    }

    const tokenData = await tokenRes.json();
    console.log("[auth] Token received, fetching user...");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[auth] User fetch failed:", userRes.status);
      return NextResponse.redirect(new URL("/login?error=user", baseUrl()));
    }

    const user = await userRes.json();
    console.log("[auth] User:", user.username, `(${user.id})`);

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null;

    console.log("[auth] Upserting user in DB...");
    await db.query(
      `INSERT INTO users (id, username, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET username = $2, avatar_url = $3`,
      [user.id, user.username, avatarUrl]
    );
    console.log("[auth] User saved, creating session...");

    // Check if the user had a guest session — claim their drafts
    const guestSession = await getSession();
    let claimedCount = 0;
    if (guestSession?.isGuest) {
      claimedCount = await claimGuestContent(guestSession.userId, user.id);
      console.log("[auth] Claimed", claimedCount, "drafts from guest", guestSession.userId);
    }

    // Create Discord session
    await createSession(user.id);
    console.log("[auth] Session created, redirecting home");

    const homeUrl = new URL("/", baseUrl());
    if (claimedCount > 0) {
      homeUrl.searchParams.set("claimed", String(claimedCount));
    }
    return NextResponse.redirect(homeUrl);
  } catch (err) {
    console.error("[auth] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=unknown", baseUrl()));
  }
}
