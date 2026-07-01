"use client";

import { useState, useMemo } from "react";
import JokerPicker from "@/components/joker-picker";
import ConsumablePicker from "@/components/consumable-picker";
import VoucherPicker from "@/components/voucher-picker";
import { type PickerItem } from "@/components/item-picker";
import DeckEditor, { buildStandardDeck, type DeckCard } from "@/components/deck-editor";

// ---- Types ----

interface BuilderData {
  jokers: PickerItem[];
  descriptions: Record<string, string[]>;
  consumables: PickerItem[];
  vouchers: PickerItem[];
  blinds: PickerItem[];
}

interface ChallengeJson {
  key: string;
  name: string;
  jokers: { id: string }[];
  consumeables?: { id: string }[];
  vouchers?: { id: string }[];
  deck?: { type: string; cards?: { suit: string; rank: string }[] };
  restrictions?: {
    banned_other?: { id: string; type: string }[];
  };
}

// ---- Helpers ----

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60) || "untitled";
}

function buildChallengeJson(state: BuilderState): ChallengeJson {
  const allStandard = state.deckCards.every((c) => c.included);
  const json: ChallengeJson = {
    key: slugify(state.name),
    name: state.name || "Untitled Challenge",
    jokers: state.jokers.map((j) => ({ id: j.id })),
    deck: { type: "Challenge Deck" },
  };
  if (state.consumables.length > 0) {
    json.consumeables = state.consumables.map((c) => ({ id: c.id }));
  }
  if (state.vouchers.length > 0) {
    json.vouchers = state.vouchers.map((v) => ({ id: v.id }));
  }
  if (!allStandard) {
    json.deck = {
      type: "Challenge Deck",
      cards: state.deckCards
        .filter((c) => c.included)
        .map((c) => ({ suit: c.suit, rank: c.rank })),
    };
  }
  if (state.bannedBlinds.length > 0) {
    json.restrictions = {
      banned_other: state.bannedBlinds.map((b) => ({
        id: b.id,
        type: "blind",
      })),
    };
  }
  return json;
}

// ---- Selection helpers ----

function toggleItem(items: PickerItem[], item: PickerItem): PickerItem[] {
  const exists = items.find((i) => i.id === item.id);
  if (exists) {
    return items.filter((i) => i.id !== item.id);
  }
  return [...items, item];
}

// ---- State ----

interface BuilderState {
  name: string;
  description: string;
  jokers: PickerItem[];
  consumables: PickerItem[];
  vouchers: PickerItem[];
  deckCards: DeckCard[];
  bannedBlinds: PickerItem[];
}

// ---- Section component ----

function BuilderSection({
  title,
  items,
  onRemove,
  children,
}: {
  title: string;
  items: PickerItem[];
  onRemove: (item: PickerItem) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
        {title}{" "}
        {items.length > 0 && (
          <span className="text-white/40 font-normal">({items.length})</span>
        )}
      </h3>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onRemove(item)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg pl-1 pr-2 py-1 transition-colors group"
            >
              <span className="text-sm text-white/80 group-hover:text-red-300 truncate max-w-32">
                {item.name}
              </span>
              <span className="text-white/30 group-hover:text-red-400 text-xs">
                ✕
              </span>
            </button>
          ))}
        </div>
      )}

      {children}
    </section>
  );
}

// ---- Boss blind filter ----

function BossBlindPicker({
  blinds,
  selected,
  onToggle,
}: {
  blinds: PickerItem[];
  selected: PickerItem[];
  onToggle: (item: PickerItem) => void;
}) {
  const bossBlinds = blinds.filter((b) => (b as { boss?: unknown }).boss);

  return (
    <div className="flex flex-wrap gap-2">
      {bossBlinds.map((blind) => {
        const isSelected = selected.some((s) => s.id === blind.id);
        return (
          <button
            key={blind.id}
            onClick={() => onToggle(blind)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isSelected
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/5"
            }`}
          >
            {blind.name}
          </button>
        );
      })}
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
}: BuilderData) {
  const [state, setState] = useState<BuilderState>({
    name: "",
    description: "",
    jokers: [],
    consumables: [],
    vouchers: [],
    deckCards: buildStandardDeck(),
    bannedBlinds: [],
  });
  const [code, setCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => buildChallengeJson(state), [state]);

  const update = (patch: Partial<BuilderState>) =>
    setState((s) => ({ ...s, ...patch }));

  // ---- API handlers ----

  async function handleSaveDraft() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "challenge",
          name: state.name || "Untitled Challenge",
          description: state.description || undefined,
          json_data: preview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }
      setCode(data.code);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!code) return;
    setError(null);
    setPublishing(true);
    try {
      const res = await fetch(`/api/content/${code}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish");
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Challenge Builder</h1>
        <div className="flex items-center gap-3">
          {code && (
            <span className="text-sm text-white/40 font-mono">
              Code: {code}
            </span>
          )}
          {error && (
            <span className="text-sm text-red-400">{error}</span>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !code}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Form */}
        <div className="flex-1 p-6 space-y-8 max-w-4xl">
          {/* Name + Description */}
          <section className="space-y-4">
            <input
              type="text"
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Challenge Name"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-lg font-semibold placeholder-white/20 outline-none focus:border-white/30"
            />
            <input
              type="text"
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Short description (optional)"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder-white/20 outline-none focus:border-white/30"
            />
          </section>

          {/* Jokers */}
          <BuilderSection
            title="Starting Jokers"
            items={state.jokers}
            onRemove={(item) =>
              update({ jokers: state.jokers.filter((j) => j.id !== item.id) })
            }
          >
            <JokerPicker
              items={jokers}
              descriptions={descriptions}
              onSelect={(item) =>
                update({ jokers: toggleItem(state.jokers, item) })
              }
              placeholder="Add a joker…"
            />
          </BuilderSection>

          {/* Consumables */}
          <BuilderSection
            title="Starting Consumables"
            items={state.consumables}
            onRemove={(item) =>
              update({
                consumables: state.consumables.filter((c) => c.id !== item.id),
              })
            }
          >
            <ConsumablePicker
              items={consumables}
              onSelect={(item) =>
                update({ consumables: toggleItem(state.consumables, item) })
              }
              placeholder="Add a consumable…"
            />
          </BuilderSection>

          {/* Vouchers */}
          <BuilderSection
            title="Starting Vouchers"
            items={state.vouchers}
            onRemove={(item) =>
              update({
                vouchers: state.vouchers.filter((v) => v.id !== item.id),
              })
            }
          >
            <VoucherPicker
              items={vouchers}
              onSelect={(item) =>
                update({ vouchers: toggleItem(state.vouchers, item) })
              }
              placeholder="Add a voucher…"
            />
          </BuilderSection>

          {/* Deck */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Deck
            </h3>
            <DeckEditor
              cards={state.deckCards}
              onChange={(cards) => update({ deckCards: cards })}
            />
          </section>

          {/* Restrictions — Boss Blinds */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Restricted Blinds{" "}
              {state.bannedBlinds.length > 0 && (
                <span className="text-white/40 font-normal">
                  ({state.bannedBlinds.length})
                </span>
              )}
            </h3>
            <BossBlindPicker
              blinds={blinds}
              selected={state.bannedBlinds}
              onToggle={(item) =>
                update({ bannedBlinds: toggleItem(state.bannedBlinds, item) })
              }
            />
          </section>
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
            onClick={() => navigator.clipboard.writeText(JSON.stringify(preview, null, 2))}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors"
          >
            Copy JSON
          </button>
        </div>
      </div>
    </main>
  );
}
