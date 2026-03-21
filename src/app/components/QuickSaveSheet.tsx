import { useState } from "react";
import { Check, Mic, Video, AlertCircle, WifiOff } from "lucide-react";
import { useNavigate } from "react-router";
import { useSessions } from "../hooks/useSessions";
import { useInbox } from "../hooks/useInbox";
import { uploadFile } from "../../utils/supabase";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { addPendingClip } from "../lib/pendingQueue";

export interface CaptureResult {
  mediaType: "video" | "audio";
  blob?: Blob;
  duration?: number;
}

interface QuickSaveSheetProps {
  capture: CaptureResult | null;
  onDismiss: () => void;
  fromCaptureFirst?: boolean;
  targetSessionId?: string;
  targetSection?: string;
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

export default function QuickSaveSheet({ capture, onDismiss, fromCaptureFirst, targetSessionId, targetSection }: QuickSaveSheetProps) {
  const navigate = useNavigate();
  const { sessions, createSession } = useSessions();
  const { saveClip, assignClip } = useInbox();
  const [state, setState] = useState<SheetState>("saved");
  const [sessionName, setSessionName] = useState("");
  const [savedClipId, setSavedClipId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const online = useOnlineStatus();

  const blobToDataUrl = (blob: Blob) =>
    new Promise<{ dataUrl: string; mimeType: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: String(reader.result), mimeType: blob.type || "application/octet-stream" });
      reader.onerror = () => reject(reader.error || new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });

  // Save to inbox immediately (if not yet saved)
  const ensureSaved = async (): Promise<string> => {
    if (savedClipId) return savedClipId;
    setSaving(true);
    setSaveError(null);
    try {
      if (!capture?.blob) {
        throw new Error("No media captured — please try recording again");
      }
      let videoUrl: string | undefined;
      let audioUrl: string | undefined;
      let offlineDataUrl: string | undefined;
      let offlineMimeType: string | undefined;
      
      if (online) {
        // Online: upload immediately
        const uploaded = await uploadFile(capture.blob, capture.mediaType === "audio" ? "audio" : "video");
        if (!uploaded?.url) {
          throw new Error("Upload failed — no media URL returned");
        }
        if (capture.mediaType === "audio") {
          audioUrl = uploaded.url;
        } else {
          videoUrl = uploaded.url;
        }
        if (!videoUrl && !audioUrl) {
          throw new Error("Upload failed — no media URLs available");
        }
      } else {
        const { dataUrl, mimeType } = await blobToDataUrl(capture.blob);
        offlineDataUrl = dataUrl;
        offlineMimeType = mimeType;
        videoUrl = capture.mediaType === "video" ? dataUrl : undefined;
        audioUrl = capture.mediaType === "audio" ? dataUrl : undefined;
      }

      const clipData = {
        mediaType: capture.mediaType,
        duration: capture.duration,
        createdAt: new Date().toISOString(),
        videoUrl,
        audioUrl,
      };

      if (online) {
        // Online: save directly
        const clip = await saveClip(clipData);
        setSavedClipId(clip.id);
        return clip.id;
      } else {
        const tempId = `temp-${Date.now()}`;
        addPendingClip({
          tempId,
          mediaType: capture.mediaType,
          duration: capture.duration,
          createdAt: new Date().toISOString(),
          blobBase64: offlineDataUrl || "",
          blobMimeType: offlineMimeType || capture.blob.type || "application/octet-stream",
          status: "pending",
          retryCount: 0,
        });

        setSavedClipId(tempId);
        return tempId;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setSaveError(/no media captured/i.test(msg) ? "Recording failed — no media saved" : msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleLater = async () => {
    try {
      await ensureSaved();
      onDismiss();
      if (fromCaptureFirst) {
        navigate("/inbox");
      } else {
        navigate(-1);
      }
    } catch {
      // keep sheet open; error rendered inline
    }
  };

  const handleNewSession = async () => {
    setAssignError(null);
    if (!online) {
      setAssignError("Internet required — connect to assign to a session");
      return;
    }
    setAssigning(true);
    try {
      const name = sessionName.trim();
      let session;
      
      session = await createSession({
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
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to create session");
      setAssigning(false);
    }
  };

  const handleAssignToSession = async (sessionId: string) => {
    setAssignError(null);
    if (!online) {
      setAssignError("Internet required — connect to assign to a session");
      return;
    }
    setAssigning(true);
    try {
      const clipId = await ensureSaved();
      await assignClip(clipId, sessionId, targetSection);
      
      onDismiss();
      const toastParam = targetSection ? `?toast=Added+to+${encodeURIComponent(targetSection)}` : "";
      navigate(`/session/${sessionId}${toastParam}`);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign clip");
      setAssigning(false);
    }
  };

  const handleSaveToInboxFallback = async () => {
    setAssignError(null);
    try {
      await ensureSaved();
      onDismiss();
      navigate("/inbox");
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  if (!capture) return null;

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={saveError ? undefined : handleLater} />

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
              
              {/* Offline indicator */}
              {!online && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(255, 107, 53, 0.1)" }}>
                  <WifiOff className="w-3 h-3" style={{ color: "var(--accent-warm)" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-warm)" }}>
                    Will sync when online
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px my-5" style={{ backgroundColor: "var(--border-subtle)" }} />

            {/* Prompt */}
            <p className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)" }}>
              Add to session?
            </p>

            {/* Error row for targeted save */}
            {saveError && (
              <div
                className="mb-4 px-3 py-2 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-warm)" }} />
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>{saveError}</p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={async () => {
                        setSaveError(null);
                        try {
                          await ensureSaved();
                        } catch {
                          // Error already set by ensureSaved
                        }
                      }}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 600 }}
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleSaveToInboxFallback}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      Save to Inbox instead
                    </button>
                  </div>
                </div>
              </div>
            )}
            {assignError && (
              <div
                className="mb-4 px-3 py-2 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-warm)" }} />
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>
                    {assignError}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => targetSessionId && handleAssignToSession(targetSessionId)}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 600 }}
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleSaveToInboxFallback}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      Save to Inbox instead
                    </button>
                  </div>
                </div>
              </div>
            )}

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

              {/* If launched from Workbench with target, show "Save to [section]" as primary */}
              {targetSessionId && targetSection ? (
                <button
                  onClick={() => handleAssignToSession(targetSessionId)}
                  disabled={assigning}
                  className="flex-[2] h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--surface-base)",
                    opacity: assigning ? 0.6 : 1,
                  }}
                >
                  {assigning ? "Saving…" : `Save to ${targetSection}`}
                </button>
              ) : (
                <>
                  {/* + New session */}
                  <button
                    onClick={() => setState("new-session")}
                    disabled={!online}
                    className="flex-1 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: "var(--surface-overlay)",
                      border: "1px solid var(--border-subtle)",
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      opacity: !online ? 0.55 : 1,
                    }}
                  >
                    {!online ? (
                      <span className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
                        <span style={{ color: "var(--text-disabled)" }}>Internet required</span>
                      </span>
                    ) : (
                      "+ New session"
                    )}
                  </button>

                  {/* Existing → */}
                  {sessions.length > 0 && (
                    <button
                      onClick={() => setState("picker")}
                      disabled={!online}
                      className="flex-1 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: "var(--accent-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--surface-base)",
                        opacity: !online ? 0.55 : 1,
                      }}
                    >
                      {!online ? (
                        <span className="flex items-center gap-2">
                          <WifiOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.75)" }} />
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>Internet required</span>
                        </span>
                      ) : (
                        "Existing →"
                      )}
                    </button>
                  )}
                </>
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

            {/* Error row for new session */}
            {assignError && (
              <div
                className="mb-4 px-3 py-2 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-warm)" }} />
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>
                    {assignError}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleNewSession}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 600 }}
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleSaveToInboxFallback}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      Save to Inbox instead
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                disabled={assigning}
                className="flex-1 h-12 rounded-xl font-semibold"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--surface-base)",
                  opacity: assigning ? 0.6 : 1,
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

            {/* Error row for picker assign */}
            {assignError && (
              <div
                className="mx-6 mb-3 px-3 py-2 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-warm)" }} />
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-warm)" }}>
                    {assignError}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setAssignError(null)}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 600 }}
                    >
                      Try another
                    </button>
                    <button
                      onClick={handleSaveToInboxFallback}
                      style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      Save to Inbox instead
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-auto flex-1 pb-6" style={{ opacity: assigning ? 0.5 : 1, pointerEvents: assigning ? "none" : "auto" }}>
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

