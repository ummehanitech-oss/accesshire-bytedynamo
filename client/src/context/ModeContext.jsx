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

export function ModeProvider({ children }) {
  // Initialize mode from localStorage for instant loading
  const savedLocalMode = typeof window !== 'undefined' ? localStorage.getItem('accesshire_mode') : null;
  const initialMode = savedLocalMode && MODES[savedLocalMode] ? savedLocalMode : null;

  const [mode, setModeState] = useState(initialMode);
  // If no mode is set yet, show the full-page mode screen first
  const [isSelectingMode, setIsSelectingMode] = useState(!initialMode);
  const [announcement, setAnnouncement] = useState('');

  // Keep document.documentElement.dataset.mode synchronized
  useEffect(() => {
    if (mode) {
      document.documentElement.dataset.mode = mode;
      localStorage.setItem('accesshire_mode', mode);
    } else {
      delete document.documentElement.dataset.mode;
    }
  }, [mode]);

  // Sync with profile if localStorage was empty
  useEffect(() => {
    async function syncFromProfile() {
      try {
        const profile = await getProfile();
        if (profile && profile.accessibilityPreference && MODES[profile.accessibilityPreference]) {
          const pref = profile.accessibilityPreference;
          // If no mode was chosen in local storage, use the profile's saved preference
          if (!savedLocalMode) {
            setModeState(pref);
            document.documentElement.dataset.mode = pref;
            localStorage.setItem('accesshire_mode', pref);
            setIsSelectingMode(false);
          }
        }
      } catch (err) {
        // Silently catch network errors on initial mode sync
      }
    }

    if (!savedLocalMode) {
      syncFromProfile();
    }
  }, [savedLocalMode]);

  // Function to save mode choice (persists to state, localStorage, and PUT /api/profile)
  const chooseMode = async (newMode) => {
    if (!MODES[newMode]) return;

    setModeState(newMode);
    document.documentElement.dataset.mode = newMode;
    localStorage.setItem('accesshire_mode', newMode);
    setIsSelectingMode(false);

    // Save to profile in backend (merges with existing profile)
    try {
      await updateProfile({ accessibilityPreference: newMode });
    } catch (err) {
      console.warn('Could not sync mode to server profile:', err.message);
    }
  };

  const openModeSelect = () => {
    setIsSelectingMode(true);
  };

  // Announce messages for screen-reader mode
  const announce = (message) => {
    setAnnouncement(message);
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        modeInfo: mode ? MODES[mode] : null,
        isSelectingMode,
        chooseMode,
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
