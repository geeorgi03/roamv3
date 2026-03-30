# Cursor — ROAM Group Session Screen

## Context
Part of the ROAM React Native Expo rebuild. Build after spatial layer is approved.

## Task: Group Session (3–5 dancers)

Two distinct views sharing the same session data.

---

## CHOREOGRAPHER VIEW (tablet landscape)

**TOP BAR**
- Session name (Fraunces 22sp) left
- "N dancers" label right (JetBrains Mono 9sp #8a8278)
- Dancer presence dots (10dp circles, dancer colors)
  - Online: full opacity
  - Offline: 30% opacity
- Dot pulses briefly when that dancer records a clip

**LEFT PANEL (57%) — formation canvas**
Same as spatial layer canvas. Full floor grid.
All dancer dots visible, all paths visible.

Section/moment strip above canvas.

Moment strip below canvas.

**Bottom bar:**
- Speed steps left
- Loop button right (same as workbench)

**RIGHT PANEL (43%)**

Top: mini waveform (44dp)
Loop status label below waveform

Dancer roster (scrollable):
- Each row: dot + name + status (● active / ○ idle / offline)
- Tap row: selects dancer on canvas
- Selected: tinted border, dancer color

Broadcast input:
- Text field: "send note to all dancers…"
- 60 character HARD LIMIT — counter shows chars remaining
- "→ all" send button
- On send: all dancer screens slide-in notification at top

Record FAB bottom-right (same as workbench)

---

## DANCER VIEW (phone portrait)

**TOP BAR**
- Session name left
- Dancer badge right: dancer initial + color background

**LEFT PANEL (57%) — full formation**
CRITICAL: All dancer dots visible. All paths visible.
This dancer's dot: 20dp + subtle color ring
Other dancers: 14dp, full opacity (not dimmed)

The dancer needs to see the whole formation — not just their position.
They are part of a group piece. Dimming others enforces individualism.

Position note below floor (choreographer-written, relational language):
- "middle of the diagonal, between B and C"
- "your path crosses D's at bar 18 — you pass behind"
- JetBrains Mono 9sp #3a342d, teal-tinted background

**RIGHT PANEL (43%)**

Choreographer notes (scrollable, max height 80dp):
- Each note: text + timestamp
- New notes slide in at TOP for 4 seconds then fade to this panel
- Always re-readable here

All clips — EVERYONE'S clips, color-coded:
- Label: "ALL TAKES · CHORUS"
- 40×40dp thumbnails
- Border color = dancer color
- Dancer initial bottom-right of thumbnail
- Tap any clip to play
- Caption: "everyone's clips — tap any to play"

Record FAB bottom-right
- Label above: "record your take"
- Sublabel: "visible to the group"

---

## Real-time sync
Use Supabase Realtime subscriptions:
- Formation changes broadcast to all dancers immediately
- New clips appear in all participants' clip grids
- Broadcast notes arrive in real-time
- Dancer dot presence updates every 30s

## API calls
- POST /sessions/:sessionId/join — join as dancer (role assigned)
- GET /sessions/:sessionId/dancers — get all participants
- PUT /sessions/:sessionId/dancers/:dancerId/position — update position note
- POST /sessions/:sessionId/broadcast — send note (60 char max enforced server-side)
- GET /sessions/:sessionId/broadcasts — get broadcast history
- GET /sessions/:sessionId/clips — all clips (all dancers)
- Supabase Realtime: subscribe to formation, clips, broadcasts tables
