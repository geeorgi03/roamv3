import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface CaptureOverlayProps {
  sectionLabel: string;       // e.g. "Chorus"
  timecode: string;           // formatted, e.g. "0:42"
  onStop: (blob: Blob) => void;
  onClose: () => void;
}

export default function CaptureOverlay({ sectionLabel, timecode, onStop, onClose }: CaptureOverlayProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopAllTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Unified teardown routine
  const teardown = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop recorder if active
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder during teardown:", e);
      }
      recorderRef.current = null;
    }
    
    // Detach video stream
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Stop all media tracks
    stopAllTracks();
  }, []);

  // Initialize camera and start recording in single async operation
  const initializeAndStartRecording = useCallback(async () => {
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
      
      // Start recording immediately after stream is ready
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.warn("Camera unavailable:", err);
      setCameraError("Camera unavailable — tap to continue in voice mode");
    }
  }, []);

  useEffect(() => {
    initializeAndStartRecording();
    return () => {
      teardown();
    };
  }, [initializeAndStartRecording, teardown]);

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

  // Start video recording (kept for manual restart if needed)
  const startVideoRecording = () => {
    setRecordingError(null);
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      startTimer();
    } catch (e) {
      console.warn("MediaRecorder failed:", e);
      setRecordingError("Recording failed — no media saved");
    }
  };

  // Stop recording
  const stopRecording = useCallback(async () => {
    const duration = stopTimer();
    setIsRecording(false);

    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      throw new Error("No media captured — please try recording again");
    }

    return new Promise<Blob>((resolve, reject) => {
      const recorder = recorderRef.current!;
      recorder.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          if (!blob || blob.size === 0) {
            reject(new Error("No media captured — please try recording again"));
            return;
          }
          resolve(blob);
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Recording failed"));
        }
      };
      recorder.stop();
    });
  }, []);

  // Handle stop button click
  const handleStop = async () => {
    try {
      const blob = await stopRecording();
      teardown();
      onStop(blob);
    } catch (error) {
      console.error("Recording error:", error);
      setRecordingError("Recording failed — no media saved");
      teardown();
    }
  };

  // Handle close button click
  const handleClose = () => {
    teardown();
    onClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#000", zIndex: 50 }}>
      {/* Recording error overlay */}
      {recordingError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.78)", zIndex: 200 }}
        >
          <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 700, fontSize: "16px", color: "#fff", textAlign: "center" }}>
            Recording failed — no media saved
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--surface-base)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Camera preview ── */}
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
              <div className="text-center px-8">
                <p
                  className="mb-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-disabled)",
                  }}
                >
                  {cameraError}
                </p>
                <a
                  href="app-settings:"
                  className="px-4 py-2 rounded-lg inline-block"
                  style={{ backgroundColor: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--surface-base)" }}
                >
                  Open Settings
                </a>
              </div>
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
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ 
                backgroundColor: "#FF3B30",
                animation: "pulse 1.5s infinite"
              }} 
            />
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

        {/* Section + timecode pill */}
        <div className="absolute top-4 right-4">
          <div
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            ● {sectionLabel} · {timecode}
          </div>
        </div>
      </div>

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
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-14 pt-6"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        }}
      >
        {/* The stop button */}
        <button
          onClick={handleStop}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "#FF3B30",
            boxShadow: "0 0 0 3px rgba(255, 59, 48, 0.35), 0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Stop square */}
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "#fff" }} />
        </button>
      </div>

      {/* Add pulsing animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
