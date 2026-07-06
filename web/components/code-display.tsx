"use client";

import { useState, useCallback } from "react";

type CodeSize = "xs" | "sm" | "base" | "lg";
type CodeVariant = "dim" | "bright";

interface CodeDisplayProps {
  code: string;
  size?: CodeSize;
  variant?: CodeVariant;
  /** Optional label displayed before the code, e.g. "Code:" */
  label?: string;
}

const SIZE_CLASSES: Record<CodeSize, string> = {
  xs: "text-xs gap-1",
  sm: "text-sm gap-1.5",
  base: "text-base gap-2",
  lg: "text-lg gap-2",
};

const CODE_COLOR: Record<CodeVariant, string> = {
  dim: "text-white/20",
  bright: "text-white/80",
};

const BUTTON_SIZE: Record<CodeSize, string> = {
  xs: "h-4 w-4",
  sm: "h-4 w-4",
  base: "h-5 w-5",
  lg: "h-5 w-5",
};

export default function CodeDisplay({ code, size = "xs", variant = "dim", label }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [code]);

  return (
    <span className={`inline-flex items-center ${SIZE_CLASSES[size]} font-mono ${CODE_COLOR[variant]} group`}>
      {label && <span className="text-white/40 font-sans">{label}</span>}
      <span>{code}</span>
      <button
        type="button"
        onClick={handleCopy}
        className={`${BUTTON_SIZE[size]} shrink-0 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:text-white/60 text-white/30 focus-visible:opacity-100 focus-visible:outline-none`}
        aria-label={copied ? "Copied" : "Copy code to clipboard"}
      >
        {copied ? (
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-full w-full text-emerald-400">
            <path
              d="M13.5 4L6 11.5L2.5 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-full w-full">
            <rect
              x="4.5"
              y="2.5"
              width="8"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path
              d="M2.5 5.5V13A0.5 0.5 0 0 0 3 13.5H9.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </span>
  );
}
