import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { updateClipTags } from '../lib/database';
import type { ClipRow } from '../lib/database';
import type { ClipTagHistory } from '@roam/types';
import { API_BASE } from '../lib/api';

const TAG_FIELDS = ['move_name', 'style', 'energy', 'difficulty', 'bpm', 'notes'] as const;
type TagField = (typeof TAG_FIELDS)[number];

const FIELD_LABELS: Record<TagField, string> = {
  move_name: 'Move name',
  style: 'Style',
  energy: 'Energy',
  difficulty: 'Difficulty',
  bpm: 'BPM',
  notes: 'Notes',
};

export interface TagHistorySheetProps {
  clip: ClipRow | null;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onRestored: (updatedClip: ClipRow) => void;
}

function formatSavedAt(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const dateStr = d.toDateString();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${mins}`;
  if (dateStr === today) return `Today, ${time}`;
  if (dateStr === yesterdayStr) return `Yesterday, ${time}`;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}, ${time}`;
}

function computeDiff(
  current: Record<string, unknown>,
  previous: Record<string, unknown> | null
): {
  changed: Array<{ field: TagField; oldVal: string; newVal: string }>;
  unchangedCount: number;
  isBaseline: boolean;
} {
  const changed: Array<{ field: TagField; oldVal: string; newVal: string }> = [];
  let unchangedCount = 0;
  if (previous === null) {
    return { changed, unchangedCount: 0, isBaseline: true };
  }
  for (const field of TAG_FIELDS) {
    const cur = String(current[field] ?? '—');
    const prev = String(previous[field] ?? '—');
    if (cur !== prev) {
      changed.push({ field, oldVal: prev, newVal: cur });
    } else {
      unchangedCount++;
    }
  }
  return { changed, unchangedCount, isBaseline: false };
}

export function TagHistorySheet({
  clip,
  bottomSheetRef,
  onRestored,
}: TagHistorySheetProps) {
  const { session } = useSession();
  const [entries, setEntries] = useState<ClipTagHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const prevSheetIndexRef = useRef<number>(-1);
  const loadSeqRef = useRef(0);

  const loadHistory = useCallback(async () => {
    if (!clip?.server_id || !session?.access_token) {
      setEntries([]);
      setError(null);
      return;
    }

    const seq = ++loadSeqRef.current;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clips/${clip.server_id}/tag-history`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (seq !== loadSeqRef.current) return;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      setEntries((data as ClipTagHistory[]) ?? []);
    } catch (e) {
      if (seq !== loadSeqRef.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load history');
      setEntries([]);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [clip?.server_id, session?.access_token]);

  useEffect(() => {
    if (clip?.server_id && session?.access_token) return;
    setEntries([]);
    setError(null);
  }, [clip?.server_id, session?.access_token]);

  const handleRestore = async (entry: ClipTagHistory) => {
    if (!clip?.server_id || !session?.access_token) return;
    setRestoringId(entry.id);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/clips/${clip.server_id}/tags`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(entry.snapshot),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      const snapshot = entry.snapshot as Parameters<typeof updateClipTags>[1];
      updateClipTags(clip.local_id, snapshot);
      onRestored({ ...clip, ...snapshot });
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore');
    } finally {
      setRestoringId(null);
    }
  };

  const isRestoring = restoringId !== null;

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={['85%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
      onChange={(index) => {
        const prev = prevSheetIndexRef.current;
        prevSheetIndexRef.current = index;
        const wasClosed = prev < 0;
        const isOpen = index >= 0;
        if (wasClosed && isOpen) {
          void loadHistory();
        }
      }}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tag History</Text>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.textPrimary} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {entries.map((entry, index) => {
              const prevSnapshot =
                index < entries.length - 1
                  ? entries[index + 1].snapshot
                  : null;
              const { changed, unchangedCount, isBaseline } = computeDiff(
                entry.snapshot,
                prevSnapshot
              );
              const isCurrent = index === 0;

              return (
                <View key={entry.id} style={styles.card}>
                  <View style={styles.metaRow}>
                    <Text style={styles.savedAt}>
                      {formatSavedAt(entry.saved_at)}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>

                  {changed.length > 0 && (
                    <View style={styles.diffSection}>
                      {changed.map(({ field, oldVal, newVal }) => (
                        <View key={field} style={styles.diffRow}>
                          <Text style={styles.diffLabel}>
                            {FIELD_LABELS[field]}
                          </Text>
                          <View style={styles.diffValues}>
                            <Text
                              style={[
                                styles.diffOld,
                                oldVal === '—' && styles.diffMuted,
                              ]}
                            >
                              {oldVal}
                            </Text>
                            <Text style={styles.diffArrow}> → </Text>
                            <Text style={styles.diffNew}>{newVal}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {isBaseline && (
                    <Text style={styles.baselineSummary}>
                      Baseline version (first saved tags)
                    </Text>
                  )}

                  {!isBaseline && unchangedCount > 0 && (
                    <Text style={styles.unchangedSummary}>
                      {unchangedCount} field{unchangedCount !== 1 ? 's' : ''}{' '}
                      unchanged
                    </Text>
                  )}

                  {!isCurrent && (
                    <TouchableOpacity
                      style={[
                        styles.restoreBtn,
                        isRestoring && styles.restoreBtnDisabled,
                      ]}
                      onPress={() => handleRestore(entry)}
                      disabled={isRestoring}
                    >
                      {restoringId === entry.id ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.textPrimary}
                        />
                      ) : (
                        <Text style={styles.restoreBtnText}>
                          Restore this version
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.background,
  },
  handle: {
    backgroundColor: theme.textSecondary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e57373',
    fontSize: 14,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#222',
    borderRadius: theme.borderRadius,
    padding: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedAt: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  currentBadge: {
    backgroundColor: theme.textSecondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius,
  },
  currentBadgeText: {
    color: theme.background,
    fontSize: 12,
    fontWeight: '600',
  },
  diffSection: {
    marginBottom: 8,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  diffLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
    minWidth: 80,
  },
  diffValues: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  diffOld: {
    fontSize: 13,
    color: '#ef4444',
    textDecorationLine: 'line-through',
  },
  diffMuted: {
    color: theme.textSecondary,
  },
  diffArrow: {
    fontSize: 13,
    color: theme.textSecondary,
    marginHorizontal: 4,
  },
  diffNew: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '500',
  },
  unchangedSummary: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  baselineSummary: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  restoreBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    alignItems: 'center',
  },
  restoreBtnDisabled: {
    opacity: 0.6,
  },
  restoreBtnText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
