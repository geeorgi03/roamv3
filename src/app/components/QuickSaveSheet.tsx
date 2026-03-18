import { useState } from "react";
import { Check, Mic, Video } from "lucide-react";
import { useNavigate } from "react-router";
import { useSessions } from "../hooks/useSessions";
import { useInbox } from "../hooks/useInbox";

export interface CaptureResult {
  mediaType: "video" | "audio";
  blob?: Blob;
  duration?: number;
}

interface QuickSaveSheetProps {
  capture: CaptureResult | null;
  onDismiss: () => void;
}

type SheetState =
  | "saved" // main: Saved ✓, Add to session?
  | "new-session" // optional naming → creates session
  | "picker"; // list of existing sessions

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuickSaveSheet({ capture, onDismiss }: QuickSaveSheetProps) {
  const navigate = useNavigate();
  const { sessions, createSession } = useSessions();
  const { saveClip, assignClip } = useInbox();
  const [state, setState] = useState<SheetState>("saved");
  const [sessionName, setSessionName] = useState("");
  const [savedClipId, setSavedClipId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Save to inbox immediately (if not yet saved)
  const ensureSaved = async (): Promise<string> => {
    if (savedClipId) return savedClipId;
    setSaving(true);
    try {
      const clip = await saveClip({
        mediaType: capture?.mediaType || "video",
        duration: capture?.duration,
        createdAt: new Date().toISOString(),
      });
      setSavedClipId(clip.id);
      return clip.id;
    } finally {
      setSaving(false);
    }
  };

  const handleLater = async () => {
    await ensureSaved();
    onDismiss();
    navigate("/inbox");
  };

  const handleNewSession = async () => {
    const name = sessionName.trim();
    const session = await createSession({
      songName: name || "Untitled",
      artist: "",
      tempo: 120,
      duration: 240,
      sections: [],
      mirrorEnabled: false,
    });
    const clipId = await ensureSaved();
    await assignClip(clipId, session.id);
    onDismiss();
    navigate(`/session/${session.id}`);
  };

  const handleAssignToSession = async (sessionId: string) => {
    const clipId = await ensureSaved();
    await assignClip(clipId, sessionId);
    onDismiss();
    navigate(`/session/${sessionId}`);
  };

  if (!capture) return null;

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={handleLater} />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
          maxHeight: "70vh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* ── Saved state ── */}
        {state === "saved" && (
          <div className="px-6 pt-5 pb-8">
            {/* Title row */}
            <div className="flex items-center gap-3 mb-2">
              {/* Clip type icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--surface-overlay)" }}>
                {capture.mediaType === "audio" ? (
                  <Mic className="w-5 h-5" style={{ color: "var(--accent-cool)" }} />
                ) : (
                  <Video className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-app-title)",
                      fontWeight: 700,
                      fontSize: "20px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Saved.
                  </span>
                  <Check className="w-5 h-5" style={{ color: "var(--accent-primary)" }} strokeWidth={2.5} />
                </div>
                {capture.duration ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-disabled)" }}>
                    {formatDuration(capture.duration)}
                    {capture.mediaType === "audio" ? " · voice memo" : " · video clip"}
                  </span>
                ) : (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                    {capture.mediaType === "audio" ? "Voice memo" : "Video clip"} saved to inbox
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px my-5" style={{ backgroundColor: "var(--border-subtle)" }} />

            {/* Prompt */}
            <p className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)" }}>
              Add to session?
            </p>

            {/* Action row */}
            <div className="flex gap-2">
              {/* Later */}
              <button
                onClick={handleLater}
                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
                style={{
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                }}
              >
                Later
              </button>

              {/* + New session */}
              <button
                onClick={() => setState("new-session")}
                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                }}
              >
                + New session
              </button>

              {/* Existing → */}
              {sessions.length > 0 && (
                <button
                  onClick={() => setState("picker")}
                  className="flex-1 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--surface-base)",
                  }}
                >
                  Existing →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── New session ── */}
        {state === "new-session" && (
          <div className="px-6 pt-5 pb-8">
            <p
              className="mb-1"
              style={{
                fontFamily: "var(--font-app-title)",
                fontWeight: 600,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              Name this session
            </p>
            <p className="mb-5" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>
              Optional — you can name it later
            </p>

            <input
              autoFocus
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNewSession()}
              placeholder="e.g. rehearsal ideas, chorus phrase…"
              className="w-full rounded-xl px-4 py-3 outline-none mb-5"
              style={{
                backgroundColor: "var(--surface-overlay)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "var(--text-primary)",
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setState("saved")}
                className="flex-1 h-12 rounded-xl"
                style={{
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                }}
              >
                Back
              </button>
              <button
                onClick={handleNewSession}
                disabled={saving}
                className="flex-1 h-12 rounded-xl font-semibold"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--surface-base)",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {sessionName.trim() ? "Create" : "Skip & create"}
              </button>
            </div>
          </div>
        )}

        {/* ── Session picker ── */}
        {state === "picker" && (
          <div className="flex flex-col" style={{ maxHeight: "60vh" }}>
            <div className="px-6 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
              <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>
                Pick a session
              </p>
              <button onClick={() => setState("saved")} style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
                Back
              </button>
            </div>

            <div className="overflow-auto flex-1 pb-6">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleAssignToSession(session.id)}
                  className="w-full px-6 h-14 flex items-center justify-between transition-colors"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div className="text-left">
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-primary)" }}>
                      {session.songName || "Untitled"}
                    </div>
                    {session.artist && <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>{session.artist}</div>}
                  </div>
                  <span style={{ color: "var(--accent-primary)", fontSize: "18px" }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

