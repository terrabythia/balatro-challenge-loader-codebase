"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import JokerPicker from "@/components/joker-picker";
import ConsumablePicker from "@/components/consumable-picker";
import VoucherPicker from "@/components/voucher-picker";
import { type PickerItem } from "@/components/item-picker";
import CodeDisplay from "@/components/code-display";
import SpriteIcon from "@/components/sprite-icon";
import DeckEditor, {
  buildStandardDeck,
  type DeckCard,
  type CardInstance,
} from "@/components/deck-editor";
import {
  publishValidationSchema,
} from "@/lib/schemas";

// ---- Types ----

interface BuilderData {
  jokers: PickerItem[];
  descriptions: Record<string, string[]>;
  consumables: PickerItem[];
  vouchers: PickerItem[];
  blinds: PickerItem[];
  editCode: string | null;
  initialDraft: {
    name: string;
    description: string | null;
    status: string;
    json_data: Record<string, unknown>;
  } | null;
  isGuest: boolean;
}

interface ChallengeJson {
  key: string;
  name: string;
  jokers: { id: string; edition?: string; eternal?: boolean }[];
  consumeables?: { id: string }[];
  vouchers?: { id: string }[];
  deck?: {
    type: string;
    yes_suits?: Record<string, true>;
    no_suits?: Record<string, true>;
    yes_ranks?: Record<string, true>;
    no_ranks?: Record<string, true>;
    cards?: { s: string; r: string }[];
  };
  restrictions?: {
    banned_cards?: { id: string }[];
    banned_other?: { id: string; type: string }[];
  };
  rules?: {
    modifiers?: { id: string; value: number | string | boolean }[];
  };
}

interface SelectedJoker {
  uid: number;
  item: PickerItem;
  edition: string | null;
  eternal: boolean;
}

interface BuilderState {
  name: string;
  description: string;
  dollars: number;
  hands: number;
  discards: number;
  handSize: number;
  jokers: SelectedJoker[];
  consumables: PickerItem[];
  vouchers: PickerItem[];
  deckCards: DeckCard[];
  bannedBlinds: PickerItem[];
  bannedJokers: PickerItem[];
  bannedConsumables: PickerItem[];
  bannedVouchers: PickerItem[];
}

let jokerUid = 0;
function nextJokerUid() {
  return ++jokerUid;
}

// ---- Helpers ----

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "untitled"
  );
}

function buildChallengeJson(state: BuilderState): ChallengeJson {
  const allStandard = state.deckCards.every(
    (c) =>
      c.count === 1 &&
      c.instances.every((i) => !i.enhancement && !i.edition && !i.seal),
  );
  const json: ChallengeJson = {
    key: slugify(state.name),
    name: state.name || "Untitled Challenge",
    jokers: state.jokers.map((j) => {
      const out: ChallengeJson["jokers"][number] = { id: j.item.id };
      if (j.edition) out.edition = j.edition.replace(/^e_/, "");
      if (j.eternal) out.eternal = true;
      return out;
    }),
    deck: { type: "Challenge Deck" },
  };
  if (
    state.dollars !== 4 ||
    state.hands !== 4 ||
    state.discards !== 3 ||
    state.handSize !== 8
  ) {
    const modifiers: { id: string; value: number }[] = [];
    if (state.dollars !== 4)
      modifiers.push({ id: "dollars", value: state.dollars });
    if (state.hands !== 4) modifiers.push({ id: "hands", value: state.hands });
    if (state.discards !== 3)
      modifiers.push({ id: "discards", value: state.discards });
    if (state.handSize !== 8)
      modifiers.push({ id: "hand_size", value: state.handSize });
    json.rules = { ...json.rules, modifiers };
  }
  if (state.consumables.length > 0) {
    json.consumeables = state.consumables.map((c) => ({ id: c.id }));
  }
  if (state.vouchers.length > 0) {
    json.vouchers = state.vouchers.map((v) => ({ id: v.id }));
  }
  if (!allStandard) {
    // --- Suit-level analysis ---
    const suitShort: Record<string, string> = {
      Hearts: "H",
      Clubs: "C",
      Diamonds: "D",
      Spades: "S",
    };
    const rankShort: Record<string, string> = {
      A: "A",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "8": "8",
      "9": "9",
      "10": "T",
      J: "J",
      Q: "Q",
      K: "K",
    };
    const suitNames = ["Hearts", "Clubs", "Diamonds", "Spades"];
    const rankNames = [
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
    ];

    const suitIncluded = new Set<string>();
    const suitExcluded = new Set<string>();
    let suitPartial = false;
    for (const s of suitNames) {
      const deckCards = state.deckCards.filter((c) => c.suit === s);
      if (deckCards.every((c) => c.count > 0)) suitIncluded.add(s);
      else if (deckCards.every((c) => c.count === 0)) suitExcluded.add(s);
      else suitPartial = true;
    }

    const rankIncluded = new Set<string>();
    const rankExcluded = new Set<string>();
    let rankPartial = false;
    for (const r of rankNames) {
      const deckCards = state.deckCards.filter((c) => c.rank === r);
      if (deckCards.every((c) => c.count > 0)) rankIncluded.add(r);
      else if (deckCards.every((c) => c.count === 0)) rankExcluded.add(r);
      else rankPartial = true;
    }

    const hasDuplicates = state.deckCards.some((c) => c.count > 1);
    const hasCustomCards = state.deckCards.some((c) =>
      c.instances?.some((i) => i.enhancement || i.edition || i.seal),
    );

    const deck: ChallengeJson["deck"] = { type: "Challenge Deck" };

    if (suitPartial || rankPartial || hasDuplicates || hasCustomCards) {
      // Mixed/duplicate/custom state — use cards array
      deck.cards = [];
      for (const c of state.deckCards) {
        const insts = c.instances || [];
        for (const inst of insts) {
          const entry: {
            s: string;
            r: string;
            e?: string;
            d?: string;
            g?: string;
          } = {
            s: suitShort[c.suit],
            r: rankShort[c.rank],
          };
          if (inst.enhancement) entry.e = inst.enhancement;
          if (inst.edition) entry.d = inst.edition.replace(/^e_/, "");
          if (inst.seal) entry.g = inst.seal;
          deck.cards.push(entry);
        }
      }
    } else {
      // Suit filters — prefer the shorter list (use abbreviations)
      if (
        suitIncluded.size > 0 &&
        suitIncluded.size < 4 &&
        suitIncluded.size <= suitExcluded.size
      ) {
        const yes: Record<string, true> = {};
        suitIncluded.forEach((s) => (yes[suitShort[s]] = true));
        deck.yes_suits = yes;
      } else if (suitExcluded.size > 0 && suitExcluded.size < 4) {
        const no: Record<string, true> = {};
        suitExcluded.forEach((s) => (no[suitShort[s]] = true));
        deck.no_suits = no;
      }

      // Rank filters — prefer the shorter list (use abbreviations)
      if (
        rankIncluded.size > 0 &&
        rankIncluded.size < 13 &&
        rankIncluded.size <= rankExcluded.size
      ) {
        const yes: Record<string, true> = {};
        rankIncluded.forEach((r) => (yes[rankShort[r]] = true));
        deck.yes_ranks = yes;
      } else if (rankExcluded.size > 0 && rankExcluded.size < 13) {
        const no: Record<string, true> = {};
        rankExcluded.forEach((r) => (no[rankShort[r]] = true));
        deck.no_ranks = no;
      }
    }

    json.deck = deck;
  }
  const bannedCards = [
    ...state.bannedJokers.map((j) => ({ id: j.id })),
    ...state.bannedConsumables.map((c) => ({ id: c.id })),
    ...state.bannedVouchers.map((v) => ({ id: v.id })),
  ];

  if (state.bannedBlinds.length > 0 || bannedCards.length > 0) {
    json.restrictions = {};
    if (bannedCards.length > 0) {
      json.restrictions.banned_cards = bannedCards;
    }
    if (state.bannedBlinds.length > 0) {
      json.restrictions.banned_other = state.bannedBlinds.map((b) => ({
        id: b.id,
        type: "blind",
      }));
    }
  }
  return json;
}

function toggleItem(items: PickerItem[], item: PickerItem): PickerItem[] {
  const exists = items.find((i) => i.id === item.id);
  if (exists) {
    return items.filter((i) => i.id !== item.id);
  }
  return [...items, item];
}

// Convert JSON deck filters back to DeckCard[] state
function applyDeckFilters(deck: {
  yes_suits?: Record<string, true>;
  no_suits?: Record<string, true>;
  yes_ranks?: Record<string, true>;
  no_ranks?: Record<string, true>;
  cards?: { s: string; r: string; e?: string; d?: string; g?: string }[];
}): DeckCard[] {
  const suitMap: Record<string, string> = {
    H: "Hearts",
    C: "Clubs",
    D: "Diamonds",
    S: "Spades",
  };
  const rankMap: Record<string, string> = {
    A: "A",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    T: "10",
    J: "J",
    Q: "Q",
    K: "K",
  };

  const cards = buildStandardDeck();

  // Handle explicit cards array
  if (deck.cards && deck.cards.length > 0) {
    // Group cards by suit+rank, collect instances
    const grouped: Record<
      string,
      { count: number; instances: CardInstance[] }
    > = {};
    for (const entry of deck.cards) {
      const suit = suitMap[entry.s];
      const rank = rankMap[entry.r];
      if (!suit || !rank) continue;
      const k = `${suit}-${rank}`;
      if (!grouped[k]) grouped[k] = { count: 0, instances: [] };
      grouped[k].count++;
      grouped[k].instances.push({
        enhancement: entry.e || null,
        edition: entry.d || null,
        seal: entry.g || null,
      });
    }
    return cards.map((c) => {
      const k = `${c.suit}-${c.rank}`;
      const g = grouped[k];
      if (g) {
        return { ...c, count: g.count, instances: g.instances };
      }
      return { ...c, count: 0, instances: [] };
    });
  }
  if (!deck.yes_suits && !deck.no_suits && !deck.yes_ranks && !deck.no_ranks) {
    return cards; // no filters
  }

  return cards.map((c) => {
    const suitShort = Object.entries(suitMap).find(
      ([, v]) => v === c.suit,
    )?.[0];
    const rankShort = Object.entries(rankMap).find(
      ([, v]) => v === c.rank,
    )?.[0];
    let count = 1;
    if (deck.yes_suits && suitShort && !deck.yes_suits[suitShort]) count = 0;
    if (deck.no_suits && suitShort && deck.no_suits[suitShort]) count = 0;
    if (deck.yes_ranks && rankShort && !deck.yes_ranks[rankShort]) count = 0;
    if (deck.no_ranks && rankShort && deck.no_ranks[rankShort]) count = 0;
    return { ...c, count };
  });
}

// ---- Sprites ----

const JOKER_SPRITE: SpriteConfig = {
  url: "/sprites/Jokers.png",
  width: 710,
  height: 1520,
  cellW: 71,
  cellH: 95,
};
const CONSUMABLE_SPRITE: SpriteConfig = {
  url: "/sprites/Tarots.png",
  width: 710,
  height: 570,
  cellW: 71,
  cellH: 95,
};
const VOUCHER_SPRITE: SpriteConfig = {
  url: "/sprites/Vouchers.png",
  width: 639,
  height: 380,
  cellW: 71,
  cellH: 95,
};
const BLIND_SPRITE = {
  src: "/sprites/BlindChips.png",
  sheetWidth: 1428,
  sheetHeight: 2108,
  cellWidth: 1428,
  cellHeight: 68,
} as const;

// ---- Steps ----

const STEPS = [
  { label: "Starting State", sub: "Jokers, consumables & vouchers" },
  { label: "Restrictions", sub: "Banned blinds & more" },
  { label: "Deck", sub: "Customize your playing cards" },
] as const;

// ---- Selected joker chips with settings ----

const EDITIONS: { id: string; label: string; color: string }[] = [
  { id: "e_foil", label: "Foil", color: "text-blue-300" },
  { id: "e_holo", label: "Holo", color: "text-fuchsia-400" },
  { id: "e_polychrome", label: "Poly", color: "text-amber-300" },
  { id: "e_negative", label: "Neg", color: "text-pink-400" },
];

// ---- Selected-item cards (reusable) ----

interface SpriteConfig {
  url: string;
  width: number;
  height: number;
  cellW: number;
  cellH: number;
}

function SelectedItemCard({
  item,
  sprite,
  variant = "default",
  onDelete,
  children,
}: {
  item: PickerItem;
  sprite: SpriteConfig;
  variant?: "default" | "banned";
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const isBanned = variant === "banned";

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border ${
        isBanned
          ? "bg-red-500/5 border-red-500/20"
          : "bg-white/5 border-white/5"
      }`}
    >
      {/* Sprite */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="rounded-sm"
          style={{
            width: sprite.cellW,
            height: sprite.cellH,
            backgroundImage: `url(${sprite.url})`,
            backgroundSize: `${sprite.width}px ${sprite.height}px`,
            backgroundPosition: `-${item.pos.x * sprite.cellW}px -${item.pos.y * sprite.cellH}px`,
            imageRendering: "pixelated",
          }}
        />
        <span
          className={`text-xs text-center leading-tight max-w-[71px] truncate ${
            isBanned ? "text-red-300/80" : "text-white/60"
          }`}
        >
          {item.name}
        </span>
      </div>

      {/* Settings */}
      {children && (
        <div className="flex flex-col gap-2 justify-center">{children}</div>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className={`self-start text-xs p-1 ${
          isBanned
            ? "text-red-500/30 hover:text-red-400"
            : "text-white/20 hover:text-red-400"
        }`}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function SelectedItemList({
  children,
  placeholderLabel = "None selected",
}: {
  children: React.ReactNode;
  placeholderLabel?: string;
}) {
  const hasItems = React.Children.count(children) > 0;
  return (
    <div className="flex flex-wrap gap-4 min-h-[130px]">
      {!hasItems && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/[0.03] border border-dashed border-white/10 text-xs text-white/20">
          {placeholderLabel}
        </span>
      )}
      {children}
    </div>
  );
}

// ---- Boss blind tooltips ----

const BOSS_BLIND_TEXTS: Record<string, string[]> = {
  bl_arm: ["Decrease level of", "played poker hand"],
  bl_club: ["All Club cards", "are debuffed"],
  bl_eye: ["No repeat hand", "types this round"],
  bl_final_acorn: ["Flips and shuffles", "all Joker cards"],
  bl_final_bell: ["Forces 1 card to", "always be selected"],
  bl_final_heart: ["One random Joker", "disabled every hand"],
  bl_final_leaf: ["All cards debuffed", "until 1 Joker sold"],
  bl_final_vessel: ["Very large blind"],
  bl_fish: ["Cards drawn face down", "after each hand played"],
  bl_flint: ["Base Chips and", "Mult are halved"],
  bl_goad: ["All Spade cards", "are debuffed"],
  bl_head: ["All Heart cards", "are debuffed"],
  bl_hook: ["Discards 2 random", "cards per hand played"],
  bl_house: ["First hand is", "drawn face down"],
  bl_manacle: ["-1 Hand Size"],
  bl_mark: ["All face cards are", "drawn face down"],
  bl_mouth: ["Play only 1 hand", "type this round"],
  bl_needle: ["Play only 1 hand"],
  bl_ox: ["Playing a most played", "hand sets money to $0"],
  bl_pillar: ["Cards played previously", "this Ante are debuffed"],
  bl_plant: ["All face cards", "are debuffed"],
  bl_psychic: ["Must play 5 cards"],
  bl_serpent: ["After Play or Discard,", "always draw 3 cards"],
  bl_tooth: ["Lose $1 per", "card played"],
  bl_wall: ["Extra large blind"],
  bl_water: ["Start with", "0 discards"],
  bl_wheel: ["1 in 7 cards get", "drawn face down"],
  bl_window: ["All Diamond cards", "are debuffed"],
};

function BossBlindPicker({
  blinds,
  selected,
  onToggle,
}: {
  blinds: PickerItem[];
  selected: PickerItem[];
  onToggle: (item: PickerItem) => void;
}) {
  const [tooltip, setTooltip] = useState<{
    text: string[];
    x: number;
    y: number;
  } | null>(null);
  const bossBlinds = blinds.filter((b) => (b as { boss?: unknown }).boss);

  return (
    <div className="flex flex-wrap gap-2">
      {bossBlinds.map((blind) => {
        const isSelected = selected.some((s) => s.id === blind.id);
        const desc = BOSS_BLIND_TEXTS[blind.id];
        return (
          <button
            key={blind.id}
            onClick={() => onToggle(blind)}
            onMouseEnter={(e) => {
              if (!desc) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                text: desc,
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isSelected
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/5"
            }`}
          >
            {blind.pos && (
              <SpriteIcon
                src={BLIND_SPRITE.src}
                pos={blind.pos}
                sheetWidth={BLIND_SPRITE.sheetWidth}
                sheetHeight={BLIND_SPRITE.sheetHeight}
                cellWidth={BLIND_SPRITE.cellWidth}
                cellHeight={BLIND_SPRITE.cellHeight}
                displayHeight={20}
                displayWidth={20}
              />
            )}
            {blind.name}
          </button>
        );
      })}
      {tooltip &&
        createPortal(
          <div
            className="fixed px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg shadow-xl pointer-events-none z-50 max-w-48"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            {tooltip.text.map((line, i) => (
              <p key={i} className="text-xs text-white/70 leading-snug">
                {line}
              </p>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

// ---- Main View ----

export default function BuildView({
  jokers,
  descriptions,
  consumables,
  vouchers,
  blinds,
  editCode,
  initialDraft,
  isGuest,
}: BuilderData) {
  // Build initial state from server-loaded draft (no loading flash)
  function buildInitialState(): BuilderState {
    if (!initialDraft) {
      return {
        name: "",
        description: "",
        dollars: 4,
        hands: 4,
        discards: 3,
        handSize: 8,
        jokers: [],
        consumables: [],
        vouchers: [],
        deckCards: buildStandardDeck(),
        bannedBlinds: [],
        bannedJokers: [],
        bannedConsumables: [],
        bannedVouchers: [],
      };
    }

    const json = initialDraft.json_data as {
      key?: string;
      name?: string;
      jokers?: { id: string; edition?: string; eternal?: boolean }[];
      consumeables?: { id: string }[];
      vouchers?: { id: string }[];
      dollars?: number;
      hands?: number;
      discards?: number;
      hand_size?: number;
      deck?: {
        yes_suits?: Record<string, true>;
        no_suits?: Record<string, true>;
        yes_ranks?: Record<string, true>;
        no_ranks?: Record<string, true>;
        cards?: { s: string; r: string; e?: string; d?: string; g?: string }[];
      };
      restrictions?: {
        banned_cards?: { id: string }[];
        banned_other?: { id: string; type: string }[];
      };
    };

    return {
      name: initialDraft.name || "",
      description: initialDraft.description || "",
      dollars: json.dollars ?? 4,
      hands: json.hands ?? 4,
      discards: json.discards ?? 3,
      handSize: json.hand_size ?? 8,
      jokers: (json.jokers || [])
        .map((j) => {
          const item = jokers.find((gj) => gj.id === j.id);
          if (!item) return null;
          return {
            uid: nextJokerUid(),
            item,
            edition: j.edition || null,
            eternal: !!j.eternal,
          };
        })
        .filter(Boolean) as SelectedJoker[],
      consumables: (json.consumeables || [])
        .map((c) => consumables.find((gc) => gc.id === c.id))
        .filter(Boolean) as PickerItem[],
      vouchers: (json.vouchers || [])
        .map((v) => vouchers.find((gv) => gv.id === v.id))
        .filter(Boolean) as PickerItem[],
      deckCards: applyDeckFilters(json.deck || {}),
      bannedBlinds: (json.restrictions?.banned_other || [])
        .filter((b) => b.type === "blind")
        .map((b) => blinds.find((gb) => gb.id === b.id))
        .filter(Boolean) as PickerItem[],
      bannedJokers: (json.restrictions?.banned_cards || [])
        .map((c) => jokers.find((gj) => gj.id === c.id))
        .filter(Boolean) as PickerItem[],
      bannedConsumables: (json.restrictions?.banned_cards || [])
        .map((c) => consumables.find((gc) => gc.id === c.id))
        .filter(Boolean) as PickerItem[],
      bannedVouchers: (json.restrictions?.banned_cards || [])
        .map((c) => vouchers.find((gv) => gv.id === c.id))
        .filter(Boolean) as PickerItem[],
    };
  }

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>(buildInitialState);
  const [code, setCode] = useState<string | null>(editCode);
  const [status, setStatus] = useState<string | null>(
    initialDraft?.status ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const router = useRouter();
  const nameValid = state.name.trim().length >= 3;

  const preview = useMemo(() => buildChallengeJson(state), [state]);

  const update = (patch: Partial<BuilderState>) =>
    setState((s) => ({ ...s, ...patch }));

  // ---- API handlers ----

  async function handleSaveDraft() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        type: "challenge",
        name: state.name || "Untitled Challenge",
        description: state.description || undefined,
        json_data: preview,
      };

      let res: Response;
      if (code) {
        // Update existing draft
        res = await fetch(`/api/content/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new draft
        res = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (!code) {
        setCode(data.code);
        router.replace(`/build?code=${data.code}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!code) return;
    setError(null);

    // Client-side publish validation
    const parsed = publishValidationSchema.safeParse({
      description: state.description || "",
      bannedBlindCount: state.bannedBlinds.length,
      deckCardCount: state.deckCards.reduce((sum, c) => sum + c.count, 0),
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => i.message)
          .join(" "),
      );
      return;
    }

    setPublishing(true);
    try {
      const payload =
        status === "published"
          ? {
              name: state.name || "Untitled Challenge",
              description: state.description || undefined,
              json_data: preview,
            }
          : undefined;

      const res = await fetch(`/api/content/${code}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details?.fieldErrors
          ? Object.values(data.details.fieldErrors).flat().join("; ")
          : null;
        throw new Error(detail || data.error || "Failed to publish");
      }
      const isFirstPublish = status !== "published";
      setStatus("published");
      if (isFirstPublish) {
        setShowPublishedModal(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!code) return;
    setShowUnpublishConfirm(false);
    setError(null);
    setPublishing(true);
    try {
      const res = await fetch(`/api/content/${code}/publish`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unpublish");
      setCode(data.code);
      setStatus("draft");
      router.replace(`/build?code=${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-neutral-950/90 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">
            Challenge: {state.name || "Untitled"}
          </h1>
          {status && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                status === "published"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {status === "published" ? "Published" : "Draft"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {code && (
            <CodeDisplay code={code!} size="sm" label="Code:" />
          )}
          {error && <span className="text-sm text-red-400">{error}</span>}
          {status !== "published" && (
            <button
              onClick={handleSaveDraft}
              disabled={saving || !nameValid}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          )}
          {status === "published" ? (
            <>
              <button
                onClick={handlePublish}
                disabled={publishing || isGuest}
                title={isGuest ? "Log in with Discord to publish" : undefined}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {publishing ? "Saving…" : "Publish Changes"}
              </button>
              <button
                onClick={() => setShowUnpublishConfirm(true)}
                disabled={publishing || isGuest}
                title={isGuest ? "Log in with Discord to manage publish status" : undefined}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Unpublish
              </button>
            </>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || !code || isGuest}
              title={isGuest ? "Log in with Discord to publish" : undefined}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="sticky top-[7.25rem] z-10 border-b border-amber-500/20 bg-amber-500/5 px-6 py-2">
          <p className="text-xs text-amber-400/80">
            You&apos;re logged in as a guest — challenges cannot be published.{" "}
            <a href="/api/auth/login" className="underline hover:text-amber-300">
              Log in with Discord
            </a>{" "}
            to keep and publish your work.
          </p>
        </div>
      )}

      <div className="flex">
        {/* Form */}
        <div className="flex-1 p-6 max-w-4xl">
          {/* Name + Description — always visible */}
          <section className="space-y-4 mb-8">
            <input
              type="text"
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Challenge Name"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-lg font-semibold placeholder-white/20 outline-none focus:border-white/30"
            />
            {!nameValid && state.name.length > 0 && (
              <p className="text-xs text-amber-400">
                Name must be at least 3 characters
              </p>
            )}
            <input
              type="text"
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Short description (optional)"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder-white/20 outline-none focus:border-white/30"
            />
          </section>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    i === step
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium ${
                      i === step
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="text-left">
                    <div className="font-medium leading-tight">{s.label}</div>
                    <div className="text-[10px] text-white/30 leading-tight hidden sm:block">
                      {s.sub}
                    </div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="text-white/10">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Starting State */}
          {step === 0 && (
            <div className="space-y-8">
              <section className="space-y-3">
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Starting Money
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-lg">$</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={state.dollars}
                    onChange={(e) =>
                      update({ dollars: parseInt(e.target.value) || 0 })
                    }
                    className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 text-center"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Starting Stats
                </label>
                <div className="flex gap-6">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/40">Hands</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={state.hands}
                      onChange={(e) =>
                        update({ hands: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/40">Discards</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={state.discards}
                      onChange={(e) =>
                        update({ discards: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/40">Hand Size</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={state.handSize}
                      onChange={(e) =>
                        update({ handSize: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 text-center"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Starting Jokers{" "}
                  {state.jokers.length > 0 && (
                    <span className="text-white/40 font-normal">
                      ({state.jokers.length})
                    </span>
                  )}
                </h3>
                <SelectedItemList>
                  {state.jokers.map((joker, idx) => (
                    <SelectedItemCard
                      key={joker.uid}
                      item={joker.item}
                      sprite={JOKER_SPRITE}
                      onDelete={() => {
                        const next = state.jokers.filter((_, i) => i !== idx);
                        update({ jokers: next });
                      }}
                    >
                      {/* Edition */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/30 uppercase tracking-wide">
                          Edition
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const next = [...state.jokers];
                              next[idx] = { ...joker, edition: null };
                              update({ jokers: next });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              !joker.edition
                                ? "bg-white/10 text-white"
                                : "bg-white/5 text-white/30 hover:text-white/60"
                            }`}
                          >
                            None
                          </button>
                          {EDITIONS.map((ed) => (
                            <button
                              key={ed.id}
                              onClick={() => {
                                const next = [...state.jokers];
                                next[idx] = { ...joker, edition: ed.id };
                                update({ jokers: next });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                                joker.edition === ed.id
                                  ? `bg-white/10 ${ed.color}`
                                  : "bg-white/5 text-white/30 hover:text-white/60"
                              }`}
                            >
                              {ed.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eternal toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-white/30 uppercase tracking-wide">
                          Eternal
                        </span>
                        <button
                          onClick={() => {
                            const next = [...state.jokers];
                            next[idx] = { ...joker, eternal: !joker.eternal };
                            update({ jokers: next });
                          }}
                          className={`w-8 h-4 rounded-full transition-colors relative ${
                            joker.eternal ? "bg-emerald-500" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                              joker.eternal
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </label>
                    </SelectedItemCard>
                  ))}
                </SelectedItemList>
                <JokerPicker
                  items={jokers}
                  descriptions={descriptions}
                  onSelect={(item) =>
                    update({
                      jokers: [
                        ...state.jokers,
                        {
                          uid: nextJokerUid(),
                          item,
                          edition: null,
                          eternal: false,
                        },
                      ],
                    })
                  }
                  placeholder="Add a joker…"
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Starting Consumables{" "}
                  {state.consumables.length > 0 && (
                    <span className="text-white/40 font-normal">
                      ({state.consumables.length})
                    </span>
                  )}
                </h3>
                <SelectedItemList>
                  {state.consumables.map((item, idx) => (
                    <SelectedItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      sprite={CONSUMABLE_SPRITE}
                      onDelete={() => {
                        const next = state.consumables.filter(
                          (_, i) => i !== idx,
                        );
                        update({ consumables: next });
                      }}
                    />
                  ))}
                </SelectedItemList>
                <ConsumablePicker
                  items={consumables}
                  onSelect={(item) =>
                    update({
                      consumables: [...state.consumables, item],
                    })
                  }
                  placeholder="Add a consumable…"
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Starting Vouchers{" "}
                  {state.vouchers.length > 0 && (
                    <span className="text-white/40 font-normal">
                      ({state.vouchers.length})
                    </span>
                  )}
                </h3>
                <SelectedItemList>
                  {state.vouchers.map((item, idx) => (
                    <SelectedItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      sprite={VOUCHER_SPRITE}
                      onDelete={() => {
                        const next = state.vouchers.filter((_, i) => i !== idx);
                        update({ vouchers: next });
                      }}
                    />
                  ))}
                </SelectedItemList>
                <VoucherPicker
                  items={vouchers}
                  onSelect={(item) =>
                    update({ vouchers: toggleItem(state.vouchers, item) })
                  }
                  placeholder="Add a voucher…"
                />
              </section>
            </div>
          )}

          {/* Step 2: Restrictions */}
          {step === 1 && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Restricted Blinds{" "}
                  {state.bannedBlinds.length > 0 && (
                    <span className="text-white/40 font-normal">
                      ({state.bannedBlinds.length})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/30">
                  Ban specific boss blinds so they never appear during this
                  challenge. Hover for details.
                </p>
                <BossBlindPicker
                  blinds={blinds}
                  selected={state.bannedBlinds}
                  onToggle={(item) =>
                    update({
                      bannedBlinds: toggleItem(state.bannedBlinds, item),
                    })
                  }
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Banned Jokers{" "}
                    {state.bannedJokers.length > 0 && (
                      <span className="text-white/40 font-normal">
                        ({state.bannedJokers.length})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => update({ bannedJokers: [...jokers] })}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] transition-colors"
                  >
                    Ban all
                  </button>
                </div>
                <SelectedItemList>
                  {state.bannedJokers.map((item, idx) => (
                    <SelectedItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      sprite={JOKER_SPRITE}
                      variant="banned"
                      onDelete={() => {
                        const next = state.bannedJokers.filter(
                          (_, i) => i !== idx,
                        );
                        update({ bannedJokers: next });
                      }}
                    />
                  ))}
                </SelectedItemList>
                <JokerPicker
                  items={jokers}
                  descriptions={descriptions}
                  onSelect={(item) =>
                    update({
                      bannedJokers: toggleItem(state.bannedJokers, item),
                    })
                  }
                  placeholder="Ban a joker…"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Banned Consumables{" "}
                    {state.bannedConsumables.length > 0 && (
                      <span className="text-white/40 font-normal">
                        ({state.bannedConsumables.length})
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        update({ bannedConsumables: [...consumables] })
                      }
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] transition-colors"
                    >
                      Ban all
                    </button>
                    <button
                      onClick={() => {
                        const planets = consumables.filter(
                          (c) => c.set === "Planet",
                        );
                        const existingIds = new Set(
                          state.bannedConsumables.map((c) => c.id),
                        );
                        const merged = [
                          ...state.bannedConsumables,
                          ...planets.filter((p) => !existingIds.has(p.id)),
                        ];
                        update({ bannedConsumables: merged });
                      }}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] transition-colors"
                    >
                      Planets
                    </button>
                    <button
                      onClick={() => {
                        const tarots = consumables.filter(
                          (c) => c.set === "Tarot",
                        );
                        const existingIds = new Set(
                          state.bannedConsumables.map((c) => c.id),
                        );
                        const merged = [
                          ...state.bannedConsumables,
                          ...tarots.filter((t) => !existingIds.has(t.id)),
                        ];
                        update({ bannedConsumables: merged });
                      }}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] transition-colors"
                    >
                      Tarots
                    </button>
                    <button
                      onClick={() => {
                        const spectrals = consumables.filter(
                          (c) => c.set === "Spectral",
                        );
                        const existingIds = new Set(
                          state.bannedConsumables.map((c) => c.id),
                        );
                        const merged = [
                          ...state.bannedConsumables,
                          ...spectrals.filter((s) => !existingIds.has(s.id)),
                        ];
                        update({ bannedConsumables: merged });
                      }}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] transition-colors"
                    >
                      Spectrals
                    </button>
                  </div>
                </div>
                <SelectedItemList>
                  {state.bannedConsumables.map((item, idx) => (
                    <SelectedItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      sprite={CONSUMABLE_SPRITE}
                      variant="banned"
                      onDelete={() => {
                        const next = state.bannedConsumables.filter(
                          (_, i) => i !== idx,
                        );
                        update({ bannedConsumables: next });
                      }}
                    />
                  ))}
                </SelectedItemList>
                <ConsumablePicker
                  items={consumables}
                  onSelect={(item) =>
                    update({
                      bannedConsumables: toggleItem(
                        state.bannedConsumables,
                        item,
                      ),
                    })
                  }
                  placeholder="Ban a consumable…"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Banned Vouchers{" "}
                    {state.bannedVouchers.length > 0 && (
                      <span className="text-white/40 font-normal">
                        ({state.bannedVouchers.length})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() =>
                      update({ bannedVouchers: [...vouchers] })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] transition-colors"
                  >
                    Ban all
                  </button>
                </div>
                <SelectedItemList>
                  {state.bannedVouchers.map((item, idx) => (
                    <SelectedItemCard
                      key={`${item.id}-${idx}`}
                      item={item}
                      sprite={VOUCHER_SPRITE}
                      variant="banned"
                      onDelete={() => {
                        const next = state.bannedVouchers.filter(
                          (_, i) => i !== idx,
                        );
                        update({ bannedVouchers: next });
                      }}
                    />
                  ))}
                </SelectedItemList>
                <VoucherPicker
                  items={vouchers}
                  onSelect={(item) =>
                    update({
                      bannedVouchers: toggleItem(state.bannedVouchers, item),
                    })
                  }
                  placeholder="Ban a voucher…"
                />
              </section>
            </div>
          )}

          {/* Step 3: Deck */}
          {step === 2 && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                  Deck
                </h3>
                <DeckEditor
                  cards={state.deckCards}
                  onChange={(cards) => update({ deckCards: cards })}
                />
              </section>
            </div>
          )}

          {/* Step navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors disabled:opacity-30"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === STEPS.length - 1}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        {/* JSON Preview sidebar */}
        <div className="w-96 border-l border-white/5 p-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-auto">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-3">
            Preview
          </h3>
          <pre className="bg-white/5 rounded-lg p-4 text-xs font-mono text-white/70 leading-relaxed overflow-auto max-h-[calc(100vh-10rem)]">
            {JSON.stringify(preview, null, 2)}
          </pre>
          <button
            onClick={() =>
              navigator.clipboard.writeText(JSON.stringify(preview, null, 2))
            }
            className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors"
          >
            Copy JSON
          </button>
        </div>
      </div>

      {/* Unpublish confirmation dialog */}
      {showUnpublishConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">Unpublish Challenge?</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                This will change the challenge code and make it{" "}
                <strong className="text-white/80">
                  completely unavailable
                </strong>{" "}
                to anyone who has the current link. You can re-publish it later,
                but the old code will never work again.
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowUnpublishConfirm(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnpublish}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium transition-colors"
                >
                  Unpublish
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* First-publish success modal */}
      {showPublishedModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">Challenge Published!</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Your challenge is now live! Other players can find it on the
                Explore page. To play it in-game, install the Challenge
                Loader mod and enter the code{" "}
                <CodeDisplay code={code!} size="sm" variant="bright" /> on
                the Challenges screen.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPublishedModal(false)}
                  className="px-6 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
