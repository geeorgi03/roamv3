import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import QuickSaveSheet, { type CaptureResult } from "../components/QuickSaveSheet";

type CaptureMode = "idle" | "video-recording" | "voice-recording" | "saved";

const LONG_PRESS_MS = 500;

export default function CaptureCamera() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const section = searchParams.get("section");
  const fromCaptureFirst = !sessionId;

  const [mode, setMode] = useState<CaptureMode>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [longPressProgress, setLongPressProgress] = useState(0); // 0–1
  const [voiceMode, setVoiceMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capture, setCapture] = useState<CaptureResult | null>(null);
  const [voiceBars, setVoiceBars] = useState<number[]>(Array.from({ length: 24 }, () => 0.3));

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err) {
      console.warn("Camera unavailable:", err);
      setCameraError("Camera unavailable — tap to continue in voice mode");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopAllTracks();
    };
  }, [startCamera]);

  const stopAllTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Recording timer
  const startTimer = () => {
    startTimeRef.current = Date.now();
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    return Math.round((Date.now() - startTimeRef.current) / 1000);
  };

  // Voice bar animation
  const startVoiceAnim = () => {
    voiceAnimRef.current = setInterval(() => {
      setVoiceBars((prev) =>
        prev.map((_, i) => {
          const base = 0.15 + Math.random() * 0.7;
          const envelope = Math.sin((i / prev.length) * Math.PI);
          return base * (0.3 + envelope * 0.7);
        })
      );
    }, 80);
  };

  const stopVoiceAnim = () => {
    if (voiceAnimRef.current) clearInterval(voiceAnimRef.current);
    setVoiceBars(Array.from({ length: 24 }, () => 0.15));
  };

  // Start video recording
  const startVideoRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(100);
    } catch (e) {
      console.warn("MediaRecorder failed:", e);
    }
    setMode("video-recording");
    startTimer();
  };

  // Start voice recording
  const startVoiceRecording = () => {
    chunksRef.current = [];
    try {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((audioStream) => {
          streamRef.current = audioStream;
          const recorder = new MediaRecorder(audioStream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorderRef.current = recorder;
          recorder.start(100);
        })
        .catch((e) => console.warn("Mic unavailable:", e));
    } catch (e) {
      console.warn("Audio recording unavailable:", e);
    }
    setMode("voice-recording");
    setVoiceMode(true);
    startTimer();
    startVoiceAnim();
  };

  // Stop recording
  const stopRecording = useCallback(async () => {
    const duration = stopTimer();
    stopVoiceAnim();

    return new Promise<CaptureResult>((resolve) => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = () => {
          const mimeType = voiceMode ? "audio/webm" : "video/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          resolve({
            mediaType: voiceMode ? "audio" : "video",
            blob,
            duration,
          });
        };
        recorderRef.current.stop();
      } else {
        resolve({
          mediaType: voiceMode ? "audio" : "video",
          duration,
        });
      }
    });
  }, [voiceMode]);

  // Tap: toggle video recording
  const handleTap = async () => {
    if (mode === "idle" && !voiceMode) {
      startVideoRecording();
    } else if (mode === "video-recording") {
      const result = await stopRecording();
      stopAllTracks();
      setMode("saved");
      setCapture(result);
    }
  };

  // Long-press: enter voice mode
  const handlePointerDown = () => {
    if (mode !== "idle" || voiceMode) return;

    let elapsed = 0;
    longPressAnimRef.current = setInterval(() => {
      elapsed += 50;
      setLongPressProgress(Math.min(elapsed / LONG_PRESS_MS, 1));
      if (elapsed >= LONG_PRESS_MS) {
        clearInterval(longPressAnimRef.current!);
      }
    }, 50);

    longPressRef.current = setTimeout(() => {
      setLongPressProgress(0);
      startVoiceRecording();
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = async () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (longPressAnimRef.current) {
      clearInterval(longPressAnimRef.current);
      longPressAnimRef.current = null;
    }

    if (mode === "voice-recording") {
      const result = await stopRecording();
      stopAllTracks();
      setMode("saved");
      setCapture(result);
      setLongPressProgress(0);
    } else {
      setLongPressProgress(0);
    }
  };

  const handleClose = () => {
    stopAllTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(-1);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  const isRecording = mode === "video-recording" || mode === "voice-recording";

  // Circumference for SVG ring
  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const ringDash = longPressProgress * CIRC;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#000", zIndex: 100 }}>
      {/* ── Camera preview / Voice background ── */}
      {voiceMode ? (
        /* Voice-only — pure black with animated mic */
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Mic icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: mode === "voice-recording" ? "rgba(255, 59, 48, 0.15)" : "var(--surface-overlay)",
              border: `2px solid ${mode === "voice-recording" ? "#FF3B30" : "var(--border-subtle)"}`,
              transition: "all 0.3s",
            }}
          >
            <Mic
              className="w-9 h-9"
              style={{
                color: mode === "voice-recording" ? "#FF3B30" : "var(--text-secondary)",
              }}
            />
          </div>

          {/* Voice label */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: mode === "voice-recording" ? "var(--text-secondary)" : "var(--text-disabled)",
            }}
          >
            {mode === "voice-recording" ? "Recording voice memo…" : "Hold to record voice"}
          </p>

          {/* Voice waveform bars */}
          {mode === "voice-recording" && (
            <div className="flex items-center gap-1" style={{ height: "48px" }}>
              {voiceBars.map((h, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "3px",
                    height: `${Math.max(4, h * 48)}px`,
                    backgroundColor: "#FF3B30",
                    opacity: 0.7 + h * 0.3,
                    transition: "height 0.08s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Timer */}
          {mode === "voice-recording" && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                color: "var(--text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              {formatTime(recordingTime)}
            </p>
          )}

          {mode === "voice-recording" && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
              Release to save
            </p>
          )}
        </div>
      ) : (
        /* Video preview */
        <div className="relative flex-1 overflow-hidden">
          {cameraReady ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // mirror front-facing
              muted
              playsInline
            />
          ) : (
            /* Simulated viewfinder */
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 50% 40%, #1a1a22 0%, #0D0D0F 100%)",
              }}
            >
              {cameraError ? (
                <p
                  className="text-center px-8"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-disabled)",
                  }}
                >
                  {cameraError}
                </p>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-30">
                  {/* Viewfinder corners */}
                  <div className="relative w-48 h-64">
                    {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => {
                      const isTop = pos.includes("top");
                      const isLeft = pos.includes("left");
                      return (
                        <div
                          key={pos}
                          className="absolute w-6 h-6"
                          style={{
                            top: isTop ? 0 : "auto",
                            bottom: isTop ? "auto" : 0,
                            left: isLeft ? 0 : "auto",
                            right: isLeft ? "auto" : 0,
                            borderTop: isTop ? "2px solid #fff" : "none",
                            borderBottom: isTop ? "none" : "2px solid #fff",
                            borderLeft: isLeft ? "2px solid #fff" : "none",
                            borderRight: isLeft ? "none" : "2px solid #fff",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recording indicator overlay */}
          {mode === "video-recording" && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FF3B30" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {formatTime(recordingTime)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Top controls ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4" style={{ pointerEvents: "auto" }}>
        {/* Close */}
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Flip camera (when not recording) */}
        {!isRecording && !voiceMode && cameraReady && (
          <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-14 pt-6"
        style={{
          background: voiceMode ? "transparent" : "linear-gradient(transparent, rgba(0,0,0,0.7))",
        }}
      >
        {/* Voice mode hint (only when idle and no recording) */}
        {mode === "idle" && !voiceMode && (
          <p
            className="mb-5 text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.01em",
            }}
          >
            Tap to record · Hold for voice
          </p>
        )}

        {/* The record button */}
        <div className="relative">
          {/* Long-press ring SVG */}
          {longPressProgress > 0 && (
            <svg className="absolute -inset-3" width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="42" cy="42" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle
                cx="42"
                cy="42"
                r={R}
                fill="none"
                stroke="var(--accent-cool)"
                strokeWidth="3"
                strokeDasharray={`${ringDash} ${CIRC}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.05s linear" }}
              />
            </svg>
          )}

          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleTap}
            className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center select-none"
            style={{
              backgroundColor:
                mode === "video-recording"
                  ? "#FF3B30"
                  : mode === "voice-recording"
                    ? "#FF3B30"
                    : "rgba(255,255,255,0.95)",
              boxShadow: isRecording
                ? "0 0 0 3px rgba(255, 59, 48, 0.35), 0 4px 20px rgba(0,0,0,0.5)"
                : "0 4px 20px rgba(0,0,0,0.5)",
              transition: "background-color 0.2s, box-shadow 0.2s",
              userSelect: "none",
            }}
          >
            {/* Inner shape */}
            {mode === "video-recording" ? (
              // Stop square
              <div className="w-6 h-6 rounded" style={{ backgroundColor: "#fff" }} />
            ) : mode === "voice-recording" ? (
              // Mic icon
              <Mic className="w-7 h-7 text-white" />
            ) : (
              // Record dot
              <div className="rounded-full" style={{ width: "22px", height: "22px", backgroundColor: "#FF3B30" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Quick-save sheet after capture ── */}
      {mode === "saved" && capture && (
        <QuickSaveSheet
          capture={capture}
          onDismiss={() => {
            setMode("idle");
            setCapture(null);
            setVoiceMode(false);
            // restart camera
            startCamera();
          }}
          fromCaptureFirst={fromCaptureFirst}
          targetSessionId={sessionId || undefined}
          targetSection={section || undefined}
        />
      )}
    </div>
  );
}

