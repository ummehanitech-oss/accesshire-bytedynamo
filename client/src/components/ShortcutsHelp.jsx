import React, { useEffect, useRef } from 'react';

/**
 * ShortcutsHelp Component
 * Accessible modal dialog displaying global keyboard shortcuts.
 * Meets WCAG 2.1 dialog standards:
 * - role="dialog" and aria-modal="true"
 * - aria-labelledby and aria-describedby
 * - Complete focus trap (Tab / Shift+Tab cycling)
 * - Esc key listener to close
 * - Restores focus to the opener element on close
 */
export default function ShortcutsHelp({ isOpen, onClose, openerRef }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Move initial focus to the close button inside dialog
    const timer = setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      }
    }, 50);

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          el => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab on first element -> cycle to last element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab on last element -> cycle to first element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to the opener element
      if (openerRef && openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
      }
    };
  }, [isOpen, onClose, openerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        aria-describedby="shortcuts-dialog-description"
        className="shortcuts-dialog-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 14px)',
          border: '3px solid var(--color-primary, #1d4ed8)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem 2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2
              id="shortcuts-dialog-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--color-text-main, #0f172a)',
                margin: 0
              }}
            >
              Keyboard Shortcuts
            </h2>
            <p
              id="shortcuts-dialog-description"
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted, #334155)',
                marginTop: '0.35rem',
                marginBottom: 0
              }}
            >
              Press these key sequences anywhere on the site when you are not typing in a form field.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            style={{ minHeight: '44px', minWidth: '44px', padding: '0.5rem 0.85rem' }}
          >
            ✕ Close
          </button>
        </div>

        <section aria-labelledby="shortcuts-nav-heading" style={{ marginBottom: '1.25rem' }}>
          <h3
            id="shortcuts-nav-heading"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-primary, #1d4ed8)',
              borderBottom: '2px solid var(--color-border, #cbd5e1)',
              paddingBottom: '0.35rem',
              marginBottom: '0.75rem'
            }}
          >
            Quick Navigation (Two-Key Sequences)
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border, #cbd5e1)' }}>
                <th scope="col" style={{ padding: '0.5rem 0.5rem 0.5rem 0', fontWeight: 700 }}>Shortcut</th>
                <th scope="col" style={{ padding: '0.5rem 0', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>g</kbd> then <kbd style={kbdStyle}>p</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Navigate to <strong>My Profile</strong></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>g</kbd> then <kbd style={kbdStyle}>a</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Navigate to <strong>Analyze a job</strong></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>g</kbd> then <kbd style={kbdStyle}>s</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Navigate to <strong>Saved jobs</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section aria-labelledby="shortcuts-general-heading" style={{ marginBottom: '1.5rem' }}>
          <h3
            id="shortcuts-general-heading"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-primary, #1d4ed8)',
              borderBottom: '2px solid var(--color-border, #cbd5e1)',
              paddingBottom: '0.35rem',
              marginBottom: '0.75rem'
            }}
          >
            General Controls
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border, #cbd5e1)' }}>
                <th scope="col" style={{ padding: '0.5rem 0.5rem 0.5rem 0', fontWeight: 700 }}>Shortcut</th>
                <th scope="col" style={{ padding: '0.5rem 0', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>?</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Open this keyboard shortcuts help dialog</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>Esc</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Close any open dialog, menu, or return focus</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>Tab</kbd> / <kbd style={kbdStyle}>Shift + Tab</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Move focus forward / backward between controls</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem 0.5rem 0.65rem 0' }}>
                  <kbd style={kbdStyle}>Enter</kbd> / <kbd style={kbdStyle}>Space</kbd>
                </td>
                <td style={{ padding: '0.65rem 0' }}>Activate focused button, checkbox, or link</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ minHeight: '44px', padding: '0.6rem 1.5rem' }}
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  display: 'inline-block',
  padding: '0.2rem 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  fontFamily: 'monospace',
  lineHeight: 1,
  color: 'var(--color-text-main, #0f172a)',
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
};
