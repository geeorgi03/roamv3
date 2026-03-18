import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { API_BASE } from '../lib/api';
import { saveClip, saveInboxClip } from '../lib/saveClip';
import type { Session as SessionType } from '@roam/types';

type Mode = 'saved' | 'new-session' | 'picker';

export interface QuickSaveSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  videoUri: string | null;
  sessionId?: string | null;
  sectionName?: string | null;
  onDone: (next?: { navigateTo?: string }) => void;
}

async function parseJsonSafe(res: Response): Promise<{ parsed: unknown; raw: string }> {
  const raw = await res.text();
  if (!raw) return { parsed: null, raw: '' };
  try {
    return { parsed: JSON.parse(raw), raw };
  } catch {
    return { parsed: null, raw };
  }
}

export function QuickSaveSheet({
  bottomSheetRef,
  videoUri,
  sessionId,
  sectionName,
  onDone,
}: QuickSaveSheetProps) {
  const snapPoints = useMemo(() => ['55%'], []);
  const { session } = useSession();
  const [mode, setMode] = useState<Mode>('saved');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [name, setName] = useState('');
  const didLoadSessionsRef = useRef(false);

  const loadSessions = useCallback(async () => {
    if (!session?.access_token) return;
    if (didLoadSessionsRef.current) return;
    didLoadSessionsRef.current = true;
    try {
      let res = await fetch(`${API_BASE}/sessions/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/sessions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      if (!res.ok) return;
      const body = (await res.json()) as { sessions: SessionType[] };
      setSessions(Array.isArray(body.sessions) ? body.sessions : []);
    } catch {
      // ignore
    }
  }, [session?.access_token]);

  const saveToSession = useCallback(async (targetSessionId: string) => {
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      const r = await saveClip(targetSessionId, videoUri, 'Clip', session.access_token);
      if (!r.ok) {
        Toast.show({ type: 'error', text1: 'Could not save clip' });
        return false;
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      bottomSheetRef.current?.close();
      onDone({ navigateTo: `/session/${targetSessionId}` });
      return true;
    } finally {
      setLoading(false);
    }
  }, [videoUri, session?.access_token, bottomSheetRef, onDone]);

  const saveToSectionSession = useCallback(async () => {
    if (!sessionId) return false;
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      // Pass sectionName so the upload queue creates a section_clips entry
      // once the server clip_id is confirmed.
      const r = await saveClip(
        sessionId,
        videoUri,
        'Clip',
        session.access_token,
        sectionName ?? undefined
      );
      if (!r.ok) {
        Toast.show({ type: 'error', text1: 'Could not save clip' });
        return false;
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      bottomSheetRef.current?.close();
      onDone();
      return true;
    } finally {
      setLoading(false);
    }
  }, [sessionId, sectionName, videoUri, session?.access_token, bottomSheetRef, onDone]);

  const saveLater = useCallback(async () => {
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      const r = await saveInboxClip(videoUri, 'Clip', session.access_token);
      if (!r.ok) {
        if (r.reason === 'plan_limit_reached') {
          Toast.show({ type: 'error', text1: 'Upload limit reached' });
        } else {
          Toast.show({ type: 'error', text1: 'Could not save to Inbox', text2: r.message });
        }
        return false;
      }
      Toast.show({ type: 'success', text1: 'Saved to Inbox' });
      bottomSheetRef.current?.close();
      onDone({ navigateTo: '/inbox' });
      return true;
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not save to Inbox' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [videoUri, session?.access_token, bottomSheetRef, onDone]);

  const createSession = useCallback(async () => {
    if (!session?.access_token) return null;
    setLoading(true);
    try {
      const trimmed = name.trim() || new Date().toLocaleDateString();
      let res = await fetch(`${API_BASE}/sessions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: trimmed }),
        });
      }
      const { parsed } = await parseJsonSafe(res);
      if (!res.ok) return null;
      return parsed as SessionType;
    } finally {
      setLoading(false);
    }
  }, [name, session?.access_token]);

  const primaryExistingLabel =
    sessionId && sectionName ? `Save to ${sectionName}` : 'Existing →';

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
      onChange={(idx) => {
        if (idx >= 0) loadSessions().catch(() => {});
      }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Saved</Text>

        {mode === 'saved' ? (
          <>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={saveLater}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.textPrimary} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>Later</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setMode('new-session')}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>+ New session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                if (sessionId && sectionName) {
                  void saveToSectionSession();
                  return;
                }
                setMode('picker');
              }}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>{primaryExistingLabel}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {mode === 'new-session' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Session name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={async () => {
                const s = await createSession();
                if (!s?.id) {
                  Toast.show({ type: 'error', text1: 'Could not create session' });
                  return;
                }
                await saveToSession(s.id);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0b0b0f" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Create & save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('saved')} disabled={loading}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {mode === 'picker' ? (
          <>
            <Text style={styles.subTitle}>Choose a session</Text>
            <View style={styles.list}>
              {sessions.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionRow}
                  onPress={() => saveToSession(s.id)}
                  disabled={loading}
                >
                  <Text style={styles.sessionText} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={styles.chev}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('saved')} disabled={loading}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.background },
  handle: { backgroundColor: theme.textSecondary },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { color: theme.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subTitle: { color: theme.textSecondary, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: theme.textPrimary,
  },
  primaryBtn: {
    backgroundColor: '#C8F135',
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkText: { color: '#4ECDC4', fontWeight: '800' },
  list: { gap: 10 },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    backgroundColor: '#222',
  },
  sessionText: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 10 },
  chev: { color: theme.textSecondary, fontSize: 18 },
});

