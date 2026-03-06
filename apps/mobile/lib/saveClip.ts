const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
import {
  insertClip,
  updateClipServerData,
  updateClipStatus,
  getClipsForSession,
} from './database';
import { uploadClipToMux } from './upload';

export type OnLocalClipUpdate = (
  local_id: string,
  updates: { upload_status?: string; upload_progress?: number }
) => void;

export async function saveClip(
  sessionId: string,
  fileUri: string,
  label: string,
  token: string,
  existingLocalId?: string,
  onLocalUpdate?: OnLocalClipUpdate
): Promise<void> {
  const isRetry = !!existingLocalId;
  const local_id = existingLocalId ?? crypto.randomUUID();
  const recorded_at = new Date().toISOString();

  let finalLabel = label;
  if (!isRetry) {
    const existing = getClipsForSession(sessionId);
    finalLabel = `Clip ${existing.length + 1}`;
    insertClip({
      local_id,
      session_id: sessionId,
      label: finalLabel,
      recorded_at,
      file_uri: fileUri,
      upload_status: 'local',
    });
  }
  if (onLocalUpdate) onLocalUpdate(local_id, { upload_status: 'local', upload_progress: 0 });

  try {
    const res = await fetch(`${API_BASE}/clips/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        local_id,
        label: finalLabel,
        recorded_at,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
    const clip_id = (data as { clip_id: string }).clip_id;
    updateClipServerData(local_id, clip_id);
    updateClipStatus(local_id, 'uploading', 0);
    if (onLocalUpdate) onLocalUpdate(local_id, { upload_status: 'uploading', upload_progress: 0 });

    await uploadClipToMux(
      (data as { upload_url: string }).upload_url,
      fileUri,
      (pct) => {
        updateClipStatus(local_id, 'uploading', pct);
        if (onLocalUpdate) onLocalUpdate(local_id, { upload_status: 'uploading', upload_progress: pct });
      }
    );

    updateClipStatus(local_id, 'processing');
    if (onLocalUpdate) onLocalUpdate(local_id, { upload_status: 'processing' });
  } catch {
    updateClipStatus(local_id, 'failed');
    if (onLocalUpdate) onLocalUpdate(local_id, { upload_status: 'failed' });
  }
}
