import { useState } from "react";
import { useParams } from "react-router";

type ViewerState = "watching" | "submitted";

export default function ClipShareView() {
  const { token } = useParams<{ token: string }>();
  const [response, setResponse] = useState("");
  const [viewerState, setViewerState] = useState<ViewerState>("watching");

  const handleSubmit = () => {
    if (!response.trim()) return;
    // In a real app, POST to /share/:token/response
    setViewerState("submitted");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAFA", color: "#111" }}
    >
      {/* Video Player */}
      <div
        className="w-full"
        style={{
          aspectRatio: "16/9",
          backgroundColor: "#E8E8E8",
          position: "relative",
        }}
      >
        {/* Placeholder video area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(0,0,0,0.5)">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "#E0E0E0" }} />

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {viewerState === "watching" ? (
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
                What stayed with you?
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Describe something specific you<br />noticed or remember.
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
