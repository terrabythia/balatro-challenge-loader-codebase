"use client";

import { useState, useCallback } from "react";

// ---- Types ----

export interface CardInstance {
  enhancement: string | null;
  edition: string | null;
  seal: string | null;
}

export interface DeckCard {
  suit: string;
  rank: string;
  suitIndex: number;
  rankIndex: number;
  count: number;
  instances: CardInstance[];
}

// ---- Constants ----

const SUITS = ["Hearts", "Clubs", "Diamonds", "Spades"] as const;
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;

const SUIT_SYMBOLS: Record<string, string> = {
  Hearts: "♥",
  Clubs: "♣",
  Diamonds: "♦",
  Spades: "♠",
};

const SUIT_COLORS: Record<string, string> = {
  Hearts: "text-red-500",
  Clubs: "text-blue-400",
  Diamonds: "text-red-400",
  Spades: "text-blue-500",
};

const ENHANCEMENTS = [
  { id: null, label: "Plain" },
  { id: "m_bonus", label: "Bonus" },
  { id: "m_mult", label: "Mult" },
  { id: "m_wild", label: "Wild" },
  { id: "m_glass", label: "Glass" },
  { id: "m_steel", label: "Steel" },
  { id: "m_stone", label: "Stone" },
  { id: "m_gold", label: "Gold" },
  { id: "m_lucky", label: "Lucky" },
];

const EDITIONS = [
  { id: null, label: "None" },
  { id: "e_foil", label: "Foil" },
  { id: "e_holo", label: "Holo" },
  { id: "e_polychrome", label: "Poly" },
  { id: "e_negative", label: "Neg" },
];

const SEALS = [
  { id: null, label: "None" },
  { id: "red", label: "Red" },
  { id: "blue", label: "Blue" },
  { id: "gold", label: "Gold" },
  { id: "purple", label: "Purple" },
];

// ---- Helpers ----

function buildStandardDeck(): DeckCard[] {
  const cards: DeckCard[] = [];
  for (let si = 0; si < SUITS.length; si++) {
    for (let ri = 0; ri < RANKS.length; ri++) {
      cards.push({
        suit: SUITS[si],
        rank: RANKS[ri],
        suitIndex: si,
        rankIndex: ri,
        count: 1,
        instances: [plainInstance()],
      });
    }
  }
  return cards;
}

function plainInstance(): CardInstance {
  return { enhancement: null, edition: null, seal: null };
}

function key(suit: string, rank: string) {
  return `${suit}-${rank}`;
}

// ---- Props ----

interface DeckEditorProps {
  cards: DeckCard[];
  onChange: (cards: DeckCard[]) => void;
}

// ---- Sprite config ----

const SPRITE_URL = "/sprites/8BitDeck.png";
const SPRITE_W = 923;
const SPRITE_H = 380;
const CELL_W = 71;
const CELL_H = 95;

// ---- Small option button ----

function OptionBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "bg-white/5 text-white/30 hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

// ---- Component ----

export default function DeckEditor({ cards, onChange }: DeckEditorProps) {
  const [expanded, setExpanded] = useState<{ si: number; ri: number } | null>(
    null,
  );

  const adjust = useCallback(
    (suitIndex: number, rankIndex: number, delta: number) => {
      const updated = cards.map((c) => {
        if (c.suitIndex === suitIndex && c.rankIndex === rankIndex) {
          const next = Math.max(0, Math.min(52, c.count + delta));
          let nextInsts = c.instances;
          if (delta > 0) {
            nextInsts = [...c.instances];
            for (let i = 0; i < delta; i++) nextInsts.push(plainInstance());
          } else if (delta < 0 && c.instances.length > 0) {
            nextInsts = c.instances.slice(0, c.instances.length + delta);
          }
          return { ...c, count: next, instances: nextInsts };
        }
        return c;
      });
      onChange(updated);
    },
    [cards, onChange],
  );

  const resetToStandard = useCallback(() => {
    onChange(buildStandardDeck());
  }, [onChange]);

  const totalCount = cards.reduce((sum, c) => sum + c.count, 0);
  const isStandard = cards.every(
    (c) =>
      c.count === 1 &&
      c.instances.every((i) => !i.enhancement && !i.edition && !i.seal),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">
          {totalCount} card{totalCount !== 1 ? "s" : ""} in deck
        </span>
        <button
          onClick={resetToStandard}
          disabled={isStandard}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors disabled:opacity-30"
        >
          Reset to standard
        </button>
      </div>

      {/* Card grid */}
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-2 min-w-max">
          {SUITS.map((suit, si) => {
            const suitCards = cards.filter((c) => c.suitIndex === si);
            const allEmpty = suitCards.every((c) => c.count === 0);
            const suitCount = suitCards.reduce((s, c) => s + c.count, 0);
            return (
              <div key={suit} className="flex gap-2 items-center">
                {/* Row label (suit) — clickable to toggle all */}
                <button
                  onClick={() => {
                    const target = allEmpty ? 1 : 0;
                    const updated = cards.map((c) =>
                      c.suitIndex === si
                        ? {
                            ...c,
                            count: target,
                            instances: target > 0 ? [plainInstance()] : [],
                          }
                        : c,
                    );
                    onChange(updated);
                  }}
                  className={`w-28 shrink-0 text-right pr-4 text-sm hover:opacity-80 transition-opacity ${SUIT_COLORS[suit]}`}
                  title={`${allEmpty ? "Restore" : "Remove"} all ${suit}`}
                >
                  {SUIT_SYMBOLS[suit]} {suit}
                  <span className="text-white/30 text-xs ml-0.5">
                    {!allEmpty && suitCount !== 13 ? `(${suitCount})` : ""}
                  </span>
                </button>

                {/* Card cells */}
                {RANKS.map((rank, ri) => {
                  const card = cards.find(
                    (c) => c.suitIndex === si && c.rankIndex === ri,
                  )!;
                  const cardKey = key(suit, rank);
                  const hasCards = card.count > 0;
                  const isExpanded = expanded?.si === si && expanded?.ri === ri;

                  return (
                    <div
                      key={cardKey}
                      className="flex-1 relative flex flex-col items-center gap-1 group"
                      style={{ maxWidth: CELL_W + 16 }}
                    >
                      {/* Sprite wrapper with hover overlay */}
                      <div className="relative">
                        <div
                          className="rounded-md bg-white"
                          style={{
                            width: CELL_W,
                            height: CELL_H,
                            backgroundImage: `url(${SPRITE_URL})`,
                            backgroundSize: `${SPRITE_W}px ${SPRITE_H}px`,
                            backgroundPosition: `-${ri * CELL_W}px -${si * CELL_H}px`,
                            imageRendering: "pixelated",
                            opacity: hasCards ? 1 : 0.2,
                            filter: hasCards ? "none" : "grayscale(80%)",
                          }}
                        />
                        {/* Hover overlay */}
                        {hasCards && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/50">
                            <button
                              onClick={() => {
                                setExpanded(
                                  expanded?.si === si && expanded?.ri === ri
                                    ? null
                                    : { si, ri },
                                );
                              }}
                              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-xs text-white transition-colors"
                            >
                              edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Count controls */}
                      <div
                        className={`flex items-center gap-0.5 rounded-md text-xs transition-all ${
                          hasCards ? "bg-white/10" : "bg-transparent"
                        }`}
                      >
                        <button
                          onClick={() => adjust(si, ri, -1)}
                          disabled={card.count === 0}
                          className="w-5 h-5 flex items-center justify-center rounded-l text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors"
                        >
                          −
                        </button>
                        <span
                          className={`min-w-[1.5rem] text-center font-medium tabular-nums ${
                            hasCards ? "text-white/80" : "text-white/20"
                          }`}
                        >
                          {card.count}
                        </span>
                        <button
                          onClick={() => adjust(si, ri, 1)}
                          disabled={card.count >= 52}
                          className="w-5 h-5 flex items-center justify-center rounded-r text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating detail panel */}
      {expanded &&
        (() => {
          const card = cards.find(
            (c) => c.suitIndex === expanded.si && c.rankIndex === expanded.ri,
          );
          console.log("Expanded card:", card);
          if (!card) return null;
          const insts = card.instances;

          return (
            <div className="p-4 rounded-lg border border-white/10 bg-neutral-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-sm bg-white"
                    style={{
                      width: 47,
                      height: 63,
                      backgroundImage: `url(${SPRITE_URL})`,
                      backgroundSize: `${(SPRITE_W / 3) * 2}px ${(SPRITE_H / 3) * 2}px`,
                      backgroundPosition: `-${(card.rankIndex * CELL_W * 2) / 3}px -${(card.suitIndex * CELL_H * 2) / 3}px`,
                      imageRendering: "pixelated",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {card.rank} of {card.suit}
                    </p>
                    <p className="text-xs text-white/40">
                      {card.count} cop{card.count !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(null)}
                  className="text-white/30 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Instance list */}
              <div className="space-y-2">
                {insts.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <span className="text-xs text-white/30 w-6 text-right tabular-nums">
                      #{idx + 1}
                    </span>

                    {/* Enhancement */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-white/20 uppercase">
                        Enh
                      </span>
                      <div className="flex gap-0.5 flex-wrap max-w-[220px]">
                        {ENHANCEMENTS.map((e) => (
                          <OptionBtn
                            key={String(e.id)}
                            active={inst.enhancement === e.id}
                            label={e.label}
                            onClick={() => {
                              const next = [...insts];
                              next[idx] = { ...inst, enhancement: e.id };
                              const updated = cards.map((c) =>
                                c.suitIndex === expanded!.si &&
                                c.rankIndex === expanded!.ri
                                  ? { ...c, instances: next }
                                  : c,
                              );
                              onChange(updated);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Edition */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-white/20 uppercase">
                        Ed
                      </span>
                      <div className="flex gap-0.5">
                        {EDITIONS.map((e) => (
                          <OptionBtn
                            key={String(e.id)}
                            active={inst.edition === e.id}
                            label={e.label}
                            onClick={() => {
                              const next = [...insts];
                              next[idx] = { ...inst, edition: e.id };
                              const updated = cards.map((c) =>
                                c.suitIndex === expanded!.si &&
                                c.rankIndex === expanded!.ri
                                  ? { ...c, instances: next }
                                  : c,
                              );
                              onChange(updated);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Seal */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-white/20 uppercase">
                        Seal
                      </span>
                      <div className="flex gap-0.5">
                        {SEALS.map((s) => (
                          <OptionBtn
                            key={String(s.id)}
                            active={inst.seal === s.id}
                            label={s.label}
                            onClick={() => {
                              const next = [...insts];
                              next[idx] = { ...inst, seal: s.id };
                              const updated = cards.map((c) =>
                                c.suitIndex === expanded!.si &&
                                c.rankIndex === expanded!.ri
                                  ? { ...c, instances: next }
                                  : c,
                              );
                              onChange(updated);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Delete instance */}
                    <button
                      onClick={() => {
                        if (insts.length <= 1) return;
                        const next = insts.filter((_, i) => i !== idx);
                        const updated = cards.map((c) =>
                          c.suitIndex === expanded!.si &&
                          c.rankIndex === expanded!.ri
                            ? { ...c, count: next.length, instances: next }
                            : c,
                        );
                        onChange(updated);
                      }}
                      disabled={insts.length <= 1}
                      className="ml-auto text-white/20 hover:text-red-400 text-xs p-1 disabled:opacity-10 shrink-0"
                      title="Remove copy"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add copy */}
              <button
                onClick={() => {
                  if (card.count >= 52) return;
                  const next = [...insts, plainInstance()];
                  const updated = cards.map((c) =>
                    c.suitIndex === expanded!.si && c.rankIndex === expanded!.ri
                      ? { ...c, count: next.length, instances: next }
                      : c,
                  );
                  onChange(updated);
                }}
                disabled={card.count >= 52}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors disabled:opacity-20"
              >
                + Add copy
              </button>
            </div>
          );
        })()}

      {/* Global controls */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => {
            const updated = cards.map((c) => ({
              ...c,
              count: 1,
              instances: [plainInstance()],
            }));
            onChange(updated);
          }}
          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
        >
          Standard deck
        </button>
        <button
          onClick={() => {
            const updated = cards.map((c) => ({
              ...c,
              count: 0,
              instances: [],
            }));
            onChange(updated);
          }}
          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

export { buildStandardDeck, SUITS, RANKS, plainInstance };
