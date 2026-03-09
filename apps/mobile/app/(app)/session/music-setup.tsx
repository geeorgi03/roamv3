import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import BottomSheet, { type BottomSheetMethods } from '@gorhom/bottom-sheet';
import { theme } from '../../../lib/theme';
import { useSession } from '../../../lib/hooks/useSession';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import { PaywallSheet } from '../../../components/PaywallSheet';
import { useState, useEffect, useRef } from 'react';
import type { MusicTrack } from '@roam/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

export default function MusicSetupScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const { musicTrack, isAnalysing, refetch } = useMusicTrackStatus(sessionId ?? null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAnalysing, setLocalAnalysing] = useState(false);
  const hasNavigatedToBeatGrid = useRef(false);
  const paywallSheetRef = useRef<BottomSheetMethods | null>(null);

  // Clear local analysing when real status is known
  useEffect(() => {
    if (musicTrack?.analysis_status === 'complete' || musicTrack?.analysis_status === 'failed') {
      setLocalAnalysing(false);
    }
  }, [musicTrack?.analysis_status]);

  // When upload analysis completes, go to beat-grid (once)
  useEffect(() => {
    if (
      hasNavigatedToBeatGrid.current ||
      !sessionId ||
      isAnalysing ||
      musicTrack?.analysis_status !== 'complete' ||
      musicTrack?.source_type !== 'upload' ||
      !musicTrack?.storage_path
    )
      return;
    hasNavigatedToBeatGrid.current = true;
    router.replace({
      pathname: './beat-grid',
      params: { sessionId, musicTrackJson: JSON.stringify(musicTrack) },
    });
  }, [sessionId, isAnalysing, musicTrack, router]);

  const handleUpload = async () => {
    if (!sessionId || !session?.access_token) return;
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/aac'],
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'audio/mpeg',
      } as unknown as Blob);
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && (data as { error?: string }).error === 'plan_limit_reached') {
          paywallSheetRef.current?.snapToIndex(0);
          return;
        }
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      setLocalAnalysing(true);
      await refetch();
      // useMusicTrackStatus will update; show analysing banner until complete
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleYoutubeValidate = async () => {
    if (!sessionId || !session?.access_token) return;
    const url = youtubeUrl.trim();
    if (!YOUTUBE_URL_REGEX.test(url)) {
      setError('Please enter a valid YouTube URL (youtube.com/watch or youtu.be/)');
      return;
    }
    setError(null);
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ youtube_url: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && (data as { error?: string }).error === 'plan_limit_reached') {
          paywallSheetRef.current?.snapToIndex(0);
          return;
        }
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      const data = (await res.json()) as { music_track_id: string };
      router.replace({
        pathname: './youtube-player',
        params: { sessionId, musicTrackId: data.music_track_id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Music</Text>

      <View style={styles.cardsRow}>
        <TouchableOpacity
          style={[styles.card, uploading && styles.cardDisabled]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Text style={styles.cardIcon}>📁</Text>
          <Text style={styles.cardTitle}>Upload</Text>
          <Text style={styles.cardSub}>audio file</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🔗</Text>
          <Text style={styles.cardTitle}>YouTube Link</Text>
          <Text style={styles.cardSub} />
        </View>
      </View>

      <View style={styles.youtubeRow}>
        <TextInput
          style={styles.input}
          placeholder="Paste YouTube URL…"
          placeholderTextColor={theme.textSecondary}
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          autoCapitalize="none"
          editable={!uploading}
        />
        <TouchableOpacity
          style={[styles.validateBtn, uploading && styles.buttonDisabled]}
          onPress={handleYoutubeValidate}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Text style={styles.validateBtnText}>Validate</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isAnalysing || localAnalysing ? (
        <View style={styles.analysingOverlay}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
          <Text style={styles.analysingText}>Analysing track…</Text>
        </View>
      ) : null}

      <PaywallSheet bottomSheetRef={paywallSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  youtubeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingHorizontal: 12,
    color: theme.textPrimary,
  },
  validateBtn: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  validateBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 8,
  },
  analysingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textPrimary,
  },
});
