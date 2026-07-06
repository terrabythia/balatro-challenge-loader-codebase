"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface ChallengeRow {
  code: string;
  name: string;
  author: string;
  description: string | null;
  downloads: number;
  avg_rating: number;
  rating_count: number;
}

async function fetchList(
  sort: "new" | "downloads" | "rating",
  limit = 6,
): Promise<ChallengeRow[]> {
  const res = await fetch(
    `/api/content?type=challenge&sort=${sort}&limit=${limit}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
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
            <span title={`${c.avg_rating.toFixed(1)} stars (${c.rating_count})`}>
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

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="mb-3 h-4 w-3/4 rounded bg-white/5" />
          <div className="mb-2 h-3 w-1/2 rounded bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  challenges,
  emptyText,
  loading,
}: {
  title: string;
  challenges: ChallengeRow[];
  emptyText: string;
  loading: boolean;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {loading ? (
        <Skeleton />
      ) : challenges.length === 0 ? (
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

export default function ExplorePage() {
  const [recent, setRecent] = useState<ChallengeRow[]>([]);
  const [popular, setPopular] = useState<ChallengeRow[]>([]);
  const [topRated, setTopRated] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [r, p, t] = await Promise.all([
        fetchList("new"),
        fetchList("downloads"),
        fetchList("rating"),
      ]);
      if (cancelled) return;
      setRecent(r);
      setPopular(p);
      setTopRated(t);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Real-time: refresh lists when content changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("explore-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content" },
        () => {
          Promise.all([
            fetchList("new"),
            fetchList("downloads"),
            fetchList("rating"),
          ]).then(([r, p, t]) => {
            setRecent(r);
            setPopular(p);
            setTopRated(t);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
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
          loading={loading}
        />
        <Section
          title="Most Played"
          challenges={popular}
          emptyText="No downloads recorded yet."
          loading={loading}
        />
        <Section
          title="Highest Rated"
          challenges={topRated}
          emptyText="No ratings yet. Be the first to rate!"
          loading={loading}
        />
      </div>
    </div>
  );
}
