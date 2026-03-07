# Beta Unlock — Temporary Plan Bypass

During the beta phase, plan limits and paywalls are bypassed so testers can use the full choreography workflow without restrictions.

## How It Works

Set `ROAM_BETA_UNLOCK=true` in your API `.env` file. When enabled, the following gates are bypassed:

| Gate | Location | Normal Limit | Bypassed |
|------|----------|--------------|----------|
| **Music upload** | `checkMusicSegmentation` in `apps/api/src/routes/music.ts` | Free users blocked from file upload & YouTube | ✅ All users can upload |
| **Session creation** | `checkSessionLimit` in `apps/api/src/routes/sessions.ts` | Free: 3 sessions max | ✅ Unlimited |
| **Clip creation** | `evaluateClipLimit` in `apps/api/src/routes/clips.ts` | Free: 20 clips max | ✅ Unlimited |
| **Clip upload URL** | `evaluateClipLimit` in `apps/api/src/routes/mux.ts` | Same as above | ✅ Unlimited |

All bypass logic lives in `apps/api/src/lib/planGate.ts` via `isBetaUnlockEnabled()`.

## Enabling Beta Unlock

1. Add to `apps/api/.env`:
   ```
   ROAM_BETA_UNLOCK=true
   ```
2. Restart the API server.

## Re-enabling Freemium (When Beta Ends)

1. Remove `ROAM_BETA_UNLOCK` from `.env`, or set:
   ```
   ROAM_BETA_UNLOCK=false
   ```
2. Restart the API server.

No code changes required. The gate logic remains intact; it simply stops bypassing when the env var is unset or false.

## Testing the Full Workflow (Beta User)

1. Ensure `ROAM_BETA_UNLOCK=true` in API `.env` and restart the API.
2. Sign up or log in as a **free** user (plan = `free` in `users` table).
3. Run through the flow:
   - **Create session** → Should succeed (no 3-session limit).
   - **Upload music** (file or YouTube) → Should succeed (no music gate).
   - **Record clips** → Should succeed (no 20-clip limit).
   - **Upload clips to Mux** → Should succeed (no clip limit on upload-url).
4. You should never see the PaywallSheet during this flow.

## Files Changed

- `apps/api/src/lib/planGate.ts` — Added `isBetaUnlockEnabled()` and bypass at start of each gate
- `apps/api/.env.example` — Added `ROAM_BETA_UNLOCK=true` with comment
- `BETA_UNLOCK.md` — This documentation
