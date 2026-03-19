import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { apiRequest, uploadFile } from "../../utils/supabase";

type AttachmentState =
  | { type: "default" }
  | { type: "loading"; url: string }
  | { type: "preview"; metadata: TrackMetadata }
  | { type: "error"; message: string };

interface TrackMetadata {
  title: string;
  artist: string;
  duration: number; // in seconds
}

interface MusicAttachmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { type: "url" | "file"; value: string | File; metadata?: TrackMetadata }) => void;
  importing?: boolean;
}

export default function MusicAttachmentSheet({
  isOpen,
  onClose,
  onConfirm,
  importing = false,
}: MusicAttachmentSheetProps) {
  const [state, setState] = useState<AttachmentState>({ type: "default" });
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlPaste = async (value: string) => {
    setUrlValue(value);

    // Simple validation for Spotify/YouTube URLs
    const isValidUrl = value.includes("spotify.com") || value.includes("youtube.com") || value.includes("youtu.be");

    if (!isValidUrl || value.length < 10) return;

    setState({ type: "loading", url: value });
    try {
      const res = await apiRequest(`/music-import`, {
        method: "POST",
        body: JSON.stringify({ url: value }),
      });

      if (!res.ok) {
        throw new Error("This track couldn't be imported.");
      }

      const data = await res.json();
      const metadata: TrackMetadata = {
        title: data?.metadata?.title || "Unknown title",
        artist: data?.metadata?.artist || "Unknown artist",
        duration: Number(data?.metadata?.duration) || 0,
      };

      setState({ type: "preview", metadata });
    } catch (e) {
      setState({
        type: "error",
        message: e instanceof Error ? e.message : "This track couldn't be imported.",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ type: "loading", url: file.name });
    try {
      const { url } = await uploadFile(file, "audio");
      onConfirm({ type: "file", value: url });
      handleClose();
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  };

  const handleConfirm = () => {
    if (state.type === "preview") {
      onConfirm({
        type: "url",
        value: urlValue,
        metadata: state.metadata,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setState({ type: "default" });
    setUrlValue("");
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 border-none"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderRadius: "16px",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 600,
              fontSize: "18px",
              color: "var(--text-primary)",
            }}
          >
            Add music
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Default State */}
          {state.type === "default" && (
            <div className="space-y-4">
              {/* URL Input */}
              <input
                type="text"
                placeholder="Paste a Spotify or YouTube link"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onBlur={(e) => handleUrlPaste(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUrlPaste(urlValue);
                  }
                }}
                className="w-full px-4 py-3 rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: "var(--surface-base)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                }}
              />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-disabled)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
              </div>

              {/* File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--surface-base)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Upload className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Upload a file
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {/* Loading State */}
          {state.type === "loading" && (
            <div className="space-y-4">
              {/* URL Display */}
              <div
                className="px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: "var(--surface-base)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="truncate"
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {state.url}
                </div>
              </div>

              {/* Loading Indicator */}
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-disabled)" }} />
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-disabled)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Finding track…
                </span>
              </div>
            </div>
          )}

          {/* Preview State */}
          {state.type === "preview" && (
            <div className="space-y-6">
              {/* Track Info */}
              <div className="space-y-1">
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {state.metadata.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {state.metadata.artist}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatDuration(state.metadata.duration)}
                </div>
              </div>

              {/* Waveform Placeholder */}
              <div className="h-12 rounded flex items-center gap-0.5 px-2" style={{ backgroundColor: "var(--surface-base)" }}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const height = 30 + Math.sin(i * 0.2) * 15;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${height}%`,
                        backgroundColor: "var(--waveform-fill)",
                        minWidth: "2px",
                      }}
                    />
                  );
                })}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "var(--surface-base)",
                    fontSize: "14px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={handleClose}
                  className="w-full text-center transition-opacity hover:opacity-80"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.type === "error" && (
            <div className="space-y-4">
              {/* Error Message */}
              <div className="py-4 space-y-2">
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {state.message}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Try uploading an audio file instead.
                </p>
              </div>

              {/* Fallback Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--surface-base)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Upload className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Upload a file
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}