import React from 'react';

/**
 * Isolated notice shown when Voice assistance or Simplified visual mode is active.
 * Informs the user that the full mode experience is in progress.
 */
export default function ModeNotice({ modeTitle }) {
  return (
    <div
      className="alert-box info"
      role="status"
      aria-live="polite"
      style={{ marginBottom: '1.5rem' }}
    >
      <span aria-hidden="true">&#8505;</span>
      <div>
        <strong>{modeTitle || 'Active Mode'}:</strong> This mode's full experience is being added.
      </div>
    </div>
  );
}
