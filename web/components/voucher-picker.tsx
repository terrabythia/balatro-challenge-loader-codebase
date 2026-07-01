"use client";

import ItemPicker, { type PickerItem } from "@/components/item-picker";

interface VoucherPickerProps {
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  placeholder?: string;
}

export default function VoucherPicker({
  items,
  onSelect,
  placeholder = "Search vouchers...",
}: VoucherPickerProps) {
  return (
    <ItemPicker
      items={items}
      spriteUrl="/sprites/Vouchers.png"
      spriteWidth={639}
      spriteHeight={380}
      cellWidth={71}
      cellHeight={95}
      onSelect={onSelect}
      placeholder={placeholder}
      getTitle={(item) => {
        return `${item.name} — $${item.cost}`;
      }}
      renderTooltip={(item) => {
        return (
          <div className="text-xs space-y-1 min-w-32 max-w-56">
            <p className="font-semibold text-sm text-white">{item.name}</p>
            <p className="text-white/60">
              {item.cost !== undefined ? `$${item.cost}` : ""}
            </p>
          </div>
        );
      }}
    />
  );
}
