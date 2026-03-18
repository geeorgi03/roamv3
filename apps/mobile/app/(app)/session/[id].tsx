import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import Toast from 'react-native-toast-message';
import { theme } from '../../../lib/theme';
import { useSession } from '../../../lib/hooks/useSession';
import { useClips } from '../../../lib/hooks/useClips';
import { useInbox } from '../../../lib/hooks/useInbox';
import { useNotePins } from '../../../lib/hooks/useNotePins';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import { supabase } from '../../../lib/supabase';
import { API_BASE } from '../../../lib/api';
import { ShareSheet } from '../../../components/ShareSheet';
import { CaptureSheet } from '../../../components/CaptureSheet';
import { ClipCard } from '../../../components/ClipCard';
import { ClipShareSheet } from '../../../components/ClipShareSheet';
import { NotePinSheet } from '../../../components/NotePinSheet';
import type { SectionClip } from '@roam/types';

// Playback speed steps cycled by the speed chip
const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

// Visible timeline span when no audio is loaded (75 s)
const FALLBACK_DURATION_MS = 75_000;

function formatTimecode(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

export default function SessionWorkbenchScreen() {
  const { id, sectionName: sectionNameParam } = useLocalSearchParams<{
    id: string;
    sectionName?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useSession();
  const { width: screenWidth } = useWindowDimensions();

  // Layout constants for playhead positioning
  const TRACK_HEADER_W = 16 + 44 + 1; // timeline leftPad + header + separator
  const trackBodyWidth = Math.max(1, screenWidth - TRACK_HEADER_W - 16);

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const clipShareSheetRef = useRef<BottomSheet | null>(null);
  const notePinSheetRef = useRef<BottomSheet | null>(null);

  // ── Data hooks ───────────────────────────────────────────────────────────
  const { clips, retryClip } = useClips(id ?? null);
  const { count: inboxCount, refreshCount } = useInbox();
  const { notes, createNote, deleteNote } = useNotePins(id ?? null);
  const { musicTrack, isAnalysing } = useMusicTrackStatus(id ?? null);

  // ── Session metadata ─────────────────────────────────────────────────────
  const [sessionName, setSessionName] = useState('Session');
  const [activeSection, setActiveSection] = useState(() =>
    typeof sectionNameParam === 'string' && sectionNameParam.trim()
      ? sectionNameParam
      : 'Section'
  );
  const [workspaceTab, setWorkspaceTab] = useState<'ideas' | 'notes'>('ideas');

  // ── Playback state ───────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ── Loop state ───────────────────────────────────────────────────────────
  const [loopRegion, setLoopRegion] = useState<{ start: number; end: number } | null>(null);

  // ── Section clips (for clip-track positioning & workspace filtering) ─────
  const [sectionClips, setSectionClips] = useState<SectionClip[]>([]);

  // ── Selected items for sheets ────────────────────────────────────────────
  const [selectedClip, setSelectedClip] = useState<{ id: string; label: string } | null>(null);
  const [selectedNote, setSelectedNote] = useState<{
    id: string;
    timecode_ms: number;
    text: string | null;
    audio_storage_path: string | null;
  } | null>(null);

  // ── Derived values ───────────────────────────────────────────────────────
  const effectiveDuration = Math.max(durationMs, FALLBACK_DURATION_MS);
  const playheadLeft =
    TRACK_HEADER_W +
    Math.min(
      (playheadMs / effectiveDuration) * trackBodyWidth,
      trackBodyWidth - 2
    );

  // ── Header options ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => shareSheetRef.current?.snapToIndex(0)}
          >
            <Text style={styles.headerIcon}>⎘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {}}
          >
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // ── Session name fetch ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !session?.access_token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const name = (data as { session?: { name?: string } }).session?.name;
        if (name) setSessionName(name);
      } catch {
        // ignore
      }
    })();
  }, [id, session?.access_token]);

  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  // ── Section clips fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !session?.access_token) return;
    fetch(`${API_BASE}/sessions/${id}/assembly`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSectionClips(data as SectionClip[]);
      })
      .catch(() => {});
  }, [id, session?.access_token]);

  // ── Music URL derivation ─────────────────────────────────────────────────
  // Resolve a signed URL from the music track's storage path so it can be
  // loaded into expo-av for actual playback.
  useEffect(() => {
    const path = musicTrack?.storage_path;
    if (!path || !supabase) {
      setMusicUrl(null);
      return;
    }
    supabase.storage
      .from('audio')
      .createSignedUrl(path, 86400)
      .then(({ data }) => {
        setMusicUrl(data?.signedUrl ?? null);
      })
      .catch(() => setMusicUrl(null));
  }, [musicTrack?.storage_path]);

  // ── Audio Sound load / unload ────────────────────────────────────────────
  useEffect(() => {
    const url = musicUrl;
    if (!url) {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      setIsPlaying(false);
      setDurationMs(0);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false, rate: playbackSpeed, volume: 1.0 },
          (s: AVPlaybackStatus) => {
            if (!mounted) return;
            if (s.isLoaded) {
              setPlayheadMs(s.positionMillis ?? 0);
              setIsPlaying(s.isPlaying);
              if (s.durationMillis) setDurationMs(s.durationMillis);
              if (s.didJustFinish) {
                setIsPlaying(false);
                setPlayheadMs(0);
              }
            }
          }
        );
        if (!mounted) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        if (status.isLoaded && status.durationMillis) {
          setDurationMs(status.durationMillis);
        }
      } catch {
        // Audio load errors are non-fatal; UI falls back to placeholder
      }
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  // ── Sync playback rate when speed changes ────────────────────────────────
  useEffect(() => {
    soundRef.current?.setRateAsync(playbackSpeed, true).catch(() => {});
  }, [playbackSpeed]);

  // ── Transport handlers ───────────────────────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      if (isPlaying) await sound.pauseAsync();
      else await sound.playAsync();
    } catch {
      // ignore
    }
  }, [isPlaying]);

  const handleSeekBack = useCallback(async () => {
    const next = Math.max(0, playheadMs - 5000);
    const sound = soundRef.current;
    if (sound) {
      try {
        await sound.setPositionAsync(next);
      } catch {
        setPlayheadMs(next);
      }
    } else {
      setPlayheadMs(next);
    }
  }, [playheadMs]);

  const handleSeekForward = useCallback(async () => {
    const next = playheadMs + 5000;
    const sound = soundRef.current;
    if (sound) {
      try {
        await sound.setPositionAsync(next);
      } catch {
        setPlayheadMs(next);
      }
    } else {
      setPlayheadMs(next);
    }
  }, [playheadMs]);

  const handleSpeedToggle = useCallback(() => {
    setPlaybackSpeed((s) => {
      const idx = SPEEDS.indexOf(s);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  // ── Section chip handler ─────────────────────────────────────────────────
  const handleSectionPress = useCallback(
    async (section: { label: string; start_ms: number }) => {
      setActiveSection(section.label);
      const sound = soundRef.current;
      if (sound) {
        try {
          await sound.setPositionAsync(section.start_ms);
        } catch {
          // ignore seek failure
        }
      }
      setPlayheadMs(section.start_ms);
    },
    []
  );

  // ── Loop region handler ──────────────────────────────────────────────────
  const handleLoopToggle = useCallback(() => {
    setLoopRegion((lr) => {
      if (lr) return null;
      const sections = musicTrack?.sections ?? [];
      const activeSect = sections.find((s) => s.label === activeSection);
      const start = activeSect?.start_ms ?? playheadMs;
      const nextSect = sections.find((s) => s.start_ms > start);
      const end = nextSect?.start_ms ?? Math.min(effectiveDuration, start + 30_000);
      return { start, end };
    });
  }, [musicTrack?.sections, activeSection, playheadMs, effectiveDuration]);

  // ── Note handlers ────────────────────────────────────────────────────────
  const openNoteAt = (timecodeMs: number, note?: typeof selectedNote) => {
    setSelectedNote(note ?? null);
    setPlayheadMs(timecodeMs);
    notePinSheetRef.current?.snapToIndex(0);
  };

  const handleSaveNote = useCallback(
    async (data: { text?: string; audioUri?: string }) => {
      const created = await createNote({
        timecode_ms: playheadMs,
        text: data.text ?? null,
        audio_storage_path: data.audioUri ?? null,
      });
      if (created) Toast.show({ type: 'success', text1: 'Note pinned' });
    },
    [createNote, playheadMs]
  );

  const handleDeleteSelectedNote = useCallback(async () => {
    if (!selectedNote) return;
    const ok = await deleteNote(selectedNote.id);
    if (ok) Toast.show({ type: 'success', text1: 'Note deleted' });
  }, [deleteNote, selectedNote]);

  // ── Clip filtering by active section ────────────────────────────────────
  // Only filter when the active section matches a real music-track section so
  // we don't hide all clips when no music has been set up.
  const hasActiveMusicSection = useMemo(
    () => musicTrack?.sections?.some((s) => s.label === activeSection) ?? false,
    [musicTrack?.sections, activeSection]
  );

  const displayClips = useMemo(() => {
    if (!hasActiveMusicSection || sectionClips.length === 0) return clips;
    const sectionIds = new Set(
      sectionClips
        .filter((sc) => sc.section_label === activeSection)
        .map((sc) => sc.clip_id)
    );
    // Show clips confirmed in this section, plus locally-queued clips without
    // a server_id yet (they'll be assigned once upload completes).
    return clips.filter((c) => !c.server_id || sectionIds.has(c.server_id));
  }, [clips, sectionClips, activeSection, hasActiveMusicSection]);

  // ── Time ruler markers ───────────────────────────────────────────────────
  const timeMarkers = useMemo(() => ['0:00', '0:15', '0:30', '0:45', '1:00', '1:15'], []);

  const openClipPlayer = (index: number) => {
    router.push({
      pathname: './clip-player',
      params: { sessionId: id, clipIndex: String(index) },
    });
  };

  // ── Speed label ──────────────────────────────────────────────────────────
  const speedLabel =
    playbackSpeed % 1 === 0
      ? `${playbackSpeed.toFixed(1)}×`
      : `${playbackSpeed}×`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {sessionName}
        </Text>
      </View>

      {/* Time ruler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ruler}
      >
        {timeMarkers.map((t) => (
          <Text key={t} style={styles.rulerTick}>
            {t}
          </Text>
        ))}
      </ScrollView>

      {/* Section chips — shown when music analysis has produced sections */}
      {musicTrack?.sections && musicTrack.sections.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionChips}
        >
          {musicTrack.sections.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[
                styles.sectionChip,
                s.label === activeSection && styles.sectionChipActive,
              ]}
              onPress={() => handleSectionPress(s)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.sectionChipText,
                  s.label === activeSection && styles.sectionChipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Track timeline */}
      <View style={styles.timeline}>
        {/* Music track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>♪</Text>
          </View>
          <View style={[styles.trackBody, styles.waveformRow]}>
            {musicTrack ? (
              isAnalysing || musicTrack.analysis_status === 'pending' ? (
                <Text style={styles.trackHint}>Analysing…</Text>
              ) : (
                <>
                  <Text style={styles.trackHint} numberOfLines={1}>
                    {musicTrack.bpm ? `${Math.round(musicTrack.bpm)} BPM` : 'Music'}
                    {durationMs > 0 ? ` · ${formatTimecode(durationMs)}` : ''}
                  </Text>
                  {/* Section boundary lines */}
                  {musicTrack.sections?.map((s) => {
                    const x =
                      effectiveDuration > 0
                        ? (s.start_ms / effectiveDuration) * trackBodyWidth
                        : 0;
                    return (
                      <View
                        key={s.label}
                        style={[styles.sectionMarker, { left: x }]}
                      />
                    );
                  })}
                </>
              )
            ) : (
              <TouchableOpacity
                style={styles.dashedInline}
                onPress={() =>
                  router.push({ pathname: './music-setup', params: { id } })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.dashedText}>Add music</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Note-pin track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>📍</Text>
          </View>
          <TouchableOpacity
            style={styles.trackBody}
            activeOpacity={1}
            onPress={() => openNoteAt(playheadMs)}
          >
            <View style={styles.pinsRow}>
              {notes.slice(0, 18).map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.pinDot,
                    { backgroundColor: n.color ?? '#4ECDC4' },
                  ]}
                  onPress={() =>
                    openNoteAt(n.timecode_ms, {
                      id: n.id,
                      timecode_ms: n.timecode_ms,
                      text: n.text,
                      audio_storage_path: n.audio_storage_path,
                    })
                  }
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Clips track — blocks positioned by section_clips data when available */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>🎬</Text>
          </View>
          <View style={[styles.trackBody, styles.clipsRow]}>
            {clips.length === 0 ? (
              <Text style={styles.trackHint}>No clips</Text>
            ) : (
              <>
                <Text style={styles.trackHint}>{clips.length} clips</Text>
                {clips.slice(0, 20).map((clip, i) => {
                  const sc = sectionClips.find((x) => x.clip_id === clip.server_id);
                  const frac =
                    sc && effectiveDuration > 0
                      ? sc.section_start_ms / effectiveDuration
                      : (i / Math.max(clips.length, 1)) * 0.85;
                  return (
                    <View
                      key={clip.local_id}
                      style={[
                        styles.clipBlock,
                        {
                          left: frac * trackBodyWidth,
                          backgroundColor:
                            clip.upload_status === 'ready' ? '#C8F135' : '#4ECDC4',
                        },
                      ]}
                    />
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* Loop track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>🔁</Text>
          </View>
          <View style={[styles.trackBody, styles.loopRow]}>
            {loopRegion ? (
              <>
                <View
                  style={[
                    styles.loopBlock,
                    {
                      left:
                        effectiveDuration > 0
                          ? (loopRegion.start / effectiveDuration) * trackBodyWidth
                          : 0,
                      width:
                        effectiveDuration > 0
                          ? ((loopRegion.end - loopRegion.start) /
                              effectiveDuration) *
                            trackBodyWidth
                          : 40,
                    },
                  ]}
                />
                <TouchableOpacity
                  style={styles.loopClearBtn}
                  onPress={handleLoopToggle}
                >
                  <Text style={styles.trackHint}>✕ Loop</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleLoopToggle}>
                <Text style={styles.trackHint}>Set loop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Playhead — dynamic position driven by actual playback position */}
        <View
          style={[styles.playhead, { left: playheadLeft }]}
          pointerEvents="none"
        />
      </View>

      {/* Transport bar */}
      <View style={styles.transport}>
        <TouchableOpacity style={styles.transportBtn} onPress={handleSeekBack}>
          <Text style={styles.transportText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, !musicUrl && styles.playBtnDisabled]}
          onPress={handlePlayPause}
          disabled={!musicUrl}
        >
          <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.transportBtn} onPress={handleSeekForward}>
          <Text style={styles.transportText}>⏭</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chip} onPress={handleSpeedToggle}>
          <Text style={styles.chipText}>{speedLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip}>
          <Text style={styles.chipText}>Mirror</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => captureSheetRef.current?.snapToIndex(0)}
        >
          <Text style={styles.chipText}>+ Track</Text>
        </TouchableOpacity>
      </View>

      {/* Section workspace */}
      <View style={styles.workspace}>
        <View style={styles.workspaceHeader}>
          <Text style={styles.workspaceTitle}>{activeSection}</Text>
          <Text style={styles.workspaceMeta}>
            {formatTimecode(playheadMs)} · …
          </Text>
          {!musicTrack ? (
            <TouchableOpacity
              style={styles.workspaceBtn}
              onPress={() =>
                router.push({ pathname: './music-setup', params: { id } })
              }
            >
              <Text style={styles.workspaceBtnText}>Add music</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.workspaceTabs}>
          <TouchableOpacity
            style={[
              styles.workspaceTab,
              workspaceTab === 'ideas' && styles.workspaceTabActive,
            ]}
            onPress={() => setWorkspaceTab('ideas')}
          >
            <Text
              style={[
                styles.workspaceTabText,
                workspaceTab === 'ideas' && styles.workspaceTabTextActive,
              ]}
            >
              Ideas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.workspaceTab,
              workspaceTab === 'notes' && styles.workspaceTabActive,
            ]}
            onPress={() => setWorkspaceTab('notes')}
          >
            <Text
              style={[
                styles.workspaceTabText,
                workspaceTab === 'notes' && styles.workspaceTabTextActive,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>
        </View>

        {workspaceTab === 'ideas' ? (
          <FlatList
            data={displayClips}
            keyExtractor={(c) => c.local_id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
            renderItem={({ item, index }) => (
              <View style={styles.clipCell}>
                <ClipCard
                  clip={item}
                  onPress={() => openClipPlayer(index)}
                  onLongPress={() => {}}
                  onRetry={() => retryClip(item.local_id)}
                />
                <TouchableOpacity
                  style={[
                    styles.clipShareIcon,
                    item.upload_status !== 'ready' && styles.clipShareIconDisabled,
                  ]}
                  onPress={() => {
                    if (item.upload_status !== 'ready' || !item.server_id) {
                      Toast.show({
                        type: 'info',
                        text1: 'Available once clip is ready.',
                      });
                      return;
                    }
                    setSelectedClip({
                      id: item.server_id,
                      label: item.label ?? 'Clip',
                    });
                    clipShareSheetRef.current?.snapToIndex(0);
                  }}
                  disabled={item.upload_status !== 'ready' || !item.server_id}
                >
                  <Text style={styles.clipShareIconText}>⎘</Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addClipCard}
                onPress={() => captureSheetRef.current?.snapToIndex(0)}
                activeOpacity={0.85}
              >
                <Text style={styles.addClipText}>+ Add clip</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <View style={styles.notesWrap}>
            <TouchableOpacity
              style={styles.pinBtn}
              onPress={() => openNoteAt(playheadMs)}
            >
              <Text style={styles.pinBtnText}>Pin a note at playhead</Text>
            </TouchableOpacity>
            <ScrollView
              contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
            >
              {notes.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={styles.noteRow}
                  onPress={() => setPlayheadMs(n.timecode_ms)}
                >
                  <View
                    style={[
                      styles.noteColorBar,
                      { backgroundColor: n.color ?? '#4ECDC4' },
                    ]}
                  />
                  <Text style={styles.noteTime}>
                    {formatTimecode(n.timecode_ms)}
                  </Text>
                  <Text style={styles.noteText} numberOfLines={2}>
                    {n.text ?? (n.audio_storage_path ? 'Voice note' : 'Note')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Sheets */}
      <ShareSheet
        sessionId={id ?? ''}
        sessionName={sessionName}
        hasMusic={!!musicTrack}
        untaggedClipCount={0}
        bottomSheetRef={shareSheetRef}
      />

      <CaptureSheet
        bottomSheetRef={captureSheetRef}
        sectionName={activeSection}
        inboxCount={inboxCount}
        onRecord={() =>
          router.push({ pathname: './camera', params: { id, sectionName: activeSection } })
        }
        onInbox={() =>
          router.push({
            pathname: '/inbox',
            params: { sessionId: id, sectionName: activeSection },
          })
        }
      />

      <ClipShareSheet
        clipId={selectedClip?.id ?? null}
        clipLabel={selectedClip?.label ?? 'Clip'}
        sectionName={activeSection}
        duration=""
        bottomSheetRef={clipShareSheetRef}
      />

      <NotePinSheet
        bottomSheetRef={notePinSheetRef}
        sessionId={id ?? undefined}
        timecode={formatTimecode(playheadMs)}
        sectionName={activeSection}
        initialText={selectedNote?.text ?? null}
        initialAudioUri={selectedNote?.audio_storage_path ?? null}
        onSave={handleSaveNote}
        onDelete={selectedNote ? handleDeleteSelectedNote : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  sessionTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { padding: 8, marginRight: 4 },
  headerIcon: { color: '#fff', fontSize: 22 },

  ruler: { paddingHorizontal: 16, paddingBottom: 8, gap: 16 },
  rulerTick: { color: theme.textSecondary, fontSize: 12 },

  // Section chips row
  sectionChips: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  sectionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: '#1B1B22',
  },
  sectionChipActive: { borderColor: '#C8F135', backgroundColor: '#1a2300' },
  sectionChipText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
  sectionChipTextActive: { color: '#C8F135' },

  timeline: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  track: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    backgroundColor: '#1B1B22',
  },
  trackHeader: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2A2A32',
  },
  trackIcon: { color: theme.textPrimary, fontSize: 16 },
  trackBody: { flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  trackHint: { color: theme.textSecondary, fontSize: 13 },

  // Music waveform track
  waveformRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  sectionMarker: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: '#C8F135',
    opacity: 0.6,
  },

  dashedInline: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.textSecondary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  dashedText: { color: theme.textPrimary, fontWeight: '800' },

  // Note pins
  pinsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pinDot: { width: 10, height: 10, borderRadius: 5 },

  // Clips track
  clipsRow: { position: 'relative' },
  clipBlock: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    width: 6,
    borderRadius: 3,
  },

  // Loop track
  loopRow: { position: 'relative' },
  loopBlock: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 4,
    backgroundColor: '#C8F135',
    opacity: 0.25,
  },
  loopClearBtn: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // Playhead
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e57373',
    opacity: 0.9,
  },

  // Transport
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  transportBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportText: { color: theme.textPrimary, fontSize: 16 },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#C8F135',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDisabled: { opacity: 0.45 },
  playBtnText: { color: '#0b0b0f', fontSize: 18, fontWeight: '900' },
  chip: {
    marginLeft: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: '#1B1B22',
  },
  chipText: { color: theme.textPrimary, fontWeight: '800', fontSize: 12 },

  // Workspace
  workspace: { flex: 1, marginTop: 4 },
  workspaceHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  workspaceTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '900' },
  workspaceMeta: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  workspaceBtn: {
    position: 'absolute',
    right: 16,
    top: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A32',
  },
  workspaceBtnText: { color: theme.textPrimary, fontWeight: '800', fontSize: 12 },
  workspaceTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  workspaceTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  workspaceTabActive: { borderBottomColor: '#C8F135' },
  workspaceTabText: { color: theme.textSecondary, fontWeight: '800' },
  workspaceTabTextActive: { color: theme.textPrimary },
  clipCell: { flex: 1, position: 'relative' },
  addClipCard: {
    marginTop: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  addClipText: { color: theme.textPrimary, fontWeight: '900' },
  clipShareIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipShareIconDisabled: { opacity: 0.35 },
  clipShareIconText: { color: theme.textPrimary, fontSize: 16, fontWeight: '900' },
  notesWrap: { flex: 1 },
  pinBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: theme.borderRadius,
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    alignItems: 'center',
  },
  pinBtnText: { color: theme.textPrimary, fontWeight: '900' },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    padding: 12,
  },
  noteColorBar: { width: 4, height: 30, borderRadius: 2 },
  noteTime: { color: theme.textPrimary, fontFamily: 'monospace', width: 54 },
  noteText: { color: theme.textSecondary, flex: 1 },
});
