import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useLayoutEffect, useRef, useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../lib/theme';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import { useClips } from '../../../lib/hooks/useClips';
import { useSession } from '../../../lib/hooks/useSession';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import { ShareSheet } from '../../../components/ShareSheet';
import { CaptureSheet } from '../../../components/CaptureSheet';
import { ClipCard } from '../../../components/ClipCard';
import { TagSheet } from '../../../components/TagSheet';
import { PaywallSheet } from '../../../components/PaywallSheet';
import { saveClip } from '../../../lib/saveClip';
import { storage } from '../../../lib/storage';
import type { ClipRow } from '../../../lib/database';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const PENDING_CLIP_KEY = 'pending_camera_clip';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useSession();
  const { musicTrack } = useMusicTrackStatus(id ?? null);
  const { clips, refresh, retryClip } = useClips(id ?? null);
  const shareSheetRef = useRef<BottomSheetRef | null>(null);
  const captureSheetRef = useRef<BottomSheetRef | null>(null);
  const tagSheetRef = useRef<BottomSheetRef | null>(null);
  const paywallSheetRef = useRef<BottomSheetRef | null>(null);
  const [sessionName, setSessionName] = useState('Session');
  const [selectedClip, setSelectedClip] = useState<ClipRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      const raw = storage.getString(PENDING_CLIP_KEY);
      if (!raw || !session?.access_token || !id) return;
      const run = async () => {
        try {
          const parsed = JSON.parse(raw) as { sessionId: string; uri: string };
          if (parsed.sessionId !== id) return;
          const result = await saveClip(id, parsed.uri, 'Clip', session.access_token);
          if (result.ok) {
            storage.delete(PENDING_CLIP_KEY);
            refresh();
          }
        } catch {
          // Invalid pending clip data; clear to avoid repeated failures
          storage.delete(PENDING_CLIP_KEY);
        }
      };
      run();
    }, [id, session?.access_token, refresh])
  );

  useLayoutEffect(() => {
    if (id) {
      (async () => {
        if (!session?.access_token) return;
        const res = await fetch(`${API_BASE}/sessions/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const name = (data as { session?: { name?: string } }).session?.name;
          if (name) setSessionName(name);
        }
      })();
    }
  }, [id, session?.access_token]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => shareSheetRef.current?.snapToIndex(0)}
        >
          <Text style={styles.headerButtonText}>⎘</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleMusicPress = () => {
    if (!id) return;
    if (!musicTrack) {
      router.push({ pathname: './music-setup', params: { id } });
      return;
    }
    if (musicTrack.source_type === 'youtube') {
      router.push({
        pathname: './youtube-player',
        params: { sessionId: id, musicTrackId: musicTrack.id },
      });
      return;
    }
    if (musicTrack.source_type === 'upload') {
      if (musicTrack.analysis_status === 'complete' && musicTrack.storage_path) {
        router.push({
          pathname: './beat-grid',
          params: { sessionId: id, musicTrackJson: JSON.stringify(musicTrack) },
        });
      } else {
        router.push({ pathname: './music-setup', params: { id } });
      }
    }
  };

  const openPlayer = (index: number) => {
    router.push({
      pathname: './clip-player',
      params: { sessionId: id, clipIndex: String(index) },
    });
  };

  const openTagSheet = (clip: ClipRow) => {
    setSelectedClip(clip);
    tagSheetRef.current?.snapToIndex(0);
  };

  const handleTagSaved = (updatedClip: ClipRow) => {
    setSelectedClip(updatedClip);
    refresh();
  };

  const handleRecord = () => {
    if (id) router.push({ pathname: './camera', params: { id } });
  };

  const handleGallery = async () => {
    if (!id || !session?.access_token) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (result.canceled || !result.assets.length) return;
    const start = clips.length;
    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      const saveResult = await saveClip(id, asset.uri, `Clip ${start + i + 1}`, session.access_token);
      if (saveResult.ok === false) break;
    }
    refresh();
  };

  const untaggedClipCount = clips.filter((c) => !c.move_name && !c.style).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={clips}
        keyExtractor={(item) => item.local_id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.placeholderText}>No clips yet — tap + to record</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ClipCard
            clip={item}
            onPress={() => openPlayer(index)}
            onLongPress={() => openTagSheet(item)}
            onRetry={() => retryClip(item.local_id)}
          />
        )}
      />
      <TouchableOpacity
        style={styles.musicEntry}
        onPress={handleMusicPress}
        activeOpacity={0.8}
      >
        <Text style={styles.musicEntryText}>
          {musicTrack ? 'Edit alignment' : 'Set up music'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => captureSheetRef.current?.snapToIndex(0)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      <ShareSheet
        sessionId={id ?? ''}
        sessionName={sessionName}
        hasMusic={!!musicTrack}
        untaggedClipCount={untaggedClipCount}
        bottomSheetRef={shareSheetRef}
      />
      <CaptureSheet
        bottomSheetRef={captureSheetRef}
        onRecord={handleRecord}
        onGallery={handleGallery}
      />
      <TagSheet
        clip={selectedClip}
        bottomSheetRef={tagSheetRef}
        onSaved={handleTagSaved}
        musicTrackBpm={musicTrack?.bpm ?? null}
      />
      <PaywallSheet bottomSheetRef={paywallSheetRef} onDismiss={refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  musicEntry: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
  },
  musicEntryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  fabIcon: {
    fontSize: 28,
    color: theme.textPrimary,
    fontWeight: '300',
  },
});
