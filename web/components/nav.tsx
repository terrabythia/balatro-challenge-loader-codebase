import Link from "next/link";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import GuestActions from "@/components/guest-actions";

const NAV_LINKS = [
  { href: "/", label: "Explore", match: (p: string) => p === "/" },
  { href: "/my-challenges", label: "My Challenges", match: (p: string) => p.startsWith("/my-challenges") },
  { href: "/install", label: "Install Mod", match: (p: string) => p.startsWith("/install") },
] as const;

function navLinkClasses(active: boolean): string {
  return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
    active
      ? "text-white bg-white/10"
      : "text-white/60 hover:text-white hover:bg-white/5"
  }`;
}

export default async function Nav() {
  const session = await getSession();
  const pathname = (await headers()).get("x-pathname") ?? "/";
  let username: string | null = null;

  if (session && !session.isGuest) {
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
            {NAV_LINKS.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                className={navLinkClasses(match(pathname))}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-white/40">
                {session.isGuest ? "Guest" : username}
              </span>
              {session.isGuest ? (
                <>
                  <a
                    href="/api/auth/login"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Log in with Discord
                  </a>
                  <GuestActions />
                </>
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
