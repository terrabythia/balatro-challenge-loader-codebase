import { db } from "@/lib/db";
import ExploreClient from "@/components/explore-client";

// Always render fresh — the three indexed aggregate queries hit Supabase,
// not a local DB. Even at high traffic the server is just a thin proxy.
export const revalidate = 0;

interface ChallengeRow {
  code: string;
  name: string;
  author: string;
  description: string | null;
  downloads: number;
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
            c.downloads,
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

export default async function ExplorePage() {
  const [recent, popular, topRated] = await Promise.all([
    fetchChallenges("new"),
    fetchChallenges("downloads"),
    fetchChallenges("rating"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Explore Challenges</h1>
        <p className="mt-2 text-sm text-white/40">
          Browse and play community-created challenges for Balatro.
        </p>
      </div>
      <ExploreClient
        initialRecent={recent}
        initialPopular={popular}
        initialTopRated={topRated}
      />
    </div>
  );
}
