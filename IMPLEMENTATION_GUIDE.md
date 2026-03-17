# Roam Backend Implementation Guide

## ✅ What's Already Done

Your Roam app now has a fully functional Supabase backend with:

1. **Authentication System**
   - Sign up/sign in with email & password
   - Auto-confirmed emails (no email server needed for prototyping)
   - Session management
   - Protected routes

2. **Backend API** (`/supabase/functions/server/index.tsx`)
   - Session CRUD operations
   - Clip management
   - Note pin management
   - Loop region management
   - Floor mark management
   - File upload to Supabase Storage

3. **Frontend Utilities**
   - `AuthContext` - Authentication state management
   - `useSessionData` hook - Load/save all session data
   - `useSessions` hook - Manage all user sessions
   - Supabase client utilities

4. **Updated Screens**
   - ✅ **Home** - Creates real sessions, sign out
   - ✅ **SessionWorkbench** - Loads session data, saves clips
   - ⏳ **RepetitionTool** - Needs connection
   - ⏳ **FloorMarkEditor** - Needs connection
   - ⏳ **ReviewMode** - Needs connection

---

## 🚀 How to Use the Backend in Your Screens

### Pattern 1: Load Session Data

Any screen that needs to access session data should use the `useSessionData` hook:

```tsx
import { useSessionData } from "../hooks/useSessionData";
import { useParams } from "react-router";

export default function MyScreen() {
  const { id } = useParams(); // Get session ID from URL
  
  const { 
    session,      // The session object
    clips,        // Array of clips
    notes,        // Array of note pins
    loops,        // Array of loop regions
    marks,        // Array of floor marks
    loading,      // Is data loading?
    error,        // Any error message
    
    // Functions to modify data:
    addClip,
    deleteClip,
    addNote,
    updateNote,
    deleteNote,
    addLoop,
    deleteLoop,
    addFloorMark,
    updateFloorMark,
    deleteFloorMark,
  } = useSessionData(id || null);

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show error state
  if (error || !session) {
    return <div>Error: {error || "Session not found"}</div>;
  }

  // Use the data in your UI
  return (
    <div>
      <h1>{session.songName} by {session.artist}</h1>
      <p>Clips: {clips.length}</p>
      <p>Notes: {notes.length}</p>
    </div>
  );
}
```

### Pattern 2: Create New Data

Example: Adding a new clip when user captures video

```tsx
const handleCapture = async () => {
  try {
    const newClip = await addClip({
      videoUrl: "path/to/video", // From file upload
      startTime: currentTime,     // Current playback position
      type: "idea",               // "idea" | "teaching" | "full-run"
      feel: "smooth",             // Optional: feeling/vibe
      tags: ["phrase", "fast"],   // Array of tags
    });
    
    console.log("Clip saved:", newClip);
  } catch (error) {
    console.error("Failed to save clip:", error);
  }
};
```

### Pattern 3: Upload Files (Videos/Audio)

Use the `uploadFile` helper from supabase utils:

```tsx
import { uploadFile } from "../../utils/supabase";

const handleVideoUpload = async (file: File) => {
  try {
    const { url, path } = await uploadFile(file, 'video');
    
    // Now save the clip with the video URL
    await addClip({
      videoUrl: url,
      thumbnailUrl: "", // Optional: generate thumbnail
      startTime: 0,
      type: "idea",
      tags: [],
    });
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

---

## 📋 Step-by-Step: Connect Remaining Screens

### Screen 1: RepetitionTool

**File**: `/src/app/screens/RepetitionTool.tsx`

**What to add**:
```tsx
import { useSessionData } from "../hooks/useSessionData";
import { useParams } from "react-router";

// In component:
const { id } = useParams();
const { loops, addLoop, deleteLoop, loading } = useSessionData(id || null);

// When user creates a loop region:
const handleCreateLoop = async (startTime: number, endTime: number, name: string) => {
  await addLoop({
    startTime,
    endTime,
    name,
  });
};

// Display saved loops:
loops.map(loop => (
  <div key={loop.id}>
    {loop.name}: {loop.startTime}s - {loop.endTime}s
  </div>
))
```

### Screen 2: FloorMarkEditor

**File**: `/src/app/screens/FloorMarkEditor.tsx`

**What to add**:
```tsx
import { useSessionData } from "../hooks/useSessionData";
import { useParams } from "react-router";

// In component:
const { id } = useParams();
const { marks, addFloorMark, updateFloorMark, deleteFloorMark } = useSessionData(id || null);

// When user saves a formation:
const handleSaveFormation = async (timecode: number, dancers: Array) => {
  await addFloorMark({
    timecode,
    dancers: dancers.map(d => ({
      id: d.id,
      x: d.x,
      y: d.y,
      rotation: d.rotation,
      label: d.label,
    })),
  });
};

// Load formation at specific timecode:
const formationAtTime = marks.find(m => m.timecode === currentTime);
```

### Screen 3: ReviewMode

**File**: `/src/app/screens/ReviewMode.tsx`

**What to add**:
```tsx
import { useSessionData } from "../hooks/useSessionData";
import { useParams } from "react-router";

// In component:
const { id } = useParams();
const { session, clips, notes, loading } = useSessionData(id || null);

// Display all clips for review:
clips.map(clip => (
  <video key={clip.id} src={clip.videoUrl}>
    <p>{clip.type} - {clip.feel}</p>
  </video>
))
```

---

## 🔐 Testing Authentication

1. **Sign Up a Test User**
   - Go to home screen (you'll see auth screen)
   - Click "Don't have an account? Sign up"
   - Enter: email, password, name
   - You'll be auto-signed in

2. **Sign In**
   - Enter email and password
   - Click "Sign In"

3. **Forgot Password**
   - On sign in screen, click "Forgot password?"
   - Enter your email address
   - Click "Send Reset Link"
   - Check your email for reset instructions
   - Click the link in the email
   - You'll be redirected to `/reset-password`
   - Enter and confirm your new password
   - You'll be automatically signed in

4. **Create a Session**
   - Click "Start a session"
   - Enter song name, artist, tempo
   - Click "Create Session"
   - You'll navigate to the session workbench

5. **Test Data Persistence**
   - Create some clips/notes in the session
   - Sign out
   - Sign back in
   - Navigate to the same session
   - Your data should still be there!

---

## 🛠️ Common Tasks

### Get Currently Authenticated User

```tsx
import { useAuth } from "../contexts/AuthContext";

const { user, session } = useAuth();
console.log("User email:", user?.email);
console.log("User ID:", user?.id);
```

### List All User Sessions

```tsx
import { useSessions } from "../hooks/useSessions";

const { sessions, createSession, deleteSession, loading } = useSessions();

// Display all sessions
sessions.map(s => (
  <div key={s.id}>
    {s.songName} by {s.artist}
  </div>
))
```

### Handle Session Updates

```tsx
const { session, updateSession } = useSessionData(id);

// Update session properties
await updateSession({
  mirrorEnabled: true,
  tempo: 140,
});
```

---

## 📊 Data Models Reference

### Session
```typescript
{
  id: string;
  userId: string;
  songName: string;
  artist: string;
  tempo: number;
  duration: number;
  sections: Array<{ name: string; start: number; end: number }>;
  mirrorEnabled: boolean;
  createdAt: string;
}
```

### Clip
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  startTime: number;
  type: 'idea' | 'teaching' | 'full-run';
  feel?: string;
  tags: string[];
  createdAt: string;
}
```

### NotePin
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  timecode: number;
  text?: string;
  audioUrl?: string;
  createdAt: string;
}
```

### LoopRegion
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  name: string;
  createdAt: string;
}
```

### FloorMark
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  timecode: number;
  dancers: Array<{
    id: string;
    x: number;
    y: number;
    rotation: number;
    label: string;
  }>;
  createdAt: string;
}
```

---

## 🐛 Debugging Tips

1. **Check Browser Console**
   - All API errors are logged to console
   - Look for "Error loading..." or "Failed to..." messages

2. **Check Network Tab**
   - Look for requests to `/make-server-837ff822/`
   - Check response status codes
   - Inspect request/response payloads

3. **Verify Authentication**
   ```tsx
   const { user } = useAuth();
   console.log("Authenticated:", !!user);
   ```

4. **Check Data Loading**
   ```tsx
   const { loading, error, session } = useSessionData(id);
   console.log("Loading:", loading);
   console.log("Error:", error);
   console.log("Session:", session);
   ```

---

## ⚠️ Important Notes

1. **This is a Prototype**
   - Figma Make is for testing, not production
   - Don't store sensitive or PII data
   - For production, set up proper infrastructure

2. **Email Confirmation is Disabled**
   - Users are auto-confirmed on signup
   - No email server is configured
   - This is intentional for prototyping

3. **All Data is User-Scoped**
   - Each user only sees their own sessions
   - Authentication is required for all data operations
   - User IDs are automatically added to all data

4. **File Storage**
   - Videos and audio are stored in Supabase Storage
   - Files are in private buckets
   - Signed URLs are generated (valid for 1 year)

---

## 🎯 Next Steps

1. ✅ Test authentication flow
2. ✅ Create a test session
3. ⏳ Connect RepetitionTool to backend
4. ⏳ Connect FloorMarkEditor to backend
5. ⏳ Connect ReviewMode to backend
6. ⏳ Add video recording integration
7. ⏳ Add voice memo recording
8. ⏳ Add session list/browse screen

---

## 📞 Need Help?

Common issues and solutions:

**"Session not found"**
- Check the session ID in the URL
- Verify the session was created by the current user
- Check browser console for API errors

**"Unauthorized"**
- Make sure you're signed in
- Check that `useAuth()` returns a valid user
- Try signing out and back in

**Data not persisting**
- Check that you're calling the `add*` or `update*` functions
- Verify the functions are `await`-ed
- Check browser console for errors
- Look for 4xx/5xx responses in Network tab

Good luck building Roam! 🚀