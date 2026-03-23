import { useState, useEffect } from "react";
import { Video } from "lucide-react";

interface QuickTagSheetProps {
  isOpen: boolean;
  onClose: () => void;
  section?: string;
  timecode?: string;
  onSubmit?: (data: { type_tag: string | null; feel_tags: string[]; notes?: string }) => void;
  saveError?: string | null;
  onRetry?: () => void;
  onSaveToInbox?: () => void;
  recentTypes?: string[];
}

export default function QuickTagSheet({ isOpen, onClose, section = "Chorus", timecode = "0:42", onSubmit, saveError, onRetry, onSaveToInbox, recentTypes = [] }: QuickTagSheetProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFeels, setSelectedFeels] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setSelectedFeels([]);
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseOrder = ["Idea", "Phrase", "Transition", "Marking", "Full-out"];
  const typeOptions = recentTypes.length > 0 
    ? [recentTypes[0], ...baseOrder.filter(t => t !== recentTypes[0])]
    : baseOrder;
  const feelOptions = ["Heavy", "Light", "Vulnerable", "Sharp", "Fluid", "Explosive"];

  const handleSave = () => {
    if (onSubmit) {
      onSubmit({ type_tag: selectedType, feel_tags: selectedFeels, notes: note || undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Background overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(13, 13, 15, 0.6)' }}
      />
      
      {/* Sheet */}
      <div 
        className="relative w-full rounded-t-2xl"
        style={{
          backgroundColor: 'var(--surface-overlay)',
          height: '480px',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div 
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--text-disabled)' }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-5 h-5" style={{ color: 'var(--accent-cool)' }} />
            <div>
              <div 
                style={{ 
                  fontFamily: 'var(--font-app-title)', 
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--text-primary)'
                }}
              >
                New idea
              </div>
              <div 
                style={{ 
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {section} · {timecode}
              </div>
            </div>
          </div>

          {/* Type Section */}
          <div className="mb-6">
            <div 
              className="mb-3 uppercase tracking-wide"
              style={{ 
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Type
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedType(option)}
                  className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: selectedType === option ? 'var(--accent-primary)' : 'var(--surface-raised)',
                    border: selectedType === option ? 'none' : '1px solid var(--border-subtle)',
                    color: selectedType === option ? 'var(--surface-base)' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: selectedType === option ? 600 : 400,
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Feel Section */}
          <div className="mb-6">
            <div 
              className="mb-3 uppercase tracking-wide"
              style={{ 
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Feel
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {feelOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (selectedFeels.includes(option)) {
                      setSelectedFeels(selectedFeels.filter(f => f !== option));
                    } else {
                      setSelectedFeels([...selectedFeels, option]);
                    }
                  }}
                  className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: selectedFeels.includes(option) ? 'var(--accent-warm)' : 'var(--surface-raised)',
                    border: selectedFeels.includes(option) ? 'none' : '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: selectedFeels.includes(option) ? 600 : 400,
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Note Section */}
          <div className="mb-6">
            <div 
              className="mb-3 uppercase tracking-wide"
              style={{ 
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Note
            </div>
            <input
              type="text"
              placeholder="optional — one thing to remember"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-4 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--font-body)'
              }}
            />
          </div>

          {/* Recent Tags */}
          <div className="mb-6">
            <div 
              className="mb-2"
              style={{ 
                fontSize: '11px',
                color: 'var(--text-disabled)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Recent
            </div>
            <div className="flex gap-2">
              {["Phrase · Heavy", "Idea · Sharp", "Full-out · Fluid"].map((tag) => (
                <button
                  key={tag}
                  className="px-2 h-7 rounded"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Save Error Banner */}
          {saveError && (
            <div className="mb-4 p-3 rounded-lg flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                {saveError}
              </span>
              <div className="flex items-center gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--surface-base)',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    Retry
                  </button>
                )}
                {onSaveToInbox && (
                  <button
                    onClick={onSaveToInbox}
                    className="px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-body)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    Save to Inbox instead
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3">
            {/* Skip Button */}
            <button
              onClick={() => {
                if (onSubmit) {
                  onSubmit({ type_tag: null, feel_tags: [], notes: undefined });
                }
              }}
              className="flex-1 rounded-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                height: '52px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              Skip
            </button>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--surface-base)',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                height: '52px'
              }}
            >
              <span>✓</span>
              Save to {section} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}