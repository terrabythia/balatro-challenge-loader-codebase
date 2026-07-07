interface SpriteIconProps {
  /** Sprite sheet URL */
  src: string;
  /** Grid position (column, row) */
  pos: { x: number; y: number };
  /** Full sprite sheet dimensions in pixels */
  sheetWidth: number;
  sheetHeight: number;
  /** Single cell dimensions in pixels */
  cellWidth: number;
  cellHeight: number;
  /** Display height in pixels. Default: 40 */
  displayHeight?: number;
  /** Override display width in pixels (crops with overflow-hidden).
   *  Useful for wide sprites like blind chips. */
  displayWidth?: number;
  /** Overlay sprite position (for legendary/soul jokers). Same sheet, different cell. */
  overlayPos?: { x: number; y: number };
}

/**
 * Renders a single sprite cell from a sprite sheet as an inline icon.
 * Uses CSS background-image + background-position with pixelated rendering.
 */
export default function SpriteIcon({
  src,
  pos,
  sheetWidth,
  sheetHeight,
  cellWidth,
  cellHeight,
  displayHeight = 40,
  displayWidth,
  overlayPos,
}: SpriteIconProps) {
  const scale = displayHeight / cellHeight;
  const naturalWidth = Math.round(cellWidth * scale);
  const finalWidth = displayWidth ?? naturalWidth;

  const bgSize = `${Math.round(sheetWidth * scale)}px ${Math.round(sheetHeight * scale)}px`;
  const bgPos = `${Math.round(-pos.x * cellWidth * scale)}px ${Math.round(-pos.y * cellHeight * scale)}px`;

  return (
    <span
      className="inline-block shrink-0 rounded overflow-hidden relative"
      style={{
        width: finalWidth,
        height: displayHeight,
      }}
      role="img"
      aria-hidden="true"
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          imageRendering: "pixelated",
        }}
      />
      {overlayPos && (
        <span
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: bgSize,
            backgroundPosition: `${Math.round(-overlayPos.x * cellWidth * scale)}px ${Math.round(-overlayPos.y * cellHeight * scale)}px`,
            imageRendering: "pixelated",
          }}
        />
      )}
    </span>
  );
}
