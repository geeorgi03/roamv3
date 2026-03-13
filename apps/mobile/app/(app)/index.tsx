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

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session } = useSession();
  const createSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => createSheetRef.current?.snapToIndex(0)}
        >
          <Text style={styles.headerButtonText}>+</Text>
        </TouchableOpacity>
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
                <Text style={styles.subtitle}>Loading sessions…</Text>
              </>
            ) : (
              <>
                <Text style={styles.icon}>📋</Text>
                <Text style={styles.title}>No sessions yet</Text>
                <Text style={styles.subtitle}>Start a session to record and organize your choreography.</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => createSheetRef.current?.snapToIndex(0)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Start your first session</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
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
        />
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
  primaryButton: {
    backgroundColor: '#2a7c6f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
});
