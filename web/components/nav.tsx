import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Nav() {
  const session = await getSession();
  let username: string | null = null;

  if (session) {
    const result = await db.query("SELECT username FROM users WHERE id = $1", [
      session.userId,
    ]);
    username = result.rows[0]?.username ?? null;
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-white/40">{username}</span>
              <a
                href="/api/auth/logout"
                className="px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                Log out
              </a>
            </>
          ) : (
            <a
              href="/api/auth/login"
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
