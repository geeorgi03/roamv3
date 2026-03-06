import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const SUCCESS_URL = 'https://roamdance.com/billing/success';

export interface PaywallSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  onDismiss?: () => void;
}

const PLAN_ROWS = [
  { plan: 'Free', clips: '20 clips', sessions: '3 sessions', music: 'No' },
  { plan: 'Creator', clips: 'Unlimited', sessions: 'Unlimited', music: 'Yes' },
  { plan: 'Pro', clips: 'Unlimited', sessions: 'Unlimited', music: 'Yes' },
];

export function PaywallSheet({ bottomSheetRef, onDismiss }: PaywallSheetProps) {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: 'creator' }),
      });
      const data = (await res.json()) as { checkout_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      const url = data.checkout_url;
      if (url) await WebBrowser.openAuthSessionAsync(url, SUCCESS_URL);
      bottomSheetRef.current?.close();
      onDismiss?.();
    } finally {
      setLoading(false);
    }
  };

  const handleMaybeLater = () => {
    bottomSheetRef.current?.close();
    onDismiss?.();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['55%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Upgrade to unlock more</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>Plan</Text>
            <Text style={[styles.cell, styles.headerCell]}>Clips</Text>
            <Text style={[styles.cell, styles.headerCell]}>Sessions</Text>
            <Text style={[styles.cell, styles.headerCell]}>Music</Text>
          </View>
          {PLAN_ROWS.map((row) => (
            <View key={row.plan} style={styles.tableRow}>
              <Text style={[styles.cell, styles.cellText]}>{row.plan}</Text>
              <Text style={[styles.cell, styles.cellText]}>{row.clips}</Text>
              <Text style={[styles.cell, styles.cellText]}>{row.sessions}</Text>
              <Text style={[styles.cell, styles.cellText]}>{row.music}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpgrade}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.buttonText}>Upgrade to Creator — €9/mo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterLink} onPress={handleMaybeLater}>
          <Text style={styles.laterText}>Maybe later</Text>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: theme.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.textSecondary,
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontWeight: '700',
    color: theme.textPrimary,
    fontSize: 12,
  },
  cellText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  button: {
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  laterLink: {
    alignItems: 'center',
  },
  laterText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
