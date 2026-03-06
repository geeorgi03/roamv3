'use client';

import MuxPlayer from '@mux/mux-player-react';

export function MusicPlayer({ playbackId }: { playbackId: string }) {
  return (
    <div className="rounded-lg overflow-hidden bg-black aspect-video max-w-2xl">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        className="w-full h-full"
      />
    </div>
  );
}
