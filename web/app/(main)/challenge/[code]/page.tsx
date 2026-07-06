import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import CodeDisplay from "@/components/code-display";
import SpriteIcon from "@/components/sprite-icon";

// Types matching the content table + aggregated fields
interface ChallengeRow {
  id: number;
  type: string;
  code: string;
  author_id: string | null;
  guest_id: string | null;
  name: string;
  description: string | null;
  tags: string[];
  json_data: Record<string, unknown>;
  sprite_url: string | null;
  status: "draft" | "published";
  downloads: number;
  plays: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
  author: string | null;
  avg_rating: number;
  rating_count: number;
}

// ---- Resolve IDs to friendly names using static game data ----

interface GameItem {
  id: string;
  name: string;
  set?: string;
  effect?: string;
  pos?: { x: number; y: number };
}

interface SpriteConfig {
  src: string;
  sheetWidth: number;
  sheetHeight: number;
  cellWidth: number;
  cellHeight: number;
}

const SPRITES: Record<string, SpriteConfig> = {
  joker: {
    src: "/sprites/Jokers.png",
    sheetWidth: 710,
    sheetHeight: 1520,
    cellWidth: 71,
    cellHeight: 95,
  },
  consumable: {
    src: "/sprites/Tarots.png",
    sheetWidth: 710,
    sheetHeight: 570,
    cellWidth: 71,
    cellHeight: 95,
  },
  voucher: {
    src: "/sprites/Vouchers.png",
    sheetWidth: 639,
    sheetHeight: 380,
    cellWidth: 71,
    cellHeight: 95,
  },
  blind: {
    src: "/sprites/BlindChips.png",
    sheetWidth: 1428,
    sheetHeight: 2108,
    cellWidth: 1428,
    cellHeight: 68,
  },
};

function loadLookup(filename: string): Map<string, GameItem> {
  const items: GameItem[] = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", filename),
      "utf-8",
    ),
  );
  return new Map(items.map((item) => [item.id, item]));
}

// ---- Sub-components ----

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-white/30">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
      {children}
    </h2>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/5 pt-6">
      <SectionHeader>{title}</SectionHeader>
      {children}
    </section>
  );
}

function EmptySection({ text }: { text: string }) {
  return <p className="text-sm text-white/20">{text}</p>;
}

interface ItemEntry {
  name: string;
  detail?: string;
  sprite?: SpriteConfig & { pos: { x: number; y: number }; displayWidth?: number };
}

function ItemList({
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
            />
          )}
          <span>
            {item.name}
            {item.detail && (
              <span className="ml-1.5 text-xs text-white/30">{item.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---- Page component ----

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Fetch challenge from DB
  const result = await db.query(
    `SELECT c.*, u.username as author,
            COALESCE(AVG(r.score)::float, 0) as avg_rating,
            COUNT(r.id)::int as rating_count
     FROM content c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE c.code = $1 AND c.type = 'challenge'
     GROUP BY c.id, u.username`,
    [code],
  );

  if (result.rows.length === 0) {
    notFound();
  }

  const challenge = result.rows[0] as ChallengeRow;
  const jsonData = challenge.json_data as Record<string, unknown>;

  // Load lookup tables
  const jokers = loadLookup("jokers.json");
  const consumables = loadLookup("consumables.json");
  const vouchers = loadLookup("vouchers.json");
  const blinds = loadLookup("blinds.json");

  // ---- Helper: build ItemEntry with sprite from lookup ----
  function spriteFor(
    item: GameItem | undefined,
    spriteConfig: SpriteConfig,
  ): ItemEntry["sprite"] {
    if (item?.pos) {
      return { ...spriteConfig, pos: item.pos };
    }
    return undefined;
  }

  // ---- Parse json_data into display sections ----

  // Starting jokers
  const startJokers: ItemEntry[] = ((jsonData.jokers as Array<{ id: string; edition?: string; eternal?: boolean }>) || []).map(
    (j) => {
      const item = jokers.get(j.id);
      const parts: string[] = [];
      if (j.edition) parts.push(j.edition.charAt(0).toUpperCase() + j.edition.slice(1));
      if (j.eternal) parts.push("Eternal");
      return {
        name: item?.name ?? j.id,
        detail: parts.length > 0 ? `(${parts.join(", ")})` : undefined,
        sprite: spriteFor(item, SPRITES.joker),
      };
    },
  );

  // Starting consumables
  const startConsumables: ItemEntry[] = (
    (jsonData.consumeables as Array<{ id: string }>) || []
  ).map((c) => {
    const item = consumables.get(c.id);
    return {
      name: item?.name ?? c.id,
      sprite: spriteFor(item, SPRITES.consumable),
    };
  });

  // Starting vouchers
  const startVouchers: ItemEntry[] = (
    (jsonData.vouchers as Array<{ id: string }>) || []
  ).map((v) => {
    const item = vouchers.get(v.id);
    return {
      name: item?.name ?? v.id,
      sprite: spriteFor(item, SPRITES.voucher),
    };
  });

  // Rules / modifiers (dollars, hands, discards, hand_size)
  const modifiers = (jsonData.rules as { modifiers?: Array<{ id: string; value: number | string | boolean }> } | undefined)
    ?.modifiers || [];

  const dollars = Number(
    modifiers.find((m) => m.id === "dollars")?.value ?? 4,
  );
  const hands = Number(
    modifiers.find((m) => m.id === "hands")?.value ?? 4,
  );
  const discards = Number(
    modifiers.find((m) => m.id === "discards")?.value ?? 3,
  );
  const handSize = Number(
    modifiers.find((m) => m.id === "hand_size")?.value ?? 8,
  );

  // Deck
  const deck = jsonData.deck as
    | {
        type?: string;
        yes_suits?: Record<string, boolean>;
        no_suits?: Record<string, boolean>;
        yes_ranks?: Record<string, boolean>;
        no_ranks?: Record<string, boolean>;
        cards?: Array<{
          s: string;
          r: string;
          e?: string;
          d?: string;
          g?: string;
        }>;
      }
    | undefined;

  const suitNames: Record<string, string> = {
    H: "Hearts",
    C: "Clubs",
    D: "Diamonds",
    S: "Spades",
  };
  const rankNames: Record<string, string> = {
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

  let deckSummary = "Standard 52-card deck";
  const deckDetail: string[] = [];

  if (deck?.yes_suits) {
    const suits = Object.keys(deck.yes_suits)
      .map((s) => suitNames[s] || s)
      .join(", ");
    deckDetail.push(`Suits: ${suits}`);
  }
  if (deck?.no_suits) {
    const suits = Object.keys(deck.no_suits)
      .map((s) => suitNames[s] || s)
      .join(", ");
    deckDetail.push(`No suits: ${suits}`);
  }
  if (deck?.yes_ranks) {
    const ranks = Object.keys(deck.yes_ranks)
      .map((r) => rankNames[r] || r)
      .join(", ");
    deckDetail.push(`Ranks: ${ranks}`);
  }
  if (deck?.no_ranks) {
    const ranks = Object.keys(deck.no_ranks)
      .map((r) => rankNames[r] || r)
      .join(", ");
    deckDetail.push(`No ranks: ${ranks}`);
  }
  if (deck?.cards && deck.cards.length > 0) {
    const enhancementNames: Record<string, string> = {
      m_bonus: "Bonus",
      m_mult: "Mult",
      m_wild: "Wild",
      m_glass: "Glass",
      m_steel: "Steel",
      m_stone: "Stone",
      m_gold: "Gold",
      m_lucky: "Lucky",
    };
    const cardDescs = deck.cards.map((c) => {
      const suit = suitNames[c.s] || c.s;
      const rank = rankNames[c.r] || c.r;
      const extras: string[] = [];
      if (c.e) extras.push(enhancementNames[c.e] || c.e);
      if (c.d) extras.push(c.d.charAt(0).toUpperCase() + c.d.slice(1));
      if (c.g) extras.push(c.g.charAt(0).toUpperCase() + c.g.slice(1));
      const extraStr = extras.length > 0 ? ` (${extras.join(", ")})` : "";
      return `${rank} of ${suit}${extraStr}`;
    });
    deckDetail.push(`${cardDescs.length} card${cardDescs.length !== 1 ? "s" : ""}: ${cardDescs.join(", ")}`);
    deckSummary = "Custom deck";
  }
  if (deckDetail.length > 0) {
    deckSummary = deckDetail.join(" · ");
  }

  // Banned items
  const restrictions = jsonData.restrictions as
    | {
        banned_cards?: Array<{ id: string }>;
        banned_other?: Array<{ id: string; type?: string }>;
      }
    | undefined;

  const bannedBlinds: ItemEntry[] = (restrictions?.banned_other || [])
    .filter((b) => b.type === "blind")
    .map((b) => {
      const item = blinds.get(b.id);
      return {
        name: item?.name ?? b.id,
        sprite: item?.pos
          ? { ...SPRITES.blind, pos: item.pos, displayWidth: 32 }
          : undefined,
      };
    });

  const bannedJokers: ItemEntry[] = (restrictions?.banned_cards || [])
    .filter((b) => b.id.startsWith("j_"))
    .map((b) => {
      const item = jokers.get(b.id);
      return {
        name: item?.name ?? b.id,
        sprite: spriteFor(item, SPRITES.joker),
      };
    });

  const bannedConsumablesFromCards: ItemEntry[] = (restrictions?.banned_cards || [])
    .filter((b) => b.id.startsWith("c_") || b.id.startsWith("p_"))
    .map((b) => {
      const item = consumables.get(b.id);
      return {
        name: item?.name ?? b.id,
        sprite: spriteFor(item, SPRITES.consumable),
      };
    });

  const bannedVouchersFromCards: ItemEntry[] = (restrictions?.banned_cards || [])
    .filter((b) => b.id.startsWith("v_"))
    .map((b) => {
      const item = vouchers.get(b.id);
      return {
        name: item?.name ?? b.id,
        sprite: spriteFor(item, SPRITES.voucher),
      };
    });

  const bannedOther: ItemEntry[] = (restrictions?.banned_other || [])
    .filter((b) => b.type !== "blind")
    .map((b) => ({
      name: b.id,
      detail: b.type ? `(${b.type})` : undefined,
    }));

  // ---- Render ----

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors"
      >
        ← Back to Explore
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{challenge.name}</h1>
            {challenge.author && (
              <p className="mt-1 text-sm text-white/40">
                by {challenge.author}
              </p>
            )}
          </div>
          <StatusBadge status={challenge.status} />
        </div>
        {challenge.description && (
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {challenge.description}
          </p>
        )}
        <div className="mt-3">
          <CodeDisplay code={challenge.code} size="xs" label="Code:" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge label="Plays" value={challenge.plays} />
        <StatBadge label="Downloads" value={challenge.downloads} />
        <StatBadge
          label="Win Rate"
          value={
            challenge.plays > 0
              ? `${Math.round((challenge.wins / challenge.plays) * 100)}%`
              : "—"
          }
        />
        <StatBadge
          label="Rating"
          value={
            challenge.rating_count > 0
              ? `★ ${challenge.avg_rating.toFixed(1)} (${challenge.rating_count})`
              : "—"
          }
        />
      </div>

      {/* Game overview */}
      <div className="space-y-6">
        {/* Starting conditions */}
        <Section title="Starting Conditions">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge label="Dollars" value={`$${dollars}`} />
            <StatBadge label="Hands" value={hands} />
            <StatBadge label="Discards" value={discards} />
            <StatBadge label="Hand Size" value={handSize} />
          </div>
        </Section>

        {/* Deck */}
        <Section title="Deck">
          <p className="text-sm text-white/70">{deckSummary}</p>
        </Section>

        {/* Starting jokers */}
        <Section title="Starting Jokers">
          <ItemList items={startJokers} empty="No starting jokers." />
        </Section>

        {/* Starting consumables */}
        <Section title="Starting Consumables">
          <ItemList
            items={startConsumables}
            empty="No starting consumables."
          />
        </Section>

        {/* Starting vouchers */}
        <Section title="Starting Vouchers">
          <ItemList items={startVouchers} empty="No starting vouchers." />
        </Section>

        {/* Banned items */}
        {bannedBlinds.length > 0 && (
          <Section title="Banned Blinds">
            <ItemList items={bannedBlinds} empty="" />
          </Section>
        )}
        {bannedJokers.length > 0 && (
          <Section title="Banned Jokers">
            <ItemList items={bannedJokers} empty="" />
          </Section>
        )}
        {bannedConsumablesFromCards.length > 0 && (
          <Section title="Banned Consumables">
            <ItemList items={bannedConsumablesFromCards} empty="" />
          </Section>
        )}
        {bannedVouchersFromCards.length > 0 && (
          <Section title="Banned Vouchers">
            <ItemList items={bannedVouchersFromCards} empty="" />
          </Section>
        )}
        {bannedOther.length > 0 && (
          <Section title="Banned Items">
            <ItemList items={bannedOther} empty="" />
          </Section>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-10 flex items-center gap-3">
        {challenge.status === "published" && (
          <a
            href={`/api/download-mod?code=${challenge.code}`}
            className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Download Mod
          </a>
        )}
        <a
          href={`/api/content/${challenge.code}/play`}
          className="rounded-lg border border-white/5 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white/60 hover:border-white/10 hover:text-white transition-colors"
        >
          Play Challenge
        </a>
      </div>
    </div>
  );
}
