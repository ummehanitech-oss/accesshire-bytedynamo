import React, { useState, useEffect, useRef } from 'react';
import { useMode, MODES } from '../context/ModeContext.jsx';

export default function ModeSelect({ onCompleted }) {
  const { mode, chooseMode } = useMode();
  const [selected, setSelected] = useState(mode || '');
  const h1Ref = useRef(null);

  // Move focus to <h1> when this full-page screen appears
  useEffect(() => {
    if (h1Ref.current) {
      h1Ref.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;

    chooseMode(selected);
    if (onCompleted) {
      onCompleted(selected);
    }
  };

  return (
    <div className="mode-select-page">
      <div className="card-section" style={{ maxWidth: '720px', margin: '2rem auto' }}>
        <h1
          ref={h1Ref}
          tabIndex={-1}
          className="section-title"
          style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}
        >
          Choose how you want to use AccessHire
        </h1>
        <p className="section-subtitle" style={{ fontSize: '1.05rem', marginBottom: '1.75rem' }}>
          Select the mode that best matches how you navigate and interact with web pages. You can change this at any time from the header.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '2px solid var(--color-border)' }}>
            <legend style={{ fontWeight: 700, padding: '0 0.5rem' }}>
              Select an Accessibility Mode
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {Object.values(MODES).map((item) => {
                const inputId = `mode-option-${item.id}`;
                const descId = `mode-desc-${item.id}`;
                const isChecked = selected === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: `2px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: isChecked ? 'var(--color-primary-light)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease'
                    }}
                    onClick={() => setSelected(item.id)}
                  >
                    <input
                      type="radio"
                      id={inputId}
                      name="accessibilityModeSelection"
                      value={item.id}
                      checked={isChecked}
                      onChange={(e) => setSelected(e.target.value)}
                      aria-describedby={descId}
                      style={{
                        width: '1.35rem',
                        height: '1.35rem',
                        marginTop: '0.2rem',
                        accentColor: 'var(--color-primary)',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor={inputId}
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: 'var(--color-text-main)',
                          cursor: 'pointer',
                          marginBottom: '0.25rem'
                        }}
                      >
                        {item.title}
                      </label>
                      <p
                        id={descId}
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.45
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selected}
              aria-describedby={!selected ? 'mode-disabled-explanation' : undefined}
              style={{ minWidth: '180px', fontSize: '1.05rem', padding: '0.85rem 1.75rem' }}
            >
              Continue
            </button>

            {!selected && (
              <p
                id="mode-disabled-explanation"
                className="form-help"
                style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}
              >
                The Continue button is disabled until you choose one of the four modes above.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
