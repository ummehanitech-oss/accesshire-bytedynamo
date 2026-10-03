import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Checks whether the user is currently typing in an editable field.
 * When typing, global keyboard shortcuts should not trigger.
 */
function isEditableTarget(target) {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toUpperCase() : '';
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
}

/**
 * Custom hook to handle global keyboard navigation shortcuts:
 * - "g" then "p": Navigate to My Profile
 * - "g" then "a": Navigate to Analyze a job
 * - "g" then "s": Navigate to Saved jobs
 * - "?": Open keyboard shortcuts help dialog
 * - "Esc": Close shortcuts help dialog (handled both here and in the dialog component)
 * 
 * @param {Object} options
 * @param {Function} options.onNavigate - Callback invoked with ('profile' | 'analyze' | 'saved')
 * @returns {{
 *   isHelpOpen: boolean,
 *   openHelp: () => void,
 *   closeHelp: () => void,
 *   openerElementRef: React.MutableRefObject<HTMLElement | null>
 * }}
 */
export function useKeyboardShortcuts({ onNavigate }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const openerElementRef = useRef(null);
  const isGPendingRef = useRef(false);
  const gTimeoutRef = useRef(null);
  const onNavigateRef = useRef(onNavigate);

  // Keep callback reference updated across renders
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  const openHelp = useCallback(() => {
    // Record current active element to return focus when dialog closes
    openerElementRef.current = document.activeElement;
    setIsHelpOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
    // Return focus to the opener element if it exists in DOM
    if (openerElementRef.current && typeof openerElementRef.current.focus === 'function') {
      openerElementRef.current.focus();
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      // Do nothing if user is typing inside an input, textarea, select, or contenteditable
      if (isEditableTarget(event.target)) {
        return;
      }

      // Ignore modifier keys like Ctrl, Alt, Meta
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const key = event.key;

      // Handle "?" to open shortcuts dialog
      if (key === '?') {
        event.preventDefault();
        openHelp();
        return;
      }

      // Handle "Escape" to close shortcuts dialog
      if (key === 'Escape' && isHelpOpen) {
        event.preventDefault();
        closeHelp();
        return;
      }

      // If "g" was pressed, check for second navigation key
      if (isGPendingRef.current) {
        clearTimeout(gTimeoutRef.current);
        isGPendingRef.current = false;

        const lowerKey = key.toLowerCase();
        if (lowerKey === 'p') {
          event.preventDefault();
          if (onNavigateRef.current) onNavigateRef.current('profile');
          return;
        }
        if (lowerKey === 'a') {
          event.preventDefault();
          if (onNavigateRef.current) onNavigateRef.current('analyze');
          return;
        }
        if (lowerKey === 's') {
          event.preventDefault();
          if (onNavigateRef.current) onNavigateRef.current('saved');
          return;
        }
      }

      // First key in sequence: "g"
      if (key.toLowerCase() === 'g') {
        isGPendingRef.current = true;
        clearTimeout(gTimeoutRef.current);
        // Give the user 1200ms to press the second key
        gTimeoutRef.current = setTimeout(() => {
          isGPendingRef.current = false;
        }, 1200);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeoutRef.current);
    };
  }, [isHelpOpen, openHelp, closeHelp]);

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
    openerElementRef
  };
}
