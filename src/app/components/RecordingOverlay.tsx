import { useState, useEffect, useRef } from "react";
import { Square, ChevronUp } from "lucide-react";

export interface Take {
  id: string;
  number: number;
  duration: number; // seconds
  isActive?: boolean;
}

interface RecordingOverlayProps {
  isRecording: boolean;
  takeNumber: number;
  cycleNumber: number;
  takes: Take[];
  onStop: () => void;
  onNewTake: () => void;
  onExportAll: () => void;
  onDeleteTake: (id: string) => void;
  onPlayTake: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export default function RecordingOverlay({
  isRecording,
  takeNumber,
  cycleNumber,
  takes,
  onStop,
  onNewTake,
  onExportAll,
  onDeleteTake,
  onPlayTake,
}: RecordingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((t) => t + 0.1);
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording, takeNumber]);

  if (!isRecording) return null;

  return (
    <>
      {/* Overlay indicators */}
      {/* Top-left: recording dot + take info */}
      <div className="absolute top-3 left-4 flex flex-col gap-0.5 z-50 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#FF3B30" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>Take {takeNumber}</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            paddingLeft: "16px",
          }}
        >
          Cycle {cycleNumber}
        </span>
      </div>

      {/* Bottom-right: timecode + new take + stop */}
      <div className="absolute bottom-24 right-4 flex flex-col items-end gap-2 z-50">
        {/* Live duration */}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{formatDuration(elapsed)}</span>

        {/* New take */}
        <button
          onClick={onNewTake}
          className="px-3 py-1.5 rounded-lg"
          style={{
            border: "1px solid var(--border-subtle)",
            backgroundColor: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          New take
        </button>

        {/* Takes panel toggle */}
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
          style={{
            border: "1px solid var(--border-subtle)",
            backgroundColor: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronUp className="w-3 h-3" />
          Takes
        </button>

        {/* Stop button */}
        <button onClick={onStop} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "#FF3B30" }}>
          <Square className="w-5 h-5" style={{ color: "#fff" }} fill="currentColor" />
        </button>
      </div>

      {/* Takes panel */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div className="absolute inset-0 z-40" onClick={() => setPanelOpen(false)} />

          {/* Sheet */}
          <div
            className="absolute left-0 right-0 bottom-0 z-50 rounded-t-2xl"
            style={{
              backgroundColor: "var(--surface-raised)",
              borderTop: "1px solid var(--border-subtle)",
              maxHeight: "60vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
            </div>

            {/* Export all */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>Takes</span>
              <button onClick={onExportAll} style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-cool)" }}>
                Export all
              </button>
            </div>

            {/* Active recording row */}
            <div className="px-4 h-11 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#FF3B30" }} />
              <span className="flex-1" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>
                Recording…
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{formatDuration(elapsed)}</span>
            </div>

            {/* Takes list */}
            <div className="overflow-auto flex-1">
              {[...takes].reverse().map((take) => (
                <div key={take.id} className="px-4 h-11 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-disabled)",
                      width: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {take.number}
                  </span>
                  <span className="flex-1" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                    {formatDuration(take.duration)}
                  </span>

                  {/* Play */}
                  <button onClick={() => onPlayTake(take.id)} className="w-7 h-7 flex items-center justify-center rounded" style={{ color: "var(--text-secondary)" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <polygon points="2,1 11,6 2,11" />
                    </svg>
                  </button>

                  {/* Export */}
                  <button className="w-7 h-7 flex items-center justify-center rounded" style={{ color: "var(--text-secondary)" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 1v8M2 7l4 4 4-4M2 11h8" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button onClick={() => onDeleteTake(take.id)} className="w-7 h-7 flex items-center justify-center rounded" style={{ color: "var(--text-disabled)" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="1" y1="1" x2="9" y2="9" />
                      <line x1="9" y1="1" x2="1" y2="9" />
                    </svg>
                  </button>
                </div>
              ))}

              {takes.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>No completed takes yet</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

