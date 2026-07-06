import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "@/components/nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let username: string | null = null;

  if (session && !session.isGuest) {
    const result = await db.query("SELECT username FROM users WHERE id = $1", [
      session.userId,
    ]);
    username = result.rows[0]?.username ?? null;
  }

  return (
    <>
      <Nav
        hasSession={session !== null}
        isGuest={session?.isGuest ?? true}
        username={username}
      />
      <main className="flex-1">{children}</main>
    </>
  );
}
