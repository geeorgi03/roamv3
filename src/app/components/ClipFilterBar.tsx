import { useState } from "react";

interface ClipFilterBarProps {
  typeFilter: string | null;
  feelFilters: string[];
  sectionFilter: string | null;
  unassignedOnly: boolean;
  crossSession: boolean;
  sections: string[];
  onTypeChange: (v: string | null) => void;
  onFeelToggle: (v: string) => void;
  onSectionChange: (v: string | null) => void;
  onUnassignedToggle: () => void;
  onCrossSessionToggle: () => void;
}

export default function ClipFilterBar({
  typeFilter,
  feelFilters,
  sectionFilter,
  unassignedOnly,
  crossSession,
  sections,
  onTypeChange,
  onFeelToggle,
  onSectionChange,
  onUnassignedToggle,
  onCrossSessionToggle,
}: ClipFilterBarProps) {
  const [feelDropdownOpen, setFeelDropdownOpen] = useState(false);

  const typeOptions = [null, 'Idea', 'Phrase', 'Transition', 'Marking', 'Full-out'];
  const feelOptions = ['Heavy', 'Light', 'Vulnerable', 'Sharp', 'Fluid', 'Explosive'];

  const handleTypeClick = () => {
    const currentIndex = typeOptions.indexOf(typeFilter);
    const nextIndex = (currentIndex + 1) % typeOptions.length;
    onTypeChange(typeOptions[nextIndex]);
  };

  const handleSectionClick = () => {
    const allSections = [null, ...sections];
    const currentIndex = allSections.indexOf(sectionFilter);
    const nextIndex = (currentIndex + 1) % allSections.length;
    onSectionChange(allSections[nextIndex]);
  };

  return (
    <>
      <div 
        className="flex items-center gap-2 overflow-x-auto"
        style={{ 
          padding: '12px 16px',
          backgroundColor: 'var(--surface-base)'
        }}
      >
        {/* Type chip */}
        <button
          onClick={handleTypeClick}
          className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: typeFilter 
              ? 'rgba(200,241,53,0.12)' 
              : 'var(--surface-raised)',
            border: typeFilter 
              ? '1px solid var(--accent-primary)' 
              : '1px solid var(--border-subtle)',
            color: typeFilter 
              ? 'var(--accent-primary)' 
              : 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: typeFilter ? 600 : 400,
          }}
        >
          {typeFilter || 'Type'}
        </button>

        {/* Feel chip */}
        <div className="relative">
          <button
            onClick={() => setFeelDropdownOpen(!feelDropdownOpen)}
            className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor: feelFilters.length > 0 
                ? 'rgba(200,241,53,0.12)' 
                : 'var(--surface-raised)',
              border: feelFilters.length > 0 
                ? '1px solid var(--accent-primary)' 
                : '1px solid var(--border-subtle)',
              color: feelFilters.length > 0 
                ? 'var(--accent-primary)' 
                : 'var(--text-secondary)',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              fontWeight: feelFilters.length > 0 ? 600 : 400,
            }}
          >
            {feelFilters.length > 0 ? `Feel (${feelFilters.length})` : 'Feel'}
          </button>

          {/* Feel dropdown */}
          {feelDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setFeelDropdownOpen(false)}
              />
              <div 
                className="absolute top-full mt-1 left-0 z-20 rounded-lg shadow-lg"
                style={{
                  backgroundColor: 'var(--surface-overlay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px',
                  minWidth: '150px'
                }}
              >
                {feelOptions.map((feel) => (
                  <button
                    key={feel}
                    onClick={() => {
                      onFeelToggle(feel);
                      // Don't close dropdown on multi-select
                    }}
                    className="w-full px-3 py-2 rounded text-left flex items-center gap-2"
                    style={{
                      backgroundColor: feelFilters.includes(feel) 
                        ? 'rgba(200,241,53,0.12)' 
                        : 'transparent',
                      fontSize: '12px',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{
                        backgroundColor: feelFilters.includes(feel) 
                          ? 'var(--accent-primary)' 
                          : 'transparent',
                        borderColor: 'var(--accent-primary)',
                      }}
                    />
                    {feel}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section chip */}
        <button
          onClick={handleSectionClick}
          className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: sectionFilter 
              ? 'rgba(200,241,53,0.12)' 
              : 'var(--surface-raised)',
            border: sectionFilter 
              ? '1px solid var(--accent-primary)' 
              : '1px solid var(--border-subtle)',
            color: sectionFilter 
              ? 'var(--accent-primary)' 
              : 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: sectionFilter ? 600 : 400,
          }}
        >
          {sectionFilter || 'Section'}
        </button>

        {/* Unassigned chip */}
        <button
          onClick={onUnassignedToggle}
          className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: unassignedOnly 
              ? 'rgba(200,241,53,0.12)' 
              : 'var(--surface-raised)',
            border: unassignedOnly 
              ? '1px solid var(--accent-primary)' 
              : '1px solid var(--border-subtle)',
            color: unassignedOnly 
              ? 'var(--accent-primary)' 
              : 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: unassignedOnly ? 600 : 400,
          }}
        >
          Unassigned
        </button>

        {/* Cross-session toggle */}
        <button
          onClick={onCrossSessionToggle}
          className="px-3.5 h-9 rounded-full whitespace-nowrap flex-shrink-0 ml-auto"
          style={{
            backgroundColor: crossSession 
              ? 'rgba(200,241,53,0.12)' 
              : 'var(--surface-raised)',
            border: crossSession 
              ? '1px solid var(--accent-primary)' 
              : '1px solid var(--border-subtle)',
            color: crossSession 
              ? 'var(--accent-primary)' 
              : 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: crossSession ? 600 : 400,
          }}
        >
          {crossSession ? 'All sessions' : 'This session'}
        </button>
      </div>
    </>
  );
}
