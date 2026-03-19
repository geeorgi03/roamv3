export type PendingClipStatus = "pending" | "syncing" | "failed";

export type PendingClip = {
  tempId: string;
  mediaType: "video" | "audio";
  duration?: number;
  createdAt: string;
  blobBase64: string;
  blobMimeType: string;
  status: PendingClipStatus;
  retryCount: number;
};

const STORAGE_KEY = "roam-pending-clips";

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAll(): PendingClip[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<PendingClip[]>(window.localStorage.getItem(STORAGE_KEY), []);
}

function writeAll(clips: PendingClip[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
}

export function getPendingClips(): PendingClip[] {
  return readAll();
}

export function addPendingClip(clip: PendingClip): void {
  const all = readAll();
  all.push(clip);
  writeAll(all);
}

export function updatePendingClip(tempId: string, partial: Partial<PendingClip>): void {
  const all = readAll();
  const idx = all.findIndex((c) => c.tempId === tempId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...partial };
  writeAll(all);
}

export function removePendingClip(tempId: string): void {
  const all = readAll().filter((c) => c.tempId !== tempId);
  writeAll(all);
}

