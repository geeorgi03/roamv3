/**
 * Auth callback screen — handles deep link from email confirmation.
 * When user clicks the confirmation link, Supabase redirects to roam://auth/callback#access_token=...
 * The root layout's Linking listener processes the URL; this screen is a fallback that shows
 * "Email confirmed" and redirects if the user lands here.
 */
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSupabaseSafe } from '../../lib/hooks/useSupabaseSafe';
import { createSessionFromUrl } from '../../lib/authRedirect';
import { theme } from '../../lib/theme';

export default function AuthCallbackScreen() {
  const { supabase } = useSupabaseSafe();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    const subscription = Linking.addEventListener('url', async (event) => {
      if (!mounted) return;
      const url = event.url;
      if (!url.includes('auth/callback') || !supabase) return;
      const ok = await createSessionFromUrl(url, supabase);
      if (!mounted) return;
      if (ok) {
        setStatus('success');
        router.replace('/(app)');
      } else {
        setStatus('error');
      }
    });

    (async () => {
      const url = await Linking.getInitialURL();
      if (!url || !supabase) {
        if (mounted) setStatus('error');
        return;
      }
      const ok = await createSessionFromUrl(url, supabase);
      if (!mounted) return;
      if (ok) {
        setStatus('success');
        router.replace('/(app)');
      } else {
        setStatus('error');
      }
    })();

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [supabase]);

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Email confirmed!</Text>
        <Text style={styles.subtext}>Taking you to the app…</Text>
        <ActivityIndicator size="large" color={theme.textPrimary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Something went wrong</Text>
        <Text style={styles.subtext}>Please try signing in again.</Text>
        <Text
          style={[styles.subtext, { marginTop: 24, color: theme.textPrimary }]}
          onPress={() => router.replace('/auth/sign-in')}
        >
          Back to sign in
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.textPrimary} />
      <Text style={[styles.subtext, { marginTop: 16 }]}>Confirming your email…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
