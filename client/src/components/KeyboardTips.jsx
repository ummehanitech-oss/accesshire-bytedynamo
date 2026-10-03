import React, { useState } from 'react';

/**
 * Small collapsible Keyboard Tips panel shown in Keyboard Navigation Mode.
 */
export default function KeyboardTips() {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
          Keyboard Navigation Tips
        </h2>
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

      {isOpen && (
        <ul
          id="keyboard-tips-list"
          style={{
            marginTop: '0.75rem',
            paddingLeft: '1.25rem',
            fontSize: '0.925rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5
          }}
        >
          <li><strong>Tab:</strong> Move focus forward to the next button, link, or input field.</li>
          <li><strong>Shift + Tab:</strong> Move focus backward to the previous element.</li>
          <li><strong>Enter / Space:</strong> Activate buttons, select radio choices, and toggle checkboxes.</li>
          <li><strong>Arrow keys:</strong> Move selection within radio buttons.</li>
          <li><strong>Esc:</strong> Collapse menus or dismiss tips.</li>
        </ul>
      )}
    </aside>
  );
}
