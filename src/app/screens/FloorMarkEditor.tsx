import { ArrowLeft, MoreVertical, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { useSessionData } from "../hooks/useSessionData";

interface DancerToken {
  id: string;
  initials: string;
  name: string;
  color: string;
  x: number;
  y: number;
  direction: number;
}

export default function FloorMarkEditor() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const { session, loading, error } = useSessionData(sessionId || null);
  const [selectedToken, setSelectedToken] = useState<string | null>("BL");
  const [activeTab, setActiveTab] = useState("marks");
  const [currentMark] = useState(2);
  const [totalMarks] = useState(4);

  const dancers: DancerToken[] = [
    { id: "AY", initials: "AY", name: "Aya", color: "var(--track-1)", x: 35, y: 25, direction: 0 },
    { id: "BL", initials: "BL", name: "Blake", color: "var(--track-2)", x: 50, y: 25, direction: 0 },
    { id: "CH", initials: "CH", name: "Charlie", color: "var(--track-3)", x: 65, y: 25, direction: 45 },
    { id: "DJ", initials: "DJ", name: "DJ", color: "var(--formation-purple)", x: 42, y: 45, direction: 0 },
    { id: "EV", initials: "EV", name: "Eva", color: "var(--formation-pink)", x: 50, y: 45, direction: 0 },
    { id: "FN", initials: "FN", name: "Finn", color: "var(--formation-blue)", x: 68, y: 65, direction: 315 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0C' }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)" }}>
          Loading formation…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-8" style={{ backgroundColor: '#0A0A0C' }}>
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

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A0A0C' }}>
        <div className="h-11 px-4 flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <Users className="w-10 h-10" style={{ color: "var(--text-disabled)" }} />
          <p style={{ fontFamily: "var(--font-app-title)", fontWeight: 600, fontSize: "16px", color: "var(--text-secondary)", textAlign: "center" }}>
            Session not found
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2.5 rounded-lg"
            style={{
              backgroundColor: "var(--accent-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--surface-base)",
            }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "marks", icon: "◎", label: "Marks" },
    { id: "paths", icon: "↗", label: "Paths" },
    { id: "clip", icon: "🎬", label: "Clip" },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0A0A0C' }}
    >
      {/* Header */}
      <div className="h-11 px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <button>
          <MoreVertical className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Stage Floor */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-md" style={{ aspectRatio: '3/4' }}>
          {/* Stage boundary */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{ border: '1px solid var(--surface-overlay)' }}
          >
            {/* BACKSTAGE label */}
            <div 
              className="absolute -top-6 left-1/2 -translate-x-1/2 uppercase tracking-[3px]"
              style={{ 
                fontSize: '11px',
                color: 'var(--border-subtle)',
                fontFamily: 'var(--font-body)'
              }}
            >
              BACKSTAGE
            </div>

            {/* AUDIENCE label */}
            <div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 uppercase tracking-[3px]"
              style={{ 
                fontSize: '11px',
                color: 'var(--border-subtle)',
                fontFamily: 'var(--font-body)'
              }}
            >
              AUDIENCE
            </div>

            {/* Dot grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {Array.from({ length: 12 }).map((_, row) => 
                Array.from({ length: 9 }).map((_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={`${(col + 1) * 10}%`}
                    cy={`${(row + 1) * 8}%`}
                    r="1"
                    fill="var(--surface-overlay)"
                  />
                ))
              )}
            </svg>

            {/* Dancer tokens */}
            {dancers.map((dancer) => {
              const isSelected = selectedToken === dancer.id;
              return (
                <div key={dancer.id} className="absolute" style={{ left: `${dancer.x}%`, top: `${dancer.y}%` }}>
                  {/* Selection ring */}
                  {isSelected && (
                    <div 
                      className="absolute -inset-1 rounded-full"
                      style={{ 
                        border: '2px solid white',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                  
                  {/* Token */}
                  <button
                    onClick={() => setSelectedToken(dancer.id)}
                    className="relative w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{ 
                      backgroundColor: dancer.color,
                    }}
                  >
                    <span 
                      style={{ 
                        fontSize: '11px',
                        fontWeight: 700,
                        color: dancer.color === 'var(--track-1)' || dancer.color === 'var(--track-2)' || dancer.color === 'var(--formation-blue)' || dancer.color === 'var(--formation-pink)' 
                          ? 'var(--surface-base)' 
                          : 'var(--text-primary)',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      {dancer.initials}
                    </span>
                    
                    {/* Direction arrow */}
                    <div 
                      className="absolute w-8 h-3"
                      style={{ 
                        top: '-12px',
                        left: '50%',
                        transform: `translateX(-50%) rotate(${dancer.direction}deg)`,
                        transformOrigin: 'center bottom'
                      }}
                    >
                      <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3"
                        style={{ backgroundColor: dancer.color }}
                      />
                      <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '3px solid transparent',
                          borderRight: '3px solid transparent',
                          borderBottom: `5px solid ${dancer.color}`,
                        }}
                      />
                    </div>
                  </button>

                  {/* Name label for selected token */}
                  {isSelected && (
                    <div 
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--surface-overlay)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      {dancer.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="px-4 py-3"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)',
          height: '80px'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          {/* Mark navigation */}
          <div className="flex items-center gap-2">
            <div>
              <div 
                style={{ 
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Chorus · 0:42
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button>
                  <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <span 
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                >
                  {currentMark} / {totalMarks}
                </span>
                <button>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{
                    backgroundColor: isActive ? 'rgba(200, 241, 53, 0.15)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-primary)' : 'none',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Animate button */}
          <button
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(200, 241, 53, 0.15)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)'
            }}
          >
            Animate →
          </button>
        </div>
      </div>
    </div>
  );
}