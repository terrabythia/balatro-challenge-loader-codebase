"use client";

import { useState, useCallback } from "react";

// ---- Types ----

export interface DeckCard {
  suit: string;
  rank: string;
  suitIndex: number;
  rankIndex: number;
  included: boolean;
}

// ---- Constants ----

const SUITS = ["Hearts", "Clubs", "Diamonds", "Spades"] as const;
const RANKS = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
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
        included: true,
      });
    }
  }
  return cards;
}

function key(suit: string, rank: string) {
  return `${suit}-${rank}`;
}

// ---- Props ----

interface DeckEditorProps {
  cards: DeckCard[];
  onChange: (cards: DeckCard[]) => void;
}

// ---- Component ----

// Sprite atlas: 8BitDeck.png at 1x (923×380), cells 71×95
// 13 columns (ranks A→K), 4 rows (suits: Hearts, Clubs, Diamonds, Spades)
const SPRITE_URL = "/sprites/8BitDeck.png";
const SPRITE_W = 923;
const SPRITE_H = 380;
const CELL_W = 71;
const CELL_H = 95;
const THUMB_W = 71;
const THUMB_H = 95;

export default function DeckEditor({ cards, onChange }: DeckEditorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const toggle = useCallback(
    (suitIndex: number, rankIndex: number) => {
      const updated = cards.map((c) =>
        c.suitIndex === suitIndex && c.rankIndex === rankIndex
          ? { ...c, included: !c.included }
          : c
      );
      onChange(updated);
    },
    [cards, onChange]
  );

  const resetToStandard = useCallback(() => {
    onChange(buildStandardDeck());
  }, [onChange]);

  const includedCount = cards.filter((c) => c.included).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">
          {includedCount} / 52 cards selected
        </span>
        {includedCount < 52 && (
          <button
            onClick={resetToStandard}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors"
          >
            Reset to standard
          </button>
        )}
      </div>

      {/* Card grid */}
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-2 min-w-max">
      {SUITS.map((suit, si) => {
        const suitCards = cards.filter((c) => c.suitIndex === si);
        const allIncluded = suitCards.every((c) => c.included);
        return (
        <div key={suit} className="flex gap-2 items-center">
          {/* Row label (suit) — clickable to toggle all */}
          <button
            onClick={() => {
              const target = !allIncluded;
              const updated = cards.map((c) =>
                c.suitIndex === si ? { ...c, included: target } : c
              );
              onChange(updated);
            }}
            className={`w-28 shrink-0 text-right pr-4 text-sm hover:opacity-80 transition-opacity ${SUIT_COLORS[suit]}`}
            title={`${allIncluded ? "Remove" : "Add"} all ${suit}`}
          >
            {SUIT_SYMBOLS[suit]} {suit}
            <span className="text-white/30 text-xs ml-0.5">
              {allIncluded ? "" : `(${suitCards.filter(c => c.included).length})`}
            </span>
          </button>

          {/* Card cells */}
          {RANKS.map((rank, ri) => {
            const card = cards.find(
              (c) => c.suitIndex === si && c.rankIndex === ri
            )!;
            const cardKey = key(suit, rank);
            const isHovered = hovered === cardKey;

            return (
              <button
                key={cardKey}
                onClick={() => toggle(si, ri)}
                onMouseEnter={() => setHovered(cardKey)}
                onMouseLeave={() => setHovered(null)}
                title={`${rank} of ${suit}${card.included ? "" : " (removed)"}`}
                className="flex-1 relative rounded-md transition-all cursor-pointer"
                style={{ maxWidth: THUMB_W + 8 }}
              >
                {/* Sprite */}
                <div
                  className="rounded-md mx-auto bg-white"
                  style={{
                    width: THUMB_W,
                    height: THUMB_H,
                    backgroundImage: `url(${SPRITE_URL})`,
                    backgroundSize: `${SPRITE_W}px ${SPRITE_H}px`,
                    backgroundPosition: `-${ri * CELL_W}px -${si * CELL_H}px`,
                    imageRendering: "pixelated",
                    opacity: card.included ? 1 : 0.2,
                    filter: card.included ? "none" : "grayscale(80%)",
                  }}
                />

                {/* Hover overlay */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/20" />
                )}
              </button>
            );
          })}
        </div>
        );
      })}
        </div>
      </div>

      {/* Toggle-all row buttons */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => {
            const updated = cards.map((c) => ({ ...c, included: true }));
            onChange(updated);
          }}
          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
        >
          Select all
        </button>
        <button
          onClick={() => {
            const updated = cards.map((c) => ({ ...c, included: false }));
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

export { buildStandardDeck, SUITS, RANKS };
