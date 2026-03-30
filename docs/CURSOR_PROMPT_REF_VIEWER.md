# Cursor — ROAM Reference Viewer Screen

## Context
Part of the ROAM React Native Expo rebuild. Build after workbench is approved on device.

## Task: Reference Viewer screen

This screen opens when a REF clip is tapped, or when a URL is shared into Roam.

### Architecture decision (critical)
Do NOT embed Bilibili or XHS video in a WebView inside the app. These platforms break, require login, and have geo-restrictions.

Instead:
- YouTube: embed via react-native-youtube-iframe (works reliably)
- Bilibili / XHS: store [url + startTimestamp + endTimestamp], show thumbnail, deep-link to native app at timestamp on play tap
- All platforms: the loop is defined by timestamps stored in Supabase, not by scrubbing inside Roam

### Layout (phone portrait — this is a modal sheet over the workbench)
Opens as a bottom sheet that slides up. Swipe down to dismiss. The workbench is always visible underneath when partially open.

**DARK ZONE (top, background #0d0d0c):**

1. VIDEO HEADER — padding 8dp
   - Left: active loop name, JetBrains Mono 9sp #6a6560
   - Right: mirror toggle pill (background rgba(255,255,255,0.07))
   - Mirror flips the video horizontally

2. VIDEO — aspect ratio 4:3 (not full 16:9 — crops slightly to give controls room)
   - YouTube: embedded player
   - Bilibili/XHS: thumbnail + "open in [app]" tap
   - Play/pause overlay center
   - Timestamp bottom-right

3. PROGRESS BAR — padding 10dp 14dp
   - 2dp track, color #2a2825
   - Active loop region: loop color at 35% opacity
   - Loop edge lines: 3dp vertical, loop color
   - Playhead: 1.5dp line + 7dp dot, color #e8e4dc
   - Tap track to seek

4. SKIP + SPEED — padding 4dp 14dp
   - Back button (30dp circle, rgba(255,255,255,0.06))
   - "spd" label JetBrains Mono 9sp #3a3835
   - Speed slider (continuous, 0.25×–2×, thumb color #c8b89a)
   - Speed readout JetBrains Mono 10sp #c8b89a
   - Forward button (same as back)
   - Skip default ±5s. Long-press to change: 3s / 5s / 10s picker

**LIGHT ZONE (bottom, background #f9f7f4):**

5. LOOP CHIPS — padding 10dp 14dp
   - Horizontal scrollable row
   - Chip: JetBrains Mono 9sp, border 0.5dp
   - Active chip: loop color border + tinted background, colored text
   - Inactive chip: border #e8e3dc, text #8a8278
   - TAP chip: jumps playhead to loop start, activates loop
   - SWIPE LEFT chip: removes loop (undo snackbar for 3s)
   - "+" button: adds new loop from current playhead position
   - Auto-named "loop N" — never prompt for name
   - Loop set interaction: NOT by scrubbing. 
     User watches video natively (Bilibili/YouTube app).
     A floating Roam overlay button captures current timestamp.
     First tap = loop start. Second tap = loop end.
     For YouTube embedded: use player getCurrentTime()

6. SAVE ACTIONS — padding 12dp 14dp
   - "save to session" button (flex 1): background #7db9a8, text white
     On tap: flashes green + checkmark for 800ms, returns to normal
   - "the moment →" button: border #e8a87c, Fraunces italic #e8a87c
     This saves to the session-level feeling layer quality target
     Separate from "save to session"

## Interaction rules
- Sheet dismisses on swipe down or Android back gesture
- No navigation — this is a layer, not a screen
- Mirror: flips video CSS/transform only, no backend call
- Speed: applies to YouTube player playback rate. For native deep-links: passes speed param where supported
- All loop data: [sourceUrl, startTimestamp, endTimestamp, color, name] saved to Supabase

## API calls
- GET /sessions/:sessionId/loops — load loops for this source URL
- POST /sessions/:sessionId/loops — create new loop
- DELETE /sessions/:sessionId/loops/:loopId — remove loop
- POST /sessions/:sessionId/clips — save as REF clip
- PUT /sessions/:id/feeling — save "the moment" clip reference

## Colors
Same as workbench. Dark zone uses inverted palette (#0d0d0c base).
