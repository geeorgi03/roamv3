import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Pencil, ArrowUpRight, Type, CheckSquare, Columns, Share2, Film } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { useSessionData } from "../hooks/useSessionData";

export default function ReviewMode() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const { clips, loading, error } = useSessionData(sessionId || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(4);
  const [totalTime] = useState(12);
  const [activeTool, setActiveTool] = useState("draw");
  const [speed, setSpeed] = useState("0.5");

  const annotations = [
    { timecode: "0:04", text: "right arm too low on the 3", color: "var(--accent-cool)" },
    { timecode: "0:07", text: "check spacing front row", color: "var(--accent-warm)" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-base)' }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)" }}>
          Loading clips…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-8" style={{ backgroundColor: 'var(--surface-base)' }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--accent-warm)", textAlign: "center" }}>
          {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-base)' }}>
        <div className="h-11 px-4 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontFamily: 'var(--font-app-title)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              Review
            </span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <Film className="w-10 h-10" style={{ color: "var(--text-disabled)" }} />
          <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "16px", color: "var(--text-secondary)", textAlign: "center" }}>
            No clips to review
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)", textAlign: "center", lineHeight: "1.6" }}>
            Record some clips in your session first, then come back here to review and annotate them.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2.5 rounded-lg"
            style={{
              backgroundColor: "var(--accent-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--surface-base)",
            }}
          >
            Back to session
          </button>
        </div>
      </div>
    );
  }

  const tools = [
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "point", icon: ArrowUpRight, label: "Point" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      {/* Header */}
      <div className="h-11 px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <span 
            style={{ 
              fontFamily: 'var(--font-app-title)', 
              fontWeight: 700,
              fontSize: '16px',
              color: 'var(--text-primary)'
            }}
          >
            Chorus — Review
          </span>
        </button>
        <button 
          style={{ 
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--accent-cool)',
            fontFamily: 'var(--font-body)'
          }}
        >
          Export Notes
        </button>
      </div>

      {/* Video Player */}
      <div 
        className="relative bg-black"
        style={{ height: '180px' }}
      >
        {/* Video placeholder */}
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Play className="w-8 h-8 text-white" fill="white" />
          </div>
        </div>

        {/* Drawing tools overlay - top right */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {tools.map(({ id, icon: Icon }) => {
            const isActive = activeTool === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                className="w-9 h-9 rounded flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(30, 30, 35, 0.8)',
                }}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
              </button>
            );
          })}
        </div>

        {/* Timecode badge - bottom left */}
        <div 
          className="absolute bottom-2 left-2 px-2 py-1 rounded"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-primary)'
          }}
        >
          0:0{currentTime} / 0:{totalTime}
        </div>
      </div>

      {/* Scrub Bar */}
      <div 
        className="h-11 px-4 flex items-center gap-3"
        style={{ backgroundColor: 'var(--surface-raised)' }}
      >
        <span 
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '10px',
            color: 'var(--text-disabled)'
          }}
        >
          0:00
        </span>
        
        <div className="flex-1 relative h-1 rounded-full" style={{ backgroundColor: 'var(--border-subtle)' }}>
          {/* Played portion */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ 
              width: '33%',
              backgroundColor: 'var(--accent-primary)'
            }}
          />
          
          {/* Annotation dots */}
          {[12, 33, 60].map((pos, i) => {
            const colors = ['var(--accent-cool)', 'var(--accent-primary)', 'var(--accent-warm)'];
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{
                  left: `${pos}%`,
                  backgroundColor: colors[i],
                }}
              />
            );
          })}
          
          {/* Playhead handle */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
            style={{
              left: '33%',
              backgroundColor: 'var(--accent-primary)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        <span 
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '10px',
            color: 'var(--text-disabled)'
          }}
        >
          0:{totalTime}
        </span>
      </div>

      {/* Frame Controls Row */}
      <div 
        className="h-12 px-4 flex items-center justify-between"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <button>
          <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
        </button>
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" style={{ color: 'var(--surface-base)' }} fill="currentColor" />
          ) : (
            <Play className="w-5 h-5" style={{ color: 'var(--surface-base)' }} fill="currentColor" />
          )}
        </button>
        
        <button>
          <ChevronRight className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <button
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--surface-overlay)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)'
          }}
        >
          {speed}×
        </button>

        <button
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(200, 241, 53, 0.15)',
            border: '1px solid var(--accent-primary)',
            fontSize: '12px',
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-body)'
          }}
        >
          A–B
        </button>
      </div>

      {/* Annotation Panel */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <span 
            style={{ 
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)'
            }}
          >
            At this moment
          </span>
          <span 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              color: 'var(--accent-cool)'
            }}
          >
            0:04
          </span>
        </div>

        <div className="space-y-1 mb-4">
          {annotations.map((annotation, index) => (
            <div
              key={index}
              className="rounded-lg p-3 flex items-start gap-3"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderLeft: `3px solid ${annotation.color}`
              }}
            >
              <Pencil className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: annotation.color }} />
              <div className="flex-1">
                <p 
                  style={{ 
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {annotation.text}
                </p>
              </div>
              <span 
                className="flex-shrink-0"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '10px',
                  color: 'var(--text-secondary)'
                }}
              >
                {annotation.timecode}
              </span>
            </div>
          ))}
        </div>

        <button 
          className="pl-3"
          style={{ 
            fontSize: '13px',
            color: 'var(--accent-cool)',
            fontFamily: 'var(--font-body)'
          }}
        >
          + Add note at 0:04
        </button>
      </div>

      {/* Bottom Tool Bar */}
      <div 
        className="h-15 px-4 flex items-center justify-around"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <button className="flex flex-col items-center gap-1 py-2">
          <div className="relative">
            <CheckSquare className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <div 
              className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                color: 'var(--accent-warm)',
                fontSize: '9px',
                fontFamily: 'var(--font-body)'
              }}
            >
              2/8
            </div>
          </div>
          <span 
            style={{ 
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Checklist
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 py-2">
          <Columns className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <span 
            style={{ 
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Compare
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 py-2">
          <Share2 className="w-5 h-5" style={{ color: 'var(--accent-cool)' }} />
          <span 
            style={{ 
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent-cool)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Export
          </span>
        </button>
      </div>
    </div>
  );
}
