'use client';

import { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import type { ClipComment } from '@roam/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ClipPlayerProps {
  playbackId: string;
  thumbnailUrl: string;
  label: string | null;
  tags: {
    style: string | null;
    energy: string | null;
    difficulty: string | null;
  };
  feedbackOpen?: boolean;
  clipId?: string;
}

export function ClipPlayer({
  playbackId,
  thumbnailUrl,
  label,
  tags,
  feedbackOpen = false,
  clipId,
}: ClipPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const [submittedComments, setSubmittedComments] = useState<ClipComment[]>([]);
  const [thanksShown, setThanksShown] = useState(false);
  const [name, setName] = useState('');
  const [timecodeMs, setTimecodeMs] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const handleUseCurrentTime = () => {
    setTimecodeMs(String(currentTimeMs));
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipId || !text.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          timecode_ms: parseInt(timecodeMs, 10) || 0,
          text: text.trim(),
          commenter_name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      setThanksShown(true);
      setSubmittedComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          clip_id: clipId,
          session_id: '',
          timecode_ms: parseInt(timecodeMs, 10) || 0,
          text: text.trim(),
          commenter_name: name.trim() || null,
          created_at: new Date().toISOString(),
        },
      ]);
      setText('');
      setTimecodeMs('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="rounded-lg overflow-hidden bg-black w-full space-y-4">
      <div className="aspect-video">
        <MuxPlayer
          playbackId={playbackId}
          streamType="on-demand"
          className="w-full h-full"
          onTimeUpdate={(e) => {
            const t = (e.target as HTMLMediaElement)?.currentTime;
            if (typeof t === 'number') setCurrentTimeMs(Math.round(t * 1000));
          }}
        />
      </div>
      {feedbackOpen && clipId && (
        <div className="p-4 bg-[#222] rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Leave Feedback</h3>
          {thanksShown && (
            <p className="text-amber-400 text-sm mb-3">Thanks for your feedback!</p>
          )}
          <form onSubmit={handleSubmitFeedback} className="space-y-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#333] text-white text-sm placeholder-gray-500 border border-[#444]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Timecode (ms)"
                value={timecodeMs}
                onChange={(e) => setTimecodeMs(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#333] text-white text-sm placeholder-gray-500 border border-[#444]"
              />
              <button
                type="button"
                onClick={handleUseCurrentTime}
                className="px-3 py-2 rounded bg-[#444] text-gray-300 text-sm hover:bg-[#555]"
              >
                Use current time
              </button>
            </div>
            <textarea
              placeholder="Your feedback..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 rounded bg-[#333] text-white text-sm placeholder-gray-500 border border-[#444] resize-none"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
          {submittedComments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#333]">
              <p className="text-xs text-gray-400 mb-2">Your feedback:</p>
              <ul className="space-y-2">
                {submittedComments.map((c) => (
                  <li key={c.id} className="text-sm text-gray-300">
                    <span className="font-medium">{c.commenter_name || 'Anonymous'}</span>
                    {c.timecode_ms > 0 && (
                      <span className="text-gray-500 ml-2">
                        @ {Math.floor(c.timecode_ms / 1000)}s
                      </span>
                    )}
                    : {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
