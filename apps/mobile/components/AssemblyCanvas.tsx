import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { useMusicTrackStatus } from '../lib/hooks/useMusicTrackStatus';
import { useClips } from '../lib/hooks/useClips';
import type { SectionClip, SectionEntry } from '@roam/types';
import type { ClipRow } from '../lib/database';
import { API_BASE } from '../lib/api';

type Assignment = {
  section_label: string;
  section_start_ms: number;
  clip_id: string;
  position: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_WIDTH = SCREEN_WIDTH * 0.55;
const RIGHT_WIDTH = SCREEN_WIDTH * 0.45;

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export interface AssemblyCanvasProps {
  sessionId: string;
}

export function AssemblyCanvas({ sessionId }: AssemblyCanvasProps) {
  const { session } = useSession();
  const { musicTrack } = useMusicTrackStatus(sessionId);
  const { clips } = useClips(sessionId, undefined);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sections = (musicTrack?.sections ?? []) as SectionEntry[];

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/assembly`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (mounted && res.ok) {
          const data = (await res.json()) as SectionClip[];
          setAssignments(
            data.map((a) => ({
              section_label: a.section_label,
              section_start_ms: a.section_start_ms,
              clip_id: a.clip_id,
              position: a.position,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId, session?.access_token]);

  const persistAssignments = useCallback(
    async (next: Assignment[]) => {
      if (!sessionId || !session?.access_token) return;
      try {
        setSaveError(null);
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/assembly`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ assignments: next }),
        });
        if (!res.ok) {
          setSaveError('Could not save assembly changes. Please try again.');
          return;
        }

        // Prefer canonical server output (ordering/validation) when available.
        try {
          const data = (await res.json()) as SectionClip[];
          setAssignments(
            data.map((a) => ({
              section_label: a.section_label,
              section_start_ms: a.section_start_ms,
              clip_id: a.clip_id,
              position: a.position,
            }))
          );
        } catch {
          // If server returns no body, fall back to the requested next state.
          setAssignments(next);
        }
      } catch {
        setSaveError('Could not save assembly changes. Please check your connection and try again.');
      }
    },
    [sessionId, session?.access_token]
  );

  const getClipsForSection = useCallback(
    (section: SectionEntry): ClipRow[] => {
      return assignments
        .filter(
          (a) =>
            a.section_label === section.label && a.section_start_ms === section.start_ms
        )
        .sort((a, b) => a.position - b.position)
        .map((a) => clips.find((c) => c.server_id === a.clip_id))
        .filter((c): c is ClipRow => !!c);
    },
    [assignments, clips]
  );

  const handleAddClip = useCallback(
    (clipId: string) => {
      if (!selectedSection) return;
      if (assignments.some((a) => a.clip_id === clipId)) return;
      const existing = assignments.filter(
        (a) =>
          a.section_label === selectedSection.label &&
          a.section_start_ms === selectedSection.start_ms
      );
      const maxPos = existing.length > 0 ? Math.max(...existing.map((a) => a.position)) : -1;
      const next: Assignment[] = [
        ...assignments,
        {
          section_label: selectedSection.label,
          section_start_ms: selectedSection.start_ms,
          clip_id: clipId,
          position: maxPos + 1,
        },
      ];
      persistAssignments(next);
    },
    [selectedSection, assignments, persistAssignments]
  );

  const handleRemoveClip = useCallback(
    (section: SectionEntry, clipId: string) => {
      const next = assignments.filter(
        (a) =>
          !(
            a.section_label === section.label &&
            a.section_start_ms === section.start_ms &&
            a.clip_id === clipId
          )
      );
      persistAssignments(next);
    },
    [assignments, persistAssignments]
  );

  const handleReorder = useCallback(
    (section: SectionEntry, orderedClipIds: string[]) => {
      const other = assignments.filter(
        (a) =>
          !(
            a.section_label === section.label &&
            a.section_start_ms === section.start_ms
          )
      );
      const reordered: Assignment[] = orderedClipIds.map((clip_id, position) => ({
        section_label: section.label,
        section_start_ms: section.start_ms,
        clip_id,
        position,
      }));
      persistAssignments([...other, ...reordered]);
    },
    [assignments, persistAssignments]
  );

  const isAssigned = (clipId: string): boolean =>
    assignments.some((a) => a.clip_id === clipId);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>No music set up</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!!saveError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{saveError}</Text>
        </View>
      )}
      <View style={styles.row}>
        <View style={[styles.panel, { width: LEFT_WIDTH }]}>
          <FlatList
            data={sections}
            keyExtractor={(item) => `${item.label}-${item.start_ms}`}
            renderItem={({ item }) => (
              <SectionSlot
                section={item}
                isSelected={
                  selectedSection?.label === item.label &&
                  selectedSection?.start_ms === item.start_ms
                }
                sectionClips={getClipsForSection(item)}
                onSelect={() => setSelectedSection(item)}
                onRemoveClip={(clipId) => handleRemoveClip(item, clipId)}
                onReorder={(newOrder) =>
                  handleReorder(item, newOrder.map((c) => c.server_id!))
                }
              />
            )}
          />
        </View>
        <ScrollView style={[styles.panel, { width: RIGHT_WIDTH }]}>
          <Text style={styles.panelTitle}>Session Clips</Text>
          <View style={styles.clipGrid}>
            {clips
              .filter((c) => c.server_id && c.upload_status === 'ready')
              .map((clip) => (
                <ClipThumb
                  key={clip.server_id!}
                  clip={clip}
                  assigned={isAssigned(clip.server_id!)}
                  disabled={!selectedSection || isAssigned(clip.server_id!)}
                  onPress={() =>
                    selectedSection && !isAssigned(clip.server_id!) && handleAddClip(clip.server_id!)
                  }
                />
              ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function SectionSlot({
  section,
  isSelected,
  sectionClips,
  onSelect,
  onRemoveClip,
  onReorder,
}: {
  section: SectionEntry;
  isSelected: boolean;
  sectionClips: ClipRow[];
  onSelect: () => void;
  onRemoveClip: (clipId: string) => void;
  onReorder: (newOrder: ClipRow[]) => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <TouchableOpacity
        style={[styles.sectionHeader, isSelected && styles.sectionHeaderSelected]}
        onPress={onSelect}
      >
        <Text style={styles.sectionLabel}>{section.label}</Text>
        <Text style={styles.sectionTime}>{formatMs(section.start_ms)}</Text>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.assignedClips}
        contentContainerStyle={styles.assignedClipsContent}
      >
        {sectionClips.map((clip) => (
          <AssignedClipThumb
            key={clip.server_id ?? clip.local_id}
            clip={clip}
            section={section}
            onRemove={() => onRemoveClip(clip.server_id!)}
            onReorder={onReorder}
            allClips={sectionClips}
          />
        ))}
        {sectionClips.length === 0 && (
          <Text style={styles.emptyHint}>Tap a clip to assign →</Text>
        )}
      </ScrollView>
    </View>
  );
}

function ClipThumb({
  clip,
  assigned,
  disabled,
  onPress,
}: {
  clip: ClipRow;
  assigned: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.clipThumbWrap, disabled && styles.clipThumbDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {clip.mux_playback_id ? (
        <Image
          source={{
            uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
          }}
          style={styles.clipThumbImg}
        />
      ) : (
        <View style={styles.clipThumbPlaceholder} />
      )}
      <Text style={styles.clipThumbLabel} numberOfLines={1}>
        {clip.move_name ?? clip.label ?? 'Clip'}
      </Text>
      {assigned && (
        <View style={styles.clipThumbCheckmark}>
          <Text style={styles.clipThumbCheckmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AssignedClipThumb({
  clip,
  section,
  onRemove,
  onReorder,
  allClips,
}: {
  clip: ClipRow;
  section: SectionEntry;
  onRemove: () => void;
  onReorder: (newOrder: ClipRow[]) => void;
  allClips: ClipRow[];
}) {
  const isLongPress = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
        }, 500);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const dx = gestureState.dx;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        if (dx < -60) {
          onRemove();
        } else if (isLongPress.current && Math.abs(dx) > 40) {
          const idx = allClips.findIndex((c) => c.server_id === clip.server_id);
          if (idx >= 0) {
            const next = [...allClips];
            const targetIdx = dx > 0 ? idx + 1 : idx - 1;
            if (targetIdx >= 0 && targetIdx < next.length) {
              [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
              onReorder(next);
            }
          }
        }
        isLongPress.current = false;
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        isLongPress.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.assignedThumbWrap} {...panResponder.panHandlers}>
      {clip.mux_playback_id ? (
        <Image
          source={{
            uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
          }}
          style={styles.assignedThumbImg}
        />
      ) : (
        <View style={styles.assignedThumbPlaceholder} />
      )}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.removeBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: 'rgba(255, 90, 90, 0.12)',
  },
  errorBannerText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  panel: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#222',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  sectionRow: {
    marginBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#222',
    marginBottom: 8,
  },
  sectionHeaderSelected: {
    backgroundColor: theme.untaggedBg,
    borderWidth: 1,
    borderColor: theme.untaggedText,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  sectionTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  assignedClips: {
    maxHeight: 80,
  },
  assignedClipsContent: {
    gap: 8,
    paddingRight: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: theme.textSecondary,
    alignSelf: 'center',
  },
  assignedThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  assignedThumbImg: {
    width: 64,
    height: 64,
  },
  assignedThumbPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#222',
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clipThumbWrap: {
    width: (RIGHT_WIDTH - 24 - 16) / 2,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
    position: 'relative',
  },
  clipThumbDisabled: {
    opacity: 0.6,
  },
  clipThumbImg: {
    width: '100%',
    height: '100%',
  },
  clipThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  clipThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  clipThumbCheckmark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipThumbCheckmarkText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
});
