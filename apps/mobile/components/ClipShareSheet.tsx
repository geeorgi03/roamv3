import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { useClipShare } from '../lib/hooks/useClipShare';

export interface ClipShareSheetProps {
  clipId: string | null;
  clipLabel: string;
  sectionName: string;
  duration: string;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function ClipShareSheet({
  clipId,
  clipLabel,
  sectionName,
  duration,
  bottomSheetRef,
}: ClipShareSheetProps) {
  const snapPoints = useMemo(() => ['45%'], []);
  const { shareUrl, share, revoke, isShared, loading, error } = useClipShare(clipId);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const url = await share();
    if (url) Toast.show({ type: 'success', text1: 'Link created' });
  };

  const handleCopy = async () => {
    const url = shareUrl ?? (await share());
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    Toast.show({ type: 'success', text1: 'Copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleView = async () => {
    const url = shareUrl ?? (await share());
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const handleRevoke = async () => {
    const ok = await revoke();
    if (ok) Toast.show({ type: 'success', text1: 'Link revoked' });
    else Toast.show({ type: 'error', text1: 'Failed to revoke link' });
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{clipLabel || 'Clip'}</Text>
        <Text style={styles.meta}>
          {sectionName} · {duration}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isShared ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0b0b0f" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Generate link</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={2}>
                {shareUrl}
              </Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy} disabled={loading}>
                <Text style={styles.secondaryBtnText}>{copied ? 'Copied ✓' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleView} disabled={loading}>
                <Text style={styles.secondaryBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.revokeBtn} onPress={handleRevoke} disabled={loading}>
              <Text style={styles.revokeBtnText}>Revoke link</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.background },
  handle: { backgroundColor: theme.textSecondary },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { color: theme.textPrimary, fontSize: 18, fontWeight: '800' },
  meta: { color: theme.textSecondary, fontSize: 13, marginBottom: 4 },
  errorText: { color: '#e57373', fontSize: 13 },
  primaryBtn: {
    backgroundColor: '#C8F135',
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
  urlBox: {
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    padding: 12,
  },
  urlText: { color: theme.textPrimary, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  revokeBtn: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e57373',
    marginTop: 4,
  },
  revokeBtnText: { color: '#e57373', fontSize: 15, fontWeight: '800' },
});

