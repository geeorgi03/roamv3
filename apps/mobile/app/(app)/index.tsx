import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { theme } from '../../lib/theme';
import type { Session } from '@roam/types';
import { useSession } from '../../lib/hooks/useSession';
import { CreateSessionSheet } from '../../components/CreateSessionSheet';
import { PaywallSheet } from '../../components/PaywallSheet';
import BottomSheet from '@gorhom/bottom-sheet';

import { API_BASE } from '../../lib/api';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session } = useSession();
  const createSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [inboxCount, setInboxCount] = useState<number>(0);
  // TODO(boot): start false so BottomSheet doesn't mount on first render before Reanimated is ready
  const [sheetsReady, setSheetsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSheetsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const fetchSessions = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      let res = await fetch(`${API_BASE}/sessions/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/sessions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
      }
      clearTimeout(timeoutId);
      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (res.ok && data && typeof data === 'object' && 'sessions' in data) {
        setSessions((data as { sessions: Session[] }).sessions ?? []);
      }
    } catch {
      // API unreachable, timeout, or network error
      setSessions([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session?.access_token]);

  const fetchInboxCount = async () => {
    if (!session?.access_token) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE}/inbox/count`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setInboxCount(typeof data.count === 'number' ? data.count : 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInboxCount();
  }, [session?.access_token, sessions.length]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.headerLeftText}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.headerLeftText}>Profile</Text>
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={async () => {
              try {
                await supabase?.auth.signOut();
              } catch {
                // ignore
              }
            }}
          >
            <Text style={styles.headerButtonText}>⎋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => createSheetRef.current?.snapToIndex(0)}
          >
            <Text style={styles.headerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleCreated = (newSession: Session) => {
    setSessions((prev) => [newSession, ...prev]);
    createSheetRef.current?.close();
    router.push(`/session/${newSession.id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {sessions.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.empty}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={theme.textPrimary} style={{ marginBottom: 12 }} />
                <Text style={styles.subtitle}>Loading…</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>What do you want to do?</Text>
                <View style={styles.twoDoorRow}>
                  <TouchableOpacity
                    style={styles.doorCard}
                    onPress={() => router.push('/session/camera')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doorIcon}>🔴</Text>
                    <Text style={styles.doorTitle}>Record</Text>
                    <Text style={styles.doorSub}>Capture something now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.doorCard}
                    onPress={() => createSheetRef.current?.snapToIndex(0)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doorIcon}>🎵</Text>
                    <Text style={styles.doorTitle}>Start a session</Text>
                    <Text style={styles.doorSub}>I have a song to work with</Text>
                  </TouchableOpacity>
                </View>
                {inboxCount > 0 ? (
                  <TouchableOpacity
                    style={styles.inboxPill}
                    onPress={() => router.push('/inbox')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.inboxPillText}>
                      {inboxCount} unorganised clips →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {inboxCount > 0 ? (
            <TouchableOpacity
              style={styles.inboxBanner}
              onPress={() => router.push('/inbox')}
              activeOpacity={0.85}
            >
              <View style={styles.inboxDot} />
              <Text style={styles.inboxBannerText}>{inboxCount} unorganised clips</Text>
              <Text style={styles.inboxBannerChev}>›</Text>
            </TouchableOpacity>
          ) : null}
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/session/${item.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.newSessionCard}
                onPress={() => createSheetRef.current?.snapToIndex(0)}
                activeOpacity={0.85}
              >
                <Text style={styles.newSessionText}>+ New session</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/session/camera')}
            activeOpacity={0.9}
          >
            <Text style={styles.fabText}>⬤</Text>
          </TouchableOpacity>
        </View>
      )}
      {sheetsReady && (
        <>
          <CreateSessionSheet
            bottomSheetRef={createSheetRef}
            onCreated={handleCreated}
            onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}
          />
          <PaywallSheet bottomSheetRef={paywallSheetRef} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  emptyScroll: {
    flexGrow: 1,
    minHeight: 400,
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  headerLeftText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  twoDoorRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  doorCard: {
    flex: 1,
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    padding: 16,
  },
  doorIcon: { fontSize: 20, marginBottom: 10 },
  doorTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  doorSub: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },
  inboxPill: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
  },
  inboxPillText: { color: theme.textPrimary, fontWeight: '700' },
  inboxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius,
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
  },
  inboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
    marginRight: 10,
  },
  inboxBannerText: { color: theme.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  inboxBannerChev: { color: theme.textSecondary, fontSize: 22, marginLeft: 6 },
  card: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  newSessionCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  newSessionText: { color: theme.textPrimary, fontSize: 15, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C8F135',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#0b0b0f', fontSize: 18, fontWeight: '900' },
});
