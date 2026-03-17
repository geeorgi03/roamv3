import {
  ArrowLeft, Share2, MoreVertical, Music, Pin, Film, Repeat,
  Play, Pause, Rewind, FastForward, Plus, Lightbulb, FileText,
  PlayCircle, Upload, Circle, Sparkles, ChevronDown
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState, useRef } from "react";

import QuickTagSheet from "../components/QuickTagSheet";
import MusicAttachmentSheet from "../components/MusicAttachmentSheet";
import WaveformLoadingTrack from "../components/WaveformLoadingTrack";
import StemFocusControl from "../components/StemFocusControl";
import RecordingOverlay, { type Take } from "../components/RecordingOverlay";
import ShareSheet from "../components/ShareSheet";
import NotePinSheet from "../components/NotePinSheet";
import AddTrackSheet from "../components/AddTrackSheet";
import MusicIntelligenceTrack, {
  makeSampleChords,
  makeSampleContour,
  type ChordEvent,
} from "../components/MusicIntelligenceTrack";
import { useSessionData } from "../hooks/useSessionData";
import type { TrackType } from "../components/AddTrackSheet";

const SPEEDS = ["0.5", "0.75", "1.0"];

export default function SessionWorkbench() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    session,
    clips,
    loading,
    error,
    addClip,
    deleteClip,
    updateSession,
  } = useSessionData(id || null);

  // ─── UI state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Ideas");
  const [playbackSpeed, setPlaybackSpeed] = useState("0.75");
  const [speedIdx, setSpeedIdx] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mirrorEnabled, setMirrorEnabled] = useState(false);
  const [musicImporting, setMusicImporting] = useState(false);
  const [activeSection, setActiveSection] = useState("Chorus");

  // Stems expanded below waveform
  const [stemsExpanded, setStemsExpanded] = useState(false);

  // Extra tracks
  const [extraTracks, setExtraTracks] = useState<TrackType[]>([]);

  // Note pin
  const [showNotePin, setShowNotePin] = useState(false);
  const [pinTimecode, setPinTimecode] = useState("0:42");

  // Sheets
  const [showQuickTag, setShowQuickTag] = useState(false);
  const [showMusicAttachment, setShowMusicAttachment] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareClipId, setShareClipId] = useState<string | undefined>();

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [takeNumber, setTakeNumber] = useState(1);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [takes, setTakes] = useState<Take[]>([]);
  const [takeElapsed, setTakeElapsed] = useState(0);

  // Music Intelligence track data (sample)
  const miChords = makeSampleChords();
  const miContour = makeSampleContour();

  // ─── Handlers ────────────────────────────────────────────────
  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    setPlaybackSpeed(SPEEDS[next]);
  };

  const handleQuickTagSubmit = async (data: { type: string; feel?: string }) => {
    try {
      await addClip({
        videoUrl: "",
        startTime: 0,
        type: data.type as "idea" | "teaching" | "full-run",
        feel: data.feel,
        tags: [],
      });
      setShowQuickTag(false);
    } catch (err) {
      console.error("Failed to add clip:", err);
    }
  };

  const handleMusicAttachment = async (data: any) => {
    setShowMusicAttachment(false);
    setMusicImporting(true);
    setTimeout(async () => {
      try {
        await updateSession({ duration: data.metadata?.duration || 240 });
        setMusicImporting(false);
      } catch (err) {
        console.error("Failed to attach music:", err);
        setMusicImporting(false);
      }
    }, 3000);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTakeNumber(1);
    setCycleNumber(1);
    setTakes([]);
  };

  const handleStopRecording = () => {
    setTakes((prev) => [
      ...prev,
      { id: `take-${Date.now()}`, number: takeNumber, duration: takeElapsed },
    ]);
    setIsRecording(false);
    setTakeElapsed(0);
  };

  const handleNewTake = () => {
    setTakes((prev) => [
      ...prev,
      { id: `take-${Date.now()}`, number: takeNumber, duration: takeElapsed || 12.5 },
    ]);
    setTakeNumber((n) => n + 1);
    setCycleNumber((n) => n + 1);
    setTakeElapsed(0);
  };

  const handleDeleteTake = (takeId: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== takeId));
  };

  const handleAddTrack = (type: TrackType) => {
    setExtraTracks((prev) =>
      prev.includes(type) ? prev : [...prev, type]
    );
  };

  const handleDropPin = (chord: ChordEvent) => {
    setPinTimecode(`${(chord.startMs / 1000).toFixed(1)}s`);
    setShowNotePin(true);
  };

  // ─── Loading / error ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface-base)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          Loading session…
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface-base)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          {error || "Session not found"}
        </p>
      </div>
    );
  }

  const sections = session.sections.length > 0
    ? session.sections
    : [
        { name: "Intro",   start: 0,  end: 15  },
        { name: "Verse 1", start: 15, end: 42  },
        { name: "Chorus",  start: 42, end: 70  },
        { name: "Verse 2", start: 70, end: 100 },
      ];

  const activeS = sections.find((s) => s.name === activeSection) || sections[2];
  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const tabs = [
    { id: "Ideas",  icon: Lightbulb,   label: "Ideas"  },
    { id: "Notes",  icon: FileText,    label: "Notes"  },
    { id: "Review", icon: PlayCircle,  label: "Review" },
    { id: "Share",  icon: Upload,      label: "Share"  },
  ];

  // Sample loop regions for the repetition track
  const loopRegions = [
    { left: "16%", width: "18%", color: "#4ECDC4", label: "A" },
    { left: "52%", width: "20%", color: "#FF9A3C", label: "B" },
  ];

  const hasMI = extraTracks.includes("music-intelligence");

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: "var(--surface-base)", overflow: "hidden" }}
    >
      {/* ══════════════════════════════════════════════════════════
          ZONE 1 — HEADER
      ══════════════════════════════════════════════════════════ */}
      <div
        className="h-11 px-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        <div className="flex-1 mx-3 min-w-0">
          <p
            className="truncate text-center"
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--text-primary)",
            }}
          >
            {session.songName}
          </p>
          {session.artist && (
            <p
              className="text-center"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-secondary)",
              }}
            >
              {session.artist}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowShareSheet(true)}>
            <Share2 className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <button>
            <MoreVertical className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ZONE 2 — MULTI-TRACK TIMELINE
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>

        {/* Timecode ruler */}
        <div
          className="h-5 flex items-center px-10"
          style={{ backgroundColor: "var(--surface-base)" }}
        >
          {["0:00", "0:15", "0:30", "0:45", "1:00", "1:15"].map((t) => (
            <span
              key={t}
              className="flex-1 text-center"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-disabled)",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* ── Track 1: Waveform ── */}
        <div
          className="flex items-stretch"
          style={{ height: "40px", borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Track header — tap to expand stems */}
          <button
            onClick={() => setStemsExpanded((v) => !v)}
            className="w-9 h-full flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--surface-raised)" }}
          >
            <Music className="w-3.5 h-3.5" style={{ color: stemsExpanded ? "var(--accent-primary)" : "var(--text-secondary)" }} />
            <ChevronDown
              className="w-2.5 h-2.5 transition-transform"
              style={{
                color: stemsExpanded ? "var(--accent-primary)" : "var(--text-disabled)",
                transform: stemsExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Waveform content */}
          <div className="flex-1 relative overflow-hidden">
            {musicImporting ? (
              <WaveformLoadingTrack />
            ) : (
              <div className="h-full flex items-center gap-0.5 px-1">
                {Array.from({ length: 100 }).map((_, i) => {
                  const h = 20 + Math.abs(Math.sin(i * 0.17) * 55) + Math.abs(Math.cos(i * 0.08) * 15);
                  const isPlayed = i < 40;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        backgroundColor: isPlayed
                          ? "var(--waveform-played)"
                          : "var(--waveform-fill)",
                        minWidth: "1.5px",
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Section markers on waveform */}
            {!musicImporting && (
              <div className="absolute top-1 left-0 right-0 flex justify-around px-1">
                {sections.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setActiveSection(s.name)}
                    className="px-1.5 py-0.5 rounded-full text-center transition-all"
                    style={{
                      backgroundColor:
                        s.name === activeSection
                          ? "rgba(200, 241, 53, 0.2)"
                          : "var(--surface-overlay)",
                      border: `1px solid ${s.name === activeSection ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: s.name === activeSection ? "var(--accent-primary)" : "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: "40%", backgroundColor: "#FF3B30" }}
            />
          </div>
        </div>

        {/* Stem focus control — inline, collapsible */}
        {stemsExpanded && (
          <StemFocusControl stemsEnabled={true} stemsProcessing={false} />
        )}

        {/* ── Track 2: Note pins ── */}
        <div
          className="flex items-stretch"
          style={{ height: "36px", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => setShowNotePin(true)}
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--surface-raised)" }}
          >
            <Pin className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex-1 relative">
            {/* Long-press hint on track itself */}
            <button
              className="absolute inset-0"
              onClick={() => {
                setPinTimecode("0:42");
                setShowNotePin(true);
              }}
            />
            {/* Sample note pins */}
            {[
              { pos: "20%", color: "var(--accent-cool)" },
              { pos: "42%", color: "var(--accent-primary)" },
              { pos: "65%", color: "var(--accent-warm)" },
            ].map((pin, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                style={{ left: pin.pos, backgroundColor: pin.color }}
              />
            ))}
            {/* Playhead hairline */}
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: "40%", backgroundColor: "rgba(255,59,48,0.4)" }}
            />
          </div>
        </div>

        {/* ── Track 3: Assigned clips ── */}
        <div
          className="flex items-stretch"
          style={{ height: "36px", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="w-9 h-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--surface-raised)" }}
          >
            <Film className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          </div>
          <div className="flex-1 relative">
            {[
              { left: "15%", width: "13%", label: "Idea 01" },
              { left: "52%", width: "14%", label: "Idea 02" },
            ].map((clip, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 h-6 flex items-center px-1.5 rounded"
                style={{
                  left: clip.left,
                  width: clip.width,
                  backgroundColor: "var(--surface-overlay)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="w-3 h-3 rounded bg-gray-600 flex-shrink-0" />
                <span
                  className="ml-1 truncate"
                  style={{ fontSize: "9px", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {clip.label}
                </span>
              </div>
            ))}
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: "40%", backgroundColor: "rgba(255,59,48,0.4)" }}
            />
          </div>
        </div>

        {/* ── Track 4: Repetition regions ── */}
        <div
          className="flex items-stretch"
          style={{
            height: "36px",
            borderBottom: hasMI ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <button
            onClick={() => navigate(`/session/${id}/repetition/loopa`)}
            className="w-9 h-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--surface-raised)" }}
          >
            <Repeat className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex-1 relative">
            {loopRegions.map((loop) => (
              <button
                key={loop.label}
                onClick={() => navigate(`/session/${id}/repetition/loop${loop.label.toLowerCase()}`)}
                className="absolute top-1/2 -translate-y-1/2 h-5 rounded transition-opacity hover:opacity-80"
                style={{
                  left: loop.left,
                  width: loop.width,
                  backgroundColor: `${loop.color}22`,
                  borderTop: `2px solid ${loop.color}`,
                  borderBottom: `2px solid ${loop.color}`,
                }}
              >
                {/* Drag handle left */}
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: loop.color }}
                />
                {/* Label */}
                <span
                  className="absolute -top-3.5 left-1"
                  style={{ fontSize: "9px", color: loop.color, fontFamily: "var(--font-body)" }}
                >
                  {loop.label}
                </span>
                {/* Drag handle right */}
                <div
                  className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: loop.color }}
                />
              </button>
            ))}
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: "40%", backgroundColor: "rgba(255,59,48,0.4)" }}
            />
          </div>
        </div>

        {/* ── Track 5: Music Intelligence (optional) ── */}
        {hasMI && (
          <MusicIntelligenceTrack
            chords={miChords}
            contour={miContour}
            isAvailable={true}
            onJumpToTimecode={() => {}}
            onDropPin={handleDropPin}
          />
        )}

        {/* ── Transport bar ── */}
        <div
          className="h-12 px-3 flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <button>
              <Rewind className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
            <button
              onClick={() => setIsPlaying((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" style={{ color: "var(--surface-base)" }} fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" style={{ color: "var(--surface-base)" }} fill="currentColor" />
              )}
            </button>
            <button>
              <FastForward className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: playbackSpeed !== "1.0" ? "rgba(200,241,53,0.12)" : "var(--surface-overlay)",
              border: `1px solid ${playbackSpeed !== "1.0" ? "rgba(200,241,53,0.3)" : "var(--border-subtle)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: playbackSpeed !== "1.0" ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
          >
            {playbackSpeed}×
          </button>

          {/* Mirror + Add track */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMirrorEnabled((v) => !v)}
              className="px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: mirrorEnabled ? "rgba(10,207,197,0.12)" : "var(--surface-overlay)",
                border: `1px solid ${mirrorEnabled ? "rgba(10,207,197,0.3)" : "var(--border-subtle)"}`,
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: mirrorEnabled ? "var(--accent-cool)" : "var(--text-secondary)",
              }}
            >
              Mirror
            </button>

            <button
              onClick={() => setShowAddTrack(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--surface-overlay)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ZONE 3 — SECTION WORKSPACE
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-auto">
        {/* Section header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: "var(--font-app-title)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            >
              {activeS.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-secondary)",
              }}
            >
              {fmtTime(activeS.start)} – {fmtTime(activeS.end)}
            </span>
          </div>

          <button
            onClick={() => setShowMusicAttachment(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-disabled)",
            }}
          >
            <Music className="w-3 h-3" />
            {session.songName ? "Swap music" : "+ Add music"}
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === "Ideas" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {clips.map((clip) => {
                  const typeColors: Record<string, string> = {
                    idea: "var(--accent-cool)",
                    teaching: "var(--accent-warm)",
                    "full-run": "var(--accent-primary)",
                  };
                  const tagColor = typeColors[clip.type] || "var(--text-secondary)";
                  const displayName = `${clip.type.charAt(0).toUpperCase() + clip.type.slice(1)} ${new Date(clip.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                  return (
                    <div
                      key={clip.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--surface-raised)",
                        border: "1px solid var(--border-subtle)",
                        height: "118px",
                      }}
                    >
                      <div className="w-full h-14 bg-gray-800 relative">
                        <button
                          onClick={() => {
                            setShareClipId(clip.id);
                            setShowShareSheet(true);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded"
                          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                        >
                          <Share2 className="w-3 h-3" style={{ color: "#fff" }} />
                        </button>
                      </div>
                      <div className="px-2.5 py-2">
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {displayName}
                        </div>
                        <div
                          className="inline-block mt-1 px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${tagColor}33`,
                            color: tagColor,
                            fontSize: "10px",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {clip.feel || clip.type}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add clip placeholder */}
                <button
                  onClick={() => setShowQuickTag(true)}
                  className="rounded-xl flex flex-col items-center justify-center transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: "var(--surface-raised)",
                    border: "1px dashed var(--border-subtle)",
                    height: "118px",
                  }}
                >
                  <Plus className="w-5 h-5 mb-1" style={{ color: "var(--text-disabled)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-disabled)", fontFamily: "var(--font-body)" }}>
                    Add clip
                  </span>
                </button>
              </div>

              {/* Responses / feedback */}
              {clips.length > 0 && (
                <div
                  className="mt-3 rounded-xl p-3"
                  style={{
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                    ○ No responses yet — share to get feedback
                  </span>
                </div>
              )}
            </>
          )}

          {activeTab === "Notes" && (
            <div className="space-y-2">
              {[
                { time: "0:20", text: "This entrance should feel like arriving late to something important", color: "var(--accent-cool)" },
                { time: "0:42", text: "↑ sharp accent on the 3-and", color: "var(--accent-primary)" },
                { time: "1:05", text: "Voice memo", isVoice: true, color: "var(--accent-warm)" },
              ].map((note, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: note.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="block mb-0.5"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-disabled)" }}
                    >
                      {note.time}
                    </span>
                    {note.isVoice ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-end gap-0.5 h-4">
                          {Array.from({ length: 12 }, (_, j) => (
                            <div
                              key={j}
                              className="w-0.5 rounded-full"
                              style={{
                                height: `${20 + Math.abs(Math.sin(j * 0.7)) * 60}%`,
                                backgroundColor: note.color,
                                opacity: 0.7,
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}>
                          0:08
                        </span>
                      </div>
                    ) : (
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                        {note.text}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowNotePin(true)}
                className="w-full h-10 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
                style={{ border: "1px dashed var(--border-subtle)" }}
              >
                <Plus className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                  Pin a note at playhead
                </span>
              </button>
            </div>
          )}

          {activeTab === "Review" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <PlayCircle className="w-10 h-10" style={{ color: "var(--text-disabled)" }} />
              <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)" }}>
                Review & clean
              </p>
              <p className="text-center" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>
                Compare takes side-by-side and mark keepers.
              </p>
              {clips.length > 0 && (
                <button
                  onClick={() => navigate(`/session/${id}/review`)}
                  className="mt-2 px-5 h-10 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--surface-base)" }}
                >
                  Enter review mode
                </button>
              )}
            </div>
          )}

          {activeTab === "Share" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Upload className="w-10 h-10" style={{ color: "var(--text-disabled)" }} />
              <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)" }}>
                Share a clip
              </p>
              <button
                onClick={() => setShowShareSheet(true)}
                className="mt-2 px-5 h-10 rounded-full"
                style={{ backgroundColor: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--surface-base)" }}
              >
                Create share link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ZONE 4 — BOTTOM TAB BAR
      ══════════════════════════════════════════════════════════ */}
      <div
        className="h-16 px-4 flex items-center justify-around flex-shrink-0"
        style={{
          backgroundColor: "var(--surface-base)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {tabs.map(({ id: tabId, icon: Icon, label }) => {
          const isActive = activeTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => {
                setActiveTab(tabId);
                if (tabId === "Review") navigate(`/session/${id}/review`);
                if (tabId === "Share") setShowShareSheet(true);
              }}
              className="flex flex-col items-center gap-0.5"
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: isActive ? "var(--accent-primary)" : "var(--text-disabled)",
                  strokeWidth: isActive ? 2.5 : 2,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  color: isActive ? "var(--accent-primary)" : "var(--text-disabled)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          FLOATING CAPTURE FAB
      ══════════════════════════════════════════════════════════ */}
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{
          backgroundColor: isRecording ? "#FF3B30" : "var(--accent-primary)",
          boxShadow: isRecording
            ? "0 0 0 4px rgba(255,59,48,0.2), 0 4px 16px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(200, 241, 53, 0.25), 0 2px 8px rgba(0,0,0,0.4)",
          zIndex: 30,
        }}
      >
        {isRecording ? (
          <div className="w-5 h-5 rounded" style={{ backgroundColor: "#fff" }} />
        ) : (
          <Circle className="w-6 h-6" style={{ color: "var(--surface-base)" }} fill="currentColor" />
        )}
      </button>

      {/* ══════════════════════════════════════════════════════════
          OVERLAYS & SHEETS
      ══════════════════════════════════════════════════════════ */}

      {/* Recording overlay */}
      {isRecording && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="relative w-full h-full pointer-events-auto">
            <RecordingOverlay
              isRecording={isRecording}
              takeNumber={takeNumber}
              cycleNumber={cycleNumber}
              takes={takes}
              onStop={handleStopRecording}
              onNewTake={handleNewTake}
              onExportAll={() => {}}
              onDeleteTake={handleDeleteTake}
              onPlayTake={() => {}}
            />
          </div>
        </div>
      )}

      {/* Note pin sheet */}
      <NotePinSheet
        isOpen={showNotePin}
        timecode={pinTimecode}
        sectionName={activeS.name}
        onClose={() => setShowNotePin(false)}
        onSave={(data) => {
          console.log("Pin saved:", data);
        }}
      />

      {/* Add track sheet */}
      <AddTrackSheet
        isOpen={showAddTrack}
        onClose={() => setShowAddTrack(false)}
        existingTracks={extraTracks}
        onAddTrack={handleAddTrack}
      />

      {/* Quick tag */}
      <QuickTagSheet
        isOpen={showQuickTag}
        onClose={() => setShowQuickTag(false)}
        section={activeS.name}
        timecode={fmtTime(activeS.start)}
        onSubmit={handleQuickTagSubmit}
      />

      {/* Music attachment */}
      <MusicAttachmentSheet
        isOpen={showMusicAttachment}
        onClose={() => setShowMusicAttachment(false)}
        onConfirm={handleMusicAttachment}
      />

      {/* Share sheet */}
      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        clipId={shareClipId}
        sessionId={id}
      />
    </div>
  );
}
