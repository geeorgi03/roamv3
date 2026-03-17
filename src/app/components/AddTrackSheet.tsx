import { X, Video, AlignLeft, Grid3x3, Edit3, Sparkles } from "lucide-react";

export type TrackType =
  | "reference-video"
  | "lyrics"
  | "counts"
  | "custom"
  | "music-intelligence";

interface TrackOption {
  type: TrackType;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const TRACK_OPTIONS: TrackOption[] = [
  {
    type: "music-intelligence",
    icon: <Sparkles />,
    label: "Music Intelligence",
    description: "Chord progression + melodic contour",
    badge: "New",
    badgeColor: "var(--accent-primary)",
  },
  {
    type: "reference-video",
    icon: <Video />,
    label: "Reference video",
    description: "Sync a reference clip alongside the song",
  },
  {
    type: "lyrics",
    icon: <AlignLeft />,
    label: "Lyrics",
    description: "Auto-fetched or manually entered lyrics",
  },
  {
    type: "counts",
    icon: <Grid3x3 />,
    label: "Counts / 8-count grid",
    description: "8-count or 16-count beat markers",
  },
  {
    type: "custom",
    icon: <Edit3 />,
    label: "Custom annotation",
    description: "Free-draw or freeform text lane",
  },
];

interface AddTrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  existingTracks?: TrackType[];
  onAddTrack: (type: TrackType) => void;
}

export default function AddTrackSheet({ isOpen, onClose, existingTracks = [], onAddTrack }: AddTrackSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <span style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>
            Add a track
          </span>
          <button onClick={onClose}>
            <X className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
          </button>
        </div>

        <p className="px-5 pb-3" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
          Up to 4 additional tracks per session
        </p>

        {/* Track options */}
        <div className="pb-8">
          {TRACK_OPTIONS.map((option) => {
            const isAdded = existingTracks.includes(option.type);
            const isMI = option.type === "music-intelligence";

            return (
              <button
                key={option.type}
                onClick={() => {
                  if (!isAdded) {
                    onAddTrack(option.type);
                    onClose();
                  }
                }}
                disabled={isAdded}
                className="w-full flex items-center gap-4 px-5 py-3.5 transition-opacity"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  opacity: isAdded ? 0.4 : 1,
                  backgroundColor: isMI && !isAdded ? "rgba(200, 241, 53, 0.04)" : "transparent",
                }}
              >
                {/* Icon container */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isMI ? "rgba(200, 241, 53, 0.12)" : "var(--surface-overlay)",
                  }}
                >
                  <span
                    className="w-5 h-5"
                    style={{
                      color: isMI ? "var(--accent-primary)" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {option.icon}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        fontWeight: isMI ? 600 : 400,
                      }}
                    >
                      {option.label}
                    </span>
                    {option.badge && !isAdded && (
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${option.badgeColor}22`,
                          color: option.badgeColor,
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isAdded && (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>added</span>
                    )}
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                    {option.description}
                  </span>
                </div>

                {/* Arrow */}
                {!isAdded && <span style={{ color: isMI ? "var(--accent-primary)" : "var(--text-disabled)", fontSize: "16px" }}>+</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

