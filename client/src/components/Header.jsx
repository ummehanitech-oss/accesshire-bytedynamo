import React from 'react';
import { useMode } from '../context/ModeContext.jsx';

export default function Header() {
  const { modeInfo, openModeSelect } = useMode();

  const activeNames = modeInfo && modeInfo.length > 0
    ? modeInfo.map((m) => m.display).join(', ')
    : '';

  return (
    <header className="site-header" role="banner" aria-label="AccessHire Header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span className="site-badge">
          Job applications made accessible
        </span>

        {activeNames && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {modeInfo.length === 1 ? `Mode: ${activeNames}` : `Modes: ${activeNames}`}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={openModeSelect}
              style={{ minHeight: '34px', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              aria-label={`Change current accessibility modes. Active: ${activeNames}`}
            >
              Change mode
            </button>
          </div>
        )}
      </div>

      <div className="site-title">AccessHire</div>
      <p className="site-description">
        An accessible job application assistant designed to break down complicated job postings into
        plain English, match your skills, and create a clear step-by-step checklist.
      </p>
    </header>
  );
}
