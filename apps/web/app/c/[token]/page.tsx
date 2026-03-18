import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Session, Clip } from '@roam/types';
import { ClipPlayer } from '../../s/[token]/ClipPlayer';

export const dynamic = 'force-dynamic';

export default async function SharedClipPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('get_shared_clip', { p_token: token });
  if (error || data === null) notFound();

  const { session, clip } = data as { session: Session; clip: Clip };
  if (!clip?.id) notFound();

  const { data: fr } = await supabase.rpc('get_feedback_request_for_share', {
    p_token: token,
    p_clip_id: clip.id,
  });
  const status = (fr as { status?: string } | null)?.status;
  const feedbackOpen = status === 'open';

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <header className="p-4 border-b border-[#333]">
        <h1 className="text-xl font-bold">{clip.move_name ?? clip.label ?? 'Clip'}</h1>
        <p className="text-gray-400 text-sm mt-1">{session?.name ?? 'Session'}</p>
      </header>

      <main className="p-4 space-y-6 max-w-3xl">
        {clip.upload_status === 'ready' && clip.mux_playback_id ? (
          <ClipPlayer
            playbackId={clip.mux_playback_id}
            thumbnailUrl={`https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg`}
            label={clip.move_name ?? clip.label}
            tags={{
              style: clip.style,
              energy: clip.energy,
              difficulty: clip.difficulty,
            }}
            feedbackOpen={feedbackOpen}
            clipId={clip.id}
            shareToken={token}
          />
        ) : clip.upload_status === 'processing' ? (
          <div className="rounded-lg bg-[#222] aspect-video flex items-center justify-center text-gray-400 text-sm">
            Processing…
          </div>
        ) : (
          <div className="rounded-lg bg-[#222] p-6 text-gray-400 text-center">
            Clip not ready yet
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm">Made with Roam</footer>
    </div>
  );
}

