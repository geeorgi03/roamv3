import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../lib/theme';
import type { ClipRow } from '../lib/database';

export interface ClipCardProps {
  clip: ClipRow;
  onPress: () => void;
  onLongPress: () => void;
  onRetry?: () => void;
  commentCount?: number;
}

export function ClipCard({ clip, onPress, onLongPress, onRetry, commentCount }: ClipCardProps) {
  const showThumbnail =
    clip.mux_playback_id && clip.upload_status === 'ready';
  const timeStr = clip.recorded_at
    ? new Date(clip.recorded_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const hasText = (v: string | null) => typeof v === 'string' && v.trim().length > 0;
  const tagged =
    hasText(clip.move_name) ||
    hasText(clip.style) ||
    hasText(clip.energy) ||
    hasText(clip.difficulty) ||
    clip.bpm != null ||
    hasText(clip.notes);
  const untagged = !tagged;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.thumbWrap}>
        {showThumbnail ? (
          <Image
            source={{
              uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
            }}
            style={styles.thumb}
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>▶</Text>
          </View>
        )}
      </View>
      <View style={styles.main}>
        <Text style={styles.label} numberOfLines={1}>
          {clip.label ?? 'Clip'}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.timestamp}>{timeStr}</Text>
          {clip.upload_status === 'local' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>local</Text>
            </View>
          )}
          {clip.upload_status === 'queued' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>queued</Text>
            </View>
          )}
          {clip.upload_status === 'uploading' && (
            <View style={styles.pillRow}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
              <Text style={styles.pillText}>{clip.upload_progress}%</Text>
            </View>
          )}
          {clip.upload_status === 'processing' && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>processing…</Text>
            </View>
          )}
          {clip.upload_status === 'failed' && (
            <TouchableOpacity
              style={[styles.pill, styles.pillRetry]}
              onPress={onRetry}
            >
              <Text style={styles.pillTextRetry}>⚠ retry</Text>
            </TouchableOpacity>
          )}
          {untagged && (
            <View style={[styles.pill, styles.pillUntagged]}>
              <Text style={styles.pillUntaggedText}>untagged</Text>
            </View>
          )}
          {commentCount != null && commentCount > 0 && (
            <View style={[styles.pill, styles.pillComment]}>
              <Text style={styles.pillCommentText}>💬 {commentCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbIcon: {
    color: theme.textSecondary,
    fontSize: 20,
  },
  main: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  pillText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  pillRetry: {
    backgroundColor: 'transparent',
  },
  pillTextRetry: {
    fontSize: 12,
    color: '#e57373',
  },
  pillUntagged: {
    backgroundColor: theme.untaggedBg,
  },
  pillUntaggedText: {
    fontSize: 12,
    color: theme.untaggedText,
  },
  pillComment: {
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
  },
  pillCommentText: {
    fontSize: 12,
    color: '#b8860b',
  },
});
