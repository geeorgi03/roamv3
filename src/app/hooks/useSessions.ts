import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/supabase';
import type { Session } from './useSessionData';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiRequest('/sessions');
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Failed to load sessions (${res.status}): ${body.error || res.statusText}`);
      }

      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createSession = async (sessionData: Omit<Session, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const res = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Failed to create session (${res.status}): ${body.error || res.statusText}`);
      }

      const data = await res.json();
      setSessions(prev => [data.session, ...prev]);
      return data.session;
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await apiRequest(`/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    deleteSession,
    refreshSessions: loadSessions,
  };
}