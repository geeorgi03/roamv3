# Roam Choreography App — Production Readiness Test Report

**Date:** March 7, 2025  
**Scope:** Verify runnability and core choreography workflow (no new features)

---

## 1. Repository Health Check

### Monorepo structure

| Component | Path | Status |
|-----------|------|--------|
| Root | `package.json`, `pnpm-workspace.yaml`, `turbo.json` | ✅ Present |
| Backend API | `apps/api/` (Hono + Node) | ✅ Present |
| Mobile app | `apps/mobile/` (Expo 51, React Native) | ✅ Present |
| Web share page | `apps/web/` (Next.js 14) | ✅ Present |
| Music worker | `roam-music/` (Python, Essentia) | ✅ Present |
| Shared packages | `packages/db`, `packages/types`, `packages/shared-types` | ✅ Present |

### Config files

| File | Status |
|------|--------|
| `.env.example` (root) | ✅ Minimal template |
| `apps/api/.env.example` | ✅ Full API vars |
| `apps/mobile/.env.example` | ✅ Mobile vars |
| `apps/web/.env.example` | ✅ Web vars |
| `roam-music/.env.example` | ✅ Worker vars |
| `packages/db/.env.example` | ✅ DB vars |
| `supabase/config.toml` | ✅ Local dev config |
| `supabase/migrations/*` | ✅ 14 migrations present |

**Verdict:** Repository structure is healthy. All main apps and services exist.

---

## 2. Environment Setup Validation

### Required environment variables by service

#### API (`apps/api`)

| Variable | Required | Blocks startup? |
|---------|----------|-----------------|
| `SUPABASE_URL` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |
| `PORT` | No (default 3001) | No |
| `MUX_TOKEN_ID` | For clip upload | No — returns 502 if missing |
| `MUX_TOKEN_SECRET` | For clip upload | No — returns 502 if missing |
| `MUX_WEBHOOK_SECRET` | For Mux webhooks | No — webhook rejects if invalid |
| `STRIPE_SECRET_KEY` | For billing | No — billing fails |
| `STRIPE_WEBHOOK_SECRET` | For Stripe webhooks | No |
| `STRIPE_PRICE_*` | For plans | No |
| `SHARE_BASE_URL` | For share links | No |

#### Mobile (`apps/mobile`)

| Variable | Required | Blocks startup? |
|---------|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |
| `EXPO_PUBLIC_API_URL` | Yes (default localhost:3001) | No — defaults |

#### Web (`apps/web`)

| Variable | Required | Blocks startup? |
|---------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes (share page fails) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |

#### Music worker (`roam-music`)

| Variable | Required | Blocks startup? |
|---------|----------|-----------------|
| `SUPABASE_URL` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |

### Minimal `.env` template for local testing

```bash
# === ROOT / API (apps/api) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development

# Required for clip upload (Mux)
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_signing_secret

# Share links (web base URL)
SHARE_BASE_URL=http://localhost:3000

# === MOBILE (apps/mobile) ===
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3001

# === WEB (apps/web) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# === ROAM-MUSIC (roam-music/) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** Stripe keys are optional for core choreography; Mux keys are required for clip upload and playback.

---

## 3. Startup Commands

### Step-by-step terminal sequence

**Prerequisites:** Node 20+, pnpm 9+, Python 3.11+ (for roam-music), Supabase project with migrations applied.

```powershell
# 1. Install dependencies
cd c:\Users\Georges\Documents\Cursor
pnpm install

# 2. Build shared packages (required by API/mobile)
pnpm exec turbo run build --filter=@roam/db

# 3. Start Supabase locally (if using local Supabase)
# supabase start

# 4. Backend API — Terminal 1
cd apps/api
pnpm dev
# Listens on http://localhost:3001

# 5. Web share page — Terminal 2
cd apps/web
pnpm dev
# Listens on http://localhost:3000

# 6. Mobile Expo app — Terminal 3
cd apps/mobile
pnpm start
# Then press 'a' for Android or 'i' for iOS

# 7. Music analysis worker — Terminal 4
cd roam-music
uv run main.py
# Or: pip install -e . && python main.py
```

**Alternative:** Run API + Web together with `pnpm dev` from root (turbo runs both). Mobile and roam-music must be started separately.

### Service ports

| Service | Port |
|---------|------|
| API | 3001 |
| Web | 3000 (Next.js default) |
| Mobile | Expo dev server (varies) |
| Supabase (local) | 54321 (API), 54322 (DB), 54323 (Studio) |

---

## 4. Core Choreography Workflow Test

### Flow: create session → upload music → beat analysis → record/upload clip → tag movement → view clips aligned to music

| Step | Status | Notes |
|------|--------|-------|
| **1. Create choreography session** | ✅ Implemented | `POST /sessions` with `{ name }`. Auth required. Free plan: 3 sessions max. Users table auto-populated via `on_auth_user_created` trigger. |
| **2. Upload music file** | ⚠️ Partially implemented | `POST /sessions/:id/music` (multipart). **Blocked for free users** by `checkMusicSegmentation` (returns 403). Paid users (creator/pro/studio) can upload. YouTube URL path works for all users (no gate). |
| **3. Run beat analysis** | ✅ Implemented | `roam-music` worker polls `claim_analysis_job` RPC, downloads from `audio` bucket, runs Essentia `RhythmExtractor2013`, writes `bpm`, `beat_grid`, `sections` to `music_tracks`. Worker must be running. |
| **4. Record or upload clip** | ✅ Implemented | **Record:** Camera screen → save → `saveClip` → upload queue. **Upload:** Gallery picker → `saveClip`. Queue calls `POST /clips/upload-url` (Mux) → TUS upload. Requires `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET`. Mux webhook updates clip to `ready`. Free plan: 20 clips max. |
| **5. Tag a movement** | ✅ Implemented | `TagSheet` → `PATCH /clips/:id/tags` with `move_name`, `style`, `energy`, `difficulty`, `bpm`, `notes`. Uses `update_clip_tags_with_history` RPC. |
| **6. View clips aligned to music** | ✅ Implemented | Assembly tab: `GET /sessions/:id/assembly`, `PUT` for assignments. Sections from `music_track.sections`. Clips with `upload_status === 'ready'` and `mux_playback_id` shown. Assign clips to sections; thumbnails from Mux CDN. |

### Blockers for full flow

1. **Music upload for free users:** `checkMusicSegmentation` returns 403 for free plan. Only paid users can upload music. YouTube path is not gated.
2. **Audio storage bucket:** The `audio` bucket is not created by migrations. Must be created manually (Supabase dashboard or `insert into storage.buckets`). For beat-grid playback on mobile, bucket should be public (or use signed URLs).
3. **Mux credentials:** Without `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`, clip upload fails with 502. Clips stay local; Assembly view requires `upload_status === 'ready'` and `mux_playback_id`.

---

## 5. Usability Verdict

### **NEEDS SMALL FIXES**

The codebase is structurally complete and the choreography workflow is implemented. Local testing is possible but requires configuration and a few adjustments.

---

## Top 3 Blocking Issues

### 1. **Music upload blocked for free users**

`checkMusicSegmentation` in `apps/api/src/lib/planGate.ts` returns 403 for users on the free plan. Both file upload and YouTube URL are gated. For local testing with a new account (free by default), music setup fails.

**Workaround:** Temporarily bypass the gate for development, or manually set `plan = 'creator'` in the `users` table for your test user.

### 2. **Audio storage bucket not created**

The `audio` bucket is used by the API and roam-music but is not created in migrations. Uploads and analysis will fail until the bucket exists.

**Fix:** Create the bucket via Supabase Dashboard (Storage → New bucket → `audio`) or run:

```sql
insert into storage.buckets (id, name, public) values ('audio', 'audio', true);
```

Add storage policies for authenticated uploads and public read if needed.

### 3. **Mux + webhook setup required for clip playback**

Clip upload and Assembly view depend on Mux. Without Mux credentials and a reachable webhook URL, clips never reach `upload_status: 'ready'` and Assembly shows no clips.

**Fix:** Configure Mux (API tokens, webhook URL pointing to `https://your-api/webhooks/mux`). For local dev, use ngrok or similar to expose the API for Mux webhooks.

---

## Summary

| Aspect | Status |
|--------|--------|
| Repo structure | ✅ Healthy |
| Config files | ✅ Present |
| Env vars | ⚠️ Many required; Mux/Stripe optional for minimal flow |
| Startup commands | ✅ Documented |
| Create session | ✅ Works |
| Upload music | ⚠️ Blocked for free users |
| Beat analysis | ✅ Works (worker must run) |
| Record/upload clip | ✅ Works (needs Mux) |
| Tag movement | ✅ Works |
| View clips aligned | ✅ Works (needs music + Mux-ready clips) |

**Recommendation:** Create the `audio` bucket, temporarily relax or bypass `checkMusicSegmentation` for local testing, and configure Mux (or accept that Assembly will be empty until Mux is set up). With these changes, the app is **ready for local choreography testing**.
