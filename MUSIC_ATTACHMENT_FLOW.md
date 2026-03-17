# Music Attachment Flow Documentation

## Overview

The music attachment flow allows choreographers to add music to their Roam sessions via two methods:
1. **URL paste** - from Spotify or YouTube
2. **File upload** - local audio files

Both inputs have equal visual weight, with no preference implied between them.

---

## 🎨 Design States

### Artboard 1: Default State
**Component**: `MusicAttachmentSheet`

A bottom sheet modal with minimal design:
- Title: "Add music"
- Text input field: "Paste a Spotify or YouTube link"
- Divider with "or" label
- Upload button: "Upload a file ↑"

**Design notes**:
- No icons in the input field
- No streaming platform branding
- Clean, neutral presentation

### Artboard 2: URL Pasted - Loading
**State**: User pasted a valid URL

Display:
- URL field shows pasted link (truncated)
- Small spinner + "Finding track…" text
- Replaces both original options with inline loading state

**Design notes**:
- No full-screen loader
- Loading happens inline within the sheet
- User stays in context

### Artboard 3: Preview Ready
**State**: Track metadata resolved

Display:
- Track name (14px, primary color)
- Artist name (12px, secondary color)
- Duration (12px, monospace font)
- Static waveform placeholder (flat, not rendered yet)
- [Confirm] button (full width, primary accent)
- [Cancel] text link below

**What's NOT shown**:
- ❌ No album art
- ❌ No streaming logo
- ❌ No platform branding

### Artboard 4: Extraction in Progress (Workbench)
**Location**: Inside session workbench
**State**: Music importing after confirmation

Display:
- Music attachment sheet dismissed
- Waveform track shows loading animation
- Animated fill sweeping left-to-right across placeholder
- Small inline label: "Importing track…"

**Design notes**:
- No modal overlay
- No progress bar
- Workbench remains fully usable
- Loading is subtle and non-blocking

### Artboard 5: Error State
**State**: Extraction failed

Display:
- Plain inline message:
  - "This track couldn't be imported."
  - "Try uploading an audio file instead."
- [Upload a file ↑] button

**Design notes**:
- No technical error details
- No retry spinner
- Simple fallback to file upload

---

## 📁 File Structure

```
/src/app/components/
  ├── MusicAttachmentSheet.tsx     # Main modal component
  └── WaveformLoadingTrack.tsx     # Loading animation for waveform

/src/app/screens/
  ├── Home.tsx                      # Can trigger from new session dialog
  └── SessionWorkbench.tsx          # Can trigger from workbench
```

---

## 🔧 How to Use

### From SessionWorkbench

```tsx
import MusicAttachmentSheet from "../components/MusicAttachmentSheet";

const [showMusicAttachment, setShowMusicAttachment] = useState(false);
const [musicImporting, setMusicImporting] = useState(false);

const handleMusicAttachment = async (data) => {
  setShowMusicAttachment(false);
  setMusicImporting(true);

  // Call your backend API to:
  // - Upload file if type === 'file'
  // - Extract from URL if type === 'url'
  
  setTimeout(() => {
    setMusicImporting(false);
  }, 3000);
};

<MusicAttachmentSheet
  isOpen={showMusicAttachment}
  onClose={() => setShowMusicAttachment(false)}
  onConfirm={handleMusicAttachment}
/>
```

### Display Loading Waveform

```tsx
import WaveformLoadingTrack from "../components/WaveformLoadingTrack";

<WaveformLoadingTrack 
  isLoading={musicImporting}
  progress={0} // Optional: 0-100
/>
```

---

## 💾 Data Structure

### onConfirm callback receives:

```typescript
{
  type: 'url' | 'file',
  value: string | File,  // URL string or File object
  metadata?: {           // Only for URL type
    title: string,
    artist: string,
    duration: number     // in seconds
  }
}
```

---

## 🎯 Integration Points

### 1. New Session Setup
User clicks "Start a session" → Creates session → Opens music attachment sheet

### 2. Add Music to Existing Session
User in workbench → Clicks "+ Track" or music icon → Opens music attachment sheet

---

## 🎨 Design Tokens Used

All Roam design tokens from `/src/styles/theme.css`:

- `--surface-base` - Background
- `--surface-raised` - Modal background
- `--surface-overlay` - Loading state background
- `--text-primary` - Track name
- `--text-secondary` - Artist, labels
- `--text-disabled` - Placeholders, "or"
- `--accent-primary` - Confirm button, loading accents
- `--border-subtle` - Borders
- `--waveform-fill` - Waveform bars
- `--font-app-title` - "Add music" title
- `--font-body` - Body text
- `--font-mono` - Duration display

---

## ⚙️ Backend Integration

### Required API Endpoints

1. **Extract metadata from URL**
   ```
   POST /api/music/extract
   Body: { url: string }
   Returns: { title, artist, duration, audioUrl }
   ```

2. **Upload audio file**
   ```
   POST /api/music/upload
   Body: FormData with audio file
   Returns: { audioUrl, duration }
   ```

### Suggested Implementation

Use a service like:
- **spotify-url-info** for Spotify metadata
- **youtube-dl** or **yt-dlp** for YouTube audio extraction
- **ffmpeg** for audio file processing

Store audio files in Supabase Storage and generate waveform data server-side.

---

## ✨ Key Features

1. **Equal Treatment**: URL and file upload have equal visual weight
2. **No Branding**: Completely neutral, no streaming platform colors/logos
3. **Inline States**: All loading/error states happen within the sheet
4. **Non-Blocking**: Workbench remains usable during import
5. **Graceful Fallback**: Errors suggest alternative method

---

## 🚀 Enhancement Ideas

### Future improvements:
- Real waveform rendering after import completes
- Support for Apple Music URLs
- Automatic BPM detection
- Audio trimming/section detection
- Cached metadata for previously imported tracks

---

## 📝 Notes

- URL validation is simple (checks for 'spotify.com' or 'youtube.com')
- Mock success rate is 70% to demonstrate error handling
- Real implementation needs actual metadata extraction API
- Waveform rendering would require Web Audio API or similar
- Consider rate limiting and copyright compliance for URL extraction

---

## 🐛 Error Handling

### URL not supported
→ Show error state with file upload fallback

### File too large
→ Show error message with size limit

### Extraction timeout
→ Show error state, suggest trying again or using file upload

### Invalid audio format
→ Show supported formats list

All errors follow the same pattern: clear message + fallback action.
