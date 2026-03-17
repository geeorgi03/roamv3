import { Circle, Music, ChevronRight, Inbox } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSessions } from "../hooks/useSessions";
import { useInbox } from "../hooks/useInbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import MusicAttachmentSheet from "../components/MusicAttachmentSheet";

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { sessions, createSession, loading } = useSessions();
  const { clips: inboxClips } = useInbox();
  const inboxCount = inboxClips.length;
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    songName: "",
    artist: "",
    tempo: 120,
  });

  const handleCreateSession = async () => {
    try {
      const session = await createSession({
        ...newSessionData,
        duration: 240, // default 4 minutes
        sections: [],
        mirrorEnabled: false,
      });
      
      setShowNewSessionDialog(false);
      setNewSessionData({ songName: "", artist: "", tempo: 120 });
      navigate(`/session/${session.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleRecordClick = () => {
    navigate(`/capture`);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      {/* Header */}
      <div className="h-11 flex items-center justify-center">
        <h1 
          className="uppercase tracking-[0.1em]"
          style={{ 
            fontFamily: 'var(--font-app-title)', 
            fontWeight: 700,
            fontSize: '20px',
            color: 'var(--text-primary)'
          }}
        >
          roam
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        {/* Tagline */}
        <p 
          className="italic text-center mb-10"
          style={{ 
            fontSize: '13px',
            color: 'var(--text-disabled)',
            fontFamily: 'var(--font-body)'
          }}
        >
          remember what you make
        </p>

        {sessions.length === 0 ? (
          /* Two Door Buttons (new users) */
          <div className="w-full max-w-md space-y-10">
            {/* Door 1 - Record */}
            <button
              onClick={handleRecordClick}
              className="w-full h-[120px] flex items-center px-6 rounded-2xl transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '0.5px solid var(--border-subtle)',
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Circle 
                  className="w-6 h-6" 
                  style={{ color: 'var(--surface-base)' }}
                  fill="currentColor"
                />
              </div>
              <div className="flex-1 text-left ml-6">
                <div 
                  style={{ 
                    fontFamily: 'var(--font-app-title)', 
                    fontWeight: 700,
                    fontSize: '18px',
                    color: 'var(--text-primary)'
                  }}
                >
                  Record
                </div>
                <div 
                  className="mt-1"
                  style={{ 
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  capture something now
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 flex-shrink-0" 
                style={{ color: 'var(--text-disabled)' }}
              />
            </button>

            {/* Door 2 - Start a session */}
            <button
              onClick={() => setShowNewSessionDialog(true)}
              className="w-full h-[120px] flex items-center px-6 rounded-2xl transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '0.5px solid var(--border-subtle)',
              }}
            >
              <Music 
                className="w-9 h-9 flex-shrink-0" 
                style={{ color: 'var(--text-secondary)' }}
              />
              <div className="flex-1 text-left ml-6">
                <div 
                  style={{ 
                    fontFamily: 'var(--font-app-title)', 
                    fontWeight: 700,
                    fontSize: '18px',
                    color: 'var(--text-primary)'
                  }}
                >
                  Start a session
                </div>
                <div 
                  className="mt-1"
                  style={{ 
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  I have a song to work with
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 flex-shrink-0" 
                style={{ color: 'var(--text-disabled)' }}
              />
            </button>
          </div>
        ) : (
          /* Returning users: sessions list + capture FAB */
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div
                style={{
                  fontFamily: "var(--font-app-title)",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.02em",
                }}
              >
                Your sessions
              </div>
              <button
                onClick={() => setShowNewSessionDialog(true)}
                className="transition-opacity hover:opacity-80"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--accent-primary)",
                }}
              >
                + New session
              </button>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--surface-raised)",
                border: "0.5px solid var(--border-subtle)",
              }}
            >
              {(loading ? [] : sessions).map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/session/${s.id}`)}
                  className="w-full px-5 h-16 flex items-center justify-between transition-opacity hover:opacity-80"
                  style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
                >
                  <div className="text-left min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {s.songName || "Untitled session"}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--text-disabled)",
                      }}
                    >
                      {s.artist || ""}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />
                </button>
              ))}
              {loading && (
                <div className="px-5 py-6" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-disabled)" }}>
                  Loading sessions…
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inbox Indicator */}
        {inboxCount > 0 && (
          <button 
            onClick={() => navigate("/inbox")}
            className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--surface-overlay)',
              border: '0.5px solid var(--border-subtle)',
            }}
          >
            <Inbox 
              className="w-3.5 h-3.5" 
              style={{ color: 'var(--accent-cool)' }}
            />
            <span 
              style={{ 
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {inboxCount} ideas waiting
            </span>
          </button>
        )}
      </div>

      {/* Bottom Area */}
      <div className="pb-8 flex flex-col items-center gap-2">
        {user && (
          <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            {user.email}
          </p>
        )}
        <button 
          onClick={() => signOut()}
          className="transition-opacity hover:opacity-80"
          style={{ 
            fontSize: '13px',
            color: 'var(--text-disabled)',
            fontFamily: 'var(--font-body)'
          }}
        >
          Sign out
        </button>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent className="bg-[var(--surface-raised)] border-[var(--border-subtle)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-syne">
              New Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="songName" className="text-[var(--text-primary)]">
                Song Name
              </Label>
              <Input
                id="songName"
                value={newSessionData.songName}
                onChange={(e) =>
                  setNewSessionData({ ...newSessionData, songName: e.target.value })
                }
                className="mt-1 bg-[var(--surface-base)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                placeholder="Enter song name"
              />
            </div>
            <div>
              <Label htmlFor="artist" className="text-[var(--text-primary)]">
                Artist
              </Label>
              <Input
                id="artist"
                value={newSessionData.artist}
                onChange={(e) =>
                  setNewSessionData({ ...newSessionData, artist: e.target.value })
                }
                className="mt-1 bg-[var(--surface-base)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                placeholder="Enter artist name"
              />
            </div>
            <div>
              <Label htmlFor="tempo" className="text-[var(--text-primary)]">
                Tempo (BPM)
              </Label>
              <Input
                id="tempo"
                type="number"
                value={newSessionData.tempo}
                onChange={(e) =>
                  setNewSessionData({
                    ...newSessionData,
                    tempo: parseInt(e.target.value) || 120,
                  })
                }
                className="mt-1 bg-[var(--surface-base)] border-[var(--border-subtle)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewSessionDialog(false)}
              className="border-[var(--border-subtle)] text-[var(--text-secondary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!newSessionData.songName}
              className="bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/90"
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Persistent Capture FAB (returning users) */}
      {sessions.length > 0 && (
        <button
          onClick={() => navigate("/capture")}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{
              border: "2px solid var(--surface-base)",
              backgroundColor: "transparent",
            }}
          />
        </button>
      )}
    </div>
  );
}