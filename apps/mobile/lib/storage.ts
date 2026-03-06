import { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';

export const storage = new MMKV({ id: 'roam-store' });

const UPLOAD_QUEUE_KEY = 'upload_queue';
const TUS_URLS_KEY = 'tus_urls';

export function getUploadQueue(): QueueItem[] {
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
  storage.set(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
}

export function getTusUrls(): Record<string, string> {
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
  storage.set(TUS_URLS_KEY, JSON.stringify(urls));
}
