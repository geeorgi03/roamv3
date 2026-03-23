import { getPendingClips, removePendingClip, updatePendingClip, type PendingClip } from "./pendingQueue";

type UploadFileFn = (blob: Blob, mediaType: "audio" | "video") => Promise<{ url: string }>;

type SaveClipFn = (clipData: {
  mediaType: "video" | "audio";
  duration?: number;
  createdAt: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  type_tag?: string | null;
  feel_tags?: string[];
  note?: string;
  section_id?: string | null;
  timecode_ms?: number | null;
}) => Promise<unknown>;

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = /data:([^;]+);base64/.exec(header || "");
  const mimeType = mimeMatch?.[1] || "application/octet-stream";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

export async function syncPendingClips(saveClip: SaveClipFn, uploadFile: UploadFileFn, onSynced?: (tempId: string) => void) {
  const candidates = getPendingClips().filter((c) => c.status === "pending" || c.status === "failed");

  for (const pending of candidates) {
    try {
      updatePendingClip(pending.tempId, { status: "syncing" });
      const { blob } = dataUrlToBlob(pending.blobBase64);

      const uploaded = await uploadFile(blob, pending.mediaType);
      const clipData: Parameters<SaveClipFn>[0] = {
        mediaType: pending.mediaType,
        duration: pending.duration,
        createdAt: pending.createdAt,
        videoUrl: pending.mediaType === "video" ? uploaded.url : undefined,
        audioUrl: pending.mediaType === "audio" ? uploaded.url : undefined,
        type_tag: pending.type_tag,
        feel_tags: pending.feel_tags,
        note: pending.note,
        section_id: pending.section_id,
        timecode_ms: pending.timecode_ms,
      };

      await saveClip(clipData);
      removePendingClip(pending.tempId);
      onSynced?.(pending.tempId);
    } catch (e) {
      const current: PendingClip | undefined = getPendingClips().find((c) => c.tempId === pending.tempId);
      const retryCount = (current?.retryCount ?? pending.retryCount ?? 0) + 1;
      updatePendingClip(pending.tempId, { status: "failed", retryCount });
    }
  }
}

