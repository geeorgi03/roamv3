# Roam Choreography App - Complete Project Plan

**Version:** Consolidated v2.1  
**Last Updated:** March 2026  
**Audience:** All Project Stakeholders  

---

## Executive Summary

**Roam** is a mobile-first choreography app designed to help dancers and choreographers capture, organize, and refine their creative work. The core mission is captured in one sentence:

> **"Roam remembers so the choreographer doesn't have to."**

Every feature exists to serve that sentence. If a proposed feature adds administrative work, it does not ship.

### The Problem Roam Solves

Choreographers currently face several pain points:
1. **Scattered tools** — Ideas live in voice memos, videos in camera rolls, notes in random apps
2. **Music-first friction** — Most tools require setting up a song before you can capture anything
3. **Lost context** — Which video was for which section? What was that note about?
4. **Feedback chaos** — Sharing rough work leads to unstructured, often unhelpful opinions

### The Solution

Roam provides:
- **Capture-first entry** — Record ideas instantly, organize later
- **Session workbench** — All creation tools in one unified timeline view
- **Voice-first notes** — Pin thoughts at timecodes without breaking creative flow
- **Structured feedback** — Share work with guided critique (Liz Lerman method)
- **Formation mapping** — Visual floor marks for dancer positioning

---

## Product Vision & Design Philosophy

### Design Principles

Choreographers are deeply allergic to tools that make their work feel like paperwork. Roam's interface should feel like a very good assistant: always in the room, never speaks unless asked, never loses anything.

| Principle | Implementation |
|-----------|----------------|
| **Notes are blank lines, not forms** | A choreographer writes "this section should feel like dragging something heavy through water" and it lives at a timecode. No fields. No categories. |
| **Clips feel like a shoebox of ideas** | Retrieval is powerful; capture is frictionless |
| **Formation mapping feels like tape on a floor** | Fast, physical, disposable, revisable |
| **Structure lives in infrastructure** | Search, retrieval, versioning happen automatically — never paperwork |

### What Roam Is NOT

- **Not a full video editor** — Basic trim/crop/mirror only. Not CapCut.
- **Not a notation system** — No Labanotation or formal movement encoding
- **Not a 3D simulator** — Formation mapping is 2D top-down only
- **Not a social platform** — Functional sharing, not follower counts
- **Not a teaching platform** — Post-V2 consideration

---

## User Personas & Validation

### Primary Personas

#### 1. Dancer-Maker (72% of barrier issues)
**Profile:** Creates movement from personal impulse. Has ideas before having songs.
**Key Need:** Capture something in their body *right now* without setup friction.
**Current Workaround:** Record to camera roll, lose context, forget which video was which.
**Roam Solution:** Capture-first entry — one tap to record, zero setup required.

#### 2. Working Choreographer (46% showed note friction)
**Profile:** Directs pieces for companies/shows. Works with music, dancers, deadlines.
**Key Need:** Keep track of sections, versions, and feedback across rehearsals.
**Current Workaround:** Notes app + camera roll + shared drives + mental memory.
**Roam Solution:** Session workbench with multi-track timeline, voice notes, structured feedback.

### Simulation Results (200 Sessions Tested)

| Metric | V2.0 | V2.1 | Change |
|--------|------|------|--------|
| Combined strong fit | ~42% | **~63%** | +21pp |
| Music-first barrier (dancers) | ~72% | **~10%** | After Fix 1 |
| Note friction (professionals) | ~46% | **~17%** | After Fix 2 |
| Tool anxiety (dancers) | ~64% | **~24%** | After fixes |

---

## Product Phases & Roadmap

### Phase Overview

| Phase | Name | Core Deliverable | Trigger to Ship |
|-------|------|------------------|-----------------|
| **0** | Capture-First Entry | One-tap recording + Inbox | Camera < 200ms, assign in < 3 taps |
| **1** | Session Workbench | Multi-track timeline + repetition tool | Workbench load < 1.5s, loop-to-record validated |
| **2** | Micro-cycle | Loop → Capture → Tag workflow | Capture-to-tag < 10s |
| **3** | Cleaning/Review | Frame-level review + A/B comparison | Frame step accurate |
| **4** | Structured Collaboration | Liz Lerman-style guided feedback | Brief creation < 2 min |
| **5** | Formation Mapping | Floor marks + path animations | 6-dancer formation < 30s |

### Phase 0: Capture-First Entry (In Development)

#### The Two-Door Home Screen

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

#### Key Features
- **One-tap capture** — Camera opens within 200ms
- **Inbox** — Holding area for unorganized clips (no expiry)
- **Quick-save sheet** — "Add to session?" with Later/New/Existing options
- **Voice-only capture** — Long-press record for audio-only memo

#### Acceptance Criteria
- [ ] Camera opens within 200ms of tapping "Record"
- [ ] Clip saved to Inbox within 500ms of stopping
- [ ] "Later" dismisses in one tap with no confirmation
- [ ] Inbox visible when it contains at least one clip
- [ ] Clip assigned to session in under 3 taps

### Phase 1: Session Workbench (In Development)

#### Multi-Track Timeline Layout

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

#### Key Features

**Default Timeline Tracks:**
| Track | Icon | Purpose |
|-------|------|---------|
| Waveform + sections | 🎵 | Music with auto-detected sections |
| Note pins | 📝 | Text or voice notes at timecodes |
| Assigned clips | 🎬 | Clips positioned by section |
| Repetition regions | 🔁 | Loop regions for drilling |

**Repetition Tool:**
Three ways to create a loop region:
1. Tap + drag on the repetition track
2. Long-press on waveform → "Set loop region"
3. Tap 🔁 on a section to loop that section

Loop controls: Loop (continuous), Play once, Count (2/4/8/∞)

#### Acceptance Criteria
- [ ] Workbench loads in under 1.5 seconds
- [ ] Tapping section jumps playhead to section start
- [ ] Speed control adjusts audio in real time
- [ ] Note pin saved within 300ms
- [ ] Loop region created by drag in under 3 seconds
- [ ] Active loop plays seamlessly (gap ≤ 50ms)

---

## Technical Architecture

### System Overview

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

### Tech Stack Deep Dive

#### Monorepo Structure
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

#### Mobile App (`apps/mobile`)
| Technology | Purpose |
|------------|---------|
| **Expo** | React Native framework, single codebase for iOS/Android |
| **Expo Router** | File-based routing (`app/(app)/session/[id].tsx`) |
| **Supabase Auth** | Email/password authentication |
| **expo-av** | Audio playback with rate control |
| **expo-camera** | Video recording |
| **@gorhom/bottom-sheet** | Modal sheets (Share, Capture, Tag) |
| **SQLite** | Local clip storage before sync |

#### Backend API (`apps/api`)
| Technology | Purpose |
|------------|---------|
| **Hono** | Lightweight web framework |
| **Supabase Service Role** | Full DB access for server operations |
| **Mux SDK** | Video upload URL generation |
| **Stripe SDK** | Subscription management |

#### Web App (`apps/web`)
| Technology | Purpose |
|------------|---------|
| **Next.js** | Server-side rendering, App Router |
| **@mux/mux-player-react** | Video playback |
| **Tailwind CSS** | Styling |

#### Music Analysis Worker (`roam-music`)
| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Runtime |
| **Essentia** | Audio analysis (BPM, beat grid) |
| **Supabase Storage** | Audio file access |

---

## Data Models & Database Schema

### Core Types

#### User
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

#### Session
```typescript
interface Session {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: ISODateTime;
}
```

#### Clip
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

#### MusicTrack
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
```

#### Note Pin (Annotation)
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

---

## API Reference Summary

### Authentication
All authenticated endpoints require: `Authorization: Bearer <supabase_jwt>`

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions` | List user's sessions |
| POST | `/sessions` | Create new session |
| GET | `/sessions/:id` | Get session details |
| GET/POST | `/sessions/:sessionId/clips` | List/create session clips |
| POST | `/clips/upload-url` | Get Mux TUS upload URL |
| POST | `/sessions/:id/music` | Upload music file or set YouTube URL |
| GET/PUT | `/sessions/:id/assembly` | Get/put section-clip assignments |
| POST/DELETE | `/sessions/:id/share` | Create/revoke share token |
| GET/POST | `/sessions/:id/note-pins` | List/create note pins |
| GET | `/library` | Search/filter clips (paginated) |
| GET/POST | `/billing/me`, `/billing/checkout` | Plan and Stripe |
| POST | `/webhooks/mux`, `/webhooks/stripe` | Incoming webhooks |

---

## Core User Flows

### Flow 1: Capture-First Entry
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

### Flow 2: Session Workbench Navigation
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

---

## Current Implementation State

### What's Working ✅
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

### In Progress 🔄 (Phase 0/1)
| Feature | Status | Notes |
|---------|--------|-------|
| Two-door home screen | 🔄 | UI implemented |
| Quick-save sheet | 🔄 | Post-capture flow |
| Loop regions | 🔄 | Basic implementation |
| Voice note inline playback | 🔄 | Flow 6b |
| Repetition region drag | 🔄 | Flow 8 |

### Known Gaps ⚠️
1. **Audio bucket** must be created manually in Supabase
2. **Mux credentials** must be configured
3. **ROAM_BETA_UNLOCK=true** required for soft launch (bypasses plan limits)
4. **Stripe** is deferred for soft launch

---

## Deployment & Production Readiness

### Environment Requirements

#### Development Setup
- **Node.js** 20+, **pnpm** 9+, **Python** 3.11+ (for roam-music)
- **Expo** CLI and **EAS** for mobile builds
- **Supabase project** with migrations applied, Auth enabled

#### Required Environment Variables
- **API**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SHARE_BASE_URL, ROAM_BETA_UNLOCK=true, PORT=3001, MUX_*, STRIPE_*
- **Mobile**: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL
- **Web**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **roam-music**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

### Deployment Architecture
- **API**: Render or similar (port 3001)
- **Web**: Vercel or similar
- **roam-music**: Railway or long-running process
- **Mobile**: EAS Build (preview/production)

### Beta Unlock Configuration
For soft launch, set `ROAM_BETA_UNLOCK=true` in API environment. This bypasses:
- Session limit
- Clip limit  
- Music upload restriction

**Must be disabled before public launch.**

---

## Plans, Limits, and Billing

### Subscription Plans
- **Plans:** free, creator, pro, studio (stored in `users.plan`)
- **Free plan limits** (when not bypassed): 3 sessions, 20 clips total, no music file upload (YouTube allowed)
- **Plan gates** enforced by API middleware (`checkSessionLimit`, `evaluateClipLimit`, `checkMusicSegmentation`)

### Billing Integration
- **Stripe** handles checkout and customer portal
- **Webhooks** update `users.plan` and subscription state
- **Deferred for soft launch**; beta unlock bypasses gates

---

## External Services Integration

### Supabase
**Role:** Database, Auth, Storage
| Feature | Usage |
|---------|-------|
| PostgreSQL | All data tables |
| Auth | Email/password sign-in |
| Storage | `audio` bucket for music files |
| RLS | Row-level security for user data isolation |
| RPCs | `get_shared_session(token)` for public share page |

### Mux
**Role:** Video upload, encoding, CDN playback
| Flow | Description |
|------|-------------|
| Upload | API issues TUS upload URL → mobile uploads directly to Mux |
| Webhook | Mux sends `asset.ready` → API updates `upload_status` |
| Playback | `mux_playback_id` used in video player |

### Stripe
**Role:** Subscriptions and billing
| Flow | Description |
|------|-------------|
| Checkout | API creates Stripe Checkout session → user redirected |
| Portal | API creates Customer Portal session for subscription management |
| Webhook | Stripe sends events → API updates `users.plan` |

---

## Glossary

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

## Next Steps & Development Priorities

### Immediate (Phase 0/1 Completion)
1. ✅ Test authentication flow
2. ✅ Create a test session  
3. ⏳ Complete two-door home screen
4. ⏳ Finish quick-save sheet implementation
5. ⏳ Complete loop regions functionality
6. ⏳ Add voice note inline playback

### Short-term (Phase 2-3)
1. Micro-cycle workflow optimization
2. Frame-level review and A/B comparison
3. Advanced repetition features
4. Performance optimization

### Long-term (Phase 4-5)
1. Structured collaboration features
2. Formation mapping system
3. Advanced music intelligence
4. Teaching workflow support

---

## Testing & Quality Assurance

### Smoke Test Matrix
- **Authentication**: Sign up, sign in, password reset
- **Session Management**: Create, edit, delete sessions
- **Media Upload**: Video capture, file upload, YouTube import
- **Music Analysis**: BPM detection, section generation
- **Clip Management**: Tagging, organization, search
- **Sharing**: Link generation, public access, feedback
- **Cross-platform**: iOS, Android, web compatibility

### Performance Requirements
- Camera opens within 200ms of tapping "Record"
- Clip saved to Inbox within 500ms of stopping recording
- Workbench loads in under 1.5 seconds
- Active loop plays seamlessly (gap ≤ 50ms)
- Share link resolution is fast for public access

---

This consolidated document provides a complete overview of the Roam project from product vision to technical implementation, serving as the single source of truth for all stakeholders involved in the development process.
