import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomUUID } from "node:crypto";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const SESSION_COOKIE = "ch_session";

export interface Session {
  userId: string;
  isGuest: boolean;
}

async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SECRET);
  await setSessionCookie(token);
}

export async function createGuestSession(): Promise<string> {
  const guestId = randomUUID();
  const token = await new SignJWT({ sub: guestId, isGuest: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SECRET);
  await setSessionCookie(token);
  return guestId;
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.sub as string,
      isGuest: payload.isGuest === true,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireAuth(
  opts?: { allowGuest?: boolean },
): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.isGuest && !opts?.allowGuest) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function claimGuestContent(
  guestId: string,
  discordUserId: string,
): Promise<number> {
  const result = await db.query(
    `UPDATE content SET author_id = $1, guest_id = NULL
     WHERE guest_id = $2 AND author_id IS NULL
     RETURNING id`,
    [discordUserId, guestId],
  );
  return result.rows.length;
}
