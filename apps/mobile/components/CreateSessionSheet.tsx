import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { API_BASE } from '../lib/api';

const defaultName = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export interface CreateSessionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (session: { id: string; name: string; created_at: string; user_id: string }) => void;
  onPaywallRequired?: () => void;
}

export function CreateSessionSheet({
  bottomSheetRef,
  onCreated,
  onPaywallRequired,
}: CreateSessionSheetProps) {
  const { session } = useSession();
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseJsonSafe = async (res: Response): Promise<{ parsed: unknown; raw: string }> => {
    const raw = await res.text();
    if (!raw) return { parsed: null, raw: '' };
    try {
      return { parsed: JSON.parse(raw), raw };
    } catch {
      return { parsed: null, raw };
    }
  };

  const postCreateSession = async (path: string) => {
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify({ name: name.trim() || defaultName() }),
    });
  };

  const handleCreate = async () => {
    if (!session?.access_token) {
      const msg =
        'Not signed in. Close this sheet, open Profile, sign in again, then try Create again.';
      setError(msg);
      Alert.alert('Can’t create session', msg);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Try with trailing slash first (some proxies require it), then without.
      let res = await postCreateSession('/sessions/');
      if (res.status === 404) {
        res = await postCreateSession('/sessions');
      }
      const { parsed: data, raw } = await parseJsonSafe(res);

      if (res.status === 403 && (data as { error?: string })?.error === 'plan_limit_reached') {
        bottomSheetRef.current?.close();
        onPaywallRequired?.();
        return;
      }
      if (!res.ok) {
        const msg =
          (data as { error?: string })?.error ??
          (raw ? `HTTP ${res.status}: ${raw.slice(0, 200)}` : `HTTP ${res.status} ${res.statusText}`);
        throw new Error(msg || 'Request failed');
      }
      const newSession = data as { id?: string; name?: string; created_at?: string; user_id?: string };
      if (!newSession?.id) {
        throw new Error('Server returned no session id');
      }
      onCreated(newSession as { id: string; name: string; created_at: string; user_id: string });
      bottomSheetRef.current?.close();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create session';
      setError(message);
      Alert.alert('Create session failed', message);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>New session</Text>
        <TextInput
          style={styles.input}
          placeholder="Session name"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.buttonText}>Create</Text>
          )}
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  errorText: {
    color: '#e57373',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
