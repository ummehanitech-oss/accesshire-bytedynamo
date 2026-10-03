import React, { useState, useEffect, useRef } from 'react';

/**
 * Scale factors for the four text size options.
 * Applied directly to the CSS variable --font-scale on <html>.
 */
const TEXT_SCALES = {
  smaller: '0.875',
  normal: '1',
  larger: '1.2',
  largest: '1.4'
};

/**
 * DisplaySettings Component
 * Provides high-contrast theme toggle and text size controls in an accessible panel.
 * Available across all modes and views. Persists preferences in localStorage.
 */
export default function DisplaySettings() {
  // Panel open/close state
  const [isOpen, setIsOpen] = useState(false);

  // High contrast theme state (persisted in localStorage key 'accesshire_theme')
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('accesshire_theme') === 'high-contrast';
  });

  // Text size state (persisted in localStorage key 'accesshire_text_size')
  const [textSize, setTextSize] = useState(() => {
    if (typeof window === 'undefined') return 'normal';
    const saved = localStorage.getItem('accesshire_text_size');
    return TEXT_SCALES[saved] ? saved : 'normal';
  });

  const triggerButtonRef = useRef(null);
  const panelRef = useRef(null);

  // Apply theme setting to documentElement and localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isHighContrast) {
      document.documentElement.dataset.theme = 'high-contrast';
      localStorage.setItem('accesshire_theme', 'high-contrast');
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.setItem('accesshire_theme', 'default');
    }
  }, [isHighContrast]);

  // Apply text size scale variable to documentElement and localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const scale = TEXT_SCALES[textSize] || '1';
    document.documentElement.style.setProperty('--font-scale', scale);
    document.documentElement.dataset.textSize = textSize;
    localStorage.setItem('accesshire_text_size', textSize);
  }, [textSize]);

  // Handle keyboard Escape to close the panel and return focus to trigger
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Toggle open state; focus first control when opened
  const handleToggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (!nextOpen) {
      triggerButtonRef.current?.focus();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleToggleTheme = () => {
    setIsHighContrast((prev) => !prev);
  };

  const handleSelectTextSize = (size) => {
    setTextSize(size);
  };

  return (
    <div className="display-settings-wrapper">
      {/* Trigger button */}
      <button
        ref={triggerButtonRef}
        type="button"
        className="display-settings-trigger"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-controls="display-settings-panel-region"
      >
        <span aria-hidden="true">&#9881;</span>
        <span>Display settings</span>
      </button>

      {/* Accessible labelled region for settings */}
      {isOpen && (
        <section
          id="display-settings-panel-region"
          ref={panelRef}
          role="region"
          aria-label="Display settings"
          className="display-settings-panel"
          style={{ width: '100%', marginTop: '0.75rem' }}
        >
          <div className="display-settings-header">
            <h2>Display Settings</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              style={{ minHeight: '36px', padding: '0.35rem 0.85rem', fontSize: '0.9rem' }}
              aria-label="Close display settings panel"
            >
              Close
            </button>
          </div>

          {/* Theme setting section */}
          <div className="display-settings-section">
            <span className="display-settings-label">Color Theme</span>
            <div className="display-settings-button-group">
              <button
                type="button"
                className="display-setting-btn"
                onClick={handleToggleTheme}
                aria-pressed={isHighContrast}
              >
                <span aria-hidden="true">{isHighContrast ? '✓' : '○'}</span>
                <span>
                  High contrast: {isHighContrast ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
            <p className="display-settings-hint">
              Dark background with white/yellow text and strong borders (contrast ratio 7:1 or higher).
            </p>
          </div>

          {/* Text size scaling section */}
          <div className="display-settings-section">
            <span className="display-settings-label">Text Size</span>
            <div
              role="group"
              aria-label="Text size options"
              className="display-settings-button-group"
            >
              {[
                { id: 'smaller', label: 'Smaller' },
                { id: 'normal', label: 'Normal' },
                { id: 'larger', label: 'Larger' },
                { id: 'largest', label: 'Largest' }
              ].map((option) => {
                const isSelected = textSize === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="display-setting-btn"
                    onClick={() => handleSelectTextSize(option.id)}
                    aria-pressed={isSelected}
                  >
                    <span aria-hidden="true">{isSelected ? '✓' : '○'}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="display-settings-hint">
              Changes text size proportionally across all pages. Press Escape to close this panel.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
