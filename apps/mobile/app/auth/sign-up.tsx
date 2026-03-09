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
    const { error: e } = await supabase.auth.signUp({ email, password });
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
          <Text style={styles.title}>Sign Up</Text>
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
              <Text style={[styles.linkText, { color: '#2a7c6f' }]}>Open app (dev only)</Text>
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Sign up to start recording and organizing your choreography.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
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
          <Text style={styles.linkText}>Back to sign in</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.link, { marginTop: 8 }]}
            onPress={() => {
              setDevBypassAuth(true);
              router.replace('/(app)');
            }}
          >
            <Text style={[styles.linkText, { color: '#2a7c6f' }]}>Open app (dev only)</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: theme.borderRadius,
    padding: 16,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 16,
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
    backgroundColor: '#2a7c6f',
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.textPrimary,
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
