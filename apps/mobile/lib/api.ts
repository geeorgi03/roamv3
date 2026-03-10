import Constants from 'expo-constants';

const API_URL_STORAGE_KEY = 'roam_api_url_override';

let _mmkv: { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  _mmkv = new MMKV({ id: 'roam-store' });
} catch {
  // MMKV unavailable — runtime override won't persist
}

function resolveApiBase(): string {
  const override = _mmkv?.getString(API_URL_STORAGE_KEY);
  if (override) return override;

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001`;
  }

  return 'http://localhost:3001';
}

/** Current API base URL. Changes when setApiBaseOverride is called. */
export let API_BASE = resolveApiBase();

/** Override the API URL at runtime (persisted in MMKV). Pass null to clear. */
export function setApiBaseOverride(url: string | null): void {
  if (url) {
    _mmkv?.set(API_URL_STORAGE_KEY, url);
  } else {
    _mmkv?.delete(API_URL_STORAGE_KEY);
  }
  API_BASE = resolveApiBase();
}

/** Get the current override (null if using default). */
export function getApiBaseOverride(): string | null {
  return _mmkv?.getString(API_URL_STORAGE_KEY) ?? null;
}
