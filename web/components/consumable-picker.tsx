"use client";

import ItemPicker, { type PickerItem } from "@/components/item-picker";

const SET_COLORS: Record<string, string> = {
  Tarot: "text-purple-400",
  Planet: "text-blue-400",
  Spectral: "text-amber-400",
};

interface ConsumablePickerProps {
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  placeholder?: string;
}

export default function ConsumablePicker({
  items,
  onSelect,
  placeholder = "Search consumables...",
}: ConsumablePickerProps) {
  return (
    <ItemPicker
      items={items}
      spriteUrl="/sprites/Tarots.png"
      spriteWidth={710}
      spriteHeight={570}
      cellWidth={71}
      cellHeight={95}
      onSelect={onSelect}
      placeholder={placeholder}
      getTitle={(item) => {
        const set = (item.set as string) || "";
        const effect = (item.effect as string) || "";
        return `${item.name} (${set}${effect ? ", " + effect : ""}, $${item.cost})`;
      }}
      renderTooltip={(item) => {
        const set = item.set as string;
        const effect = item.effect as string | undefined;
        return (
          <div className="text-xs space-y-1 min-w-32 max-w-56">
            <p className="font-semibold text-sm text-white">{item.name}</p>
            <p className={SET_COLORS[set] || "text-white/60"}>
              {set || "Unknown"} · ${item.cost as number}
            </p>
            {effect && (
              <p className="text-white/60 leading-relaxed">{effect}</p>
            )}
          </div>
        );
      }}
    />
  );
}
