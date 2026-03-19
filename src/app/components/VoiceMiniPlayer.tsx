import { Play, Pause } from "lucide-react";

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

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.min(1, Math.max(0, x / rect.width));
    onSeek(fraction * duration);
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

      {/* Scrub bar */}
      <div
        className="flex-1 h-2 rounded-full cursor-pointer relative"
        style={{ backgroundColor: "var(--surface-overlay)" }}
        onClick={handleTrackClick}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--accent-warm)",
          }}
        />
        {/* Scrub handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
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
