import { ArrowLeft, Play, SkipBack, SkipForward, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function RepetitionTool() {
  const navigate = useNavigate();
  const [repeatCount, setRepeatCount] = useState("∞");
  const [isPlaying, setIsPlaying] = useState(false);

  const repeatOptions = ["2×", "4×", "8×", "∞"];
  const drillSequence = [
    { name: "chorus drill", color: "var(--track-1)", count: "∞" },
    { name: "bridge entry", color: "var(--track-2)", count: "4×" },
  ];

  const savedRegions = [
    { name: "chorus drill", range: "0:42–0:51", count: "∞", color: "var(--track-1)", active: true },
    { name: "bridge entry", range: "0:51–1:02", count: "4×", color: "var(--track-2)", active: false },
    { name: "verse build", range: "0:28–0:42", count: "8×", color: "var(--track-3)", active: false },
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
            Chorus — Repetition
          </span>
        </button>
        <button 
          style={{ 
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-body)'
          }}
        >
          Done
        </button>
      </div>

      {/* Region Waveform Display */}
      <div 
        className="relative px-4 py-6"
        style={{ height: '180px' }}
      >
        {/* Waveform */}
        <div className="h-32 flex items-end gap-0.5">
          {Array.from({ length: 100 }).map((_, i) => {
            const height = Math.random() * 100 + 20;
            const isInRegion = i >= 30 && i <= 65;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${height}%`,
                  backgroundColor: isInRegion ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  minWidth: '2px',
                }}
              />
            );
          })}
        </div>

        {/* Loop region indicator */}
        <div 
          className="absolute top-6 h-32 pointer-events-none"
          style={{
            left: '30%',
            right: '35%',
            backgroundColor: 'rgba(200, 241, 53, 0.15)',
          }}
        >
          {/* Left handle */}
          <div 
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 12px rgba(200, 241, 53, 0.6)'
            }}
          />
          {/* Right handle */}
          <div 
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 12px rgba(200, 241, 53, 0.6)'
            }}
          />
          {/* Label */}
          <div 
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--surface-base)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)'
            }}
          >
            chorus drill
          </div>
        </div>

        {/* Timecodes */}
        <div className="flex justify-between mt-2 px-4">
          <span 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              color: 'var(--accent-primary)'
            }}
          >
            0:42
          </span>
          <span 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              color: 'var(--accent-primary)'
            }}
          >
            0:51
          </span>
        </div>
      </div>

      {/* Timecode Fine-tune Row */}
      <div 
        className="h-14 px-4 flex items-center justify-center gap-4"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex-1 text-center">
          <div 
            style={{ 
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              marginBottom: '2px'
            }}
          >
            Start
          </div>
          <div 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '16px',
              color: 'var(--text-primary)'
            }}
          >
            0:42.320
          </div>
        </div>
        <div 
          className="w-px h-8"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        />
        <div className="flex-1 text-center">
          <div 
            style={{ 
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              marginBottom: '2px'
            }}
          >
            End
          </div>
          <div 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '16px',
              color: 'var(--text-primary)'
            }}
          >
            0:51.080
          </div>
        </div>
      </div>

      {/* Transport + Loop Controls */}
      <div 
        className="px-4 py-3"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {/* Transport controls */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <button>
            <SkipBack className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Repeat className="w-6 h-6" style={{ color: 'var(--surface-base)' }} />
          </button>
          <button>
            <SkipForward className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Repeat count selector */}
        <div className="flex items-center justify-between">
          <span 
            style={{ 
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Repeat
          </span>
          <div className="flex gap-2">
            {repeatOptions.map((option) => (
              <button
                key={option}
                onClick={() => setRepeatCount(option)}
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: repeatCount === option ? 'var(--accent-primary)' : 'var(--surface-overlay)',
                  border: repeatCount === option ? 'none' : '1px solid var(--border-subtle)',
                  color: repeatCount === option ? 'var(--surface-base)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: repeatCount === option ? 600 : 400,
                  fontFamily: 'var(--font-body)'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drill Sequence Panel */}
      <div 
        className="px-4 py-3"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span 
            style={{ 
              fontFamily: 'var(--font-app-title)', 
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}
          >
            Drill Sequence
          </span>
        </div>

        <div className="space-y-2 mb-3">
          {drillSequence.map((item, index) => (
            <div 
              key={index}
              className="h-10 flex items-center gap-3 px-2"
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: item.color }} />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span 
                className="flex-1"
                style={{ 
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {item.name}
              </span>
              <span 
                style={{ 
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>

        <button 
          className="w-full text-center py-2"
          style={{ 
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--accent-cool)',
            fontFamily: 'var(--font-body)'
          }}
        >
          + Add region
        </button>

        <button 
          className="w-full h-12 rounded-lg mt-3"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--surface-base)',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-body)'
          }}
        >
          Run Sequence
        </button>
      </div>

      {/* Region List */}
      <div className="flex-1 overflow-auto">
        <div 
          className="px-4 py-3"
          style={{ 
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)'
          }}
        >
          Saved Regions
        </div>
        
        {savedRegions.map((region, index) => (
          <div
            key={index}
            className="h-12 px-4 flex items-center gap-3"
            style={{
              backgroundColor: region.active ? 'rgba(200, 241, 53, 0.05)' : 'transparent',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: region.color }}
            />
            <span 
              className="flex-1"
              style={{ 
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {region.name}
            </span>
            <span 
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              {region.range}
            </span>
            <span 
              style={{ 
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {region.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
