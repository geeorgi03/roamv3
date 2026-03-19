import { ArrowLeft, Share2, MoreVertical, Music, Pin, Film, Repeat, Play, Pause, Rewind, FastForward, Plus, Lightbulb, FileText, PlayCircle, Upload, WifiOff } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return online;
}
import QuickTagSheet from "../components/QuickTagSheet";
import MusicAttachmentSheet from "../components/MusicAttachmentSheet";
import WaveformLoadingTrack from "../components/WaveformLoadingTrack";
import { useSessionData } from "../hooks/useSessionData";
import NotePinSheet from "../components/NotePinSheet";
import ShareSheet from "../components/ShareSheet";
import AddClipActionSheet from "../components/AddClipActionSheet";
import { apiRequest, uploadFile } from "../../utils/supabase";

export default function SessionWorkbench() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const online = useOnlineStatus();
  const { 
    session, 
    clips, 
    notes, 
    loops,
    loading, 
    error,
    refresh,
    addClip, 
    addNote,
    addLoop,
    updateLoop,
    deleteClip,
    updateSession,
  } = useSessionData(sessionId || null);
  
  const [activeTab, setActiveTab] = useState("Ideas");
  const [showQuickTag, setShowQuickTag] = useState(false);
  const [showMusicAttachment, setShowMusicAttachment] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.75);
  const [musicImporting, setMusicImporting] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteSheetTimecode, setNoteSheetTimecode] = useState(0);
  const [noteSheetSection, setNoteSheetSection] = useState<string>("—");
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareClipId, setShareClipId] = useState<string | null>(null);

  const [showAddClipSheet, setShowAddClipSheet] = useState(false);

  // Voice note inline playback
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const voiceMemoRef = useRef<HTMLAudioElement | null>(null);
  const musicWasPlayingBeforeMemo = useRef<boolean>(false);

  // Loop inline popover
  const [loopPopover, setLoopPopover] = useState<{
    loopId: string;
    name: string;
    color: string;
    repeatCount: string;
    leftPct: number;
  } | null>(null);

  // Draft loop state (not persisted until Done is tapped)
  const [draftLoop, setDraftLoop] = useState<{
    startTime: number;
    endTime: number;
    name: string;
    color: string;
    repeatCount: string;
  } | null>(null);

  // Offline error state for loop popover
  const [loopOfflineError, setLoopOfflineError] = useState(false);

  // Toast from navigation
  const [navToast, setNavToast] = useState<string | null>(null);

  // Live loop drag preview
  const [loopDraftPreview, setLoopDraftPreview] = useState<{
    leftPct: number;
    widthPct: number;
    startTime: number;
    endTime: number;
  } | null>(null);

  useEffect(() => {
    const next = session?.sections?.[0]?.name ?? null;
    setActiveSection((prev) => (prev == null ? next : prev));
  }, [session?.sections]);

  // Check for toast query param on mount
  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam) {
      setNavToast(decodeURIComponent(toastParam));
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("toast");
      setSearchParams(newParams, { replace: true });
      setTimeout(() => setNavToast(null), 3000);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeSection) return;
    const stillExists = session?.sections?.some((s) => s.name === activeSection);
    if (!stillExists) {
      setActiveSection(session?.sections?.[0]?.name ?? null);
    }
  }, [activeSection, session?.sections]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  // Stop voice memo when navigating away from Notes tab
  useEffect(() => {
    if (activeTab !== "Notes" && playingNoteId !== null) {
      if (voiceMemoRef.current) {
        voiceMemoRef.current.pause();
        voiceMemoRef.current.src = "";
      }
      setPlayingNoteId(null);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
      musicWasPlayingBeforeMemo.current = false;
    }
  }, [activeTab, playingNoteId]);

  // Handle quick tag submit
  const handleQuickTagSubmit = async (data: { type: string; feel?: string }) => {
    try {
      await addClip({
        videoUrl: "", // In a real app, this would be the video file
        startTime: currentTime, // Current playback position
        section: activeSection ?? undefined,
        type: data.type as 'idea' | 'teaching' | 'full-run',
        feel: data.feel,
        tags: [],
      });
      setShowQuickTag(false);
    } catch (error) {
      console.error("Failed to add clip:", error);
    }
  };

  // Handle music attachment
  const handleMusicAttachment = async (data: any) => {
    setShowMusicAttachment(false);
    setMusicImporting(true);
    try {
      if (data?.type === "file") {
        const value = data.value as string | File;
        let url: string;
        if (typeof value === "string") {
          url = value;
        } else {
          const uploaded = await uploadFile(value, "audio");
          url = uploaded.url;
        }
        await updateSession({
          musicUrl: url,
          duration: data.metadata?.duration || session?.duration || 240,
        });
        audioRef.current?.load();
      } else if (data?.type === "url") {
        const res = await apiRequest(`/music-import`, {
          method: "POST",
          body: JSON.stringify({ url: data.value, metadata: data.metadata }),
        });
        if (!res.ok) {
          throw new Error("Failed to import music");
        }
        const imported = await res.json();
        await updateSession({
          musicUrl: imported?.musicUrl || imported?.url || session?.musicUrl,
          duration: imported?.duration || data.metadata?.duration || session?.duration || 240,
        });
        audioRef.current?.load();
      }
    } catch (error) {
      console.error("Failed to attach music:", error);
    } finally {
      setMusicImporting(false);
    }
  };

  const handleNoteSave = async (data: { text?: string; audioBlob?: Blob }) => {
    setNoteSaveError(null);
    try {
      let audioStoragePath: string | undefined;
      if (data.audioBlob && data.audioBlob.size > 0) {
        const uploaded = await uploadFile(data.audioBlob, "audio");
        audioStoragePath = uploaded.url;
      }
      await addNote({
        timecode: noteSheetTimecode,
        text: data.text,
        audioUrl: audioStoragePath,
      });
      setNoteSheetOpen(false);
    } catch (err) {
      setNoteSaveError(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  const handleVoiceNotePlay = (noteId: string, audioUrl: string) => {
    if (playingNoteId === noteId) {
      voiceMemoRef.current?.pause();
      setPlayingNoteId(null);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
      return;
    }
    // Stop any existing voice memo
    if (voiceMemoRef.current) {
      voiceMemoRef.current.pause();
      voiceMemoRef.current.src = "";
    }
    // Track whether music was playing before starting memo
    musicWasPlayingBeforeMemo.current = audioRef.current ? !audioRef.current.paused : false;
    // Pause music
    audioRef.current?.pause();

    const audio = new Audio(audioUrl);
    voiceMemoRef.current = audio;
    audio.onended = () => {
      setPlayingNoteId(null);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
    };
    audio.play().catch(() => {});
    setPlayingNoteId(noteId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex flex-col items-center justify-center gap-4">
        <div className="text-[var(--text-secondary)]">
          {error || "Session not found"}
        </div>
        <button
          onClick={() => refresh()}
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--accent-primary)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "Ideas", icon: Lightbulb, label: "Ideas" },
    { id: "Notes", icon: FileText, label: "Notes" },
    { id: "Review", icon: PlayCircle, label: "Review" },
    { id: "Share", icon: Upload, label: "Share" },
  ];

  const sections = session.sections;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = session.duration || 0;
  const playheadPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const activeSectionObj = useMemo(() => {
    if (!activeSection) return null;
    return sections.find((s) => s.name === activeSection) || null;
  }, [activeSection, sections]);

  const workspaceClips = useMemo(() => {
    return clips.filter((c) => (activeSection ? c.section === activeSection : true));
  }, [clips, activeSection]);

  const ideaClips = useMemo(() => clips.filter((c) => c.type === "idea"), [clips]);
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => a.timecode - b.timecode), [notes]);

  const openNoteSheetAt = (timecode: number) => {
    setNoteSheetTimecode(timecode);
    setNoteSheetSection(activeSectionObj?.name || activeSection || "—");
    setNoteSheetOpen(true);
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      <audio ref={(n) => (audioRef.current = n)} src={session.musicUrl || ""} style={{ display: "none" }} />

      {/* Header */}
      <div 
        className="h-11 px-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div 
          style={{ 
            fontFamily: 'var(--font-app-title)', 
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--text-primary)'
          }}
        >
          {session.songName} — {session.artist}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShareOpen(true)}>
            <Share2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button>
            <MoreVertical className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Multi-track Timeline Zone */}
      <div 
        className="relative"
        style={{ height: '220px' }}
      >
        {/* Timecode Ruler */}
        <div 
          className="h-6 flex items-center px-4"
          style={{ backgroundColor: 'var(--surface-base)' }}
        >
          {(duration > 0 ? Array.from({ length: 6 }).map((_, i) => formatTime((duration / 5) * i)) : ["0:00", "0:15", "0:30", "0:45", "1:00", "1:15"]).map((time) => (
            <span 
              key={time}
              className="flex-1 text-center"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '10px',
                color: 'var(--text-disabled)'
              }}
            >
              {time}
            </span>
          ))}
        </div>

        {/* Track 1 - Waveform */}
        {musicImporting ? (
          <WaveformLoadingTrack isLoading={true} />
        ) : (
          <div 
            className="h-11 flex items-center"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div 
              className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--surface-raised)' }}
            >
              <button onClick={() => setShowMusicAttachment(true)} aria-label="Attach music">
                <Music className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="flex-1 relative h-full overflow-hidden">
              {/* No music yet: show dashed "Add music" placeholder */}
              {!session.musicUrl ? (
                <button
                  onClick={() => setShowMusicAttachment(true)}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    border: "2px dashed var(--border-subtle)",
                    borderRadius: "4px",
                    margin: "4px",
                    backgroundColor: "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--text-disabled)",
                    }}
                  >
                    + Add music
                  </span>
                </button>
              ) : (
                <>
                  {/* Waveform visualization (deterministic placeholder) */}
                  <div className="h-full flex items-center gap-0.5 px-2">
                    {Array.from({ length: 80 }).map((_, i) => {
                      const height = 25 + Math.abs(Math.sin(i * 0.35)) * 55;
                      const isPlayed = duration > 0 ? (i / 80) * 100 <= playheadPct : false;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${height}%`,
                            backgroundColor: isPlayed ? 'var(--waveform-played)' : 'var(--waveform-fill)',
                            minWidth: '2px',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Section markers */}
                  <div className="absolute top-1 left-0 right-0 flex justify-around px-4">
                    {sections.length === 0 ? (
                      <div
                        className="px-2 py-0.5 rounded-full text-center"
                        style={{
                          backgroundColor: 'var(--surface-overlay)',
                          border: `1px solid var(--border-subtle)`,
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        No sections
                      </div>
                    ) : (
                      sections.map((section) => {
                        const isActive = section.name === activeSection;
                        return (
                          <button
                            key={section.name}
                            onClick={() => setActiveSection(section.name)}
                            className="px-2 py-0.5 rounded-full text-center transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: isActive ? 'rgba(200, 241, 53, 0.2)' : 'var(--surface-overlay)',
                              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              fontSize: '10px',
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              fontFamily: 'var(--font-body)'
                            }}
                          >
                            {section.name}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{ 
                      left: `${playheadPct}%`,
                      backgroundColor: '#ff0000'
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Track 2 - Note pins */}
        <div 
          className="h-11 flex items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Pin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div
            className="flex-1 relative h-full"
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && (e as any).button === 2) return;
              const t = window.setTimeout(() => {
                openNoteSheetAt(currentTime);
              }, 450);
              (e.currentTarget as any)._lp = t;
            }}
            onPointerUp={(e) => {
              const t = (e.currentTarget as any)._lp;
              if (t) window.clearTimeout(t);
              (e.currentTarget as any)._lp = null;
            }}
            onPointerLeave={(e) => {
              const t = (e.currentTarget as any)._lp;
              if (t) window.clearTimeout(t);
              (e.currentTarget as any)._lp = null;
            }}
          >
            {/* Note pin dots */}
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>
                Long-press to pin a note
              </div>
            ) : (
              notes.map((note, i) => {
                const pct = duration > 0 ? (note.timecode / duration) * 100 : 0;
                const colors = ['var(--accent-cool)', 'var(--accent-primary)', 'var(--accent-warm)'];
                return (
                  <button
                    key={note.id}
                    onClick={() => openNoteSheetAt(note.timecode)}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      left: `${pct}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                    aria-label="Open note"
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Track 3 - Assigned clips */}
        <div 
          className="h-11 flex items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Film className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="flex-1 relative h-full">
            {clips.length === 0 ? (
              <div className="absolute inset-0 flex items-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>
                No clips yet
              </div>
            ) : (
              clips.map((clip) => {
                const leftPct = duration > 0 ? (clip.startTime / duration) * 100 : 0;
                return (
                  <div
                    key={clip.id}
                    className="absolute top-1/2 -translate-y-1/2 h-7 flex items-center px-1 rounded"
                    style={{
                      left: `${leftPct}%`,
                      width: "16%",
                      backgroundColor: "var(--surface-overlay)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="w-4 h-4 rounded bg-gray-600 flex-shrink-0" />
                    <span
                      className="ml-1 truncate"
                      style={{
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        maxWidth: "70px",
                      }}
                    >
                      {clip.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Track 4 - Repetition regions */}
        <div 
          className="h-11 flex items-center"
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Repeat className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div
            className="flex-1 relative h-full"
            onPointerDown={(e) => {
              if (duration <= 0) return;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.min(1, Math.max(0, x / rect.width));
              const start = pct * duration;
              (e.currentTarget as any)._loopDraft = { start, startX: x, rectWidth: rect.width };
              (e.currentTarget as any)._loopDragging = true;
            }}
            onPointerMove={(e) => {
              const draft = (e.currentTarget as any)._loopDraft;
              if (!draft || !(e.currentTarget as any)._loopDragging || duration <= 0) return;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.min(1, Math.max(0, x / rect.width));
              draft.end = pct * duration;
              (e.currentTarget as any)._loopDraft = draft;
              const startTime = Math.min(draft.start, draft.end);
              const endTime = Math.max(draft.start, draft.end);
              setLoopDraftPreview({
                leftPct: (startTime / duration) * 100,
                widthPct: ((endTime - startTime) / duration) * 100,
                startTime,
                endTime,
              });
              (e.currentTarget as any).style.cursor = "grabbing";
            }}
            onPointerUp={(e) => {
              const draft = (e.currentTarget as any)._loopDraft;
              (e.currentTarget as any)._loopDragging = false;
              (e.currentTarget as any)._loopDraft = null;
              setLoopDraftPreview(null);
              (e.currentTarget as any).style.cursor = "default";
              if (!draft || duration <= 0 || typeof draft.end !== "number") return;
              let start = Math.min(draft.start, draft.end);
              let end = Math.max(draft.start, draft.end);
              const MIN_LOOP_DURATION = 2;
              if (end - start < MIN_LOOP_DURATION) {
                const center = (start + end) / 2;
                start = Math.max(0, center - MIN_LOOP_DURATION / 2);
                end = Math.min(duration, center + MIN_LOOP_DURATION / 2);
                if (end - start < MIN_LOOP_DURATION) {
                  if (start === 0) {
                    end = Math.min(duration, MIN_LOOP_DURATION);
                  } else {
                    start = Math.max(0, duration - MIN_LOOP_DURATION);
                  }
                }
              }
              const loopLabels = ["A", "B", "C", "D", "E", "F"];
              const autoName = `Loop ${loopLabels[(loops.length + (draftLoop ? 1 : 0)) % loopLabels.length]}`;
              const defaultColor = "#4ECDC4";
              const defaultRepeatCount = "4×";
              setDraftLoop({
                startTime: start,
                endTime: end,
                name: autoName,
                color: defaultColor,
                repeatCount: defaultRepeatCount,
              });
              const leftPct = (start / duration) * 100;
              setLoopPopover({
                loopId: "__draft__",
                name: autoName,
                color: defaultColor,
                repeatCount: defaultRepeatCount,
                leftPct,
              });
              setLoopOfflineError(false);
            }}
          >
            {loops.length === 0 && !loopDraftPreview && !draftLoop ? (
              <div className="absolute inset-0 flex items-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>
                Drag to create a loop
              </div>
            ) : null}

            {/* Draft loop (not yet persisted - visible until page reload) */}
            {draftLoop && (
              (() => {
                const left = duration > 0 ? (draftLoop.startTime / duration) * 100 : 0;
                const width = duration > 0 ? ((draftLoop.endTime - draftLoop.startTime) / duration) * 100 : 0;
                const loopColor = draftLoop.color || "#4ECDC4";
                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoopPopover({
                        loopId: "__draft__",
                        name: draftLoop.name,
                        color: draftLoop.color,
                        repeatCount: draftLoop.repeatCount,
                        leftPct: left,
                      });
                      setLoopOfflineError(false);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(1, width)}%`,
                      backgroundColor: `${loopColor}26`,
                      borderTop: `2px dashed ${loopColor}`,
                      borderBottom: `2px dashed ${loopColor}`,
                    }}
                  >
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                    <div 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      style={{ 
                        fontSize: '10px',
                        color: loopColor,
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      {draftLoop.name}{draftLoop.repeatCount ? ` · ${draftLoop.repeatCount}` : ""} (draft)
                    </div>
                  </div>
                );
              })()
            )}

            {/* Live loop drag preview */}
            {loopDraftPreview && loopDraftPreview.widthPct > 0.5 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-6 rounded pointer-events-none"
                style={{
                  left: `${loopDraftPreview.leftPct}%`,
                  width: `${Math.max(1, loopDraftPreview.widthPct)}%`,
                  backgroundColor: "rgba(78, 205, 196, 0.25)",
                  borderTop: "2px dashed #4ECDC4",
                  borderBottom: "2px dashed #4ECDC4",
                }}
              >
                <div
                  className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded whitespace-nowrap"
                  style={{
                    backgroundColor: "rgba(30, 30, 35, 0.9)",
                    fontSize: "10px",
                    color: "#4ECDC4",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatTime(loopDraftPreview.startTime)} – {formatTime(loopDraftPreview.endTime)}
                </div>
              </div>
            )}

            {loops.map((loop) => {
              const left = duration > 0 ? (loop.startTime / duration) * 100 : 0;
              const width = duration > 0 ? ((loop.endTime - loop.startTime) / duration) * 100 : 0;
              const loopColor = loop.color || "#C8F135";
              return (
                <button
                  key={loop.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoopPopover({
                      loopId: loop.id,
                      name: loop.name,
                      color: loop.color || "#4ECDC4",
                      repeatCount: loop.repeatCount || "4×",
                      leftPct: left,
                    });
                  }}
                  className="absolute top-1/2 -translate-y-1/2 h-6 rounded transition-opacity hover:opacity-80"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(1, width)}%`,
                    backgroundColor: `${loopColor}26`,
                    borderTop: `2px solid ${loopColor}`,
                    borderBottom: `2px solid ${loopColor}`,
                  }}
                >
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    style={{ 
                      fontSize: '10px',
                      color: loopColor,
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {loop.name}{loop.repeatCount ? ` · ${loop.repeatCount}` : ""}
                  </div>
                </button>
              );
            })}

            {/* Loop popover */}
            {loopPopover && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onPointerDown={() => {
                    setLoopPopover(null);
                    setLoopOfflineError(false);
                  }}
                />
                <div
                  className="absolute z-40 rounded-xl px-3 py-3"
                  style={{
                    bottom: "110%",
                    left: `${Math.min(loopPopover.leftPct, 60)}%`,
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border-subtle)",
                    minWidth: "200px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={loopPopover.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setLoopPopover((p) => p ? { ...p, name: newName } : p);
                      if (loopPopover.loopId === "__draft__" && draftLoop) {
                        setDraftLoop({ ...draftLoop, name: newName });
                      }
                    }}
                    className="w-full rounded-lg px-2 py-1.5 outline-none mb-2"
                    style={{
                      backgroundColor: "var(--surface-overlay)",
                      border: "1px solid var(--border-subtle)",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                    }}
                  />
                  {/* Color swatches */}
                  <div className="flex gap-1.5 mb-2">
                    {["#4ECDC4", "#FF9A3C", "#FF6B6B", "#A78BFA"].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setLoopPopover((p) => p ? { ...p, color: c } : p);
                          if (loopPopover.loopId === "__draft__" && draftLoop) {
                            setDraftLoop({ ...draftLoop, color: c });
                          }
                        }}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          outline: loopPopover.color === c ? `2px solid white` : "none",
                          outlineOffset: "1px",
                        }}
                      />
                    ))}
                  </div>
                  {/* Repeat count chips */}
                  <div className="flex gap-1 mb-3">
                    {["2×", "4×", "8×", "∞"].map((rc) => (
                      <button
                        key={rc}
                        onClick={() => {
                          setLoopPopover((p) => p ? { ...p, repeatCount: rc } : p);
                          if (loopPopover.loopId === "__draft__" && draftLoop) {
                            setDraftLoop({ ...draftLoop, repeatCount: rc });
                          }
                        }}
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: loopPopover.repeatCount === rc ? loopPopover.color : "var(--surface-overlay)",
                          border: `1px solid ${loopPopover.repeatCount === rc ? loopPopover.color : "var(--border-subtle)"}`,
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: loopPopover.repeatCount === rc ? "var(--surface-base)" : "var(--text-secondary)",
                        }}
                      >
                        {rc}
                      </button>
                    ))}
                  </div>
                  {/* Offline error message */}
                  {loopOfflineError && (
                    <div
                      className="mb-2 px-2 py-1.5 rounded-lg flex items-center gap-2"
                      style={{ backgroundColor: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.3)" }}
                    >
                      <WifiOff className="w-3.5 h-3.5" style={{ color: "var(--accent-warm)" }} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-warm)" }}>
                        Internet required to save
                      </span>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (!online) {
                        setLoopOfflineError(true);
                        return;
                      }
                      try {
                        if (loopPopover.loopId === "__draft__" && draftLoop) {
                          await addLoop({
                            startTime: draftLoop.startTime,
                            endTime: draftLoop.endTime,
                            name: loopPopover.name,
                            color: loopPopover.color,
                            repeatCount: loopPopover.repeatCount,
                          });
                          setDraftLoop(null);
                        } else {
                          await updateLoop(loopPopover.loopId, {
                            name: loopPopover.name,
                            repeatCount: loopPopover.repeatCount,
                            color: loopPopover.color,
                          });
                        }
                      } catch (err) {
                        console.error("Failed to save loop:", err);
                      }
                      setLoopPopover(null);
                      setLoopOfflineError(false);
                    }}
                    className="w-full h-8 rounded-lg font-semibold"
                    style={{
                      backgroundColor: loopPopover.color,
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--surface-base)",
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transport Bar */}
      <div 
        className="h-12 px-4 flex items-center justify-between"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const el = audioRef.current;
              if (!el) return;
              el.currentTime = Math.max(0, (el.currentTime || 0) - 10);
            }}
          >
            <Rewind className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
              onClick={async () => {
                const el = audioRef.current;
                if (!el) return;
                try {
                  if (el.paused) {
                    await el.play();
                  } else {
                    el.pause();
                  }
                } catch (err) {
                  console.error("Playback failed:", err);
                }
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" style={{ color: 'var(--surface-base)' }} fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" style={{ color: 'var(--surface-base)' }} fill="currentColor" />
              )}
            </div>
          </button>
          <button
            onClick={() => {
              const el = audioRef.current;
              if (!el) return;
              el.currentTime = Math.min(duration || el.duration || Infinity, (el.currentTime || 0) + 10);
            }}
          >
            <FastForward className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
        <button
          className="px-3 py-1 rounded-full"
          onClick={() => {
            const speeds = [0.5, 0.75, 1] as const;
            const idx = speeds.findIndex((s) => s === playbackSpeed);
            const next = speeds[(idx + 1) % speeds.length];
            setPlaybackSpeed(next);
            const el = audioRef.current;
            if (el) el.playbackRate = next;
          }}
          style={{
            backgroundColor: 'var(--surface-overlay)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)'
          }}
        >
          {playbackSpeed}×
        </button>

        <div className="flex items-center gap-3">
          {playingNoteId && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-cool)" }}>
              ● memo playing
            </span>
          )}
          {loopPopover && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-primary)" }}>
              ● {loopPopover.name} · {loopPopover.repeatCount}
            </span>
          )}
          <button
            onClick={() => updateSession({ mirrorEnabled: !session.mirrorEnabled })}
            style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            Mirror
          </button>
          <button
            onClick={() => setShowMusicAttachment(true)}
            style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            + Track
          </button>
        </div>
      </div>

      {/* Section Workspace */}
      <div
        className="flex-1 p-4"
        onPointerDown={(e) => {
          (e.currentTarget as any)._swipeStart = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = (e.currentTarget as any)._swipeStart;
          if (!start) return;
          const deltaX = e.clientX - start.x;
          const deltaY = e.clientY - start.y;
          (e.currentTarget as any)._swipeStart = null;
          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            const idx = sections.findIndex((s) => s.name === activeSection);
            if (deltaX < 0 && idx < sections.length - 1) {
              setActiveSection(sections[idx + 1].name);
            } else if (deltaX > 0 && idx > 0) {
              setActiveSection(sections[idx - 1].name);
            }
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span 
              style={{ 
                fontFamily: 'var(--font-app-title)', 
                fontWeight: 600,
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            >
              {activeSectionObj?.name || activeSection || "—"}
            </span>
            <span 
              className="ml-3"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              {activeSectionObj ? `${formatTime(activeSectionObj.start)} – ${formatTime(activeSectionObj.end)}` : ""}
            </span>
          </div>
        </div>

        {/* 2x2 Clip Grid */}
        <div className="grid grid-cols-2 gap-2">
          {workspaceClips.map((clip) => {
            const typeColors: Record<string, string> = {
              idea: 'var(--accent-cool)',
              teaching: 'var(--accent-warm)',
              'full-run': 'var(--accent-primary)',
            };
            const tagColor = typeColors[clip.type] || 'var(--text-secondary)';
            const displayName = `${clip.type.charAt(0).toUpperCase() + clip.type.slice(1)} ${new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const tagLabel = clip.feel || clip.type;

            return (
              <div
                key={clip.id}
                className="rounded-lg overflow-hidden relative"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  height: '120px'
                }}
              >
                <div className="w-full h-16 bg-gray-700" />
                {/* Share icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareClipId(clip.id);
                    setShareOpen(true);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                >
                  <Share2 className="w-3 h-3" style={{ color: "rgba(255,255,255,0.8)" }} />
                </button>
                <div className="p-2">
                  <div 
                    style={{ 
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {displayName}
                  </div>
                  <div 
                    className="inline-block mt-1 px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${tagColor}33`,
                      color: tagColor,
                      fontSize: '10px',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {tagLabel}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Empty state cards */}
          {[1, 2].map((i) => (
            <button
              key={`empty-${i}`}
              onClick={() => setShowAddClipSheet(true)}
              className="rounded-lg flex flex-col items-center justify-center transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: `1px dashed var(--border-subtle)`,
                height: '120px'
              }}
            >
              <Plus className="w-6 h-6 mb-1" style={{ color: 'var(--text-disabled)' }} />
              <span 
                style={{ 
                  fontSize: '13px',
                  color: 'var(--text-disabled)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                + Add clip
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-5">
          {activeTab === "Ideas" && (
            <div>
              <div style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                Ideas
              </div>
              <div className="mt-2 space-y-2">
                {ideaClips.length === 0 ? (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>No ideas yet</div>
                ) : (
                  ideaClips.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>{c.section || "Unassigned"}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{formatTime(c.startTime)}</div>
                      </div>
                      <button
                        onClick={() => {
                          const el = audioRef.current;
                          if (el) el.currentTime = c.startTime;
                        }}
                        style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-primary)" }}
                      >
                        Jump
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "Notes" && (
            <div>
              <div className="flex items-center justify-between">
                <div style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                  Notes
                </div>
                <button
                  onClick={() => openNoteSheetAt(currentTime)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--surface-base)",
                  }}
                >
                  <Pin className="w-3.5 h-3.5" />
                  Pin at playhead
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {sortedNotes.length === 0 ? (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>No notes yet</div>
                ) : (
                  sortedNotes.map((n) => {
                    const isVoicePlaying = playingNoteId === n.id;
                    return (
                      <div
                        key={n.id}
                        className="px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Timecode chip — seeks music */}
                          <button
                            onClick={() => {
                              const el = audioRef.current;
                              if (el) el.currentTime = n.timecode;
                            }}
                            className="px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "var(--surface-overlay)" }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                              {formatTime(n.timecode)}
                            </span>
                          </button>

                          {/* Voice memo toggle */}
                          {n.audioUrl && (
                            <button
                              onClick={() => handleVoiceNotePlay(n.id, n.audioUrl!)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: isVoicePlaying ? "rgba(10,207,197,0.15)" : "var(--surface-overlay)",
                                border: `1px solid ${isVoicePlaying ? "var(--accent-cool)" : "var(--border-subtle)"}`,
                              }}
                            >
                              {isVoicePlaying ? (
                                <Pause className="w-3 h-3" style={{ color: "var(--accent-cool)" }} />
                              ) : (
                                <Play className="w-3 h-3" style={{ color: "var(--text-secondary)" }} fill="currentColor" />
                              )}
                              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: isVoicePlaying ? "var(--accent-cool)" : "var(--text-secondary)" }}>
                                {isVoicePlaying ? "playing" : "memo"}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Note text */}
                        {n.text && (
                          <div className="mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>
                            {n.text}
                          </div>
                        )}

                        {/* Expanded voice player when playing */}
                        {isVoicePlaying && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center gap-0.5 flex-1">
                              {Array.from({ length: 20 }).map((_, i) => {
                                const h = 30 + Math.abs(Math.sin(i * 0.5)) * 50;
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-sm"
                                    style={{
                                      height: `${h}%`,
                                      maxHeight: "16px",
                                      backgroundColor: "var(--accent-cool)",
                                      opacity: 0.7,
                                      minWidth: "2px",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "Share" && (
            <div>
              <div style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                Share Session
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShareOpen(true)}
                  className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "var(--surface-base)",
                    fontSize: "14px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Generate share link
                </button>
                <p
                  className="mt-3 text-center"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-disabled)",
                  }}
                >
                  Create a link to share this session with others
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div 
        className="h-20 px-4 flex items-center justify-around"
        style={{ 
          backgroundColor: 'var(--surface-base)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => {
          const tabId = id;
          const isActive = activeTab === tabId;
          return (
              <button
              key={tabId}
              onClick={() => {
                if (tabId === "Review" && clips.length === 0) return;
                setActiveTab(tabId);
                if (tabId === "Review") {
                  navigate(`/session/${sessionId}/review`);
                }
              }}
              className="flex flex-col items-center gap-1"
              style={{
                opacity: tabId === "Review" && clips.length === 0 ? 0.5 : 1,
                pointerEvents: tabId === "Review" && clips.length === 0 ? "none" : "auto",
              }}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-disabled)',
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  fontSize: '11px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-disabled)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating Capture Button */}
      <button
        onClick={() => navigate(`/capture?sessionId=${sessionId}&section=${activeSection || ""}`)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        <div 
          className="w-6 h-6 rounded-full"
          style={{ 
            border: '2px solid var(--surface-base)',
            backgroundColor: 'transparent'
          }}
        />
      </button>

      <QuickTagSheet 
        isOpen={showQuickTag}
        onClose={() => setShowQuickTag(false)}
        section={activeSectionObj?.name || activeSection || "—"}
        timecode={formatTime(currentTime)}
        onSubmit={handleQuickTagSubmit}
      />

      <MusicAttachmentSheet
        isOpen={showMusicAttachment}
        onClose={() => setShowMusicAttachment(false)}
        onConfirm={handleMusicAttachment}
      />

      <NotePinSheet
        isOpen={noteSheetOpen}
        onClose={() => { setNoteSheetOpen(false); setNoteSaveError(null); }}
        timecode={formatTime(noteSheetTimecode)}
        sectionName={noteSheetSection}
        onSave={handleNoteSave}
        error={noteSaveError ?? undefined}
      />

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => { setShareOpen(false); setShareClipId(null); }}
        clipId={shareClipId ?? undefined}
        sessionId={sessionId}
      />

      <AddClipActionSheet
        isOpen={showAddClipSheet}
        onClose={() => setShowAddClipSheet(false)}
        sectionName={activeSectionObj?.name || activeSection || "section"}
        onRecordNow={() => {
          setShowAddClipSheet(false);
          navigate(`/capture?sessionId=${sessionId}&section=${activeSection || ""}`);
        }}
        onPickFromInbox={() => {
          setShowAddClipSheet(false);
          navigate(`/inbox?sessionId=${sessionId}&section=${activeSection || ""}`);
        }}
      />

      {/* Nav toast from section assign */}
      {navToast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{
            backgroundColor: "rgba(20,20,20,0.92)",
            border: "1px solid var(--border-subtle)",
            zIndex: 60,
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-primary)" }}>
            {navToast} ✓
          </span>
        </div>
      )}
    </div>
  );
}