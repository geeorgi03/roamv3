import { Music } from "lucide-react";

interface WaveformLoadingTrackProps {
  isLoading: boolean;
  progress?: number; // 0-100
}

export default function WaveformLoadingTrack({ 
  isLoading, 
  progress = 0 
}: WaveformLoadingTrackProps) {
  return (
    <div 
      className="h-11 flex items-center"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Track Label */}
      <div 
        className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--surface-raised)' }}
      >
        <Music className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
      </div>

      {/* Waveform Area */}
      <div className="flex-1 relative h-full overflow-hidden">
        {isLoading ? (
          // Loading State
          <>
            {/* Background placeholder bars */}
            <div className="h-full flex items-center gap-0.5 px-2">
              {Array.from({ length: 80 }).map((_, i) => {
                const height = 20 + Math.sin(i * 0.15) * 15;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${height}%`,
                      backgroundColor: 'var(--surface-overlay)',
                      minWidth: '2px',
                    }}
                  />
                );
              })}
            </div>

            {/* Animated sweep overlay */}
            <div 
              className="absolute inset-0 animate-sweep"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(200, 241, 53, 0.15) 50%, transparent 100%)',
                animation: 'sweep 2s ease-in-out infinite',
              }}
            />

            {/* Loading label */}
            <div 
              className="absolute top-1 left-4 px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--surface-overlay)',
                fontSize: '10px',
                color: 'var(--text-disabled)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Importing track…
            </div>

            {/* CSS animation */}
            <style>{`
              @keyframes sweep {
                0% {
                  transform: translateX(-100%);
                }
                100% {
                  transform: translateX(100%);
                }
              }
            `}</style>
          </>
        ) : (
          // Loaded State - actual waveform
          <div className="h-full flex items-center gap-0.5 px-2">
            {Array.from({ length: 80 }).map((_, i) => {
              const height = Math.random() * 60 + 20;
              const isPlayed = i < 32; // Example: 40% played
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isPlayed ? 'var(--waveform-played)' : 'var(--waveform-fill)',
                    minWidth: '2px',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
