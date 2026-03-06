import { insertClip, getClipsForSession } from './database';
import { uploadQueue } from '../services/uploadQueue';

export type SaveClipResult =
  | { ok: true }
  | { ok: false; reason: 'plan_limit_reached' }
  | { ok: false; reason: 'error'; message: string };

/**
 * Persists clip metadata locally and enqueues for upload.
 * Local persistence and enqueue are unconditional; paywall is surfaced only from
 * authoritative server responses (403 plan_limit_reached during /clips/upload-url).
 */
export async function saveClip(
  sessionId: string,
  fileUri: string,
  label: string,
  token: string
): Promise<SaveClipResult> {
  try {
    const existing = getClipsForSession(sessionId);
    const finalLabel = `Clip ${existing.length + 1}`;

    const local_id = crypto.randomUUID();
    const recorded_at = new Date().toISOString();

    insertClip({
      local_id,
      session_id: sessionId,
      label: finalLabel,
      recorded_at,
      file_uri: fileUri,
      upload_status: 'local',
    });

    uploadQueue.enqueue({
      local_id,
      session_id: sessionId,
      file_uri: fileUri,
      label: finalLabel,
      recorded_at,
      token,
    });

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Failed to save clip',
    };
  }
}
