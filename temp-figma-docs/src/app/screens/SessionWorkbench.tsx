import { ArrowLeft, Share2, MoreVertical, Music, Pin, Film, Repeat, Play, Rewind, FastForward, Plus, Lightbulb, FileText, PlayCircle, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import QuickTagSheet from "../components/QuickTagSheet";
import { useSessionData } from "../hooks/useSessionData";

export default function SessionWorkbench() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    session, 
    clips, 
    notes, 
    loading, 
    error,
    addClip, 
    addNote,
    deleteClip,
  } = useSessionData(id || null);
  
  const [activeTab, setActiveTab] = useState("Ideas");
  const [showQuickTag, setShowQuickTag] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("0.75");

  // Handle quick tag submit
  const handleQuickTagSubmit = async (data: { type: string; feel?: string }) => {
    try {
      await addClip({
        videoUrl: "", // In a real app, this would be the video file
        startTime: 0, // Current playback position
        type: data.type as 'idea' | 'teaching' | 'full-run',
        feel: data.feel,
        tags: [],
      });
      setShowQuickTag(false);
    } catch (error) {
      console.error("Failed to add clip:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">
          {error || "Session not found"}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "Ideas", icon: Lightbulb, label: "Ideas" },
    { id: "Notes", icon: FileText, label: "Notes" },
    { id: "Review", icon: PlayCircle, label: "Review" },
    { id: "Share", icon: Upload, label: "Share" },
  ];

  const sections = session.sections.length > 0 ? session.sections : [
    { name: "Intro", start: 0, end: 15 },
    { name: "Verse 1", start: 15, end: 42 },
    { name: "Chorus", start: 42, end: 70 },
    { name: "Verse 2", start: 70, end: 100 },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      {/* Header */}
      <div 
        className="h-11 px-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div 
          style={{ 
            fontFamily: 'var(--font-app-title)', 
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--text-primary)'
          }}
        >
          {session.songName} — {session.artist}
        </div>
        <div className="flex items-center gap-3">
          <button>
            <Share2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button>
            <MoreVertical className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Multi-track Timeline Zone */}
      <div 
        className="relative"
        style={{ height: '220px' }}
      >
        {/* Timecode Ruler */}
        <div 
          className="h-6 flex items-center px-4"
          style={{ backgroundColor: 'var(--surface-base)' }}
        >
          {["0:00", "0:15", "0:30", "0:45", "1:00", "1:15"].map((time) => (
            <span 
              key={time}
              className="flex-1 text-center"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '10px',
                color: 'var(--text-disabled)'
              }}
            >
              {time}
            </span>
          ))}
        </div>

        {/* Track 1 - Waveform */}
        <div 
          className="h-11 flex items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Music className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <span 
              style={{ 
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              
            </span>
          </div>
          <div className="flex-1 relative h-full overflow-hidden">
            {/* Waveform visualization */}
            <div className="h-full flex items-center gap-0.5 px-2">
              {Array.from({ length: 80 }).map((_, i) => {
                const height = Math.random() * 60 + 20;
                const isPlayed = i < 32; // 40% played
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
            {/* Section markers */}
            <div className="absolute top-1 left-0 right-0 flex justify-around px-4">
              {sections.map((section) => (
                <div
                  key={section.name}
                  className="px-2 py-0.5 rounded-full text-center"
                  style={{
                    backgroundColor: section.active ? 'rgba(200, 241, 53, 0.2)' : 'var(--surface-overlay)',
                    border: `1px solid ${section.active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    fontSize: '10px',
                    color: section.active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {section.name}
                </div>
              ))}
            </div>
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5"
              style={{ 
                left: '40%',
                backgroundColor: '#ff0000'
              }}
            />
          </div>
        </div>

        {/* Track 2 - Note pins */}
        <div 
          className="h-11 flex items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Pin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="flex-1 relative h-full">
            {/* Note pin dots */}
            {[20, 42, 65].map((pos, i) => {
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
          </div>
        </div>

        {/* Track 3 - Assigned clips */}
        <div 
          className="h-11 flex items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Film className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="flex-1 relative h-full">
            {/* Clip blocks */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-7 flex items-center px-1 rounded"
              style={{
                left: '15%',
                width: '15%',
                backgroundColor: 'var(--surface-overlay)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div 
                className="w-4 h-4 rounded bg-gray-600 flex-shrink-0" 
              />
              <span 
                className="ml-1"
                style={{ 
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Idea 01
              </span>
            </div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-7 flex items-center px-1 rounded"
              style={{
                left: '52%',
                width: '16%',
                backgroundColor: 'var(--surface-overlay)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div 
                className="w-4 h-4 rounded bg-gray-600 flex-shrink-0" 
              />
              <span 
                className="ml-1"
                style={{ 
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Idea 02
              </span>
            </div>
          </div>
        </div>

        {/* Track 4 - Repetition regions */}
        <div 
          className="h-11 flex items-center"
        >
          <div 
            className="w-9 h-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Repeat className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="flex-1 relative h-full">
            {/* Loop region */}
            <button
              onClick={() => navigate(`/session/${id}/repetition/1`)}
              className="absolute top-1/2 -translate-y-1/2 h-6 rounded transition-opacity hover:opacity-80"
              style={{
                left: '42%',
                width: '16%',
                backgroundColor: 'rgba(200, 241, 53, 0.15)',
                borderTop: '2px solid var(--accent-primary)',
                borderBottom: '2px solid var(--accent-primary)',
              }}
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                style={{ 
                  fontSize: '10px',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                chorus drill
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Transport Bar */}
      <div 
        className="h-12 px-4 flex items-center justify-between"
        style={{ 
          backgroundColor: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-4">
          <button>
            <Rewind className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Play className="w-5 h-5" style={{ color: 'var(--surface-base)' }} fill="currentColor" />
            </div>
          </button>
          <button>
            <FastForward className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
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
          {playbackSpeed}×
        </button>

        <div className="flex items-center gap-3">
          <button style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Mirror
          </button>
          <button style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            + Track
          </button>
        </div>
      </div>

      {/* Section Workspace */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span 
              style={{ 
                fontFamily: 'var(--font-app-title)', 
                fontWeight: 600,
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            >
              Chorus
            </span>
            <span 
              className="ml-3"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              0:42 – 1:10
            </span>
          </div>
        </div>

        {/* 2x2 Clip Grid */}
        <div className="grid grid-cols-2 gap-2">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                height: '120px'
              }}
            >
              <div className="w-full h-16 bg-gray-700" />
              <div className="p-2">
                <div 
                  style={{ 
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {clip.name}
                </div>
                <div 
                  className="inline-block mt-1 px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${clip.tagColor}33`,
                    color: clip.tagColor,
                    fontSize: '10px',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {clip.tag}
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty state cards */}
          {[1, 2].map((i) => (
            <button
              key={`empty-${i}`}
              onClick={() => setShowQuickTag(true)}
              className="rounded-lg flex flex-col items-center justify-center transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: `1px dashed var(--border-subtle)`,
                height: '120px'
              }}
            >
              <Plus className="w-6 h-6 mb-1" style={{ color: 'var(--text-disabled)' }} />
              <span 
                style={{ 
                  fontSize: '13px',
                  color: 'var(--text-disabled)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                + Add clip
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div 
        className="h-20 px-4 flex items-center justify-around"
        style={{ 
          backgroundColor: 'var(--surface-base)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === "Review") {
                  navigate(`/session/${id}/review`);
                }
              }}
              className="flex flex-col items-center gap-1"
            >
              <Icon 
                className="w-5 h-5" 
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-disabled)',
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  fontSize: '11px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-disabled)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating Capture Button */}
      <button
        onClick={() => setShowQuickTag(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        <div 
          className="w-6 h-6 rounded-full"
          style={{ 
            border: '2px solid var(--surface-base)',
            backgroundColor: 'transparent'
          }}
        />
      </button>

      <QuickTagSheet 
        isOpen={showQuickTag}
        onClose={() => setShowQuickTag(false)}
        section="Chorus"
        timecode="0:42"
        onSubmit={handleQuickTagSubmit}
      />
    </div>
  );
}