export * from "./schema";
export type MusicTrack = import("zod").infer<typeof import("./schema").MusicTrackSchema>;
export type ChoreoProject = import("zod").infer<typeof import("./schema").ChoreoProjectSchema>;
export type ChoreoSegment = import("zod").infer<typeof import("./schema").ChoreoSegmentSchema>;
export type ApiError = import("zod").infer<typeof import("./schema").ApiErrorSchema>;
export type HealthResponse = import("zod").infer<typeof import("./schema").HealthResponseSchema>;
export type AnalyzeMusicRequest = import("zod").infer<typeof import("./schema").AnalyzeMusicRequestSchema>;
export type AnalyzeMusicResponse = import("zod").infer<typeof import("./schema").AnalyzeMusicResponseSchema>;
