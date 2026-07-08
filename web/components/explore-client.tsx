"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

import type { ChallengeRow } from "@/types";

type SortKey = "new" | "downloads" | "rating";

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

export default function ExploreClient({
  initialRecent,
  initialPopular,
  initialTopRated,
}: {
  initialRecent: ChallengeRow[];
  initialPopular: ChallengeRow[];
  initialTopRated: ChallengeRow[];
}) {
  const [recent, setRecent] = useState(initialRecent);
  const [popular, setPopular] = useState(initialPopular);
  const [topRated, setTopRated] = useState(initialTopRated);

  const refresh = useCallback(async () => {
    const [r, p, t] = await Promise.all([
      fetchList("new"),
      fetchList("downloads"),
      fetchList("rating"),
    ]);
    setRecent(r);
    setPopular(p);
    setTopRated(t);
  }, []);

  // Real-time: refresh lists when content changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("explore-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return (
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
  );
}

async function fetchList(sort: SortKey, limit = 6): Promise<ChallengeRow[]> {
  const res = await fetch(
    `/api/content?type=challenge&sort=${sort}&limit=${limit}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}
