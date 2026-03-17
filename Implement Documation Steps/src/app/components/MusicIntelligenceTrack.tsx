import { useState, useMemo, useRef } from "react";
import { Sparkles, Info } from "lucide-react";

export interface ChordEvent {
  label: string;       // e.g. "Am", "F", "Bm7"
  quality: "major" | "minor" | "dominant" | "diminished" | "other";
  startPct: number;    // 0–100 position in timeline
  widthPct: number;    // 0–100 width in timeline
  startMs: number;
}

export interface ContourPoint {
  timePct: number;     // 0–100 x position
  pitchNorm: number;   // 0–1 normalized pitch height
}

interface ChordTooltip {
  chord: ChordEvent;
  xPct: number;
}

interface MusicIntelligenceTrackProps {
  chords: ChordEvent[];
  contour: ContourPoint[];
  isAvailable: boolean;          // false = show fallback
  isProcessing?: boolean;        // show subtle loader
  onJumpToTimecode?: (ms: number) => void;
  onDropPin?: (chord: ChordEvent) => void;
}

// Color tints per quality
const QUALITY_TINT: Record<string, string> = {
  major:      "rgba(200, 241, 53, 0.18)",
  minor:      "rgba(10, 207, 197, 0.16)",
  dominant:   "rgba(255, 107, 53, 0.18)",
  diminished: "rgba(180, 100, 255, 0.16)",
  other:      "rgba(120, 120, 120, 0.14)",
};
const QUALITY_TEXT: Record<string, string> = {
  major:      "rgba(200, 241, 53, 0.85)",
  minor:      "rgba(10, 207, 197, 0.9)",
  dominant:   "rgba(255, 107, 53, 0.85)",
  diminished: "rgba(180, 100, 255, 0.85)",
  other:      "rgba(160, 160, 160, 0.75)",
};
const QUALITY_BORDER: Record<string, string> = {
  major:      "rgba(200, 241, 53, 0.25)",
  minor:      "rgba(10, 207, 197, 0.22)",
  dominant:   "rgba(255, 107, 53, 0.22)",
  diminished: "rgba(180, 100, 255, 0.22)",
  other:      "rgba(120,120,120,0.18)",
};

// Generate a smooth SVG path from contour data
function buildContourPath(points: ContourPoint[], w: number, h: number): string {
  if (points.length < 2) return "";
  // Map to pixel coords (top = high pitch, so invert)
  const pts = points.map((p) => ({
    x: (p.timePct / 100) * w,
    y: (1 - p.pitchNorm) * h,
  }));

  // Catmull-Rom → cubic bezier
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1] || curr;
    const prevPrev = pts[i - 2] || prev;

    const cp1x = prev.x + (curr.x - prevPrev.x) / 6;
    const cp1y = prev.y + (curr.y - prevPrev.y) / 6;
    const cp2x = curr.x - (next.x - prev.x) / 6;
    const cp2y = curr.y - (next.y - prev.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }
  return d;
}

// Sample data for demo purposes
export function makeSampleChords(): ChordEvent[] {
  const chords: Array<{ label: string; quality: ChordEvent["quality"]; beats: number }> = [
    { label: "Am", quality: "minor", beats: 4 },
    { label: "F", quality: "major", beats: 4 },
    { label: "C", quality: "major", beats: 4 },
    { label: "G", quality: "dominant", beats: 4 },
    { label: "Am", quality: "minor", beats: 4 },
    { label: "F", quality: "major", beats: 4 },
    { label: "Dm", quality: "minor", beats: 3 },
    { label: "E7", quality: "dominant", beats: 5 },
  ];
  const total = chords.reduce((s, c) => s + c.beats, 0);
  let cursor = 0;
  return chords.map((c, i) => {
    const startPct = (cursor / total) * 100;
    const widthPct = (c.beats / total) * 100;
    cursor += c.beats;
    return {
      label: c.label,
      quality: c.quality,
      startPct,
      widthPct,
      startMs: i * 2000,
    };
  });
}

export function makeSampleContour(): ContourPoint[] {
  return Array.from({ length: 40 }, (_, i) => ({
    timePct: (i / 39) * 100,
    pitchNorm:
      0.3 +
      Math.sin(i * 0.3) * 0.25 +
      Math.sin(i * 0.13) * 0.2 +
      (i > 25 ? Math.sin((i - 25) * 0.5) * 0.15 : 0),
  }));
}

export default function MusicIntelligenceTrack({
  chords,
  contour,
  isAvailable,
  isProcessing = false,
  onJumpToTimecode,
  onDropPin,
}: MusicIntelligenceTrackProps) {
  const [tooltip, setTooltip] = useState<ChordTooltip | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SVG_W = 320;
  const SVG_H = 32;

  const contourPath = useMemo(
    () => buildContourPath(contour, SVG_W, SVG_H),
    [contour]
  );

  const handleChordPress = (chord: ChordEvent) => {
    longPressRef.current = setTimeout(() => {
      onDropPin?.(chord);
      setTooltip(null);
    }, 600);
  };

  const handleChordRelease = (chord: ChordEvent) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    // Short tap = show tooltip + jump
    setTooltip((prev) =>
      prev?.chord.label === chord.label && prev.xPct === chord.startPct
        ? null
        : { chord, xPct: chord.startPct + chord.widthPct / 2 }
    );
    onJumpToTimecode?.(chord.startMs);
  };

  // Track header
  const header = (
    <div
      className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0 gap-0.5"
      style={{ backgroundColor: "var(--surface-raised)" }}
    >
      <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
    </div>
  );

  // Processing state
  if (isProcessing) {
    return (
      <div
        className="flex items-center"
        style={{ height: "72px", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {header}
        <div className="flex-1 h-full flex items-center px-4 gap-3">
          <div
            className="h-3 rounded-full flex-1 animate-pulse"
            style={{ backgroundColor: "var(--surface-overlay)" }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-disabled)",
            }}
          >
            Analysing…
          </span>
        </div>
      </div>
    );
  }

  // Unavailable fallback
  if (!isAvailable) {
    return (
      <div
        className="flex items-center"
        style={{ height: "72px", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {header}
        <div className="flex-1 flex items-center gap-2 px-4">
          <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--text-disabled)",
            }}
          >
            Music Intelligence unavailable for this track
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-stretch relative"
      style={{ height: "72px", borderBottom: "1px solid var(--border-subtle)" }}
    >
      {header}

      {/* Track content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Chord strip — top ~36px */}
        <div className="flex-1 relative" style={{ height: "36px" }}>
          {chords.map((chord, i) => (
            <button
              key={i}
              onPointerDown={() => handleChordPress(chord)}
              onPointerUp={() => handleChordRelease(chord)}
              onPointerLeave={() => {
                if (longPressRef.current) clearTimeout(longPressRef.current);
              }}
              className="absolute top-0 bottom-0 flex items-center justify-center select-none"
              style={{
                left: `${chord.startPct}%`,
                width: `${chord.widthPct}%`,
                backgroundColor: QUALITY_TINT[chord.quality] || QUALITY_TINT.other,
                borderRight: "1px solid var(--border-subtle)",
                paddingInline: "2px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: QUALITY_TEXT[chord.quality] || QUALITY_TEXT.other,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {chord.label}
              </span>
            </button>
          ))}

          {/* Active chord tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: `${Math.min(Math.max(tooltip.xPct, 5), 85)}%`,
                top: "calc(100% + 4px)",
                transform: "translateX(-50%)",
              }}
            >
              <div
                className="px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                  }}
                >
                  {tooltip.chord.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Melodic contour — bottom ~36px */}
        <div className="relative" style={{ height: "36px" }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="contourGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-cool)" stopOpacity="0.7" />
                <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--accent-cool)" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {contourPath && (
              <path
                d={contourPath}
                fill="none"
                stroke="url(#contourGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
