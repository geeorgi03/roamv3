import { useState } from "react";
import { ArrowLeft, Mic, Video, Play, ArrowRight, Trash2, Inbox } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useInbox, type InboxClip } from "../hooks/useInbox";
import { useSessions } from "../hooks/useSessions";

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
}

function AssignPicker({ clip, sessions, onAssign, onClose }: AssignPickerProps) {
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
        <div className="overflow-auto pb-8">
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
  const { clips, loading, staleClips, assignClip, deleteClip } = useInbox();
  const { sessions } = useSessions();
  const [assigningClip, setAssigningClip] = useState<InboxClip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleDelete = async (clipId: string) => {
    setDeletingId(clipId);
    try {
      await deleteClip(clipId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAssign = async (clipId: string, sessionId: string) => {
    await assignClip(clipId, sessionId);
    setAssigningClip(null);
    if (targetSessionId) {
      navigate(`/session/${targetSessionId}`);
    } else {
      const session = sessions.find((s) => s.id === sessionId);
      const name = session?.songName || "session";
      showToast(`Added to ${name} ✓`);
    }
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
      ) : clips.length === 0 ? (
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
          {clips.map((clip) => {
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
                        className="h-8 px-2 rounded-lg flex items-center gap-1"
                        style={{ backgroundColor: "rgba(200,241,53,0.15)", border: "1px solid var(--accent-primary)" }}
                      >
                        <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                          Add to {targetSection}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssigningClip(clip)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "var(--surface-overlay)" }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
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
              </div>
            );
          })}
        </div>
      )}

      {/* Assign picker */}
      {assigningClip && (
        <AssignPicker clip={assigningClip} sessions={sessions} onAssign={handleAssign} onClose={() => setAssigningClip(null)} />
      )}

      {/* Toast */}
      {toastMessage && (
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
    </div>
  );
}

