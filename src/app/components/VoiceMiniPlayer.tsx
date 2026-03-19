import { Play, Pause } from "lucide-react";
import { useRef, useCallback } from "react";

interface VoiceMiniPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VoiceMiniPlayer({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
}: VoiceMiniPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const pointerPositionToTime = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const fraction = Math.min(1, Math.max(0, x / rect.width));
      return fraction * duration;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    const time = pointerPositionToTime(e.clientX);
    onSeek(time);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const time = pointerPositionToTime(e.clientX);
    onSeek(time);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--accent-warm)",
        }}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" style={{ color: "var(--surface-base)" }} />
        ) : (
          <Play className="w-4 h-4" style={{ color: "var(--surface-base)" }} fill="currentColor" />
        )}
      </button>

      {/* Scrub bar with pointer-based drag seeking */}
      <div
        ref={trackRef}
        className="flex-1 h-2 rounded-full cursor-pointer relative touch-none"
        style={{ backgroundColor: "var(--surface-overlay)" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      >
        {/* Fill track */}
        <div
          className="absolute top-0 left-0 h-full rounded-full pointer-events-none"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--accent-warm)",
          }}
        />
        {/* Scrub handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
          style={{
            left: `${progress}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: "var(--accent-warm)",
            boxShadow: "0 1px 4px color-mix(in srgb, var(--surface-base) 30%, transparent)",
          }}
        />
      </div>

      {/* Elapsed / Total time */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-secondary)",
          minWidth: "70px",
          textAlign: "right",
        }}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
