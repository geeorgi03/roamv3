# Roam V2 — Figma Prompts
All screens to design. One prompt per feature section.

---

## 1. Stem Focus Control (§1.4b)

Design a minimal stem focus control for a music player bar in a dark-mode choreography app called Roam.

Context: The music bar sits at the bottom of the session workbench. It contains a waveform scrubber, playback controls, loop markers, and speed control. The stem control is a new, low-priority element — it should not compete visually with anything else on the bar.

Default state (no stem selected):
- No badge, no icon, no label visible in the music bar
- A very subtle text label "Stems" or a small horizontal-layers icon sits quietly at the far right of the bar, visually lighter than any other control
- It does not draw the eye

Active state (a stem is selected):
- The label changes to show what is active: "Listening to: Bass"
- Still quiet — same visual weight as default, just with a different label
- No color change, no highlight, no badge

Popover (appears on tap):
- Compact, appears above the bar, anchored to the stem control
- Lists what the AI detected, e.g.: Drums / Bass / Melody / Vocals
- If sub-stems were resolved: Guitar and Strings appear indented under Melody as additional options
- "Everything" is always at the bottom of the list as the reset option
- Each row is a simple tap target — no checkboxes, no toggles, no sliders
- Active selection shown with a single filled dot or subtle underline — not bold, not colored
- Popover dismisses on selection or on tap outside

Off state (feature disabled):
- The stem control is completely absent from the bar — as if it never existed
- Show this state as a separate artboard labeled "Stems off"

Style: dark background, muted typography, high contrast only where it matters (active playhead, active section). The stem control should feel like a whisper on the bar, not a feature announcement.

---

## 2. Multi-Loop Regions on the Timeline (§1.4c — part 1)

Design the multi-loop region system for the Repetition track in a dark-mode music timeline (Roam).

The Repetition track is one horizontal lane on a multi-track timeline. It currently supports one loop region shown as a colored band with drag handles. Now it needs to support multiple coexisting regions.

Timeline state with multiple regions:
- Show 3 loop regions on the same Repetition track lane
- Each region is a distinct color (auto-assigned, e.g. teal, amber, coral)
- Each region has: a short label ("Loop A", "Loop B", "Loop C") inside or above the band, and two drag handles at start and end
- Where two regions overlap, show a subtle hatched fill in the overlap zone — the regions themselves remain visible on both sides of the overlap
- Dimmed regions (inactive toggle) appear at 40% opacity on the timeline — still visible, clearly off

Loop management tray:
- Sits below the Repetition track, collapsed by default
- Expanded state shows rows: color swatch · name · timecode range · active toggle · delete (×)
- Tray header has a small chevron to collapse/expand
- Active toggle: pill toggle, not a checkbox
- The tray is compact — each row no taller than 36px

Transport bar (when loops are playing):
- Show a small label: "Loop B playing" with the region's color dot
- No other change to the transport bar layout

Show three artboards: timeline with all 3 regions active, timeline with one region dimmed/inactive, and the tray expanded.

---

## 3. Continuous Recording + Takes Panel (§1.4c — part 2)

Design the recording UI for continuous multi-take capture during a looped session in Roam (dark-mode choreography app).

The recording layer sits on top of the workbench — it is not a separate screen. It should feel like a camera viewfinder overlay, minimal and non-intrusive.

Recording active state (overlaid on the workbench):
- A red recording dot (●) in the top-left corner — static, does not pulse
- Take number shown beside it: "Take 2" — small, same weight as the dot
- A loop cycle counter below: "Cycle 3" — even smaller, clearly secondary
- Timecode of current recording duration bottom-right
- "New take" button — accessible with one thumb, bottom-right area, above the capture button. Small, outlined, not filled. Tapping it saves current take and starts the next one immediately — no confirmation.
- "Stop" button replaces the capture button during recording

Takes panel (slide up from bottom):
- A bottom sheet that slides up from the transport bar — accessible during an active recording
- Each row: take number · duration · play (▶) · export (→) · delete (×)
- "Export all takes" button at the top of the sheet
- Sheet is dismissible by swipe down
- Active recording shown at the top of the list as "Recording…" with a live duration counter

Two artboards: recording active state (overlaid on the session workbench), and takes panel open showing 3 completed takes + 1 active recording.

---

## 4. Music Source Import — URL Paste (§1.4d)

Design the music attachment flow for a dark-mode choreography app called Roam. This flow appears in two places: when setting up a new session, and when adding music to an existing session from the workbench.

The flow supports two inputs — file upload and URL paste — presented with equal visual weight. No preference is implied between them.

─── Artboard 1: Music attachment sheet (default state) ───

A bottom sheet or modal. Minimal. Two options:

  [ Paste a Spotify or YouTube link        ]
                    or
  [ Upload a file  ↑ ]

The URL input is a standard text field with a placeholder. The file option is a secondary action below it. No icons, no decoration. The sheet has a title: "Add music" — that's it.

─── Artboard 2: URL pasted — preview loading ───

User has pasted a valid URL. The field now shows the URL (truncated). Below it, a subtle loading state: a small spinner + "Finding track…" The two original options are replaced by this preview area while it resolves. No full-screen loader — just the field + inline state.

─── Artboard 3: Preview ready — confirm ───

Track metadata has resolved. Show:
  - Track name (14px, primary)
  - Artist name (12px, secondary)
  - Duration (12px, secondary)
  - A small waveform placeholder (flat, static — not yet rendered)
  - [Confirm] button — primary, full width
  - [Cancel] — text link below

Nothing else. No album art. No streaming logo. No branding.

─── Artboard 4: Extraction in progress (inside workbench) ───

The music attachment sheet has dismissed. The user is back in the workbench. The waveform track shows a loading state — a subtle animated fill sweeping across the waveform placeholder from left to right. A small inline label: "Importing track…" No modal, no progress bar, no overlay. The rest of the workbench is fully usable.

─── Artboard 5: Error state ───

Extraction failed. A plain inline message replaces the preview:
  "This track couldn't be imported."
  "Try uploading an audio file instead."
  [Upload a file ↑]

No technical error. No retry spinner. Just the message and the fallback.

Style: dark-mode-first. No streaming platform colors or logos anywhere. The URL paste should feel like typing an address, not connecting an account.

---

## 5. Lightweight Share — "What stayed with you?" (§2.9)

Design the lightweight share flow for a dark-mode choreography app called Roam. This is not a collaboration feature — it is a safe container for sharing rough work. The entire point is that the viewer can only respond to one question. Nothing else is collected.

─── Artboard 1: Share sheet (from a clip) ───

A bottom sheet triggered from any clip. Minimal. Two options with clear hierarchy:

  Share this clip

  Viewers will be asked:
  "What stayed with you?"

  That's the only question.
  No other feedback is collected.

  [Copy link]    [Send]

The two question lines should feel reassuring — warm, plain language, not legal or technical. The "That's the only question." line is important: it's the trust signal. Make it legible and calm.

No version label field. No "add a question" option. No toggles. One action: generate the link.

─── Artboard 2: Link generated ───

After tapping [Copy link], the sheet updates in-place:

  Link copied  ✓

  Anyone with this link can watch and respond.
  [Done]

No confetti. No animation. Just confirmation. Warm but minimal.

─── Artboard 3: Viewer experience (web, mobile-sized) ───

The viewer opens the link on their phone browser. They see:

  [Video player — full width, 16:9]

  ───────────────────────────────

  What stayed with you?

  Describe something specific you
  noticed or remember.

  [                               ]  ← text input, large tap target
  [                               ]

  [Send response]

Nothing else. No Roam branding beyond a small wordmark. No rating. No opinion field. No "add a comment." The form is the message: this is all you can say, and that is intentional.

─── Artboard 4: Responses visible to the choreographer ───

Back in the Roam app, inside the clip detail view. A collapsed section at the bottom:

  ▼ 3 responses — what stayed with them

  • "The moment where both arms drop at the same time"
  • "The stillness at the end — I wasn't expecting it"
  • "The way the phrase restarted felt intentional"

Simple list. No names unless the viewer chose to add one. No timestamps shown by default. No threading. Just the responses.

─── Artboard 5: Empty state (no responses yet) ───

Same collapsed section at the bottom of the clip:

  ○ No responses yet
    Share the link to get feedback

One line. No illustration. No empty state graphic.

Style: dark-mode-first for the in-app screens. The viewer web page should be light-mode, minimal — it lives outside the app and should feel approachable to someone who has never used Roam.

---

## What to give Traycer after Figma is done

1. `Roam_V2_PRD_Combined.md` — the what and why
2. `roam-stack.md` — the technical context (fill in the 3 blanks first)
3. `Roam_Simulation_Report.docx` — the priority reasoning
4. Your Figma file link — paste into `roam-stack.md` before uploading

In Traycer: replace any old PRD, add the other files as supporting context, re-sync.
In Cursor `.cursorrules`:
```
PRD: /docs/Roam_V2_PRD_Combined.md
Stack: /docs/roam-stack.md
Figma: [your published Figma link]
```
