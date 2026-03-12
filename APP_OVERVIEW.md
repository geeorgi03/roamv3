# Roam Choreography App — Complete Overview & Tech Guide

**For non-technical readers:** This document explains what the Roam app is, what the finished product looks like, how it works under the hood, and what technologies power it. No coding experience required.

---

## Table of Contents

1. [What Is Roam?](#1-what-is-roam)
2. [What Does the Final App Look Like?](#2-what-does-the-final-app-look-like)
3. [The Three Parts of the System](#3-the-three-parts-of-the-system)
4. [Tech Specs in Plain English](#4-tech-specs-in-plain-english)
5. [Data and Concepts](#5-data-and-concepts)
6. [Plans, Limits, and Billing](#6-plans-limits-and-billing)
7. [How Everything Fits Together](#7-how-everything-fits-together)
8. [What You Need to Run It](#8-what-you-need-to-run-it)
9. [Current State and Gaps](#9-current-state-and-gaps)

---

## 1. What Is Roam?

**Roam** is a **choreography app** for dancers and choreographers. It helps you:

- **Create sessions** — One session = one choreography project (e.g. “Routine for Show 2025”).
- **Add music** — Either upload an audio file or paste a YouTube link. The app figures out the beat grid (BPM, downbeats) and sections (intro, verse, chorus, etc.) so you can align moves to the music.
- **Record or import video clips** — Film yourself doing a move (or import from your gallery), then tag each clip with a move name, style (e.g. Hip-hop, Contemporary), energy level, difficulty, and BPM.
- **Assemble** — Assign clips to sections of the music so you can see “which move goes where” in the timeline.
- **Share** — Generate a link so anyone (dancers, clients, collaborators) can watch the session in a browser: music + clips, without logging in.
- **Collect feedback** — On the share page, viewers can leave time-stamped comments on clips (e.g. “At 0:45, try extending the arm”).

So in one sentence: **Roam is an app to organize your choreography by session, align moves to music, tag and search clips, share a view-only link, and collect feedback.**

---

## 2. What Does the Final App Look Like?

### 2.1 Mobile App (Phone/Tablet) — The Main Experience

The **mobile app** is where choreographers spend most of their time. It’s built with **Expo / React Native**, so it runs on **iOS and Android**.

#### Screens and flows

| Screen / Area | What the user sees and does |
|---------------|-----------------------------|
| **Home** | List of all sessions (name + date). Buttons: Library, Profile, and “+” to create a new session. Empty state: “No sessions yet — Start your first session.” |
| **Library** | Search and filter **all your tagged clips** across every session. Search by text; filter by style (Hip-hop, Contemporary, Ballet, etc.), energy (Low–Explosive), difficulty (Beginner–Advanced), and BPM range. Paginated list; tap a clip to play it. |
| **Profile** | Current plan (Free / Creator / Pro / Studio). “Upgrade” opens Stripe checkout; “Manage subscription” opens Stripe customer portal. Hidden “Developer Settings” (tap plan badge 5×): override API URL for testing. |
| **Session workspace** | Single session view. Two tabs: **Clips** and **Assembly**. |
| **Clips tab** | List of clips in this session. Each card: thumbnail, label, tags (move name, style, energy, difficulty), upload status (e.g. “Processing…”, “Ready”). Long-press a clip → open **Tag** sheet. “Set up music” or “Edit alignment” → music flow. Floating “+” → **Capture** sheet: “Record” (opens camera) or “Import from gallery”. Share button in header → **Share** sheet. |
| **Capture sheet** | Choose “Record” (go to camera) or “Import from gallery” (pick videos). Recorded/imported clips are saved locally first, then queued to upload to the cloud (Mux). |
| **Tag sheet** | Edit move name, style, energy, difficulty, BPM, notes. Saved via API; clip card updates. |
| **Share sheet** | Copy share link (e.g. `https://yoursite.com/s/abc-123-...`) or revoke the link. Shows session name and whether music/clips are present. |
| **Music setup** | Add music: either **upload a file** or **paste a YouTube URL**. After upload/URL, a background worker analyzes the audio (BPM, beat grid, sections). |
| **Beat grid / YouTube player** | For uploaded music: screen with beat grid and playback. For YouTube: embedded player. Used when aligning to music. |
| **Camera** | Record video; save → clip is created and queued for upload. |
| **Clip player (modal)** | Full-screen video playback (Mux). Used from session Clips list and from Library. |

So the **final mobile experience** is: **Sessions → Music → Clips (record/import, tag) → Assembly (assign clips to sections) → Share link.** Library and Profile support search and billing.

---

### 2.2 Web App — Share Page Only

The **web app** is a **Next.js** site. For the current product it has **one main job**: the **public share page**.

- **URL pattern:** `https://your-domain.com/s/[token]`
- **Who uses it:** Anyone with the link (no login).
- **What they see:**
  - Session name and date.
  - **Music:** If the session has uploaded music and analysis is complete → audio player + section labels (e.g. “Intro · 0:00”, “Section 2 · 1:23”). If YouTube → embedded YouTube player + sections. If no music → “No music added.”
  - **Clips:** Grid of clip cards. Each card: thumbnail (Mux), move name/label, tags (style, energy, difficulty). Tap to expand → video player + optional **feedback form** (if the choreographer has opened feedback for that clip).
- **Feedback form:** Name (optional), timecode (ms or “Use current time”), text. Submit → sent to API with share token; choreographer sees comments in the mobile app (clip comments).

So the **final web experience** is: **Open share link → see session + music + clips → optionally leave time-stamped feedback on clips.**

---

### 2.3 Backend API — The “Brain”

The **API** is a **Node.js** server (framework: **Hono**). It runs on **port 3001** and does all the “business logic” and database access. The mobile app and web app both call it (and the web share page also talks to Supabase directly for reading shared session data).

**What the API does (in user terms):**

- **Sessions:** Create session, list sessions, get one session. Enforces plan limits (e.g. free = 3 sessions max when not in beta).
- **Music:** Upload music file or set YouTube URL for a session; update music. Enforces “music segmentation” gate for free users (bypassed in beta).
- **Clips:** List clips for a session, create clip, get one clip, update clip. Issue **upload URLs** for video (Mux TUS upload). Enforces clip limit (e.g. free = 20 clips max when not in beta).
- **Clips — tags:** Update clip tags (move name, style, energy, etc.) via a dedicated endpoint; uses DB RPC for history.
- **Assembly:** Get/put “which clip is assigned to which section” for a session.
- **Share:** Create share token for a session (returns full URL using `SHARE_BASE_URL`), revoke token.
- **Feedback (authenticated):** Choreographer: list feedback requests for a clip, create/delete feedback request, list comments. Feedback request = “feedback is open for this clip.”
- **Feedback (public):** Anonymous POST to submit a comment (timecode, text, optional name) using the **share token**; validates token and clip/session, then saves comment.
- **Annotations:** Get/create clip annotations (e.g. arrows, circles, text on the video timeline) — for choreographer use.
- **Tag history:** Get history of tag changes for a clip.
- **Library:** Search/filter clips across all sessions (paginated); used by the Library screen.
- **Billing:** Get current plan; create Stripe Checkout session (“Upgrade”); create Stripe Customer Portal session (“Manage subscription”).
- **Webhooks:** Receive Mux events (asset ready/errored) to update clip `upload_status` and `mux_playback_id`; receive Stripe events to update subscription/plan.

So the **final API** is the single place that enforces permissions, limits, and storage for sessions, music, clips, assembly, sharing, feedback, annotations, library, and billing.

---

### 2.4 Music Analysis Worker — “roam-music”

**roam-music** is a **Python** process that runs **separately** from the API. It’s a **worker**: it repeatedly asks the database “is there a music track waiting to be analyzed?” and, if yes, downloads the audio, runs analysis, and writes results back.

- **Input:** Music track that has `analysis_status = 'pending'` and a file in storage (or YouTube path, depending on implementation). The API creates an **analysis job** when you upload music or set a YouTube URL.
- **What it does:** Claims one job at a time, downloads audio from Supabase **audio** bucket, runs **Essentia** (RhythmExtractor2013) to get BPM and beat times, derives a **beat grid** (time_ms, beat_number, is_downbeat) and **sections** (e.g. Intro, Section 2, …) from energy/RMS changes, then writes **bpm**, **beat_grid**, **sections**, and **analysis_status = 'complete'** (or failed) back to the database.
- **Output:** The session’s music track gets BPM, beat grid, and sections so the mobile app and share page can show “aligned to music” and section labels.

So the **final worker** is: **Poll DB → download audio → run Essentia → write BPM + beat grid + sections back to DB.**

---

## 3. The Three Parts of the System

| Part | What it is | Who uses it |
|------|------------|-------------|
| **Mobile app** | iOS/Android app (Expo/React Native) | Choreographers: create sessions, add music, record/import clips, tag, assemble, share, view comments. |
| **Web app** | Next.js site; share page at `/s/[token]` | Anyone with the link: watch session + music + clips, leave feedback (if open). |
| **API** | Node.js (Hono) server, port 3001 | Used by mobile and web to create/read/update data and to get upload URLs and billing URLs. |
| **roam-music** | Python worker (Essentia) | No direct user; runs in the background to analyze music and fill in BPM/beat grid/sections. |

**Shared infrastructure:**

- **Supabase** — Database (PostgreSQL), Auth (email/password), Storage (e.g. `audio` bucket), and Row Level Security (RLS). The API uses the **service role** to bypass RLS where needed; mobile and web use the **anon** key and rely on RLS and share tokens.
- **Mux** — Video upload (TUS), encoding, and playback. Clips are uploaded to Mux; the API gets back a **playback ID** used in the mobile and web video players.
- **Stripe** — Subscriptions and one-off billing. Plan is stored in `users.plan`; gates (session limit, clip limit, music upload) check plan. (Billing is deferred for soft launch; beta unlock bypasses gates.)

---

## 4. Tech Specs in Plain English

### 4.1 Monorepo (One Repo, Many Apps)

The project is a **monorepo**: one Git repository containing several “apps” and shared “packages.” A tool called **Turborepo** builds and runs them in the right order.

- **apps/api** — The backend API.
- **apps/mobile** — The Expo/React Native app.
- **apps/web** — The Next.js share site.
- **packages/db** — Shared database client/helpers (used by API).
- **packages/types** — Shared TypeScript types (Session, Clip, MusicTrack, etc.) used by API, mobile, and web so everyone agrees on the shape of data.
- **packages/shared-types** — Additional shared schemas (e.g. Zod) for validation.
- **roam-music** — Python worker (separate folder, not under `apps/`).

So “tech stack” at the repo level = **Node 20+, pnpm, Turbo, TypeScript, and Python 3.11+** for the worker.

---

### 4.2 Mobile App (apps/mobile)

| Term | Meaning |
|------|--------|
| **Expo** | Framework to build React Native apps with one codebase for iOS and Android. |
| **React Native** | Write UI in JavaScript/TypeScript; it renders native components (not a web view). |
| **Expo Router** | File-based routing: e.g. `app/(app)/session/[id].tsx` = session workspace; `app/auth/sign-in.tsx` = sign-in screen. |
| **Supabase Auth** | Sign up / sign in with email and password; session (JWT) is stored on device and sent to the API as `Authorization: Bearer <token>`. |
| **Deep link** | `roam://auth/callback` — when the user taps the email confirmation link, the app opens and completes sign-in. |

**Key libraries:**  
`@gorhom/bottom-sheet` (sheets for Create Session, Share, Capture, Tag, Paywall), `expo-image-picker` (gallery), `expo-camera` (record), Supabase JS client, and fetch to the API. Clips are stored in **SQLite** locally (Expo SQLite) and synced to the server; upload queue pushes video to Mux via API-issued TUS URLs.

---

### 4.3 Web App (apps/web)

| Term | Meaning |
|------|--------|
| **Next.js** | React framework with server-side rendering and file-based routes. |
| **App Router** | Routes live under `app/`, e.g. `app/s/[token]/page.tsx` = share page. |
| **Server component** | The share page loads session data on the server (Supabase RPC `get_shared_session`) so the first paint has the session name, music, and clips. |

**Key libraries:**  
`@supabase/supabase-js` (read shared session + signed audio URL), `@mux/mux-player-react` (video playback), and fetch to the API for public feedback submit. Styling: Tailwind-style classes (e.g. `bg-[#111]`, `rounded-lg`).

---

### 4.4 API (apps/api)

| Term | Meaning |
|------|--------|
| **Hono** | Lightweight web framework: define routes (GET/POST/PUT/PATCH/DELETE) and return JSON. |
| **Service role** | Supabase key with full DB access; used by the API to perform actions on behalf of users after validating the JWT. |
| **Middleware** | Functions that run before a route: e.g. parse JWT, set `userId`, or run plan gates (session limit, clip limit, music gate). |

**Important routes (summary):**

- `GET /`, `GET /health` — Health check.
- `GET/POST /sessions`, `GET /sessions/:id` — List/create/get session.
- `POST /sessions/:id/music`, `PATCH /sessions/:id/music` — Music upload or YouTube URL.
- `GET/POST /sessions/:sessionId/clips`, `GET/PATCH /sessions/:sessionId/clips/:clipId` — Clips CRUD.
- `POST /clips/upload-url` — Get Mux TUS upload URL (and create clip record).
- `PATCH /clips/:id/tags` — Update clip tags (with history RPC).
- `GET/PUT /sessions/:id/assembly` — Get/put section–clip assignments.
- `POST/DELETE /sessions/:id/share`, `POST /sessions/:id/share` — Create/revoke share token; share link uses `SHARE_BASE_URL`.
- `GET/POST/DELETE /clips/:id/feedback-requests`, `GET /clips/:id/comments` — Feedback requests and comments (authenticated).
- `POST /feedback` — Public submit comment (body includes `share_token`; validated then 403 or 201).
- `GET/POST /clips/:id/annotations` — Annotations.
- `GET /clips/:id/tag-history` — Tag history.
- `GET /library` — Search/filter clips (paginated).
- `GET /billing/me`, `POST /billing/checkout`, `POST /billing/portal` — Plan and Stripe.
- `POST /webhooks/mux`, `POST /webhooks/stripe` — Incoming webhooks.

---

### 4.5 Database (Supabase / PostgreSQL)

All main data lives in **Supabase** (hosted PostgreSQL + Auth + Storage). Tables (simplified):

- **users** — id (from Auth), email, plan (free/creator/pro/studio), Stripe ids, created_at.
- **sessions** — id, user_id, name, created_at.
- **music_tracks** — id, session_id, source_type (upload/youtube), source_url, storage_path, bpm, beat_grid (JSON), sections (JSON), analysis_status, created_at.
- **clips** — id, session_id, local_id, label, mux_* fields, upload_status, move_name, style, energy, difficulty, bpm, notes, recorded_at, created_at.
- **analysis_jobs** — Links a music track to a job; worker claims and updates status/timeout.
- **share_tokens** — session_id, token (UUID), revoked_at.
- **section_clips** — session_id, section_label, section_start_ms, clip_id, position (assembly).
- **feedback_requests** — clip_id, session_id, status (open/closed).
- **clip_comments** — clip_id, session_id, timecode_ms, text, commenter_name.
- **clip_annotations** — clip_id, timecode_ms, type (text/arrow/circle), payload (JSON).
- **clip_tag_history** — History of tag changes (via RPC).

**Row Level Security (RLS):** Most tables restrict access so users only see their own data; share page uses a DB RPC `get_shared_session(p_token)` that returns session + music + clips only when the token is valid and not revoked. Public feedback insert is allowed for anonymous users with a valid share token (enforced in API and/or RLS).

---

### 4.6 External Services

| Service | Role |
|---------|------|
| **Supabase** | Auth, PostgreSQL, Storage (e.g. `audio` bucket), RLS, RPCs. |
| **Mux** | Video upload (TUS), transcoding, CDN playback. API issues upload URL; Mux sends webhooks to API when asset is ready/errored. |
| **Stripe** | Checkout (upgrade), Customer Portal (manage subscription), webhooks to update `users.plan` and subscription state. |

---

## 5. Data and Concepts

- **Session** — One choreography project. Belongs to one user. Has a name and many clips and at most one active music track.
- **Music track** — Either “upload” (file in `audio` bucket) or “youtube” (URL). Has BPM, beat_grid, sections once analysis is complete.
- **Clip** — One video (move/snippet). Has upload lifecycle: local → queued → uploading → processing → ready (or failed). When ready, has `mux_playback_id` for playback. Can have tags: move_name, style, energy, difficulty, bpm, notes.
- **Assembly** — Assigns clips to sections of the music (section_label + section_start_ms + clip_id + position). One clip per section in the current model (enforced by unique constraint).
- **Share token** — UUID tied to a session; not revoked. Link = `SHARE_BASE_URL/s/` + token. Anyone with the link can view the share page; public feedback uses this token.
- **Feedback request** — “Feedback is open for this clip.” When open, the share page shows the feedback form for that clip; comments are stored in `clip_comments` with timecode_ms, text, commenter_name.
- **Library** — Aggregated view of all clips (across sessions) that have at least one tag; search and filter by text, style, energy, difficulty, BPM range; paginated.

---

## 6. Plans, Limits, and Billing

- **Plans:** free, creator, pro, studio (stored in `users.plan`).
- **Free plan limits (when not bypassed):** 3 sessions, 20 clips total, no music file upload (YouTube allowed). Enforced by API middleware (`checkSessionLimit`, `evaluateClipLimit`, `checkMusicSegmentation`).
- **Beta unlock:** `ROAM_BETA_UNLOCK=true` in API env bypasses all these gates so testers get full access. Documented in `BETA_UNLOCK.md`. For soft launch, this is required; before public launch it must be turned off and Stripe fully wired.

---

## 7. How Everything Fits Together

**Choreographer flow (mobile):**  
Sign in (Supabase Auth) → Create session (API) → Add music (API + storage; worker analyzes) → Record/import clips (API + Mux upload; webhook sets ready) → Tag clips (API) → Assign clips to sections in Assembly (API) → Share (API creates token; copy link). Optionally open feedback per clip (API); later view comments (API).

**Viewer flow (web):**  
Open share link → Next.js loads `get_shared_session(token)` from Supabase → Renders session name, music (player + sections), clips (grid). Click clip → play (Mux); if feedback open, submit comment via API `POST /feedback` with share_token.

**Data flow:**  
Mobile and web call API with Bearer token (or share token for public feedback). API uses Supabase service role to read/write DB and storage. Mux and Stripe send webhooks to API. roam-music polls DB, downloads from `audio` bucket, runs Essentia, writes BPM/beat_grid/sections back.

---

## 8. What You Need to Run It

- **Node.js** 20+, **pnpm** 9+, **Python** 3.11+ (for roam-music). **Expo** CLI and **EAS** for mobile builds.
- **Supabase project:** migrations applied, Auth enabled, redirect URL `roam://**` for mobile, `audio` bucket created (and policies if needed).
- **API env:** SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SHARE_BASE_URL (production web URL), ROAM_BETA_UNLOCK=true for soft launch, PORT=3001, MUX_* for clip upload/playback, STRIPE_* when billing is enabled.
- **Mobile env:** EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL.
- **Web env:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (and NEXT_PUBLIC_API_URL if you call API from client for feedback).
- **roam-music env:** SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
- **Mux:** API credentials and webhook pointing to `https://your-api/webhooks/mux`.
- **Deployment:** API (e.g. Render with `render.yaml`), Web (e.g. Vercel), roam-music (e.g. Railway or a long-running process). Mobile: EAS Build (preview/production).

See `.env.example` files in root, `apps/api`, `apps/mobile`, `apps/web`, `packages/db`, and `roam-music`, plus `DEPLOYMENT.md` and `PRODUCTION_READINESS_REPORT.md` for step-by-step and smoke tests.

---

## 9. Current State and Gaps

- **Implemented and working (with correct env and infra):** Auth, sessions CRUD, music upload/YouTube and analysis (worker), clip record/import/upload (Mux), tagging, assembly, share create/revoke, share page (music + clips + feedback form), public feedback submit, library search/filter, profile and billing endpoints, webhooks (Mux, Stripe). Plan gates exist but are bypassed when `ROAM_BETA_UNLOCK=true`. **Share-page feedback flow (request/close feedback, comment markers on scrub bar, comment overlay, comment counts on clip cards) — Done.**
- **Known gaps / manual steps:**  
  - **Audio bucket** must be created in Supabase (not in migrations).  
  - **Mux** must be configured (credentials + webhook) or clips never become “ready.”  
  - **Stripe** is deferred for soft launch; placeholders acceptable while beta unlock is on.  
  - **ROAM_BETA_UNLOCK** must be set to `true` for DEP-1; must be reverted before public launch.
- **Deferred / out of scope for soft launch:** App Store/Play Store submission, some local-first edge cases, and any features not listed in the smoke matrix in `DEPLOYMENT.md`.

---

This document is the single place to understand **what the final app is**, **what it looks like**, **how it’s built**, and **what’s done vs. what’s left**. Use it to choreograph next steps, plan releases, and onboard non-technical stakeholders.
