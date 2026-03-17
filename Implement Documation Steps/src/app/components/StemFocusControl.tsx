/**
 * StemFocusControl — Phase 1 V2.1 redesign
 *
 * Lives below the waveform, revealed when the user taps the waveform track header.
 * Four pill buttons: Vocals · Drums · Bass · Instr
 *
 * Interaction model (per PRD §1.4b):
 *   • Tap once  → solo (all others mute)
 *   • Tap again → return to full mix
 *   • Long-press → toggle mute on this stem only (others unchanged)
 */
import { useState, useRef } from "react";

export type StemKey = "vocals" | "drums" | "bass" | "instr";

interface Stem {
  key: StemKey;
  emoji: string;
  label: string;
}

const STEMS: Stem[] = [
  { key: "vocals", emoji: "🎤", label: "Vocals" },
  { key: "drums",  emoji: "🥁", label: "Drums"  },
  { key: "bass",   emoji: "🎸", label: "Bass"   },
  { key: "instr",  emoji: "🎹", label: "Instr"  },
];

type StemState = "active" | "solo" | "muted";

interface StemFocusControlProps {
  /** Whether stems are ready — false shows processing/disabled state */
  stemsEnabled?: boolean;
  /** Whether stems are still processing (show subtle loading) */
  stemsProcessing?: boolean;
}

const LONG_PRESS_MS = 450;

export default function StemFocusControl({
  stemsEnabled = true,
  stemsProcessing = false,
}: StemFocusControlProps) {
  const [stemStates, setStemStates] = useState<Record<StemKey, StemState>>({
    vocals: "active",
    drums:  "active",
    bass:   "active",
    instr:  "active",
  });

  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressKey = useRef<StemKey | null>(null);

  const allActive = Object.values(stemStates).every((s) => s === "active");

  const handlePointerDown = (key: StemKey) => {
    if (!stemsEnabled || stemsProcessing) return;
    longPressKey.current = key;
    longPressRef.current = setTimeout(() => {
      // Long-press → toggle mute on this stem only
      setStemStates((prev) => {
        const curr = prev[key];
        return {
          ...prev,
          [key]: curr === "muted" ? "active" : "muted",
        };
      });
      longPressKey.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (key: StemKey) => {
    if (!stemsEnabled || stemsProcessing) return;
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    // Only act as short tap if long-press didn't fire
    if (longPressKey.current === key) {
      longPressKey.current = null;
      setStemStates((prev) => {
        // If this stem is already solo, go back to full mix
        if (prev[key] === "solo") {
          return { vocals: "active", drums: "active", bass: "active", instr: "active" };
        }
        // Solo this stem
        return {
          vocals: key === "vocals" ? "solo" : "muted",
          drums:  key === "drums"  ? "solo" : "muted",
          bass:   key === "bass"   ? "solo" : "muted",
          instr:  key === "instr"  ? "solo" : "muted",
        };
      });
    }
  };

  const handlePointerLeave = (key: StemKey) => {
    if (longPressRef.current && longPressKey.current === key) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      longPressKey.current = null;
    }
  };

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 gap-1.5"
      style={{
        backgroundColor: "var(--surface-raised)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {STEMS.map((stem) => {
        const state = stemStates[stem.key];
        const isSolo   = state === "solo";
        const isMuted  = state === "muted";
        const isActive = state === "active";

        return (
          <button
            key={stem.key}
            onPointerDown={() => handlePointerDown(stem.key)}
            onPointerUp={() => handlePointerUp(stem.key)}
            onPointerLeave={() => handlePointerLeave(stem.key)}
            className="flex-1 flex items-center justify-center gap-1 rounded-full h-7 transition-all select-none"
            style={{
              backgroundColor: isSolo
                ? "rgba(200, 241, 53, 0.15)"
                : "var(--surface-overlay)",
              border: `1px solid ${
                isSolo
                  ? "rgba(200, 241, 53, 0.4)"
                  : isMuted
                  ? "var(--border-subtle)"
                  : "var(--border-subtle)"
              }`,
              opacity: stemsProcessing
                ? 0.35
                : isMuted
                ? 0.35
                : allActive || isSolo
                ? 1
                : 0.65,
            }}
          >
            <span style={{ fontSize: "10px" }}>{stem.emoji}</span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: isSolo ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: isMuted ? "line-through" : "none",
                textDecorationColor: "var(--text-disabled)",
              }}
            >
              {stem.label}
            </span>
          </button>
        );
      })}

      {/* Processing indicator */}
      {stemsProcessing && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            color: "var(--text-disabled)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--text-disabled)" }}
          />
        </div>
      )}
    </div>
  );
}
