import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { theme } from '../../lib/theme';
import type { Session } from '@roam/types';
import { useSession } from '../../lib/hooks/useSession';
import { CreateSessionSheet } from '../../components/CreateSessionSheet';
import { PaywallSheet } from '../../components/PaywallSheet';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session } = useSession();
  const createSheetRef = useRef<BottomSheetRef | null>(null);
  const paywallSheetRef = useRef<BottomSheetRef | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) setSessions((data as { sessions: Session[] }).sessions ?? []);
    } finally {
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
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sessions.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <TouchableOpacity style={styles.empty} activeOpacity={0.8}>
            <Text style={styles.icon}>📋</Text>
            <Text style={styles.title}>No sessions yet</Text>
            <Text style={styles.subtitle}>Tap + to start your first session</Text>
          </TouchableOpacity>
        }
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
      <CreateSessionSheet
        bottomSheetRef={createSheetRef}
        onCreated={handleCreated}
        onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}
      />
      <PaywallSheet bottomSheetRef={paywallSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  emptyList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
