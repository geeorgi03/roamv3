# Cursor — ROAM Workbench Screen

## Context
I'm rebuilding ROAM — a choreography workspace Android app — from scratch as a React Native Expo app. The backend is Supabase (already exists, do not touch). I'm building the frontend only.

## What you have
- `TRAYCER_UPDATED.md` — API surface and data models. All endpoints follow `/make-server-837ff822/` prefix. Never deviate from this.
- `ROAM_PRD_FINAL.md` — product decisions and interaction spec
- `/reference/` folder — v4 web prototype showing correct interactions (reference only, not Android code)

## Task: Build the Workbench screen

### Primary layout: tablet landscape (844×600dp)
Split panel — left 65%, right 35%.

**Left panel:**

1. FEELING STRIP — height 56dp
   - Session name: Fraunces 36sp, weight 500, color #3a342d
   - Phrase: Fraunces 16sp italic, color #8a8278
   - Amber tint background (#e8a87c at 8% opacity)
   - Small color dot top right, 10dp circle #e8a87c
   - Border bottom 0.5dp #e8e3dc
   - Tap phrase area to edit (never required, shows placeholder)
   - Tap session name to rename (auto-named by default)

2. VIDEO ZONE — height 180dp, background #000
   - Shows reference video URL if set
   - Mirror toggle top-right: pill, "mirror" label
   - Play/pause overlay center
   - Timestamp bottom-right
   - If no video: placeholder text "add a reference video"

3. WAVEFORM — flex 1
   - 80 bars, stable seeded heights (not Math.random)
   - Use this formula for bar height:
     seed = sin(i * 127.1 + 311.7) * 43758.5
     noise = (seed - floor(seed)) * 0.4 - 0.2
     v = clamp(0.08, 0.95, 0.5 + noise)
     env = 0.4 + 0.5 * sin((i/80) * PI)
     height = (v * env + 0.1) * maxHeight
   - Active loop region: bars colored #7db9a8 at 60% opacity
   - Loop edge lines: 2dp solid #7db9a8
   - Playhead: 1.5dp vertical line #3a342d with 7dp dot top
   - Tap anywhere on waveform: sets playhead position
   - Tap inside loop region: activates that loop

4. BOTTOM BAR — height 52dp, background #ffffff
   - Left side: play button (36dp circle) + "SPD" label + speed steps
   - Speed steps: 0.5× 0.75× 1× 1.25× 1.5×
     Active: bg #3a342d, text white
     Inactive: transparent, border 0.5dp #e8e3dc, text #8a8278
     Font: JetBrains Mono 9sp
   - RIGHT SIDE — LOOP BUTTON (primary left-hand action):
     Width 110dp, full height 52dp
     Background #e1f5ee
     Border-left 0.5dp #7db9a8
     9dp teal dot + "set loop" JetBrains Mono 11sp #085041
     On first tap: dot turns amber, label "tap to close", bg #fff8ee
     On second tap: loop created, dot returns teal, label "set loop"
     Auto-named "loop N" — never prompt for name

**Right panel:**

5. SECTION PILLS — vertical list, padding 8dp
   - 5 sections: INTRO / VERSE / CHORUS / BRIDGE / OUTRO
   - Each pill full width, height 36dp
   - Active: border #7db9a8, bg rgba(125,185,168,0.12), text #3a342d
   - Inactive: border #e8e3dc, bg transparent, text #b8b0a5
   - Clip count right-aligned JetBrains Mono 10sp
   - Tap to switch section
   - Swipe left/right on active section label (workbench header) to change section

6. CLIPS GRID — flex 1, padding 8dp
   - Label: "CHORUS · N clips" JetBrains Mono 8sp #8a8278
   - 44×44dp thumbnails, gap 6dp, flex-wrap
   - REF clips: bg #faeeda, amber badge "REF"
   - MINE clips: bg #e8f4f0, teal badge "MINE"
   - Color-coded by dancer in group sessions

7. RECORD FAB — bottom right, padding 10dp
   - 64dp circle, background #e67c5c (ONLY this element is this color)
   - White 22dp inner circle
   - On record: inner becomes rounded square, outer pulses
   - This is the RIGHT HAND primary action

### Secondary layout: phone portrait (390×844dp)
Same layers stacked vertically:
- Feeling strip (88dp)
- Waveform (100dp)  
- Transport row: play + SPD + speed steps + mirror (52dp)
- Active section row: "CHORUS · 7" with swipe hint (40dp)
- Loop button: full width (52dp)
- Record FAB: fixed bottom-right 24dp from edges

## Interaction rules
- No save button. Everything saves automatically.
- No naming prompts during session.
- Loop button: left hand. Record FAB: right hand. Never adjacent.
- Section switch: swipe left/right on section label. First open shows ← → hint once only.
- Review mode: tap section label to expand full section strip + clips. Tap again to collapse.
- Partner dot pulses once when partner records. No toast. No sound.

## Colors (use exactly)
```
ground:   #f9f7f4
chrome:   #ffffff  
border:   #e8e3dc
inactive: #b8b0a5
muted:    #8a8278
active:   #3a342d
warm:     #d4a574
amber:    #e8a87c
capture:  #e67c5c
mine:     #7db9a8
ref:      #d4a574
```

## Typography
- Fraunces: session name and feeling phrase ONLY
- JetBrains Mono: all labels, buttons, metadata, timestamps
- System sans: nothing (no body text in workbench)

## API calls for this screen
- GET /sessions/:id — load session
- GET /sessions/:id/feeling — load phrase and color
- GET /sessions/:id/loops — load existing loops
- GET /sessions/:id/clips — load clips for active section
- POST /sessions/:id/loops — create loop (auto-named)
- PUT /sessions/:id/feeling — save phrase when edited
- POST /sessions/:sessionId/clips — save recorded clip

## Start here
Build the tablet landscape layout first. Get it rendering correctly with mock data. Then add interactions. Then connect to Supabase.
