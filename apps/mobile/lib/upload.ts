import * as tus from 'tus-js-client';

/**
 * Upload a clip file to Mux using the TUS Direct Upload URL.
 * @param uploadUrl - The Mux Direct Upload TUS URL from POST /clips/upload-url
 * @param fileUri - Expo/React Native file URI (e.g. file:///...)
 * @param onProgress - Optional callback with progress percentage 0-100
 */
export async function uploadClipToMux(
  uploadUrl: string,
  fileUri: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(blob, {
      uploadUrl,
      chunkSize: 5 * 1024 * 1024,
      retryDelays: [0, 1000, 3000],
      metadata: {
        filetype: 'video/mp4',
      },
      onProgress(bytesUploaded: number, bytesTotal: number) {
        if (bytesTotal > 0) {
          onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
        }
      },
      onError(error: Error) {
        reject(error);
      },
      onSuccess() {
        resolve();
      },
    });
    upload.start();
  });
}
