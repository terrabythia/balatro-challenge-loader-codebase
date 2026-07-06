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
}: SpriteIconProps) {
  const scale = displayHeight / cellHeight;
  const naturalWidth = Math.round(cellWidth * scale);
  const finalWidth = displayWidth ?? naturalWidth;

  return (
    <span
      className="inline-block shrink-0 rounded overflow-hidden"
      style={{
        width: finalWidth,
        height: displayHeight,
        backgroundImage: `url(${src})`,
        backgroundSize: `${Math.round(sheetWidth * scale)}px ${Math.round(sheetHeight * scale)}px`,
        backgroundPosition: `${Math.round(-pos.x * cellWidth * scale)}px ${Math.round(-pos.y * cellHeight * scale)}px`,
        imageRendering: "pixelated",
      }}
      role="img"
      aria-hidden="true"
    />
  );
}
