import { AppState, ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSession } from '../lib/hooks/useSession';
import { theme } from '../lib/theme';

export default function RootLayout() {
  const { session, loading, error } = useSession();
  const pathname = usePathname();
  const [ignoreSessionError, setIgnoreSessionError] = useState(false);
  const uploadQueueRef = useRef<{ onAppForeground: () => void } | null>(null);

  useEffect(() => {
    // Defer loading uploadQueue so expo-sqlite and MMKV don't run at app startup
    // (can cause native crash on some devices before first paint)
    let cancelled = false;
    import('../services/uploadQueue')
      .then(({ uploadQueue }) => {
        if (!cancelled) uploadQueueRef.current = uploadQueue;
      })
      .catch((err) => {
        if (__DEV__) {
          console.warn('[RootLayout] uploadQueue failed to load:', err);
        }
      });
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') uploadQueueRef.current?.onAppForeground();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
      </View>
    );
  }

  if (error && !ignoreSessionError) {
    const isConfigError =
      error.message.includes('EXPO_PUBLIC_SUPABASE_URL') ||
      error.message.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    const isTimeout = error.message.includes('Loading timed out');
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        {isConfigError && (
          <Text style={styles.errorHint}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables for your build profile.
          </Text>
        )}
        {isTimeout && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setIgnoreSessionError(true)}
          >
            <Text style={styles.continueButtonText}>Continue anyway</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!session) {
    if (pathname && !pathname.startsWith('/auth')) {
      return <Redirect href="/auth/sign-in" />;
    }
    return (
      <>
        <Stack />
        <Toast />
      </>
    );
  }

  if (pathname?.startsWith('/auth')) {
    return <Redirect href="/(app)" />;
  }

  return (
    <>
      <Stack />
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    maxWidth: 320,
  },
  continueButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#333',
    borderRadius: theme.borderRadius,
  },
  continueButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
