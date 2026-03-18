import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { API_BASE } from '../lib/api';
import { supabase } from '../lib/supabase';

export type SessionListItem = { id: string; name: string; created_at: string; user_id: string };

export interface AssignPickerSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onPick: (session: SessionListItem) => Promise<boolean> | boolean;
  onCreateNewSession?: () => void;
  title?: string;
}

async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function AssignPickerSheet({
  bottomSheetRef,
  onPick,
  onCreateNewSession,
  title = 'Add to session',
}: AssignPickerSheetProps) {
  const snapPoints = useMemo(() => ['55%'], []);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setSessions([]);
        return;
      }
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setSessions([]);
        return;
      }
      const body = (await res.json()) as { sessions: SessionListItem[] };
      setSessions(Array.isArray(body.sessions) ? body.sessions : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ref = bottomSheetRef.current;
    if (!ref) return;
    load().catch(() => {});
  }, [bottomSheetRef, load]);

  const handlePick = async (s: SessionListItem) => {
    setPickingId(s.id);
    try {
      const ok = await onPick(s);
      if (ok) bottomSheetRef.current?.close();
      else Toast.show({ type: 'error', text1: 'Could not assign clip' });
    } finally {
      setPickingId(null);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
      onChange={(idx) => {
        if (idx >= 0) load().catch(() => {});
      }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.textPrimary} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Create one to start organising clips.</Text>
            {onCreateNewSession ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  bottomSheetRef.current?.close();
                  onCreateNewSession();
                }}
              >
                <Text style={styles.primaryBtnText}>+ Create one</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.row}
                onPress={() => handlePick(s)}
                disabled={pickingId !== null}
              >
                <Text style={styles.rowText} numberOfLines={1}>
                  {s.name}
                </Text>
                {pickingId === s.id ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Text style={styles.chev}>→</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.background },
  handle: { backgroundColor: theme.textSecondary },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },
  center: { paddingVertical: 24, alignItems: 'center' },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    backgroundColor: '#222',
  },
  rowText: { color: theme.textPrimary, fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
  chev: { color: theme.textSecondary, fontSize: 18 },
  empty: { paddingVertical: 20 },
  emptyTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: theme.textSecondary, fontSize: 14, marginBottom: 14 },
  primaryBtn: {
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
});

