# TRAYCER Phase 1 Scope Document — Updated for ROAM PRD v2

## Phase 1 Goals

### Primary Objectives
- Establish core session-based choreography creation workflow
- Implement media storage and clip management infrastructure
- Enable loop, spatial, quality, and feeling layer data persistence
- Provide share intent and deep-link integration
- Create authentication and user management foundation
- Support group session with role-based access (choreographer / dancer)

### Success Metrics
- Users can create and manage choreography sessions
- Loops can be set by timestamp and persist across sessions
- Spatial moments with positions, paths, relationships persist
- Quality annotations (initiation, relationship, note, reference) persist
- Feeling layer (phrase, color, quality target) persists per session
- Group sessions support up to 5 dancers with real-time sync
- Share intent catches URLs from YouTube, Bilibili, XHS in under 10s

## Do-Not-Touch Areas
- Database schema and migrations in `supabase/migrations/`
- Existing authentication configuration
- Storage bucket structure and naming conventions
- Core API endpoint patterns (`/make-server-837ff822/` prefix)
- KV store implementation and key patterns
- CORS configuration and security headers

## Required API Surface

### Authentication
- `POST /make-server-837ff822/auth/signup`
- `POST /make-server-837ff822/auth/reset-password`

### Session Management
- `GET    /make-server-837ff822/sessions`
- `GET    /make-server-837ff822/sessions/:id`
- `POST   /make-server-837ff822/sessions`
- `PUT    /make-server-837ff822/sessions/:id`
- `DELETE /make-server-837ff822/sessions/:id`

### Feeling Layer (session-level artistic intent)
- `GET /make-server-837ff822/sessions/:id/feeling`
- `PUT /make-server-837ff822/sessions/:id/feeling`

### Loop Management
- `GET    /make-server-837ff822/sessions/:sessionId/loops`
- `POST   /make-server-837ff822/sessions/:sessionId/loops`
- `PUT    /make-server-837ff822/sessions/:sessionId/loops/:loopId`
- `DELETE /make-server-837ff822/sessions/:sessionId/loops/:loopId`

### Clip Management
- `GET    /make-server-837ff822/sessions/:sessionId/clips`
- `POST   /make-server-837ff822/sessions/:sessionId/clips`
- `DELETE /make-server-837ff822/sessions/:sessionId/clips/:clipId`

### Spatial Moments
- `GET    /make-server-837ff822/sessions/:sessionId/moments`
- `POST   /make-server-837ff822/sessions/:sessionId/moments`
- `PUT    /make-server-837ff822/sessions/:sessionId/moments/:momentId`
- `DELETE /make-server-837ff822/sessions/:sessionId/moments/:momentId`

### Formation (positions + paths + relationships per moment)
- `GET /make-server-837ff822/sessions/:sessionId/moments/:momentId/formation`
- `PUT /make-server-837ff822/sessions/:sessionId/moments/:momentId/formation`

### Quality Layer (per moment)
- `GET /make-server-837ff822/sessions/:sessionId/moments/:momentId/quality`
- `PUT /make-server-837ff822/sessions/:sessionId/moments/:momentId/quality`

### Notes and Marks
- `GET    /make-server-837ff822/sessions/:sessionId/notes`
- `POST   /make-server-837ff822/sessions/:sessionId/notes`
- `PUT    /make-server-837ff822/sessions/:sessionId/notes/:noteId`
- `DELETE /make-server-837ff822/sessions/:sessionId/notes/:noteId`
- `GET    /make-server-837ff822/sessions/:sessionId/marks`
- `POST   /make-server-837ff822/sessions/:sessionId/marks`
- `PUT    /make-server-837ff822/sessions/:sessionId/marks/:markId`
- `DELETE /make-server-837ff822/sessions/:sessionId/marks/:markId`

### Group Session
- `POST   /make-server-837ff822/sessions/:sessionId/join`
- `GET    /make-server-837ff822/sessions/:sessionId/dancers`
- `PUT    /make-server-837ff822/sessions/:sessionId/dancers/:dancerId/position`
- `POST   /make-server-837ff822/sessions/:sessionId/broadcast`
- `GET    /make-server-837ff822/sessions/:sessionId/broadcasts`

### Sharing
- `POST   /make-server-837ff822/sessions/:sessionId/share`
- `DELETE /make-server-837ff822/sessions/:sessionId/share`
- `POST   /make-server-837ff822/sessions/:sessionId/clips/:clipId/share`
- `DELETE /make-server-837ff822/sessions/:sessionId/clips/:clipId/share`
- `GET    /make-server-837ff822/share/:token`
- `POST   /make-server-837ff822/share/:token/response`

### Inbox
- `GET    /make-server-837ff822/inbox`
- `POST   /make-server-837ff822/inbox`
- `PATCH  /make-server-837ff822/inbox/:clipId/assign`
- `DELETE /make-server-837ff822/inbox/:clipId`

### Storage
- `POST /make-server-837ff822/upload`

## Data Models

- **Session**: id, name, userId, createdAt, updatedAt
- **Feeling**: sessionId, phrase, color, qualityTargetClipId
- **Loop**: sessionId, name, startTimestamp, endTimestamp, sourceUrl, color, active
- **Clip**: sessionId, type (MINE/REF), videoUrl, thumbnailUrl, sourceUrl, timestamp, dancerId
- **Moment**: sessionId, name, beat, bar, sectionId
- **Formation**: momentId, positions[], paths[], relationships[]
  - Position: dancerId, x, y, orientationDegrees
  - Path: fromDancerId, toDancerId, controlX, controlY, qualityTag
  - Relationship: dancerAId, dancerBId, type (supports/unison/canon/leads/follows)
- **Quality**: momentId, initiation, relationshipQuality, noteText, noteAudioUrl, qualityReferenceUrl
- **Note**: sessionId, text, audioUrl, clipId, momentId, transcribed
- **Mark**: sessionId, x, y, beat, label
- **Dancer**: sessionId, userId, role (choreographer/dancer), color, name
- **Broadcast**: sessionId, text, sentAt, fromDancerId
- **Share**: sessionId, clipId, token, expiresAt, revoked
- **Inbox**: userId, clipId, sourceUrl, createdAt

## Edge Case Policies

### Loop Policies
- Loops defined by [sourceUrl + startTimestamp + endTimestamp]
- Auto-named "loop 1", "loop 2" — never prompt for name during session
- Long-press chip to rename — only in review mode
- Multiple loops persist across app closes
- For YouTube: use timestamp parameters for deep-link
- For Bilibili/XHS: store URL + timestamps, open native app

### Share Intent Policies
- Roam registers as Android share target for URLs
- Incoming URL → drops into active session as REF clip
- If no active session → prompt to create one (session name auto-generated)
- Under 10 seconds from share tap to clip appearing in session

### Spatial Layer Policies
- Tool order: positions first → paths after first position → relationships after first path
- Paths curved by default — straight requires dragging midpoint to center
- Orientation arrow on each dot — rotate handle to set facing direction
- Path quality tag: one word, optional, tap path to add

### Quality Layer Policies
- Hidden by default — "+" next to moment name to expand
- Never prompted automatically
- Voice note: saves audio immediately, transcribes in background
- Initiation: free text, past entries as chips
- Relationship quality: preset suggestions as placeholder, accepts any text

### Feeling Layer Policies
- Phrase never required — shows "add a phrase…" placeholder
- Tap phrase area to edit anytime
- Session name auto-generated from song/date — rename anytime
- Never block session entry with naming prompt

### Broadcast Policies
- 60 character hard limit
- Slides in at top of dancer screen for 4 seconds then fades
- Always re-readable in notes panel
- Dancer dot pulses once on choreographer device when broadcast sent

### Group Session Policies
- Max 5 dancers per session
- Roles: one choreographer, up to 4 dancers
- All clips visible to all participants, color-coded by dancer
- Formation updates sync in real-time
- Dancer view: all dots visible, all paths visible
  - My dot: 20px + subtle ring
  - Others: 14px

### Offline Policies
- Camera opens within 200ms — no loading screen
- Clip saves to inbox within 500ms of stopping recording
- Upload queue resumes automatically on reconnect
- Sessions and clips visible locally before upload completes

## Acceptance Criteria

- [ ] Sessions CRUD with auto-naming
- [ ] Feeling layer persists phrase, color, quality target
- [ ] Loops store URL + timestamps, persist across closes
- [ ] Clips attributed to dancer with color
- [ ] Spatial moments with formation data persist
- [ ] Quality layer per moment persists
- [ ] Group session with roles and real-time sync
- [ ] Broadcast with 60-char limit and history
- [ ] Share intent catches YouTube/Bilibili/XHS URLs
- [ ] Deep-link to native video apps at timestamp
- [ ] Voice notes save audio + background transcription
- [ ] Inbox workflow for unassigned clips
- [ ] All endpoints follow `/make-server-837ff822/` prefix
- [ ] Authentication via Supabase Auth

## Local Development

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
pnpm dev
```
