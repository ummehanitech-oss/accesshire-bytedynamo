import React, { useEffect, useRef } from 'react';

/**
 * ShortcutsHelp component
 *
 * An accessible modal dialog that displays keyboard shortcuts.
 * Features:
 * - role="dialog" with aria-modal="true" and aria-labelledby.
 * - Focus trap: keeps Tab and Shift+Tab cycles inside the dialog while open.
 * - Focus restoration: returns focus to the opener element when closed.
 * - Esc key listener to dismiss the dialog.
 */
export default function ShortcutsHelp({ isOpen, onClose, openerRef }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus trap and Esc key management
  useEffect(() => {
    if (!isOpen) return;

    const openerElement = openerRef && openerRef.current;

    // Move initial focus to the close button inside dialog
    const timer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 20);

    // Keep Tab navigation trapped inside the modal dialog
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      if (!dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab on first element loops back to last element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab on last element loops forward to first element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to the opener element when dialog closes
      if (openerElement && typeof openerElement.focus === 'function') {
        openerElement.focus();
      }
    };
  }, [isOpen, onClose, openerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        aria-describedby="shortcuts-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid var(--color-primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h2
              id="shortcuts-dialog-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                margin: 0
              }}
            >
              Keyboard Shortcuts
            </h2>
            <p
              id="shortcuts-dialog-desc"
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.35rem',
                marginBottom: 0
              }}
            >
              Press these keys anytime you are not typing in a form field.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog (Esc)"
            style={{
              minHeight: '36px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.9rem',
              fontWeight: 700
            }}
          >
            Close (Esc)
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.75rem'
            }}
          >
            Page Navigation
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 1.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Go to <strong>My profile</strong>
              </span>
              <span>
                <kbd className="key-badge">g</kbd> then <kbd className="key-badge">p</kbd>
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Go to <strong>Analyze a job</strong>
              </span>
              <span>
                <kbd className="key-badge">g</kbd> then <kbd className="key-badge">a</kbd>
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Go to <strong>Saved jobs</strong>
              </span>
              <span>
                <kbd className="key-badge">g</kbd> then <kbd className="key-badge">s</kbd>
              </span>
            </li>
          </ul>

          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.75rem'
            }}
          >
            General Controls
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 1.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Open this keyboard shortcuts help
              </span>
              <kbd className="key-badge">?</kbd>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Close dialogs or dismiss tips
              </span>
              <kbd className="key-badge">Esc</kbd>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Move to next interactive element
              </span>
              <kbd className="key-badge">Tab</kbd>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Move to previous interactive element
              </span>
              <span>
                <kbd className="key-badge">Shift</kbd> + <kbd className="key-badge">Tab</kbd>
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Activate buttons & toggle checkboxes
              </span>
              <span>
                <kbd className="key-badge">Enter</kbd> / <kbd className="key-badge">Space</kbd>
              </span>
            </li>
          </ul>
        </div>

        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            aria-label="Done and return to page"
            style={{ minHeight: '38px', padding: '0.5rem 1.25rem' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
