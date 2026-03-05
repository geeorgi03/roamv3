/**
 * Shared types for Roam workspace.
 * Exported for use by apps/api and apps/mobile.
 */

export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  durationSeconds?: number;
  status: UploadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Clip {
  id: string;
  trackId: string;
  startSeconds: number;
  endSeconds: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  clips: Clip[];
  createdAt: string;
  updatedAt: string;
}
