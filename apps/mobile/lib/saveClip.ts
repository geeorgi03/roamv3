import {
  insertClip,
  getClipsForSession,
} from './database';
import { uploadQueue } from '../services/uploadQueue';

export async function saveClip(
  sessionId: string,
  fileUri: string,
  label: string,
  token: string
): Promise<void> {
  const local_id = crypto.randomUUID();
  const recorded_at = new Date().toISOString();

  let finalLabel = label;
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

  uploadQueue.enqueue({
    local_id,
    session_id: sessionId,
    file_uri: fileUri,
    label: finalLabel,
    token,
  });
}
