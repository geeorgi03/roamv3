import { z } from "zod";

/**
 * IMPORTANT:
 * Replace/adjust the schemas below to EXACTLY match the Tech Plan model.
 * The structure is here to enforce: runtime validation + shared TS types from zod.
 */

/** IDs */
export const IdSchema = z.string().min(1);

/** Core domain objects (placeholder baseline) */
export const MusicTrackSchema = z.object({
  id: IdSchema,
  title: z.string(),
  artist: z.string().optional(),
  bpm: z.number().positive().optional(),
  duration_ms: z.number().int().nonnegative().optional()
});

export const ChoreoProjectSchema = z.object({
  id: IdSchema,
  owner_user_id: IdSchema,
  title: z.string(),
  created_at: z.string(), // ISO
  updated_at: z.string()  // ISO
});

export const ChoreoSegmentSchema = z.object({
  id: IdSchema,
  project_id: IdSchema,
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative(),
  label: z.string().optional()
});

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  request_id: z.string().optional()
});

/** Example request/response contracts (replace with Tech Plan endpoints) */
export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  version: z.string()
});

export const AnalyzeMusicRequestSchema = z.object({
  track_id: IdSchema,
  audio_url: z.string().url()
});

export const AnalyzeMusicResponseSchema = z.object({
  track_id: IdSchema,
  bpm: z.number().positive().optional(),
  beats: z.array(z.number().int().nonnegative()).optional()
});
