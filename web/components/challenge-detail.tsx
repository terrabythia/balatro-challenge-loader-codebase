"use client";

import SpriteIcon from "@/components/sprite-icon";
import type { ItemEntry } from "@/lib/game-data";

// ---- Reusable display components for challenge detail pages ----

export function StatBadge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-white/30">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPublished
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-amber-500/10 text-amber-400"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
      {children}
    </h2>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/5 pt-6">
      <SectionHeader>{title}</SectionHeader>
      {children}
    </section>
  );
}

export function EmptySection({ text }: { text: string }) {
  return <p className="text-sm text-white/20">{text}</p>;
}

export function ItemList({
  items,
  empty,
}: {
  items: ItemEntry[];
  empty: string;
}) {
  if (items.length === 0) {
    return <EmptySection text={empty} />;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-white/70">
          {item.sprite && (
            <SpriteIcon
              src={item.sprite.src}
              pos={item.sprite.pos}
              sheetWidth={item.sprite.sheetWidth}
              sheetHeight={item.sprite.sheetHeight}
              cellWidth={item.sprite.cellWidth}
              cellHeight={item.sprite.cellHeight}
              displayHeight={32}
              displayWidth={item.sprite.displayWidth}
              overlayPos={item.sprite.overlayPos}
            />
          )}
          <span>
            {item.name}
            {item.detail && (
              <span className="ml-1.5 text-xs text-white/30">
                {item.detail}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
