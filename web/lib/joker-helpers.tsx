import { type PickerItem } from "@/components/item-picker";
import { DescriptionText } from "@/lib/description-parser";

export const RARITY_LABELS: Record<number, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Legendary",
};

export const RARITY_COLORS: Record<number, string> = {
  1: "text-white/60",
  2: "text-green-400",
  3: "text-amber-400",
  4: "text-fuchsia-400",
};

/**
 * Title formatter for joker pickers: "Joker Name (Rarity, $Cost) — description"
 */
export function jokerPickerTitle(
  item: PickerItem,
  descriptions: Record<string, string[]>,
): string {
  const rarity = RARITY_LABELS[item.rarity as number] || "";
  const rawLines = descriptions[item.id] || [];
  const text = rawLines.join(" · ").replace(/\{[^}]*\}/g, "");
  return `${item.name} (${rarity}, $${item.cost})${text ? " — " + text : ""}`;
}

/**
 * Tooltip renderer for joker pickers: name, rarity line, description.
 */
export function jokerPickerTooltip(
  item: PickerItem,
  descriptions: Record<string, string[]>,
): React.ReactNode {
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
          <DescriptionText
            lines={descLines}
            config={item.config as Record<string, unknown>}
          />
        </p>
      )}
    </div>
  );
}
