import Link from "next/link";
import { db } from "@/lib/db";
import RealtimeRefresh from "@/components/realtime-refresh";

export const revalidate = 0; // always fresh

interface ChallengeRow {
  code: string;
  name: string;
  author: string;
  description: string | null;
  downloads: number;
  created_at: string;
  avg_rating: number;
  rating_count: number;
}

async function fetchChallenges(
  sort: "new" | "downloads" | "rating",
  limit = 6,
): Promise<ChallengeRow[]> {
  const orderClause =
    sort === "new"
      ? "c.created_at DESC"
      : sort === "downloads"
        ? "c.downloads DESC"
        : "AVG(r.score) DESC NULLS LAST";

  const result = await db.query(
    `SELECT c.code, c.name, u.username as author, c.description,
            c.downloads, c.created_at,
            COALESCE(AVG(r.score)::float, 0) as avg_rating,
            COUNT(r.id)::int as rating_count
     FROM content c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE c.status = 'published' AND c.type = 'challenge'
     GROUP BY c.id, u.username
     ORDER BY ${orderClause}
     LIMIT $1`,
    [limit],
  );

  return result.rows as ChallengeRow[];
}

function ChallengeCard({ c }: { c: ChallengeRow }) {
  return (
    <Link
      href={`/challenge/${c.code}`}
      className="block rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{c.name}</h3>
          <p className="mt-0.5 text-xs text-white/30">by {c.author}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-white/30">
          {c.rating_count > 0 && (
            <span
              title={`${c.avg_rating.toFixed(1)} stars (${c.rating_count})`}
            >
              ★ {c.avg_rating.toFixed(1)}
            </span>
          )}
          {c.downloads > 0 && <span>↓ {c.downloads}</span>}
        </div>
      </div>
      {c.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/40">
          {c.description}
        </p>
      )}
    </Link>
  );
}

export default async function ExplorePage() {
  const [recent, popular, topRated] = await Promise.all([
    fetchChallenges("new"),
    fetchChallenges("downloads"),
    fetchChallenges("rating"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <RealtimeRefresh />
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Explore Challenges</h1>
        <p className="mt-2 text-sm text-white/40">
          Browse and play community-created challenges for Balatro.
        </p>
      </div>

      <div className="space-y-12">
        <Section
          title="Most Recent"
          challenges={recent}
          emptyText="No challenges published yet."
        />
        <Section
          title="Most Played"
          challenges={popular}
          emptyText="No downloads recorded yet."
        />
        <Section
          title="Highest Rated"
          challenges={topRated}
          emptyText="No ratings yet. Be the first to rate!"
        />
      </div>
    </div>
  );
}

function Section({
  title,
  challenges,
  emptyText,
}: {
  title: string;
  challenges: ChallengeRow[];
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {challenges.length === 0 ? (
        <p className="text-sm text-white/20">{emptyText}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <ChallengeCard key={c.code} c={c} />
          ))}
        </div>
      )}
    </section>
  );
}
