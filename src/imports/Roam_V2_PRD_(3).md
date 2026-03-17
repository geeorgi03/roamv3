# Roam V2 — Product Requirements Document

**Version:** 2.1  
**Status:** Draft  
**Scope:** Phases 1–5 (Session Workbench · Micro-cycle · Cleaning Mode · Structured Collaboration · Formation Mapping)  
**Primary target user:** Anyone who already moves and wants to make — from the dancer capturing their first improvised phrase to the working choreographer running a full production

---

## 0. Design Principle

> **Roam remembers so the choreographer doesn't have to.**

That is the only sentence that matters. Every feature in this document exists to serve it. Every feature that is proposed but not in this document gets asked one question before it gets built: does this help the choreographer remember, or does it ask them to do administrative work? If it is the latter, it does not ship.

Choreographers — whether a hip-hop director, a contemporary teacher, or a ballet répétiteur who has spent thirty years defending the irreducibility of movement — are deeply allergic to tools that make their work feel like paperwork. The bar for their trust is high. They will not forgive an interface that asks them to translate their artistry into a system. They will love an interface that feels like a very good assistant: always in the room, never speaks unless asked, never loses anything, and knows exactly which version you meant when you say "the one we did on Tuesday."

Roam's job is not to structure creativity. It is to hold the things that creativity produces — the improvised phrase at 11pm, the note given to a dancer that was perfect and never repeated, the temperature of a section between one rehearsal and the next — and give them back at the right moment.

The tool should disappear. What should remain is the work.

### What this means in practice

- Notes are blank lines, not forms. A choreographer writes "this section should feel like dragging something heavy through water" and that note lives attached to the timecode. No fields. No categories. No axes.
- The clip library is a shoebox of ideas, not a filing cabinet. It should feel like reaching into a pile, not querying a database.
- The formation editor is a floor with tape on it, not a database of positions.
- Structure lives in the infrastructure — search, retrieval, versioning — and is never surfaced as a form the choreographer has to fill in.

### Two fixes validated by simulation (v2.1)

Synthetic simulation across 200 sessions — 100 working choreographers, 100 dancers starting to make — identified two friction points that together account for the largest drop from strong fit to partial fit across both cohorts. Both are addressed in this version.

**Fix 1 — Capture-first entry.** 72% of dancer-maker sessions broke on the music-first requirement. The current flow (session → music → capture) is the wrong door for anyone who has a movement before they have a song. V2.1 adds a capture-first entry path: the app opens to a single record button with zero setup required. The clip saves to an inbox. Session, music, and tags can be added after. This is the front door for the dancer cohort. The workbench remains the front door for the working choreographer who arrives with a song already in mind.

**Fix 2 — Voice-first note pin.** 46% of professional sessions and a significant share of dancer sessions showed note friction — the user stopped to type, lost creative flow, and sometimes abandoned the note entirely. The note pin input is now voice-first: hold to record a memo, release to save. Text remains available as a secondary option. No categories, no fields. The thought lives at the timecode in the user's own voice.

### Feature priority

| Tier | Must feel right |
|------|----------------|
| **Tier 1** | Capture-first entry (no setup required), music sectioning, loop/speed/mirror, voice + text notes at any timecode, section-linked clips, fast retrieval |
| **Tier 2** | Review/cleaning, A/B take comparison, structured feedback, share links |
| **Tier 3** | Formation mapping (floor marks, transitions, clip links), billing polish, advanced AI, full teaching workflows |

---

## 0.5 Phase 0 — Capture-First Entry

### 0.5.1 Problem statement

The current Roam flow requires a session and a music track before a clip can be recorded. For 72% of dancer-maker sessions in simulation, this is the wrong door. They have something in their body — an impulse, a phrase, a response to a sound — before they have a song, a session name, or any organisational intent. Asking them to set up infrastructure before they can capture is the single biggest conversion risk for this cohort.

Even for working choreographers, the music-first gate creates friction in one specific scenario: when an idea arrives away from their usual workflow — in a different studio, after class, at home — and they just need to catch it before it disappears.

### 0.5.2 Goal

Make capture available with zero setup. One button. No session required. No music required. No tag required. The idea is saved. Everything else can happen later.

### 0.5.3 The first screen — two doors

When a new user opens Roam for the first time, or when an existing user has no active session, they see this:

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                  ROAM                       │
│                                             │
│                                             │
│        ┌─────────────────────────┐          │
│        │                         │          │
│        │    ◉  Record            │          │
│        │    Capture something    │          │
│        │                         │          │
│        └─────────────────────────┘          │
│                                             │
│        ┌─────────────────────────┐          │
│        │                         │          │
│        │    ♫  Start a session   │          │
│        │    I have a song        │          │
│        └─────────────────────────┘          │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

Two doors. No hierarchy between them — same size, same visual weight. The choreographer who arrives with a song taps the bottom door and enters the workbench. The dancer who has an impulse taps the top door and goes straight to the camera.

### 0.5.4 Capture-first flow — detailed requirements

#### The record flow

1. Tap "Record" → camera opens immediately, full screen, no modal, no confirmation
2. Recording begins on tap — same behaviour as the capture button in the workbench
3. User records as long as needed, taps to stop
4. Clip saves to the **Inbox** — a temporary holding area for uncategorised captures
5. A minimal quick-save sheet appears (not the full quick-tag sheet):

```
┌─────────────────────────────────┐
│  Saved.                    ✓    │
│                                 │
│  Add to session?   [Later]      │
│  [+ New session]  [Existing →]  │
└─────────────────────────────────┘
```

- "Later" dismisses and returns to the home screen — clip stays in Inbox
- "+ New session" creates a session with this clip as the first item — prompts for a session name (optional, can be skipped)
- "Existing →" opens session picker to assign the clip immediately

#### The Inbox

The Inbox is a lightweight holding area — not a permanent library, not a session. It exists only to prevent ideas from being lost before they are organised.

| Feature | Behaviour |
|---------|-----------|
| Location | Accessible from the home screen as a subtle indicator: "3 unorganised clips" below the two doors |
| Contents | All clips captured without a session assignment |
| Actions per clip | Play, assign to session, delete |
| Nudge | After 48 hours, unorganised clips show a gentle prompt: "You have 3 ideas waiting — want to do something with them?" |
| Auto-expiry | Never. Clips in the Inbox do not expire or delete automatically. The nudge is a suggestion, not a warning. |

#### Voice memo as a standalone capture

The record button also supports voice-only capture — useful when the user wants to describe a movement idea or hum a phrase without video:

- Long-press the record button → voice-only mode (microphone icon, no camera)
- Release to stop
- Saves as an audio note in the Inbox
- Same quick-save sheet as video capture

### 0.5.5 Returning user home screen

For a returning user who has active sessions, the home screen shows their sessions list as the primary content, with the capture button persistent as a floating action button (bottom-right, 56dp) — same as inside the workbench. The two-door screen is only shown when there are no active sessions.

### 0.5.6 Acceptance criteria

- [ ] Camera opens within 200ms of tapping "Record" — no loading screen
- [ ] Clip is saved to Inbox within 500ms of stopping recording
- [ ] "Later" dismisses the quick-save sheet in one tap with no confirmation
- [ ] Inbox is visible on the home screen whenever it contains at least one clip
- [ ] A clip captured in the Inbox can be assigned to a session in under 3 taps
- [ ] Voice-only capture is accessible via long-press with no secondary screen

### 0.5.7 Technical notes

- Inbox stored as clips with `session_id = NULL` — no new table required
- Home screen query: `SELECT * FROM clips WHERE user_id = $1 AND session_id IS NULL ORDER BY created_at DESC`
- 48-hour nudge: a local notification scheduled at capture time + 48h, cancelled if the clip is assigned before then
- Voice-only capture stored as an `annotations` record with `type = 'voice_memo'` and no `clip_id` — or as a clip with `media_type = 'audio'` depending on implementation preference; resolve before Phase 0 build
- The two-door home screen is shown when `SELECT COUNT(*) FROM sessions WHERE user_id = $1` returns 0

---

## 1. Phase 1 — Session Workbench Redesign

### 1.1 Problem statement

The current Roam architecture separates music setup, clips, beat grid, and assembly into distinct screens. This does not reflect how choreographers actually work: they constantly move back and forth between listening, trying, adjusting, and noting. The interface forces context switches that break creative flow.

### 1.2 Goal

Replace the current multi-screen session structure with a single **Session Workbench** screen that contains all creation tools in one unified layout. The workbench becomes the home screen of the app.

### 1.3 Screen layout specification

```
┌─────────────────────────────────────────────┐
│  [Session name]              [Share] [⋮]    │
├─────────────────────────────────────────────┤
│                                             │
│   MULTI-TRACK TIMELINE                      │
│   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ timecode ruler ┄┄┄┄┄┄   │
│ 🎵 [████░░░░░████░░░░░████░░░░░░░░░░░░░░]  │  ← music waveform + section markers
│ 📝 [──●─────────●────●──────────────────]  │  ← note pins track
│ 🎬 [░░░[clip1]░░░░[clip2]░░░░░░░░░░░░░░]  │  ← assigned clips track
│ 🔁 [      ●━━━━━━━●                      ]  │  ← repetition / loop region track
│                                             │
│   intro    verse 1   chorus    verse 2      │
│   [◄◄] [▶] [0.75x] [Mirror] [+ Track]      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│   CURRENT SECTION WORKSPACE                 │
│   Section: Chorus (0:42 – 1:10)             │
│   ┌──────────────────┐  ┌──────────────────┐│
│   │  📎 Idea clip 1  │  │  📎 Idea clip 2  ││
│   └──────────────────┘  └──────────────────┘│
│   + Add clip to this section                │
│                                             │
├─────────────────────────────────────────────┤
│  [Ideas]  [Notes]  [Review]  [Share]        │
└─────────────────────────────────────────────┘
```

### 1.4 Multi-track timeline — detailed requirements

The timeline is the heart of the workbench. It is a horizontally scrollable, zoomable multi-track canvas synchronized to the song's playhead. All tracks share the same timecode ruler. Pinch to zoom in/out; the ruler and all tracks scale together.

#### Default tracks (always present)

| Track | Icon | Purpose |
|-------|------|---------|
| **Waveform + sections** | 🎵 | Music waveform rendered from the audio file. Section markers (intro, verse, chorus, bridge, outro) are auto-generated and user-editable. Tap a section to activate it in the workspace below. |
| **Note pins** | 📝 | A colored dot for each note — text or voice. Long-press any position on this track to drop a pin. The pin input is a blank line and a microphone button: type a thought, or hold the mic to record a voice memo, release to save. No fields, no categories. Just the thought and the timecode. Tapping a dot opens the note inline. |
| **Assigned clips** | 🎬 | Thumbnail blocks showing clips that have been assigned to sections. Block width is proportional to clip duration. Tap a block to open the clip. |
| **Repetition regions** | 🔁 | Active loop regions (see §1.4a). Each region is a colored band with drag handles. Multiple non-overlapping regions can coexist on this track. |

#### Additional tracks (user-added via "+ Track")

Users can add up to 4 additional tracks of the following types:

| Track type | Description |
|-----------|-------------|
| **Reference video** | A reference clip (e.g. a music video, a previous performance) displayed as a thumbnail strip alongside the song. Plays in sync with the main timeline. Useful for "mirror this specific section" workflows. |
| **Lyrics** | Auto-fetched or manually entered lyrics, rendered as scrolling text blocks aligned to timecode. Tap any word to jump to its position. |
| **Counts / 8-count grid** | Overlays 8-count or 16-count markers as vertical lines across all tracks. Toggle on/off per track. |
| **Custom annotation** | A free-draw / free-text lane the choreographer can use for personal shorthand (symbols, arrows, custom notation). |

#### Global timeline controls

| Control | Behavior |
|--------|----------|
| Section markers | Auto-generated from music analysis. User can rename, split, or merge sections by long-pressing a marker. |
| Playback speed | Persistent speed selector: 0.5x, 0.75x, 1.0x. Applied globally to all audio and synced video tracks. |
| Mirror toggle | Flips camera feed and reference video tracks horizontally. Persistent per session. |
| Jump navigation | Tap any section label to jump the playhead to that section's start. |
| Zoom | Pinch gesture. Minimum zoom = full song visible. Maximum zoom = 2 seconds visible (useful for frame-level work). |

### 1.4a Repetition Tool — detailed requirements

The repetition tool lets choreographers isolate any arbitrary region of the song — not just a whole section — and loop it with precise control. This is the primary mechanism for drilling a specific 8-count, a single musical accent, or a tricky transition between two sections.

#### Creating a repetition region

Three ways to create a region:

1. **Tap + drag on the Repetition track** — drag from start point to end point; region is created on finger lift and immediately begins looping.
2. **Long-press on the waveform track** → "Set loop region" → drag handles to refine → confirm.
3. **"Loop this section" shortcut** — tapping the repeat icon (🔁) on any active section creates a region that exactly matches that section's boundaries.

#### Region appearance and interaction

```
🔁  [░░░░░░░░░[●━━━━━━━━━━━━━━━━━━━━●]░░░░░░]
              ▲ drag start handle    ▲ drag end handle
              color = region color (user-assigned)
```

- Each region has a user-assignable color (default: system assigns a distinct color per region)
- Tap the region label to rename it (e.g. "chorus hit", "8-count 3", "bridge transition")
- Tap anywhere inside the region to make it the active loop — playhead jumps to region start and loops
- Only one region plays at a time; tapping a new region stops the previous one
- Regions persist across app sessions; they are saved as part of the session data

#### Repetition controls (shown in transport bar when a region is active)

```
[◄ Region] [▶ Loop] [▶ Once] [Count: ∞ | 2 | 4 | 8] [●──● 0:42–0:51]
```

| Control | Behavior |
|--------|----------|
| **Loop** | Plays the region on continuous repeat until stopped. Default behavior. |
| **Play once** | Plays the region once and stops. Useful for testing timing. |
| **Count** | Loop exactly N times then stop and advance to the next region (if a sequence is set) or pause. Options: 2, 4, 8, or ∞. |
| **Handles (timecode display)** | Shows exact start and end timecode. Tap to enter a precise value manually. |

#### Region sequences (optional, for structured drilling)

Users can arrange saved regions into a **drill sequence** — an ordered list of regions that play one after another:

- Access via long-press on the Repetition track → "Create sequence"
- Drag regions into order
- Set the count per region (e.g. loop region A × 4, then region B × 4, then full section × 2)
- "Run sequence" plays the drill automatically — useful for solo rehearsal or teaching

#### Relationship to capture

When a repetition region is active and the choreographer taps the capture button, the new clip is automatically linked to that region's timecode range (in addition to the section). This makes it easy to later retrieve "all ideas I recorded while drilling the bridge transition."

### 1.5 Section workspace — detailed requirements

- Displays clips assigned to the currently active section
- Shows note pins belonging to the section
- "+ Add clip to this section" triggers the capture/import sheet, pre-linked to current section and timecode
- Section name and time range are displayed as a persistent header
- Swiping left/right navigates between sections without leaving the screen

### 1.6 Bottom tab bar — detailed requirements

| Tab | Content |
|-----|---------|
| **Ideas** | All clips tagged as "idea", filterable by section. One-tap play. |
| **Notes** | All note pins, sorted by timecode. Tap to jump timeline to that position. |
| **Review** | Enters Cleaning Mode (Phase 3). Only enabled once at least one clip is assigned. |
| **Share** | Share link management and feedback inbox (Phase 4). |

### 1.7 Acceptance criteria

- [ ] Workbench loads in under 1.5 seconds on session open
- [ ] Tapping a section activates it in the workspace and jumps playhead to section start
- [ ] Speed control adjusts audio in real time without stopping playback
- [ ] Mirror toggle state persists on app restart
- [ ] Note pin is saved within 300ms of input confirmation
- [ ] All section clips are visible without scrolling for sessions with ≤ 6 clips per section
- [ ] Multi-track timeline renders up to 6 simultaneous tracks without frame drop below 60fps on a mid-range device
- [ ] Repetition region can be created by drag in under 3 seconds with no confirmation required
- [ ] Active loop region plays seamlessly (gap between loop end and loop start ≤ 50ms)
- [ ] Region timecode handles accept manual input and update the loop boundaries immediately
- [ ] Drill sequence runs all regions in order without user interaction once started

### 1.8 Technical notes

- Timeline component replaces the existing Beat Grid view — same underlying beat grid data, new multi-track rendering layer
- Track rendering: each track is an independent horizontally-scrolling layer sharing a single synchronized scroll offset (one `ScrollView` controller driving all tracks)
- Section tap-to-activate uses the existing `music_tracks.sections` data from the music analysis worker
- Mirror state stored in `sessions` table as a boolean column (`mirror_enabled`)
- Note pins stored as `annotations` records with `timecode`, `section_id`, `body`, and `color` fields
- Section versions stored as variant rows in `music_sections` table with a `variant_label` column
- **Repetition regions** stored as a new `loop_regions` table: `{ id, session_id, label, color, start_ms, end_ms, count_limit, created_at }`
- **Drill sequences** stored as `loop_sequences` table: `{ id, session_id, name, ordered_region_ids[] }`
- Reference video track: stores a `clip_id` reference and a `timecode_offset_ms` for manual sync alignment
- Lyrics track: stored as a JSON array of `{ word, start_ms, end_ms }` objects; fetched from a lyrics API or entered manually
- Loop gap target of ≤ 50ms requires pre-buffering the loop start 100ms before the loop end; implement via `AVPlayer` seek-ahead on iOS / `ExoPlayer` on Android

---

## 2. Phase 2 — Micro-cycle: Loop → Capture → Tag

### 2.1 Problem statement

Clips are currently positioned as "media uploads." The real mental model for a choreographer is not uploading — it is **capturing a rough idea before it disappears**. The current UX adds friction at exactly the wrong moment: when the choreographer has something in their body and needs to record it immediately.

### 2.2 Goal

Build the smallest powerful creative loop so that the cycle of listen → loop → record → tag → replay → assign feels addictive and frictionless. If this loop feels right, the product has direction.

### 2.3 One-tap capture flow

#### Trigger
A persistent floating capture button (bottom-right, 56dp) is visible whenever the workbench is active and music is attached.

#### Flow
1. Tap capture button → camera opens in-app, loop continues playing in the background
2. Recording begins immediately (no countdown, no confirm screen)
3. Tap again to stop recording
4. Clip is saved locally within 500ms
5. Quick-tag sheet slides up (see §2.4)
6. Clip auto-links to current section and current timecode

#### Alternative trigger
Long-press on any section in the timeline → opens capture directly pre-linked to that section.

### 2.4 Quick-tag sheet

The quick-tag sheet is a bottom sheet that appears immediately after capture. It is designed to take less than 5 seconds to complete.

```
┌────────────────────────────────────────┐
│  New idea — Chorus (0:42)              │
│                                        │
│  Type:  [Idea] [Phrase] [Transition]   │
│         [Marking] [Full-out]           │
│                                        │
│  Feel:  [Heavy] [Light] [Vulnerable]   │
│         [Sharp] [Fluid] [Explosive]    │
│                                        │
│  Note:  ________________________       │
│                                        │
│  [Skip]                    [Save →]    │
└────────────────────────────────────────┘
```

- All tag selections are optional; "Skip" saves with no tags
- Free text note is a single line; can be expanded after saving
- Tapping "Save" immediately dismisses the sheet; upload begins in background
- Previously used tags surface at the top of each category

### 2.5 Movement memory — library behavior

The Library tab (existing) is repositioned as a **Movement Memory** view. Its purpose shifts from "browse all clips" to "find the right idea for this section."

#### Query patterns that must work
- "Show me all ideas from the chorus"
- "Show me all clips tagged Heavy"
- "Show me all phrases with a hit on 7"
- "Show me all clips from this session, unassigned"

#### Library UX changes
- Default filter pre-set to current session; cross-session toggle available
- Filter chips at top: by Type, by Feel, by Section, by Assigned/Unassigned
- Grid view (2 columns) with clip thumbnail, type badge, and section label
- Long-press clip to reassign section without entering playback

### 2.6 Clip states and upload pipeline (unchanged from V1, surfaced better)

| State | UI treatment |
|-------|-------------|
| Captured (local) | Grey outline, cloud icon with up-arrow |
| Uploading | Progress ring |
| Processing (Mux) | Spinning indicator |
| Ready | Full thumbnail, no badge |
| Failed | Red outline, retry button |

### 2.7 Acceptance criteria

- [ ] Capture button is reachable with one thumb without scrolling
- [ ] Recording starts within 200ms of button tap
- [ ] Clip is locally saved and visible in the section workspace before upload completes
- [ ] Quick-tag sheet is dismissible in under 3 taps
- [ ] "Show me all ideas from chorus" query returns correct results with zero false positives
- [ ] Upload queue resumes automatically after connectivity is restored

### 2.8 Technical notes

- Capture button uses the existing `expo-camera` recording path; no new dependency
- Quick-tag `type` and `feel` values are stored as structured tag fields on the `clips` table
- Section auto-link writes `section_id` and `timecode_ms` at capture time
- Library filter queries are built on existing tag columns; add index on `(session_id, section_id, type_tag)`

---

## 3. Phase 3 — Cleaning / Review Mode

### 3.1 Problem statement

Once creation feels smooth, choreographers need to review their work with precision. The current Roam experience offers playback but no tools for the deliberate "review like a choreographer" process: frame-level scrubbing, annotating on-frame, comparing takes, and building a cleaning checklist. This work currently happens in scattered external tools.

### 3.2 Goal

Build a dedicated Cleaning Mode — accessible from the Review tab in the workbench — that gives choreographers a structured environment for refining clips after the studio session.

### 3.3 Cleaning Mode — screen layout

```
┌────────────────────────────────────────────┐
│  ← Chorus — Review Mode                   │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │           VIDEO PLAYER               │  │
│  │                                      │  │
│  │  [Draw] [Point] [Text]               │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ◄ ║ ► ──●────────────────── 0:04 / 0:12  │
│  [0.5x] [Frame ◄] [Frame ►] [Loop A–B]    │
│                                            │
│  NOTES AT THIS TIMECODE                    │
│  0:04 – "right arm too low on the 3"      │
│  0:07 – "check spacing front row"         │
│  + Add note                                │
│                                            │
│  [Checklist] [Compare] [Export Notes]      │
└────────────────────────────────────────────┘
```

### 3.4 Playback controls — detailed requirements

| Control | Behavior |
|--------|----------|
| Frame step | Advance or rewind one frame at a time using hardware volume buttons or on-screen arrows |
| Fine scrub | Drag the playhead with high precision; scrub preview updates at 10fps minimum |
| Loop A–B | Set A marker and B marker; clip loops between them |
| Speed | 0.25x, 0.5x, 0.75x, 1.0x |

### 3.5 On-frame annotation

- Three drawing tools: **Draw** (freehand stroke), **Point** (arrow with label), **Text** (floating label)
- Annotations are attached to a specific timecode (snapped to nearest 100ms)
- Annotations are visible as dots on the scrub bar; tapping a dot jumps to that frame
- Annotations can be exported as a PDF summary for sharing with dancers (see §3.7)
- Annotations do not alter the original clip file

### 3.6 A/B take comparison

- Available when two or more clips are assigned to the same section
- Side-by-side view on tablet; toggle view on phone (swipe left/right)
- Both clips are synced to the same relative timecode
- User can mark one take as "preferred" with a star; preferred take surfaces first in the section workspace

### 3.7 Cleaning checklist

A structured checklist attached to a clip or section, organized by four lenses:

| Lens | Example items |
|------|--------------|
| **Timing** | Hits land on the correct count, phrase endings are clean, transitions don't rush |
| **Amplitude** | Movements are full-out where intended, small movements are intentionally small |
| **Intention** | Expression matches the section's emotional quality, eye focus is clear |
| **Spacing / Direction** | Directions are consistent, formation holds, lines are clean |

- Items can be checked, marked "needs work," or skipped
- Checklist state is saved per clip version
- Completed checklist can be exported as dancer notes

### 3.8 Export notes

- "Export Notes" generates a PDF or text file containing:
  - Session name, section name, clip name
  - All timecoded text annotations
  - Checklist state with any "needs work" items highlighted
- File is shareable via the native share sheet
- This is a one-way export; it does not create a feedback session (see Phase 4)

### 3.9 Acceptance criteria

- [ ] Frame-step advances exactly one frame at correct fps for the clip
- [ ] On-frame annotation is saved within 500ms of confirmation
- [ ] A/B comparison syncs both clips to within 100ms at all playback speeds
- [ ] Checklist state persists after app is backgrounded and reopened
- [ ] Export generates a readable PDF in under 3 seconds for clips with up to 20 annotations

### 3.10 Technical notes

- On-frame annotations stored as `annotations` records with `timecode_ms`, `annotation_type` (draw / point / text), `data` (JSON path or label), and `clip_id`
- Checklist stored as a JSON blob on the `clips` table under a `cleaning_checklist` column
- A/B comparison requires no new data model; uses existing `section_id` grouping
- PDF export uses a lightweight React Native PDF library (e.g. `react-native-html-to-pdf`); no server-side rendering needed

---

## 4. Phase 4 — Structured Collaboration

### 4.1 Problem statement

Roam V1 already supports share links and time-coded feedback. The gap is that feedback is unstructured: reviewers can comment on anything, which often produces noise ("looked great!"), omits the choreographer's actual questions, and can feel emotionally unpleasant. The research frames this clearly — Liz Lerman's Critical Response process exists precisely because generic feedback sessions are often described as "brutal and not useful."

### 4.2 Goal

Upgrade the feedback experience from "comments on clips" to **guided critique** where the choreographer controls what is asked and in what order.

### 4.3 Sharing a session — revised flow

#### Current flow
Choreographer generates a link → viewer opens it → viewer can comment.

#### V2 flow
1. Choreographer opens the **Share** tab in the workbench
2. Choreographer sets a **feedback brief** before sharing:
   - What is this version? (e.g. "Draft 2 of the chorus section")
   - What are my specific questions? (up to 3, free text)
   - What feedback am I not looking for yet? (optional)
3. System generates a share link scoped to this brief
4. Viewer opens link → sees the brief before watching → watches clips → responds in the structured form

### 4.4 Structured feedback form — viewer experience

The viewer's response form follows a fixed sequence that mirrors Liz Lerman's Critical Response process:

```
Step 1 — What stayed with you?
  "Describe something specific you noticed or remember from what you watched."
  (Free text, required)

Step 2 — Choreographer's questions
  [Question 1 from the brief — free text answer]
  [Question 2 from the brief — free text answer]
  [Question 3 from the brief — free text answer]

Step 3 — Neutral observations
  "Is there anything you noticed that you'd like to ask about — without interpreting it?"
  (Free text, optional)

Step 4 — Opinions (gated)
  Only shown if the choreographer enabled this section in the brief.
  "If you have a suggestion, share one specific, actionable idea."
  (Free text, optional)
```

- Timecodes are still available: viewer can add a timecode reference to any response
- The form cannot be reordered by the viewer
- Step 4 is hidden by default; choreographer must explicitly enable it in the brief

### 4.5 Choreographer's feedback inbox

The feedback inbox replaces the current comment list with a structured view:

```
┌────────────────────────────────────────────┐
│  Feedback — Chorus Draft 2                 │
│  3 responses                               │
│                                            │
│  ▼ What stayed with you                    │
│  • "The arm isolation on the 7 — clear"    │
│  • "The energy drop going into the bridge" │
│  • "The unison in the second half"         │
│                                            │
│  ▼ Your question: "Does the bridge feel    │
│    intentional or like a mistake?"         │
│  • "Intentional — it reads as a pause"     │
│  • "I wasn't sure if it was a reset"       │
│  • "The pause works for me"                │
│                                            │
│  ▼ Neutral observations                    │
│  • 0:07 – "The left side seems further     │
│    back — is that a formation choice?"     │
│                                            │
└────────────────────────────────────────────┘
```

- Each section is collapsible
- Timecoded responses show a jump-to button linking to the relevant clip moment
- Feedback is linked to the session version (brief version label), not just the clip

### 4.6 Versioned feedback

- Each share brief is saved as a feedback session with a `version_label` (e.g. "Draft 2")
- Responses are stored under that version
- Choreographer can view past feedback versions side by side to track how the work has evolved
- Responses from outdated versions are visually dimmed but not deleted

### 4.7 Acceptance criteria

- [ ] Share brief can be created in under 2 minutes with no required fields beyond the version label
- [ ] Viewer feedback form enforces the step order; Step 4 is hidden unless enabled
- [ ] Feedback inbox groups responses by question, not by reviewer
- [ ] Timecoded references in feedback are tappable and jump to the correct clip moment
- [ ] Past feedback versions are accessible from the Share tab with a version selector

### 4.8 Technical notes

- `share_tokens` table gains a `brief` JSONB column: `{ version_label, questions[], step4_enabled }`
- `feedback_comments` table gains a `step` column (1–4) and a `question_index` column
- Feedback inbox is a new API endpoint: `GET /sessions/:id/feedback-summary` that groups responses by step and question
- Viewer flow requires no authentication; brief and questions are embedded in the share page payload

---

## 5. Phase 5 — Formation Mapping

### 5.1 Problem statement

ArrangeUs exposes the real gap: formation tools show you where dancers end up, but not how they got there or what is happening in the movement itself. The deeper problem is that most formation tools feel like CAD software. They are built for documentation. Choreographers need something that feels like putting tape on a studio floor — fast, physical, disposable, and immediately revisable.

### 5.2 Design principle for this phase

The formation editor is a floor with tape on it, not a database of positions. The default state is an empty stage and a pencil. Nothing else is visible until the choreographer asks for it.

### 5.3 Goal

Add a floor-mark editor to the workbench that lets choreographers place dancers, animate transitions between floor states, and link those states to sections and clips — in under thirty seconds per formation, with no setup required.

### 5.4 Where formation mapping lives in the UI

Formation mapping is added as a fifth track on the multi-track timeline:

```
🎵  waveform + sections
📝  note pins
🎬  assigned clips
🔁  repetition regions
💠  floor marks          ← NEW: one dot per saved formation on the timeline
```

Tapping a floor mark dot on the timeline opens the Floor Mark Editor as a full-screen modal. The modal can be dismissed to return to the workbench at any time without losing state.

### 5.5 Floor Mark Editor — default screen

The default state is intentionally minimal. The stage is almost the entire screen. There is no panel, no list, no sidebar.

```
┌────────────────────────────────────────────────┐
│  ←                              [⋮]            │
│                                                │
│                                                │
│        ╔══════════════════════════╗            │
│  BACK  ║                          ║            │
│        ║       ● A    ● B         ║            │
│        ║     ● C   ● D   ● E     ║            │
│        ║                          ║            │
│  FRONT ╚══════════════════════════╝            │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│  Chorus · 0:42    ← 2 / 4 →    [Animate →]    │
│                                                │
│  [◎ Floor marks]  [↗ Paths]  [🎬 Clip]        │
└────────────────────────────────────────────────┘
```

Everything that is not the stage is hidden behind the overflow menu (⋮) or behind the three bottom tabs. The dancer list, the position coordinates, the crossing detection detail — none of it is visible by default. It exists, but it does not interrupt the act of placing.

### 5.6 Stage floor — detailed requirements

| Feature | Behavior |
|--------|----------|
| Grid | Subtle dot grid — not a hard grid. Dots at regular intervals give spatial reference without imposing a rigid structure. Dancers snap loosely to the dot grid but can be placed between dots with a slow drag. |
| Stage orientation | "BACK" at top, "FRONT" at bottom. Single tap on either label to flip the whole view for choreographers who prefer to work from the audience's perspective. |
| Dancer tokens | Circular tokens, 32px diameter. Each dancer gets a distinct color auto-assigned on first placement. Displays initials (2 chars). |
| Direction | Each token has a subtle arrow. Drag the arrow tip to rotate direction freely. Snaps to 45° increments on release. |
| Place a dancer | Tap any empty floor position → dancer appears. If no roster exists yet, the app creates "Dancer 1" automatically. No name required to start. |
| Move a dancer | Drag. The token follows the finger. Other tokens do not move. |
| Group move | Two-finger drag inside a selection to move multiple tokens together. |
| Remove a dancer from this mark | Long-press token → "Remove from this mark." The dancer is not deleted from the session, only from this floor state. |
| Zoom and pan | Pinch to zoom. Two-finger drag to pan. |

### 5.7 Floor mark snapshots

A floor mark is the state of the stage at one moment: all dancer positions and directions. The word "snapshot" is never shown in the UI. The word "formation" is used sparingly and only where it feels natural.

| Feature | Behavior |
|--------|----------|
| Create | Tap anywhere on the floor mark timeline track → new mark appears, inheriting positions from the previous mark. Only dancers who change position need to be moved. |
| Name | Default: section name + number (e.g. "Chorus 2"). Tap to rename in plain language ("diamond," "open," "scattered") — or leave it unnamed. |
| Navigate | ← → arrows in the bottom bar move through marks in section order. |
| Thumbnail strip | Swipe up from the bottom bar to reveal the full strip of mark thumbnails for the session. Swipe down to hide it again. Hidden by default. |
| Delete | In the thumbnail strip: swipe left on a thumbnail → delete. |

### 5.8 Path animations

Path animations show how dancers move between two floor marks. They are accessed from the "Paths" tab in the bottom bar — not visible on the default floor view.

| Feature | Behavior |
|--------|----------|
| View paths | Tap "↗ Paths" → the floor shows curved lines from each dancer's previous position to their current position. Color matches the dancer's token. |
| Crossing warning | Where two paths cross, a small orange dot appears on the crossing point. No modal, no alert — just the dot. Tap it to see which two dancers are involved. |
| Animate | "Animate →" plays all tokens moving from the previous mark to the current mark, synced to the current BPM for the set count duration. |
| Adjust path | Tap a path line to drag its arc. Useful when dancers need to avoid each other. |
| Count duration | Tap the count indicator in the animation bar to set transition length: 2, 4, 8, or 16 counts. |

### 5.9 Clip link

The "🎬 Clip" tab in the bottom bar lets the choreographer attach one clip from the session library to this floor mark. When a clip is linked, a small play button appears in the corner of the stage. Tapping it plays the clip in a half-screen overlay so the choreographer can compare the floor diagram to the filmed movement side by side. Tapping again dismisses the overlay. Nothing else changes on the screen.

### 5.10 Dancer roster (hidden by default)

The dancer roster lives behind the overflow menu (⋮) → "Dancers." It is not shown on the main editor screen. From the roster the choreographer can rename a dancer, change their color, or remove them from the session entirely.

Dancers are added to the session the first time they are placed on a floor mark. The app assigns them a name ("Dancer 1," "Dancer 2") and a color automatically. The choreographer can rename them from the roster at any time, and the names update across all marks.

### 5.11 Floor marks in the share page

When a session is shared, the choreographer can optionally include floor marks in the share. The share page shows each mark as a read-only floor diagram alongside its linked clip if one exists. Enabled via "Include floor marks" toggle in the share brief.

### 5.12 Acceptance criteria

- [ ] A floor mark with 6 dancers can be created and saved in under 30 seconds with no prior setup
- [ ] Placing a dancer requires a single tap — no name, no form, no confirmation
- [ ] Dragging a token to a new position feels immediate — no lag on mid-range devices
- [ ] Direction arrow update requires one drag gesture, no confirmation
- [ ] Path animation plays at correct BPM-synced speed for the set count duration
- [ ] Crossing dot appears correctly for all intersecting paths in groups up to 12 dancers
- [ ] Linked clip overlay opens and dismisses without disrupting the floor mark state
- [ ] Thumbnail strip is hidden by default and revealed only on explicit swipe up

### 5.13 Technical notes

**New tables:**

```sql
floor_marks (
  id, session_id, section_id, timecode_ms,
  label, clip_id (nullable), mark_order,
  created_at
)

floor_dancers (
  id, session_id, name, color_hex, initials,
  created_at
)

floor_positions (
  id, mark_id, dancer_id,
  pos_x, pos_y, direction_degrees,
  created_at
)

floor_transitions (
  id, from_mark_id, to_mark_id,
  duration_counts, duration_ms,
  path_type (straight | curved),
  created_at
)
```

- Floor mark track in the timeline is rendered as an additional SVG layer over the existing track canvas — same scroll/zoom controller as other tracks
- Dot grid rendering: dots at every 40px at 1× zoom, scaling with pinch; no hard grid lines in the database — positions are stored as float `(pos_x, pos_y)` in stage-relative coordinates (0.0–1.0), converted to screen coordinates at render time
- Transition path rendering uses cubic Bézier curves; crossing detection uses line-segment intersection math (no heavy geometry library needed)
- Animation preview uses `Animated.timing` (React Native) with per-dancer interpolation from position A to position B
- BPM-synced animation: `duration_ms = (duration_counts / beats_per_bar) * (60000 / bpm)` using the session's analyzed BPM
- Voice memo note pins stored as audio files in Supabase Storage under an `audio-notes` bucket; `annotations` table gains a `voice_memo_url` column alongside the existing `body` text column
- Auto-assigned dancer name: `SELECT COUNT(*) FROM floor_dancers WHERE session_id = $1` → "Dancer N+1"
- Max 24 dancers × 20 floor marks = 480 position records per session — well within Supabase row limits

---

## 6. What Roam V2 Does Not Do

These are explicit non-goals for V2 to prevent scope creep:

- **Not a full video editor.** Roam includes trim, crop, mirror, and a reference video track. It does not replace CapCut. No color grading, effects, or compositing.
- **Not a notation system.** Roam supports tags, notes, and annotations. It does not implement Labanotation, Benesh, or any formal movement encoding.
- **Not a 3D formation simulator.** Formation mapping in V2 is 2D top-down only. No 3D perspective, no camera angle simulation, no lighting or stage production features.
- **Not a social platform.** Roam share links are functional, not social. No public profiles, follower counts, or feeds.
- **Not a full teaching platform.** Teaching plan mode (chunking, progressions, student management) is a post-V2 consideration.

---

## 7. Rollout Sequence

| Phase | Trigger to start | Trigger to ship |
|-------|-----------------|-----------------|
| Phase 0: Capture-first entry | V1 stabilized | Camera opens in < 200ms; Inbox clip assigned to session in < 3 taps; validated with 3 dancer-makers who have never used Roam |
| Phase 1: Workbench | Phase 0 shipped | Workbench session open time < 1.5s; loop-to-record flow validated with 3 working choreographers |
| Phase 2: Micro-cycle | Phase 1 shipped | Capture-to-tag loop under 10s in usability test with zero confusion points |
| Phase 3: Cleaning Mode | Phase 2 shipped; creation loop confirmed | Frame step accurate; checklist export usable without explanation |
| Phase 4: Structured Collaboration | Phase 3 shipped | Feedback brief creation under 2 min; reviewer form completion rate > 60% |
| Phase 5: Floor Marks | Phase 4 shipped; at least 10 active sessions with 4+ dancers | Floor mark created in under 30s with no setup; validated with 3 choreographers from different traditions |

---

## 8. Open Questions

1. **Speed control without pitch shift:** Should V2 include pitch correction at 0.5x? Adds complexity; choreographers may prefer the "chipmunk" sound as a signal that playback is slowed.
2. **Mirror on imported clips vs. live camera:** Is mirror applied to the video file playback, the camera preview, or both? Define per-surface behavior before Phase 1 build.
3. **Section auto-detection quality:** How accurate is the music worker's section segmentation? If accuracy is below 80%, should V2 offer a manual sectioning mode before auto-detection?
4. **Note pin colors:** Should choreographers be able to assign meaning to pin colors (e.g. "red = timing issue") or should colors be decorative only?
5. **Feedback form localization:** The structured feedback form references concepts (e.g. "neutral observation") that may not translate cleanly. Consider whether the form needs cultural variants for different markets.
6. **Loop gap tolerance:** The 50ms seamless loop target is achievable on modern devices but may degrade on older hardware. Define a fallback behavior (e.g. a brief visual flash instead of audio stutter) if the target cannot be met.
7. **Reference video sync:** When a reference video track is added, should it auto-sync to the music's beat grid or require manual offset adjustment? Auto-sync requires beat detection on the reference clip — possible with the existing Python worker but adds processing time.
8. **Voice memo playback in context:** When a note pin contains a voice memo, should it auto-play when the timeline passes that timecode during playback, or only on explicit tap? Auto-play could be powerful in rehearsal but disruptive in a quiet studio.
9. **Dot grid vs. hard grid:** The spec uses a soft dot grid for the floor mark editor. Test with at least one ballet teacher — the ballet tradition is used to precise grid-based staging notation and may prefer hard lines. If so, offer a toggle: "dots" vs. "grid lines."
10. **Floor mark sharing granularity:** Should individual floor marks be shareable as standalone images (useful for sending to dancers before rehearsal), or only accessible within the full session share?

---

*Document produced from: Roam V1 product spec, UX reference notes, choreographer testimony (STEEZY / ClayDohBoon / Jun Quemado), Lia Kim / Jay Kim interviews, ArrangeUs UX analysis, and advanced choreography process research mapping.*
