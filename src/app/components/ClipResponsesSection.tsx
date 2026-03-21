import { useState, useEffect } from "react";
import { apiRequest } from "../../utils/supabase";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";

interface ClipResponsesSectionProps {
  clipId: string;
  sessionId: string;
  responseCount?: number;
}

export default function ClipResponsesSection({
  clipId,
  sessionId,
  responseCount,
}: ClipResponsesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadResponses();
    }
  }, [isOpen, hasLoaded]);

  const loadResponses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest(`/sessions/${sessionId}/clips/${clipId}/responses`);
      
      if (!res.ok) {
        throw new Error('Failed to load responses');
      }
      
      const data = await res.json();
      setResponses(data.responses || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Couldn\'t load responses');
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayCount = responseCount ?? (hasLoaded ? responses.length : undefined);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="w-full text-left px-2 py-1.5 rounded transition-opacity hover:opacity-80"
          style={{
            fontSize: '11px',
            color: 'var(--text-disabled)',
            fontFamily: 'var(--font-body)',
            backgroundColor: 'transparent',
            border: 'none',
          }}
        >
          <div className="flex items-center justify-between">
            <span>
              {displayCount !== undefined ? `${displayCount} response${displayCount !== 1 ? 's' : ''}` : 'Responses'}
            </span>
            <div 
              className="w-3 h-3 transition-transform"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div 
          className="rounded-lg mt-1"
          style={{
            backgroundColor: 'var(--surface-overlay)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-raised)' }} />
              ))}
            </div>
          ) : error ? (
            <div className="p-3 text-center" style={{ fontSize: '12px', color: 'var(--text-disabled)', fontFamily: 'var(--font-body)' }}>
              {error}
            </div>
          ) : responses.length === 0 ? (
            <div className="p-3 text-center" style={{ fontSize: '12px', color: 'var(--text-disabled)', fontFamily: 'var(--font-body)' }}>
              No responses yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {responses.map((response, index) => (
                <div 
                  key={response.id || index}
                  className="p-2 rounded"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="mb-1">{response.text || response.comment}</div>
                  {response.created_at && (
                    <div style={{ fontSize: '10px', color: 'var(--text-disabled)' }}>
                      {new Date(response.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
