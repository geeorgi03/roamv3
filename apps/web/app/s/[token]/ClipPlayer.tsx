'use client';

import { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

export interface ClipPlayerProps {
  playbackId: string;
  thumbnailUrl: string;
  label: string | null;
  tags: {
    style: string | null;
    energy: string | null;
    difficulty: string | null;
  };
}

export function ClipPlayer({ playbackId, thumbnailUrl, label, tags }: ClipPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-lg overflow-hidden bg-[#222] text-left w-full aspect-video flex flex-col"
      >
        <img
          src={thumbnailUrl}
          alt={label ?? 'Clip'}
          className="w-full flex-1 object-cover"
        />
        <div className="p-2">
          {label && <p className="text-white font-medium truncate">{label}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {[tags.style, tags.energy, tags.difficulty]
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t!}
                  className="text-xs px-2 py-0.5 rounded bg-[#333] text-gray-300"
                >
                  {t}
                </span>
              ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-black aspect-video w-full">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        className="w-full h-full"
      />
    </div>
  );
}
