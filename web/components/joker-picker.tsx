"use client";

import ItemPicker, { type PickerItem } from "@/components/item-picker";
import { jokerPickerTitle, jokerPickerTooltip } from "@/lib/joker-helpers";

interface JokerPickerProps {
  items: PickerItem[];
  descriptions: Record<string, string[]>;
  onSelect: (item: PickerItem) => void;
  placeholder?: string;
}

export default function JokerPicker({
  items,
  descriptions,
  onSelect,
  placeholder = "Search jokers...",
}: JokerPickerProps) {
  return (
    <ItemPicker
      items={items}
      spriteUrl="/sprites/Jokers.png"
      spriteWidth={710}
      spriteHeight={1520}
      cellWidth={71}
      cellHeight={95}
      onSelect={onSelect}
      placeholder={placeholder}
      getTitle={(item) => jokerPickerTitle(item, descriptions)}
      renderTooltip={(item) => jokerPickerTooltip(item, descriptions)}
    />
  );
}
