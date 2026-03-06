import * as tus from 'tus-js-client';

/**
 * Upload a clip file to Mux using the TUS Direct Upload URL.
 * @param uploadUrl - The Mux Direct Upload TUS URL from POST /clips/upload-url
 * @param fileUri - Expo/React Native file URI (e.g. file:///...)
 * @param onProgress - Optional callback with progress percentage 0-100
 */
export class UploadAbortedError extends Error {
  constructor(message = 'Upload aborted') {
    super(message);
    this.name = 'UploadAbortedError';
  }
}

export function uploadClipToMux(
  uploadUrl: string,
  fileUri: string,
  onProgress?: (pct: number) => void
): { promise: Promise<void>; abort: () => void } {
  let upload: tus.Upload | null = null;
  let aborted = false;

  const promise = (async () => {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    return new Promise<void>((resolve, reject) => {
      upload = new tus.Upload(blob, {
        uploadUrl,
        chunkSize: 5 * 1024 * 1024,
        retryDelays: [],
        metadata: {
          filetype: 'video/mp4',
        },
        onProgress(bytesUploaded: number, bytesTotal: number) {
          if (bytesTotal > 0) {
            onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
          }
        },
        onError(error: Error) {
          if (aborted) {
            reject(new UploadAbortedError());
            return;
          }
          reject(error);
        },
        onSuccess() {
          resolve();
        },
      });

      if (aborted) {
        upload.abort();
        reject(new UploadAbortedError('Upload aborted before start'));
        return;
      }
      upload.start();
    });
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      upload?.abort();
    },
  };
}
