import { insertClip, getClipsForSession } from './database';
import { uploadQueue } from '../services/uploadQueue';

export type SaveClipResult =
  | { ok: true; local_id: string }
  | { ok: false; reason: 'plan_limit_reached' }
  | { ok: false; reason: 'error'; message: string };

/**
 * Persists clip metadata locally and enqueues for upload.
 * Accepts an optional sectionLabel so the upload queue can create a
 * section_clips association once the server clip_id is known.
 */
export async function saveClip(
  sessionId: string,
  fileUri: string,
  label: string,
  token: string,
  sectionLabel?: string
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
      section_label: sectionLabel,
    });

    return { ok: true, local_id };
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Failed to save clip',
    };
  }
}

/**
 * Persists an inbox clip locally and enqueues for upload.
 * The server will create the inbox clip row on first /clips/upload-url call.
 */
export async function saveInboxClip(
  fileUri: string,
  label: string,
  token: string
): Promise<SaveClipResult> {
  try {
    const local_id = crypto.randomUUID();
    const recorded_at = new Date().toISOString();

    insertClip({
      local_id,
      session_id: null,
      label,
      recorded_at,
      file_uri: fileUri,
      upload_status: 'local',
    });

    uploadQueue.enqueue({
      local_id,
      session_id: null,
      file_uri: fileUri,
      label,
      recorded_at,
      token,
    });

    return { ok: true, local_id };
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Failed to save clip',
    };
  }
}
