import NetInfo from '@react-native-community/netinfo';
import { getTusUrls, getUploadQueue, setTusUrls, setUploadQueue } from '../lib/storage';
import { updateClipServerData, updateClipStatus as updateClipStatusDb } from '../lib/database';
import { uploadClipToMux, UploadAbortedError } from '../lib/upload';
import { API_BASE } from '../lib/api';

export interface QueueItem {
  local_id: string;
  session_id: string | null;
  file_uri: string;
  label: string;
  recorded_at: string;
  token: string;
  clip_id?: string;
  tus_upload_url?: string;
  mux_upload_id?: string;
  attempt_count: number;
  next_retry_at?: number;
  status: 'queued' | 'uploading' | 'failed';
  /** When set, a section_clips entry will be created server-side after upload. */
  section_label?: string;
}

type UploadQueueStatus =
  | QueueItem['status']
  | 'processing';

export interface UploadQueueEvent {
  local_id: string;
  status?: UploadQueueStatus;
  progress?: number;
  reason?: string;
}

type UploadQueueListener = (event: UploadQueueEvent) => void;

const uploadQueueListeners = new Set<UploadQueueListener>();

export function addUploadQueueListener(listener: UploadQueueListener): () => void {
  uploadQueueListeners.add(listener);
  return () => {
    uploadQueueListeners.delete(listener);
  };
}

function emitUploadQueueEvent(event: UploadQueueEvent) {
  if (!event.local_id) return;
  uploadQueueListeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // ignore listener errors
    }
  });
}

function updateClipStatusWithEvent(local_id: string, status: UploadQueueStatus, progress?: number, reason?: string) {
  updateClipStatusDb(local_id, status, progress);
  const event: UploadQueueEvent = { local_id, status };
  if (typeof progress === 'number') {
    event.progress = progress;
  }
  if (typeof reason === 'string' && reason.length > 0) {
    event.reason = reason;
  }
  emitUploadQueueEvent(event);
}

export class UploadQueueService {
  private _queue: QueueItem[] = [];
  private _active = new Map<string, { abort: () => void }>();
  private _retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _isConnected: boolean | null = null;

  private readonly MAX_CONCURRENT = 2;

  constructor() {
    this._queue = getUploadQueue();

    const interrupted: string[] = [];
    this._queue = this._queue.map((item) => {
      if (item.status === 'uploading') {
        interrupted.push(item.local_id);
        return { ...item, status: 'queued' as const };
      }
      return item;
    });
    if (interrupted.length > 0) {
      setUploadQueue(this._queue);
      interrupted.forEach((local_id) => updateClipStatusWithEvent(local_id, 'queued'));
    }

    const now = Date.now();
    const dueForRetry: string[] = [];
    for (const item of this._queue) {
      if (item.status !== 'queued' || item.next_retry_at == null) continue;
      if (item.next_retry_at > now) {
        this._scheduleRetry(item);
      } else {
        item.next_retry_at = undefined;
        dueForRetry.push(item.local_id);
      }
    }
    if (dueForRetry.length > 0) {
      setUploadQueue(this._queue);
    }

    NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true;
      this._isConnected = connected;
      if (connected) this.processQueue();
      else this._pauseAll();
    });

    void NetInfo.fetch().then((state) => {
      this._isConnected = state.isConnected === true;
      if (dueForRetry.length > 0 && state.isConnected === true) {
        this.processQueue();
      }
    });
  }

  enqueue(item: Omit<QueueItem, 'attempt_count' | 'status'>) {
    const next: QueueItem = { ...item, attempt_count: 0, status: 'queued' };
    this._queue.push(next);
    setUploadQueue(this._queue);
    updateClipStatusWithEvent(item.local_id, 'queued');
    this.processQueue();
  }

  /**
   * Resume queue processing after user intent (e.g. manual retry, post-upgrade).
   * Call this when the user has upgraded or explicitly chooses to retry uploads.
   */
  resumeQueue() {
    this.processQueue();
  }

  retryClip(local_id: string) {
    const idx = this._queue.findIndex(
      (q) => q.local_id === local_id && q.status === 'failed'
    );
    if (idx < 0) return;
    this._queue[idx] = {
      ...this._queue[idx],
      attempt_count: 0,
      status: 'queued',
      next_retry_at: undefined,
    };
    setUploadQueue(this._queue);
    updateClipStatusWithEvent(local_id, 'queued');
    this.processQueue();
  }

  onAppForeground() {
    this.processQueue();
  }

  processQueue() {
    if (this._isConnected === false) return;

    const now = Date.now();
    const eligible = this._queue.filter(
      (q) => q.status === 'queued' && (q.next_retry_at ?? 0) <= now
    );
    const capacity = this.MAX_CONCURRENT - this._active.size;
    if (capacity <= 0) return;

    eligible.slice(0, capacity).forEach((item) => {
      void this._startUpload(item);
    });
  }

  private _scheduleRetry(item: QueueItem) {
    if (item.next_retry_at == null) return;

    const existing = this._retryTimers.get(item.local_id);
    if (existing) clearTimeout(existing);

    const delay = Math.max(0, item.next_retry_at - Date.now());
    const t = setTimeout(() => {
      this._retryTimers.delete(item.local_id);
      this.processQueue();
    }, delay);
    this._retryTimers.set(item.local_id, t);
  }

  private async _startUpload(item: QueueItem) {
    if (this._active.has(item.local_id)) return;
    if (this._isConnected === false) return;

    try {
      const storedUrl = getTusUrls()[item.local_id];
      const itemUrl = item.tus_upload_url;

      if (storedUrl) {
        item.tus_upload_url = storedUrl;
      } else if (itemUrl) {
        item.tus_upload_url = itemUrl;
        setTusUrls({ ...getTusUrls(), [item.local_id]: itemUrl });
      } else {
        const res = await fetch(`${API_BASE}/clips/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${item.token}`,
          },
          body: JSON.stringify(
            item.session_id
              ? {
                  session_id: item.session_id,
                  local_id: item.local_id,
                  recorded_at: item.recorded_at,
                  label: item.label,
                }
              : {
                  local_id: item.local_id,
                  recorded_at: item.recorded_at,
                  label: item.label,
                }
          ),
        });
        const data = (await res.json()) as
          | { clip_id: string; upload_url: string; mux_upload_id?: string }
          | { error?: string };
        if (res.status === 403 && 'error' in data && data.error === 'plan_limit_reached') {
          const currentIdx = this._queue.findIndex((q) => q.local_id === item.local_id);
          if (currentIdx >= 0) {
            const current = this._queue[currentIdx];
            current.status = 'failed';
            setUploadQueue(this._queue);
            updateClipStatusWithEvent(item.local_id, 'failed', undefined, 'plan_limit_reached');
          }
          return;
        }
        if (!res.ok) {
          const errMsg = ('error' in data && data.error) || res.statusText;
          throw new Error(errMsg);
        }

        const clip_id = (data as { clip_id: string }).clip_id;
        const upload_url = (data as { upload_url: string }).upload_url;
        const mux_upload_id = (data as { mux_upload_id?: string }).mux_upload_id;

        item.clip_id = clip_id;
        item.tus_upload_url = upload_url;
        item.mux_upload_id = mux_upload_id;

        updateClipServerData(item.local_id, clip_id);
        setTusUrls({ ...getTusUrls(), [item.local_id]: upload_url });

        // If the clip was saved with a section label, create the section_clips
        // association now that we have the authoritative server clip_id.
        if (item.section_label && item.session_id) {
          void this._createSectionAssignment(
            clip_id,
            item.session_id,
            item.section_label,
            item.token
          );
        }
      }

      item.status = 'uploading';
      setUploadQueue(this._queue);
      updateClipStatusWithEvent(item.local_id, 'uploading', 0);

      const handle = uploadClipToMux(item.tus_upload_url!, item.file_uri, (pct) => {
        updateClipStatusWithEvent(item.local_id, 'uploading', pct);
      });
      this._active.set(item.local_id, { abort: handle.abort });

      await handle.promise;

      this._active.delete(item.local_id);

      this._queue = this._queue.filter((q) => q.local_id !== item.local_id);
      setUploadQueue(this._queue);

      const nextUrls = getTusUrls();
      delete nextUrls[item.local_id];
      setTusUrls(nextUrls);

      updateClipStatusWithEvent(item.local_id, 'processing');
      this.processQueue();
    } catch (error) {
      this._active.delete(item.local_id);

      const currentIdx = this._queue.findIndex((q) => q.local_id === item.local_id);
      if (currentIdx < 0) return;
      const current = this._queue[currentIdx];

      const isAbort =
        error instanceof UploadAbortedError ||
        (error &&
          typeof error === 'object' &&
          'name' in error &&
          (error as { name?: string | undefined }).name === 'UploadAbortedError');

      if (isAbort) {
        if (current.status === 'uploading') {
          current.status = 'queued';
          current.next_retry_at = undefined;
          setUploadQueue(this._queue);
          updateClipStatusWithEvent(current.local_id, 'queued');
        }
        this.processQueue();
        return;
      }

      current.attempt_count += 1;
      if (current.attempt_count < 5) {
        const delay =
          Math.min(60000, 2000 * Math.pow(2, current.attempt_count)) +
          Math.random() * 1000;
        current.next_retry_at = Date.now() + delay;
        current.status = 'queued';
        setUploadQueue(this._queue);
        updateClipStatusWithEvent(current.local_id, 'queued');
        this._scheduleRetry(current);
      } else {
        current.status = 'failed';
        setUploadQueue(this._queue);
        updateClipStatusWithEvent(current.local_id, 'failed');
      }
      this.processQueue();
    }
  }

  /** Best-effort: register a clip with a section after its server ID is known. */
  private async _createSectionAssignment(
    clipId: string,
    sessionId: string,
    sectionLabel: string,
    token: string
  ) {
    try {
      await fetch(`${API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clip_id: clipId, section_label: sectionLabel }),
      });
    } catch {
      // Ignore – section assignment is best-effort; the clip is still saved.
    }
  }

  private _pauseAll() {
    for (const [local_id, handle] of this._active.entries()) {
      try {
        handle.abort();
      } catch {
        // ignore
      }
      const idx = this._queue.findIndex((q) => q.local_id === local_id);
      if (idx >= 0) this._queue[idx].status = 'queued';
      updateClipStatusWithEvent(local_id, 'queued');
    }
    setUploadQueue(this._queue);
    this._active.clear();
  }
}

export const uploadQueue = new UploadQueueService();

