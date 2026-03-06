import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect, useRef } from 'react';
import { theme } from '../../../lib/theme';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import { ShareSheet } from '../../../components/ShareSheet';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { musicTrack } = useMusicTrackStatus(id ?? null);
  const shareSheetRef = useRef<BottomSheetRef | null>(null);

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

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session workspace — clips will appear here
        </Text>
      </View>
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
        onPress={() => Alert.alert('Capture coming soon')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      <ShareSheet
        sessionId={id ?? ''}
        sessionName="Session"
        hasMusic={!!musicTrack}
        untaggedClipCount={0}
        bottomSheetRef={shareSheetRef}
      />
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  musicEntry: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    alignSelf: 'center',
    marginBottom: 24,
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
