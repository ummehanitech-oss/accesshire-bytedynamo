import React, { useState } from 'react';

/**
 * Collapsible Keyboard Navigation Tips panel shown in Keyboard Navigation Mode.
 * Lists global navigation shortcuts ("g p", "g a", "g s", "?", Esc) and basic keyboard commands.
 */
export default function KeyboardTips({ onOpenShortcutsHelp }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className="keyboard-tips-panel"
      role="complementary"
      aria-label="Keyboard navigation assistance"
      style={{
        background: '#ffffff',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
          Keyboard Navigation Tips
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onOpenShortcutsHelp && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenShortcutsHelp}
              style={{ minHeight: '36px', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Open keyboard shortcuts help dialog"
            >
              Shortcuts list (?)
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsOpen(prev => !prev)}
            aria-expanded={isOpen}
            aria-controls="keyboard-tips-list"
            style={{ minHeight: '36px', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          >
            {isOpen ? 'Hide Tips' : 'Show Tips'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="keyboard-tips-list">
          <ul
            style={{
              marginTop: '0.75rem',
              paddingLeft: '1.25rem',
              fontSize: '0.925rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6
            }}
          >
            <li><strong>g then p:</strong> Go to My Profile page (when not typing).</li>
            <li><strong>g then a:</strong> Go to Analyze a Job page (when not typing).</li>
            <li><strong>g then s:</strong> Go to Saved Jobs page (when not typing).</li>
            <li><strong>?:</strong> Open full keyboard shortcuts help dialog.</li>
            <li><strong>Tab / Shift + Tab:</strong> Move focus forward and backward between interactive elements.</li>
            <li><strong>Enter / Space:</strong> Activate buttons, links, and toggle checkboxes.</li>
            <li><strong>Esc:</strong> Close open modal dialogs or dismiss tips.</li>
          </ul>
        </div>
      )}
    </aside>
  );
}
