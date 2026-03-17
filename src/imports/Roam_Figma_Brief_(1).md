# Roam — Figma Design Brief
### AI Prompts + Visual Reference Guide · 4 Screens

---

## Design System Foundation

Before generating any screen, establish these tokens in Figma. All prompts below reference them by name.

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-base` | `#0D0D0F` | App background |
| `surface-raised` | `#161619` | Cards, sheets, panels |
| `surface-overlay` | `#1E1E23` | Bottom sheets, modals |
| `border-subtle` | `#2A2A32` | Track dividers, card outlines |
| `accent-primary` | `#C8F135` | Active states, CTAs, loop regions (yellow-green) |
| `accent-warm` | `#FF6B35` | Warning states, "needs work" tags |
| `accent-cool` | `#4ECDC4` | Note pins, secondary actions |
| `text-primary` | `#F2F2F4` | Headlines, active labels |
| `text-secondary` | `#8A8A9A` | Inactive labels, timestamps, metadata |
| `text-disabled` | `#3A3A45` | Placeholder text |
| `waveform-fill` | `#2E2E3A` | Unplayed waveform |
| `waveform-played` | `#C8F135` | Played portion of waveform |
| `track-1` | `#C8F135` | Repetition region color 1 (accent-primary) |
| `track-2` | `#4ECDC4` | Repetition region color 2 |
| `track-3` | `#FF6B35` | Repetition region color 3 |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| App title / session name | **Syne** | 700 | 18sp |
| Section label | **Syne** | 600 | 13sp |
| Body / note text | **DM Sans** | 400 | 14sp |
| Metadata / timecode | **JetBrains Mono** | 400 | 11sp |
| Button label | **DM Sans** | 600 | 13sp |
| Track label | **DM Sans** | 500 | 11sp |

### Component rules

- Corner radius: `8px` for cards and panels, `6px` for buttons, `4px` for tags, `100px` for pill chips
- Icon set: Phosphor Icons (regular weight for inactive, bold weight for active)
- Elevation: no drop shadows — use border (`border-subtle`) + background contrast only
- Spacing unit: `4px` grid — all padding/margin in multiples of 4
- Safe area: 44px top notch clearance, 34px bottom home indicator clearance on iPhone frames

---

## Screen 0 — Two-door home screen (Phase 0 / Capture-first entry)

### Visual reference direction

This is the first screen a new user sees. It must do one thing: make recording feel like the obvious next move. The emotional register is **calm and immediate** — not a dashboard, not a menu, not a product tour. Just two doors of equal weight and a lot of breathing room.

Think:
- **Voice memo apps** — the record button is the entire screen
- **Calm** — generous whitespace, nothing competing for attention
- The screen should feel like walking into an empty studio. The floor is clear. You can start.

The two buttons must feel equal. Neither is the "right" answer. The choreographer who has a song and the dancer who has an impulse are both welcome here.

---

### Figma AI prompt — Screen 0 (Two-door home screen)

```
Design a mobile app screen (375×812px, iPhone 14 frame) for a choreography app called Roam.
This is the first screen a new user sees — the home screen before any session exists.
Dark theme. Background #0D0D0F.
The mood is calm, immediate, generous. No clutter. Two choices of equal weight. A lot of space.

HEADER (44px):
- Centered wordmark "roam" — Syne Bold 20px #F2F2F4, lowercase, letter-spacing 0.1em
- No icons, no navigation, no back button — this is the root screen

BODY (centered vertically between header and bottom, approximately 600px available):

TOP SECTION — App identity (optional, subtle):
- Small tagline centered: "remember what you make" — DM Sans 13px #3A3A45, italics
- 40px below the header

MAIN CONTENT — Two door buttons (centered, stacked vertically, 40px gap between them):

DOOR 1 — Record (primary door):
- Card: full width minus 32px horizontal margin, height 120px
- Background #161619, border .5px #2A2A32, rounded 16px
- Left side: large record icon — circle 40px diameter, filled #C8F135, centered vertically, 24px from left edge
- Right of icon: 
  - Title "Record" — Syne Bold 18px #F2F2F4
  - Subtitle "capture something now" — DM Sans 13px #8A8A9A, 4px below title
- Right edge: chevron right icon #3A3A45 20px, centered vertically, 20px from right edge
- No required setup. No session. No music. Just record.

DOOR 2 — Start a session (secondary door):
- Card: full width minus 32px horizontal margin, height 120px
- Background #161619, border .5px #2A2A32, rounded 16px
- Left side: music note icon 36px #8A8A9A, centered vertically, 24px from left edge
- Right of icon:
  - Title "Start a session" — Syne Bold 18px #F2F2F4
  - Subtitle "I have a song to work with" — DM Sans 13px #8A8A9A, 4px below title
- Right edge: chevron right icon #3A3A45 20px, centered vertically, 20px from right edge

INBOX INDICATOR (shown below the two doors, only when clips exist in inbox):
- Centered, 24px below Door 2
- Small pill: background #1E1E23, border .5px #2A2A32, rounded 100px, height 28px, horizontal padding 12px
- Left: small inbox/tray icon #4ECDC4 14px
- Text "3 ideas waiting" — DM Sans 12px #8A8A9A
- This element is subtle — it should feel like a gentle nudge, not an alert

BOTTOM AREA:
- "Sign in" text link centered, 32px above home indicator — DM Sans 13px #3A3A45
- Home indicator clearance 34px

OVERALL:
- No illustrations, no onboarding copy, no feature lists, no carousel
- The two doors are the entire screen
- Vertical rhythm: header 44px → tagline → 80px space → Door 1 → 40px gap → Door 2 → inbox pill → sign in
- Total content height should sit comfortably centered in the screen with generous empty space above and below
```

---

### Prototype connection from Screen 0

- Tap "Record" → camera opens full screen immediately (no intermediate screen)
- Tap "Start a session" → opens session creation / music setup flow → Session Workbench (Screen 1)
- Tap inbox pill → opens Inbox view (list of uncategorised clips)
- After recording and saving: quick-save sheet appears over the home screen ("Add to session? Later / + New session / Existing →")
- After a session exists: home screen is replaced by the sessions list with the capture FAB (floating action button) persistent at bottom-right

---

### Visual reference direction

Draw inspiration from:
- **Logic Pro for iPad** (multi-track lane structure, dense information without clutter)
- **Suno Studio** (dark waveform rendering, clean section blocks)
- **BandLab mobile** (track header treatment, scrollable canvas feel)

The key visual tension to nail: **maximum information density in the timeline zone, maximum breathing room in the section workspace below.** The timeline should feel like a precision instrument. The workspace below should feel like a studio floor — open, immediate, inviting.

---

### Figma AI prompt — Screen 1

```
Design a mobile app screen (375×812px, iPhone 14 frame) for a choreography app called Roam.
Dark theme. Background #0D0D0F.

HEADER (44px height):
- Left: session name in Syne Bold 18px, color #F2F2F4, text "Girls Never Die — Draft 3"
- Right: two icon buttons — share (upload icon) and overflow menu (three dots), color #8A8A9A
- Bottom edge: 1px divider #2A2A32

MULTI-TRACK TIMELINE ZONE (220px height, below header):
- Timecode ruler at top: 24px height, background #0D0D0F, monospaced timestamps every ~60px in #3A3A45 (JetBrains Mono 10px)
- Four horizontal tracks stacked vertically, each 44px height, separated by 1px #2A2A32 dividers
- Each track has a 36px left header column (background #161619) with a small icon and track label in DM Sans 11px #8A8A9A

TRACK 1 — Waveform (icon: music note):
- Full-width audio waveform. Left 40% of waveform filled #C8F135 (played). Right 60% filled #2E2E3A (unplayed).
- 4 section marker labels floating above the waveform: "Intro" "Verse 1" "Chorus" "Verse 2" — pill chips, background #1E1E23, border #2A2A32, text #8A8A9A DM Sans 10px
- Active section "Chorus" chip has background #C8F135 20% opacity, border #C8F135, text #C8F135
- Vertical red playhead line running through all tracks at the 40% position

TRACK 2 — Note pins (icon: push pin):
- Sparse track, mostly empty. Three colored dot markers at different positions: #4ECDC4 at 20%, #C8F135 at 42%, #FF6B35 at 65%

TRACK 3 — Assigned clips (icon: film strip):
- Two filled blocks representing clips: block 1 from 15%–30% width, block 2 from 52%–68% width
- Blocks: background #1E1E23, border #2A2A32, rounded 4px, contain a tiny thumbnail (grey placeholder) + clip label "Idea 01" in DM Sans 10px #8A8A9A

TRACK 4 — Repetition regions (icon: repeat arrows):
- One active loop region from 42%–58% width
- Region: filled #C8F135 at 15% opacity, border top/bottom #C8F135, two circular drag handles (8px diameter, filled #C8F135) at start and end
- Region label "chorus drill" in DM Sans 10px #C8F135 above the region

TRANSPORT BAR (48px, below tracks):
- Background #161619, top border #2A2A32
- Left: rewind icon, then play/pause icon (play state, icon filled #C8F135 32px), then forward icon — all spaced 16px apart
- Center: speed chip "0.75×" — pill, background #1E1E23, border #2A2A32, text #F2F2F4 DM Sans 12px
- Right: mirror icon (flip horizontal), then "+ Track" text button in #8A8A9A

SECTION WORKSPACE (remaining height ~280px):
- Background #0D0D0F
- Section header row: "Chorus" in Syne SemiBold 13px #F2F2F4, timecode "0:42 – 1:10" in JetBrains Mono 11px #8A8A9A, right-aligned
- 2×2 grid of clip cards, each card 160×120px, background #161619, border #2A2A32, rounded 8px
  - Card 1: grey video thumbnail placeholder top half, bottom half: "Idea 01" DM Sans 13px #F2F2F4, tag chip "Phrase" #C8F135 20% bg #C8F135 text
  - Card 2: grey thumbnail, "Idea 02", tag chip "Marking" #4ECDC4
  - Card 3: dashed border #2A2A32, centered "+" icon #3A3A45 and text "+ Add clip" #3A3A45 DM Sans 13px (empty state add button)
  - Card 4: same empty state as card 3
- 8px gap between cards

BOTTOM TAB BAR (80px including home indicator area):
- Background #0D0D0F, top border #2A2A32
- 4 tabs evenly spaced: "Ideas" (lightbulb icon), "Notes" (note icon), "Review" (play-circle icon), "Share" (upload icon)
- Active tab "Ideas": icon #C8F135 bold, label DM Sans 11px #C8F135
- Inactive tabs: icon #3A3A45, label #3A3A45
```

---

## Screen 2 — Repetition Tool (Loop Region Detail)

### Visual reference direction

Draw inspiration from:
- **Logic Pro Quick Sampler** (tight waveform loop handles, precise region selection)
- **SoundCloud scrubber** (clean waveform + played/unplayed contrast)
- The feel should be **surgical and tactile** — this is a precision tool, not a casual playback screen. The handles should look physically graspable.

---

### Figma AI prompt — Screen 2

```
Design a mobile app screen (375×812px, iPhone 14 frame) for a choreography app called Roam.
This screen shows the Repetition Tool — a focused view for looping a specific region of a song.
Dark theme. Background #0D0D0F.

HEADER (44px):
- Left: back arrow icon #8A8A9A, then section context label "Chorus — Repetition" Syne Bold 16px #F2F2F4
- Right: "Done" text button DM Sans SemiBold 13px #C8F135

REGION WAVEFORM DISPLAY (180px height):
- Full-width waveform, tall amplitude visualization
- Background #0D0D0F
- Waveform bars: unselected areas #2A2A32, selected loop region bars #C8F135 at full brightness
- Loop region spans from 30% to 65% of total width
- LEFT handle: vertical line #C8F135 2px width + circular grip at center (20px diameter, filled #C8F135, shadow glow: 0 0 12px #C8F135 60% opacity)
- RIGHT handle: same treatment as left
- Top of region: thin horizontal band #C8F135 15% opacity connecting the two handles
- Above the region: floating label chip — background #C8F135, text "chorus drill" DM Sans SemiBold 12px #0D0D0F (dark text on bright chip)
- Timecode labels at handle positions below waveform: "0:42" and "0:51" in JetBrains Mono 11px #C8F135

TIMECODE FINE-TUNE ROW (56px):
- Background #161619, full width, 1px top/bottom borders #2A2A32
- Two timecode input fields side by side:
  - Left: label "Start" DM Sans 11px #8A8A9A, value "0:42.320" JetBrains Mono 16px #F2F2F4
  - Center: thin divider #2A2A32
  - Right: label "End" DM Sans 11px #8A8A9A, value "0:51.080" JetBrains Mono 16px #F2F2F4
- Each field has a subtle edit pencil icon #3A3A45 at right

TRANSPORT + LOOP CONTROLS (80px):
- Background #161619, 1px top border #2A2A32
- Row 1 (transport, 44px):
  - Center: large play/pause button 48px diameter, background #C8F135, icon #0D0D0F (loop/pause state showing loop icon)
  - Left of play: skip-back-to-start icon #8A8A9A 32px
  - Right of play: play-once icon #8A8A9A 32px (forward arrow with vertical bar)
- Row 2 (count selector, 36px):
  - Label "Repeat" DM Sans 12px #8A8A9A left-aligned
  - Right side: 4 pill chips side by side: "2×" "4×" "8×" "∞"
  - Active chip "∞": background #C8F135, text #0D0D0F DM Sans SemiBold 12px
  - Inactive chips: background #1E1E23, border #2A2A32, text #8A8A9A

DRILL SEQUENCE PANEL (collapsible, shown expanded, ~160px):
- Header row: "Drill Sequence" Syne SemiBold 13px #F2F2F4 left, collapse chevron right
- Background #161619, 8px horizontal padding, 1px top border #2A2A32
- 2 sequence items listed vertically, each 40px height:
  - Item 1: drag handle (6 dots icon #3A3A45), region color dot #C8F135 8px, name "chorus drill" DM Sans 13px #F2F2F4, count badge "∞" DM Sans 11px #8A8A9A, right-aligned
  - Item 2: same structure, color dot #4ECDC4, name "bridge entry" DM Sans 13px #F2F2F4, count badge "4×"
- Bottom of panel: "+ Add region" text button #4ECDC4 DM Sans SemiBold 13px, centered
- Below panel: "Run Sequence" full-width button, 48px height, background #C8F135, text "Run Sequence" DM Sans SemiBold 14px #0D0D0F, rounded 8px

REGION LIST (scrollable, remaining space):
- Label "Saved Regions" DM Sans SemiBold 12px #8A8A9A, 16px left padding, 12px top padding
- 3 region rows, each 48px height, separated by 1px #2A2A32 dividers:
  - Color dot (12px) + name "chorus drill" + timecode range "0:42–0:51" JetBrains Mono 11px #8A8A9A + count "∞" right-aligned
  - Active row (chorus drill) has background #C8F135 5% opacity tint
```

---

## Screen 3 — Quick-tag Capture Sheet

### Visual reference direction

Draw inspiration from:
- **Mobbin bottom sheet patterns** (layered sheet, handle indicator, clear hierarchy)
- The sheet should feel **instant and frictionless** — chips are large enough to tap with a sweaty thumb mid-rehearsal, the layout is scannable in under 2 seconds, and the default state has no required input.

The visual language here should contrast with the precision of Screens 1 and 2. This is **expressive, quick, tactile.** Chips should feel pressable, not form-like.

---

### Figma AI prompt — Screen 3

```
Design a mobile bottom sheet component (375px wide, 480px height) for a choreography app called Roam.
This sheet appears immediately after a clip is recorded. It lets the choreographer tag the clip in under 5 seconds.
Dark theme, semi-transparent background behind sheet: #0D0D0F at 60% opacity.

SHEET CONTAINER:
- Background #1E1E23
- Top corners rounded 16px
- Top center: drag handle — 40×4px, background #3A3A45, rounded 2px, 12px from top
- No shadow — use the background contrast alone

SHEET HEADER (52px from top):
- Left icon: small video camera icon #4ECDC4 20px
- Title: "New idea" Syne Bold 16px #F2F2F4
- Subtitle: "Chorus · 0:42" DM Sans 13px #8A8A9A (section name + timecode auto-filled)
- Right: "Skip →" text button DM Sans 13px #3A3A45

SECTION 1 — Movement Type (label + chip row):
- Label "Type" DM Sans SemiBold 11px #8A8A9A, uppercase, 16px letter spacing, 16px left margin
- Chip row (horizontal scroll, 8px gap between chips, 16px left padding):
  - "Idea" — ACTIVE: background #C8F135, text #0D0D0F DM Sans SemiBold 12px, rounded 100px
  - "Phrase" — inactive: background #161619, border #2A2A32, text #F2F2F4 DM Sans 12px, rounded 100px
  - "Transition" — inactive
  - "Marking" — inactive
  - "Full-out" — inactive
- Chips are 36px height, horizontal padding 14px

SECTION 2 — Energy / Feel (label + chip row):
- Label "Feel" DM Sans SemiBold 11px #8A8A9A, uppercase
- Chip row:
  - "Heavy" — active: background #FF6B35, text #F2F2F4 DM Sans SemiBold 12px
  - "Light" — inactive
  - "Vulnerable" — inactive
  - "Sharp" — inactive
  - "Fluid" — inactive
  - "Explosive" — inactive
- Same chip sizing as Type row

SECTION 3 — Free note (optional):
- Label "Note" DM Sans SemiBold 11px #8A8A9A, uppercase
- Single-line text input: background #161619, border #2A2A32, rounded 8px, 44px height, 16px horizontal padding
- Placeholder text: "optional — one thing to remember" DM Sans 13px #3A3A45
- No keyboard shown (static mockup state)

RECENTLY USED ROW:
- Label "Recent" DM Sans 11px #3A3A45
- 3 small recent-tag chips in muted style: "Phrase · Heavy" "Idea · Sharp" "Full-out · Fluid"
  - Background #161619, no border, text #8A8A9A DM Sans 11px, rounded 4px, 28px height

SAVE BUTTON:
- Full width minus 32px horizontal margin
- Height 52px, background #C8F135, rounded 8px
- Text "Save to Chorus →" DM Sans SemiBold 14px #0D0D0F
- Left icon: small checkmark icon #0D0D0F
```

---

## Screen 4 — Cleaning / Review Mode

### Visual reference direction

Draw inspiration from:
- **Frame.io v4** (timecoded annotation comments, clean reviewer UI, drawing tools floating above video)
- **iOS scrubber** (fine scrub handle, frame step controls)
- The mood here is **focused and deliberate** — this is post-studio, quiet work. The UI should feel calm and precise, not energetic. Use more restraint than the workbench.

---

### Figma AI prompt — Screen 4

```
Design a mobile app screen (375×812px, iPhone 14 frame) for a choreography app called Roam.
This is the Cleaning / Review Mode — a focused post-studio screen for reviewing and annotating recorded clips.
Dark theme. Background #0D0D0F.

HEADER (44px):
- Left: back arrow #8A8A9A, section context "Chorus — Review" Syne Bold 16px #F2F2F4
- Right: "Export Notes" text button DM Sans SemiBold 13px #4ECDC4

VIDEO PLAYER (320×180px, 16:9, full width):
- Background #000000
- Video thumbnail placeholder: dark grey rectangle with centered play icon
- TOP-RIGHT OVERLAY: three drawing tool buttons stacked vertically, each 36×36px, background #1E1E23 at 80% opacity, rounded 6px, 8px gap between them, 8px from right edge:
  - Draw (pencil icon) — active: icon #C8F135
  - Point (arrow icon) — inactive: icon #8A8A9A
  - Text (T icon) — inactive: icon #8A8A9A
- BOTTOM OVERLAY: timecode badge "0:04 / 0:12" JetBrains Mono 11px #F2F2F4, background #000000 60% opacity, bottom-left corner of video, 8px margin

SCRUB BAR (44px):
- Background #161619, full width
- Waveform-style scrub track (thin, 4px height), background #2A2A32, played portion #C8F135 from 0 to 33%
- Playhead handle: 14px diameter circle, filled #C8F135, positioned at 33%
- Three annotation dots on the scrub track: #4ECDC4 at 12%, #C8F135 at 33% (current position), #FF6B35 at 60%
- Timecodes at far left "0:00" and far right "0:12" JetBrains Mono 10px #3A3A45

FRAME CONTROLS ROW (48px):
- Background #161619, 1px top border #2A2A32
- 5 controls evenly spaced:
  - Frame back (◄| icon) #8A8A9A
  - Play/Pause (⏸ pause state, filled #C8F135, 36px)
  - Frame forward (|► icon) #8A8A9A
  - Speed chip "0.5×" — pill background #1E1E23 border #2A2A32 text #F2F2F4 DM Sans 12px
  - Loop A–B chip — active state: background #C8F135 15% opacity, border #C8F135, text "A–B" #C8F135 DM Sans 12px

ANNOTATION PANEL (label + scrollable list, ~200px):
- Header: "At this moment" DM Sans SemiBold 12px #8A8A9A left, "0:04" JetBrains Mono 11px #4ECDC4 right
- 2 annotation items:
  - Item 1: left color bar 3px wide #4ECDC4, icon pencil #4ECDC4 20px, text "right arm too low on the 3" DM Sans 13px #F2F2F4, timecode "0:04" JetBrains Mono 10px #8A8A9A right-aligned. Background #161619, 12px vertical padding, rounded 8px
  - Item 2: same structure, color bar #FF6B35, icon #FF6B35, text "check spacing front row", timecode "0:07"
  - 4px gap between items
- Below items: "+ Add note at 0:04" DM Sans 13px #4ECDC4, 16px left padding

BOTTOM TOOL BAR (60px):
- Background #161619, 1px top border #2A2A32
- 3 equal-width sections:
  - Left: "Checklist" — icon + label DM Sans 13px #8A8A9A, checklist icon, badge "2/8" small pill background #FF6B35 20% opacity text #FF6B35
  - Center: "Compare" — icon + label #8A8A9A, split-screen icon
  - Right: "Export" — icon + label #4ECDC4 DM Sans SemiBold 13px, share icon (active/highlighted)
```

---

## Shared Figma Setup Instructions

### Frame setup
- Use iPhone 14 frame (390×844pt) for all screens
- Set component view to 375×812 content area (excluding status bar)
- Use Auto Layout for all rows and stacks — no fixed absolute positioning except for overlay elements

### Component library to build first
Before generating individual screens, create these base components in Figma:
1. `Chip / Active` — pill shape, accent-primary background
2. `Chip / Inactive` — pill shape, surface-raised background + border-subtle
3. `Track Header` — 36px wide left column with icon + label
4. `Annotation Item` — left color bar + icon + body text + timecode
5. `Clip Card / Filled` — thumbnail + name + type chip
6. `Clip Card / Empty` — dashed border + "+" icon
7. `Region Handle` — circular drag handle with glow
8. `Transport Button / Primary` — accent-primary circle button
9. `Transport Button / Secondary` — icon-only ghost button

### Prototype connections to set up
- Screen 1 → Screen 2: tap the repetition region (🔁 track) → opens Screen 2
- Screen 1 → Screen 3: tap the floating capture FAB → opens Screen 3
- Screen 1 → Screen 4: tap the "Review" bottom tab → opens Screen 4
- Screen 3 → Screen 1: tap "Save to Chorus →" → dismisses sheet back to Screen 1

---

## Screen 5 — Floor Mark Editor

### Visual reference direction

The goal is a floor with tape on it, not a database. Think:
- **A rehearsal studio floor** viewed from above — clean, generous, almost empty
- **Apple Maps indoor view** — subtle dot reference grid, high contrast tokens, nothing decorative
- The stage should feel like the majority of the screen. Everything else is peripheral.

No panels. No lists. No sidebars. The choreographer should be able to look at this screen and immediately want to tap the floor.

---

### Figma AI prompt — Screen 5

```
Design a mobile app screen (375×812px, iPhone 14 frame) for a choreography app called Roam.
This is the Floor Mark Editor — a top-down stage view for placing dancers and saving floor marks.
Dark theme. Background #0D0D0F.
The default state is intentionally minimal. The stage takes most of the screen. No panels, no lists.

HEADER (44px):
- Left: back arrow icon #8A8A9A only — no text label
- Right: overflow menu icon #8A8A9A (three dots)
- No border below header — the stage begins immediately

STAGE FLOOR (fills screen from header to bottom bar, approximately 600px height):
- Background #0A0A0C (slightly darker than the app background to frame the floor)
- Stage boundary: a soft rounded rectangle, inset 24px from screen edges, rx=16, border 1px #1E1E23. No fill — the floor is the same dark color. The boundary is just a subtle frame.
- "BACK" label: centered at top of stage boundary, DM Sans 11px #2A2A32 uppercase, letter-spacing 3px
- "FRONT" label: centered at bottom of stage boundary, same style
- Dot grid: small dots (2px diameter, fill #1E1E23) arranged in a regular 36px grid across the entire stage interior. Subtle — barely visible. Not lines, just dots.

6 DANCER TOKENS placed on the stage:
- Token A "AY": center-left area, upper third. Circle 32px #C8F135, initials DM Sans Bold 11px #0D0D0F. Direction arrow: thin 2px line extending 12px north from token edge, arrowhead 5px, same color #C8F135.
- Token B "BL": center, upper third. Circle 32px #4ECDC4, DM Sans Bold 11px #0D0D0F. Arrow pointing north.
- Token C "CH": right of center, upper third. Circle 32px #FF6B35, DM Sans Bold 11px #F2F2F4. Arrow pointing northeast.
- Token D "DJ": left of center, middle. Circle 32px #A78BFA, DM Sans Bold 11px #F2F2F4. Arrow pointing north.
- Token E "EV": center, middle. Circle 32px #F472B6, DM Sans Bold 11px #0D0D0F. Arrow pointing north.
- Token F "FN": right, lower third. Circle 32px #60A5FA, DM Sans Bold 11px #0D0D0F. Arrow pointing northwest.

ONE TOKEN IS SELECTED (Token B "BL"):
- White ring 2px around the token, 4px gap between ring and token edge
- Small floating name label above: "Blake" DM Sans 12px #F2F2F4, background #1E1E23 px-10 py-4 rounded-100px, no border — appears above the token like a tooltip, 8px above the ring

BOTTOM BAR (80px including home indicator clearance):
- Background #161619, 1px top border #2A2A32
- Three equal sections:

  Left section — mark navigation:
    "Chorus · 0:42" DM Sans 12px #8A8A9A on top line
    ← 2 / 4 → navigation: two arrow icons #8A8A9A 20px, "2 / 4" JetBrains Mono 12px #F2F2F4 between them

  Center section — three tabs as small pill toggles, stacked or side by side:
    Active: "◎ Marks" — pill background #C8F135 15% opacity, border #C8F135, text "Marks" DM Sans SemiBold 11px #C8F135
    Inactive: "↗ Paths" — text #8A8A9A DM Sans 11px
    Inactive: "🎬 Clip" — text #8A8A9A DM Sans 11px

  Right section — single action:
    "Animate →" — pill button, background #C8F135 15% opacity, border #C8F135, text DM Sans SemiBold 12px #C8F135

NO dancer list. NO position coordinates panel. NO formation name label in the header.
The only text on screen apart from the header, tokens, and bottom bar is the BACK/FRONT labels and the "Blake" tooltip on the selected token.
```

---

### Updated prototype connections

- Screen 1 → Screen 5: tap a floor mark dot on the 💠 track in the timeline → opens Screen 5
- Screen 5 → Screen 5: tap ← → navigation in bottom bar → switches between floor marks
- Screen 5 (Paths tab) → shows path lines and crossing dot overlay on the same stage
- Screen 5 (Clip tab) → half-screen clip overlay slides up from bottom
- Screen 5 → Screen 1: tap back arrow → returns to workbench

---

*Brief produced for Roam V2 · Covers: Session Workbench, Repetition Tool, Quick-tag Sheet, Cleaning Mode, Floor Mark Editor*
