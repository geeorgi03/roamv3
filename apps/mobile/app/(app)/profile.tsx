import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '../../lib/theme';
import { useSession } from '../../lib/hooks/useSession';
import type { Plan } from '@roam/types';
type SupabaseClient = Awaited<typeof import('../../lib/supabase')>['supabase'];

import { API_BASE, getApiBaseOverride, setApiBaseOverride } from '../../lib/api';
const SUCCESS_URL = 'https://roamdance.com/billing/success';
const PORTAL_RETURN_URL = 'https://roamdance.com/profile';

export default function ProfileScreen() {
  const { session } = useSession();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    import('../../lib/supabase')
      .then(({ supabase }) => { supabaseRef.current = supabase; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/billing/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = (await res.json()) as { plan?: Plan; error?: string };
        if (res.ok) setPlan((data.plan as Plan) ?? 'free');
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.access_token]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !supabaseRef.current) return;
    const sb = supabaseRef.current;
    const channel = sb.channel(`profile-plan-${userId}`).on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      (payload) => {
        const planVal = (payload.new as { plan?: string | null })?.plan;
        if (typeof planVal === 'string' && planVal.length > 0) {
          setPlan(planVal as Plan);
        }
      }
    ).subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [session?.access_token, session?.user?.id]);

  const handleUpgrade = async () => {
    if (!session?.access_token) return;
    setCheckoutLoading(true);
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
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { portal_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Portal failed');
      const url = data.portal_url;
      if (url) await WebBrowser.openAuthSessionAsync(url, PORTAL_RETURN_URL);
    } finally {
      setPortalLoading(false);
    }
  };

  const [showDev, setShowDev] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseOverride() ?? '');
  const [devTapCount, setDevTapCount] = useState(0);

  const handleDevTap = () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 5) {
      setShowDev(true);
      setDevTapCount(0);
    }
  };

  const handleSaveApiUrl = () => {
    const trimmed = apiUrlInput.trim();
    if (trimmed && !trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'API URL must start with http:// or https://');
      return;
    }
    setApiBaseOverride(trimmed || null);
    Alert.alert(
      trimmed ? 'API URL Updated' : 'API URL Reset',
      trimmed ? `API calls will now use:\n${trimmed}` : `Using default: ${API_BASE}`,
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.textPrimary} size="large" />
      </View>
    );
  }

  const planLabel = plan === 'free' ? 'Free' : plan === 'creator' ? 'Creator' : plan === 'pro' ? 'Pro' : plan === 'studio' ? 'Studio' : 'Free';

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Current plan</Text>
        <TouchableOpacity onPress={handleDevTap} activeOpacity={1}>
          <View style={[styles.planBadge, plan !== 'free' && styles.planBadgePaid]}>
            <Text style={styles.planText}>{planLabel}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {plan === 'free' && (
        <TouchableOpacity
          style={[styles.button, checkoutLoading && styles.buttonDisabled]}
          onPress={handleUpgrade}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.buttonText}>Upgrade</Text>
          )}
        </TouchableOpacity>
      )}

      {plan && plan !== 'free' && (
        <TouchableOpacity
          style={[styles.button, portalLoading && styles.buttonDisabled]}
          onPress={handleManageSubscription}
          disabled={portalLoading}
        >
          {portalLoading ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.buttonText}>Manage subscription</Text>
          )}
        </TouchableOpacity>
      )}

      {showDev && (
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>Developer Settings</Text>
          <Text style={styles.devLabel}>API Base URL</Text>
          <Text style={styles.devHint}>Current: {API_BASE}</Text>
          <TextInput
            style={styles.devInput}
            value={apiUrlInput}
            onChangeText={setApiUrlInput}
            placeholder="https://your-api.railway.app"
            placeholderTextColor="#555"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.devButtonRow}>
            <TouchableOpacity style={styles.devButton} onPress={handleSaveApiUrl}>
              <Text style={styles.devButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, styles.devButtonSecondary]}
              onPress={() => { setApiUrlInput(''); setApiBaseOverride(null); Alert.alert('Reset', 'Using default API URL'); }}
            >
              <Text style={styles.devButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  planBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  planBadgePaid: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  planText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  button: {
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  devSection: {
    marginTop: 40,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  devLabel: {
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 4,
  },
  devHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  devInput: {
    backgroundColor: '#222',
    color: theme.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 12,
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  devButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  devButtonSecondary: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
  },
  devButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
