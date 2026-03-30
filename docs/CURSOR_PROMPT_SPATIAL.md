# Cursor — ROAM Spatial Layer Screen

## Context
Part of the ROAM React Native Expo rebuild. Build after reference viewer is approved.

## Task: Spatial Layer screen

A floor sketch tool attached to any section. Not a notation system. A sketch note.

### Layout (tablet landscape — opens as a full screen from MAP tab)

**TOP BAR**
- Session name left, JetBrains Mono 9sp section name right
- Moment strip: horizontal scrollable chips below top bar
  - Each chip: moment name, JetBrains Mono 9sp
  - Active chip: border #7db9a8, tinted background
  - Tap chip: load that moment's formation
  - Long-press chip: rename moment
  - "+" button: create new moment at current beat

**MAIN: FLOOR CANVAS (left 65%)**
Background #faf8f5. Grid lines 0.5dp #ede8e0.
Grid lines: 22dp spacing.
Center lines: 0.5dp dashed #e8e3dc (vertical and horizontal).
Labels: "audience" bottom, "backstage" top — JetBrains Mono 7sp #b8b0a5.

**Dancer dots:**
- Circle, color = dancer color, 14dp default, 20dp if selected
- White border 1.5dp
- Dancer initial letter inside, white, JetBrains Mono 6sp bold
- Orientation arrow: small chevron on dot edge showing facing direction
  - Rotate by dragging the arrow handle
  - THIS IS REQUIRED — without it formation is ambiguous
- Selected dot: 2dp dark border + color shadow ring
- Tap dot: select it (shows in roster, allows repositioning)
- Drag dot: reposition on floor

**Paths between dots:**
- Curved by default (cubic bezier)
- Color = from-dancer color, 1.5dp, dashed 5dp/3dp, opacity 0.55
- Drag midpoint handle to adjust curve
- Tap path: opens quality tag field (one word, free-form)
  - Suggestions: float / slash / press / glide / dab / flick
  - JetBrains Mono 9sp, shown as small label on path midpoint
- Straight path = drag midpoint back to center

**Relationships:**
- Solid line between two dots, 1dp, dancer A color
- Label: one word (supports / unison / canon / leads / follows)
- JetBrains Mono 8sp

**Tool order (progressive disclosure — critical):**
1. POSITION tool active on first open (place dots)
2. PATH tool unlocks after first dot is placed
3. RELATIONSHIP tool unlocks after first path is drawn
Never show all three tools at once on first open.

**Tool bar — bottom of canvas:**
- Three tool buttons: position · path · relationship
- Active tool: filled background #3a342d, white icon
- Inactive: transparent, border #e8e3dc, icon #8a8278
- Locked tool: opacity 0.3, not tappable

**RIGHT PANEL (35%): quality layer + waveform**

Top: mini waveform (48dp) showing active loop and playhead
     Tap to scrub to a beat

Quality layer (hidden by default):
- "+" next to moment name to expand
- Never shown automatically

When expanded, shows 4 fields:
1. INITIATION — free text field
   Placeholder: "spine, heart, sternum…"
   Past entries appear as tappable chips below field
   One word is enough

2. RELATIONSHIP QUALITY (A → B)
   Placeholder chips: "leads · follows · resists · echoes"
   Tapping a chip inserts it, field accepts any text
   
3. NOTE
   Microphone icon (voice, saves audio + transcribes in background)
   Keyboard icon (text)
   Displayed in Fraunces italic when filled
   Border-left 2.5dp #7db9a8

4. QUALITY REFERENCE
   Thumbnail + "add reference" if empty
   Shows clip/image/audio reference for this phrase's feeling

**Bottom: loop button (same as workbench)**

## Interaction rules
- Auto-save everything — no save button
- Moment creation: one tap on beat scrubber + auto-name "moment N"
- Formation data: positions[], paths[], relationships[] saved per moment
- Quality layer: saved per moment, completely optional
- Orientation: stored as degrees (0 = facing audience)
- Path quality tag: stored as string on path object

## API calls
- GET /sessions/:sessionId/moments — load all moments
- POST /sessions/:sessionId/moments — create moment
- PUT /sessions/:sessionId/moments/:momentId — update moment name
- GET /sessions/:sessionId/moments/:momentId/formation — load formation
- PUT /sessions/:sessionId/moments/:momentId/formation — save formation
- GET /sessions/:sessionId/moments/:momentId/quality — load quality layer
- PUT /sessions/:sessionId/moments/:momentId/quality — save quality layer
