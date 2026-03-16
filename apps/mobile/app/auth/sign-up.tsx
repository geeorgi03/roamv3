import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { useSupabaseSafe } from '../../lib/hooks/useSupabaseSafe';
import { theme } from '../../lib/theme';
import { setDevBypassAuth } from '../../lib/devBypassAuth';

export default function SignUpScreen() {
  const { supabase, error: configError, loading: configLoading } = useSupabaseSafe();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const redirectTo = makeRedirectUri({ path: 'auth/callback' });
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setMessage('Check your email to confirm your account.');
  }

  if (configLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
        </View>
      </View>
    );
  }

  if (configError || !supabase) {
    const isConfig = configError?.message?.includes('EXPO_PUBLIC_');
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>Roam</Text>
          <Text style={[styles.error, { marginBottom: 24 }]}>
            {isConfig
              ? 'Sign-up is not configured for this build. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables, then create a new build.'
              : configError?.message ?? 'Something went wrong.'}
          </Text>
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.linkText}>Back to sign in</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.link, { marginTop: 16 }]}
              onPress={() => {
                setDevBypassAuth(true);
                router.replace('/(app)');
              }}
            >
              <Text style={[styles.linkText, { color: theme.brandGreen }]}>Open app (dev only)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.brandTitle}>Roam</Text>
        <Text style={styles.tagline}>Capture-first choreography tool</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading || !supabase}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create account'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.link, { marginTop: 8 }]}
            onPress={() => {
              setDevBypassAuth(true);
              router.replace('/(app)');
            }}
          >
            <Text style={[styles.linkText, { color: theme.brandGreen }]}>Open app (dev only)</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.brandGreen,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: theme.borderRadius,
    padding: 16,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 20,
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 16,
  },
  message: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: theme.brandGreen,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
