import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { useShare } from '../lib/hooks/useShare';

export interface ShareSheetProps {
  sessionId: string;
  sessionName: string;
  hasMusic: boolean;
  untaggedClipCount: number;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function ShareSheet({
  sessionId,
  sessionName,
  hasMusic,
  untaggedClipCount,
  bottomSheetRef,
}: ShareSheetProps) {
  const { shareUrl, share, revoke, isShared, loading, error } = useShare(sessionId);
  const [revoked, setRevoked] = React.useState(false);

  const handleGenerate = async () => {
    const url = await share();
    if (url) {
      setRevoked(false);
      Toast.show({ type: 'success', text1: 'Link created' });
    }
  };

  const handleCopyLink = async () => {
    const url = shareUrl ?? (await share());
    if (url) {
      setRevoked(false);
      await Clipboard.setStringAsync(url);
      Toast.show({ type: 'success', text1: 'Copied!' });
    }
  };

  const handleShareVia = async () => {
    const url = shareUrl ?? (await share());
    if (!url) return;
    setRevoked(false);
    try {
      await Share.share({
        message: url,
        url,
        title: sessionName,
      });
    } catch {
      // User cancelled or share not available
    }
  };

  const handleRevoke = async () => {
    const ok = await revoke();
    if (ok) {
      setRevoked(true);
      Toast.show({ type: 'success', text1: 'Link revoked' });
      return;
    }
    setRevoked(false);
    Toast.show({ type: 'error', text1: 'Failed to revoke link' });
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={['40%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.sessionName}>{sessionName}</Text>

        {!hasMusic && (
          <View style={[styles.notice, styles.untaggedNotice]}>
            <Text style={styles.untaggedText}>No music added yet</Text>
          </View>
        )}
        {untaggedClipCount > 0 && (
          <View style={[styles.notice, styles.untaggedNotice]}>
            <Text style={styles.untaggedText}>
              {untaggedClipCount} clips have no tags yet
            </Text>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isShared ? (
          <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.textPrimary} size="small" />
            ) : (
              <Text style={styles.buttonText}>Generate link</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonShared]}
              onPress={handleCopyLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.textPrimary} size="small" />
              ) : (
                <Text style={styles.buttonText}>🔗 Copy link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonShared]}
              onPress={handleShareVia}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Share via…</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.revokeButton]}
              onPress={handleRevoke}
              disabled={loading}
            >
              <Text style={styles.revokeButtonText}>Revoke link</Text>
            </TouchableOpacity>

            <Text style={styles.sharedHint}>🔗 Link active</Text>
          </>
        )}

        {revoked && !isShared ? <Text style={styles.revokedHint}>Link revoked</Text> : null}
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
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  notice: {
    padding: 10,
    borderRadius: theme.borderRadius,
    marginBottom: 8,
  },
  untaggedNotice: {
    backgroundColor: theme.untaggedBg,
  },
  untaggedText: {
    color: theme.untaggedText,
    fontSize: 14,
  },
  errorText: {
    color: '#e57373',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  buttonShared: {
    borderColor: theme.untaggedText,
  },
  buttonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sharedHint: {
    marginTop: 8,
    color: theme.untaggedText,
    fontSize: 12,
  },
  revokedHint: {
    marginTop: 8,
    color: theme.textSecondary,
    fontSize: 12,
  },
  revokeButton: {
    backgroundColor: 'transparent',
    borderColor: '#e57373',
  },
  revokeButtonText: {
    color: '#e57373',
    fontSize: 16,
    fontWeight: '600',
  },
});
