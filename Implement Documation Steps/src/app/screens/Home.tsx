import { useState } from "react";
import {
  ChevronRight,
  Music,
  Inbox,
  Plus,
  Mic,
  Video,
  Trash2,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useSessions } from "../hooks/useSessions";
import { useInbox } from "../hooks/useInbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// ─────────────────────────────────────────────────────────────
// Sub-component: Two-door home (new user / no sessions)
// ─────────────────────────────────────────────────────────────
function TwoDoorHome({
  onRecord,
  onStartSession,
  inboxCount,
  onInbox,
}: {
  onRecord: () => void;
  onStartSession: () => void;
  inboxCount: number;
  onInbox: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--surface-base)" }}
    >
      {/* Header — wordmark only */}
      <div className="h-14 flex items-center justify-center">
        <h1
          className="uppercase tracking-[0.18em]"
          style={{
            fontFamily: "var(--font-app-title)",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--text-primary)",
          }}
        >
          roam
        </h1>
      </div>

      {/* Main area — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Tagline */}
        <p
          className="italic text-center mb-12"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text-disabled)",
            letterSpacing: "0.01em",
          }}
        >
          remember what you make
        </p>

        {/* Two doors — equal weight */}
        <div className="w-full max-w-sm space-y-4">
          {/* Door 1 — Record */}
          <button
            onClick={onRecord}
            className="w-full flex items-center px-5 rounded-2xl transition-all active:scale-[0.98]"
            style={{
              height: "112px",
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255, 59, 48, 0.12)" }}
            >
              {/* Record circle icon */}
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: "#FF3B30" }}
              />
            </div>
            <div className="text-left ml-4 flex-1">
              <div
                style={{
                  fontFamily: "var(--font-app-title)",
                  fontWeight: 700,
                  fontSize: "17px",
                  color: "var(--text-primary)",
                }}
              >
                Record
              </div>
              <div
                className="mt-0.5"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                Capture something now
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-disabled)" }}
            />
          </button>

          {/* Door 2 — Start a session */}
          <button
            onClick={onStartSession}
            className="w-full flex items-center px-5 rounded-2xl transition-all active:scale-[0.98]"
            style={{
              height: "112px",
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(200, 241, 53, 0.1)" }}
            >
              <Music
                className="w-5 h-5"
                style={{ color: "var(--accent-primary)" }}
              />
            </div>
            <div className="text-left ml-4 flex-1">
              <div
                style={{
                  fontFamily: "var(--font-app-title)",
                  fontWeight: 700,
                  fontSize: "17px",
                  color: "var(--text-primary)",
                }}
              >
                Start a session
              </div>
              <div
                className="mt-0.5"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                I have a song to work with
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-disabled)" }}
            />
          </button>
        </div>

        {/* Inbox indicator */}
        {inboxCount > 0 && (
          <button
            onClick={onInbox}
            className="mt-8 flex items-center gap-2 px-4 py-2.5 rounded-full transition-opacity hover:opacity-70"
            style={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Inbox className="w-3.5 h-3.5" style={{ color: "var(--accent-cool)" }} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {inboxCount} unorganised clip{inboxCount > 1 ? "s" : ""}
            </span>
            <ChevronRight className="w-3 h-3" style={{ color: "var(--text-disabled)" }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Returning user home (sessions list + FAB)
// ─────────────────────────────────────────────────────────────
function ReturningHome({
  sessions,
  sessionsLoading,
  inboxCount,
  onCapture,
  onInbox,
  onOpenSession,
  onNewSession,
  onDeleteSession,
  onSignOut,
}: {
  sessions: ReturnType<typeof useSessions>["sessions"];
  sessionsLoading: boolean;
  inboxCount: number;
  onCapture: () => void;
  onInbox: () => void;
  onOpenSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onSignOut: () => void;
}) {
  function relativeDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffD = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffD === 0) return "Today";
    if (diffD === 1) return "Yesterday";
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--surface-base)" }}
    >
      {/* Header */}
      <div
        className="h-14 px-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h1
          className="uppercase tracking-[0.18em]"
          style={{
            fontFamily: "var(--font-app-title)",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--text-primary)",
          }}
        >
          roam
        </h1>
        <button onClick={onSignOut} className="p-2">
          <LogOut className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
        </button>
      </div>

      {/* Inbox chip (top of content, subtle) */}
      {inboxCount > 0 && (
        <button
          onClick={onInbox}
          className="mx-4 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl transition-opacity hover:opacity-70"
          style={{
            backgroundColor: "var(--surface-overlay)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Inbox className="w-4 h-4" style={{ color: "var(--accent-cool)" }} />
          <span
            className="flex-1 text-left"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            {inboxCount} unorganised clip{inboxCount > 1 ? "s" : ""}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
        </button>
      )}

      {/* Sessions list */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {sessionsLoading ? (
          <div className="flex items-center justify-center h-32">
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>
              Loading sessions…
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="relative rounded-2xl overflow-hidden transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  onClick={() => onOpenSession(session.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  {/* Session art placeholder */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--surface-overlay)" }}
                  >
                    <Music className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-app-title)",
                        fontWeight: 600,
                        fontSize: "15px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {session.songName || "Untitled session"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {session.artist && (
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {session.artist}
                        </span>
                      )}
                      {session.artist && (
                        <span style={{ color: "var(--text-disabled)", fontSize: "10px" }}>·</span>
                      )}
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "12px",
                          color: "var(--text-disabled)",
                        }}
                      >
                        {relativeDate(session.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />
                </button>

                {/* Delete button — far right, unobtrusive */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: "var(--surface-overlay)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--text-disabled)" }} />
                </button>
              </div>
            ))}

            {/* + New session card */}
            <button
              onClick={onNewSession}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:opacity-70"
              style={{
                border: "1px dashed var(--border-subtle)",
                backgroundColor: "transparent",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--surface-overlay)" }}
              >
                <Plus className="w-5 h-5" style={{ color: "var(--text-disabled)" }} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-disabled)",
                }}
              >
                New session
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Persistent capture FAB — 56dp */}
      <button
        onClick={onCapture}
        className="fixed right-4 bottom-8 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95"
        style={{
          backgroundColor: "var(--accent-primary)",
          boxShadow: "0 4px 24px rgba(200, 241, 53, 0.3), 0 2px 8px rgba(0,0,0,0.4)",
          zIndex: 30,
        }}
      >
        <div
          className="w-5 h-5 rounded-full"
          style={{ backgroundColor: "var(--surface-base)" }}
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Home component
// ─────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { sessions, loading: sessionsLoading, createSession, deleteSession } = useSessions();
  const { clips: inboxClips } = useInbox();

  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionData, setNewSessionData] = useState({ songName: "", artist: "", tempo: 120 });
  const [creating, setCreating] = useState(false);

  const inboxCount = inboxClips.length;
  const hasAnySessions = !sessionsLoading && sessions.length > 0;

  const handleRecord = () => {
    navigate("/capture");
  };

  const handleCreateSession = async () => {
    setCreating(true);
    try {
      const session = await createSession({
        songName: newSessionData.songName || "Untitled",
        artist: newSessionData.artist,
        tempo: newSessionData.tempo,
        duration: 240,
        sections: [],
        mirrorEnabled: false,
      });
      setShowNewSessionDialog(false);
      setNewSessionData({ songName: "", artist: "", tempo: 120 });
      navigate(`/session/${session.id}`);
    } catch (e) {
      console.error("Create session failed:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
    } catch (e) {
      console.error("Delete session failed:", e);
    }
  };

  return (
    <>
      {/* Show two-door screen if no sessions, returning user screen if sessions exist */}
      {hasAnySessions ? (
        <ReturningHome
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          inboxCount={inboxCount}
          onCapture={handleRecord}
          onInbox={() => navigate("/inbox")}
          onOpenSession={(id) => navigate(`/session/${id}`)}
          onNewSession={() => setShowNewSessionDialog(true)}
          onDeleteSession={handleDeleteSession}
          onSignOut={signOut}
        />
      ) : (
        <TwoDoorHome
          onRecord={handleRecord}
          onStartSession={() => setShowNewSessionDialog(true)}
          inboxCount={inboxCount}
          onInbox={() => navigate("/inbox")}
        />
      )}

      {/* New session dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent
          className="sm:max-w-sm border-none p-0"
          style={{ backgroundColor: "var(--surface-raised)", borderRadius: "20px" }}
        >
          <div className="px-6 pt-6 pb-6">
            <p
              className="mb-5"
              style={{
                fontFamily: "var(--font-app-title)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              New session
            </p>

            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Song name"
                value={newSessionData.songName}
                onChange={(e) =>
                  setNewSessionData((d) => ({ ...d, songName: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="text"
                placeholder="Artist (optional)"
                value={newSessionData.artist}
                onChange={(e) =>
                  setNewSessionData((d) => ({ ...d, artist: e.target.value }))
                }
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewSessionDialog(false)}
                className="flex-1 h-12 rounded-xl"
                style={{
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className="flex-1 h-12 rounded-xl font-semibold"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--surface-base)",
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
