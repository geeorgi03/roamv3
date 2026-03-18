import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Check } from "lucide-react";

interface NotePinSheetProps {
  isOpen: boolean;
  timecode: string; // display: e.g. "0:42"
  sectionName: string; // e.g. "Chorus"
  onClose: () => void;
  onSave: (data: { text?: string; audioBlob?: Blob }) => void;
  error?: string;
}

type PinMode = "idle" | "recording" | "recorded" | "text";

const LONG_PRESS_MS = 400;

export default function NotePinSheet({ isOpen, timecode, sectionName, onClose, onSave, error }: NotePinSheetProps) {
  const [mode, setMode] = useState<PinMode>("idle");
  const [textNote, setTextNote] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceBars, setVoiceBars] = useState<number[]>(Array.from({ length: 28 }, () => 0.15));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressProgress = useRef(0);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMode("idle");
      setTextNote("");
      setRecordingTime(0);
      audioBlobRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current!);
      clearInterval(voiceAnimRef.current!);
    };
  }, []);

  const startVoiceAnim = () => {
    voiceAnimRef.current = setInterval(() => {
      setVoiceBars(
        Array.from({ length: 28 }, (_, i) => {
          const base = 0.15 + Math.random() * 0.7;
          const env = Math.sin((i / 28) * Math.PI);
          return base * (0.2 + env * 0.8);
        })
      );
    }, 80);
  };

  const stopVoiceAnim = () => {
    clearInterval(voiceAnimRef.current!);
    setVoiceBars(Array.from({ length: 28 }, () => 0.15));
  };

  const startRecording = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        audioBlobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setMode("recorded");
      };
      recorderRef.current = recorder;
      recorder.start(100);
    } catch {
      // mic unavailable — simulate for UI purposes
      setTimeout(() => {
        audioBlobRef.current = new Blob([], { type: "audio/webm" });
        setMode("recorded");
      }, Math.max(500, recordingTime * 1000));
    }

    setMode("recording");
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setRecordingTime(elapsed);
    }, 1000);
    startVoiceAnim();
  };

  const stopRecording = () => {
    clearInterval(timerRef.current!);
    stopVoiceAnim();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      audioBlobRef.current = new Blob([], { type: "audio/webm" });
      setMode("recorded");
    }
  };

  // Pointer handlers for the big mic button
  const handleMicPointerDown = () => {
    if (mode === "recording") return;
    longPressRef.current = setTimeout(() => {
      startRecording();
    }, LONG_PRESS_MS);
  };

  const handleMicPointerUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (mode === "recording") {
      stopRecording();
    } else if (mode === "idle") {
      // Short tap → start recording immediately
      startRecording();
    }
  };

  const handleSave = () => {
    onSave({
      text: textNote.trim() || undefined,
      audioBlob: audioBlobRef.current || undefined,
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <span style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>Pin a note</span>
            <span className="ml-2" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-disabled)" }}>
              {timecode} · {sectionName}
            </span>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
          </button>
        </div>

        {/* Main area */}
        <div className="px-5 py-4">
          {/* Voice-first: big mic button */}
          <div className="flex flex-col items-center py-4">
            {/* Voice waveform when recording */}
            {mode === "recording" && (
              <div className="flex items-center gap-0.5 mb-4" style={{ height: "40px" }}>
                {voiceBars.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: "3px",
                      height: `${Math.max(4, h * 40)}px`,
                      backgroundColor: "#FF3B30",
                      opacity: 0.5 + h * 0.5,
                      transition: "height 0.08s ease",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Recorded waveform (static) */}
            {mode === "recorded" && (
              <div className="flex items-center gap-0.5 mb-4" style={{ height: "40px" }}>
                {Array.from({ length: 28 }, (_, i) => {
                  const h = 0.15 + Math.abs(Math.sin(i * 0.4)) * 0.7;
                  return (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: "3px",
                        height: `${h * 40}px`,
                        backgroundColor: "var(--accent-cool)",
                        opacity: 0.7,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Mic button */}
            <button
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={() => mode === "recording" && stopRecording()}
              className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all select-none"
              style={{
                backgroundColor:
                  mode === "recording"
                    ? "rgba(255, 59, 48, 0.15)"
                    : mode === "recorded"
                      ? "rgba(10, 207, 197, 0.12)"
                      : "var(--surface-overlay)",
                border: `2px solid ${
                  mode === "recording"
                    ? "#FF3B30"
                    : mode === "recorded"
                      ? "var(--accent-cool)"
                      : "var(--border-subtle)"
                }`,
              }}
            >
              {mode === "recorded" ? (
                <Check className="w-8 h-8" style={{ color: "var(--accent-cool)" }} strokeWidth={2.5} />
              ) : (
                <Mic className="w-8 h-8" style={{ color: mode === "recording" ? "#FF3B30" : "var(--text-secondary)" }} />
              )}

              {/* Pulsing ring when recording */}
              {mode === "recording" && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor: "rgba(255, 59, 48, 0.15)",
                    animationDuration: "1.2s",
                  }}
                />
              )}
            </button>

            {/* Label below mic */}
            <p
              className="mt-3 text-center"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: mode === "recording" ? "#FF3B30" : "var(--text-disabled)",
              }}
            >
              {mode === "idle" && "Tap · hold to record"}
              {mode === "recording" && `${formatTime(recordingTime)} — release to save`}
              {mode === "recorded" && "Voice memo recorded"}
              {mode === "text" && ""}
            </p>

            {/* Re-record button */}
            {mode === "recorded" && (
              <button
                onClick={() => {
                  audioBlobRef.current = null;
                  setMode("idle");
                  setRecordingTime(0);
                }}
                className="mt-2 flex items-center gap-1"
                style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}
              >
                <MicOff className="w-3 h-3" />
                Re-record
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>or type</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
          </div>

          {/* Text note (secondary) */}
          <textarea
            value={textNote}
            onChange={(e) => setTextNote(e.target.value)}
            placeholder="Any thought, cue, or feeling…"
            rows={2}
            className="w-full rounded-xl px-4 py-3 resize-none outline-none"
            style={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-primary)",
              lineHeight: "1.5",
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-8">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
              style={{
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={mode === "recording" || (mode === "idle" && !textNote.trim() && !audioBlobRef.current)}
              className="flex-1 h-12 rounded-xl font-semibold"
              style={{
                backgroundColor: mode === "recording" || (mode === "idle" && !textNote.trim() && !audioBlobRef.current) ? "var(--surface-overlay)" : "var(--accent-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: mode === "recording" || (mode === "idle" && !textNote.trim() && !audioBlobRef.current) ? "var(--text-disabled)" : "var(--surface-base)",
              }}
            >
              {mode === "recording" ? "Recording…" : "Pin it"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#FF6B6B" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

