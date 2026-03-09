import { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';

// TODO(boot): wrapped in try/catch so a missing/unlinked MMKV native module doesn't
// crash the uploadQueue service at import time. Falls back to no-op storage.
let storage: MMKV;
try {
  storage = new MMKV({ id: 'roam-store' });
} catch (e) {
  console.error('[storage] MMKV init failed, upload queue will not persist:', e);
  storage = null as unknown as MMKV;
}
export { storage };

const UPLOAD_QUEUE_KEY = 'upload_queue';
const TUS_URLS_KEY = 'tus_urls';

export function getUploadQueue(): QueueItem[] {
  if (!storage) return [];
  const raw = storage.getString(UPLOAD_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

export function setUploadQueue(queue: QueueItem[]): void {
  if (!storage) return;
  storage.set(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
}

export function getTusUrls(): Record<string, string> {
  if (!storage) return {};
  const raw = storage.getString(TUS_URLS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

export function setTusUrls(urls: Record<string, string>): void {
  if (!storage) return;
  storage.set(TUS_URLS_KEY, JSON.stringify(urls));
}
