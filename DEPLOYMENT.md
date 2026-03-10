# Roam Deployment Guide (Soft Launch)

Authoritative soft-launch operations guide for Roam Choreography. Production-readiness checklist for core flows. Billing/Stripe is explicitly deferred for this phase.

---

## DEP-1: API Deployment Baseline

### Render deployment

1. Push repo to GitHub.
2. [Render](https://render.com) → New → Web Service → Connect repo.
3. Use `render.yaml` blueprint (or configure manually):
   - **Build**: Dockerfile `apps/api/Dockerfile`, context = repo root
   - **Runtime**: Port 3001

### Required environment variables (set in Render dashboard)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SHARE_BASE_URL` | Yes | Base URL for share links; **must be set to the production Vercel URL (e.g. `https://roamdance.vercel.app`) — not localhost — before the API is deployed, since the share route reads it at startup** |
| `ROAM_BETA_UNLOCK` | Yes | **Must be set to `true` for DEP-1 soft launch**; bypasses plan gates; temporary soft-launch posture, not a permanent state |
| `MUX_TOKEN_ID` | Yes | Mux API (when video processing is enabled) |
| `MUX_TOKEN_SECRET` | Yes | Mux API |
| `MUX_WEBHOOK_SECRET` | Yes | Mux webhook verification |
| `STRIPE_SECRET_KEY` | Deferred | Stripe billing (out of scope for soft launch; placeholder values acceptable while `ROAM_BETA_UNLOCK=true`) |
| `STRIPE_WEBHOOK_SECRET` | Deferred | Stripe webhooks (placeholder acceptable for soft launch) |
| `STRIPE_PRICE_CREATOR` | Deferred | Creator plan price ID (placeholder acceptable for soft launch) |
| `STRIPE_PRICE_PRO` | Deferred | Pro plan price ID (placeholder acceptable for soft launch) |
| `STRIPE_PRICE_STUDIO` | Deferred | Studio plan price ID (placeholder acceptable for soft launch) |

### Stripe env vars (intentionally deferred)

For the soft-launch phase, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and all `STRIPE_PRICE_*` variables are **intentionally deferred**. Placeholder values are acceptable while `ROAM_BETA_UNLOCK=true` is configured in `render.yaml`. Stripe billing can be fully wired after soft-launch validation.

### Mux webhook configuration

When video processing is enabled, Mux must be able to reach the API's webhook endpoint:

- Webhook URL: `https://<your-service>.onrender.com/webhooks/mux`
- In the [Mux Dashboard](https://dashboard.mux.com) → **Settings** → **Webhooks**, register this URL.
- Copy the webhook signing secret from Mux and set it as `MUX_WEBHOOK_SECRET` in the Render environment.
- Subscribe to at least these events: `video.asset.ready`, `video.asset.errored`.

This ensures the clip upload pipeline can process Mux status updates end-to-end.

### API URL

After deploy, the API URL is `https://roam-api.onrender.com` (or your service name). This is baked into `eas.json` for preview and production builds.

---

## DEP-2: Mobile Runtime Configuration

### EAS build profiles

- **preview**: Internal APK, env vars in `eas.json`
- **production**: Store builds, same env vars

Both profiles include:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`
- `EXPO_USE_METRO_WORKSPACE_ROOT=0`

Both `preview` and `production` profiles in `apps/mobile/eas.json` already have `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_API_URL` set to production values.

### Supabase deep-link auth (email confirmation)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add: `roam://**`
3. Save

### Mobile deep-link + callback wiring

- The `roam` URL scheme is already set in `apps/mobile/app.json` via `"scheme": "roam"`.
- `apps/mobile/app/auth/callback.tsx` and `apps/mobile/lib/authRedirect.ts` are already wired for deep-link auth, so tapping the Supabase confirmation link opens `roam://auth/callback` and completes sign-in.

### Runtime API override (no rebuild)

If API URL changes before a new build:
1. App → Profile → tap plan badge 5× → Developer Settings
2. Enter API URL → Save

---

## DEP-3: Soft-Launch Smoke Matrix

### Core flow smoke tests

All rows must be manually exercised and checked before declaring soft-launch readiness:

| # | Flow | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 1 | **Auth — Sign-up** | Open app → Create account → enter email + password | Account created, no paywall (beta unlock active) | `[ ]` |
| 2 | **Auth — Email confirmation** | Tap confirmation link in email | App opens via `roam://auth/callback`, user signed in | `[ ]` |
| 3 | **Auth — Sign-in** | Enter credentials on sign-in screen | Home screen loads with sessions list | `[ ]` |
| 4 | **Session — Create** | Tap `+` → New session → Create | Session appears in list; no 3-session limit enforced | `[ ]` |
| 5 | **Session — List** | Navigate to home | All sessions visible, ordered by `created_at DESC` | `[ ]` |
| 6 | **Music — YouTube path** | Open session → Music → paste YouTube URL | Track loads, beat grid renders | `[ ]` |
| 7 | **Music — File upload** (if Mux + worker deployed) | Open session → Music → upload file | Analysis completes, beat grid renders | `[ ]` |
| 8 | **Clip — Capture + upload** | Record clip → save | Clip appears in session; upload progresses to `ready` | `[ ]` |
| 9 | **Clip — Import from gallery** | Import video → save | Same as above | `[ ]` |
| 10 | **Clip — Tag** | Open clip → tag move name, style, energy | Tags saved, visible on clip card | `[ ]` |
| 11 | **Share — Generate link** | Session → Share → Copy link | URL uses production `SHARE_BASE_URL` (not localhost) | `[ ]` |
| 12 | **Share — Public page** | Open share URL in browser | Page renders session name, clips, music without auth | `[ ]` |
| 13 | **Share — Revoke** | Session → Share → Revoke | Subsequent page load returns 404 | `[ ]` |
| 14 | **Profile — Dev settings** | Profile → tap plan badge 5× | Developer Settings panel opens, API override works | `[ ]` |
| 15 | **API health** | `GET https://roam-api.onrender.com/` | Returns `{ "name": "Roam API", "version": "0.0.1" }` | `[ ]` |

All items must be checked by a human operator as part of the soft-launch sign-off.

---

## Known Deferred Items + Launch Risks

This section captures intentionally deferred work and known risks for the soft launch. None of these block the soft launch, but they must be addressed before a full public launch.

| Item | Status | Risk Level | Notes |
|------|--------|------------|-------|
| Stripe billing | Deferred | Low | `ROAM_BETA_UNLOCK=true` bypasses all plan gates. Stripe env vars can be placeholders during soft launch. |
| `ROAM_BETA_UNLOCK` posture | Temporary | Medium | Must be removed before public launch. Documented in `BETA_UNLOCK.md`. |
| Music file upload for free users | Deferred | Low | `checkMusicSegmentation` gate exists but is effectively bypassed by beta unlock. YouTube path works for all users. |
| Audio storage bucket | Manual step | Medium | Not created by migrations. Must be created in Supabase Dashboard before music file upload works. |
| Mux webhook reachability | Infra | Medium | `POST /webhooks/mux` must be reachable from Mux. Confirm in Mux dashboard after API deploy. |
| App Store / Play Store submission | Deferred | None | EAS internal distribution is sufficient for soft launch. |
| DEFERRED BUG · T12 local-first state visibility | Deferred | Low | Post-MVP; does not block soft launch. |
| V1.0 features (Feedback, Annotations, Assembly) | Deferred | None | Not in soft-launch scope. |

---

## Production Build

### Pre-build checklist

- [ ] API deployed and healthy at `https://roam-api.onrender.com`
- [ ] `SHARE_BASE_URL` set to production web URL in Render dashboard
- [ ] Supabase redirect URL `roam://**` added in dashboard
- [ ] `apps/mobile/eas.json` `production` profile env vars confirmed (already set to production Supabase + API URLs)
- [ ] EAS credentials configured (Apple Developer account for iOS; Google Play for Android)
- [ ] `apps/mobile/app.json` confirms: `name`, `version`, `bundleIdentifier` (`com.roam.mobile`), `package` (`com.roam.mobile`), `scheme` (`roam`), `icon`, `splash` — all already present

### Build commands

```bash
# Android — store AAB (production profile)
cd apps/mobile && npx eas build -p android --profile production

# iOS — store IPA (production profile)
cd apps/mobile && npx eas build -p ios --profile production
```

The `production` profile in `apps/mobile/eas.json` already sets `distribution: store` and `buildType: app-bundle` for Android. iOS uses the same profile and relies on EAS credentials configured in your accounts.

---

## App Store Submission Checklist

### Android (Google Play)

- [ ] Google Play Console account created
- [ ] App created with package `com.roam.mobile`
- [ ] AAB uploaded from EAS build artifact
- [ ] Store listing: title ("Roam Choreography"), short description, screenshots
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided

### iOS (App Store Connect)

- [ ] Apple Developer account active
- [ ] App created with bundle ID `com.roam.mobile`
- [ ] IPA uploaded via EAS or Transporter
- [ ] Store listing: name, subtitle, description, screenshots
- [ ] Privacy policy URL provided
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false` already set in `apps/mobile/app.json`

---

## Soft-Launch Declaration

### Smoke-matrix execution status (per flow)

Use this table to record the outcome of each DEP-3 core-flow smoke test at the time of soft-launch sign-off:

| # | Flow (see matrix above) | Status (Pass/Fail) | Notes |
|---|-------------------------|--------------------|-------|
| 1 | Auth — Sign-up | `[ ] Pass` / `[ ] Fail` | |
| 2 | Auth — Email confirmation / callback | `[ ] Pass` / `[ ] Fail` | |
| 3 | Auth — Sign-in | `[ ] Pass` / `[ ] Fail` | |
| 4 | Session — Create | `[ ] Pass` / `[ ] Fail` | |
| 5 | Session — List | `[ ] Pass` / `[ ] Fail` | |
| 6 | Music — YouTube path | `[ ] Pass` / `[ ] Fail` | |
| 7 | Music — File upload (if enabled) | `[ ] Pass` / `[ ] Fail` | |
| 8 | Clip — Capture + upload | `[ ] Pass` / `[ ] Fail` | |
| 9 | Clip — Import from gallery | `[ ] Pass` / `[ ] Fail` | |
| 10 | Clip — Tag | `[ ] Pass` / `[ ] Fail` | |
| 11 | Share — Generate link | `[ ] Pass` / `[ ] Fail` | |
| 12 | Share — Public page | `[ ] Pass` / `[ ] Fail` | |
| 13 | Share — Revoke | `[ ] Pass` / `[ ] Fail` | |
| 14 | Profile — Dev settings | `[ ] Pass` / `[ ] Fail` | |
| 15 | API health | `[ ] Pass` / `[ ] Fail` | |

### Deferred-risk acknowledgement at sign-off

Summarize any **known deferred items and launch risks** (from the "Known Deferred Items + Launch Risks" section above) that are still open at the time of sign-off, and confirm that they are accepted for this soft-launch scope:

- **Deferred items still open**: ____________________________________________
- **Risk posture / rationale**: _____________________________________________

### Soft-launch readiness declaration

> **Status: SOFT-LAUNCH READY** (once all required flows above are marked as Pass)
>
> The Roam Choreography app is declared soft-launch ready for the current scope. All DEP-3 core flows listed in the smoke matrix have been executed and recorded above. Stripe billing is intentionally deferred. `ROAM_BETA_UNLOCK=true` is the documented temporary posture for this phase. Known deferred items are logged and explicitly accepted as part of this soft-launch decision.
