import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Session, Clip, MusicTrack, SectionEntry } from '@roam/types';
import { ClipPlayer } from './ClipPlayer';
import { MusicPlayer } from './MusicPlayer';

type SharedMusicTrack = MusicTrack & { mux_playback_id?: string | null };

function formatSectionTime(startMs: number): string {
  const totalSec = Math.floor(startMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function youtubeEmbedUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  try {
    const u = new URL(sourceUrl);
    const v = u.searchParams.get('v') ?? (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null);
    return v ? `https://www.youtube.com/embed/${v}` : null;
  } catch {
    return null;
  }
}

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.rpc('get_shared_session', { p_token: token });
  if (error || data === null) notFound();

  const { session, music_track, clips } = data as {
    session: Session;
    music_track: SharedMusicTrack | null;
    clips: Clip[];
  };

  const sections = (music_track?.sections ?? null) as SectionEntry[] | null;
  const hasUploadComplete =
    music_track?.source_type === 'upload' && music_track?.analysis_status === 'complete';
  const youtubeEmbed = music_track?.source_type === 'youtube'
    ? youtubeEmbedUrl(music_track.source_url)
    : null;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <header className="p-4 border-b border-[#333]">
        <h1 className="text-xl font-bold">{session.name}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date(session.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      <main className="p-4 space-y-6">
        {/* Music */}
        <section>
          {hasUploadComplete && music_track?.mux_playback_id && (
            <>
              <MusicPlayer playbackId={music_track.mux_playback_id} />
              <div className="mt-2 flex flex-wrap gap-2">
                {sections?.map((section, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded bg-[#222] text-gray-300"
                  >
                    {section.label} · {formatSectionTime(section.start_ms)}
                  </span>
                ))}
              </div>
            </>
          )}
          {music_track?.source_type === 'youtube' && youtubeEmbed && (
            <>
              <iframe
                src={youtubeEmbed}
                title="Music"
                className="w-full max-w-2xl aspect-video rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {sections && sections.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {sections.map((section, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-[#222] text-gray-300"
                    >
                      {section.label} · {formatSectionTime(section.start_ms)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {!music_track && (
            <div className="rounded-lg bg-[#222] p-6 text-gray-400 text-center max-w-2xl">
              No music added
            </div>
          )}
        </section>

        {/* Clips grid */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Clips</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {clips.map((clip) =>
              clip.upload_status === 'ready' && clip.mux_playback_id ? (
                <ClipPlayer
                  key={clip.id}
                  playbackId={clip.mux_playback_id}
                  thumbnailUrl={`https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg`}
                  label={clip.move_name ?? clip.label}
                  tags={{
                    style: clip.style,
                    energy: clip.energy,
                    difficulty: clip.difficulty,
                  }}
                />
              ) : clip.upload_status === 'processing' ? (
                <div
                  key={clip.id}
                  className="rounded-lg bg-[#222] aspect-video flex items-center justify-center text-gray-400 text-sm"
                >
                  Processing…
                </div>
              ) : null
            )}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm">
        Made with Roam
      </footer>
    </div>
  );
}
