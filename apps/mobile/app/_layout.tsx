import { AppState, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSession } from '../lib/hooks/useSession';
import { theme } from '../lib/theme';
import { uploadQueue } from '../services/uploadQueue';

export default function RootLayout() {
  const { session, loading } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') uploadQueue.onAppForeground();
    });
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
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
});
