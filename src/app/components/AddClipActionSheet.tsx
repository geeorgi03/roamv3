import { Camera, Inbox } from "lucide-react";
import { useInbox } from "../hooks/useInbox";

interface AddClipActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  onRecordNow: () => void;
  onPickFromInbox: () => void;
}

export default function AddClipActionSheet({
  isOpen,
  onClose,
  sectionName,
  onRecordNow,
  onPickFromInbox,
}: AddClipActionSheetProps) {
  const { clips } = useInbox();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* Title */}
        <div className="px-5 pt-4 pb-2">
          <p
            style={{
              fontFamily: "var(--font-app-title)",
              fontWeight: 600,
              fontSize: "16px",
              color: "var(--text-primary)",
            }}
          >
            Add to {sectionName}
          </p>
        </div>

        {/* Options */}
        <div className="px-4 pb-10 space-y-2 pt-2">
          {/* Record now */}
          <button
            onClick={onRecordNow}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <Camera className="w-5 h-5" style={{ color: "var(--surface-base)" }} />
            </div>
            <div className="text-left">
              <div style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>
                Record now
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                Open camera
              </div>
            </div>
          </button>

          {/* Pick from Inbox */}
          <button
            onClick={onPickFromInbox}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--surface-base)" }}
            >
              <Inbox className="w-5 h-5" style={{ color: "var(--accent-cool)" }} />
            </div>
            <div className="text-left">
              <div style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>
                Pick from Inbox
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-disabled)" }}>
                {clips.length > 0 ? `${clips.length} clip${clips.length !== 1 ? "s" : ""} waiting` : "No clips yet"}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
