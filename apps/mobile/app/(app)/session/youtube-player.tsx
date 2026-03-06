import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import YoutubeIframe, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { theme } from '../../../lib/theme';
import { useSession } from '../../../lib/hooks/useSession';
import { supabase } from '../../../lib/supabase';
import type { MusicTrack, SectionEntry } from '@roam/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function extractVideoId(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1]! : null;
}

export default function YoutubePlayerScreen() {
  const { sessionId, musicTrackId } = useLocalSearchParams<{
    sessionId: string;
    musicTrackId: string;
  }>();
  const router = useRouter();
  const { session } = useSession();
  const [musicTrack, setMusicTrack] = useState<MusicTrack | null>(null);
  const [sections, setSections] = useState<SectionEntry[]>([]);
  const [playbackPositionSec, setPlaybackPositionSec] = useState(0);
  const [editingSection, setEditingSection] = useState<{ index: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [playerState, setPlayerState] = useState<string>('unstarted');
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll current time while playing; stop when paused/stopped/unmounted
  useEffect(() => {
    if (playerState !== 'playing') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }
    const poll = async () => {
      try {
        const sec = await playerRef.current?.getCurrentTime();
        if (typeof sec === 'number') setPlaybackPositionSec(sec);
      } catch {
        // ignore
      }
    };
    poll();
    pollIntervalRef.current = setInterval(poll, 500);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [playerState]);

  useEffect(() => {
    if (!sessionId || !musicTrackId) return;
    (async () => {
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('id', musicTrackId)
        .eq('session_id', sessionId)
        .single();
      setMusicTrack((data as MusicTrack | null) ?? null);
    })();
  }, [sessionId, musicTrackId]);

  useEffect(() => {
    if (!musicTrack) return;
    setSections(musicTrack.sections ?? []);
  }, [musicTrack]);

  const videoId = musicTrack ? extractVideoId(musicTrack.source_url) : null;

  const addSectionAtPlayhead = () => {
    const start_ms = playbackPositionSec * 1000;
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

  const handleSaveSections = async () => {
    if (!sessionId || !session?.access_token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.back();
    } catch (e) {
      if (__DEV__) console.warn(e);
      setSaving(false);
    }
  };

  if (!musicTrack) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!videoId) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Invalid YouTube track.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YoutubeIframe
        ref={playerRef}
        height={220}
        videoId={videoId}
        onChangeState={(state) => {
          setPlayerState(state);
        }}
      />

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

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSaveSections}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving…' : 'Save sections'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16,
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 12,
  },
  error: {
    color: '#e74c3c',
    fontSize: 16,
  },
  sectionsBlock: {
    marginTop: 16,
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
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    alignSelf: 'flex-start',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
});
