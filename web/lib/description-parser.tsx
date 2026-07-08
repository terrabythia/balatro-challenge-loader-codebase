/**
 * Parses Balatro description text with {C:...} tags and #N# placeholders.
 * Resolves #N# values from the joker's config when possible.
 */

interface ParsedSegment {
  type: "text" | "var";
  value: string;
  color?: string;
}

/**
 * Flatten a config object into ordered values that correspond to #N# placeholders.
 * Balatro's convention: variables are extracted depth-first from the config.
 */
export function flattenConfig(config: unknown): (string | number)[] {
  const result: (string | number)[] = [];

  function walk(val: unknown) {
    if (val == null) return;
    if (typeof val === "number" || typeof val === "string") {
      result.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    } else if (typeof val === "object") {
      Object.values(val as Record<string, unknown>).forEach(walk);
    }
  }

  walk(config);
  return result;
}

/**
 * Parse a single line of Balatro description text.
 * Returns array of segments: text spans and resolved variable values.
 */
export function parseLine(
  line: string,
  configVars: (string | number)[]
): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let currentText = "";
  let currentColor: string | undefined;
  let i = 0;

  function flush() {
    if (currentText) {
      segments.push({ type: "text", value: currentText, color: currentColor });
      currentText = "";
    }
  }

  while (i < line.length) {
    if (line[i] === "{") {
      const close = line.indexOf("}", i);
      if (close === -1) {
        currentText += line[i];
        i++;
        continue;
      }
      const tag = line.slice(i + 1, close);
      i = close + 1;

      if (tag === "") {
        flush();
        currentColor = undefined;
        continue;
      }

      const colorMatch = tag.match(/(?:^|,)C:(\w+)/);
      if (colorMatch) {
        flush();
        currentColor = colorMatch[1];
      }
      continue;
    }

    if (line[i] === "#") {
      const match = line.slice(i).match(/^#(\d+)#/);
      if (match) {
        flush();

        const n = parseInt(match[1]) - 1;
        const resolved = configVars[n];
        segments.push({
          type: "var",
          value: resolved !== undefined ? String(resolved) : `#${match[1]}#`,
          color: currentColor,
        });

        i += match[0].length;
        continue;
      }
    }

    currentText += line[i];
    i++;
  }

  flush();

  return segments;
}

export interface DescriptionProps {
  lines: string[];
  config: Record<string, unknown>;
}

// --- Style mapping for Balatro colors → Tailwind ---
const COLOR_CLASSES: Record<string, string> = {
  red: "text-red-400",
  blue: "text-blue-400",
  green: "text-green-400",
  gold: "text-yellow-400",
  purple: "text-purple-400",
  attention: "text-amber-300",
  mult: "text-red-400",
  chips: "text-blue-300",
  money: "text-yellow-400",
  inactive: "text-white/30",
  dark_edition: "text-fuchsia-400",
  edition: "text-fuchsia-400",
};

function colorClass(c: string | undefined): string {
  if (!c) return "text-white/80";
  return COLOR_CLASSES[c] || "text-white/80";
}

/**
 * Render parsed description segments as React elements.
 */
export function DescriptionText({ lines, config }: DescriptionProps) {
  const configVars = flattenConfig(config);

  return (
    <>
      {lines.map((line, li) => {
        const segments = parseLine(line, configVars);
        if (segments.length === 0) {
          return <br key={li} />;
        }

        return (
          <span key={li}>
            {li > 0 && " "}
            {segments.map((seg, si) => (
              <span
                key={si}
                className={[
                  colorClass(seg.color),
                  seg.type === "var" && "font-semibold",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {seg.value}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}
