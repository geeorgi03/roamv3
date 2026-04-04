# ROAM — Product Requirements Document

**Strategic Moat · Body Language Layer · Offline · Sharing · Experience**  
April 2026 · Confidential

---

## The founding vision — why this exists

Dance is the only major art form with no persistent memory.

A composer writes a score. A novelist writes a book. A filmmaker shoots footage that lasts a century. But a choreographer finishes a session and almost everything that happened — the phrase that almost worked, the instinct that led somewhere unexpected, the moment a partner found something neither of them planned — lives only in two bodies that will forget.

This is not a software problem. It is a deeper problem about how knowledge moves through time.

Every art form that has survived and evolved has found ways to transmit its vocabulary across generations — not just its finished works, but its living knowledge. The feeling of a blues phrase. The weight distribution in a West African step. The relationship between breath and movement in classical Indian dance. These things travel when there are tools and conditions that let them travel. They die when there aren't.

We are in a period when many traditional dance forms are dying. Not because people have stopped caring. Because the transmission paths are broken.

Pansori — one of the most technically and emotionally demanding performance traditions in the world, a single voice carrying a story for eight hours, shaped over centuries — is fading in Korea. Not because Koreans don't know it exists. Because it takes decades to learn, the masters are few, and there is no entry point for a curious 22-year-old in Seoul who feels something when they hear it but has no way to turn that feeling into a creative relationship with the form.

Buchaechum, Water Sleeve Dance, Khmer classical, capoeira angola — the same story, different geographies. The knowledge lives in a shrinking number of bodies. When those bodies are gone, the vocabulary contracts. What remains is documentation: videos of performances, academic notation, museum archives. The grave, not the life.

**The problem with preservation is that preservation is not life.**

A dance form is alive when people are actively making things with it — when its vocabulary is in circulation, when it is being used to make new work, when it is influencing things that don't look like it on the surface. Jazz kept African rhythmic vocabulary alive not through preservation programs but because musicians found it generative. Hip-hop spread not because anyone taught it systematically but because the entry cost was low and the creative return was high. You could start a cypher without being a master. You could sample a record without a decade of training. The form had permeability.

Traditional forms built for high-commitment transmission — master to student, years of dedication — were shaped for a world where the social structures supporting that transmission existed. Those structures are largely gone. The form survived but the entry path didn't.

**What Roam is for, at its deepest level:**

Roam is a tool for choreographers making work today. That is what it is on the surface and that is where it starts. It fixes the loop reset problem. It holds the session. It makes the 85 minutes of friction into 85 minutes of work.

But the reason it matters beyond that — the reason it is worth building carefully and building well — is that it creates the conditions for creative exchange between living choreographers and the full depth of dance vocabulary, including forms that are currently fading.

The living library in Roam is not just a personal archive. Over time it is the place where a choreographer working on something contemporary can encounter a Pansori breathing pattern, a Buchaechum arm arc, a Water Sleeve transition — not as instruction, not as academic content, but as creative material. Available when they reach for it. Tagged not by scholarly category but by feeling, energy, movement quality. The same language a choreographer already uses to think about their own work.

This is protection through use, not preservation through freezing.

When a young choreographer in Singapore discovers a traditional Korean movement vocabulary through Roam and incorporates something of its feeling into a contemporary piece — that is the form living. That is the transmission happening through a new path. The master-to-student path still exists and still matters. But it is no longer the only path.

**The trade metaphor:**

No trade, no value. A choreography that exists only in one body, remembered only by one person, is not yet in the world. The act of creation — of making something, capturing it, developing it, sharing it — is what brings it into existence as a cultural object. Roam's job is to make that act of creation more possible, more frequent, and more available to more people.

When that happens at scale — when thousands of choreographers are making more work, with more access to the full depth of what dance has been — the forms that are fading have a chance. Not because anyone decided to save them. Because they became useful again. Because someone found them generative. Because the trade is happening.

That is the founding vision. The loop reset problem is the door. This is what's on the other side of it.

---

## PART 0 — Studio-First: what ships before anything else

> **North star: "I just walked into the dance studio. Roam is the first thing I open."**

The full app scope is defined below and will be built. But none of it matters if someone opens the app today and leaves in 30 seconds because the workbench looks broken. This section defines what must work first. It is a prerequisite, not a phase — nothing else ships until Part 0 is solid.

---

### Design principle — stated once, applies to every decision

> **Roam is a proper tool. It shows the state of the work. It never evaluates it, measures it, or nudges the choreographer toward any particular outcome. The artist always knows better than the tool where the work stands.**

Procreate does not congratulate you for drawing. Blender does not tell you your model is 60% done. Logic Pro does not show you a completion ring. They show you the work, clearly, and get out of the way.

This means:

- The song map shows empty sections because that is the truth of what exists — not to prompt you to fill them
- No progress percentages, no streaks, no "great job capturing 3 clips"
- No notifications that interrupt a session to manage the app itself
- No done/open toggles — the choreographer knows when a section is finished, the app does not need to define that
- When you reopen a session after two weeks, you see the work exactly as you left it — not a summary, not a highlight, not a nudge. The work.

Every proposed feature must pass this test: **does this show the work, or does it evaluate the work?** Only features that show ship.

---

### 0.1 The real problem — stated as a story

Two dancers walk into a studio with a song and a tutorial video. They have one hour and forty minutes.

They open Bilibili on an iPad to follow the tutorial. They want to loop a section — bars 10 to 15 seconds. Every time they tap back, Bilibili jumps to 5 or 6 seconds instead of 10. They re-scrub manually. Every single time.

Twenty to thirty minutes of their session disappears into this one problem.

They find an interesting move in a second video — a couple-dance clip where the camera cuts every second between two dancers. They have to do mental gymnastics to reconstruct what is actually happening. There is no way to save "that move at 0:23." Next time, they will have to find it again from scratch.

Person A has an idea. They try it, but they are not sure exactly what they just did. Person B waits. The thread dissolves. They move on. They never go back to it.

At the end of the session, they try to reassemble the piece. The sections they invented themselves — the parts they were proudest of — do not make it in. They were not attached to anything. They had nowhere to live.

They recorded 100 minutes of session. They have about 15 minutes of real choreography.

> **The 85 lost minutes were not creative work. They were friction. Roam's job is to eliminate that friction.**

---

### 0.2 The six pain points — lived, not inferred

These are not findings from a research report. They happened in a single session on March 27, 2026.

| Pain point | What actually happened |
|---|---|
| **1 — Loop resets** | Bilibili's A-B loop resets on every interaction. 20–30 min lost per session to manual re-scrubbing. This is the single highest time cost in an active rehearsal. |
| **2 — Can't save a reference moment** | A move spotted in a tutorial video cannot be bookmarked or clipped. It must be re-found every time. Mental overhead compounds across a session. |
| **3 — Ideas evaporate between partners** | Person A proposes something, is not sure of the exact form. Person B waits. No shared working memory. The idea is gone before it is evaluated. |
| **4 — Composed parts get abandoned** | Invented sections are not attached to the song structure. At assembly time, they have no home. They are left out of the final piece. |
| **5 — Solo work stalls without a movement bank** | Alone in the studio with a song you know deeply, you freeze. No record of your own movements. No scaffolding to build from. The work does not advance. |
| **6 — The creative freeze** | This one is harder to name, but it is the most honest. You have the music. You have the capabilities. The inspiration is actually there — you can feel it. And somehow you are still stuck. Not because you lack talent or ideas, but because there is no structure to hold the creative energy as it arrives. No place for the half-formed thing to land. Without that container, the momentum dissipates before it becomes movement. This is partly the nature of the artistic process — some of that friction is necessary and good. But part of it is a tool problem. The tools that exist do not give the choreographer a place to catch what they feel before it disappears. Roam is that place. |

---

### 0.3 The value proposition — one sentence

> **"Bilibili is a great video player. Roam is where the choreography lives."**

The competitive tools — YouTube, Bilibili, CapCut, Mirror Tube — handle consumption well. None of them know you are building something. None of them remember anything when you close them. The real competition is not Bilibili. It is the camera roll + Notes app + mental memory system every choreographer currently cobbles together.

Roam is not competing on playback quality. It is the only tool that knows you are making something — and remembers everything about it across sessions, partners, and weeks.

---

### 0.3b The physical setup — tablet next to the mirror

This is the primary use context for Roam. A tablet propped next to a studio mirror. The choreographer sees themselves dancing in the mirror and the tablet simultaneously. The tablet is not in their hands — it is at a distance of 1–2 meters, propped against the wall or on a stand.

This changes the entire design constraint:

- Touch targets must be large enough to hit without looking and without precision — minimum 64dp, ideally larger for primary actions
- The most important information must be readable at 1–2 meters — session name at 36px minimum, section name visible at a glance
- The layout must work in landscape orientation — this is a tablet propped sideways, not a phone held upright
- There are no hover states, no precise scrubbing, no small buttons — everything is coarse, intentional, thumb-sized

The tablet is a second screen, not the primary screen. The primary screen is the mirror. The dancer glances at the tablet, taps one thing, returns to dancing.

**The loop button — set by feel, not by scrubbing**

The loop is not set by tapping a waveform or dragging handles. It is set by a dedicated loop boundary button — large, always in the same position, found by muscle memory.

The interaction:
1. Play the song
2. Dance to the section you want to loop
3. When you reach the start of the section — tap the loop button once. First boundary set.
4. Keep dancing. When you reach the end of the section — tap the loop button again. Second boundary set. Loop activates immediately.

The choreographer never looks at the waveform to set a loop. They feel the music, tap at the right moment, and the loop holds. This is how a DJ sets a cue point. The hands know where the button is. The eyes stay on the mirror.

The waveform is for visual reference — seeing where the loops are, seeing the song structure. It is not the primary interaction surface for setting loops.

**What plays through Roam**

The audio source is whatever is already playing — YouTube, Bilibili, XHS, Spotify, a local video file. Roam does not need to be the audio player. It needs to sit alongside the audio source and let the choreographer manage loops, capture clips, and organize sections while the music plays.

The share intent handles the connection — the choreographer shares a URL from YouTube or Bilibili into Roam before the session. The video or audio is then available inside Roam's reference viewer. For Spotify or local audio, Roam manages the session while the audio plays externally.

**The tablet layout — landscape**

The tablet workbench is a split layout:

Left panel (60%): the audio/video reference. The waveform. The loop controls. The big loop button.

Right panel (40%): section navigation. Clip grid for the active section. Record button.

Both panels always visible simultaneously. No navigation between them. The choreographer's left hand manages the audio (loop button, play/pause). The right hand manages capture (section, record).

**The phone is the secondary device**

The phone is used for capture — the record button, the camera. It is held or set down. The tablet holds the session. The phone feeds clips into it. This two-device workflow is a feature, not a limitation.

**Shared session — partner and group choreography**

For duo and group work, the session is shared. Person B opens the same session on their device and sees everything in real time: clips as they are captured, spatial sketch as it is drawn, sections as they are updated.

For 2–5 people this is manageable. The spatial sketch shows up to 5 dancer positions. Clip attribution shows who recorded what. Voice notes are attributed. The session belongs to everyone in the room.

The shared session is a real-time sync problem technically. For V1 it ships as: session owner sets up the session, shares a link or code, partners join as viewers with capture access. Full co-editing in V2.



A choreographer in active flow cannot interact with a complex UI. The only mid-session interactions that are legitimate are: activate a loop, adjust speed, tap record, tap stop. Everything else — reviewing clips, navigating sections, filling in the feeling layer, looking at the song map — happens before the session starts or after it ends.

This means the workbench has two states, not one.

**Session mode** — what the choreographer sees while dancing:
- Session name (feeling strip, collapsed to one line)
- Waveform with active loop band and playhead
- Speed slider and mirror toggle
- Active section name and clip count — one line only, no navigation
- Record FAB

Nothing else. The section strip does not show all sections. The clip row is hidden. The feeling layer is collapsed. The song map is not accessible without a deliberate gesture.

**Review mode** — what the choreographer sees when they sit down after dancing:
- Full feeling strip, expandable
- Waveform with all loop bands
- Speed slider and mirror toggle
- Full section strip — all sections, all clip counts
- Clip row for the active section
- Record FAB still present

**The switch between modes** is not a button. It is a natural gesture: tapping the active section label in session mode expands the full section strip. The screen opens. Tapping elsewhere collapses it back. The choreographer doesn't choose a mode — the interface expands and collapses based on what they're doing.

This is the Procreate principle made mechanical: the canvas is the interface. The tools appear when you reach for them.



> **Roam is the canvas for choreography. It holds the work so the artist can focus on creating.**

A canvas does not judge the painting. It does not tell you you are 60% done. It does not congratulate you for picking up a brush. It holds what you put on it, exactly as you left it, ready for the next time you come back.

Procreate understood this for visual art. The iPad is the canvas. The tool disappears. The work stays. Roam is the same thing for choreography.

---

### 0.5 Platform — Android first, tablet always

**Android is the primary platform.** Not iOS. The target market — Singapore, China, Southeast Asia, Cambodia, Korea — is predominantly Android. Bilibili and Xiaohongshu users are predominantly on Android. Android ships first, is tested first, and is never treated as a port of the iOS version.

**Tablet is a first-class surface, not a scaled-up phone.** The reference is Procreate and GoodNotes on iPad — apps that understood what a large screen actually changes about the work.

| Surface | Role | Design approach |
|---|---|---|
| **Android phone** | Capture tool — always in hand while moving | One-tap actions, large targets, minimal reading required |
| **Android tablet** | Canvas — propped up in the studio, always visible | Song map as spatial overview, ref video + workbench split view, shared surface for two dancers |
| **iPad** | Same as Android tablet | Identical experience — no iOS privilege |

**The two-device workflow is a feature, not a workaround.** A dancer props their tablet in the studio showing the song map and the reference video. Their phone is in their hand capturing clips. Both devices show the same session in real time. A clip recorded on the phone appears on the tablet within seconds. This is the Procreate/Apple Pencil parallel: two tools, one canvas, one session.

**Tablet-specific screens that must be designed natively** (not phone layouts stretched):
- Song map: sections spread horizontally, clips visible inside each, no scrolling required for a standard 4-section piece
- Workbench: reference video and waveform/loop side by side — split view is the default, not an option

**Android tablet note for engineering:** React Native/Expo historically underserves Android tablets. Must be explicitly tested on Samsung Galaxy Tab before any screen is considered done. Do not assume phone layout scales.

**Share extension priority:** The Android share system is more open than iOS. The Bilibili/Xiaohongshu share extension ships on Android first.

---

### 0.5a The share intent — acquisition loop and core workflow

This is not a convenience feature. It is the primary way most users will discover Roam, and the primary way they will add reference material to sessions. It belongs in Part 0.

**The behaviour**

A dancer is watching a tutorial on YouTube, Bilibili, or Xiaohongshu. They find the move they want. They tap the platform's native share button. Roam appears in the share sheet alongside WhatsApp, Instagram, Notes, and the rest. They tap Roam. The URL is delivered to their active session as a REF clip — title, thumbnail, and timestamp preserved — without them ever leaving the source app.

Two states, both handled:

| State | What happens |
|---|---|
| Active session exists | URL drops into the active session as a REF clip, assigned to the current active section. The dancer returns to the source app. The clip is waiting when they get to the studio. |
| No active session | Roam opens. One question: session name. The URL becomes the first REF clip in a new session. The session starts from a reference, not a blank screen. |

The share flow must take under 10 seconds from tapping the share button to returning to the source app. The dancer should not need to open Roam, navigate to a session, and paste a URL. That is a 4-step flow. The share intent collapses it to one tap.

**Why this is the acquisition hook**

A dancer tries to share a Bilibili video to Roam and sees Roam is not in their share sheet. They search for it. They install it. The share intent is the discovery mechanism — not an app store search, not a referral link, not a social ad. The share intent works because dancers already share videos with themselves and each other constantly. Roam inserts itself into a habit that already exists.

This also means the first meaningful experience many users have with Roam is not opening the app cold and seeing an empty workbench. It is sharing a video they already love into a session. The first thing Roam holds for them is something they chose. That is a far better first session than any onboarding flow.

**What Roam registers as a share target**

- Any YouTube URL (youtube.com, youtu.be)
- Any Bilibili URL (bilibili.com, b23.tv short links)
- Any Xiaohongshu URL (xiaohongshu.com, xhslink.com short links)
- Any video URL from any source (fallback: treat as generic REF clip with URL only)

Android's intent filter registers Roam for `ACTION_SEND` with `text/plain` MIME type — which is how all of these platforms share URLs. No platform-specific integration required. If the platform shares a URL as text, Roam receives it.

**The clip created by a share intent**

The REF clip created via share intent contains:
- The URL
- The video title (fetched via oEmbed or page metadata if available)
- A thumbnail (same mechanism)
- A timestamp of zero — the clip opens at the beginning of the video
- A label: REF (same as any other reference clip)

The choreographer can then open Roam, navigate to the clip, and set a precise timestamp using the in-app viewer. The share intent captures the video; the timestamp is refined inside Roam.

**iOS note**

iOS share extensions exist but are more constrained. The iOS share extension ships after the Android version is stable. The behaviour is identical — Roam registers as a share destination for URLs.

*Acceptance test: a dancer watching a Bilibili tutorial taps share, selects Roam, and returns to Bilibili within 10 seconds. The video URL appears in their active session as a REF clip. They open Roam at the studio and the clip is there.*

---

### 0.6 The north star experience

> She is on the bus watching a Bilibili tutorial. She finds the move. She taps share → Roam. The URL lands in her active session. She goes back to Bilibili. Twenty minutes later she walks into the studio. Opens Roam. Her last session is right there — song loaded, loop region still set to the bridge section from last Tuesday, three clips in the chorus, and the Bilibili clip she just shared waiting in the REF row. She taps play. The loop starts. She dances. She records a new attempt. It saves to the chorus automatically. She is working within 15 seconds of opening the app.

**What this requires:**
- Last session opens automatically — no navigation for returning users
- Loop persists across app closes and sessions — it is never reset without explicit action
- Record is one tap from any screen — no setup, no mode-switching
- The app knows which section is active and saves the clip there automatically

---

### 0.5 The three screens that must work before anything else

**Screen 1 — Session workbench**

The waveform is the interface. A-B loop is set by a single tap at the current playhead position — no form, no time entry, no interrupting playback. Tap once to set the start, tap again to set the end. The loop has a name and persists. Multiple loops can be saved simultaneously, each visible as a named coloured region on the waveform. Speed slider (continuous, 0.25× to 2×, current value always visible as a number) and mirror toggle always visible. Speed defaults to 1×. Record button always visible. Clips organized by section, labeled REF or MINE.

*Acceptance test: a dancer sets a loop in under 10 seconds and records a clip in under 5 seconds without reading anything.*

**Screen 2 — Capture (always available)**

Red FAB visible on every screen without exception. Tap opens camera in under 200ms. Stop saves to active section automatically. Whole flow under 10 seconds, zero decisions required.

*Acceptance test: from any screen, capture a clip and return to work in under 15 seconds.*

**Screen 3 — Song map**

Song divided into sections. Each section shows clip count. Empty sections visible. Clips marked REF or MINE. Both partners' clips in the same section with attribution. Readable at a glance in under 5 seconds.

*Acceptance test: a dancer can immediately see which sections are done, which are empty, and which have reference material waiting.*

---

**Screen 4 — In-app reference video viewer (replaces MirrorTube)**

Context: MirrorTube was a Chrome extension loved by dancers for one reason — it let them watch YouTube with mirror, slow motion, and A-B loop without leaving the video. It was taken down from the Chrome store. Dancers are still asking for a replacement. Roam is that replacement — and does more, because the loop is attached to the session, not just the video, and because Roam allows multiple named persistent loops where MirrorTube allowed only one ephemeral one.

The choreographer pastes a YouTube or Bilibili URL into Roam. The video opens inside the app in a dedicated viewer. Three controls are always visible: mirror (horizontal flip using `transform: scale(-1, 1)`), speed (continuous slider, 0.25× to 2×, current value shown), and the loop system. The loop works exactly like the session loop — tap once at the current playhead position to set the start, tap again to set the end, name the loop, it holds. Multiple loops can be set on the same video and persist across sessions. A "clip this moment" button saves the current timestamp as a REF clip directly into the active session section. A "the moment" button sends the current 3 seconds to the feeling layer quality target field.

This solves Pain 2 completely. The choreographer never leaves Roam to watch a tutorial. The reference video and the session live in the same place.

**What must be true:**
- Paste any YouTube or Bilibili URL — video loads inside Roam
- Mirror toggle applies `transform: scale(-1, 1)` to the video element — flips instantly, no reload
- Speed control: a continuous horizontal slider, range 0.25× to 2×. Current value displayed as a number next to the slider (e.g. "0.8×"). Defaults to 1× on session open. Value persists within the session — if the choreographer sets 0.75×, it stays at 0.75× when they come back to this session
- A-B loop: drag handles on the video progress bar — holds until explicitly cleared, same behaviour as session loop
- "Clip this" button: saves a timestamped REF clip (screenshot + URL + timestamp) to the active session section
- No account required to watch — paste URL, it works

**Why mirror matters for dancers:**
When learning from a tutorial, the instructor faces the camera. Their right arm is on the left side of your screen. A dancer learning by mirroring their own reflection needs the video flipped so the movement directions match. This is the core use case MirrorTube solved. It is a single CSS line — `transform: scale(-1, 1)` applied to the video element — but no standard video player exposes it. Roam should.

**Technical note:**
Mirror is implemented as a CSS transform on the video element, not a re-encode. It is instant and costs nothing. Speed uses the standard HTML5 `video.playbackRate` property, set continuously as the slider moves. The slider maps linearly from 0.25× to 2× across its full width. The current value label updates live. A-B loop uses `timeupdate` event listeners to jump back to the start point when the end point is reached. All three are well-understood browser APIs.

*Acceptance test: a dancer pastes a YouTube URL, enables mirror, sets a 5-second A-B loop, and clips a REF moment into their session — all without leaving Roam.*

---

**Screen 4 extension — segment extraction (trim to save)**

Screen 4's "clip this" button saves a timestamp pointer: a URL plus a moment in time. That is enough for most cases — reopen the session, the viewer jumps to the exact second. But a pointer is fragile. If the video is taken down, the clip breaks. If the dancer is offline, it is inaccessible. And a pointer is not the same as owning the segment.

Segment extraction gives the choreographer the ability to trim a reference video — drag a start handle and an end handle on the video progress bar, define a segment, and save it as an actual video file inside the session. Not a link. Not a timestamp. The segment itself, stored locally, playable offline, permanent.

**What must be true:**

- Drag two handles on the video progress bar — the same handles used for A-B loop — to define a segment start and end
- A "save segment" button (distinct from "clip this") extracts that range and saves it as a video file attached to the active session section, labeled REF
- The saved segment is playable from the session without reopening the source URL — it lives inside Roam
- Mirror and speed settings applied at save time carry through — if the dancer saved a mirrored slow-motion segment, it plays back that way
- Segment is stored locally and available offline once saved
- Saved segments from the choreographer's own clips (studio recordings already in the session) follow the same flow — trim a MINE clip to keep only the relevant portion

**Two source types, different constraints:**

| Source | Segment extraction | Notes |
|---|---|---|
| Choreographer's own clips (MINE) | Full support — trim freely | These are the choreographer's own recordings. No licensing issue. |
| Downloaded or imported video files | Full support | File is already local. Trim is a local operation. |
| YouTube / Bilibili / XHS via URL | Timestamp pointer only, with offline cache | Platform terms prohibit downloading. Roam caches the video for offline playback during an active session (standard video buffering, not a download). The pointer and cache approach covers 95% of real use. |

**On the YouTube / Bilibili / XHS constraint:** downloading and storing video from these platforms violates their terms of service regardless of how it is framed in the UI. Roam does not do this. What Roam does instead is cache the buffered video locally during an active session — which is how every video player works — and makes that cache available for offline playback within the session. This is not a download. The choreographer cannot export it. It does not persist beyond the session cache window (7 days). This gives the offline experience without the legal exposure.

The practical gap this leaves is narrow: if a YouTube video is taken down, the timestamp pointer breaks and the cache eventually expires. The mitigation is the "save segment" flow for own clips, and the recommendation that for critical reference material, the choreographer records a screen capture and imports it as a MINE clip — which can then be trimmed freely.

**Why this matters:** the choreographer's core workflow is find a move in a tutorial, loop it, drill it, keep it. Right now "keep it" means a timestamp they hope will still work next week. Segment extraction means "keep it" means actually keeping it — a real file, inside their session, there every time they open it.

*Acceptance test: a choreographer sets a 12-second segment on one of their own studio clips, saves it as a trimmed REF clip, closes the app, reopens offline, and plays it back without the source file present.*

---

**Screen 4 extension — loupe zoom**

**The problem**

The tablet is propped one to two meters from the dancer. The reference video plays at full width. Most of the time this is fine — the body is readable, the movement is clear. But there is a class of reference material where it is not: videos where the critical information is in the hands, the footwork, or a subtle weight shift that the camera does not isolate. The choreographer loops the same three seconds seven times and still cannot see what is happening in the wrist. They walk up to the tablet, peer at it, walk back. The flow breaks every time.

This happened in the March 27 session. A hand movement in a Xiaohongshu tutorial was the crux of an entire section. The video was clear at full frame. The hand was not. The dancers spent the session closing the distance to the tablet and back, disrupting the rehearsal rhythm on every loop cycle.

Zoom does not require a closer screen. It requires the ability to isolate a region of the frame and hold it there — while the full video keeps playing underneath, so spatial context is never lost.

**What the loupe is — and what it is not**

The loupe is a circular magnifier overlay that sits on top of the reference video. The choreographer pinches on any region of the frame — a hand, a foot, a shoulder — and a loupe appears over that region, showing it at 2–3× magnification. The full video continues playing normally underneath. Both are visible simultaneously: the full frame for context, the loupe for detail.

The loupe is draggable. Once active, the choreographer can drag it to reposition — moving it to another part of the frame without re-pinching. The last position is what gets saved.

The loupe is not a crop. It is not a re-encode. It is a canvas element composited over the video — the zoomed region is computed from the live video frame at the current playhead position, updated every frame. It costs nothing to activate and nothing to dismiss.

The loupe is not a permanent edit. It is a viewing tool. It does not affect what is saved when the choreographer clips a REF timestamp — REF clips always save the full frame, not the loupe region.

**Kill — one tap, mid-loop**

A fixed dismiss button sits in the top-right corner of the video panel — always in the same position, never moving, large enough to hit from 1–2 meters without precision. When the loupe is active, the button is visible. When the loupe is inactive, the button is hidden. Tapping it dismisses the loupe instantly and returns the full frame. No animation delay. No confirmation. The choreographer does not look at the button — their hand knows where it is.

The dismiss button sits at least 16px above the progress bar. It must not share a touch target boundary with any transport control. A mis-tap that hits the scrub bar instead of the dismiss button breaks the loop — this is the failure mode to engineer against.

The loupe can also be re-activated with one tap on the same button — it returns to the last saved position and zoom level. The button functions as a toggle: one tap hides, one tap restores. This allows rapid on/off use — showing a detail region while explaining a move, then returning to full frame, then back again — without re-pinching each time.

**State — persists across sections and sessions**

The loupe state is saved per video. When the choreographer returns to a section — or reopens the session the next day — the loupe is exactly where they left it: same zoom level, same pan position. They do not re-pinch. The detail region they spent time finding is waiting for them.

What is saved is the final resting state — wherever the loupe was when the choreographer last moved it. Not the original pinch position. If she pinched in on the left hand and then dragged the loupe slightly to center it, the saved position is the dragged position. This is the correct behaviour: the position she settled on is the one worth keeping.

Loupe state is independent of mirror. If mirror is active, the loupe shows the magnified region of the mirrored frame — not the original. This is correct: the dancer is learning from the mirrored video, so the loupe should reflect that.

**What must be true**

- Pinch gesture on the video opens the loupe at the pinch midpoint. Zoom range: 2× to 3×. Below 2× the loupe does not activate — that level of magnification is not useful at studio distance.
- Two-finger drag repositions the loupe after it is open. The zoom level does not change when dragging — only position.
- Loupe persists across loop cycles. Every repetition of the loop plays at the same loupe position and zoom. The choreographer never re-pinches between cycles.
- Fixed dismiss button: top-right corner of the video panel, minimum 56dp tap target, minimum 16px clearance above the progress bar. Visible only when loupe is active.
- Dismiss is instant — no animation, no delay. Full frame returns on the same frame the button is tapped.
- One tap on the dismiss button while loupe is inactive restores the loupe to its last saved position. The button is a toggle.
- Loupe state (zoom level + pan position) is saved per video URL and restored on section return and session reopen.
- What is saved is the final pan position, not the original pinch position.
- Loupe is independent of speed, mirror, and loop — all four operate without affecting each other.
- Loupe does not affect REF clip saves — clips always capture the full frame.

**Technical note**

The loupe is implemented as a canvas element composited over the video element. On each animation frame, the canvas reads the current video frame, crops the target region (centered on the loupe position, scaled to the zoom level), and draws it into the loupe circle. The loupe itself is a fixed-size circular canvas with `border-radius: 50%` and a 1px border. No re-encoding. No server calls. All client-side, running at the video's native frame rate.

The dismiss button is a separate element with a guaranteed z-index above both the video and the loupe canvas. Its touch target must be defined explicitly — not inherited from the parent container — to prevent overlap with the progress bar below it.

On Android tablet, the loupe canvas must be tested in the split-view layout. The video panel is 60% of screen width. Touch events for pinch and drag must be scoped to the video panel container and must not propagate to the right panel.

**What does not ship**

Roam does not add multiple simultaneous loupes, a zoom level slider, a loupe size selector, or a picture-in-picture panel showing a separate zoomed view alongside the full video. One loupe, one region, one dismiss button. The choreographer pinches, sees the detail, and gets back to dancing.

*Acceptance test: a choreographer sets a 5-second A-B loop on a Xiaohongshu video, pinches in on the instructor's left hand, drags the loupe to center it, and watches six loop repetitions — the loupe holds position through every cycle without re-pinching. She taps the dismiss button once — full frame returns instantly. She taps again — the loupe restores to the same position. She closes the app, reopens the next day, returns to the same section — the loupe is where she left it.*

---

### 0.6 What must be fixed in the current app

| Fix | What is wrong now | What it must become |
|---|---|---|
| Workbench empty state | Four dark rows, looks broken, nothing to interact with | Waveform, loop track, section strip, record button — all visible and ready |
| Loop interaction | "Set loop" row that opens a form | Drag handles directly on waveform. Loop persists. Named. Clear button only way to remove. |
| Speed + mirror | Buried in transport area | Speed: always-visible horizontal slider with live value readout. Mirror: toggle, always visible. No menu. |
| Home screen | "What do you want to do?" every time | Returning users open directly to last session. New users see the two-door entry. |
| Navigation | Library / Profile / Roam | Session / Map / Library. No Profile tab. Gear icon for settings. |
| Screen titles | Route paths visible (e.g. `session/music-setup`) | Proper session name or clean label — never a dev route. |

---


### 0.7 Four decisions that must be made explicit

---

**Decision 1 — Session naming**

Sessions are named by the choreographer, not by the app. The default is never a date. When a new session is created, the choreographer names it immediately — one tap on the session name field, type the name, done. Examples: "晴天 project", "chorus with Maya", "bridge ideas March". The name is the most prominent text on the workbench screen. It is editable at any time with one tap.

Why this matters: a date means nothing when you return two weeks later. A name is the piece. The choreographer knows what they called it. The app should reflect that language, not override it with a timestamp.

---

**Decision 2 — The session feeling layer (mood board)**

Before the first clip, before the first loop, a choreographer often knows what a piece should feel like. They have listened to the song 100 times. They know the intent. But that feeling has nowhere to live — it exists only in their mind, fades between sessions, and is invisible to a partner.

Every session has a feeling layer — a small, optional surface at the top of the workbench that holds up to four things:

- A word or short phrase — the emotional anchor. Not a description. "Satisfied but restless." "Heavy arms, light feet." "The moment before it rains."
- A reference song — a different song that has the right energy. Not to choreograph to. To remember the feeling.
- A color — one color. The emotional temperature of the piece.
- A video moment — 5 seconds from anything. A film, a performance, a street scene. Not to copy — to remember.

All four are optional. None are required. The feeling layer is visible at the top of the workbench and the song map — always present, never in the way. It is the first thing you see when you reopen a session, and the thing you look at when the creative freeze hits and you have forgotten why you started.

This is the app's answer to Pain 6 — the creative freeze. The song map gives structure. The feeling layer gives direction.

*Acceptance test: a choreographer can set the feeling of a session in under 30 seconds, and read it back clearly when reopening the session two weeks later.*

---

**Decision 3 — Sound during recording**

When the choreographer taps record while music is playing in the session, the following happens:

- Music continues playing in the room — it does not stop or pause
- The clip records video only — no audio is captured into the clip file
- When recording stops, music continues without interruption — no restart, no gap
- The clip thumbnail shows a silent video indicator so the choreographer knows it has no audio

Why: stopping music breaks flow. It interrupts the rehearsal, requires restarting, and loses the physical momentum of the moment. The music is ambient — it is for the dancer, not for the clip. The clip captures the movement. The session holds the relationship between the clip and the music.

Exception: voice memo capture (long-press record) records audio only, no video. This is intentional and separate from the standard capture flow.

*Acceptance test: a dancer records a clip mid-playback without the music stopping. The session resumes seamlessly. The clip shows no audio indicator.*

---

**Decision 4 — No save button, ever**

Roam never asks the choreographer to save. There is no save button, no save confirmation, no "are you sure you want to leave?" dialog, no unsaved changes warning.

Everything is saved automatically, immediately, always:
- A clip is saved the moment recording stops
- A loop region is saved the moment it is set
- A section assignment is saved the moment a clip is dragged
- A session name is saved the moment you finish typing
- A note is saved the moment you finish writing

Closing the app pauses the session. Reopening resumes it. The session never ends — it just pauses. The state when you closed is exactly the state when you reopen: same active section, same loop, same playhead position.

The reference is Procreate. You never save in Procreate. You just close it. The canvas is always there. Roam is the same.

Why this is a specific engineering instruction and not just a design preference: the default behavior in React Native and most mobile frameworks is to prompt on unsaved state. This must be explicitly overridden. Every piece of state must be persisted to the server (or local cache if offline) immediately on change, not on app close. This is a non-negotiable architectural requirement.

*Acceptance test: a choreographer closes the app mid-session with a loop set, a section active, and three clips captured. They reopen 10 minutes later. Everything is exactly where they left it.*

---

**Decision 5 — The quality target (the feeling layer, sharpened)**

The feeling layer has four optional elements: a phrase, a reference song, a color, a video moment. These are mood board language — they capture the emotional direction of a piece. But there is a fifth thing a choreographer carries into a session that is distinct from mood: a standard. A specific image of what the piece looks like at its single best second. Not a feeling to move toward. A quality to reach for.

This is the difference between "I want this to feel heavy and restless" (mood) and "I want one second in the chorus that looks like this" (quality target). The first is the feeling layer. The second is something the feeling layer currently cannot hold.

Every session has one optional additional field in the feeling layer: **"the moment."**

- A single video clip, maximum 3 seconds, from any source
- Not labeled as a reference to copy — labeled as "what I'm reaching for"
- Set by clipping directly from the in-app reference video viewer (Screen 4) — one button sends the current 3 seconds to this field instead of to a session section
- Visible at the top of the workbench alongside the other feeling layer elements
- Can also be set from the camera roll — a still frame, a short clip, anything

What "the moment" captures is specific: the convergence of spatial composition (where everyone is), temporal precision (the exact beat), visual image (what it looks like as a picture), and movement quality (the texture of how bodies are moving). These four things — all happening at once — are what makes a second of choreography have what a choreographer would call star quality. The feeling layer phrase can gesture toward this. "The moment" field holds the actual image of it.

This is not a muse. Roam does not suggest what the moment should be, does not score the choreographer's work against it, does not surface it as a comparison. It holds it exactly as the choreographer set it. The artist put it there. The artist knows what it means. The tool keeps it visible so it does not get lost between sessions.

The distinction between clipping to a section (Screen 4's "clip this" button → workbench, functional reference) and clipping to the feeling layer ("the moment" button → quality target) is the cleanest separation in the whole app between working material and artistic aspiration.

*Acceptance test: a choreographer watching a video in Screen 4 taps "the moment" at a specific second. That 3-second clip appears in the feeling layer of their active session, labeled "what I'm reaching for." When they reopen the session two weeks later, it is the first thing they see alongside the phrase and the color.*

---
### 0.8 Known gap — resolved by Screen 4

Pain 2 ("can't save a reference moment from a tutorial video") was a known gap in the original Part 0 scope. It is resolved by Screen 4 — the in-app reference video viewer. The choreographer pastes a YouTube or Bilibili URL, watches it inside Roam with mirror + speed + A-B loop, and clips REF moments directly into the session. They never need to leave the app or screen-record anything.

The interim workaround (screen-record + import as REF clip) remains available but should no longer be necessary once Screen 4 ships.

| Pain | Status after Screen 4 + share intent |
|---|---|
| Can't save a reference moment | Solved two ways: "clip this" inside the in-app viewer, or share the URL directly from YouTube/Bilibili/XHS via the Android share sheet |
| Must re-find the move every time | Solved — REF clip holds URL + timestamp, reopens to exact moment |
| Mental gymnastics parsing a cutting video | Reduced — mirror + slow motion + locked loop on the exact segment |

---

### 0.9 Success metric for Part 0

> **The founder uses Roam in every studio session for 30 consecutive days without switching back to Bilibili + camera roll for the core workflow.**

If this metric is not hit, nothing else ships. If it is hit, the product is real and the rest of the app begins.

---

## Full App Scope

This section defines the complete product — everything that ships as Roam. Part 0 defines what must work first and is a hard prerequisite: none of the features below ship until Part 0 is solid. But they are not a future version. They are the app.

The question the full app answers: would a choreographer feel a genuine loss if Roam disappeared? Part 0 makes the product useful. Everything here makes it irreplaceable — by making the data Roam has been silently collecting active, surfacing it back to the choreographer as a creative memory that participates in the work, not just stores it.

> *"Roam is a mirror, not a muse. It reflects the choreographer's own creative history back at them with clarity. It never generates, never prescribes, never leads. The artist is always the author."*

### Feature summary

| Feature | Type | Retention impact | Build complexity | Priority |
|---|---|---|---|---|
| Share intent (YouTube / Bilibili / XHS → session) | Acquisition + core workflow | High | Low | Part 0 |
| Living library | Moat | High | Medium | Ships after 50+ sessions of data |
| History view + creative genealogy | Moat | High | Medium | Early — schema work begins at Part 0 |
| Full body language layer (11 reqs) | Moat | High | High | After core workflow is embedded |
| Offline capability (5-session cache) | Foundation | Medium | Medium | Early |
| i18n — EN / ZH / KR / JA | Foundation | Medium | Low* | After core workflow is embedded |
| Music-optional sessions | Fix | Medium | Low | Early |
| Workbench performance fix | Fix | Medium | Low | Early |
| PDF export + GoodNotes template | Distribution + experience | Medium | Low | Early |
| Rough assembly view + CapCut handoff | Experience | Medium | Medium | After Part 0 is solid |
| In-app sharing — clip threads | Network | High | Medium | After solo workflow is irreplaceable |
| In-app sharing — collaborator roles | Network | High | High | After solo workflow is irreplaceable |
| Repetition regions (A-B loop + takes view) | Experience | High | Medium | Early |
| First-session magic moment | Experience | High | Low | Early |
| Weekly session summary (mirror) | Experience | Medium | Low | After sufficient session data |
| Stick figure body annotation | Experience + moat | Medium | Medium | After core workflow is embedded |
| Exit conversation | Intelligence | Low direct / high indirect | Low | After sufficient session data |
| Quality target — "the moment" (Decision 5) | Experience + moat | High | Low | Early — part of feeling layer |

> \* i18n engineering complexity is Low, but dance terminology localisation requires domain experts in Chinese classical and Korean court dance — not machine translation. This is the long-lead item. Source practitioners early; do not treat this as a translation task.

---

## Usage Model & Retention Strategy

Understanding how choreographers actually use Roam is prerequisite to measuring success correctly.

### Roam is a seasonal tool, not a daily habit

Choreographers work in creative bursts tied to projects and productions. A choreographer who uses Roam intensively for three weeks, goes quiet for six, then returns for their next piece is a perfectly retained user. The right benchmark is not daily or weekly active use — it is project-to-project return.

> The dangerous misread: a 6-week gap looks like churn in standard metrics but is the natural creative cycle. Re-engagement pushes during the quiet phase train users to ignore Roam's notifications — destroying the signal for when it's actually needed.

### The correct retention metrics

| Metric | What it measures / why |
|---|---|
| Project-to-project return | Did the choreographer use Roam when their next piece started? This is the primary retention signal. |
| Intensity during active bursts | Sessions per active week, clips per session, voice notes per clip. High intensity = deep investment = strong moat. |
| Archive depth at project 2 start | How much history does Roam hold when they return? More history = stronger living library = higher switching cost. |
| DAU / weekly opens | Wrong metric for this product. Will always look low between projects. Optimising for it pushes toward features that harm the core experience. |

### The real churn moment

Users are not lost on day 7. They are lost at the start of their second project. If a choreographer begins project 2 in their camera roll — out of muscle memory, during the quiet gap — by the time they have three sessions worth of material there, switching to Roam means losing continuity. The habit never forms for project 2.

### The between-project fix

One well-timed signal is worth more than any re-engagement campaign. When a user has been quiet for 2+ weeks and then opens a music app or enters a known rehearsal location, surface exactly one notification:

> *"Starting something new? Your archive from [last piece] is ready."*

This is also the moment the living library becomes the hook. "You worked on something at a similar tempo 6 weeks ago — here it is" is far more compelling at the start of project 2 than any onboarding clip. The between-project window and the living library are the same feature from different angles.

---

## 1. Strategic Moat

What Roam knows and why no competitor can reconstruct it.

### What Roam knows after 12 months

**Movement vocabulary**  
Tagged clips in the choreographer's own language — not a generic taxonomy. The implicit signal of kept vs. discarded is aesthetic taste made legible. Starts mattering after ~50 sessions.

**Creative lexicon**  
Note pins as a corpus of how a specific choreographer thinks about movement. Unfiltered, timecoded, irreplaceable. Starts mattering after ~6 months.

**Process knowledge**  
Which sections required the most iterations. Where the work always gets stuck. Patterns the choreographer themselves doesn't have explicitly. Starts mattering after ~12 months.

**Creative genealogy**  
The causal chain of every decision in every piece. Clip 7 was triggered by voice note at 0:42, which came from feedback, which led to revision 3 of the chorus. Cannot be exported. Cannot be reconstructed. Immediately valuable once surfaced.

**Institutional memory**  
Company-level shared archive when multiplayer ships. Switching cost becomes organisational, not personal.

| Layer | What Roam has | When it becomes a moat |
|---|---|---|
| Movement vocabulary | Tagged clips in own language | After ~50 sessions |
| Creative lexicon | Voice/text notes as language corpus | After ~6 months |
| Process knowledge | Iteration patterns, struggle points | After ~12 months |
| Creative genealogy | Causal chain of every decision | Immediately once surfaced |
| Institutional memory | Company-level shared archive | After multiplayer ships |

### The three directions

**Direction 1 — The Living Library (ships after Part 0 is solid)**  
The library stops being a search tool and starts being a creative resource that surfaces relevant material unprompted. When a choreographer opens a new session, Roam surfaces clips from their history that match the energy profile and BPM range of the new music. Patterns surface passively. Part 0 already collects everything needed — this is a retrieval and surfacing problem, not a new data collection problem.

> Architectural note: add `parent_clip_id` and `triggered_by_note_id` to the data model immediately — low schema cost, enables genealogy later.

**Direction 2 — Creative Genealogy Made Visible (core feature)**  
Every session gets a traceable creative history. The iteration chain becomes a first-class object. Choreographers can navigate backwards: 'Why did I make this choice?' and find the answer in the session record. This data structure does not exist in any other tool and cannot be exported to a competitor because the competitor has no equivalent concept.

**Direction 3 — Multiplayer Stickiness (ships after solo workflow is deeply embedded)**  
Roam becomes the shared creative layer for a dance company, not just a solo tool. One choreographer leaving loses their personal archive. A company leaving loses their collective creative memory. Those are very different decisions. Do not build before the solo workflow is deeply embedded — pilot with 2–3 heavy early users.

---

## 2. Spatial layer — a sketch note, not a notation system

**What it is:** A fast floor sketch attached to any section in the song map. Pre-studio planning surface. You're on the bus thinking "if we start in a triangle and A crosses behind C, where do we meet?" — that spatial thought has no home right now. This gives it one.

**What it is not:** A formation tracking system, a mid-rehearsal tool, a body notation system, a screen in the main nav. It is a note type — the same way you can leave a voice note on a clip, you can leave a floor sketch on a section. Low commitment. No expectation of accuracy or completeness.

**The three primitives:**

**Positions** — where each dancer is at a given moment. A labeled dot with an orientation arrow showing which direction they face. The orientation matters: two dancers facing each other is a fundamentally different picture from two dancers facing the same way.

**Paths** — how each dancer gets from one position to the next. Every path is a curve by default. When two positions are connected, the path between them is already slightly curved — because dancers don't move in straight lines. The default curvature is a gentle arc. The choreographer drags the midpoint of the path to adjust the bend — tighter, wider, reversed — until it matches the actual movement. If a straight line is needed (which is rare), dragging the midpoint back to center produces one. Straight is the exception you opt into, not the default. Two paths from different dancers crossing at approximately the same beat creates an intersect marker. Visible, plannable.

**Relationships** — when two or more dancers are connected at a moment. A line between dots showing contact. Annotated simply: "A supports B," "unison," "canon." No joint specification. The video shows the actual contact. The relationship line shows the structural fact that contact exists.

That's the whole tool. Positions, paths, relationships. It scales from one dancer (a solo phrase map) to five (a group formation sequence) without changing architecture. The same dot, the same curve, the same relationship line.

---

### The quality layer — traces of the ineffable

Choreography is not only about movement from location A to location B. It is about the spine that initiates before the arms follow. The heart that leads the chest forward. The head that arrives last, trailing the turn. The quality of suspension in a raised arm — whether it floats or snaps or spirals. The difference between a movement led from the pelvis and the same spatial path led from the sternum is felt by every person in the room, including the audience. It cannot be encoded in a floor plan.

No tool captures this fully. The body knows something notation cannot hold. That is not a problem to solve — it is a fact to respect.

But traces of quality can be preserved. Not the quality itself, but the choreographer's own language for it, in the moment they understand it. These traces are what allows them to return to a phrase six weeks later and remember not just where they were but how it felt to be there.

**What the quality layer holds:**

**The choreographer's words, pinned to a moment.** A voice note or short text attached to any spatial moment or clip. Not a form field. Not a dropdown. Free-form language, completely open. "The arm doesn't go up — it gets pulled up from above, like a string attached to the wrist." "Spine first. Suspended. Then outward." "This is where the breath is." These sentences hold more information about movement quality than any notation system. They are the choreographer thinking out loud in their own language.

**The initiation point.** Where in the body does this phrase begin. One word, tapped freely — heart, spine, sternum, pelvis, fingertip, low back, crown, solar plexus. Not selected from a dropdown, not constrained to anatomical vocabulary. Typed or spoken. The interface is a single open field that appears when a moment is tapped. One word or two is enough. The dancer reading it knows what "heart-led" means. They don't need a diagram.

**The quality of relationship between dancers.** In a partnering moment, the spatial layer can note whose energy leads and how the other responds. Not a formal role assignment — a single free word: leads, follows, resists, echoes, amplifies, suspends, ignores. One word changes how both dancers approach the moment. It is the difference between two dancers doing the same thing and two dancers in conversation.

**A quality reference — image, clip, or sound.** Any moment can have a quality anchor attached to it — not a reference of the movement itself, but a reference for the feeling of the movement. Three seconds of water moving around a stone. A specific phrase from a Pansori recording where the breath and the sound are inseparable. An image of fabric falling. These are not instructional references. They are the emotional and sensory material the choreographer is drawing from. They live attached to the moment, not in the general feeling layer, because they belong to this specific phrase at this specific beat.

**What the quality layer is not:**

It is not a notation system. It does not encode arm angles, joint positions, or movement paths. It does not translate the movement into symbols that can be reconstructed from the notation alone. Any system that attempts this will fail in the same way every formal notation system has failed — by making the translation process so costly that it interrupts the creative act.

It is not required. Every quality annotation is optional. A choreographer who never touches the quality layer is using Roam correctly. The quality layer exists for the moments when the choreographer wants to leave a trace — not because the app asked for it, but because something happened that they want to be able to find their way back to.

It is not a body diagram. The initiation point is one word, not a joint on a stick figure. The interface does not show a human form with selectable parts. It shows an empty field that accepts any language the choreographer uses naturally.

---

### Choreographic moments — the timeline structure

The spatial layer is moment-based, not frame-based. A choreographic moment is a named snapshot attached to a bar or beat: "chorus entry at bar 16," "the lift at bar 28." Between moments, paths describe the travel. The choreographer thinks in moments because that is how choreography is made — not frame by frame, but event by event.

The moment strip at the bottom of the spatial view is a scrubable list of named moments in the current section, linked directly to the song map. Creating a moment takes one tap on the beat scrubber and a name. Reordering moments is drag-and-drop.

---

### Connection to clips

Any moment can have a clip attached to it — the video of what that moment actually looks like in execution. The spatial plan and the video clip are two views of the same choreographic object: one shows the structure, the other shows the reality. The quality annotation is the third view — the choreographer's language for what the moment should feel like. Together they are more complete than any one alone.

The feeling layer's "the moment" clip (Decision 5) is the session-level quality target — the image of what the choreographer is reaching for across the whole piece. The quality annotation on a spatial moment is phrase-level — specific to this bar, this transition, this initiation. Both are necessary. Neither replaces the other.

---

### What this honestly covers and what it doesn't

The spatial layer covers: floor travel paths, formation geometry, relative positioning of multiple dancers, the structural skeleton of a phrase before it's been made, the choreographer's own language for movement quality attached to specific moments, initiation points, relationship qualities between dancers, and quality references for specific phrases.

It does not cover: the actual sensation of the movement, the precise quality of suspension or weight or breath that makes a movement alive, the felt knowledge in the body that comes only from repetition and practice. Those live in the body. No tool holds them. Roam does not try.

*Acceptance test: a choreographer returns to a session after four weeks. They open a spatial moment from the chorus. They see where everyone was. They read a voice note they left: "spine first — then the arms follow like they're waking up." They tap play on the quality reference clip — three seconds of fabric dropping. They remember not just the position but the quality of what they were reaching for. They go back to work.*

---

> Roam does not tell a choreographer what Chinese classical hand positions are. It gives them tools to capture and tag their own. The intelligence comes from the choreographer's own practice, not from a built-in vocabulary.

> **Implementation discipline:** the body language layer must be surfaced via progressive disclosure. Show a maximum of 2–3 body fields per clip on first encounter. Never require any field. The moat only forms if choreographers actually tag — which they will not do if the layer feels like a form.

### Req 1 — Upper body as notation surface

*Reference: Dunhuang solo, Auspicious Rain, GaiGai Masked Dance, Khmer Apsara, Water Sleeve Dance*

**The problem**  
In Chinese classical, Khmer, and Southeast Asian traditional forms, the choreography lives in the hands, wrists, fingers, and head. In Water Sleeve Dance the sleeve trajectory — its arc, throw, and float timing — is the choreography. A floor map communicates nothing of this.

**What Roam needs**  
A body annotation layer on any clip or note pin. Selectable body zones (head, arms, hands, torso, hips, feet) with a free-text qualifier for extensions: 'sleeve: float outward', 'fan: open left'. Retrieval tag, not a notation system.

**Acceptance criteria**
- Body zone tag attachable to any clip or note pin
- Free-text qualifier field for extension notes (sleeve, fan, prop)
- Body zone tags searchable in the library
- No mandatory fields — always optional

### Req 2 — Vertical and travel movement indicators

*Reference: Balanchine Who Cares? (jumps, grands battements), Santa X duo lifts, BTS Lie*

**The problem**  
Formation tools model 2D floor position. A grand jeté covers 3m of floor and 1.5m of height. A partnering lift removes one dancer from the floor entirely.

**What Roam needs**  
Movement type tag on any clip: stationary / floor travel / jump-leap / lift / partnering. Formation view displays lift/jump moments as non-floor events (distinct icon).

**Acceptance criteria**
- Movement type tag selectable on any clip
- Formation view treats lift/jump-tagged moments as non-floor events
- Searchable in library

### Req 3 — Partnering as a linked relationship

*Reference: Balanchine neoclassical, Santa X duo, kushiro contemporary*

**The problem**  
Two dancers in a partnering sequence are not independent entities. They have contact points, weight distribution, leading/supported roles. Two dots near each other captures nothing.

**What Roam needs**  
A partner link between two clips in the same session. Partner-linked clips appear as a unit in the section workspace. No 3D modelling required.

**Acceptance criteria**
- Choreographer can link two clips as a partnering pair
- Partner-linked clips display as a visual unit
- Preserved in full export

### Req 4 — Dancer roles within a group

*Reference: BTS Lie / Woonha (centre vs ensemble), tripleS Girls Never Die (role-differentiated aerial shape)*

**The problem**  
A tool that treats all dancers as interchangeable dots produces choreography that looks choreographed for interchangeable dots.

**What Roam needs**  
Dancer role tagging per section, user-defined strings. Default: principal / ensemble / counter. Principal clips visually distinguished.

**Acceptance criteria**
- Dancer role assignable per clip, per section
- Principal clips visually distinguished in section workspace
- Roles are user-defined strings, not a fixed enum

### Req 5 — Temporal cascade effects

*Reference: Seventeen (domino/wave), tripleS Girls Never Die (aerial silhouette)*

**The problem**  
The most powerful choreographic effects are about when dancers do something relative to each other — a movement rippling through a line, a shape only visible from above.

**What Roam needs**  
Cascade annotation on a section: start dancer, direction, interval in beats. Freehand silhouette sketch layer as a note pin.

**Acceptance criteria**
- Cascade annotation attachable to a section
- Freehand sketch note pin available
- Both optional and exportable

### Req 6 — Dynamic cast: entrances and exits

*Reference: Santa X multi-style piece (cast changes mid-performance)*

**The problem**  
A piece where dancer A exits at bar 32 and dancer B enters at bar 40 is fundamentally different from a piece where all dancers are present throughout.

**What Roam needs**  
Presence range per dancer per session (default: full duration). Timeline shows presence bars. Formation view auto-filters to present dancers.

**Acceptance criteria**
- Presence range assignable per dancer
- Timeline displays presence ranges
- Formation view auto-filters to present dancers

### Req 7 — Multi-style annotation within a single piece

*Reference: Santa X masked dance (hip-hop, capoeira, Chinese traditional in one choreography)*

**The problem**  
A piece that moves from hip-hop to capoeira to Chinese folk is one piece with style shifts, not three separate pieces.

**What Roam needs**  
Style tagging on sections — user-defined string with autocomplete from past tags. Propagates to assigned clips as default. Living library becomes style-aware.

**Acceptance criteria**
- Style tag on sections with autocomplete
- Propagates to assigned clips as default
- Living library uses style for context-aware surfacing

### Req 8 — Collective silhouette and aerial perspective

*Reference: tripleS Girls Never Die (aerial), Ride the Wind (exterior viewer), Buchaechum (fan formations)*

**The problem**  
Buchaechum: 16 dancers opening fans simultaneously creates a flower shape only readable from the front or above. No individual dancer's position tells the story.

**What Roam needs**  
Perspective tag on sections: ground-level / aerial / front-facing. Aerial sections default to top-down formation view. Freehand sketch available.

**Acceptance criteria**
- Perspective tag on sections
- Aerial sections default to top-down view
- Freehand sketch in aerial and front-facing modes

### Req 9 — Language support

**The problem**  
The user base spans Chinese classical, Khmer, Korean, Latin, Japanese, and global styles. Generic translation is insufficient for practitioners. Dance terminology is culturally specific — a bad translation of a movement term is worse than no translation.

**What Roam needs**  
Full UI internationalisation across 7 languages, shipped in two waves. Wave 1 covers the highest-density user communities. Wave 2 covers the expansion markets.

| Language | Wave | Dance context | Notes |
|---|---|---|---|
| **English** | Wave 1 | Global default | Ships first. All terminology sourced from this. |
| **Mandarin (Simplified)** | Wave 1 | Chinese classical, K-pop in China, Xiaohongshu community | Long-lead — source practitioners in Chinese classical |
| **Korean** | Wave 1 | K-pop, Korean court dance | Long-lead — source practitioners in Korean court dance |
| **Japanese** | Wave 1 | J-pop, contemporary, classical Butoh | Japanese dance community is large and underserved by current tools |
| **Spanish** | Wave 2 | Latin dance styles — salsa, bachata, reggaeton choreo | Large global community, strong in Americas and Europe |
| **Khmer** | Wave 2 | Khmer classical, Apsara dance | Niche but deeply underserved — no tools exist for this community |
| **Cambodian (Khmer script)** | Wave 2 | Same as above — Khmer and Cambodian are the same language | Requires Khmer script rendering support in the UI framework |

**Acceptance criteria**
- UI fully available in EN / ZH / KR / JA at launch
- ES / KM added in Wave 2 without architectural rework
- Dance terminology uses locale-specific vocabulary sourced from domain practitioners — not machine translation, not generic dictionaries
- Khmer script rendering tested on Android (dominant device in Cambodia) before Wave 2 ships
- Architecture supports additional locales without rework
- WeChat Mini Program: post-launch

> **Long-lead item — start now:** Terminology localisation requires domain experts in each style. This is not an engineering task and cannot be rushed. For Chinese classical, Korean court, Khmer Apsara, and Japanese Butoh — source practitioners before the body language layer ships. Allow 6–8 weeks minimum per language for terminology review. Machine translation for UI strings is acceptable as a placeholder. Machine translation for dance terminology is not acceptable at any stage.

> **Why Japanese:** The Japanese dance community — J-pop choreographers, contemporary dancers, Butoh practitioners — is one of the most active in Asia and currently has zero purpose-built tools. Adding Japanese at Wave 1 is low engineering cost and opens a market that is ready to adopt.

> **Why Spanish:** Latin dance choreography (salsa, bachata, reggaeton) has a massive global community that creates enormous amounts of choreography content. Spanish speakers are heavily represented on TikTok and YouTube dance communities. This is an expansion market that arrives naturally as Roam grows.

> **Why Khmer:** Khmer classical and Apsara dance are among the most technically complex choreographic forms in the world — hand positions, finger angles, and head movements that have no equivalent in Western notation. No digital tool supports this community. It is a small market but one where Roam would be immediately irreplaceable.

### Req 10 — Prop and costume extension as body language

*Reference: Water Sleeve Dance (sleeves as movement extension), Buchaechum (fans as formation instrument)*

**The problem**  
In Water Sleeve Dance the sleeve is a fabric extension of the arm — its arc and float timing is the choreography. 'Right arm, outward arc' describes the limb, not the sleeve following it with a 0.3-second delay. In Buchaechum the fans are the formation instrument.

**What Roam needs**  
Extension tag on clip or note pin: sleeve / fan / ribbon / veil / staff / other (user-defined). Pairs with body zone tag. Not prop tracking — captures creative intent.

**Acceptance criteria**
- Extension tag selectable alongside body zone tag
- User-defined extension names with autocomplete
- Searchable in library
- No mandatory fields

### Req 11 — Music notation reference for classical styles

**The problem**  
Classical Chinese, Khmer, and Korean court dance are composed in tight relationship with specific musical phrases and sometimes formal notation systems. BPM and sections don't capture 'this movement happens on the descending phrase in bar 12'.

**What Roam needs**  
Not a notation editor. A music reference note field on note pins (free-text, not parsed). Score attachment at session level (PDF or image, viewable in a side panel). Both unobtrusive — classical dancers who need it find it; everyone else never sees it.

**Acceptance criteria**
- Optional music reference text field on note pins (secondary, not prominent)
- Score attachment on session: PDF or image, side panel viewer
- Neither field required; neither blocks existing workflow

### Revised data model — body language fields

| New field | Where | Type | Purpose |
|---|---|---|---|
| `body_zones: string[]` | Clip, NotePin | string[] | Body annotation zones |
| `body_zone_qualifier: string` | Clip, NotePin | string | Extension qualifier (sleeve: float) |
| `extension_tag: string` | Clip, NotePin | string | Prop/costume extension type |
| `movement_type: enum` | Clip | enum | stationary / floor travel / jump / lift / partnering |
| `style_tag: string` | Section, Clip | string | User-defined style with autocomplete |
| `dancer_role: string` | Clip (per section) | string | principal / ensemble / counter / user-defined |
| `presence_range: object` | Dancer (per session) | object | When dancer is in the piece {start_ms, end_ms} |
| `partner_link: clip_id` | Clip | uuid | Links two clips as a partnering pair |
| `cascade_annotation: object` | Section | object | Wave/domino: start, direction, interval_beats |
| `perspective: enum` | Section | enum | ground-level / aerial / front-facing |
| `silhouette_sketch: SVG path` | Section (aerial/front) | string | Freehand collective shape sketch |
| `music_reference_note: string` | NotePin | string | Free-text musical context (unparsed) |
| `score_attachment: file_ref` | Session | file_ref | PDF or image of musical score |

---

## 3. Offline Capability

Network must never block creative work — offline is load-bearing infrastructure for the moat.

The living library and history view are only powerful if they are always present. Offline is not a convenience feature. It is the condition under which the moat actually functions.

### Offline behaviour by feature

| Feature | Offline behaviour |
|---|---|
| Capture (video + voice) | Fully offline. Records to device, queues upload. Zero network in critical path. |
| Inbox | Fully offline. Clips appear immediately. |
| Session workbench (5 most recent) | Fully offline. Music and clips pre-cached on last wifi access. |
| Living library | Fully offline. Queries local SQLite + cached clip metadata. |
| Note pins (text + voice) | Fully offline. Writes to SQLite, syncs on reconnection. |
| History view | Fully offline. All genealogy data in local SQLite. |
| Clip tagging + assignment | Fully offline. Changes queue locally, flush on reconnect. |
| Beat grid / BPM | Fully offline once analysed. Cached permanently. |
| Share link creation | Requires network. |
| Feedback / comments | Requires network. |
| Music upload + analysis | Requires network. |

### Write queue architecture

All writes that require a network call go through a persistent sync queue first. The queue survives app restarts. Every write is locally committed under 100ms regardless of connectivity. The user never waits for a server round-trip.

Conflict resolution: last-write-wins by timestamp. Roam is primarily single-user. Conflicts are edge cases limited to multi-device offline usage. No merge UI required.

### Acceptance criteria

- Camera opens and records with zero network calls in the critical path
- Clip appears in Inbox within 500ms of stopping, with no connection
- Note pin committed to SQLite within 100ms, regardless of network state
- The 5 most recently accessed sessions are fully playable offline (music + clips)
- Living library queries return results from local cache when offline
- History view is fully accessible offline
- All queued writes sync automatically within 30 seconds of reconnection
- No user action is blocked, degraded, or shows an error state when offline
- Connectivity indicator visible but never modal or blocking
- Cache cap enforced at 3GB; oldest sessions evicted first

---

## 4. In-App Sharing

Directed creative conversation between Roam users — not a social platform.

Sharing in Roam is always intentional, directed, and in service of the creative process. There is no public feed, no follower count, no algorithm, no performance metric. Every share is a conversation between two people about specific creative work.

### Three layers — shipped in order of complexity

**Layer 1 — Clip conversation threads (ships after solo workflow is solid)**  
A choreographer taps a clip and sends it directly to another Roam user with a voice note attached. The recipient receives it in their Inbox — not a notification, not a feed. They record a voice response. The response threads back to the original clip. No share tokens. No web viewer. No links outside the app. Two Roam users, one clip, one creative conversation.

**Layer 2 — Collaborator role in a session (ships after Layer 1 is embedded)**

| Role | Can do | Cannot do |
|---|---|---|
| viewer | Watch clips, read note pins | Anything else |
| annotator | Add note pins, record voice responses | Edit, add clips |
| contributor | Add clips, add note pins | Delete, restructure |

The session owner's work is always visually distinct from collaborator contributions — different colour note pins, attributed voice notes. The session belongs to the owner. Collaborators are guests. Invitations require a Roam username or phone number — no public discovery of sessions.

**Layer 3 — Shared creative space (design now, build after Layer 2)**  
Two choreographers working on the same piece together, both with full contributor access. This is not an early feature. But the data architecture (attribution on every clip, note, and annotation; role-based access at session level) must be designed in now so it does not require a schema migration later.

### What does not ship — ever

| Requested feature | Why it does not ship |
|---|---|
| Public profile / portfolio page | Turns Roam into a performance platform. Choreographers start curating for audience rather than working honestly. |
| Feed of recent work | Algorithms optimise for engagement, not creative process. Roam has no algorithm. |
| Like / reaction on clips | Turns creative work into content with metrics. Rough clips should not have like counts. |
| Discovery / explore page | Public discovery creates pressure to share finished work. Roam is for unfinished work. |
| Follower counts | Irrelevant to creative process. Invites comparison. Does not ship. |

### New data model fields

| Field | Where | Purpose |
|---|---|---|
| `shared_to_user_id: uuid` | Clip | Direct clip share to specific Roam user |
| `share_thread: VoiceNote[]` | Clip | Conversation thread of voice responses |
| `session_collaborators: array` | Session | Collaborator roster with roles |
| `contribution_author_id: uuid` | NotePin, Clip | Attribution for collaborator contributions |
| `contribution_color: string` | NotePin | Visual distinction of collaborator notes |

---

## 5. Experience Improvements

Five additions to push past 84% retention — all within Roam's philosophy.

### 5a. Repetition regions (A-B loop) with takes view

**Context: what MirrorTube got right and what it got wrong**

MirrorTube was a Chrome extension that let dancers watch YouTube with mirror, slow motion, and an A-B loop. It was taken down from the Chrome store. The reason dancers mourned it — and are still asking for a replacement — was one specific interaction: click a button, it reads the current video timestamp and sets it as boundary 1. Scrub to the end of the phrase. Click again — boundary 2 set. The loop holds. No manual time entry, no form, no interrupting the video.

That single interaction — tap to set boundary at the current playhead position — is what made it usable while dancing. Every competing tool requires typing timestamps (00:00 format) into a form, which means stopping, looking at a screen, finding a keyboard, and losing physical momentum.

Roam inherits this interaction and improves it in three ways MirrorTube never could:

1. Multiple loops, all persistent — MirrorTube allows one loop at a time. Setting a new one destroys the old one. A choreographer drilling a chorus entry and a bridge transition must manually re-enter timestamps every time they switch between sections. In Roam, both loops live on the waveform simultaneously as named bookmarks. Tapping one activates it. The other stays exactly where it was.

2. Loops that survive — MirrorTube loops exist only in the browser tab. Close it and they are gone. In Roam, every loop is a persistent named object. Reopen the session next week — the loops are there, still set to the exact milliseconds, still named "chorus entry" and "bridge transition."

3. Loop-aware clip capture — MirrorTube has no session. There is nowhere for the work to go. In Roam, clips recorded during an active loop are tagged to that loop automatically. When the choreographer returns, the loop and all its takes are together.

**The interaction in precise terms**

The loop boundary is set by a single tap at any point during video or audio playback. No menu, no form, no time entry.

- Video or audio is playing
- Choreographer taps the "set start" control at any moment — Roam reads the current playhead position and sets it as the loop start, to the millisecond
- Choreographer continues watching, taps "set end" when the phrase ends — loop activates immediately and begins repeating
- The loop has a default name ("loop 1") that the choreographer can rename with one tap — "chorus entry", "the turn", "that bit at 0:42"
- The loop appears as a coloured region on the waveform, labelled with its name
- To create a second loop: tap "set start" at any other point — a new loop object is created, the previous one is unaffected and remains visible on the waveform
- To switch between loops: tap the loop region on the waveform — playhead jumps to its start, loop activates
- To delete a loop: long-press the loop region, confirm delete — the only way a loop is removed

This applies identically on the session waveform (own clips and uploaded audio) and inside the Screen 4 reference video viewer (YouTube, Bilibili, XHS). The same tap-to-set interaction, the same named persistent objects, the same waveform bookmarks — whether the source is the choreographer's own music or a tutorial they found online.

**Multiple saved loops**

Each repetition region is a named, persistent object (`label`, `start_ms`, `end_ms`, `color`, `count_limit`). Tapping a region activates it — the playhead loops that segment. Tapping another region switches to that one. Only one region plays at a time. Regions are bookmarks on the waveform, not mutually exclusive modes.

**Nested loops (drill progression)**

A choreographer drilling a phrase often works small-to-large: nail the 2-second gesture, then integrate into the 8-second phrase. Nested loops support this: an inner region (1–3s) can be set to repeat N times before automatically expanding to the outer region (1–8s). This maps directly to how choreographers actually drill — no other tool models it.

**Takes view**

When a choreographer records multiple clips during the same repetition region — attempting the same phrase several times across a rehearsal — those clips are automatically grouped as takes of that region. The takes view shows all attempts side by side (or in a swipeable stack) with synchronised playback anchored to the loop start point. The choreographer can scrub through takes in sync, or tap to pin one for comparison. This is the decision surface: which of these four attempts is the one I keep?

> Takes view is the intersection of the loop tool and the clip library. It surfaces the right clips at the right moment without requiring the choreographer to search for them.

**Acceptance criteria**
- Loop boundary set by single tap at current playhead position — no manual time entry, no form
- Applies identically on session waveform and Screen 4 reference video viewer
- Multiple repetition regions saved simultaneously, each with label, color, start_ms, end_ms
- Tapping a region activates it; only one region plays at a time
- Loops persist across app closes and sessions — never reset without explicit delete action
- Long-press to delete a region — the only removal mechanism
- Clips captured during an active region are tagged with that region's id
- Takes view available from any region: shows all region-tagged clips in sync
- Nested loop: inner region repeats N times before expanding to outer region
- Region `count_limit`: loops N times then stops (null = infinite)
- No mandatory fields — regions remain simple A-B loops if the choreographer never uses takes

*Acceptance test: a choreographer sets a loop on a chorus section in under 5 seconds without stopping playback. They then set a second loop on the bridge without the first loop disappearing. They close the app, reopen it the next day, and both named loops are exactly where they left them.*

### 5b. First-session magic moment

**The problem**  
Roam's best features — living library, history view, creative genealogy — require weeks of accumulated data. A new user's first session is empty. The app's best features are invisible on day 1, and users who don't see value in the first session rarely return for the second.

**What to build**  
A curated onboarding movement library — a small set of reference clips organised by style tag (contemporary, Chinese classical, K-pop, neoclassical), created by the Roam team. When a new user records their first 3 clips and tags a style, Roam surfaces 2–3 reference clips in that style. Not suggestions — a preview of what the living library becomes. The message is: this is what your library will look like when it knows you.

**Acceptance criteria**
- New users who tag a style on first 3 clips see 2–3 onboarding library clips
- Onboarding clips clearly labelled as reference material, not user history
- Disappear from library once user has 20+ own clips
- Cannot be added to a session — reference only

### 5c. Weekly session summary (mirror)

**The problem**  
The moat — creative genealogy, process patterns, movement vocabulary — builds silently. Users don't know what they've accumulated and don't understand what they'd lose by leaving. Invisible value is not sticky value.

**What to build**  
A lightweight screen that appears when the app is opened after 7+ days of inactivity. Not a push notification. Not an email. Three items: clips captured, one process observation, one surfaced memory. Nothing prescriptive. Just a mirror.

> **Algorithm constraint:** the process observation must be factual, not interpretive. "You recorded 8 clips this week, 6 in the 120–130 BPM range" is a mirror. "You might want to revisit the intro" is a muse. The line must be enforced in the algorithm. When uncertain, show raw data and let the choreographer draw conclusions.

**Acceptance criteria**
- Appears on first app open after 7+ days, never more than once per 7 days
- Shows exactly 3 items: clips count, one process observation, one surfaced memory
- Dismisses in one tap with no confirmation
- Never appears in week 1 (insufficient data)
- Process observation requires minimum 3 sessions before appearing

### 5d. Stick figure body annotation

**The problem**  
The body language layer is tag-based — text zones and qualifiers. Text works for retrieval but does not help the choreographer communicate body shape quickly to a collaborator or recall it visually for themselves. 'Right arm extended at 45 degrees with sleeve float' is much harder to read than a stick figure showing exactly that.

**What to build**  
A simple 2D front-view stick figure on any clip — five draggable joints, five lines, 5 seconds to draw. Not 3D, not motion capture. The choreographer draws it manually. Always. Long term this enables visual body shape matching in the living library — 'you drew a similar arm position 4 months ago, here is that clip'.

**Acceptance criteria**
- Stick figure annotation available on any clip via tag sheet
- 5 draggable joints (head, 2 arms, 2 legs) on 2D front-view body
- Completed annotation appears as small thumbnail on clip card
- Always optional — never required
- Body shape stored as joint coordinate array for future visual matching

### 5e. Exit conversation

**The problem**  
When a user stops opening the app for 14 days, Roam currently has no signal about why. The simulation estimates churn reasons. Real users state them precisely.

**What to build**  
A single screen triggered after 14 days of inactivity — shown the next time they open the app. One question: 'What did Roam not do that made you step back?' One free-text field. No options, no multi-choice. Responses read by a human, not automated.

> **Question framing matters.** "What did Roam not do?" is self-critical and open. "Why did you stop using Roam?" is accusatory. "What got in the way?" is also acceptable. Test the phrasing before shipping.

**Acceptance criteria**
- Trigger fires once after 14 consecutive days of no app open
- Never fires in the first 7 days
- Single free-text field, one question, no options
- Skip dismisses permanently — never shown again
- Responses visible in admin dashboard within 5 minutes

---

### 5f. Session PDF export — GoodNotes and Notability template

**The problem**

A choreographer finishing a session has a song map, a set of clips, a feeling layer, and loop regions — but no way to get a structured, annotatable overview of the session out of the app and into their hands as a physical or tablet-native document. Choreographers who work with Apple Pencils in GoodNotes or Notability currently have no connection between their digital studio work and their handwritten annotation practice.

**The opportunity**

Procreate distributes `.procreate` brush packs and canvas templates. GoodNotes distributes PDF notebook templates. Both have built communities around people sharing beautiful templates on Instagram and Xiaohongshu. Roam can do the same thing — and the shareable artifact is a session export, not a generic template. Every shared export is a visible piece of Roam's design in the world.

**What the PDF export contains**

- Session header: name, date, the feeling layer phrase, and the session color as a bleed behind the header
- Waveform with section boundaries marked and labeled
- Section grid: one row per section, small clip thumbnails, loop region markers, generous blank annotation space for handwritten notes
- Feeling layer panel: the phrase, the quality target ("the moment") thumbnail, the reference song title, the color swatch
- Footer: Roam wordmark, session metadata

**What it is designed to do**

The PDF is beautiful enough that a choreographer wants to share it. This is the Xiaohongshu and Instagram distribution channel — a dancer posts their exported session map, other dancers ask what app generated it. The export is a marketing artifact as much as a functional document. It must be worth sharing.

The design language follows Procreate's export sheets, GoodNotes premium templates, and Field Notes notebooks: clean architectural grid, generous margins, the waveform as a structural element, section colors as subtle fills, the session name in a large serif at the top. Space to write.

**What it is not**

The PDF is not a share link. It is not a video. It is not a social post. It is a structured document — designed to be imported into GoodNotes or Notability and annotated with an Apple Pencil, or printed and taken to a studio. It exists in the annotatable document tradition, not the content sharing tradition.

**Connection to the living library**

Exported PDFs accumulate. A choreographer who has exported 20 session PDFs into GoodNotes has 20 beautiful documents they can flip through and annotate. This is the physical analogue of Roam's living library — and it lives in a tool the choreographer may already use daily. The PDF export is not a competitor to the in-app living library; it is a bridge to the physical annotation practice.

**Acceptance criteria**

- "Export session" produces a PDF from any session with content (at least one section defined)
- PDF contains: session header with name, date, feeling layer phrase and color; waveform with section markers; section grid with clip thumbnails; feeling layer panel; annotation space per section
- PDF is formatted for A4 and US Letter (user selects at export)
- PDF is formatted for GoodNotes horizontal notebook proportions as a third option
- Export takes under 5 seconds for a standard 5-section session
- Exported PDF is visually distinctive — worth sharing on Xiaohongshu or Instagram
- Available offline — PDF is generated from locally cached session data

*Acceptance test: a choreographer exports a session, imports the PDF into GoodNotes, and annotates it with an Apple Pencil. A second choreographer sees the shared export on Xiaohongshu and can identify it as a Roam session.*

---

### 5g. Rough assembly view and CapCut handoff

**The problem**

After a session, a choreographer wants to see how the piece holds together. Not perform it. Not film it. Just watch it — section by section, clip by clip, against the song — to feel whether the sequencing works, whether the transitions land, whether what they built in four hours actually makes a full piece. Right now this means scrolling a camera roll with no structure, no song reference, no order.

Roam already has everything needed for this. The song map holds the sections. Each section holds the clips, in order, labeled REF or MINE. The song is loaded. A rough assembly is not a new feature — it is a new view of data Roam already holds. The song map is already a timeline. Playing it is one step further.

**What rough assembly is — and what it is not**

Rough assembly is the choreographer pressing play and watching their clips back-to-back against the song, in section order, as a continuous sequence. It is a review tool, not a production tool. It shows the work. It does not produce content for an audience.

It is not CapCut. Roam does not add transitions, colour grading, titles, audio mixing, or export formats optimised for social media. Those are production decisions that belong to the choreographer in a production tool. Roam's job ends at: here is your piece, in order, against the music. Take it from here.

**What must be true — rough assembly view**

- A "play assembly" button on the song map plays all MINE clips back-to-back in section order, with the session song playing underneath
- Playback follows the section sequence — intro clips, then verse clips, then chorus clips, and so on — each clip playing in full before the next begins
- If a section has multiple clips, the choreographer can choose which one to use in the assembly before playing (default: most recent)
- The view shows which section is currently playing — the song map highlights the active section during playback
- REF clips are excluded from assembly playback by default — the assembly plays MINE clips only, showing the choreographer's own work
- Pausing assembly returns to the song map at the current section — not to the beginning
- No editing within the assembly view itself — this is playback only. Editing (trimming, reordering) happens at the clip and section level in the song map, then the assembly reflects those choices

**What must be true — CapCut handoff**

After reviewing the rough assembly, the choreographer may want to take the clips somewhere to finish them — add music, cut properly, share. Roam exports a clean package that CapCut (or any video editor) can open immediately.

- "Export assembly" outputs a folder containing: all MINE clips in section order, numbered sequentially, plus the session song as a separate audio file
- The export is structured so importing into CapCut produces a timeline in the correct order with the song already aligned — no manual reordering required
- Export naming is human-readable: `01_intro_clip.mp4`, `02_verse_clip.mp4`, `03_chorus_clip.mp4`, and so on, with the session name as the folder name
- Export includes only the clips selected for assembly — if the choreographer chose take 3 of the chorus over take 1, only take 3 is in the export
- Export is available offline — it packages local files, no network call required

**What does not ship**

Roam does not build a timeline editor, transition library, audio mixer, or social export templates. The boundary is deliberate: the moment Roam starts making production decisions, it becomes a worse version of CapCut instead of an irreplaceable version of itself. The choreographer's creative work ends at assembly. Production begins when they leave Roam.

**The line between Roam and CapCut**

| Roam handles | CapCut handles |
|---|---|
| Clip organisation by section | Timeline editing with transitions |
| Playback against the song | Audio mixing and sync |
| Which take to use per section | Colour grading |
| Section-ordered export | Titles, captions, effects |
| Offline access to all clips | Social media export formats |

*Acceptance test: a choreographer finishes a session, opens assembly view, watches their full piece against the song in under 30 seconds, selects the best take per section, exports the folder, imports it into CapCut, and sees a correctly ordered timeline with the song already present — without any manual reordering.*

---

## 6. Simulation Summary

100 synthetic users · 3 product states · 8 weeks

### Three-stage results

| Metric | Baseline (no Roam) | Part 0 only | Full app |
|---|---|---|---|
| W8 retention | 52% | 71% | 84% |
| Paid conversion | 14% | 22% | 31% |
| "Lost without it" | 38 users | 61 users | 79 users |
| Camera roll replaced | 38% | 56% | 74% |
| NRR (projected) | 95% | 108% | 118% |
| Annual churn (proj.) | 18% | 10% | 6% |
| Raise signal | Pre-seed | Seed | Series A |

### Simulation metric caveat

The simulation measured weekly active use. Given that Roam is a seasonal tool tied to creative projects — not a daily habit — these numbers should be interpreted as intensity during active periods, not as a prediction of week-over-week opens. Real retention will be measured project-to-project. A choreographer who uses Roam for one production, pauses for 8 weeks, and returns for the next is a retained user not captured by this model.

### Key finding: the moat forms at week 6

The simulation's most important output is not the 84% number — it is when and why users become irreplaceable. The answer is week 6: the first time someone uses the history view and sees a decision chain from 6 weeks ago that no other tool holds. That is the moment the product stops being useful and becomes irreplaceable. Every feature that accelerates this moment is high-priority. Every feature that delays it is not.

> *"Roam remembers so the choreographer doesn't have to." The full app is the version where that sentence becomes permanently true — not just for this session, but across an entire creative career.*
