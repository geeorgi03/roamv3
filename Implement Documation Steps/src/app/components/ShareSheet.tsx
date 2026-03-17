import { useState } from "react";
import { X, Check } from "lucide-react";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  clipId?: string;
  sessionId?: string;
}

type SheetState = "default" | "copied";

export default function ShareSheet({
  isOpen,
  onClose,
  clipId,
  sessionId,
}: ShareSheetProps) {
  const [state, setState] = useState<SheetState>("default");

  const handleCopyLink = () => {
    // In a real app, generate a share token from the server and copy to clipboard
    const mockLink = `${window.location.origin}/share/${clipId || "demo"}`;
    navigator.clipboard.writeText(mockLink).catch(() => {});
    setState("copied");
  };

  const handleClose = () => {
    setState("default");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={handleClose}
      />

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
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--border-subtle)" }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--surface-overlay)" }}
        >
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        {state === "default" ? (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-app-title)",
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Share this clip
              </p>

              {/* The trust copy */}
              <div className="space-y-1">
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  Viewers will be asked:
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-app-title)",
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "var(--text-primary)",
                    lineHeight: "1.5",
                  }}
                >
                  "What stayed with you?"
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                    marginTop: "8px",
                  }}
                >
                  That's the only question.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-disabled)",
                    lineHeight: "1.6",
                  }}
                >
                  No other feedback is collected.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                }}
              >
                Copy link
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 rounded-xl font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--surface-base)",
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Confirmation */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <p
                  style={{
                    fontFamily: "var(--font-app-title)",
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "var(--text-primary)",
                  }}
                >
                  Link copied
                </p>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginTop: "8px",
                }}
              >
                Anyone with this link can watch and respond.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--surface-overlay)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-primary)",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}
