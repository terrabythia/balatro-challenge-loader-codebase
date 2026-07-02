"use client";

import ItemPicker, { type PickerItem } from "@/components/item-picker";
import { DescriptionText } from "@/lib/description-parser";

const RARITY_LABELS: Record<number, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Legendary",
};

const RARITY_COLORS: Record<number, string> = {
  1: "text-white/60",
  2: "text-green-400",
  3: "text-amber-400",
  4: "text-fuchsia-400",
};

interface Props {
  jokers: PickerItem[];
  descriptions: Record<string, string[]>;
}

export default function TestPickerView({ jokers, descriptions }: Props) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Joker Picker</h1>

      <div className="max-w-3xl">
        <ItemPicker
          items={jokers}
          spriteUrl="/sprites/Jokers.png"
          spriteWidth={710}
          spriteHeight={1520}
          cellWidth={71}
          cellHeight={95}
          onSelect={(item) => console.log("Selected:", item.name, item.id)}
          placeholder="Search jokers..."
          getTitle={(item) => {
            const rarity = RARITY_LABELS[item.rarity as number] || "";
            const rawLines = descriptions[item.id] || [];
            // Strip tags for plain-text title
            const text = rawLines.join(" · ").replace(/\{[^}]*\}/g, "");
            return `${item.name} (${rarity}, $${item.cost})${text ? " — " + text : ""}`;
          }}
          renderTooltip={(item) => {
            const rarity = item.rarity as number;
            const descLines = descriptions[item.id] || [];
            return (
              <div className="text-xs space-y-1 min-w-36 max-w-56">
                <p className="font-semibold text-sm text-white">{item.name}</p>
                <p className={RARITY_COLORS[rarity] || "text-white/60"}>
                  {RARITY_LABELS[rarity] || "Unknown"} · ${String(item.cost)}
                </p>
                {descLines.length > 0 && (
                  <p className="leading-relaxed text-balance">
                    <DescriptionText lines={descLines} config={item.config as Record<string, unknown>} />
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </main>
  );
}
