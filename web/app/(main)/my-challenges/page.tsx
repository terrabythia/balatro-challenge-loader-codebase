import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MyChallengesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ownershipColumn = session.isGuest ? "c.guest_id" : "c.author_id";
  const result = await db.query(
    `SELECT c.code, c.name, c.status, c.downloads, c.created_at, c.updated_at,
            COALESCE(AVG(r.score)::float, 0) as avg_rating,
            COUNT(r.id)::int as rating_count
     FROM content c
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE ${ownershipColumn} = $1 AND c.type = 'challenge'
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
    [session.userId],
  );

  const challenges = result.rows as {
    code: string;
    name: string;
    status: string;
    downloads: number;
    created_at: string;
    updated_at: string;
    avg_rating: number;
    rating_count: number;
  }[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Challenges</h1>
          <p className="mt-2 text-sm text-white/40">
            {challenges.length === 0
              ? "You haven't created any challenges yet."
              : `${challenges.length} challenge${challenges.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/build"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
        >
          New Challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-white/30">
            Create your first challenge to see it here.
          </p>
          <Link
            href="/build"
            className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Get started
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Rating
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Downloads
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Updated
                </th>
                <th className="px-4 py-3 text-right font-medium text-white/40">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr
                  key={c.code}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-white/20">
                      {c.code}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {c.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.rating_count > 0 ? (
                      <span>
                        {c.avg_rating.toFixed(1)}
                        <span className="text-white/20">
                          {" "}
                          ({c.rating_count})
                        </span>
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "published" ? (
                      c.downloads
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/build?code=${c.code}`}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
