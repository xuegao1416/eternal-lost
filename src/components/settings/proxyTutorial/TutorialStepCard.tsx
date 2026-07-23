import { ChevronRight, ChevronDown } from 'lucide-react';
import type { TutorialStep } from './data';
import { StepContent } from './StepContent';

export function TutorialStepCard({
  step,
  index,
  isExpanded,
  onToggle,
  copiedCode,
  onCopyCode,
}: {
  step: TutorialStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  copiedCode: boolean;
  onCopyCode: () => void;
}) {
  const Icon = step.icon;

  return (
    <div
      style={{
        background: 'var(--paper-light)',
        border: `1px solid ${isExpanded ? 'var(--stamp-red)' : 'var(--border)'}`,
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Step header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ink)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: isExpanded ? 'var(--stamp-red)' : 'var(--paper-warm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <Icon size={16} color={isExpanded ? 'var(--paper-light)' : 'var(--ink-muted)'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
            步骤 {index + 1}
          </div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: '500' }}>
            {step.title}
          </div>
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Step content */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StepContent step={step} copiedCode={copiedCode} onCopyCode={onCopyCode} />
          </div>
        </div>
      )}
    </div>
  );
}
