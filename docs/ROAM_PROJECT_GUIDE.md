# Roam Project Guide
## Complete Technical & Product Overview

**Version:** 1.0  
**Last Updated:** March 2026  
**Audience:** Developers, Product Managers, Stakeholders

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Design Philosophy](#2-product-vision--design-philosophy)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [Product Phases Overview](#4-product-phases-overview)
5. [Technical Architecture](#5-technical-architecture)
6. [Tech Stack Deep Dive](#6-tech-stack-deep-dive)
7. [Data Models & Database Schema](#7-data-models--database-schema)
8. [API Reference](#8-api-reference)
9. [Mobile App Structure](#9-mobile-app-structure)
10. [Core User Flows](#10-core-user-flows)
11. [Key Components](#11-key-components)
12. [External Services Integration](#12-external-services-integration)
13. [Current Implementation State](#13-current-implementation-state)
14. [Glossary](#14-glossary)

---

# 1. Executive Summary

## What Is Roam?

**Roam** is a mobile-first choreography app designed to help dancers and choreographers capture, organize, and refine their creative work. The core mission is captured in one sentence:

> **"Roam remembers so the choreographer doesn't have to."**

Every feature exists to serve that sentence. If a proposed feature adds administrative work, it does not ship.

## The Problem Roam Solves

Choreographers currently face several pain points:

1. **Scattered tools** — Ideas live in voice memos, videos in camera rolls, notes in random apps
2. **Music-first friction** — Most tools require setting up a song before you can capture anything
3. **Lost context** — Which video was for which section? What was that note about?
4. **Feedback chaos** — Sharing rough work leads to unstructured, often unhelpful opinions

## The Solution

Roam provides:

- **Capture-first entry** — Record ideas instantly, organize later
- **Session workbench** — All creation tools in one unified timeline view
- **Voice-first notes** — Pin thoughts at timecodes without breaking creative flow
- **Structured feedback** — Share work with guided critique (Liz Lerman method)
- **Formation mapping** — Visual floor marks for dancer positioning

---

# 2. Product Vision & Design Philosophy

## Design Principles

Choreographers are deeply allergic to tools that make their work feel like paperwork. Roam's interface should feel like a very good assistant: always in the room, never speaks unless asked, never loses anything.

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Notes are blank lines, not forms** | A choreographer writes "this section should feel like dragging something heavy through water" and it lives at a timecode. No fields. No categories. |
| **Clips feel like a shoebox of ideas** | Retrieval is powerful; capture is frictionless |
| **Formation mapping feels like tape on a floor** | Fast, physical, disposable, revisable |
| **Structure lives in infrastructure** | Search, retrieval, versioning happen automatically — never paperwork |

## What Roam Is NOT

- **Not a full video editor** — Basic trim/crop/mirror only. Not CapCut.
- **Not a notation system** — No Labanotation or formal movement encoding
- **Not a 3D simulator** — Formation mapping is 2D top-down only
- **Not a social platform** — Functional sharing, not follower counts
- **Not a teaching platform** — Post-V2 consideration

---

# 3. User Personas & Use Cases

## Primary Personas

### 1. Dancer-Maker (72% of barrier issues)

**Profile:** Creates movement from personal impulse. Has ideas before having songs.

**Key Need:** Capture something in their body *right now* without setup friction.

**Current Workaround:** Record to camera roll, lose context, forget which video was which.

**Roam Solution:** Capture-first entry — one tap to record, zero setup required.

### 2. Working Choreographer (46% showed note friction)

**Profile:** Directs pieces for companies/shows. Works with music, dancers, deadlines.

**Key Need:** Keep track of sections, versions, and feedback across rehearsals.

**Current Workaround:** Notes app + camera roll + shared drives + mental memory.

**Roam Solution:** Session workbench with multi-track timeline, voice notes, structured feedback.

## Simulation Results (200 Sessions Tested)

| Metric | V2.0 | V2.1 | Change |
|--------|------|------|--------|
| Combined strong fit | ~42% | **~63%** | +21pp |
| Music-first barrier (dancers) | ~72% | **~10%** | After Fix 1 |
| Note friction (professionals) | ~46% | **~17%** | After Fix 2 |
| Tool anxiety (dancers) | ~64% | **~24%** | After fixes |

---

# 4. Product Phases Overview

## Phase Roadmap

| Phase | Name | Core Deliverable | Trigger to Ship |
|-------|------|------------------|-----------------|
| **0** | Capture-First Entry | One-tap recording + Inbox | Camera < 200ms, assign in < 3 taps |
| **1** | Session Workbench | Multi-track timeline + repetition tool | Workbench load < 1.5s, loop-to-record validated |
| **2** | Micro-cycle | Loop → Capture → Tag workflow | Capture-to-tag < 10s |
| **3** | Cleaning/Review | Frame-level review + A/B comparison | Frame step accurate |
| **4** | Structured Collaboration | Liz Lerman-style guided feedback | Brief creation < 2 min |
| **5** | Formation Mapping | Floor marks + path animations | 6-dancer formation < 30s |

---

## Phase 0: Capture-First Entry (In Development)

### The Two-Door Home Screen

```
┌─────────────────────────────────────────────┐
│                                             │
│                  ROAM                       │
│                                             │
│        ┌─────────────────────────┐          │
│        │    ◉  Record            │          │
│        │    Capture something    │          │
│        └─────────────────────────┘          │
│                                             │
│        ┌─────────────────────────┐          │
│        │    ♫  Start a session   │          │
│        │    I have a song        │          │
│        └─────────────────────────┘          │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Features

- **One-tap capture** — Camera opens within 200ms
- **Inbox** — Holding area for unorganized clips (no expiry)
- **Quick-save sheet** — "Add to session?" with Later/New/Existing options
- **Voice-only capture** — Long-press record for audio-only memo

### Acceptance Criteria

- [ ] Camera opens within 200ms of tapping "Record"
- [ ] Clip saved to Inbox within 500ms of stopping
- [ ] "Later" dismisses in one tap with no confirmation
- [ ] Inbox visible when it contains at least one clip
- [ ] Clip assigned to session in under 3 taps

---

## Phase 1: Session Workbench (In Development)

### Multi-Track Timeline Layout

```
┌─────────────────────────────────────────────┐
│  [Session name]              [Share] [⋮]    │
├─────────────────────────────────────────────┤
│                                             │
│   MULTI-TRACK TIMELINE                      │
│ 🎵 [████░░░░░████░░░░░████░░░░░░░░░░░░░░]  │  ← music waveform
│ 📝 [──●─────────●────●──────────────────]  │  ← note pins
│ 🎬 [░░░[clip1]░░░░[clip2]░░░░░░░░░░░░░░]  │  ← clips
│ 🔁 [      ●━━━━━━━●                      ]  │  ← loop regions
│                                             │
│   intro    verse 1   chorus    verse 2      │
│   [◄◄] [▶] [0.75x] [Mirror] [+ Track]      │
│                                             │
├─────────────────────────────────────────────┤
│   SECTION WORKSPACE                         │
│   Section: Chorus (0:42 – 1:10)             │
│   [📎 Clip 1]  [📎 Clip 2]                  │
│   + Add clip to this section                │
├─────────────────────────────────────────────┤
│  [Ideas]  [Notes]  [Review]  [Share]        │
└─────────────────────────────────────────────┘
```

### Key Features

#### Default Timeline Tracks

| Track | Icon | Purpose |
|-------|------|---------|
| Waveform + sections | 🎵 | Music with auto-detected sections |
| Note pins | 📝 | Text or voice notes at timecodes |
| Assigned clips | 🎬 | Clips positioned by section |
| Repetition regions | 🔁 | Loop regions for drilling |

#### Repetition Tool

Three ways to create a loop region:
1. Tap + drag on the repetition track
2. Long-press on waveform → "Set loop region"
3. Tap 🔁 on a section to loop that section

Loop controls: Loop (continuous), Play once, Count (2/4/8/∞)

#### Additional Optional Tracks

- Reference video (synced playback)
- Lyrics (scrolling text aligned to timecode)
- Counts/8-count grid
- Music Intelligence (chords + melodic contour)

### Acceptance Criteria

- [ ] Workbench loads in under 1.5 seconds
- [ ] Tapping section jumps playhead to section start
- [ ] Speed control adjusts audio in real time
- [ ] Note pin saved within 300ms
- [ ] Loop region created by drag in under 3 seconds
- [ ] Active loop plays seamlessly (gap ≤ 50ms)

---

# 5. Technical Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│    REST API     │────▶│   Supabase      │
│  (Expo/React    │     │  (Node/Hono)    │     │  (PostgreSQL)   │
│   Native)       │     │   Port 3001     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Mux        │     │    Stripe       │     │  roam-music     │
│  (Video CDN)    │     │  (Payments)     │     │ (Python Worker) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Data Flow

### Choreographer Flow (Mobile)

1. Sign in (Supabase Auth)
2. Create session (API)
3. Add music (API + storage; worker analyzes)
4. Record/import clips (API + Mux upload)
5. Tag clips (API)
6. Assign clips to sections (API)
7. Share (API creates token)
8. View feedback (API)

### Viewer Flow (Web)

1. Open share link
2. Next.js loads `get_shared_session(token)` from Supabase
3. Renders session name, music, clips
4. Submit comment via API `POST /feedback` with share_token

---

# 6. Tech Stack Deep Dive

## Monorepo Structure

```
roam/
├── apps/
│   ├── mobile/          # Expo / React Native app
│   ├── api/             # Node.js + Hono backend
│   └── web/             # Next.js share site
├── packages/
│   ├── db/              # Supabase client helpers
│   ├── types/           # Shared TypeScript types
│   └── shared-types/    # Zod validation schemas
└── roam-music/          # Python audio analysis worker
```

## Mobile App (`apps/mobile`)

| Technology | Purpose |
|------------|---------|
| **Expo** | React Native framework, single codebase for iOS/Android |
| **Expo Router** | File-based routing (`app/(app)/session/[id].tsx`) |
| **Supabase Auth** | Email/password authentication |
| **expo-av** | Audio playback with rate control |
| **expo-camera** | Video recording |
| **@gorhom/bottom-sheet** | Modal sheets (Share, Capture, Tag) |
| **SQLite** | Local clip storage before sync |

### Key Directories

```
apps/mobile/
├── app/
│   ├── (app)/              # Authenticated screens
│   │   ├── index.tsx       # Home screen
│   │   ├── inbox.tsx       # Inbox screen
│   │   ├── library.tsx     # Library screen
│   │   ├── profile.tsx     # Profile screen
│   │   └── session/
│   │       ├── [id].tsx    # Session workbench
│   │       ├── camera.tsx  # Capture camera
│   │       ├── music-setup.tsx
│   │       └── beat-grid.tsx
│   └── auth/               # Auth screens
├── components/             # Reusable UI components
├── lib/
│   ├── hooks/              # Data fetching hooks
│   ├── api.ts              # API client
│   └── supabase.ts         # Supabase client
└── services/
    └── uploadQueue.ts      # Video upload queue
```

## Backend API (`apps/api`)

| Technology | Purpose |
|------------|---------|
| **Hono** | Lightweight web framework |
| **Supabase Service Role** | Full DB access for server operations |
| **Mux SDK** | Video upload URL generation |
| **Stripe SDK** | Subscription management |

### Route Structure

```
apps/api/src/
├── index.ts                # Server bootstrap
├── routes/
│   ├── sessions.ts         # Session CRUD
│   ├── clips.ts            # Clip CRUD
│   ├── music.ts            # Music upload/YouTube
│   ├── assembly.ts         # Section-clip assignments
│   ├── share.ts            # Share token management
│   ├── notePins.ts         # Voice/text notes
│   ├── feedback.ts         # Feedback requests (auth)
│   ├── feedbackPublic.ts   # Public comment submit
│   ├── library.ts          # Cross-session clip search
│   ├── billing.ts          # Stripe integration
│   └── webhooks.ts         # Mux/Stripe webhooks
├── middleware/
│   └── auth.ts             # JWT validation
└── lib/
    ├── supabase.ts         # DB client
    ├── planGate.ts         # Plan limit enforcement
    └── stripe.ts           # Stripe helpers
```

## Web App (`apps/web`)

| Technology | Purpose |
|------------|---------|
| **Next.js** | Server-side rendering, App Router |
| **@mux/mux-player-react** | Video playback |
| **Tailwind CSS** | Styling |

### Share Page

```
apps/web/app/s/[token]/
├── page.tsx           # Main share page (SSR)
├── MusicPlayer.tsx    # Audio player component
└── ClipPlayer.tsx     # Video player component
```

## Music Analysis Worker (`roam-music`)

| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Runtime |
| **Essentia** | Audio analysis (BPM, beat grid) |
| **Supabase Storage** | Audio file access |

### Worker Flow

1. Poll DB for `analysis_status = 'pending'`
2. Download audio from Supabase `audio` bucket
3. Run Essentia RhythmExtractor2013
4. Derive beat grid + sections from energy/RMS
5. Write BPM, beat_grid, sections, `analysis_status = 'complete'`

---

# 7. Data Models & Database Schema

## Core Types (from `@roam/types`)

### User

```typescript
interface User {
  id: UUID;
  email: string;
  plan: 'free' | 'creator' | 'pro' | 'studio';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: ISODateTime;
}
```

### Session

```typescript
interface Session {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: ISODateTime;
}
```

### Clip

```typescript
interface Clip {
  id: UUID;
  user_id: UUID;
  session_id: UUID | null;  // null = Inbox
  label: string | null;
  mux_upload_id: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
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

type UploadStatus = 'local' | 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';
```

### MusicTrack

```typescript
interface MusicTrack {
  id: UUID;
  session_id: UUID;
  source_type: 'upload' | 'youtube';
  source_url: string | null;
  storage_path: string | null;
  bpm: number | null;
  beat_grid: BeatGridEntry[] | null;
  sections: SectionEntry[] | null;
  analysis_status: 'pending' | 'processing' | 'complete' | 'failed';
}

interface BeatGridEntry {
  time_ms: number;
  beat_number: number;
  is_downbeat: boolean;
}

interface SectionEntry {
  label: string;
  start_ms: number;
}
```

### Note Pin (Annotation)

```typescript
interface NotePin {
  id: UUID;
  session_id: UUID;
  user_id: UUID;
  timecode_ms: number;
  text: string | null;
  audio_storage_path: string | null;  // Voice memo
  color: string | null;
  created_at: ISODateTime;
}
```

### Loop Region (Phase 1)

```typescript
interface LoopRegion {
  id: UUID;
  session_id: UUID;
  label: string;
  color: string;
  start_ms: number;
  end_ms: number;
  count_limit: number | null;  // null = infinite
  created_at: ISODateTime;
}
```

### Section Clip (Assembly)

```typescript
interface SectionClip {
  id: UUID;
  session_id: UUID;
  section_label: string;
  section_start_ms: number;
  clip_id: UUID;
  position: number;
  created_at: ISODateTime;
}
```

### Share Token

```typescript
interface ShareToken {
  id: UUID;
  session_id: UUID;
  token: string;  // UUID
  revoked_at: ISODateTime | null;
  created_at: ISODateTime;
}
```

### Feedback

```typescript
interface FeedbackRequest {
  id: UUID;
  clip_id: UUID;
  session_id: UUID;
  status: 'open' | 'closed';
  created_at: ISODateTime;
}

interface ClipComment {
  id: UUID;
  clip_id: UUID;
  session_id: UUID;
  timecode_ms: number;
  text: string;
  commenter_name: string | null;
  created_at: ISODateTime;
}
```

---

# 8. API Reference

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <supabase_jwt>
```

## Endpoints Summary

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions` | List user's sessions |
| POST | `/sessions` | Create new session |
| GET | `/sessions/:id` | Get session details |

### Clips

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions/:sessionId/clips` | List session clips |
| POST | `/sessions/:sessionId/clips` | Create clip record |
| GET | `/sessions/:sessionId/clips/:clipId` | Get clip details |
| PATCH | `/sessions/:sessionId/clips/:clipId` | Update clip |
| POST | `/clips/upload-url` | Get Mux TUS upload URL |
| PATCH | `/clips/:id/tags` | Update clip tags |

### Music

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/:id/music` | Upload music file or set YouTube URL |
| PATCH | `/sessions/:id/music` | Update music settings |

### Assembly

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions/:id/assembly` | Get section-clip assignments |
| PUT | `/sessions/:id/assembly` | Update assignments |

### Share

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/:id/share` | Create share token |
| DELETE | `/sessions/:id/share` | Revoke share token |

### Note Pins

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions/:id/note-pins` | List note pins |
| POST | `/sessions/:id/note-pins` | Create note pin |
| DELETE | `/sessions/:id/note-pins/:pinId` | Delete note pin |

### Inbox

| Method | Path | Description |
|--------|------|-------------|
| GET | `/inbox` | List inbox clips |
| GET | `/inbox/count` | Get inbox count |

### Feedback

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clips/:id/feedback-requests` | List feedback requests |
| POST | `/clips/:id/feedback-requests` | Open feedback |
| DELETE | `/clips/:id/feedback-requests/:reqId` | Close feedback |
| GET | `/clips/:id/comments` | List comments |
| POST | `/feedback` | Submit comment (public, uses share_token) |

### Library

| Method | Path | Description |
|--------|------|-------------|
| GET | `/library` | Search/filter clips (paginated) |

### Billing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/billing/me` | Get current plan |
| POST | `/billing/checkout` | Create Stripe checkout |
| POST | `/billing/portal` | Create customer portal session |

### Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/mux` | Mux asset events |
| POST | `/webhooks/stripe` | Stripe subscription events |

---

# 9. Mobile App Structure

## Screen Routing (Expo Router)

```
app/
├── _layout.tsx              # Root layout
├── auth/
│   ├── _layout.tsx          # Auth layout
│   ├── sign-in.tsx          # Sign in screen
│   ├── sign-up.tsx          # Sign up screen
│   └── callback.tsx         # OAuth callback
└── (app)/
    ├── _layout.tsx          # Authenticated layout
    ├── index.tsx            # Home screen
    ├── inbox.tsx            # Inbox screen
    ├── library.tsx          # Library screen
    ├── profile.tsx          # Profile screen
    └── session/
        ├── [id].tsx         # Session workbench ⭐
        ├── camera.tsx       # Capture camera
        ├── clip-player.tsx  # Full-screen clip playback
        ├── music-setup.tsx  # Add music
        ├── beat-grid.tsx    # Beat grid editor
        └── youtube-player.tsx
```

## Key Components

### Bottom Sheets

| Component | File | Purpose |
|-----------|------|---------|
| ShareSheet | `components/ShareSheet.tsx` | Share session link |
| CaptureSheet | `components/CaptureSheet.tsx` | Record/Import options |
| NotePinSheet | `components/NotePinSheet.tsx` | Create/edit note |
| TagSheet | `components/TagSheet.tsx` | Edit clip tags |
| ClipShareSheet | `components/ClipShareSheet.tsx` | Share individual clip |
| QuickSaveSheet | `components/QuickSaveSheet.tsx` | Post-capture save options |

### Data Hooks

| Hook | File | Purpose |
|------|------|---------|
| useSession | `lib/hooks/useSession.ts` | Current auth session |
| useClips | `lib/hooks/useClips.ts` | Session clips |
| useInbox | `lib/hooks/useInbox.ts` | Inbox clips & count |
| useNotePins | `lib/hooks/useNotePins.ts` | Note pins CRUD |
| useMusicTrackStatus | `lib/hooks/useMusicTrackStatus.ts` | Music analysis status |
| useShare | `lib/hooks/useShare.ts` | Share token management |

---

# 10. Core User Flows

## Flow 1: Capture-First Entry

```
Home Screen (two doors)
    │
    ├── "Record" tap
    │   └── Camera opens (< 200ms)
    │       └── Recording starts on tap
    │           └── Tap to stop
    │               └── Quick-save sheet appears
    │                   ├── "Later" → Inbox (clip saved)
    │                   ├── "+ New session" → Create session
    │                   └── "Existing →" → Pick session
    │
    └── "Start a session" tap
        └── Session creation flow
```

## Flow 2: Session Workbench Navigation

```
Session Workbench
    │
    ├── Timeline (scrollable, zoomable)
    │   ├── Music track (waveform + sections)
    │   ├── Note pins track
    │   ├── Clips track
    │   └── Loop regions track
    │
    ├── Transport bar
    │   ├── Play/Pause
    │   ├── Seek back/forward
    │   ├── Speed control (0.5x–2x)
    │   ├── Mirror toggle
    │   └── + Track
    │
    └── Section workspace
        ├── Ideas tab (clips grid)
        └── Notes tab (note list)
```

## Flow 6b: Voice Note Playback (New)

```
Notes tab → tap voice note row
    │
    └── Music pauses
        └── Row expands (play/pause + scrub bar)
            └── Memo plays
                └── On end: row collapses, music resumes
```

## Flow 8: Repetition Region (New)

```
Repetition track → drag to create
    │
    └── Live timecode labels appear during drag
        └── Release → inline popover appears
            ├── Name field
            ├── Color swatches
            ├── Count chips (2/4/8/∞)
            └── Done button
                └── Region saved, visible in transport bar
```

---

# 11. Key Components

## Session Workbench (`apps/mobile/app/(app)/session/[id].tsx`)

The main editing screen. Key state:

```typescript
// Playback state
const [isPlaying, setIsPlaying] = useState(false);
const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
const [playheadMs, setPlayheadMs] = useState(0);
const [durationMs, setDurationMs] = useState(0);

// Loop state
const [loopRegion, setLoopRegion] = useState<{start: number; end: number} | null>(null);

// Section state
const [activeSection, setActiveSection] = useState('Section');
const [workspaceTab, setWorkspaceTab] = useState<'ideas' | 'notes'>('ideas');
```

## ClipCard (`apps/mobile/components/ClipCard.tsx`)

Displays a clip thumbnail with status badge.

States:
- `local` — Grey outline, cloud icon
- `uploading` — Progress ring
- `processing` — Spinner
- `ready` — Full thumbnail
- `failed` — Red outline, retry button

## NotePinSheet (`apps/mobile/components/NotePinSheet.tsx`)

Create/edit note pins with:
- Text input
- Voice recording (hold mic button)
- Color picker
- Timecode display

---

# 12. External Services Integration

## Supabase

**Role:** Database, Auth, Storage

| Feature | Usage |
|---------|-------|
| PostgreSQL | All data tables |
| Auth | Email/password sign-in |
| Storage | `audio` bucket for music files |
| RLS | Row-level security for user data isolation |
| RPCs | `get_shared_session(token)` for public share page |

## Mux

**Role:** Video upload, encoding, CDN playback

| Flow | Description |
|------|-------------|
| Upload | API issues TUS upload URL → mobile uploads directly to Mux |
| Webhook | Mux sends `asset.ready` → API updates `upload_status` |
| Playback | `mux_playback_id` used in video player |

## Stripe

**Role:** Subscriptions and billing

| Flow | Description |
|------|-------------|
| Checkout | API creates Stripe Checkout session → user redirected |
| Portal | API creates Customer Portal session for subscription management |
| Webhook | Stripe sends events → API updates `users.plan` |

**Plans:** `free`, `creator`, `pro`, `studio`

**Free Limits (when not in beta):**
- 3 sessions max
- 20 clips max
- No music file upload (YouTube only)

---

# 13. Current Implementation State

## What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (sign up/in) | ✅ | Supabase Auth |
| Sessions CRUD | ✅ | API + mobile |
| Music upload | ✅ | File or YouTube URL |
| Music analysis | ✅ | Worker + BPM/sections |
| Clip record/import | ✅ | Mux upload |
| Clip tagging | ✅ | Full tag sheet |
| Assembly | ✅ | Section-clip assignment |
| Share create/revoke | ✅ | API + mobile |
| Share page | ✅ | Next.js SSR |
| Public feedback | ✅ | Anonymous comments |
| Library search | ✅ | Paginated, filtered |
| Billing endpoints | ✅ | Stripe integration |
| Note pins | ✅ | Text + voice |
| Inbox | ✅ | Unorganized clips |

## In Progress (Phase 0/1)

| Feature | Status | Notes |
|---------|--------|-------|
| Two-door home screen | 🔄 | UI implemented |
| Quick-save sheet | 🔄 | Post-capture flow |
| Loop regions | 🔄 | Basic implementation |
| Voice note inline playback | 🔄 | Flow 6b |
| Repetition region drag | 🔄 | Flow 8 |

## Known Gaps

1. **Audio bucket** must be created manually in Supabase
2. **Mux credentials** must be configured
3. **ROAM_BETA_UNLOCK=true** required for soft launch (bypasses plan limits)
4. **Stripe** is deferred for soft launch

## Beta Unlock

For soft launch, set `ROAM_BETA_UNLOCK=true` in API environment. This bypasses:
- Session limit
- Clip limit
- Music upload restriction

Must be disabled before public launch.

---

# 14. Glossary

| Term | Definition |
|------|------------|
| **Inbox** | Holding area for clips captured without a session |
| **Session** | One choreography project containing clips, music, notes |
| **Workbench** | The main session editing screen with multi-track timeline |
| **Repetition Region** | A loopable section of music for drilling |
| **Note Pin** | Text or voice note attached to a timecode |
| **Quick-save Sheet** | Post-capture prompt to assign clip or save to Inbox |
| **Section** | Auto-detected portion of music (intro, verse, chorus) |
| **Assembly** | The mapping of clips to sections |
| **Share Token** | UUID that grants public access to a session |
| **Feedback Request** | Marks a clip as open for comments |
| **Beat Grid** | Array of beat timestamps with downbeat markers |
| **BPM** | Beats per minute, detected by music analysis |
| **Stem Focus** | Ability to mute/solo vocals/drums/bass/instruments (Phase 1 TBD) |
| **Floor Mark** | A formation snapshot showing dancer positions |
| **Drill Sequence** | Ordered list of loop regions for structured practice |
| **Liz Lerman** | Structured feedback method (What stayed with you? → Questions → Observations → Opinions) |

---

# Appendix: Environment Variables

## API (`apps/api/.env`)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SHARE_BASE_URL=https://your-web-domain.com
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
MUX_WEBHOOK_SECRET=xxx
PORT=3001
ROAM_BETA_UNLOCK=true  # Required for soft launch
# STRIPE_SECRET_KEY=xxx  # Deferred
# STRIPE_WEBHOOK_SECRET=xxx
```

## Mobile (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

## Web (`apps/web/.env`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Worker (`roam-music/.env`)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

*Document generated from Roam V2 PRD, codebase analysis, and implementation guides.*
