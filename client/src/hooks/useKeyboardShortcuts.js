<<<<<<< HEAD
import { useEffect, useRef } from 'react';

/**
 * useKeyboardShortcuts hook
 *
 * Provides global keyboard shortcuts for AccessHire:
 * - "g" then "p": Navigate to "My profile"
 * - "g" then "a": Navigate to "Analyze a job"
 * - "g" then "s": Navigate to "Saved jobs"
 * - "?": Open the keyboard shortcuts help dialog
 * - "Escape": Close the help dialog if it is open
 *
 * Rules:
 * - Shortcuts are active only when the user is NOT typing in an input,
 *   textarea, select element, or contentEditable area.
 * - For two-key sequences ("g" then another key), the second key must
 *   be pressed within 1.5 seconds.
 */
export function useKeyboardShortcuts({
  onNavigate,
  onOpenHelp,
  onCloseHelp,
  isHelpOpen,
  enabled = true
}) {
  const waitingForGRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event) {
      // 1. If the help dialog is open, Escape should close it
      if (isHelpOpen && event.key === 'Escape') {
        event.preventDefault();
        if (onCloseHelp) {
          onCloseHelp();
        }
        return;
      }

      // 2. Ignore shortcuts when user is typing inside an input field
      const target = event.target;
      const tagName = target?.tagName;
      const isTyping =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if (isTyping) {
        return;
      }

      // 3. Ignore combinations using modifier keys (Ctrl, Alt, Meta)
=======
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
>>>>>>> feature/multi-mode-resume-jobs
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const key = event.key;

<<<<<<< HEAD
      // 4. Question mark "?" opens the help dialog
      if (key === '?') {
        event.preventDefault();
        waitingForGRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        if (onOpenHelp) {
          onOpenHelp();
        }
        return;
      }

      // 5. Two-key sequence: "g" followed by "p", "a", or "s"
      if (waitingForGRef.current) {
        waitingForGRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
=======
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
>>>>>>> feature/multi-mode-resume-jobs

        const lowerKey = key.toLowerCase();
        if (lowerKey === 'p') {
          event.preventDefault();
<<<<<<< HEAD
          if (onNavigate) onNavigate('profile');
        } else if (lowerKey === 'a') {
          event.preventDefault();
          if (onNavigate) onNavigate('analyze');
        } else if (lowerKey === 's') {
          event.preventDefault();
          if (onNavigate) onNavigate('saved');
        }
        return;
=======
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
>>>>>>> feature/multi-mode-resume-jobs
      }

      // First key in sequence: "g"
      if (key.toLowerCase() === 'g') {
<<<<<<< HEAD
        waitingForGRef.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        // Wait up to 1.5 seconds for the second key
        timerRef.current = setTimeout(() => {
          waitingForGRef.current = false;
        }, 1500);
=======
        isGPendingRef.current = true;
        clearTimeout(gTimeoutRef.current);
        // Give the user 1200ms to press the second key
        gTimeoutRef.current = setTimeout(() => {
          isGPendingRef.current = false;
        }, 1200);
>>>>>>> feature/multi-mode-resume-jobs
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
<<<<<<< HEAD
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, isHelpOpen, onNavigate, onOpenHelp, onCloseHelp]);
}

export default useKeyboardShortcuts;
=======
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
>>>>>>> feature/multi-mode-resume-jobs
