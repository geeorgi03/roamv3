import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../lib/theme';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import { useClips } from '../../../lib/hooks/useClips';
import { useSession } from '../../../lib/hooks/useSession';
import BottomSheet from '@gorhom/bottom-sheet';
import { ShareSheet } from '../../../components/ShareSheet';
import { CaptureSheet } from '../../../components/CaptureSheet';
import { ClipCard } from '../../../components/ClipCard';
import { TagSheet } from '../../../components/TagSheet';
import { PaywallSheet } from '../../../components/PaywallSheet';
import { AssemblyCanvas } from '../../../components/AssemblyCanvas';
import { saveClip } from '../../../lib/saveClip';
import { storage } from '../../../lib/storage';
import type { ClipRow } from '../../../lib/database';

import { API_BASE } from '../../../lib/api';
const PENDING_CLIP_KEY = 'pending_camera_clip';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useSession();
  const { musicTrack, isAnalysing } = useMusicTrackStatus(id ?? null);
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const tagSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const openPaywall = useCallback(() => {
    paywallSheetRef.current?.snapToIndex(0);
  }, []);
  const { clips, refresh, retryClip } = useClips(id ?? null, openPaywall);
  const [sessionName, setSessionName] = useState('Session');
  const [selectedClip, setSelectedClip] = useState<ClipRow | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'clips' | 'beatGrid' | 'assembly'>('clips');
  const hasMusicTrack = !!musicTrack;

  useEffect(() => {
    if (!hasMusicTrack && activeTab === 'assembly') setActiveTab('clips');
  }, [hasMusicTrack, activeTab]);

  useFocusEffect(
    useCallback(() => {
      const raw = storage?.getString(PENDING_CLIP_KEY);
      if (!raw || !session?.access_token || !id) return;
      const run = async () => {
        try {
          const parsed = JSON.parse(raw) as { sessionId: string; uri: string };
          if (parsed.sessionId !== id) return;
          const result = await saveClip(id, parsed.uri, 'Clip', session.access_token);
          if (result.ok) {
            storage?.delete(PENDING_CLIP_KEY);
            refresh();
          }
        } catch {
          storage?.delete(PENDING_CLIP_KEY);
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
        setActiveTab('beatGrid');
      }
    }
  };

  const openPlayer = (index: number) => {
    router.push({
      pathname: './clip-player',
      params: {
        sessionId: id,
        clipIndex: String(index),
      },
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
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
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

  const isTagged = (c: ClipRow) => {
    const hasText = (v: string | null) => typeof v === 'string' && v.trim().length > 0;
    return (
      hasText(c.move_name) ||
      hasText(c.style) ||
      hasText(c.energy) ||
      hasText(c.difficulty) ||
      c.bpm != null ||
      hasText(c.notes)
    );
  };
  const untaggedClipCount = clips.filter((c) => !isTagged(c)).length;
  const canOpenBeatGrid =
    !!musicTrack &&
    musicTrack.source_type === 'upload' &&
    musicTrack.analysis_status === 'complete' &&
    !!musicTrack.storage_path;

  useEffect(() => {
    if (!id || !session?.access_token) return;
    const withServerId = clips.filter((c) => c.server_id);
    if (withServerId.length === 0) {
      setCommentCounts({});
      return;
    }
    let mounted = true;
    (async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        withServerId.map(async (c) => {
          if (!c.server_id) return;
          try {
            const res = await fetch(`${API_BASE}/clips/${c.server_id}/comments`, {
              headers: { Authorization: `Bearer ${session!.access_token}` },
            });
            if (mounted && res.ok) {
              const data = await res.json();
              counts[c.server_id!] = Array.isArray(data) ? data.length : 0;
            }
          } catch {
            // ignore
          }
        })
      );
      if (mounted) setCommentCounts((prev) => ({ ...prev, ...counts }));
    })();
    return () => {
      mounted = false;
    };
  }, [id, session?.access_token, clips]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clips' && styles.tabActive]}
          onPress={() => setActiveTab('clips')}
        >
          <Text style={[styles.tabText, activeTab === 'clips' && styles.tabTextActive]}>
            Clips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'beatGrid' && styles.tabActive]}
          onPress={() => setActiveTab('beatGrid')}
        >
          <Text style={[styles.tabText, activeTab === 'beatGrid' && styles.tabTextActive]}>
            Beat Grid
          </Text>
        </TouchableOpacity>
        {hasMusicTrack && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assembly' && styles.tabActive]}
            onPress={() => setActiveTab('assembly')}
          >
            <Text style={[styles.tabText, activeTab === 'assembly' && styles.tabTextActive]}>
              Assembly
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'assembly' ? (
        <AssemblyCanvas sessionId={id ?? ''} />
      ) : activeTab === 'beatGrid' ? (
        <View style={styles.beatGridWrap}>
          <Text style={styles.beatGridTitle}>Beat Grid</Text>
          <Text style={styles.beatGridSub}>
            {canOpenBeatGrid
              ? 'Open the alignment editor for this session’s music.'
              : musicTrack
                ? isAnalysing
                  ? 'Analysing track… You can keep capturing clips while we process it.'
                  : 'Finish music alignment to unlock Beat Grid.'
                : 'Set up music to unlock Beat Grid.'}
          </Text>
          <TouchableOpacity
            style={styles.beatGridBtn}
            onPress={handleMusicPress}
            disabled={!!musicTrack && isAnalysing && !canOpenBeatGrid}
            activeOpacity={0.85}
          >
            <Text style={styles.beatGridBtnText}>
              {canOpenBeatGrid
                ? 'Open Beat Grid'
                : musicTrack
                  ? isAnalysing
                    ? 'Analysing track…'
                    : 'Edit alignment'
                  : 'Set up music'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
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
              commentCount={item.server_id ? commentCounts[item.server_id] : undefined}
            />
          )}
        />
      )}
      {activeTab === 'clips' && (
        <>
          <TouchableOpacity
            style={styles.musicEntry}
            onPress={handleMusicPress}
            activeOpacity={0.8}
          >
            <Text style={styles.musicEntryText}>
              {musicTrack
                ? musicTrack.source_type === 'upload' && isAnalysing
                  ? 'Analysing track…'
                  : 'Edit alignment'
                : 'Set up music'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => captureSheetRef.current?.snapToIndex(0)}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </>
      )}
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
  beatGridWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  beatGridTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  beatGridSub: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  beatGridBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
  },
  beatGridBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.untaggedText,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.textPrimary,
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
