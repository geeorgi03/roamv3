import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>
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
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Sign Up'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => router.replace('/auth/sign-in')}
        >
          <Text style={styles.linkText}>Back to sign in</Text>
        </TouchableOpacity>
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
    backgroundColor: theme.accent,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
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
