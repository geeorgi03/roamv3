'use client';

export function MusicPlayer({ src }: { src: string }) {
  return (
    <div className="rounded-lg bg-[#1a1a1a] p-4 max-w-2xl">
      <audio controls src={src} className="w-full" />
    </div>
  );
}
