import { ArrowLeft, Play, SkipBack, SkipForward, ChevronDown, ChevronUp, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

interface LoopRegion {
  id: string;
  name: string;
  color: string;
  start: number; // 0–100 percentage
  end: number;   // 0–100 percentage
  active: boolean;
  count: string;
}

const INITIAL_REGIONS: LoopRegion[] = [
  { id: "a", name: "Loop A", color: "#4ECDC4", start: 15, end: 38, active: true, count: "4×" },
  { id: "b", name: "Loop B", color: "#FF9A3C", start: 30, end: 55, active: true, count: "∞" },
  { id: "c", name: "Loop C", color: "#FF6B6B", start: 60, end: 82, active: true, count: "8×" },
];

function toTimecode(pct: number, totalSecs = 180) {
  const secs = Math.floor((pct / 100) * totalSecs);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Hatched SVG pattern as a data URI
const HATCH_PATTERN = `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8L8 0' stroke='rgba(255,255,255,0.12)' stroke-width='1'/%3E%3C/svg%3E")`;

export default function RepetitionTool() {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<LoopRegion[]>(INITIAL_REGIONS);
  const [trayOpen, setTrayOpen] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>("b");
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleActive = (id: string) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const deleteRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
    if (activePlayingId === id) setActivePlayingId(null);
  };

  const activeRegion = regions.find((r) => r.id === activePlayingId && r.active);

  // "Just created" = active but not yet playing
  const justCreatedId = !isPlaying && activePlayingId ? activePlayingId : null;

  // Compute overlap pairs
  const overlaps: { left: number; width: number }[] = [];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i];
      const b = regions[j];
      const oLeft = Math.max(a.start, b.start);
      const oRight = Math.min(a.end, b.end);
      if (oRight > oLeft) {
        overlaps.push({ left: oLeft, width: oRight - oLeft });
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--surface-base)" }}
    >
      {/* Header */}
      <div
        className="h-11 px-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 700,
              fontSize: "16px",
              color: "var(--text-primary)",
            }}
          >
            Repetition
          </span>
        </button>
        <button
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            fontFamily: "var(--font-body)",
          }}
        >
          Done
        </button>
      </div>

      {/* Timeline with Waveform */}
      <div className="relative px-4 pt-8 pb-2" style={{ height: "200px" }}>
        {/* Waveform bars */}
        <div className="h-28 flex items-end gap-0.5 relative">
          {Array.from({ length: 100 }).map((_, i) => {
            const pct = i;
            const inAnyRegion = regions.some(
              (r) => r.active && pct >= r.start && pct <= r.end
            );
            const height = 20 + Math.abs(Math.sin(i * 0.18) * 60) + Math.abs(Math.cos(i * 0.07) * 20);
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${height}%`,
                  backgroundColor: inAnyRegion ? "rgba(255,255,255,0.25)" : "var(--waveform-fill)",
                  minWidth: "2px",
                }}
              />
            );
          })}

          {/* Region bands */}
          {regions.map((region) => {
            const isPlayingThis = isPlaying && region.id === activePlayingId;
            const isJustCreated = !isPlaying && region.id === justCreatedId;
            return (
            <div
              key={region.id}
              className="absolute top-0 bottom-0 rounded-sm"
              style={{
                left: `${region.start}%`,
                width: `${region.end - region.start}%`,
                backgroundColor: `${region.color}22`,
                borderTop: `2px solid ${region.color}`,
                borderBottom: `2px solid ${region.color}`,
                opacity: region.active ? 1 : 0.4,
                pointerEvents: "none",
                boxShadow: isPlayingThis ? `0 0 12px ${region.color}55` : "none",
              }}
            >
              {/* Drag handle left */}
              <div
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: region.color,
                  boxShadow: isJustCreated ? `0 0 0 3px ${region.color}33` : "none",
                }}
              />
              {/* Drag handle right */}
              <div
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: region.color,
                  boxShadow: isJustCreated ? `0 0 0 3px ${region.color}33` : "none",
                }}
              />
              {/* Label */}
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: isPlayingThis ? `${region.color}44` : `${region.color}22`,
                  fontSize: "10px",
                  color: region.color,
                  fontFamily: "var(--font-body)",
                  fontWeight: isPlayingThis ? 600 : 500,
                }}
              >
                {isPlayingThis ? "▶ " : isJustCreated ? "● " : ""}{region.name}
              </div>

              {/* Playing pulse overlay */}
              {isPlayingThis && (
                <div
                  className="absolute inset-0 rounded-sm animate-pulse"
                  style={{ backgroundColor: `${region.color}18` }}
                />
              )}
            </div>
            );
          })}

          {/* Overlap hatched zones */}
          {overlaps.map((overlap, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: `${overlap.left}%`,
                width: `${overlap.width}%`,
                backgroundImage: HATCH_PATTERN,
                backgroundSize: "8px 8px",
                opacity: 0.7,
              }}
            />
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
            style={{
              left: activeRegion
                ? `${activeRegion.start + (activeRegion.end - activeRegion.start) * 0.35}%`
                : "40%",
              backgroundColor: "#FF3B30",
            }}
          />
        </div>

        {/* Timecode row */}
        <div className="flex justify-between mt-2">
          {[0, 25, 50, 75, 100].map((pct) => (
            <span
              key={pct}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-disabled)",
              }}
            >
              {toTimecode(pct)}
            </span>
          ))}
        </div>
      </div>

      {/* Transport bar */}
      <div
        className="px-4 h-16 flex items-center justify-between"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-5">
          <button>
            <SkipBack className="w-7 h-7" style={{ color: "var(--text-secondary)" }} />
          </button>
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--surface-base)">
                <rect x="2" y="1" width="4" height="12" rx="1" />
                <rect x="8" y="1" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <Play className="w-5 h-5" style={{ color: "var(--surface-base)" }} fill="currentColor" />
            )}
          </button>
          <button>
            <SkipForward className="w-7 h-7" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Active loop indicator */}
        {activeRegion && isPlaying && (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeRegion.color }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {activeRegion.name} playing
            </span>
          </div>
        )}

        {/* Speed */}
        <button
          className="px-3 py-1 rounded-full"
          style={{
            border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          0.75×
        </button>
      </div>

      {/* Loop Management Tray */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {/* Tray header */}
        <button
          onClick={() => setTrayOpen((v) => !v)}
          className="w-full px-4 h-10 flex items-center justify-between"
          style={{ backgroundColor: "var(--surface-raised)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            Loop regions
          </span>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-disabled)",
              }}
            >
              {regions.filter((r) => r.active).length}/{regions.length} active
            </span>
            {trayOpen ? (
              <ChevronUp className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
            )}
          </div>
        </button>

        {/* Tray rows */}
        {trayOpen && (
          <div style={{ backgroundColor: "var(--surface-raised)" }}>
            {regions.map((region) => (
              <div
                key={region.id}
                className="px-4 flex items-center gap-3"
                style={{
                  height: "36px",
                  borderTop: "1px solid var(--border-subtle)",
                  opacity: region.active ? 1 : 0.5,
                }}
              >
                {/* Color swatch */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: region.color }}
                />

                {/* Name */}
                <span
                  className="flex-1"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                  }}
                >
                  {region.name}
                </span>

                {/* Timecode */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-disabled)",
                    marginRight: "8px",
                  }}
                >
                  {toTimecode(region.start)}–{toTimecode(region.end)}
                </span>

                {/* Active pill toggle */}
                <button
                  onClick={() => toggleActive(region.id)}
                  className="relative flex-shrink-0"
                  style={{
                    width: "32px",
                    height: "18px",
                    borderRadius: "9px",
                    backgroundColor: region.active ? "var(--accent-primary)" : "var(--surface-overlay)",
                    border: `1px solid ${region.active ? "transparent" : "var(--border-subtle)"}`,
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: region.active ? "15px" : "2px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: region.active ? "var(--surface-base)" : "var(--text-disabled)",
                      transition: "left 0.2s",
                    }}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteRegion(region.id)}
                  className="w-6 h-6 flex items-center justify-center"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add region */}
            <div
              className="px-4 flex items-center"
              style={{
                height: "36px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <button
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--accent-cool)",
                }}
              >
                + Add region
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Repeat count selector */}
      <div
        className="px-4 py-4"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Repeat count
          </span>
          <div className="flex gap-2">
            {["2×", "4×", "8×", "∞"].map((option) => {
              const isSelected = activeRegion?.count === option;
              return (
                <button
                  key={option}
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: isSelected ? "var(--accent-primary)" : "var(--surface-overlay)",
                    border: isSelected ? "none" : "1px solid var(--border-subtle)",
                    color: isSelected ? "var(--surface-base)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Run sequence button */}
      <div className="px-4 py-4">
        <button
          className="w-full h-12 rounded-xl font-semibold"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--surface-base)",
            fontSize: "14px",
            fontFamily: "var(--font-body)",
          }}
        >
          Run Sequence
        </button>
      </div>
    </div>
  );
}