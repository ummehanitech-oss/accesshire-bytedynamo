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
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const key = event.key;

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

        const lowerKey = key.toLowerCase();
        if (lowerKey === 'p') {
          event.preventDefault();
          if (onNavigate) onNavigate('profile');
        } else if (lowerKey === 'a') {
          event.preventDefault();
          if (onNavigate) onNavigate('analyze');
        } else if (lowerKey === 's') {
          event.preventDefault();
          if (onNavigate) onNavigate('saved');
        }
        return;
      }

      // First key in sequence: "g"
      if (key.toLowerCase() === 'g') {
        waitingForGRef.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        // Wait up to 1.5 seconds for the second key
        timerRef.current = setTimeout(() => {
          waitingForGRef.current = false;
        }, 1500);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, isHelpOpen, onNavigate, onOpenHelp, onCloseHelp]);
}

export default useKeyboardShortcuts;
