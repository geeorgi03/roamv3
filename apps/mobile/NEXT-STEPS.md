# Next steps for Roam APK

> **Operational checklist**: See [DEP-2-CHECKLIST.md](./DEP-2-CHECKLIST.md) for mobile runtime configuration and Supabase deep-link auth readiness.
> **Full deployment guide**: See [DEPLOYMENT.md](../DEPLOYMENT.md) for the production-readiness checklist.

## 1. Deploy the API (fix "Network request failed")

The app needs a public API URL. The preview build uses `https://roam-api.onrender.com`.

**Option A: Deploy to Render**

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect your repo and select it.
4. Use the `render.yaml` blueprint (or manually set):
   - Build: Dockerfile at `apps/api/Dockerfile`, context root = repo root
   - Runtime: Port 3001
5. In the Render dashboard, configure the environment variables for the `roam-api` service:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `SHARE_BASE_URL` | Production web URL (e.g. `https://roamdance.com`) |
   | `ROAM_BETA_UNLOCK` | `true` (soft-launch posture — temporary) |
   | `MUX_TOKEN_ID` | Mux access token ID |
   | `MUX_TOKEN_SECRET` | Mux access token secret |
   | `MUX_WEBHOOK_SECRET` | Mux webhook signing secret |
   | `PORT` | `3001` (set by `render.yaml`) |

6. In the Mux dashboard → Settings → Webhooks, add an endpoint pointing to:

   `https://<your-render-service>.onrender.com/webhooks/mux`

   Copy the generated webhook secret and set it as `MUX_WEBHOOK_SECRET` in the Render env vars.

7. Deploy. Your API URL will be `https://roam-api.onrender.com` (or your service name).
8. After deploy, confirm the API is live:

   `GET https://<your-render-service>.onrender.com/` → should return `{ "name": "Roam API", "version": "0.0.1" }`

**Option B: Different host (Railway, etc.)**

1. Deploy the API and get the public URL.
2. In `apps/mobile/eas.json`, update `EXPO_PUBLIC_API_URL` in the preview env block.
3. Rebuild: `npx eas build -p android --profile preview`

**Option C: Use runtime override (no rebuild)**

1. Open the app → Profile.
2. Tap the plan badge 5 times to reveal Developer Settings.
3. Enter your API URL (e.g. `https://your-api.onrender.com`) and Save.

---

## 2. Email confirmation redirect (Supabase)

For the confirmation link to open the app and sign the user in:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   ```
   roam://**
   ```
   (This allows any path under the `roam://` scheme.)
3. Save.

After that, when users tap the confirmation link in their email, the app will open and they’ll be signed in.

---

## 3. Rebuild the APK

After deploying the API and configuring Supabase:

```bash
cd apps/mobile
npx eas build -p android --profile preview
```
