import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const defaultName = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export interface CreateSessionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
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

  const handleCreate = async () => {
    if (!session?.access_token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: name.trim() || defaultName() }),
      });
      const data = await res.json();
      if (res.status === 403 && (data as { error?: string }).error === 'plan_limit_reached') {
        bottomSheetRef.current?.close();
        onPaywallRequired?.();
        return;
      }
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      const newSession = data as { id: string; name: string; created_at: string; user_id: string };
      onCreated(newSession);
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
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
