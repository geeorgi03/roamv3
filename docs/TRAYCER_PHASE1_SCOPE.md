# TRAYCER Phase 1 Scope Document

## Phase 1 Goals

### Primary Objectives
- Establish core session-based choreography creation workflow
- Implement basic media upload and storage infrastructure
- Enable clip creation and management within sessions
- Provide fundamental sharing capabilities for sessions and clips
- Create authentication and user management foundation

### Success Metrics
- Users can create and manage choreography sessions
- Media files (video/audio) can be uploaded and stored reliably
- Clips can be created, organized, and shared with collaborators
- Basic user authentication and authorization functions correctly
- Inbox workflow for unassigned media clips is operational

## Phase 1 Non-Goals

### Explicitly Out of Scope
- Advanced video editing or processing capabilities
- Real-time collaboration features
- Music synchronization or beat detection
- Advanced analytics or reporting
- Mobile app development (web-only focus)
- Integration with external music services
- Advanced permission management (basic user-scoped access only)

## Do-Not-Touch Areas

### Existing Systems to Preserve
- Database schema and migrations in `supabase/migrations/`
- Existing authentication configuration
- Storage bucket structure and naming conventions
- Core API endpoint patterns (`/make-server-837ff822/` prefix)
- KV store implementation and key patterns
- CORS configuration and security headers

### Protected Components
- Supabase configuration and service role setup
- Environment variable naming conventions
- Existing error handling patterns
- Logging infrastructure

## Required Screens/Flows

### Core User Flows
1. **Authentication Flow**
   - User signup/login
   - Password reset functionality
   - Session management

2. **Session Management Flow**
   - Create new choreography session
   - View and edit existing sessions
   - Delete sessions with cascade to related data

3. **Media Upload Flow**
   - Upload video/audio files through web interface
   - Store files in Supabase storage with proper metadata
   - Generate signed URLs for media access

4. **Clip Management Flow**
   - Create clips within sessions
   - Organize clips with notes and markers
   - Inbox workflow for unassigned clips

5. **Sharing Flow**
   - Generate shareable links for sessions
   - Generate shareable links for individual clips
   - Public access to shared content
   - Response collection for shared clips

### Required UI Components
- Session list and detail views
- Media upload interface
- Clip editor with timeline
- Note and marker management
- Share link generation and management
- Response viewing for shared content

## Finalized Decisions / Edge-case Policies

### Capture and Inbox Policies
- **Quick-save "Later" routing**: Selecting "Later" on the quick-save sheet dismisses the sheet in one tap with no confirmation. If the user entered from the capture-first flow, they are routed to the Inbox screen; from any other entry point, the app returns to the previous screen. The clip remains in the Inbox with no session assignment.
- **Inbox persistence rules**: Clips in the Inbox do not expire or delete automatically. After 48 hours, unorganized clips show a gentle nudge prompt: "You have 3 ideas waiting — want to do something with them?" This is a suggestion, not a warning.
- **Voice memo capture**: Long-press the record button to enter voice-only mode. Release to stop and save as an audio note in the Inbox. Uses the same quick-save sheet as video capture.

### Loop and Session Policies
- **Loop draft persistence**: Draft loop regions are visible in the current session only and do not persist across reload unless the user explicitly taps "Done" to save them. Multiple non-overlapping regions can coexist on the repetition track.
- **Loop gap tolerance**: Target seamless loop gap ≤ 50ms. Requires pre-buffering the loop start 100ms before loop end. Fallback behavior: brief visual flash instead of audio stutter if target cannot be met.

### Offline and Connectivity Policies
- **Upload queue behavior**: Clips are locally saved and visible in the section workspace before upload completes. Upload queue resumes automatically after connectivity is restored.
- **Offline capture**: Camera opens and records within 200ms of tapping "Record" with no loading screen. Clip saves to Inbox within 500ms of stopping recording, regardless of connectivity.

### Share and Revocation Policies
- **Share link generation**: One-tap share link generation requires no configuration, brief, or version label. Links are generated immediately for both sessions and clips.
- **Revoked share behavior**: When a share is revoked, the share token becomes invalid immediately. Public access to shared content is terminated, but existing responses remain visible to the owner.
- **Lightweight share constraints**: Viewers can only respond to "What stayed with you?" - no opinions, no ratings, no open comments. Responses arrive in a simple list under the clip.

### Voice Memo and Music Resume Policies
- **Voice memo playback**: Voice memo note pins do not auto-play when timeline passes during playback. They only play on explicit tap to avoid disruption in quiet studio environments.
- **Music resume behavior**: When recording stops, music playback resumes at the position where it left off, maintaining creative flow without manual restart.

## Acceptance Criteria Summary

### Functional Requirements
- [ ] Users can authenticate and manage their accounts
- [ ] Sessions can be created, read, updated, and deleted
- [ ] Media files upload successfully and are accessible
- [ ] Clips can be created and associated with sessions
- [ ] Notes and markers can be added to clips
- [ ] Share links work for both sessions and clips
- [ ] Inbox workflow handles unassigned media
- [ ] All API endpoints return proper error responses

### Technical Requirements
- [ ] API endpoints match server implementation in `supabase/functions/server/index.tsx`
- [ ] Authentication uses Supabase Auth with proper token handling
- [ ] Storage uses configured bucket with 500MB file limit
- [ ] KV store patterns follow existing key conventions
- [ ] CORS configuration supports web client access
- [ ] Error handling follows established patterns

### Performance Requirements
- [ ] File uploads complete within reasonable time limits
- [ ] Session and clip loading performs well with moderate data
- [ ] Share link resolution is fast for public access

## Required Data/API Surface

### Authentication Endpoints
- `POST /make-server-837ff822/auth/signup` - User registration
- `POST /make-server-837ff822/auth/reset-password` - Password reset

### Session Management Endpoints
- `GET /make-server-837ff822/sessions` - List user sessions
- `GET /make-server-837ff822/sessions/:id` - Get specific session
- `POST /make-server-837ff822/sessions` - Create new session
- `PUT /make-server-837ff822/sessions/:id` - Update session
- `DELETE /make-server-837ff822/sessions/:id` - Delete session

### Clip Management Endpoints
- `GET /make-server-837ff822/sessions/:sessionId/clips` - List session clips
- `POST /make-server-837ff822/sessions/:sessionId/clips` - Create clip
- `DELETE /make-server-837ff822/sessions/:sessionId/clips/:clipId` - Delete clip

### Note and Marker Endpoints
- `GET /make-server-837ff822/sessions/:sessionId/notes` - List notes
- `POST /make-server-837ff822/sessions/:sessionId/notes` - Create note
- `PUT /make-server-837ff822/sessions/:sessionId/notes/:noteId` - Update note
- `DELETE /make-server-837ff822/sessions/:sessionId/notes/:noteId` - Delete note
- `GET /make-server-837ff822/sessions/:sessionId/marks` - List floor marks
- `POST /make-server-837ff822/sessions/:sessionId/marks` - Create mark
- `PUT /make-server-837ff822/sessions/:sessionId/marks/:markId` - Update mark
- `DELETE /make-server-837ff822/sessions/:sessionId/marks/:markId` - Delete mark

### Loop Region Endpoints
- `GET /make-server-837ff822/sessions/:sessionId/loops` - List loops
- `POST /make-server-837ff822/sessions/:sessionId/loops` - Create loop
- `PUT /make-server-837ff822/sessions/:sessionId/loops/:loopId` - Update loop
- `DELETE /make-server-837ff822/sessions/:sessionId/loops/:loopId` - Delete loop

### Sharing Endpoints
- `POST /make-server-837ff822/sessions/:sessionId/share` - Generate session share
- `DELETE /make-server-837ff822/sessions/:sessionId/share` - Revoke session share
- `POST /make-server-837ff822/sessions/:sessionId/clips/:clipId/share` - Generate clip share
- `DELETE /make-server-837ff822/sessions/:sessionId/clips/:clipId/share` - Revoke clip share
- `GET /make-server-837ff822/share/:token` - Resolve share token (public)
- `POST /make-server-837ff822/share/:token/response` - Submit response
- `GET /make-server-837ff822/sessions/:sessionId/clips/:clipId/responses` - Get responses

### Inbox Endpoints
- `GET /make-server-837ff822/inbox` - List unassigned clips
- `POST /make-server-837ff822/inbox` - Save clip to inbox
- `PATCH /make-server-837ff822/inbox/:clipId/assign` - Assign to session
- `DELETE /make-server-837ff822/inbox/:clipId` - Delete inbox clip

### Storage Endpoints
- `POST /make-server-837ff822/upload` - Upload media file

### Data Models
- **Session**: Core choreography container with metadata
- **Clip**: Media segment with video/audio URLs and metadata
- **Note**: Text annotations attached to clips
- **Mark**: Position markers for choreography timing
- **Loop**: Repeating regions within clips
- **Share**: Public access tokens with expiration
- **Inbox**: Unassigned media waiting for session organization

## Run/Test Notes

### Local Development Setup (Web Prototype)
```bash
# Environment variables required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start web development server (run from project root directory)
pnpm dev

# Health check verification (after server starts)
curl http://localhost:5173/
```

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous key for client operations

### Deployment Notes
- Server runs on Deno with Hono framework
- Uses Supabase for database and storage
- KV store for session data persistence
- CORS configured for web client access
- File upload limit: 500MB per file
- Signed URLs valid for 1 year

### API Contract Alignment
All endpoints must follow the patterns established in `supabase/functions/server/index.tsx`:
- Use `/make-server-837ff822/` prefix for all routes
- Implement proper authentication checks via `getAuthenticatedUserId`
- Follow existing error handling and response patterns
- Use KV store with established key patterns (`session:${userId}:${sessionId}`)
- Maintain user-scoped data isolation
