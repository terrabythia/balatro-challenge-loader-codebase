"use client";

import ItemPicker, { type PickerItem } from "@/components/item-picker";
import { jokerPickerTitle, jokerPickerTooltip } from "@/lib/joker-helpers";

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
          getTitle={(item) => jokerPickerTitle(item, descriptions)}
          renderTooltip={(item) => jokerPickerTooltip(item, descriptions)}
        />
      </div>
    </main>
  );
}
