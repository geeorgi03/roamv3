import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { MusicTrack } from '@roam/types';

export function useMusicTrackStatus(sessionId: string | null) {
  const [musicTrack, setMusicTrack] = useState<MusicTrack | null>(null);

  const refetch = async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    setMusicTrack((data as MusicTrack | null) ?? null);
  };

  useEffect(() => {
    if (!sessionId) {
      setMusicTrack(null);
      return;
    }

    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      if (mounted) setMusicTrack((data as MusicTrack | null) ?? null);
    })();

    channel = supabase
      .channel(`music_tracks:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'music_tracks',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (mounted) setMusicTrack(payload.new as MusicTrack);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'music_tracks',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (mounted) setMusicTrack(payload.new as MusicTrack);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const isAnalysing =
    musicTrack?.analysis_status === 'pending' || musicTrack?.analysis_status === 'processing';

  return { musicTrack, isAnalysing, refetch };
}
