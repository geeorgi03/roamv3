import * as SecureStore from 'expo-secure-store';
import { createSupabaseClientFromExpoEnv } from '@roam/db';

console.log('[BOOT] supabase module loading');

const secureStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createSupabaseClientFromExpoEnv({
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[BOOT] Supabase client created');
