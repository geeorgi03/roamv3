import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { apiRequest } from "../../utils/supabase";

type ViewerState = "watching" | "submitted";
type SubmitError = string | null;

type SharedClip = {
  id: string;
  videoUrl: string;
  prompt?: string;
};

export default function ClipShareView() {
  const { token } = useParams<{ token: string }>();
  const [response, setResponse] = useState("");
  const [viewerState, setViewerState] = useState<ViewerState>("watching");
  const [clip, setClip] = useState<SharedClip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<SubmitError>(null);
  const [hasWatched, setHasWatched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Reset viewer-local state when token changes
      setHasWatched(false);
      setViewerState("watching");
      setResponse("");
      setSubmitError(null);
      
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await apiRequest(`/share/${token}`);
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            throw new Error("Link expired");
          }
          throw new Error("Share not found");
        }
        const data = await res.json();
        const nextClip: SharedClip = data.clip || data;
        if (!cancelled) setClip(nextClip);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load share");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setSubmitError(null);
    try {
      const res = await apiRequest(`/share/${token}/response`, {
        method: "POST",
        body: JSON.stringify({ response }),
      });
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) {
          setSubmitError("Link expired");
        } else {
          setSubmitError("Failed to send response");
        }
        return;
      }
      setViewerState("submitted");
    } catch {
      setSubmitError("Failed to send response");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FAFAFA", color: "#111" }}>
      {/* Video Player */}
      <div
        className="w-full"
        style={{
          aspectRatio: "16/9",
          backgroundColor: "#E8E8E8",
          position: "relative",
        }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
            Loading…
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: "#666", fontSize: "16px", fontWeight: 600 }}>
              {error}
            </span>
            {error === "Link expired" && (
              <span style={{ color: "#999", fontSize: "13px" }}>
                This share link is no longer active.
              </span>
            )}
          </div>
        ) : clip?.videoUrl ? (
          <video src={clip.videoUrl} controls autoPlay={false} playsInline onEnded={() => setHasWatched(true)} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
            No video available
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "#E0E0E0" }} />

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#888",
                textAlign: "center",
              }}
            >
              Loading…
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#888",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          </div>
        ) : !clip?.videoUrl ? (
          <div className="flex items-center justify-center h-full">
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#888",
                textAlign: "center",
              }}
            >
              No video available
            </p>
          </div>
        ) : !hasWatched ? (
          <div className="flex items-center justify-center h-full">
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#888",
                textAlign: "center",
              }}
            >
              Watch the clip to share your response.
            </p>
          </div>
        ) : viewerState === "watching" ? (
          <div className="space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <h2
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "22px",
                  color: "#111",
                  lineHeight: "1.4",
                }}
              >
                {clip?.prompt || "What stayed with you?"}
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Describe something specific you
                <br />
                noticed or remember.
              </p>
            </div>

            {/* Text input */}
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder=""
              rows={4}
              className="w-full resize-none outline-none rounded-xl px-4 py-3"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "16px",
                color: "#111",
                backgroundColor: "#F0F0F0",
                border: "1px solid #E0E0E0",
                lineHeight: "1.6",
                minHeight: "100px",
              }}
            />

            {/* Submit error */}
            {submitError && (
              <div
                className="px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "14px",
                    color: "#DC2626",
                  }}
                >
                  {submitError}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="w-full py-4 rounded-xl font-semibold transition-opacity"
              style={{
                backgroundColor: response.trim() ? "#111" : "#DDD",
                color: response.trim() ? "#FFF" : "#999",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "15px",
                cursor: response.trim() ? "pointer" : "not-allowed",
              }}
            >
              Send response
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-8 text-center">
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "#111",
              }}
            >
              Thank you.
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#888",
                lineHeight: "1.6",
              }}
            >
              Your response has been sent.
            </p>
          </div>
        )}
      </div>

      {/* Roam wordmark */}
      <div className="pb-8 flex justify-center">
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            color: "#CCC",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          roam
        </span>
      </div>
    </div>
  );
}

