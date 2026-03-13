# Roam Choreography App  
## Print‑Ready Product & Technical Report

**Document type:** Product and Technical Report (Print‑Ready)  
**Product:** Roam (Choreography sessions, music alignment, clips, assembly, sharing, feedback)  
**Audience:** Mixed (non‑technical stakeholders and engineers)  
**Prepared for:** Project stakeholders and implementers  
**Date:** 2026‑03‑12  
**Version:** 1.0

---

### Distribution and confidentiality

This report is intended for internal planning, collaboration, onboarding, and deployment preparation. If shared externally, remove infrastructure secrets and ensure that any screenshots or sample links do not expose private data.

<div style="page-break-after: always;"></div>

## Executive summary

Roam is a choreography application designed for dancers and choreographers who need a practical way to organize movement ideas, align them to music, and collaborate with others through sharing and feedback. The application centers on the concept of a “session,” where one session represents one choreography project. Within a session, a creator attaches music, captures or imports video clips, tags those clips with descriptive metadata, and assembles clips into the structure of the music. The system also supports generating public share links and collecting time‑coded feedback so collaborators can comment on specific moments.

Roam is implemented as a monorepo containing multiple applications and shared packages. The mobile client, built with Expo and React Native, is the primary creation experience. The web client, built with Next.js, is primarily used to render the public share page. A backend API, built with Node.js and the Hono framework, provides the business logic layer and coordinates database access, storage, and third‑party integrations. A separate Python worker performs music analysis to compute BPM, beat grids, and musical sections. Supabase is used for authentication, a PostgreSQL database, storage, Row Level Security (RLS) policies, and RPC functions. Mux is used for video upload, transcoding, and playback. Stripe is used for plan gating and subscriptions, though billing can be deferred during soft launch with a beta unlock posture.

This report explains what the app does today, how the system works, how the technology stack is organized, where the project currently stands, and what remains to reach a stable production release. It also describes the operational dependencies needed for end‑to‑end functionality, including the audio storage bucket, Mux credentials and webhook reachability, and correct share link configuration.

<div style="page-break-after: always;"></div>

## Table of contents

This print‑ready report is organized into fourteen sections. Section 1 provides the executive summary. Section 2 defines the product vision and the user problems Roam solves. Section 3 describes the end‑to‑end user journeys for creators and viewers. Section 4 distinguishes the current implementation from the intended final experience. Section 5 explains the architecture and responsibilities of each system component. Section 6 documents the technology stack by layer. Section 7 describes the data model, including entities and critical constraints. Section 8 explains backend API responsibilities and behaviors. Section 9 explains the mobile application’s runtime behavior, including local persistence and upload states. Section 10 explains the web share page and public feedback flow. Section 11 describes the music analysis worker and its job processing model. Section 12 explains the security model including authentication, RLS boundaries, service role usage, and share token access. Section 13 describes deployment and operations with a soft‑launch posture. Section 14 summarizes current status, recent changes, known gaps, and the recommended next steps for production hardening.

<div style="page-break-after: always;"></div>

## 2. Product vision and user problems

Roam exists to reduce the friction that choreographers experience when they create, refine, and share choreography. In a typical workflow, videos of movement ideas live in a camera roll with minimal structure. Notes about what the movement is, where it belongs in the music, and what needs refinement live in separate apps or in memory. Sharing often happens through messaging platforms, and feedback is often returned as informal text that is not anchored to a specific timestamp or segment. This combination makes iteration slower and increases misunderstanding, particularly when multiple dancers or collaborators are involved.

Roam’s approach is to treat choreography as a structured project. A session contains the complete context for a piece. Music becomes a first‑class timeline anchor rather than a background reference. Clips become the building blocks of movement, and tags become structured metadata that supports search, reuse, and clarity. Assembly becomes an explicit mapping between music sections and movement clips, which makes the choreography’s structure visible. Sharing and feedback become integrated workflows, enabling collaborators to view the session in a browser and leave time‑coded comments that are immediately actionable.

Roam’s design deliberately favors practical choreographer workflows over heavy editing features. The goal is not to replace professional video editing tools, but to provide a choreography‑specific workspace where movement, music structure, and iteration are organized in one place and shareable through a low‑friction link.

<div style="page-break-after: always;"></div>

## 3. User journeys (end‑to‑end)

### 3.1 Creator journey (mobile)

The creator begins by signing in through Supabase authentication. After the session token is established on the device, the creator can create a session, which represents a choreography project such as a routine for an event or a class combination. The creator then adds music to the session in one of two ways. The first way is to upload an audio file, in which case the system stores the file in Supabase Storage and schedules a background analysis job. The analysis worker processes the job and writes BPM, beat grid, and section data back into the database. The second way is to paste a YouTube URL, in which case the music is treated as immediately playable through a YouTube player flow without waiting for file analysis.

With music attached, the creator captures movement clips. The app supports recording video using the device camera and importing existing videos from the gallery. Clips are persisted locally first so that capture remains usable under unstable connectivity. The app then uploads clips through the cloud pipeline, where Mux processes the clip and produces playback identifiers. As clips transition through upload and processing states, the creator can tag them with metadata such as move name, style, energy, difficulty, BPM, and notes. Tagging is essential for later search and organization, and it also improves collaboration because clips are described consistently across the project.

The creator then assembles the choreography by assigning clips to sections of the music. This step makes the structure explicit by mapping movement to time. When collaboration is needed, the creator generates a share link for the session and sends it to collaborators. The creator can optionally open feedback for specific clips. Collaborators submit time‑coded feedback through the web share page, and the creator reviews this feedback in the mobile app with clear linkage to the clip and moment being referenced.

### 3.2 Viewer journey (web)

A viewer receives a share link and opens it in a browser. The share page renders the session’s identity and content. The viewer can play the music and the clips without authenticating. If feedback has been enabled for a clip, the viewer can submit a comment that includes a timecode and optional name. The feedback is stored with the correct session and clip context so that it is actionable and reviewable by the creator.

<div style="page-break-after: always;"></div>

## 4. Current implementation versus final experience

The final intended Roam experience is a stable, predictable system where authentication is reliable, upload flows are resilient, music analysis is consistent, and collaboration is frictionless. A polished release requires that the system behave well under real‑world conditions such as intermittent connectivity, large numbers of clips, and delayed webhooks. It also requires plan gating and billing behavior to be correct if monetization is enabled, because limits that are inconsistent across the client and server harm trust.

The current implementation already includes the core choreography workflow and the system components needed to support it. Sessions can be created and listed. Music can be attached through upload or YouTube. Background music analysis exists through a worker and job records. Clips can be captured or imported and uploaded through Mux. Clips can be tagged and the system supports tag history. Assembly exists as a mapping layer between music sections and clips. Sharing and revocation exist, and the web share page can render content for a token. Public feedback submission exists, and the mobile client can surface comment counts for clips that have server identifiers. Plan gates exist, and a beta unlock posture is documented for a soft‑launch approach.

Where the work remains is primarily in operational readiness and hardening. End‑to‑end behavior depends on infrastructure being configured correctly. The audio storage bucket must exist for music upload and worker processing. Mux credentials and webhook reachability must be correct for clips to transition to playable states. Share base URL configuration must be correct so generated links resolve to the deployed web experience. Production hardening typically also includes better observability, clearer failure reporting, and careful idempotency for webhook handling and retryable upload flows.

<div style="page-break-after: always;"></div>

## 5. Architecture overview (systems and responsibilities)

Roam is intentionally split into separate systems so that each responsibility can be implemented and scaled appropriately. The mobile app is the creation client and must provide a responsive UX for capture, tagging, and assembly. The web app is the share surface and must render quickly for anonymous viewers. The API is the business logic coordinator, responsible for validating authenticated requests, enforcing ownership, applying plan gates, writing to the database, and integrating with third‑party services. The music analysis worker runs separately because beat and section analysis is CPU‑heavy and long‑running compared to typical API request lifetimes.

Supabase serves as the shared platform that connects the system. It provides the canonical PostgreSQL database, authentication, storage for audio, and the security layer via RLS policies and RPC functions. Mux provides the video pipeline so that clips are uploaded and played back consistently across devices. Stripe is the billing provider used to manage subscriptions and plan state when billing is enabled.

This architecture creates clean boundaries. The mobile and web clients remain untrusted and operate with anon-level access where appropriate. The API acts as the trusted orchestrator and uses service-role access only after validating identity. The worker runs in the trusted environment and writes analysis results back to the database. Webhooks from Mux and Stripe enter through the API so they can be verified and persisted reliably.

<div style="page-break-after: always;"></div>

## 6. Technology stack (by layer)

Roam is developed as a monorepo using pnpm workspaces and Turborepo for build orchestration. The codebase uses TypeScript across the API, mobile app, web app, and shared packages. The expected Node.js runtime is version 20 or higher.

The mobile app is built with Expo and React Native. Navigation is handled via expo-router, which maps screen paths to files. The app uses Expo modules such as the camera and media pickers to capture and import content. It uses @gorhom/bottom-sheet for several core workflows such as capture selection, tagging, sharing, and paywall presentation. For local persistence and fast state storage, the app uses expo-sqlite and react-native-mmkv. It uses Supabase JS for authentication and uses the API as the primary data and business logic surface.

The web app is built with Next.js 14 using the App Router. It uses Supabase JS to read session data for a share token and uses a Mux player component for clip playback. Styling is implemented using Tailwind-style utility classes and associated tooling.

The API is built with Hono and runs on Node.js. It uses Supabase service-role access to perform database and storage operations and integrates with Mux for the video lifecycle and with Stripe for billing where enabled. The music analysis worker is built in Python and uses Essentia for rhythm extraction and beat analysis.

<div style="page-break-after: always;"></div>

## 7. Data model and critical constraints

Roam’s data model is built around sessions, music, and clips. A user owns sessions. A session contains clips and is anchored by a single music track. A clip represents a movement video with tags and upload state. Assembly data maps music sections to clips, representing the choreography structure. Share tokens provide revocable public access to a session. Feedback requests and comments provide collaboration. Annotations and tag history provide additional refinement and auditability.

A critical V1 constraint is that each session has only one active music track. This constraint has been enforced at the database level by removing duplicates and adding a unique constraint on the session identifier in the music track table. Enforcing the constraint at the database layer ensures that API behavior and client expectations remain aligned, reduces ambiguity, and simplifies the product’s mental model. It also enables upsert semantics where setting music for a session updates the single track rather than creating unbounded duplicates.

Audio assets are stored in Supabase Storage, typically within a bucket named `audio`, and paths are structured so they can be traced back to the user and session. Video assets are handled by Mux, which provides playback identifiers used by the mobile and web clients. This separation keeps large video handling outside the primary database and relies on specialized media infrastructure.

<div style="page-break-after: always;"></div>

## 8. Backend API behavior (routes, rules, and plan gates)

The API is responsible for validating authentication and applying business rules consistently. Requests that operate on a user’s private sessions require a valid JWT bearer token. The API extracts the authenticated user identity into request context and verifies resource ownership before performing reads or writes. After validation, the API uses Supabase service-role access to write to the database and storage in a trusted manner.

The sessions endpoints support listing sessions for a user and creating new sessions. They also support fetching a session bundle for the mobile workspace that includes the session record, the relevant music track, and the session’s clips, typically sorted by recorded time so that the newest content appears first.

The music endpoint supports two inputs. In the upload path, the API validates audio file type and size, stores the file in the `audio` bucket, upserts the session’s single music track record, and inserts a corresponding analysis job for the worker. In the YouTube path, the API validates the URL and upserts a music track record that references the YouTube source. The music patch endpoint supports updating alignment fields such as section entries and downbeat offsets, enabling iterative adjustment of how music structure is represented in the session.

The API also supports clip creation, clip updates, tag updates, assembly read/write, share token management, feedback request management, and comment submission and retrieval. The clip upload lifecycle depends on Mux and is finalized through Mux webhook events, which must be verified and persisted. Stripe webhooks are used to keep subscription and plan state consistent when billing is enabled.

Plan gates exist to enforce limits such as session caps, clip caps, and music capability restrictions depending on plan. For the soft-launch posture, a beta unlock configuration can bypass plan gates to validate the product experience before billing is fully enforced.

<div style="page-break-after: always;"></div>

## 9. Mobile application behavior (screens, persistence, uploads)

The mobile app is the primary creation environment and is designed to support fast capture and iteration. The session workspace is the central screen where a creator sees clips, manages music setup and alignment entry points, and uses assembly once music exists. The app includes a dedicated music setup screen that supports audio upload and YouTube link validation. The session workspace presents a clips view, a beat grid status and entry view, and an assembly view that appears when a music track exists.

Local persistence is used to keep capture workflows robust. Clips can be created locally, listed immediately, and then uploaded asynchronously. This approach ensures that a choreographer can record multiple clips in a short period without waiting on network operations. Upload and processing states must be visible, because the clip becomes fully playable only after the cloud pipeline has produced a playback identifier. The app supports retry behavior for clips that fail to upload or process.

The upload pipeline follows a predictable lifecycle. The clip is created locally and then uploaded to the cloud through the configured pipeline. Mux processes the asset and eventually provides a playback identifier. Webhook events from Mux update server-side state so that the clip transitions to a ready state. The mobile app then reconciles local records with server records and displays the ready state for playback and assembly selection.

Feedback and collaboration indicators are surfaced in the session workspace, such as comment counts for clips that exist on the server. This makes collaboration visible inside the creation workflow rather than requiring separate tooling.

<div style="page-break-after: always;"></div>

## 10. Web share experience and public feedback

The web app exists to provide a frictionless share surface. A creator generates a share token for a session and distributes the resulting URL to collaborators. The share page renders the session’s content for anonymous viewers without requiring sign-in. This lowers friction for studios, clients, and dancers who may be reviewing content quickly from a desktop or mobile browser.

The share token model is intentionally revocable. A creator can revoke a share token to disable future access. This supports privacy and control when a project ends or when a link has been shared too broadly.

Public feedback is designed to be actionable. Viewers can submit comments that are time‑coded and optionally include a name. Comments are stored in association with the session and clip so that the creator can review them later in context. Feedback request gating allows creators to decide which clips accept feedback and when feedback is open, preventing unwanted input or noise on clips where feedback is not needed.

<div style="page-break-after: always;"></div>

## 11. Music analysis worker (job processing model)

Music analysis is performed by a separate Python worker because the computation is long-running and more CPU intensive than typical API requests. The worker repeatedly queries the database to claim pending analysis jobs, ensuring that a job is processed by only one worker at a time. After claiming a job, the worker downloads the audio file from the `audio` storage bucket and runs analysis to estimate BPM and beat times. It then derives a beat grid representation and computes section boundaries that can be used for alignment and assembly.

The worker writes its results back into the session’s music track record, marking analysis as complete when successful. The worker must also handle failure modes safely. It must respect job timeouts so that jobs do not remain locked indefinitely if a worker crashes. It must track attempts so that recurring failures can be diagnosed instead of looping forever. It must also ensure that reruns do not corrupt a session’s data and that partial writes are avoided where possible.

The worker’s outputs enable the beat grid editor experience and section-based assembly. Without the worker, music upload can still store the audio, but beat and section features cannot be reliably populated.

<div style="page-break-after: always;"></div>

## 12. Security model (auth, RLS, service role, share tokens)

Roam’s security model balances ease of collaboration with protection of private session data. Authenticated creator operations rely on Supabase Auth and JWT bearer tokens. The API validates the token, extracts the user identity, and enforces ownership checks before performing privileged operations. The API uses the Supabase service-role key only in trusted server environments to perform database and storage operations that clients should not be able to perform directly.

Row Level Security policies in Supabase restrict what can be read and written via anon clients, ensuring that users cannot access other users’ sessions and clips. Public share access is permitted only through valid, non‑revoked share tokens. This model provides an explicit, revocable collaboration surface without making sessions generally public.

Public feedback submission must be carefully validated to prevent misuse. The system must ensure that a feedback submission is associated with a valid share token and the correct session and clip context. In a hardened deployment, additional measures such as rate limiting, spam mitigation, and monitoring should be considered for public endpoints.

<div style="page-break-after: always;"></div>

## 13. Deployment and operations (soft launch posture)

Roam’s operational deployment includes multiple services. The API must be deployed as a long-running Node service with access to Supabase credentials and webhook secrets. The web app must be deployed as a Next.js site at a stable URL. The music worker must be deployed as an always-on Python service that can access Supabase and storage. Supabase must have migrations applied, authentication configured, and required storage buckets created. Mux must be configured with credentials, and its webhook endpoint must be reachable from Mux so that clips can transition to ready states. Stripe can be configured later if soft launch uses a beta unlock posture, but must be correctly wired before plan gating is enforced.

A critical operational requirement is that share link generation uses the correct base URL for the deployed web app. If the base URL is incorrect at API startup, share links can point to invalid hosts and break collaboration flows.

For soft launch readiness, smoke testing should exercise authentication, session creation, music setup via both YouTube and upload paths, clip capture and upload, tagging, share link creation and revocation, and public share page rendering. These tests validate the cross-service integration points, which is where most early failures occur.

<div style="page-break-after: always;"></div>

## 14. Current status, recent changes, known gaps, and next steps

Recent work in the codebase indicates an emphasis on tightening the V1 contract around music handling. The database now enforces the rule that each session has one music track, and the API aligns with this by using upsert semantics keyed on session identifier. Session detail responses return a single music track bundle for the mobile client. The mobile session workspace and music setup experience reflect this simplified model and provide clear messaging during analysis periods.

The system is already beyond a prototype stage in terms of structure. It contains the necessary components for the complete workflow, including mobile creation, web sharing, backend orchestration, and background analysis. When infrastructure is correctly configured, the core experience exists end‑to‑end.

Known dependencies remain that can block the experience if not configured. The `audio` storage bucket must exist for audio uploads and worker downloads. Mux credentials and webhook reachability must be correct for clip readiness. Share base URL must be correct so share links resolve to the deployed web share page. Billing can remain deferred during soft launch with beta unlock, but plan gating and subscription correctness must be completed before public launch.

The recommended next steps toward production readiness are focused on hardening and operational confidence. The system benefits from improved observability and structured logging so that analysis failures, webhook failures, and upload failures are quickly diagnosable. The upload pipeline benefits from more explicit reconciliation and idempotent handling of retries so that transient failures do not create inconsistent states. The public feedback endpoint benefits from abuse mitigation and monitoring. Finally, if monetization is intended, beta unlock should be removed only after Stripe and plan gate enforcement are validated end‑to‑end in a staging environment.

---

### Print and export notes

This report includes explicit page breaks using an HTML page-break directive. For clean PDF export, use a tool that respects page breaks in Markdown, such as Pandoc, a Markdown editor with PDF export, or a documentation pipeline that supports HTML/CSS page break rules.

