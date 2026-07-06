import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import GuestActions from "@/components/guest-actions";

export default async function Nav() {
  const session = await getSession();
  let username: string | null = null;
  let guestHasDrafts = false;

  if (session && !session.isGuest) {
    const result = await db.query("SELECT username FROM users WHERE id = $1", [
      session.userId,
    ]);
    username = result.rows[0]?.username ?? null;
  }

  if (session?.isGuest) {
    const result = await db.query(
      "SELECT 1 FROM content WHERE guest_id = $1 LIMIT 1",
      [session.userId],
    );
    guestHasDrafts = result.rows.length > 0;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-sm font-bold tracking-wide">
            Challenge Hub
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/my-challenges"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              My Challenges
            </Link>
            <Link
              href="/install"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Install Mod
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-white/40">
                {session.isGuest ? "Guest" : username}
              </span>
              {session.isGuest ? (
                <GuestActions hasDrafts={guestHasDrafts} />
              ) : (
                <a
                  href="/api/auth/logout"
                  className="px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Log out
                </a>
              )}
            </>
          ) : (
            <a
              href="/login"
              className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Log in
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
