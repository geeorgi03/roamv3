import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic, Video, Play, ArrowRight, Trash2, Inbox, WifiOff, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useInbox, type InboxClip } from "../hooks/useInbox";
import { useSessions } from "../hooks/useSessions";

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return online;
}

type PendingDelete = {
  clipId: string;
  clip: InboxClip;
  countdown: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDuration(sec?: number) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isOlderThan48h(iso: string) {
  return Date.now() - new Date(iso).getTime() > 48 * 60 * 60 * 1000;
}

interface AssignPickerProps {
  clip: InboxClip;
  sessions: ReturnType<typeof useSessions>["sessions"];
  onAssign: (clipId: string, sessionId: string) => void;
  onClose: () => void;
  onKeepInInbox?: () => void;
  assignError?: string | null;
  assigning?: boolean;
}

function AssignPicker({ clip, sessions, onAssign, onClose, onKeepInInbox, assignError, assigning }: AssignPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
          maxHeight: "65vh",
        }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <p
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 600,
              fontSize: "16px",
              color: "var(--text-primary)",
            }}
          >
            Assign to session
          </p>
          <button onClick={onClose} style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
            Cancel
          </button>
        </div>

        {/* Assign error inline */}
        {assignError && (
          <div
            className="mx-5 mb-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>
              {assignError}
            </p>
            {onKeepInInbox && (
              <button
                onClick={onKeepInInbox}
                className="mt-2"
                style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
              >
                Keep in Inbox instead
              </button>
            )}
          </div>
        )}

        <div className="overflow-auto pb-8" style={{ opacity: assigning ? 0.5 : 1, pointerEvents: assigning ? "none" : "auto" }}>
          {sessions.length === 0 ? (
            <p className="px-5 py-8 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>
              No sessions yet
            </p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onAssign(clip.id, session.id)}
                className="w-full px-5 h-14 flex items-center justify-between transition-opacity hover:opacity-70"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="text-left">
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-primary)" }}>
                    {session.songName || "Untitled session"}
                  </div>
                  {session.artist && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>{session.artist}</div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function InboxScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetSessionId = searchParams.get("sessionId");
  const targetSection = searchParams.get("section");
  const { clips, loading, error, staleClips, assignClip, deleteClip, refresh } = useInbox();
  const { sessions } = useSessions();
  const [assigningClip, setAssigningClip] = useState<InboxClip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const online = useOnlineStatus();
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignErrorClipId, setAssignErrorClipId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleDelete = (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const timerId = setTimeout(async () => {
      deleteTimerRef.current = null;
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPendingDelete(null);
      setDeletingId(clipId);
      try {
        await deleteClip(clipId);
      } catch (err) {
        showToast("Failed to delete. Restored.");
      } finally {
        setDeletingId(null);
      }
    }, 5000);

    deleteTimerRef.current = timerId;
    setPendingDelete({ clipId, clip, countdown: 5 });

    countdownRef.current = setInterval(() => {
      setPendingDelete((prev) => {
        if (!prev || prev.clipId !== clipId) return prev;
        if (prev.countdown <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return prev;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setPendingDelete(null);
    showToast("Restored");
  };

  const visibleClips = clips.filter((c) => c.id !== pendingDelete?.clipId);

  const handleAssign = async (clipId: string, sessionId: string) => {
    if (!online) {
      showToast("You're offline — assign when back online");
      return;
    }
    setAssignError(null);
    setAssignErrorClipId(null);
    setAssigning(true);
    try {
      await assignClip(clipId, sessionId, targetSessionId ? targetSection || undefined : undefined);
      setAssigningClip(null);
      setAssigning(false);
      if (targetSessionId) {
        const sectionLabel = targetSection || "session";
        navigate(`/session/${targetSessionId}?toast=Added+to+${encodeURIComponent(sectionLabel)}`);
      } else {
        const session = sessions.find((s) => s.id === sessionId);
        const name = session?.songName || "session";
        showToast(`Added to ${name} ✓`);
      }
    } catch (err) {
      const session = sessions.find((s) => s.id === sessionId);
      const sectionLabel = targetSection || session?.songName || "session";
      setAssignError(`Couldn't save to ${sectionLabel}. Try again or keep in Inbox.`);
      setAssignErrorClipId(clipId);
      setAssigning(false);
    }
  };

  const handleKeepInInbox = () => {
    setAssignError(null);
    setAssignErrorClipId(null);
    setAssigningClip(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--surface-base)" }}>
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        </button>
        <h1
          style={{
            fontFamily: "var(--font-app-title)",
            fontWeight: 700,
            fontSize: "17px",
            color: "var(--text-primary)",
          }}
        >
          Inbox
        </h1>
        {clips.length > 0 && (
          <span
            className="ml-1 px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--surface-overlay)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            {clips.length}
          </span>
        )}
      </div>

      {/* 48h nudge banner */}
      {staleClips.length > 0 && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: "rgba(200, 241, 53, 0.06)",
            border: "1px solid rgba(200, 241, 53, 0.15)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.5",
            }}
          >
            You have {staleClips.length} idea{staleClips.length > 1 ? "s" : ""} waiting
            {staleClips.length > 1 ? " — " : " — "}want to do something with {staleClips.length > 1 ? "them" : "it"}?
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>Loading…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--accent-warm)", textAlign: "center" }}>
            {error}
          </p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--accent-primary)",
            }}
          >
            Retry
          </button>
        </div>
      ) : visibleClips.length === 0 && !pendingDelete ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <Inbox className="w-10 h-10" style={{ color: "var(--text-disabled)" }} />
          <p
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 600,
              fontSize: "16px",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            Nothing here
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-disabled)",
              textAlign: "center",
              lineHeight: "1.6",
            }}
          >
            Clips you capture without a session will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pt-2 pb-8">
          {visibleClips.map((clip) => {
            const stale = isOlderThan48h(clip.createdAt);
            return (
              <div
                key={clip.id}
                className="mx-4 mb-2 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  opacity: deletingId === clip.id ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--surface-overlay)" }}>
                    {clip.mediaType === "audio" ? (
                      <Mic className="w-5 h-5" style={{ color: "var(--accent-cool)" }} />
                    ) : (
                      <Video className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-primary)" }}>
                        {clip.mediaType === "audio" ? "Voice memo" : "Video clip"}
                      </span>
                      {stale && (
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(255, 107, 53, 0.15)",
                            fontSize: "10px",
                            color: "var(--accent-warm)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          waiting
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-disabled)" }}>
                        {formatDate(clip.createdAt)}
                      </span>
                      {clip.duration && (
                        <>
                          <span style={{ color: "var(--text-disabled)", fontSize: "10px" }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-disabled)" }}>
                            {formatDuration(clip.duration)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Play */}
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--surface-overlay)" }}>
                      <Play className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} fill="currentColor" />
                    </button>

                    {/* Assign — direct assign if coming from workbench, otherwise open picker */}
                    {targetSessionId && targetSection ? (
                      <button
                        onClick={() => handleAssign(clip.id, targetSessionId)}
                        disabled={!online}
                        className="h-8 px-2 rounded-lg flex items-center gap-1"
                        style={{
                          backgroundColor: online ? "rgba(200,241,53,0.15)" : "var(--surface-overlay)",
                          border: `1px solid ${online ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                          opacity: online ? 1 : 0.5,
                        }}
                      >
                        {!online && <WifiOff className="w-3 h-3" style={{ color: "var(--text-disabled)" }} />}
                        <span style={{ fontSize: "11px", color: online ? "var(--accent-primary)" : "var(--text-disabled)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                          Add to {targetSection}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (online) {
                            setAssigningClip(clip);
                          } else {
                            showToast("You're offline — assign when back online");
                          }
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "var(--surface-overlay)", opacity: online ? 1 : 0.5 }}
                      >
                        {online ? (
                          <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5" style={{ color: "var(--text-disabled)" }} />
                        )}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(clip.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--surface-overlay)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--text-disabled)" }} />
                    </button>
                  </div>
                </div>

                {/* Inline error for direct assign mode */}
                {targetSessionId && targetSection && assignErrorClipId === clip.id && assignError && (
                  <div
                    className="px-4 py-3 flex items-start gap-2"
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      backgroundColor: "rgba(255, 107, 53, 0.06)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-warm)" }} />
                    <div className="flex-1">
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>
                        {assignError}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleAssign(clip.id, targetSessionId)}
                          disabled={assigning}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            color: "var(--accent-primary)",
                            fontWeight: 600,
                            opacity: assigning ? 0.5 : 1,
                          }}
                        >
                          {assigning ? "Retrying…" : "Retry"}
                        </button>
                        <button
                          onClick={handleKeepInInbox}
                          style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
                        >
                          Keep in Inbox
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign picker */}
      {assigningClip && (
        <AssignPicker
          clip={assigningClip}
          sessions={sessions}
          onAssign={handleAssign}
          onClose={() => { setAssigningClip(null); setAssignError(null); setAssignErrorClipId(null); }}
          onKeepInInbox={handleKeepInInbox}
          assignError={assignError}
          assigning={assigning}
        />
      )}

      {/* Toast */}
      {toastMessage && !pendingDelete && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{
            backgroundColor: "rgba(20,20,20,0.92)",
            border: "1px solid var(--border-subtle)",
            zIndex: 60,
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-primary)" }}>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Undo delete toast */}
      {pendingDelete && (
        <div
          className="fixed bottom-8 left-4 right-4 px-4 py-3 rounded-xl flex items-center justify-between"
          style={{
            backgroundColor: "rgba(20,20,20,0.95)",
            border: "1px solid var(--border-subtle)",
            zIndex: 60,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--surface-overlay)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {pendingDelete.countdown}
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>
              Clip deleted
            </span>
          </div>
          <button
            onClick={handleUndo}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: "var(--accent-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--surface-base)",
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

