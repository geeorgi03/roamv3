import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import type { Clip } from '@roam/types';
import { ClipCard } from '../../components/ClipCard';
import type { ClipRow } from '../../lib/database';
import { useSession } from '../../lib/hooks/useSession';

import { API_BASE } from '../../lib/api';

const STYLES = ['Hip-hop', 'Contemporary', 'Ballet', 'Jazz', 'Fusion', 'Other'] as const;
const ENERGY_LEVELS = ['Low', 'Medium', 'High', 'Explosive'] as const;
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function LibraryScreen() {
  const { session } = useSession();
  const token = session?.access_token ?? null;

  const [clips, setClips] = useState<Clip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const [q, setQ] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState<string>('');
  const [filterStyle, setFilterStyle] = useState<string | null>(null);
  const [filterEnergy, setFilterEnergy] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [bpmMin, setBpmMin] = useState<string>('');
  const [bpmMax, setBpmMax] = useState<string>('');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [q]);

  const fetchLibrary = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean }) => {
      if (!token) {
        setLoading(false);
        return;
      }

      const cursor = opts?.cursor ?? null;
      const append = opts?.append ?? false;

      const params = new URLSearchParams();
      params.set('limit', '20');
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
      if (filterStyle) params.set('style', filterStyle);
      if (filterEnergy) params.set('energy', filterEnergy);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);
      if (bpmMin.trim()) params.set('bpm_min', bpmMin.trim());
      if (bpmMax.trim()) params.set('bpm_max', bpmMax.trim());
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${API_BASE}/library?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { clips?: Clip[]; next_cursor?: string | null; error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? res.statusText);
      }

      const incoming = data.clips ?? [];
      setNextCursor(data.next_cursor ?? null);
      if (append) setClips((prev) => [...prev, ...incoming]);
      else setClips(incoming);
    },
    [token, debouncedQ, filterStyle, filterEnergy, filterDifficulty, bpmMin, bpmMax]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await fetchLibrary({ cursor: null, append: false });
      } catch {
        if (alive) {
          setClips([]);
          setNextCursor(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchLibrary]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchLibrary({ cursor: nextCursor, append: true });
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const toClipRow = (clip: Clip): ClipRow => {
    const localId =
      (clip as unknown as { local_id?: string | null }).local_id ??
      (clip as unknown as { id: string }).id;
    const serverId = (clip as unknown as { id: string }).id;
    const sessionId = (clip as unknown as { session_id?: string | null }).session_id ?? '';

    return {
      local_id: localId,
      server_id: serverId,
      session_id: sessionId,
      label: (clip as unknown as { label?: string | null }).label ?? 'Clip',
      recorded_at: (clip as unknown as { recorded_at?: string | null }).recorded_at ?? null,
      file_uri: null,
      upload_status: 'ready',
      upload_progress: 0,
      mux_playback_id: (clip as unknown as { mux_playback_id?: string | null }).mux_playback_id ?? null,
      move_name: (clip as unknown as { move_name?: string | null }).move_name ?? null,
      style: (clip as unknown as { style?: string | null }).style ?? null,
      energy: (clip as unknown as { energy?: string | null }).energy ?? null,
      difficulty: (clip as unknown as { difficulty?: string | null }).difficulty ?? null,
      bpm: (clip as unknown as { bpm?: number | null }).bpm ?? null,
      notes: (clip as unknown as { notes?: string | null }).notes ?? null,
    };
  };

  const openPlayer = (clip: Clip) => {
    const id = (clip as unknown as { id: string }).id;
    const mux_playback_id = (clip as unknown as { mux_playback_id?: string | null }).mux_playback_id ?? '';
    const move_name = (clip as unknown as { move_name?: string | null }).move_name ?? '';
    const style = (clip as unknown as { style?: string | null }).style ?? '';
    const energy = (clip as unknown as { energy?: string | null }).energy ?? '';

    router.push({
      pathname: '/(app)/session/clip-player',
      params: { clipId: id, mux_playback_id, move_name, style, energy },
    });
  };

  const anyFilter =
    !!debouncedQ.trim() ||
    !!filterStyle ||
    !!filterEnergy ||
    !!filterDifficulty ||
    !!bpmMin.trim() ||
    !!bpmMax.trim();

  return (
    <View style={styles.container}>
      <FlatList
        data={clips}
        keyExtractor={(item) => (item as unknown as { local_id?: string; id: string }).local_id ?? (item as unknown as { id: string }).id}
        contentContainerStyle={clips.length === 0 ? styles.emptyList : styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search clips…"
                placeholderTextColor={theme.textSecondary}
                value={q}
                onChangeText={setQ}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              {STYLES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, filterStyle === option && styles.chipSelected]}
                  onPress={() =>
                    setFilterStyle((prev) => (prev === option ? null : option))
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterStyle === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

              {ENERGY_LEVELS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, filterEnergy === option && styles.chipSelected]}
                  onPress={() =>
                    setFilterEnergy((prev) => (prev === option ? null : option))
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterEnergy === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

              {DIFFICULTY_LEVELS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    filterDifficulty === option && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setFilterDifficulty((prev) => (prev === option ? null : option))
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterDifficulty === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.bpmRow}>
              <Text style={styles.bpmLabel}>BPM:</Text>
              <TextInput
                style={styles.bpmInput}
                placeholder="min"
                placeholderTextColor={theme.textSecondary}
                value={bpmMin}
                onChangeText={setBpmMin}
                keyboardType="numeric"
              />
              <Text style={styles.bpmDash}>–</Text>
              <TextInput
                style={styles.bpmInput}
                placeholder="max"
                placeholderTextColor={theme.textSecondary}
                value={bpmMax}
                onChangeText={setBpmMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.textPrimary} />
            </View>
          ) : anyFilter ? (
            <View style={styles.center}>
              <Text style={styles.icon}>📦</Text>
              <Text style={styles.title}>No clips match your search</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.icon}>📦</Text>
              <Text style={styles.title}>No tagged clips yet</Text>
              <Text style={styles.subtitle}>Start tagging to build your library</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const clipRow = toClipRow(item);
          return (
            <ClipCard
              clip={clipRow}
              onPress={() => openPlayer(item)}
              onLongPress={() => {}}
            />
          );
        }}
        ListFooterComponent={
          nextCursor ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
                onPress={loadMore}
                disabled={loadingMore}
                activeOpacity={0.8}
              >
                {loadingMore ? (
                  <ActivityIndicator color={theme.textPrimary} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
    color: theme.textSecondary,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
  },
  filtersRow: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  chipSelected: {
    backgroundColor: theme.accent,
  },
  chipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: theme.textPrimary,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  bpmLabel: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  bpmInput: {
    width: 80,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textPrimary,
  },
  bpmDash: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadMoreBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  loadMoreBtnDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});

