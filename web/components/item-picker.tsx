"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface PickerItem {
  id: string;
  name: string;
  pos: { x: number; y: number };
  [key: string]: unknown;
}

interface ItemPickerProps {
  items: PickerItem[];
  spriteUrl: string;
  spriteWidth: number;
  spriteHeight: number;
  cellWidth: number;
  cellHeight: number;
  onSelect: (item: PickerItem) => void;
  placeholder?: string;
  renderTooltip?: (item: PickerItem) => React.ReactNode;
  getTitle?: (item: PickerItem) => string;
}

interface TooltipState {
  item: PickerItem;
  x: number;
  y: number;
}

export default function ItemPicker({
  items,
  spriteUrl,
  spriteWidth,
  spriteHeight,
  cellWidth,
  cellHeight,
  onSelect,
  placeholder = "Search...",
  renderTooltip,
  getTitle,
}: ItemPickerProps) {
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const showTooltip = useCallback(
    (item: PickerItem, el: HTMLElement) => {
      if (!renderTooltip) return;
      const rect = el.getBoundingClientRect();
      setTooltip({
        item,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [renderTooltip]
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/30 outline-none focus:border-white/30 mb-3 text-sm"
      />

      <div
        ref={gridRef}
        className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto"
      >
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            onMouseEnter={(e) => showTooltip(item, e.currentTarget)}
            onMouseLeave={hideTooltip}
            title={getTitle?.(item)}
            className="relative flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div
              className="rounded-md shrink-0"
              style={{
                width: cellWidth,
                height: cellHeight,
                backgroundImage: `url(${spriteUrl})`,
                backgroundSize: `${spriteWidth}px ${spriteHeight}px`,
                backgroundPosition: `-${item.pos.x * cellWidth}px -${item.pos.y * cellHeight}px`,
                imageRendering: "pixelated",
              }}
              aria-label={item.name}
              role="img"
            />
            <span className="text-xs text-white/60 text-center leading-tight truncate w-full">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-white/30 text-center py-4">
          No items match &quot;{search}&quot;
        </p>
      )}

      {tooltip &&
        renderTooltip &&
        createPortal(
          <div
            className="fixed px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg shadow-xl pointer-events-none z-50 max-w-56"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            {renderTooltip(tooltip.item)}
          </div>,
          document.body
        )}
    </div>
  );
}
