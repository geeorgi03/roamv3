import { useState, useEffect } from "react";
import { X, Check, Copy, ExternalLink, AlertCircle } from "lucide-react";
import { apiRequest } from "../../utils/supabase";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  clipId?: string;
  sessionId?: string;
  clipLabel?: string;
  clipDuration?: string;
}

function buildShareUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${token}`;
}

export default function ShareSheet({ isOpen, onClose, clipId, sessionId, clipLabel, clipDuration }: ShareSheetProps) {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLinkUrl(null);
      setGenError(null);
    }
  }, [isOpen]);

  const handleGenerateLink = async () => {
    if (!clipId || !sessionId) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await apiRequest(`/sessions/${sessionId}/clips/${clipId}/share`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to generate link (${res.status})`);
      }
      const data = await res.json();
      const url = data.url || (data.token ? buildShareUrl(data.token) : null);
      if (!url) {
        throw new Error("No share URL returned");
      }
      setLinkUrl(url);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  const canGenerateLink = Boolean(clipId && sessionId);

  if (!isOpen) return null;

  const shareTarget = clipId ? "clip" : "session";
  const displayLabel = clipLabel || (clipId ? "Clip" : (sessionId ? "Session" : ""));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={handleClose} />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl px-6 pt-4 pb-10"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--surface-overlay)" }}
        >
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <p
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 600,
              fontSize: "16px",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Share this {shareTarget}
          </p>
          {(displayLabel || clipDuration) && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
              {displayLabel}{clipDuration ? ` · ${clipDuration}` : ""}
            </p>
          )}
        </div>

        {/* Trust copy */}
        <div className="space-y-1 mb-6">
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Viewers will be asked:
          </p>
          <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", lineHeight: "1.5" }}>
            "What stayed with you?"
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", marginTop: "4px" }}>
            That's the only question.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)", lineHeight: "1.6" }}>
            No other feedback is collected.
          </p>
        </div>

        {/* Error */}
        {genError && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
            style={{ backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)" }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#FF6B6B" }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#FF6B6B" }}>{genError}</p>
          </div>
        )}

        {/* Link area */}
        {linkUrl ? (
          <div className="space-y-3">
            {/* URL pill */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
            >
              <span
                className="flex-1 truncate"
                style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}
              >
                {linkUrl}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: copied ? "rgba(200,241,53,0.15)" : "var(--surface-overlay)",
                  border: `1px solid ${copied ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: copied ? "var(--accent-primary)" : "var(--text-primary)",
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                onClick={() => window.open(linkUrl, "_blank")}
                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--surface-base)",
                }}
              >
                <ExternalLink className="w-4 h-4" />
                View
              </button>
            </div>

          </div>
        ) : (
          <button
            onClick={canGenerateLink ? handleGenerateLink : undefined}
            disabled={generating || !canGenerateLink}
            className="w-full h-12 rounded-xl font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: generating || !canGenerateLink ? "var(--surface-overlay)" : "var(--accent-primary)",
              border: generating || !canGenerateLink ? "1px solid var(--border-subtle)" : "none",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: generating || !canGenerateLink ? "var(--text-disabled)" : "var(--surface-base)",
            }}
          >
            {generating ? "Generating…" : canGenerateLink ? "Generate link" : "Select a clip to share"}
          </button>
        )}
      </div>
    </>
  );
}
