import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { theme } from '../../../lib/theme';
import { useSession } from '../../../lib/hooks/useSession';
import { supabase } from '../../../lib/supabase';
import type { MusicTrack, BeatGridEntry, SectionEntry } from '@roam/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const PX_PER_MS = 0.1;
const SLIDER_MIN = -200;
const SLIDER_MAX = 200;

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function BeatGridScreen() {
  const { sessionId, musicTrackJson } = useLocalSearchParams<{
    sessionId: string;
    musicTrackJson: string;
  }>();
  const router = useRouter();
  const { session } = useSession();
  const musicTrack = sessionId && musicTrackJson ? (JSON.parse(musicTrackJson) as MusicTrack) : null;

  const [baseBeatMarkers, setBaseBeatMarkers] = useState<BeatGridEntry[]>([]);
  const [sections, setSections] = useState<SectionEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [tapOffset, setTapOffset] = useState(0);
  const [sliderOffset, setSliderOffset] = useState(0);
  const [editingSection, setEditingSection] = useState<{ index: number; label: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const totalDurationMs = useRef(0);

  useEffect(() => {
    if (!musicTrack) return;
    setBaseBeatMarkers(musicTrack.beat_grid ?? []);
    setSections(musicTrack.sections ?? []);
    const last = musicTrack.beat_grid?.length
      ? Math.max(...musicTrack.beat_grid.map((b) => b.time_ms))
      : 0;
    totalDurationMs.current = last || 300000;
  }, [musicTrack]);

  useEffect(() => {
    if (!musicTrack?.storage_path) return;
    const { data } = supabase.storage.from('audio').getPublicUrl(musicTrack.storage_path);
    const uri = data.publicUrl;
    let mounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          (status) => {
            if (mounted && status.isLoaded && status.positionMillis != null)
              setPlaybackPositionMs(status.positionMillis);
          }
        );
        if (mounted) soundRef.current = sound;
      } catch (e) {
        if (__DEV__) console.warn('[BeatGrid] load error', e);
      }
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync?.();
      soundRef.current = null;
    };
  }, [musicTrack?.storage_path]);

  const togglePlay = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!status.isPlaying);
  };

  const handleTapOnOne = () => {
    const tapTime = playbackPositionMs;
    const downbeats = baseBeatMarkers.filter((b) => b.is_downbeat);
    if (downbeats.length === 0) return;
    let nearest = downbeats[0];
    let minDist = Math.abs(downbeats[0].time_ms - tapTime);
    for (const d of downbeats) {
      const dist = Math.abs(d.time_ms - tapTime);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }
    setTapOffset(tapTime - nearest.time_ms);
  };

  const offsetMs = tapOffset + sliderOffset;
  const displayedBeatMarkers = baseBeatMarkers.map((b) => ({
    ...b,
    time_ms: b.time_ms + offsetMs,
  }));
  const canvasWidth = Math.max(totalDurationMs.current * PX_PER_MS, 2000);

  const handleSaveAlignment = async () => {
    if (!sessionId || !session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sections,
          downbeat_offset_ms: offsetMs,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      if (__DEV__) console.warn(e);
    }
  };

  const addSectionAtPlayhead = () => {
    const start_ms = playbackPositionMs;
    setSections((prev) => [...prev, { label: 'Section', start_ms }]);
  };

  const updateSectionLabel = (index: number, label: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, label } : s))
    );
    setEditingSection((e) => (e?.index === index ? { index, label } : e));
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
    setEditingSection(null);
  };

  if (!musicTrack || !sessionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Missing session or track.</Text>
      </View>
    );
  }

  const bpm = musicTrack.bpm ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Beat Alignment</Text>
        <Text style={styles.bpm}>{bpm} BPM</Text>
      </View>

      <ScrollView
        horizontal
        style={styles.scrollView}
        contentContainerStyle={{ width: canvasWidth, height: 120 }}
        showsHorizontalScrollIndicator
      >
        <View style={[styles.canvas, { width: canvasWidth }]}>
          {displayedBeatMarkers.map((beat, i) => (
            <View
              key={i}
              style={[
                styles.beatLine,
                beat.is_downbeat ? styles.beatLineDownbeat : undefined,
                { left: beat.time_ms * PX_PER_MS },
              ]}
            />
          ))}
          <View
            style={[
              styles.playhead,
              { left: playbackPositionMs * PX_PER_MS },
            ]}
          />
          {sections.map((sec, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.sectionPill, { left: sec.start_ms * PX_PER_MS }]}
              onPress={() => setEditingSection({ index: i, label: sec.label })}
            >
              <Text style={styles.sectionPillText} numberOfLines={1}>
                {sec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
          <Text style={styles.playBtnText}>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
        </TouchableOpacity>
        {isPlaying && (
          <TouchableOpacity style={styles.tapBtn} onPress={handleTapOnOne} activeOpacity={0.8}>
            <Text style={styles.tapBtnText}>👇 Tap on the &quot;1&quot;</Text>
          </TouchableOpacity>
        )}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Fine offset:</Text>
          <Slider
            style={styles.slider}
            minimumValue={SLIDER_MIN}
            maximumValue={SLIDER_MAX}
            step={1}
            value={sliderOffset}
            onValueChange={setSliderOffset}
            minimumTrackTintColor={theme.textSecondary}
            maximumTrackTintColor={theme.textSecondary}
            thumbTintColor={theme.textPrimary}
          />
          <Text style={styles.sliderValue}>{sliderOffset}ms</Text>
        </View>
      </View>

      <View style={styles.sectionsBlock}>
        <Text style={styles.sectionsTitle}>SECTIONS</Text>
        {sections.map((sec, i) => (
          <View key={i} style={styles.sectionRow}>
            {editingSection?.index === i ? (
              <TextInput
                style={styles.sectionInput}
                value={editingSection.label}
                onChangeText={(label) => setEditingSection({ index: i, label })}
                onBlur={() => {
                  updateSectionLabel(i, editingSection.label);
                  setEditingSection(null);
                }}
                autoFocus
                placeholderTextColor={theme.textSecondary}
              />
            ) : (
              <Text
                style={styles.sectionLabel}
                onPress={() => setEditingSection({ index: i, label: sec.label })}
              >
                • {sec.label} {formatMs(sec.start_ms)}
              </Text>
            )}
            <TouchableOpacity onPress={() => removeSection(i)} hitSlop={8}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addSectionBtn} onPress={addSectionAtPlayhead} activeOpacity={0.8}>
          <Text style={styles.addSectionText}>＋ Add section at playhead</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.saveRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAlignment} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save alignment</Text>
        </TouchableOpacity>
        {saved && <Text style={styles.savedLabel}>Saved ✓</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16,
  },
  placeholder: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  bpm: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  scrollView: {
    maxHeight: 120,
    marginBottom: 16,
  },
  canvas: {
    height: 80,
    position: 'relative',
  },
  beatLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: theme.textSecondary,
    top: 0,
  },
  beatLineDownbeat: {
    width: 2,
    backgroundColor: theme.textPrimary,
  },
  playhead: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#e74c3c',
    top: 0,
  },
  sectionPill: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.textSecondary,
    borderRadius: 4,
    top: 4,
    maxWidth: 80,
  },
  sectionPillText: {
    fontSize: 10,
    color: theme.background,
  },
  controls: {
    marginBottom: 16,
  },
  playBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  playBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  tapBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tapBtnText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    minWidth: 70,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  sliderValue: {
    color: theme.textPrimary,
    fontSize: 14,
    minWidth: 40,
  },
  sectionsBlock: {
    marginBottom: 16,
  },
  sectionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionLabel: {
    color: theme.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  sectionInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    color: theme.textPrimary,
  },
  removeBtn: {
    color: theme.textSecondary,
    fontSize: 16,
    paddingLeft: 8,
  },
  addSectionBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  addSectionText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
  },
  saveBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  savedLabel: {
    color: '#2ecc71',
    fontSize: 14,
  },
});
