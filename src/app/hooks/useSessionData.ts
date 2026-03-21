import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/supabase';

export interface Session {
  id: string;
  userId: string;
  songName: string;
  artist: string;
  tempo: number;
  duration: number;
  musicUrl?: string;
  sections: Array<{ name: string; start: number; end: number }>;
  mirrorEnabled: boolean;
  createdAt: string;
}

export interface Clip {
  id: string;
  sessionId: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  startTime: number;
  section?: string;
  type: 'idea' | 'teaching' | 'full-run';
  feel?: string;
  tags: string[];
  createdAt: string;
  // Phase 2 fields
  type_tag?: string | null;
  feel_tags?: string[];
  section_id?: string | null;
  timecode_ms?: number | null;
  session_name?: string;
}

export interface NotePin {
  id: string;
  sessionId: string;
  userId: string;
  timecode: number;
  text?: string;
  audioUrl?: string;
  createdAt: string;
}

export interface LoopRegion {
  id: string;
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  name: string;
  repeatCount?: string;
  color?: string;
  createdAt: string;
}

export interface FloorMark {
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

export function useSessionData(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [notes, setNotes] = useState<NotePin[]>([]);
  const [loops, setLoops] = useState<LoopRegion[]>([]);
  const [marks, setMarks] = useState<FloorMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load session
      const sessionRes = await apiRequest(`/sessions/${sessionId}`);
      if (!sessionRes.ok) {
        throw new Error('Failed to load session');
      }
      const sessionData = await sessionRes.json();
      setSession(sessionData.session);

      // Load clips
      const clipsRes = await apiRequest(`/sessions/${sessionId}/clips`);
      if (clipsRes.ok) {
        const clipsData = await clipsRes.json();
        setClips(clipsData.clips || []);
      }

      // Load notes
      const notesRes = await apiRequest(`/sessions/${sessionId}/notes`);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }

      // Load loops
      const loopsRes = await apiRequest(`/sessions/${sessionId}/loops`);
      if (loopsRes.ok) {
        const loopsData = await loopsRes.json();
        setLoops(loopsData.loops || []);
      }

      // Load floor marks
      const marksRes = await apiRequest(`/sessions/${sessionId}/marks`);
      if (marksRes.ok) {
        const marksData = await marksRes.json();
        setMarks(marksData.marks || []);
      }
    } catch (err) {
      console.error('Error loading session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const updateSession = async (updates: Partial<Session>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update session');
      }

      const data = await res.json();
      setSession(data.session);
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  };

  const addClip = async (clipData: Omit<Clip, 'id' | 'sessionId' | 'userId' | 'createdAt'>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/clips`, {
        method: 'POST',
        body: JSON.stringify(clipData),
      });

      if (!res.ok) {
        throw new Error('Failed to add clip');
      }

      const data = await res.json();
      setClips(prev => [...prev, data.clip]);
      return data.clip;
    } catch (err) {
      console.error('Error adding clip:', err);
      throw err;
    }
  };

  const deleteClip = async (clipId: string) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/clips/${clipId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete clip');
      }

      setClips(prev => prev.filter(c => c.id !== clipId));
    } catch (err) {
      console.error('Error deleting clip:', err);
      throw err;
    }
  };

  const addNote = async (noteData: Omit<NotePin, 'id' | 'sessionId' | 'userId' | 'createdAt'>) => {
    if (!sessionId) return;

    try {
      const payload = {
        timecode_ms: Math.round(noteData.timecode * 1000),
        text: noteData.text,
        audio_storage_path: noteData.audioUrl,
      };
      const res = await apiRequest(`/sessions/${sessionId}/notes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to add note');
      }

      const data = await res.json();
      // Normalize API response fields back to front-end shape
      const note: NotePin = {
        ...data.note,
        timecode: data.note.timecode_ms != null ? data.note.timecode_ms / 1000 : data.note.timecode,
        audioUrl: data.note.audio_storage_path ?? data.note.audioUrl,
      };
      setNotes(prev => [...prev, note]);
      return note;
    } catch (err) {
      console.error('Error adding note:', err);
      throw err;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<NotePin>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update note');
      }

      const data = await res.json();
      setNotes(prev => prev.map(n => n.id === noteId ? data.note : n));
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  };

  const addLoop = async (loopData: Omit<LoopRegion, 'id' | 'sessionId' | 'userId' | 'createdAt'>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/loops`, {
        method: 'POST',
        body: JSON.stringify(loopData),
      });

      if (!res.ok) {
        throw new Error('Failed to add loop region');
      }

      const data = await res.json();
      setLoops(prev => [...prev, data.loop]);
      return data.loop;
    } catch (err) {
      console.error('Error adding loop region:', err);
      throw err;
    }
  };

  const deleteLoop = async (loopId: string) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/loops/${loopId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete loop region');
      }

      setLoops(prev => prev.filter(l => l.id !== loopId));
    } catch (err) {
      console.error('Error deleting loop region:', err);
      throw err;
    }
  };

  const updateLoop = async (loopId: string, updates: Partial<LoopRegion>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/loops/${loopId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update loop region');
      }

      const data = await res.json();
      setLoops(prev => prev.map(l => (l.id === loopId ? data.loop : l)));
      return data.loop;
    } catch (err) {
      console.error('Error updating loop region:', err);
      throw err;
    }
  };

  const addFloorMark = async (markData: Omit<FloorMark, 'id' | 'sessionId' | 'userId' | 'createdAt'>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/marks`, {
        method: 'POST',
        body: JSON.stringify(markData),
      });

      if (!res.ok) {
        throw new Error('Failed to add floor mark');
      }

      const data = await res.json();
      setMarks(prev => [...prev, data.mark]);
      return data.mark;
    } catch (err) {
      console.error('Error adding floor mark:', err);
      throw err;
    }
  };

  const updateFloorMark = async (markId: string, updates: Partial<FloorMark>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/marks/${markId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update floor mark');
      }

      const data = await res.json();
      setMarks(prev => prev.map(m => m.id === markId ? data.mark : m));
    } catch (err) {
      console.error('Error updating floor mark:', err);
      throw err;
    }
  };

  const deleteFloorMark = async (markId: string) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/marks/${markId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete floor mark');
      }

      setMarks(prev => prev.filter(m => m.id !== markId));
    } catch (err) {
      console.error('Error deleting floor mark:', err);
      throw err;
    }
  };

  const updateClip = async (clipId: string, updates: Partial<Clip>) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest(`/sessions/${sessionId}/clips/${clipId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update clip');
      }

      const data = await res.json();
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, ...data.clip } : c));
      return data.clip;
    } catch (err) {
      console.error('Error updating clip:', err);
      throw err;
    }
  };

  const fetchCrossSessionClips = async (filters: {
    typeTag?: string;
    feelTags?: string[];
    sectionId?: string;
    unassigned?: boolean;
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.typeTag) {
        params.append('type_tag', filters.typeTag);
      }
      
      if (filters.feelTags && filters.feelTags.length > 0) {
        filters.feelTags.forEach(tag => params.append('feel_tags[]', tag));
      }
      
      if (filters.sectionId) {
        params.append('section_id', filters.sectionId);
      }
      
      if (filters.unassigned) {
        params.append('unassigned', 'true');
      }

      const res = await apiRequest(`/clips?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch cross-session clips');
      }

      const data = await res.json();
      return { clips: data.clips || [] };
    } catch (err) {
      console.error('Error fetching cross-session clips:', err);
      throw err;
    }
  };

  return {
    session,
    clips,
    notes,
    loops,
    marks,
    loading,
    error,
    refresh,
    updateSession,
    addClip,
    deleteClip,
    addNote,
    updateNote,
    deleteNote,
    addLoop,
    updateLoop,
    deleteLoop,
    addFloorMark,
    updateFloorMark,
    deleteFloorMark,
    updateClip,
    fetchCrossSessionClips,
  };
}
