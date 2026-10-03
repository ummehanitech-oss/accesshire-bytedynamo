import React, { useState } from 'react';

/**
 * KeyboardTips component
 *
 * A collapsible assistance panel shown in Keyboard Navigation Mode.
 * Lists the main keyboard navigation keys and global shortcut sequences.
 */
export default function KeyboardTips({ onOpenShortcutsHelp }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className="keyboard-tips-panel"
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
              aria-label="Open keyboard shortcuts help dialog (?)"
              style={{ minHeight: '34px', padding: '0.2rem 0.65rem', fontSize: '0.85rem' }}
            >
              All Shortcuts (?)
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="keyboard-tips-list"
            aria-label={isOpen ? 'Hide keyboard navigation tips' : 'Show keyboard navigation tips'}
            style={{ minHeight: '34px', padding: '0.2rem 0.65rem', fontSize: '0.85rem' }}
          >
            {isOpen ? 'Hide Tips' : 'Show Tips'}
          </button>
        </div>
      </div>

      {isOpen && (
        <ul
          id="keyboard-tips-list"
          style={{
            marginTop: '0.75rem',
            paddingLeft: '1.25rem',
            fontSize: '0.925rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6
          }}
        >
          <li>
            <strong>Tab / Shift + Tab:</strong> Move focus forward / backward between links, buttons, and fields.
          </li>
          <li>
            <strong>Enter / Space:</strong> Activate focused buttons and toggle checkboxes.
          </li>
          <li>
            <strong><kbd className="key-badge">g</kbd> then <kbd className="key-badge">p</kbd>:</strong> Jump directly to My Profile.
          </li>
          <li>
            <strong><kbd className="key-badge">g</kbd> then <kbd className="key-badge">a</kbd>:</strong> Jump directly to Analyze a Job.
          </li>
          <li>
            <strong><kbd className="key-badge">g</kbd> then <kbd className="key-badge">s</kbd>:</strong> Jump directly to Saved Jobs.
          </li>
          <li>
            <strong><kbd className="key-badge">?</kbd>:</strong> Open the keyboard shortcuts help dialog.
          </li>
          <li>
            <strong>Esc:</strong> Close the help dialog or dismiss open menus.
          </li>
        </ul>
      )}
    </aside>
  );
}
