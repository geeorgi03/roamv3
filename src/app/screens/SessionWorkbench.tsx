import { ArrowLeft, Share2, MoreVertical, Music, Pin, Film, Repeat, Play, Pause, Rewind, FastForward, Plus, Lightbulb, FileText, PlayCircle, Upload, WifiOff, AlertCircle, ChevronDown } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import QuickTagSheet from "../components/QuickTagSheet";
import CaptureOverlay from "../components/CaptureOverlay";
import MusicAttachmentSheet from "../components/MusicAttachmentSheet";
import WaveformLoadingTrack from "../components/WaveformLoadingTrack";
import { useSessionData, Clip } from "../hooks/useSessionData";
import { useInbox } from "../hooks/useInbox";
import NotePinSheet from "../components/NotePinSheet";
import ShareSheet from "../components/ShareSheet";
import AddClipActionSheet from "../components/AddClipActionSheet";
import VoiceMiniPlayer from "../components/VoiceMiniPlayer";
import ClipFilterBar from "../components/ClipFilterBar";
import ClipResponsesSection from "../components/ClipResponsesSection";
import { apiRequest, uploadFile } from "../../utils/supabase";

const LONG_PRESS_MS = 500;

export default function SessionWorkbench() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const online = useOnlineStatus();
  const { saveClip } = useInbox();
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
    updateClip,
    updateClipWithSession,
    fetchCrossSessionClips,
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

  // Ideas tab filter state
  const [ideasTypeFilter, setIdeasTypeFilter] = useState<string | null>(null);
  const [ideasFeelFilters, setIdeasFeelFilters] = useState<string[]>([]);
  const [ideasSectionFilter, setIdeasSectionFilter] = useState<string | null>(null);
  const [ideasUnassignedOnly, setIdeasUnassignedOnly] = useState(false);
  const [ideasCrossSession, setIdeasCrossSession] = useState(false);

  // Cross-session data
  const [crossSessionClips, setCrossSessionClips] = useState<Clip[]>([]);
  const [crossSessionLoading, setCrossSessionLoading] = useState(false);
  const [crossSessionError, setCrossSessionError] = useState<string | null>(null);
  const [crossSessionFetchFailed, setCrossSessionFetchFailed] = useState(false);

  // Long-press reassign
  const [reassignClip, setReassignClip] = useState<{ clipId: string; sessionId: string } | null>(null);

  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteSheetTimecode, setNoteSheetTimecode] = useState(0);
  const [noteSheetSection, setNoteSheetSection] = useState<string>("—");
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareClipId, setShareClipId] = useState<string | null>(null);
  const [shareClipLabel, setShareClipLabel] = useState<string | null>(null);
  const [shareClipDuration, setShareClipDuration] = useState<string | null>(null);

  const [showAddClipSheet, setShowAddClipSheet] = useState(false);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureLinkedSection, setCaptureLinkedSection] = useState<string | null>(null);
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);
  const [captureTimecodeMs, setCaptureTimecodeMs] = useState<number | null>(null);
  const [quickTagSaveError, setQuickTagSaveError] = useState<string | null>(null);

  // Optimistic clips state for quick tag UI updates
  const [optimisticClips, setOptimisticClips] = useState<Clip[]>([]);
  
  // Failed submit payload for retry functionality
  const [failedSubmitPayload, setFailedSubmitPayload] = useState<{
    blob: Blob;
    data: { type_tag: string | null; feel_tags: string[]; note?: string };
    timecodeMs: number | null;
    linkedSection: string | null;
    tempId?: string;
  } | null>(null);

  // Voice note inline playback
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [voiceMemoIsPlaying, setVoiceMemoIsPlaying] = useState(false);
  const voiceMemoRef = useRef<HTMLAudioElement | null>(null);
  const musicWasPlayingBeforeMemo = useRef<boolean>(false);
  const [voiceMemoCurrentTime, setVoiceMemoCurrentTime] = useState(0);
  const [voiceMemoDuration, setVoiceMemoDuration] = useState(0);
  const [voiceMemoError, setVoiceMemoError] = useState<Record<string, boolean>>({});

  // Focused text note state (for expanding inline from timeline dot tap)
  const [focusedTextNoteId, setFocusedTextNoteId] = useState<string | null>(null);

  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);

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

  // Save error state for loop popover
  const [loopSaveError, setLoopSaveError] = useState<Record<string, boolean>>({});

  // Toast from navigation
  const [navToast, setNavToast] = useState<string | null>(null);

  // Toast for offline share attempts (must work outside the Share tab)
  const [shareToast, setShareToast] = useState<{ title: string; variant?: string } | null>(null);
  const shareToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressSectionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressReassignRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = ({ title, variant }: { title: string; variant?: string }) => {
    if (shareToastTimeoutRef.current) clearTimeout(shareToastTimeoutRef.current);
    setShareToast({ title, variant });
    shareToastTimeoutRef.current = setTimeout(() => setShareToast(null), 2500);
  };

  // Live loop drag preview
  const [loopDraftPreview, setLoopDraftPreview] = useState<{
    leftPct: number;
    widthPct: number;
    startTime: number;
    endTime: number;
  } | null>(null);

  // Loop handle drag state for resizing existing regions
  const [loopHandleDrag, setLoopHandleDrag] = useState<{
    loopId: string;
    edge: 'start' | 'end';
    originalStart: number;
    originalEnd: number;
  } | null>(null);

  // Local edits to loop boundaries (not persisted until Done is tapped)
  const [loopEdits, setLoopEdits] = useState<Record<string, { startTime: number; endTime: number }>>({});

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
    if (captureBlob) {
      setShowQuickTag(true);
    }
  }, [captureBlob]);

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
      setVoiceMemoIsPlaying(false);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
      musicWasPlayingBeforeMemo.current = false;
    }
  }, [activeTab, playingNoteId]);

  // Auto-sync on reconnect
  useEffect(() => {
    if (online) {
      (async () => {
        try {
          const { syncPendingClips } = await import('../lib/syncPendingClips');
          const saveClipFn = async (clipData: any) => {
            return addClip({
              videoUrl: clipData.videoUrl,
              startTime: (clipData.timecode_ms ?? 0) / 1000,
              section: clipData.section_id ?? undefined,
              type: 'idea',
              type_tag: clipData.type_tag,
              feel_tags: clipData.feel_tags,
              note: clipData.note,
              section_id: clipData.section_id,
              timecode_ms: clipData.timecode_ms,
              tags: [],
            });
          };
          await syncPendingClips(saveClipFn, uploadFile);
        } catch (error) {
          console.error('Failed to sync pending clips:', error);
        }
      })();
    }
  }, [online, addClip]);

  useEffect(() => {
    if (loops.length === 0) {
      if (activeLoopId !== null) setActiveLoopId(null);
      return;
    }
    const stillExists = activeLoopId ? loops.some((l) => l.id === activeLoopId) : false;
    if (!activeLoopId || !stillExists) {
      setActiveLoopId(loops[0].id);
    }
  }, [activeLoopId, loops]);

  // Cross-session fetch effect
  useEffect(() => {
    if (!ideasCrossSession) {
      setCrossSessionClips([]);
      setCrossSessionError(null);
      setCrossSessionFetchFailed(false);
      setCrossSessionLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCrossSession = async () => {
      setCrossSessionLoading(true);
      setCrossSessionError(null);
      
      try {
        const result = await fetchCrossSessionClips({
          typeTag: ideasTypeFilter,
          feelTags: ideasFeelFilters,
          sectionId: ideasSectionFilter,
          unassigned: ideasUnassignedOnly,
        });
        if (!cancelled) {
          setCrossSessionClips(result.clips);
          setCrossSessionFetchFailed(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCrossSessionError('Couldn\'t load other sessions');
          setCrossSessionFetchFailed(true);
          console.error('Error fetching cross-session clips:', err);
        }
      } finally {
        if (!cancelled) {
          setCrossSessionLoading(false);
        }
      }
    };

    fetchCrossSession();

    return () => {
      cancelled = true;
    };
  }, [
    ideasCrossSession,
    ideasTypeFilter,
    ideasFeelFilters,
    ideasSectionFilter,
    ideasUnassignedOnly,
    fetchCrossSessionClips,
  ]);

  // Handle quick tag submit
  const handleQuickTagSubmit = async (data: { type_tag: string | null; feel_tags: string[]; note?: string }) => {
    if (!captureBlob) return;
    
    const tempId = crypto.randomUUID();
    
    // 1. Optimistic local clip
    const optimisticClip: Clip = {
      id: tempId,
      sessionId: sessionId || '',
      type: 'idea',
      type_tag: data.type_tag,
      feel_tags: data.feel_tags,
      note: data.note,
      section: captureLinkedSection ?? activeSection ?? undefined,
      section_id: captureLinkedSection ?? activeSection ?? null,
      timecode_ms: captureTimecodeMs,
      startTime: (captureTimecodeMs ?? 0) / 1000,
      videoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      upload_status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    setOptimisticClips(prev => [optimisticClip, ...prev]);
    
    // 2. Close sheet and clear blob
    setShowQuickTag(false);
    setCaptureBlob(null);
    setCaptureTimecodeMs(null);
    setCaptureLinkedSection(null);
    setQuickTagSaveError(null);
    setFailedSubmitPayload(null);
    
    // 3. Background persist (fire-and-forget)
    (async () => {
      try {
        const blobBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(captureBlob);
        });
        
        if (!navigator.onLine) {
          // Offline path
          const { addPendingClip } = await import('../lib/pendingQueue');
          addPendingClip({
            tempId,
            mediaType: 'video',
            blobBase64,
            blobMimeType: captureBlob.type,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date().toISOString(),
            type_tag: data.type_tag,
            feel_tags: data.feel_tags,
            note: data.note,
            section_id: captureLinkedSection ?? activeSection ?? null,
            timecode_ms: captureTimecodeMs,
            session_id: sessionId,
          });
          setOptimisticClips(prev => prev.map(clip =>
            clip.id === tempId ? { ...clip, upload_status: 'pending' as const } : clip
          ));
          return;
        }
        
        // Online path
        const { url } = await uploadFile(captureBlob, 'video');
        const newClip = await addClip({
          videoUrl: url,
          startTime: (captureTimecodeMs ?? 0) / 1000,
          section: captureLinkedSection ?? activeSection ?? undefined,
          type: 'idea',
          type_tag: data.type_tag,
          feel_tags: data.feel_tags,
          note: data.note,
          section_id: captureLinkedSection ?? activeSection,
          timecode_ms: captureTimecodeMs,
          tags: [],
        });
        
        // Replace optimistic clip with server clip
        setOptimisticClips(prev => prev.filter(clip => clip.id !== tempId));
      } catch (error) {
        console.error('Failed to save clip:', error);
        // Store failed payload for retry
        setFailedSubmitPayload({
          blob: captureBlob,
          data,
          timecodeMs: captureTimecodeMs,
          linkedSection: captureLinkedSection,
          tempId,
        });
        // Re-open sheet with error but keep it open
        setQuickTagSaveError("Couldn't save — tap Retry");
        setShowQuickTag(true);
      }
    })();
  };

  // Handle retry for failed quick tag submit
  const handleQuickTagRetry = async () => {
    if (!failedSubmitPayload) return;
    
    const { blob, data, timecodeMs, linkedSection } = failedSubmitPayload;
    
    // Clear error and retry
    setQuickTagSaveError(null);
    
    try {
      const { url } = await uploadFile(blob, 'video');
      await addClip({
        videoUrl: url,
        startTime: (timecodeMs ?? 0) / 1000,
        section: linkedSection ?? activeSection ?? undefined,
        type: 'idea',
        type_tag: data.type_tag,
        feel_tags: data.feel_tags,
        note: data.note,
        section_id: linkedSection ?? activeSection,
        timecode_ms: timecodeMs,
        tags: [],
      });
      
      if (failedSubmitPayload?.tempId) {
        setOptimisticClips(prev => prev.filter(clip => clip.id !== failedSubmitPayload.tempId));
      }
      
      // Close sheet on successful retry
      setShowQuickTag(false);
      setFailedSubmitPayload(null);
      setCaptureBlob(null);
      setCaptureTimecodeMs(null);
      setCaptureLinkedSection(null);
    } catch (error) {
      console.error('Retry failed:', error);
      setQuickTagSaveError("Still couldn't save — tap Retry or try Inbox");
    }
  };

  // Handle save to inbox fallback
  const handleSaveToInbox = async () => {
    if (!failedSubmitPayload && !captureBlob) return;
    
    const blob = failedSubmitPayload?.blob || captureBlob;
    const data = failedSubmitPayload?.data || { type_tag: null, feel_tags: [], note: undefined };
    const timecodeMs = failedSubmitPayload?.timecodeMs || captureTimecodeMs;
    const linkedSection = failedSubmitPayload?.linkedSection || captureLinkedSection;
    
    try {
      const { url } = await uploadFile(blob, 'video');
      
      await saveClip({
        mediaType: 'video',
        videoUrl: url,
        duration: 0, // We don't have duration info for quick captures
        createdAt: new Date().toISOString(),
      });
      
      // Close sheet on successful inbox save
      setShowQuickTag(false);
      setQuickTagSaveError(null);
      setFailedSubmitPayload(null);
      setCaptureBlob(null);
      setCaptureTimecodeMs(null);
      setCaptureLinkedSection(null);
    } catch (error) {
      console.error('Inbox save failed:', error);
      setQuickTagSaveError("Inbox save failed — try Retry again");
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

  const handleVoiceNotePlay = (noteId: string, audioUrl: string, opts?: { switchingFromAnotherMemo?: boolean }) => {
    if (playingNoteId === noteId) {
      if (voiceMemoRef.current?.paused) {
        voiceMemoRef.current.play().catch(() => {});
        setVoiceMemoIsPlaying(true);
      } else {
        voiceMemoRef.current?.pause();
        setVoiceMemoIsPlaying(false);
      }
      return;
    }
    // Stop any existing voice memo
    if (voiceMemoRef.current) {
      voiceMemoRef.current.pause();
      voiceMemoRef.current.src = "";
    }
    setVoiceMemoIsPlaying(false);
    // Reset scrub bar state only when starting a new memo, not when pausing
    setVoiceMemoCurrentTime(0);
    setVoiceMemoDuration(0);
    // Only capture music state when transitioning from no memo to an active memo
    // Do not overwrite when switching between voice notes
    if (playingNoteId === null && !opts?.switchingFromAnotherMemo) {
      musicWasPlayingBeforeMemo.current = audioRef.current ? !audioRef.current.paused : false;
      // Pause music only when starting first memo
      audioRef.current?.pause();
    }

    const audio = new Audio(audioUrl);
    voiceMemoRef.current = audio;
    audio.ontimeupdate = () => setVoiceMemoCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => setVoiceMemoDuration(audio.duration);
    audio.onplay = () => setVoiceMemoIsPlaying(true);
    audio.onpause = () => setVoiceMemoIsPlaying(false);
    audio.onerror = () => {
      setVoiceMemoError(prev => ({ ...prev, [noteId]: true }));
      setPlayingNoteId(null);
      setVoiceMemoIsPlaying(false);
      setVoiceMemoCurrentTime(0);
      setVoiceMemoDuration(0);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
      musicWasPlayingBeforeMemo.current = false;
    };
    audio.onended = () => {
      flushSync(() => {
        setPlayingNoteId(null);
      });
      setVoiceMemoIsPlaying(false);
      setVoiceMemoCurrentTime(0);
      setVoiceMemoDuration(0);
      if (musicWasPlayingBeforeMemo.current) {
        audioRef.current?.play().catch(() => {});
      }
      musicWasPlayingBeforeMemo.current = false;
    };
    audio.play().catch(() => {});
    setPlayingNoteId(noteId);
    setVoiceMemoIsPlaying(true);
  };

  const handleVoiceMemoSeek = (time: number) => {
    if (voiceMemoRef.current) {
      voiceMemoRef.current.currentTime = time;
      setVoiceMemoCurrentTime(time);
    }
  };

  // Long press handlers for clip reassignment
  const handleClipPointerDown = (clipId: string) => {
    longPressReassignRef.current = setTimeout(() => {
      // Find the clip in either current session clips or cross-session clips
      const allClips = [...clips, ...crossSessionClips];
      const clip = allClips.find(c => c.id === clipId);
      if (clip) {
        setReassignClip({ clipId: clip.id, sessionId: clip.sessionId });
      }
    }, LONG_PRESS_MS);
  };

  const handleClipPointerUp = () => {
    if (longPressReassignRef.current) {
      clearTimeout(longPressReassignRef.current);
      longPressReassignRef.current = null;
    }
  };

  const handleClipPointerLeave = () => {
    if (longPressReassignRef.current) {
      clearTimeout(longPressReassignRef.current);
      longPressReassignRef.current = null;
    }
  };



  const tabs = [
    { id: "Ideas", icon: Lightbulb, label: "Ideas" },
    { id: "Notes", icon: FileText, label: "Notes" },
    { id: "Review", icon: PlayCircle, label: "Review" },
    { id: "Share", icon: Upload, label: "Share" },
  ];

  const sections = session?.sections ?? [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = session?.duration ?? 0;
  const playheadPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const activeSectionObj = useMemo(() => {
    if (!activeSection) return null;
    return sections.find((s) => s.name === activeSection) || null;
  }, [activeSection, sections]);

  const workspaceClips = useMemo(() => {
    const mergedClips = [...optimisticClips, ...clips];
    return mergedClips.filter((c) => (activeSection ? c.section === activeSection : true));
  }, [clips, optimisticClips, activeSection]);

  const shareClips = useMemo(() => [...optimisticClips, ...clips], [clips, optimisticClips]);

  const recentTypes = useMemo(() => {
    const combined = [...optimisticClips, ...clips];
    const sorted = [...combined].sort((a, b) => {
      const aRaw = (a as Clip & { created_at?: string }).created_at ?? a.createdAt;
      const bRaw = (b as Clip & { created_at?: string }).created_at ?? b.createdAt;
      const aMs = aRaw ? new Date(aRaw).getTime() : 0;
      const bMs = bRaw ? new Date(bRaw).getTime() : 0;
      return bMs - aMs;
    });
    const seen = new Set<string>();
    const out: string[] = [];
    for (const clip of sorted) {
      const tag = clip.type_tag;
      if (tag == null || tag === "") continue;
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
    return out;
  }, [clips, optimisticClips]);

  const filteredClips = useMemo(() => {
    // Fall back to in-session clips when cross-session fetch failed
    const mergedClips = [...optimisticClips, ...clips];
    const sourceClips = ideasCrossSession && !crossSessionFetchFailed ? crossSessionClips : mergedClips;
    
    return sourceClips.filter((c) => {
      // Type filter - normalize both sides to lowercase for case-insensitive comparison
      if (ideasTypeFilter) {
        const clipType = (c.type_tag || c.type)?.toLowerCase();
        const filterType = ideasTypeFilter.toLowerCase();
        if (clipType !== filterType) return false;
      }
      
      // Feel filters (AND logic) - normalize both sides to lowercase
      if (ideasFeelFilters.length > 0) {
        const clipFeels = (c.feel_tags || (c.feel ? [c.feel] : [])).map(f => f?.toLowerCase());
        const normalizedFilters = ideasFeelFilters.map(f => f.toLowerCase());
        const hasAllFeels = normalizedFilters.every(feel => clipFeels.includes(feel));
        if (!hasAllFeels) return false;
      }
      
      // Section filter - normalize both sides to lowercase
      if (ideasSectionFilter) {
        const clipSection = (c.section_id || c.section)?.toLowerCase();
        const filterSection = ideasSectionFilter.toLowerCase();
        if (clipSection !== filterSection) return false;
      }
      
      // Unassigned only
      if (ideasUnassignedOnly) {
        const hasSection = !!(c.section_id || c.section);
        if (hasSection) return false;
      }
      
      return true;
    });
  }, [
    clips,
    crossSessionClips,
    crossSessionFetchFailed,
    ideasCrossSession,
    ideasTypeFilter,
    ideasFeelFilters,
    ideasSectionFilter,
    ideasUnassignedOnly,
  ]);

  // Derived state for active filters detection
  const hasActiveFilters = useMemo(() => {
    return !!(
      ideasTypeFilter ||
      ideasFeelFilters.length > 0 ||
      ideasSectionFilter ||
      ideasUnassignedOnly ||
      ideasCrossSession
    );
  }, [
    ideasTypeFilter,
    ideasFeelFilters,
    ideasSectionFilter,
    ideasUnassignedOnly,
    ideasCrossSession,
  ]);
  
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => a.timecode - b.timecode), [notes]);

  // Overlap zones computation - moved to top-level to prevent hook ordering issues
  const overlapZones = useMemo(() => {
    if (duration <= 0) return [];

    // Collect all effective region boundaries
    const regions: { id: string; startTime: number; endTime: number }[] = [];

    // Add persisted loops with edits applied
    loops.forEach((loop) => {
      const edited = loopEdits[loop.id];
      const startTime = edited?.startTime ?? loop.startTime;
      const endTime = edited?.endTime ?? loop.endTime;
      regions.push({ id: loop.id, startTime, endTime });
    });

    // Add draft loop if exists
    if (draftLoop) {
      regions.push({
        id: "__draft__",
        startTime: draftLoop.startTime,
        endTime: draftLoop.endTime,
      });
    }

    // Add draft preview if exists and width > 0.5%
    if (loopDraftPreview && loopDraftPreview.widthPct > 0.5) {
      regions.push({
        id: "__preview__",
        startTime: loopDraftPreview.startTime,
        endTime: loopDraftPreview.endTime,
      });
    }

    // Compute pairwise intersections
    const rawOverlapZones: { overlapStart: number; overlapEnd: number }[] = [];
    
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const a = regions[i];
        const b = regions[j];
        const overlapStart = Math.max(a.startTime, b.startTime);
        const overlapEnd = Math.min(a.endTime, b.endTime);
        
        if (overlapEnd > overlapStart) {
          rawOverlapZones.push({ overlapStart, overlapEnd });
        }
      }
    }

    // Normalize overlap zones: sort, deduplicate, and merge identical ranges
    if (rawOverlapZones.length === 0) return [];

    // Sort by start time, then by end time
    rawOverlapZones.sort((a, b) => {
      if (a.overlapStart !== b.overlapStart) {
        return a.overlapStart - b.overlapStart;
      }
      return a.overlapEnd - b.overlapEnd;
    });

    // Deduplicate identical ranges and merge overlapping/adjacent ranges
    const normalizedZones: { overlapStart: number; overlapEnd: number }[] = [];
    
    for (const zone of rawOverlapZones) {
      // Check for exact duplicate
      const isDuplicate = normalizedZones.some(
        existing => existing.overlapStart === zone.overlapStart && existing.overlapEnd === zone.overlapEnd
      );
      
      if (isDuplicate) continue;
      
      // Check if this zone can be merged with the last one
      const lastZone = normalizedZones[normalizedZones.length - 1];
      if (lastZone && zone.overlapStart <= lastZone.overlapEnd) {
        // Merge overlapping or adjacent zones
        lastZone.overlapEnd = Math.max(lastZone.overlapEnd, zone.overlapEnd);
      } else {
        // Add as a new zone
        normalizedZones.push({ ...zone });
      }
    }

    return normalizedZones;
  }, [loops, loopEdits, draftLoop, loopDraftPreview, duration]);

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
      <audio ref={(n) => (audioRef.current = n)} src={session?.musicUrl ?? ""} style={{ display: "none" }} />

      {/* Inline Error Banner */}
      {(error || (!loading && !session)) && (
        <div 
          className="px-4 py-3 flex items-center justify-between gap-4"
          style={{ 
            backgroundColor: 'var(--surface-raised)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-body)', fontSize: '13px' }}>
            {error || "Session not found"}
          </div>
          <button
            onClick={() => refresh()}
            className="px-3 py-1.5 rounded-lg flex-shrink-0"
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
      )}

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
          {loading ? (
            <div className="h-5 w-32 bg-[var(--surface-raised)] rounded animate-pulse" />
          ) : (
            `${session?.songName || ""} — ${session?.artist || ""}`
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            setActiveTab("Share");
          }}>
            <Share2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button>
            <MoreVertical className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Error/Not Found State - Non-interactive fallback body */}
      {(error || (!loading && !session)) && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div 
              className="mb-4"
              style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              {error || "Session not found"}
            </div>
            <button
              onClick={() => refresh()}
              className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--surface-base)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Interactive Workbench Body - Only render when no error and session exists */}
      {!error && (loading || session) && (
        <>

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
        {(loading || musicImporting) ? (
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
              {!session?.musicUrl ? (
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
                  <div className="absolute top-1 left-0 right-0 px-4" style={{ height: '20px', pointerEvents: 'none' }}>
                    <div className="relative w-full h-full" style={{ pointerEvents: 'auto' }}>
                      {sections.length === 0 ? (
                        <div
                          className="px-2 py-0.5 rounded-full text-center absolute left-1/2 -translate-x-1/2"
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
                          const leftPct = duration > 0 ? (section.start / duration) * 100 : 0;
                          return (
                            <button
                              key={section.name}
                              onClick={() => setActiveSection(section.name)}
                              onPointerDown={() => {
                                longPressSectionRef.current = setTimeout(() => {
                                  setActiveSection(section.name);
                                  setCaptureLinkedSection(section.name);
                                  setCaptureOpen(true);
                                }, 500);
                              }}
                              onPointerUp={() => {
                                if (longPressSectionRef.current) {
                                  clearTimeout(longPressSectionRef.current);
                                  longPressSectionRef.current = null;
                                }
                              }}
                              onPointerLeave={() => {
                                if (longPressSectionRef.current) {
                                  clearTimeout(longPressSectionRef.current);
                                  longPressSectionRef.current = null;
                                }
                              }}
                              className="px-2 py-0.5 rounded-full text-center transition-opacity hover:opacity-90 absolute"
                              style={{
                                left: `${leftPct}%`,
                                transform: 'translateX(-50%)',
                                backgroundColor: isActive ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--surface-overlay)',
                                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                fontSize: '10px',
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                fontFamily: 'var(--font-body)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {section.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{ 
                      left: `${playheadPct}%`,
                      backgroundColor: 'var(--accent-warm)'
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
            className="flex-1 relative h-full cursor-pointer"
            onClick={() => openNoteSheetAt(currentTime)}
          >
            {/* Note pin dots */}
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>
                Tap to pin a note
              </div>
            ) : (
              notes.map((note, i) => {
                const pct = duration > 0 ? (note.timecode / duration) * 100 : 0;
                const colors = ['var(--accent-cool)', 'var(--accent-primary)', 'var(--accent-warm)'];
                const isVoiceNote = !!note.audioUrl;
                return (
                  <button
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isVoiceNote) {
                        setActiveTab("Notes");
                        handleVoiceNotePlay(note.id, note.audioUrl!);
                      } else {
                        setActiveTab("Notes");
                        setFocusedTextNoteId(note.id);
                        if (audioRef.current) {
                          audioRef.current.currentTime = note.timecode;
                        }
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      left: `${pct}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                    aria-label={isVoiceNote ? "Play voice note" : "Open note"}
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
            style={{ 
              backgroundColor: 'var(--surface-raised)',
              opacity: (activeLoopId || loops.length === 0) ? 1 : 0.5,
              cursor: (activeLoopId || loops.length === 0) ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              if (activeLoopId) {
                navigate(`/session/${sessionId}/repetition/${activeLoopId}`);
              } else if (loops.length === 0) {
                navigate(`/session/${sessionId}/repetition`);
              }
            }}
          >
            <Repeat className="w-4 h-4" style={{ color: (activeLoopId || loops.length === 0) ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
          </div>
          <div
            className="flex-1 relative h-full"
            onPointerDown={(e) => {
              if (duration <= 0) return;
              // Max 8 regions check
              if (loops.length + (draftLoop ? 1 : 0) >= 8) return;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.min(1, Math.max(0, x / rect.width));
              const start = Math.round(pct * duration * 10) / 10; // 0.1s snap
              (e.currentTarget as any)._loopDraft = { start, startX: x, rectWidth: rect.width };
              (e.currentTarget as any)._loopDragging = true;
            }}
            onPointerMove={(e) => {
              // Handle existing loop handle drag
              if (loopHandleDrag && duration > 0) {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.min(1, Math.max(0, x / rect.width));
                const rawTime = pct * duration;
                const snappedTime = Math.round(rawTime * 10) / 10; // 0.1s snap
                const MIN_LOOP_DURATION = 2;
                
                let newStart = loopHandleDrag.originalStart;
                let newEnd = loopHandleDrag.originalEnd;
                
                if (loopHandleDrag.edge === 'start') {
                  newStart = Math.min(snappedTime, newEnd - MIN_LOOP_DURATION);
                  newStart = Math.max(0, newStart);
                } else {
                  newEnd = Math.max(snappedTime, newStart + MIN_LOOP_DURATION);
                  newEnd = Math.min(duration, newEnd);
                }
                
                setLoopEdits(prev => ({
                  ...prev,
                  [loopHandleDrag.loopId]: { startTime: newStart, endTime: newEnd }
                }));
                return;
              }

              const draft = (e.currentTarget as any)._loopDraft;
              if (!draft || !(e.currentTarget as any)._loopDragging || duration <= 0) return;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.min(1, Math.max(0, x / rect.width));
              const rawEnd = pct * duration;
              const snappedEnd = Math.round(rawEnd * 10) / 10; // 0.1s snap
              draft.end = snappedEnd;
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
              // Handle existing loop handle drag release
              if (loopHandleDrag) {
                setLoopHandleDrag(null);
                return;
              }

              const draft = (e.currentTarget as any)._loopDraft;
              (e.currentTarget as any)._loopDragging = false;
              (e.currentTarget as any)._loopDraft = null;
              setLoopDraftPreview(null);
              (e.currentTarget as any).style.cursor = "default";
              if (!draft || duration <= 0 || typeof draft.end !== "number") return;
              let start = Math.round(Math.min(draft.start, draft.end) * 10) / 10; // 0.1s snap
              let end = Math.round(Math.max(draft.start, draft.end) * 10) / 10; // 0.1s snap
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
              // Snap final values
              start = Math.round(start * 10) / 10;
              end = Math.round(end * 10) / 10;
              const loopLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
              const autoName = `Loop ${loopLabels[(loops.length + (draftLoop ? 1 : 0)) % loopLabels.length]}`;
              const defaultColor = "var(--accent-cool)";
              const defaultRepeatCount = "4×";
              // Clear draft error state when creating new draft
              setLoopSaveError(prev => {
                const n = { ...prev };
                delete n["__draft__"];
                return n;
              });
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
            {/* Overlap zones rendering */}
            {overlapZones.map((zone, index) => (
              <div
                key={`overlap-${index}-${zone.overlapStart}-${zone.overlapEnd}`}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${(zone.overlapStart / duration) * 100}%`,
                  width: `${((zone.overlapEnd - zone.overlapStart) / duration) * 100}%`,
                  background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 3px, transparent 3px, transparent 8px)",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            ))}

            {loops.length === 0 && !loopDraftPreview && !draftLoop ? (
              <div className="absolute inset-0 flex items-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)" }}>
                Drag to create a loop
              </div>
            ) : loops.length + (draftLoop ? 1 : 0) >= 8 && !loopDraftPreview ? (
              <div className="absolute inset-0 flex items-center justify-center px-4" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-disabled)", backgroundColor: "color-mix(in srgb, var(--surface-base) 30%, transparent)" }}>
                Maximum 8 regions reached
              </div>
            ) : null}

            {/* Draft loop (not yet persisted - visible until page reload) */}
            {draftLoop && (
              (() => {
                const left = duration > 0 ? (draftLoop.startTime / duration) * 100 : 0;
                const width = duration > 0 ? ((draftLoop.endTime - draftLoop.startTime) / duration) * 100 : 0;
                const loopColor = draftLoop.color || "var(--accent-cool)";
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
                    {/* Error badge */}
                    {loopSaveError["__draft__"] && (
                      <div
                        className="absolute top-0 right-0 w-3 h-3 pointer-events-none"
                        style={{ transform: 'translate(25%, -25%)' }}
                      >
                        <AlertCircle className="w-3 h-3" style={{ color: 'var(--accent-warm)' }} />
                      </div>
                    )}
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
                  backgroundColor: "color-mix(in srgb, var(--accent-cool) 25%, transparent)",
                  borderTop: "2px dashed var(--accent-cool)",
                  borderBottom: "2px dashed var(--accent-cool)",
                }}
              >
                {/* Left floating timecode label */}
                <div
                  className="absolute -top-5 px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    left: 0,
                    transform: 'translateX(-50%)',
                    backgroundColor: "color-mix(in srgb, var(--surface-overlay) 90%, transparent)",
                    fontSize: "10px",
                    color: "var(--accent-cool)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatTime(loopDraftPreview.startTime)}
                </div>
                {/* Right floating timecode label */}
                <div
                  className="absolute -top-5 px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    right: 0,
                    transform: 'translateX(50%)',
                    backgroundColor: "color-mix(in srgb, var(--surface-overlay) 90%, transparent)",
                    fontSize: "10px",
                    color: "var(--accent-cool)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatTime(loopDraftPreview.endTime)}
                </div>
              </div>
            )}

            {loops.map((loop) => {
              const edited = loopEdits[loop.id];
              const startTime = edited?.startTime ?? loop.startTime;
              const endTime = edited?.endTime ?? loop.endTime;
              const left = duration > 0 ? (startTime / duration) * 100 : 0;
              const width = duration > 0 ? ((endTime - startTime) / duration) * 100 : 0;
              const loopColor = loop.color || "var(--accent-primary)";
              const isBeingDragged = loopHandleDrag?.loopId === loop.id;
              return (
                <div
                  key={loop.id}
                  className="absolute top-1/2 -translate-y-1/2 h-6 rounded transition-opacity hover:opacity-80"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(1, width)}%`,
                    backgroundColor: `${loopColor}26`,
                    borderTop: `2px solid ${loopColor}`,
                    borderBottom: `2px solid ${loopColor}`,
                  }}
                >
                  {/* Left drag handle */}
                  <div
                    className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setLoopHandleDrag({
                        loopId: loop.id,
                        edge: 'start',
                        originalStart: startTime,
                        originalEnd: endTime,
                      });
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                  </div>
                  {/* Right drag handle */}
                  <div
                    className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setLoopHandleDrag({
                        loopId: loop.id,
                        edge: 'end',
                        originalStart: startTime,
                        originalEnd: endTime,
                      });
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: loopColor }} />
                  </div>
                  {/* Clickable center area to open popover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLoopId(loop.id);
                      setLoopPopover({
                        loopId: loop.id,
                        name: loop.name,
                        color: loop.color || "var(--accent-cool)",
                        repeatCount: loop.repeatCount || "4×",
                        leftPct: left,
                      });
                    }}
                    className="absolute inset-0"
                    style={{ cursor: 'pointer' }}
                    aria-label={loopSaveError[loop.id] ? "Save failed — tap to retry" : "Edit loop"}
                  />
                  {/* Label above the region */}
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                    style={{ 
                      fontSize: '10px',
                      color: loopColor,
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {loop.name}{loop.repeatCount ? ` · ${loop.repeatCount}` : ""}
                  </div>
                  {/* Error badge */}
                  {loopSaveError[loop.id] && (
                    <div
                      className="absolute top-0 right-0 w-3 h-3 pointer-events-none"
                      style={{ transform: 'translate(25%, -25%)' }}
                    >
                      <AlertCircle className="w-3 h-3" style={{ color: 'var(--accent-warm)' }} />
                    </div>
                  )}
                  {/* Floating timecode labels when handle is being dragged */}
                  {isBeingDragged && edited && (
                    <>
                      <div
                        className="absolute -top-5 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
                        style={{
                          left: 0,
                          transform: 'translateX(-50%)',
                          backgroundColor: "color-mix(in srgb, var(--surface-overlay) 90%, transparent)",
                          fontSize: "10px",
                          color: loopColor,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatTime(edited.startTime)}
                      </div>
                      <div
                        className="absolute -top-5 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
                        style={{
                          right: 0,
                          transform: 'translateX(50%)',
                          backgroundColor: "color-mix(in srgb, var(--surface-overlay) 90%, transparent)",
                          fontSize: "10px",
                          color: loopColor,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatTime(edited.endTime)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Loop popover */}
            {loopPopover && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onPointerDown={() => {
                    // Clear draft error state when dismissing popover
                    if (loopPopover?.loopId === "__draft__") {
                      setLoopSaveError(prev => {
                        const n = { ...prev };
                        delete n["__draft__"];
                        return n;
                      });
                    }
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
                    boxShadow: "0 4px 20px color-mix(in srgb, var(--surface-base) 40%, transparent)",
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
                    {["var(--accent-cool)", "var(--accent-warm)", "var(--formation-pink)", "var(--formation-purple)"].map((c) => (
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
                      style={{ backgroundColor: "color-mix(in srgb, var(--accent-warm) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)" }}
                    >
                      <WifiOff className="w-3.5 h-3.5" style={{ color: "var(--accent-warm)" }} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-warm)" }}>
                        Internet required to save
                      </span>
                    </div>
                  )}
                  {/* Save error message */}
                  {loopSaveError[loopPopover.loopId] && (
                    <div
                      className="mb-2 px-2 py-1.5 rounded-lg flex items-center gap-2"
                      style={{ backgroundColor: "color-mix(in srgb, var(--accent-warm) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)" }}
                    >
                      <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--accent-warm)" }} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-warm)" }}>
                        Save failed — tap Done to retry
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
                          // Clear draft error state when successfully saved
                          setLoopSaveError(prev => {
                            const n = { ...prev };
                            delete n["__draft__"];
                            return n;
                          });
                          setDraftLoop(null);
                        } else {
                          const edited = loopEdits[loopPopover.loopId];
                          await updateLoop(loopPopover.loopId, {
                            name: loopPopover.name,
                            repeatCount: loopPopover.repeatCount,
                            color: loopPopover.color,
                            ...(edited && { startTime: edited.startTime, endTime: edited.endTime }),
                          });
                          // Clear the local edits for this loop after persisting
                          setLoopEdits(prev => {
                            const next = { ...prev };
                            delete next[loopPopover.loopId];
                            return next;
                          });
                        }
                        // Clear the error for this loop on success
                        setLoopSaveError(prev => { 
                          const n = {...prev}; 
                          delete n[loopPopover.loopId]; 
                          return n; 
                        });
                        setLoopPopover(null);
                        setLoopOfflineError(false);
                      } catch (err) {
                        console.error("Failed to save loop:", err);
                        setLoopSaveError(prev => ({ ...prev, [loopPopover.loopId]: true }));
                      }
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
        
        {/* Scrub bar */}
        <div className="flex-1 mx-4">
          <div className="relative w-full h-2 rounded-full" style={{ backgroundColor: "var(--surface-overlay)" }}>
            <div 
              className="absolute top-0 left-0 h-2 rounded-full transition-all"
              style={{
                width: `${playheadPct}%`,
                backgroundColor: 'var(--accent-primary)'
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const el = audioRef.current;
                if (!el) return;
                el.currentTime = Number(e.target.value);
                setCurrentTime(Number(e.target.value));
              }}
              className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
              style={{
                appearance: 'none',
                background: 'transparent',
                outline: 'none'
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)" }}>
              {formatTime(duration)}
            </span>
          </div>
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
            onClick={() => updateSession({ mirrorEnabled: !session?.mirrorEnabled })}
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
                    if (!online) {
                      if (shareOpen) setShareOpen(false);
                      toast({ title: 'Internet required to share', variant: 'destructive' });
                      return;
                    }
                    setShareClipId(clip.id);
                    setShareClipLabel(displayName);
                    setShareClipDuration(null);
                    setShareOpen(true);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--surface-base) 45%, transparent)" }}
                >
                  <Share2 className="w-3 h-3" style={{ color: "color-mix(in srgb, var(--text-primary) 80%, transparent)" }} />
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
              <ClipFilterBar
                typeFilter={ideasTypeFilter}
                feelFilters={ideasFeelFilters}
                sectionFilter={ideasSectionFilter}
                unassignedOnly={ideasUnassignedOnly}
                crossSession={ideasCrossSession}
                sections={sections.map(s => s.name)}
                onTypeChange={setIdeasTypeFilter}
                onFeelToggle={(feel) => {
                  setIdeasFeelFilters(prev => 
                    prev.includes(feel) 
                      ? prev.filter(f => f !== feel)
                      : [...prev, feel]
                  );
                }}
                onSectionChange={setIdeasSectionFilter}
                onUnassignedToggle={() => setIdeasUnassignedOnly(prev => !prev)}
                onCrossSessionToggle={() => setIdeasCrossSession(prev => !prev)}
              />

              {/* Cross-session error banner */}
              {crossSessionError && (
                <div 
                  className="mx-4 mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
                  style={{ 
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--accent-warm)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-warm)', fontFamily: 'var(--font-body)' }}>
                    {crossSessionError}
                  </div>
                  <button
                    onClick={() => {
                      // Dismiss the error message
                      // crossSessionFetchFailed is true on failure; dismissing only clears the error message
                      setCrossSessionError(null);
                    }}
                    style={{ fontSize: '11px', color: 'var(--text-warm)', fontFamily: 'var(--font-body)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Loading skeleton */}
              {crossSessionLoading && (
                <div className="grid grid-cols-2 gap-2.5 p-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
                      <div className="h-24 bg-gray-700 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-600 rounded animate-pulse" />
                        <div className="h-2 bg-gray-600 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Clip grid */}
              {!crossSessionLoading && (
                filteredClips.length === 0 && hasActiveFilters ? (
                  <div className="p-4 text-center">
                    <div style={{ fontSize: '14px', color: 'var(--text-disabled)', fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
                      No clips match these filters
                    </div>
                    <button
                      onClick={() => {
                        setIdeasTypeFilter(null);
                        setIdeasFeelFilters([]);
                        setIdeasSectionFilter(null);
                        setIdeasUnassignedOnly(false);
                        setIdeasCrossSession(false);
                        setCrossSessionError(null);
                        setCrossSessionFetchFailed(false);
                      }}
                      className="px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--surface-base)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 p-4">
                    {filteredClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="rounded-xl overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
                        style={{ 
                          backgroundColor: 'var(--surface-raised)', 
                          border: '1px solid var(--border-subtle)' 
                        }}
                        onPointerDown={() => handleClipPointerDown(clip.id)}
                        onPointerUp={handleClipPointerUp}
                        onPointerLeave={handleClipPointerLeave}
                        onClick={() => {
                          const el = audioRef.current;
                          if (el) el.currentTime = clip.startTime;
                        }}
                      >
                        {/* Thumbnail area */}
                        <div className="relative h-24 bg-gray-700">
                          {/* Type badge */}
                          <div 
                            className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: 'var(--accent-primary)',
                              color: 'var(--surface-base)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {clip.type_tag || clip.type}
                          </div>
                          
                          {/* Upload state badge */}
                          {(clip.upload_status === 'local' || clip.upload_status === 'pending') && (
                            <div 
                              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--accent-warm)',
                                color: 'var(--surface-base)',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              {clip.upload_status}
                            </div>
                          )}
                        </div>

                        {/* Card meta */}
                        <div className="p-3">
                          {/* Section label */}
                          <div 
                            className="text-xs font-medium mb-1 truncate"
                            style={{
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {clip.section_id || clip.section || 'Unassigned'}
                          </div>
                          
                          {/* Note text placeholder */}
                          <div 
                            className="text-xs truncate mb-2"
                            style={{
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {clip.tags?.[0] || 'No note'}
                          </div>

                          {/* Session name for cross-session */}
                          {ideasCrossSession && clip.session_name && (
                            <div 
                              className="text-xs mb-2"
                              style={{
                                color: 'var(--text-disabled)',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              {clip.session_name}
                            </div>
                          )}

                          {/* Timecode */}
                          <div 
                            className="text-xs"
                            style={{
                              color: 'var(--text-disabled)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {formatTime(clip.startTime)}
                          </div>
                        </div>

                        {/* Responses section */}
                        <ClipResponsesSection
                          clipId={clip.id}
                          sessionId={clip.sessionId || sessionId!}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
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
                    const isTextNote = !n.audioUrl;
                    const isFocusedTextNote = isTextNote && focusedTextNoteId === n.id;
                    return (
                      <div
                        key={n.id}
                        className="px-3 py-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          backgroundColor: isFocusedTextNote
                            ? "color-mix(in srgb, var(--accent-primary) 12%, var(--surface-raised))"
                            : "var(--surface-raised)",
                          border: isFocusedTextNote
                            ? "1.5px solid var(--accent-primary)"
                            : "1px solid var(--border-subtle)",
                        }}
                        onClick={() => {
                          // Guard: if this is an expanded voice note row, don't handle row-level clicks
                          if (n.audioUrl && playingNoteId === n.id) {
                            return;
                          }
                          
                          const switchingFromOtherMemo = playingNoteId !== null && playingNoteId !== n.id;
                          if (switchingFromOtherMemo) {
                            if (voiceMemoRef.current) {
                              voiceMemoRef.current.pause();
                              voiceMemoRef.current.src = "";
                            }
                            setPlayingNoteId(null);
                            setVoiceMemoIsPlaying(false);
                            setVoiceMemoCurrentTime(0);
                            setVoiceMemoDuration(0);

                            if (isTextNote) {
                              if (musicWasPlayingBeforeMemo.current) {
                                audioRef.current?.play().catch(() => {});
                              }
                              musicWasPlayingBeforeMemo.current = false;
                            }
                          }

                          if (n.audioUrl) {
                            handleVoiceNotePlay(n.id, n.audioUrl, { switchingFromAnotherMemo: switchingFromOtherMemo });
                            return;
                          }

                          setFocusedTextNoteId(isFocusedTextNote ? null : n.id);
                          const el = audioRef.current;
                          if (el) el.currentTime = n.timecode;
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Timecode chip — seeks music */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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

                          {/* Voice memo collapsed waveform (tap target) */}
                          {n.audioUrl && playingNoteId !== n.id && !voiceMemoError[n.id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoiceNotePlay(n.id, n.audioUrl!);
                              }}
                              className="flex items-center gap-2 px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "var(--surface-overlay)",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              <Play className="w-3 h-3" style={{ color: "var(--text-secondary)" }} fill="currentColor" />
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 12 }).map((_, i) => {
                                  const h = 4 + Math.abs(Math.sin(i * 0.6)) * 8;
                                  return (
                                    <div
                                      key={i}
                                      className="rounded-sm"
                                      style={{
                                        width: "2px",
                                        height: `${h}px`,
                                        backgroundColor: "var(--accent-warm)",
                                        opacity: 0.6,
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-disabled)" }}>
                                memo
                              </span>
                            </button>
                          )}

                          {/* Voice memo error state */}
                          {n.audioUrl && voiceMemoError[n.id] && (
                            <div
                              className="flex items-center gap-2 px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--accent-warm) 10%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)",
                              }}
                            >
                              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-warm)" }}>
                                Couldn't play
                              </span>
                            </div>
                          )}

                          {/* Focused text note indicator */}
                          {isFocusedTextNote && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFocusedTextNoteId(null);
                              }}
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "var(--accent-primary)",
                                fontFamily: "var(--font-body)",
                                fontSize: "10px",
                                color: "var(--surface-base)",
                              }}
                            >
                              Close
                            </button>
                          )}
                        </div>

                        {/* Note text - always show for non-focused, expanded for focused */}
                        {n.text && (
                          <div
                            className="mt-1"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {n.text}
                          </div>
                        )}

                        {/* Expanded content region for focused text note */}
                        {isFocusedTextNote && (
                          <div
                            className="mt-3 pt-3"
                            style={{
                              borderTop: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "11px",
                                  color: "var(--text-disabled)",
                                }}
                              >
                                Pinned at
                              </span>
                              <span
                                className="px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: "var(--surface-overlay)",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "11px",
                                  color: "var(--accent-primary)",
                                }}
                              >
                                {formatTime(n.timecode)}
                              </span>
                            </div>
                            {n.text && (
                              <div
                                className="p-2 rounded-lg"
                                style={{
                                  backgroundColor: "var(--surface-overlay)",
                                  fontFamily: "var(--font-body)",
                                  fontSize: "14px",
                                  color: "var(--text-primary)",
                                  lineHeight: "1.5",
                                }}
                              >
                                {n.text}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Expanded voice mini player when playing */}
                        {playingNoteId === n.id && n.audioUrl && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <VoiceMiniPlayer
                              isPlaying={voiceMemoIsPlaying}
                              currentTime={voiceMemoCurrentTime}
                              duration={voiceMemoDuration}
                              onPlayPause={() => handleVoiceNotePlay(n.id, n.audioUrl!)}
                              onSeek={handleVoiceMemoSeek}
                            />
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
              {/* Inline offline banner */}
              {!online && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--accent-warm) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)" }}>
                  <WifiOff className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-warm)' }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-warm)" }}>Internet required to share clips</span>
                </div>
              )}
              <div style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                Share Clips
              </div>
              <div className="mt-4 space-y-3">
                {shareClips.length === 0 ? (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-disabled)", textAlign: "center", padding: "20px" }}>
                    No clips yet — <button onClick={() => setCaptureOpen(true)} style={{ color: "var(--accent-primary)", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: "14px" }}>record a clip</button> to share it
                  </div>
                ) : (
                  shareClips.map((clip) => {
                    const typeColors: Record<string, string> = {
                      idea: 'var(--accent-cool)',
                      teaching: 'var(--accent-warm)',
                      'full-run': 'var(--accent-primary)',
                    };
                    const tagColor = typeColors[clip.type] || 'var(--text-secondary)';
                    const displayName = `${clip.type.charAt(0).toUpperCase() + clip.type.slice(1)} ${new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div
                        key={clip.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--surface-raised)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded bg-gray-600 flex-shrink-0" 
                            style={{ backgroundColor: tagColor }}
                          />
                          <div>
                            <div style={{ 
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-body)'
                            }}>
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
                              {clip.feel || clip.type}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!online) {
                              if (shareOpen) setShareOpen(false);
                              toast({ title: 'Internet required to share', variant: 'destructive' });
                              return;
                            }
                            setShareClipId(clip.id);
                            setShareClipLabel(displayName);
                            setShareClipDuration(null);
                            setShareOpen(true);
                          }}
                          className="px-3 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: online ? "var(--accent-primary)" : "var(--surface-overlay)",
                            color: online ? "var(--surface-base)" : "var(--text-disabled)",
                            fontSize: "13px",
                            fontFamily: "var(--font-body)",
                            opacity: online ? 1 : 0.5,
                            cursor: online ? "pointer" : "not-allowed",
                          }}
                        >
                          {online ? "Share" : <><WifiOff className="w-3 h-3 inline mr-1" />Offline</>}
                        </button>
                      </div>
                    );
                  })
                )}
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
        onClick={() => {
          const hasMusic = !!(session?.musicUrl || session?.music_url);
          if (!hasMusic) {
            toast({ title: "Add music to start capturing" });
            return;
          }
          setCaptureOpen(true);
          setCaptureLinkedSection(activeSection);
        }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ 
          backgroundColor: (session?.musicUrl || session?.music_url) ? 'var(--accent-primary)' : 'transparent',
          border: (session?.musicUrl || session?.music_url) ? 'none' : '2px solid var(--border-subtle)',
          opacity: (session?.musicUrl || session?.music_url) ? 1 : 0.5
        }}
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
        onClose={() => {
          setCaptureBlob(null);
          setCaptureTimecodeMs(null);
          setCaptureLinkedSection(null);
          setShowQuickTag(false);
          setQuickTagSaveError(null);
        }}
        section={captureLinkedSection ?? activeSectionObj?.name ?? activeSection ?? "—"}
        timecode={captureTimecodeMs != null ? formatTime(captureTimecodeMs / 1000) : formatTime(currentTime)}
        onSubmit={handleQuickTagSubmit}
        saveError={quickTagSaveError}
        onRetry={handleQuickTagRetry}
        onSaveToInbox={handleSaveToInbox}
        recentTypes={recentTypes}
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
        onClose={() => { setShareOpen(false); setShareClipId(null); setShareClipLabel(null); setShareClipDuration(null); }}
        clipId={shareClipId ?? undefined}
        clipLabel={shareClipLabel ?? undefined}
        clipDuration={shareClipDuration ?? undefined}
        sessionId={sessionId}
      />

      <AddClipActionSheet
        isOpen={showAddClipSheet}
        onClose={() => setShowAddClipSheet(false)}
        sectionName={activeSectionObj?.name || activeSection || "section"}
        onRecordNow={() => {
          setShowAddClipSheet(false);
          setCaptureLinkedSection(activeSection);
          setCaptureOpen(true);
        }}
        onPickFromInbox={() => {
          setShowAddClipSheet(false);
          navigate(`/inbox?sessionId=${sessionId}&section=${activeSection || ""}`);
        }}
      />

      {/* Reassign Section Sheet */}
      {reassignClip && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }} 
            onClick={() => setReassignClip(null)}
          />
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

            {/* Title */}
            <div className="px-5 pt-4 pb-2">
              <p
                style={{
                  fontFamily: "var(--font-app-title)",
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "var(--text-primary)",
                }}
              >
                Move to section
              </p>
            </div>

            {/* Section Options */}
            <div className="px-4 pb-10 space-y-2 pt-2">
              {sections.map((section) => (
                <button
                  key={section.name}
                  onClick={async () => {
                    try {
                      await updateClipWithSession(reassignClip.clipId, reassignClip.sessionId, { section_id: section.name });

                      // If cross-session mode is enabled, sync the moved clip in crossSessionClips or refetch
                      if (ideasCrossSession && !crossSessionFetchFailed) {
                        setCrossSessionClips(prev => 
                          prev.map(clip => 
                            clip.id === reassignClip.clipId 
                              ? { ...clip, section_id: section.name, section: section.name }
                              : clip
                          )
                        );
                      }

                      setReassignClip(null);
                      toast({ title: `Moved to ${section.name} ✓` });
                    } catch (err) {
                      console.error('Error moving clip:', err);
                      toast({ title: 'Failed to move clip', variant: 'destructive' });
                    }
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--surface-overlay)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--accent-cool)" }}
                  >
                    <Film className="w-5 h-5" style={{ color: "var(--surface-base)" }} />
                  </div>
                  <div className="text-left">
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {section.name}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                      {formatTime(section.start)} – {formatTime(section.end)}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Cancel button */}
              <button
                onClick={() => setReassignClip(null)}
                className="w-full px-4 py-3 rounded-xl transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Nav toast from section assign */}
      {navToast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{
            backgroundColor: "color-mix(in srgb, var(--surface-base) 92%, transparent)",
            border: "1px solid var(--border-subtle)",
            zIndex: 60,
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent-primary)" }}>
            {navToast} ✓
          </span>
        </div>
      )}

      {/* Global toast for offline share attempts */}
      {shareToast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{
            backgroundColor:
              shareToast.variant === 'destructive'
                ? 'color-mix(in srgb, var(--accent-warm) 10%, transparent)'
                : 'color-mix(in srgb, var(--surface-base) 92%, transparent)',
            border:
              shareToast.variant === 'destructive'
                ? '1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)'
                : '1px solid var(--border-subtle)',
            zIndex: 61,
          }}
        >
          <div className="flex items-center gap-2">
            {shareToast.variant === 'destructive' && (
              <WifiOff className="w-3.5 h-3.5" style={{ color: 'var(--accent-warm)' }} />
            )}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: shareToast.variant === 'destructive' ? 'var(--accent-warm)' : "var(--accent-primary)",
              }}
            >
              {shareToast.title}
            </span>
          </div>
        </div>
      )}

      {captureOpen && (
        <CaptureOverlay
          sectionLabel={captureLinkedSection ?? activeSection ?? "Session"}
          timecode={formatTime(currentTime)}
          onStop={(blob) => {
            setCaptureOpen(false);
            setCaptureBlob(blob);
            setCaptureTimecodeMs(Math.round(currentTime * 1000));
          }}
          onClose={() => {
            setCaptureOpen(false);
            setCaptureLinkedSection(null);
          }}
        />
      )}
        </>
      )}
    </div>
  );
}