import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../api.js';

export const MODES = {
  voice: {
    id: 'voice',
    title: 'Voice assistance mode',
    display: 'Voice assistance',
    description: 'Designed for hands-free and voice-driven workflows.'
  },
  keyboard: {
    id: 'keyboard',
    title: 'Keyboard navigation mode',
    display: 'Keyboard navigation',
    description: 'Enhanced visible focus outlines and keyboard shortcuts for navigating with Tab, Enter, and Space.'
  },
  'screen-reader': {
    id: 'screen-reader',
    title: 'Screen reader friendly mode',
    display: 'Screen reader friendly',
    description: 'Semantic landmarks, polite live regions, and descriptive labels optimized for screen reading software.'
  },
  simplified: {
    id: 'simplified',
    title: 'Simplified visual mode',
    display: 'Simplified visual',
    description: 'Streamlined, low-distraction visual presentation focusing directly on plain language tasks.'
  }
};

const ModeContext = createContext(null);

// Helper to retrieve and migrate initial modes from localStorage
function getInitialModes() {
  if (typeof window === 'undefined') return [];

  // Check new key 'accesshire_modes' (JSON array)
  const savedModesJson = localStorage.getItem('accesshire_modes');
  if (savedModesJson) {
    try {
      const parsed = JSON.parse(savedModesJson);
      if (Array.isArray(parsed)) {
        return parsed.filter(id => Boolean(MODES[id]));
      }
    } catch {
      // Ignore parse failure
    }
  }

  // Check legacy single key 'accesshire_mode'
  const legacyMode = localStorage.getItem('accesshire_mode');
  if (legacyMode && MODES[legacyMode]) {
    const migrated = [legacyMode];
    localStorage.setItem('accesshire_modes', JSON.stringify(migrated));
    localStorage.removeItem('accesshire_mode');
    return migrated;
  }

  return [];
}

export function ModeProvider({ children }) {
  const initialModes = getInitialModes();

  const [modes, setModesState] = useState(initialModes);
  // If no modes are set yet, show the full-page mode screen first
  const [isSelectingMode, setIsSelectingMode] = useState(initialModes.length === 0);
  const [announcement, setAnnouncement] = useState('');

  // Keep document.documentElement.dataset.modes synchronized (stop setting data-mode)
  useEffect(() => {
    // Ensure legacy data-mode is cleaned up
    document.documentElement.removeAttribute('data-mode');

    if (modes.length > 0) {
      document.documentElement.dataset.modes = modes.join(' ');
      localStorage.setItem('accesshire_modes', JSON.stringify(modes));
    } else {
      delete document.documentElement.dataset.modes;
    }
  }, [modes]);

  // Sync with profile if localStorage was empty on initial load
  useEffect(() => {
    async function syncFromProfile() {
      try {
        const profile = await getProfile();
        if (profile) {
          let serverModes = [];
          if (Array.isArray(profile.accessibilityModes) && profile.accessibilityModes.length > 0) {
            serverModes = profile.accessibilityModes.filter(id => Boolean(MODES[id]));
          } else if (profile.accessibilityPreference && MODES[profile.accessibilityPreference]) {
            serverModes = [profile.accessibilityPreference];
          }

          if (serverModes.length > 0) {
            setModesState(serverModes);
            document.documentElement.dataset.modes = serverModes.join(' ');
            document.documentElement.removeAttribute('data-mode');
            localStorage.setItem('accesshire_modes', JSON.stringify(serverModes));
            setIsSelectingMode(false);
          }
        }
      } catch {
        // Silently catch network errors on initial mode sync
      }
    }

    const hasStored = typeof window !== 'undefined' && Boolean(localStorage.getItem('accesshire_modes'));
    if (!hasStored) {
      syncFromProfile();
    }
  }, []);

  // Function to save multi-mode choice (persists to state, localStorage, and PUT /api/profile)
  const chooseModes = async (newModes) => {
    if (!Array.isArray(newModes)) return;
    const validModes = Array.from(new Set(newModes.filter(id => Boolean(MODES[id]))));
    if (validModes.length === 0) return;

    setModesState(validModes);
    document.documentElement.dataset.modes = validModes.join(' ');
    document.documentElement.removeAttribute('data-mode');
    localStorage.setItem('accesshire_modes', JSON.stringify(validModes));
    setIsSelectingMode(false);

    // Save to profile in backend (merges with existing profile)
    try {
      await updateProfile({ accessibilityModes: validModes });
    } catch (err) {
      console.warn('Could not sync modes to server profile:', err.message);
    }
  };

  // Backward-compatibility alias for single mode selection
  const chooseMode = async (singleMode) => {
    if (singleMode) {
      await chooseModes([singleMode]);
    }
  };

  const hasMode = (id) => modes.includes(id);

  const openModeSelect = () => {
    setIsSelectingMode(true);
  };

  // Announce messages in live regions
  const announce = (message) => {
    setAnnouncement(message);
  };

  // List of active mode metadata objects
  const modeInfo = modes.map(id => MODES[id]).filter(Boolean);

  return (
    <ModeContext.Provider
      value={{
        modes,
        hasMode,
        chooseModes,
        chooseMode,
        modeInfo,
        mode: modes[0] || null, // Backward compatibility for legacy readers
        isSelectingMode,
        openModeSelect,
        announce,
        announcement
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
