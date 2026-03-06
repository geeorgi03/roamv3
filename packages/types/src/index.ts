// packages/types/src/index.ts
//
// **Shared consumer contract (Tech Plan).** This package is the single source of truth
// for DB-shaped records and API DTOs. All apps (api, web, mobile) and @roam/db consume it.

/** Shared contract: DB-shaped records + API DTOs
 *  - snake_case everywhere (matches Postgres/Supabase)
 *  - stable IDs as string (uuid)
 *  - timestamps as ISO strings
 */

export type ISODateTime = string;
export type UUID = string;

/** ---- Plan & User (Tech Plan: billing/user types) ---- */
export type Plan = 'free' | 'creator' | 'pro' | 'studio';

export interface User {
  id: UUID;
  email: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: ISODateTime;
}

/** ---- UploadStatus (Tech Plan: string union for API/DB) ---- */
export type UploadStatus =
  | 'local'
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

/** ---- Session (Tech Plan) ---- */
export interface Session {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: ISODateTime;
}

/** ---- Clip (Tech Plan) ---- */
export interface Clip {
  id: UUID;
  session_id: UUID;
  label: string | null;
  mux_upload_id: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  mux_passthrough: Record<string, unknown> | null;
  upload_status: UploadStatus;
  move_name: string | null;
  style: string | null;
  energy: string | null;
  difficulty: string | null;
  bpm: number | null;
  notes: string | null;
  recorded_at: ISODateTime;
  local_id: string;
}

/** ---- MusicTrack (Tech Plan) ---- */
export interface BeatGridEntry {
  time_ms: number;
  beat_number: number;
  is_downbeat: boolean;
}

export interface SectionEntry {
  label: string;
  start_ms: number;
}

export interface MusicTrack {
  id: UUID;
  session_id: UUID;
  source_type: 'upload' | 'youtube';
  source_url: string | null;
  storage_path: string | null;
  bpm: number | null;
  beat_grid: BeatGridEntry[] | null;
  sections: SectionEntry[] | null;
  analysis_status: 'pending' | 'processing' | 'complete' | 'failed';
  downbeat_offset_ms?: number | null;
}

/** ---- Annotation & Feedback (V1.0) ---- */
export type AnnotationType = 'text' | 'arrow' | 'circle';

export interface ClipComment {
  id: UUID;
  clip_id: UUID;
  session_id: UUID;
  timecode_ms: number;
  text: string;
  commenter_name: string | null;
  created_at: ISODateTime;
}

export interface FeedbackRequest {
  id: UUID;
  clip_id: UUID;
  session_id: UUID;
  status: 'open' | 'closed';
  created_at: ISODateTime;
}

export type TextPayload = { x: number; y: number; text: string };
export type ArrowPayload = { x1: number; y1: number; x2: number; y2: number };
export type CirclePayload = { cx: number; cy: number; r: number };

export interface ClipAnnotation {
  id: UUID;
  clip_id: UUID;
  timecode_ms: number;
  type: AnnotationType;
  payload: TextPayload | ArrowPayload | CirclePayload;
  created_at: ISODateTime;
}

export interface ClipTagHistory {
  id: UUID;
  clip_id: UUID;
  snapshot: Record<string, unknown>;
  saved_at: ISODateTime;
  saved_by: UUID;
}

export interface SectionClip {
  id: UUID;
  session_id: UUID;
  section_label: string;
  section_start_ms: number;
  clip_id: UUID;
  position: number;
  created_at: ISODateTime;
}
