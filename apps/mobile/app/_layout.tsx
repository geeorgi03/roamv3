/**
 * Root layout. Entry: expo-router/entry -> app/_layout.tsx
 * SAFE FIRST FRAME: First paint is a minimal View+Text (no GestureHandlerRootView)
 * so we get a visible screen even if GHR/Reanimated crashes on mount.
 */
import 'react-native-gesture-handler';
import React from 'react';
import { AppState, ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSession } from '../lib/hooks/useSession';
import { theme } from '../lib/theme';
import { getDevBypassAuth } from '../lib/devBypassAuth';

const SPLASH_MAX_VISIBLE_MS = 4_000;
const SAFE_FIRST_FRAME_MS = 500; // show "Roam" briefly so first paint is visible
const INIT_TIMEOUT_MS = 8_000; // after this, force skip auth / show fallback

// --- Instrumentation ---
console.log('[BOOT] 1. app/_layout.tsx loaded');
console.log('[BOOT] 2. env', {
  hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  hasApiUrl: !!process.env.EXPO_PUBLIC_API_URL,
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// --- Error boundary (outermost to catch GHR/Reanimated crashes) ---
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BOOT] RootErrorBoundary caught:', error?.message, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>App error</Text>
          <Text style={errorStyles.message}>{this.state.error.message}</Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={errorStyles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#330000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#ffcccc', marginBottom: 8 },
  message: { fontSize: 14, color: '#ffaaaa', textAlign: 'center', marginBottom: 16 },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

// --- Safe first frame: View + Text only, no GHR, no theme (inline styles) ---
const safeFirstFrameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 24, fontWeight: '700' },
});

function SafeFirstFrame({ children }: { children: React.ReactNode }) {
  const [showRealApp, setShowRealApp] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    console.log('[BOOT] 3. SafeFirstFrame mounted, hiding splash');
    SplashScreen.hideAsync().catch(() => {});

    const minShow = setTimeout(() => {
      if (readyRef.current) return;
      readyRef.current = true;
      console.log('[BOOT] 4. SafeFirstFrame min delay done, showing real app');
      setShowRealApp(true);
    }, SAFE_FIRST_FRAME_MS);

    const guard = setTimeout(() => {
      setInitTimedOut(true);
      console.warn('[BOOT] init timeout reached');
    }, INIT_TIMEOUT_MS);

    return () => {
      clearTimeout(minShow);
      clearTimeout(guard);
    };
  }, []);

  // First paint: only this. No GestureHandlerRootView, no session, no router.
  if (!showRealApp) {
    return (
      <View style={safeFirstFrameStyles.container}>
        <Text style={safeFirstFrameStyles.text}>Roam</Text>
        {initTimedOut && (
          <TouchableOpacity
            style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#333' }}
            onPress={() => {
              readyRef.current = true;
              setShowRealApp(true);
            }}
          >
            <Text style={{ color: '#fff' }}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

// --- Main app tree (GestureHandlerRootView + session + router) ---
function RootNavigator() {
  const { session, loading, error } = useSession();
  const pathname = usePathname();
  const [ignoreSessionError, setIgnoreSessionError] = useState(false);
  const [skipToAuth, setSkipToAuth] = useState(false);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const devBypass = getDevBypassAuth();
  const uploadQueueRef = useRef<{ onAppForeground: () => void } | null>(null);
  const splashHiddenRef = useRef(false);

  useEffect(() => {
    console.log('[BOOT] 5. RootNavigator mounted');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (splashHiddenRef.current) return;
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_MAX_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading && !skipToAuth) {
        console.warn('[BOOT] boot hung >5s (session still loading)');
      }
    }, 5_000);
    return () => clearTimeout(t);
  }, [loading, skipToAuth]);

  const readyToHide = !loading || error != null || skipToAuth;
  useEffect(() => {
    if (!readyToHide || splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, [readyToHide]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkipOption(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('../services/uploadQueue')
      .then(({ uploadQueue }) => {
        if (!cancelled) uploadQueueRef.current = uploadQueue;
      })
      .catch((err) => {
        if (__DEV__) console.warn('[RootLayout] uploadQueue load failed:', err);
      });
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') uploadQueueRef.current?.onAppForeground();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  if (loading && !skipToAuth) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        {showSkipOption && (
          <TouchableOpacity style={styles.continueButton} onPress={() => setSkipToAuth(true)}>
            <Text style={styles.continueButtonText}>Get started</Text>
          </TouchableOpacity>
        )}
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
        {(isTimeout || isConfigError) && (
          <TouchableOpacity style={styles.continueButton} onPress={() => setIgnoreSessionError(true)}>
            <Text style={styles.continueButtonText}>Continue anyway</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!session && !skipToAuth && !devBypass) {
    if (pathname && !pathname.startsWith('/auth')) {
      return <Redirect href="/auth/sign-up" />;
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

function AppTree() {
  return (
    <SafeFirstFrame>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeFirstFrame>
  );
}

export default function RootLayout() {
  console.log('[BOOT] 0. RootLayout render');
  return (
    <RootErrorBoundary>
      <AppTree />
    </RootErrorBoundary>
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
