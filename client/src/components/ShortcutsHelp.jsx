import React, { useEffect, useRef } from 'react';

/**
<<<<<<< HEAD
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
=======
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
>>>>>>> feature/multi-mode-resume-jobs
        onClose();
        return;
      }

<<<<<<< HEAD
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
=======
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
>>>>>>> feature/multi-mode-resume-jobs
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
<<<<<<< HEAD
      // Return focus to the opener element when dialog closes
      if (openerElement && typeof openerElement.focus === 'function') {
        openerElement.focus();
=======
      // Return focus to the opener element
      if (openerRef && openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
>>>>>>> feature/multi-mode-resume-jobs
      }
    };
  }, [isOpen, onClose, openerRef]);

  if (!isOpen) return null;

  return (
    <div
<<<<<<< HEAD
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
=======
      className="shortcuts-modal-overlay"
      onClick={onClose}
>>>>>>> feature/multi-mode-resume-jobs
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
<<<<<<< HEAD
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
=======
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
>>>>>>> feature/multi-mode-resume-jobs
        padding: '1rem'
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
<<<<<<< HEAD
        aria-describedby="shortcuts-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
=======
        aria-describedby="shortcuts-dialog-description"
        className="shortcuts-dialog-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 14px)',
          border: '3px solid var(--color-primary, #1d4ed8)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
>>>>>>> feature/multi-mode-resume-jobs
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
<<<<<<< HEAD
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid var(--color-primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
=======
          padding: '1.75rem 2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
>>>>>>> feature/multi-mode-resume-jobs
          <div>
            <h2
              id="shortcuts-dialog-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
<<<<<<< HEAD
                color: 'var(--color-text-main)',
=======
                color: 'var(--color-text-main, #0f172a)',
>>>>>>> feature/multi-mode-resume-jobs
                margin: 0
              }}
            >
              Keyboard Shortcuts
            </h2>
            <p
<<<<<<< HEAD
              id="shortcuts-dialog-desc"
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
=======
              id="shortcuts-dialog-description"
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted, #334155)',
>>>>>>> feature/multi-mode-resume-jobs
                marginTop: '0.35rem',
                marginBottom: 0
              }}
            >
<<<<<<< HEAD
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
=======
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
>>>>>>> feature/multi-mode-resume-jobs
              marginBottom: '0.75rem'
            }}
          >
            General Controls
          </h3>
<<<<<<< HEAD
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
=======
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
>>>>>>> feature/multi-mode-resume-jobs
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
<<<<<<< HEAD
            aria-label="Done and return to page"
            style={{ minHeight: '38px', padding: '0.5rem 1.25rem' }}
          >
            Got it
=======
            style={{ minHeight: '44px', padding: '0.6rem 1.5rem' }}
          >
            Got it (Esc)
>>>>>>> feature/multi-mode-resume-jobs
          </button>
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

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
>>>>>>> feature/multi-mode-resume-jobs
