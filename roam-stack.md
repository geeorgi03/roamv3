# Roam — Stack (V1 baseline → V2)

This file captures the *current* technical stack so planning tools (Traycer, Cursor agents) can generate incremental, repo-aligned tickets instead of starting from scratch.

## Repo + primary target

- **Primary build target**: `apps/mobile` (Expo / React Native)
- **Backend**: `apps/api` (Node + Hono) + Supabase (Postgres/Auth/Storage)
- **Worker**: `roam-music` (Python audio analysis worker; polls DB for pending jobs)

## Job queue / background work

- **Job queue**: **DB-polled worker + local mobile queues** (no centralized Redis queue)
  - **Music analysis**: `roam-music` polls Supabase for pending analysis jobs, downloads audio from Storage, writes BPM/beat grid/sections back.
  - **Clip uploads**: `apps/mobile/services/uploadQueue.ts` maintains a **local** upload queue (retry + backoff) and obtains upload URLs from the API.

## Server / deployment

- **API deployment**: **Render** (Dockerfile: `apps/api/Dockerfile`) — see `DEPLOYMENT.md`
- **Web (share site) deployment**: **Vercel** — referenced via `SHARE_BASE_URL` in API env
- **Worker deployment**: **Railway** (long-running `roam-music` process)

## Figma reference

- **Figma Make (reference prototype)**: `https://www.figma.com/make/4HNKqKjN0Cf8PvGr9UIL9g/Implement-Documentation-Steps`

