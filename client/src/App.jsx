import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import ModeSelect from './components/ModeSelect.jsx';
import KeyboardTips from './components/KeyboardTips.jsx';
<<<<<<< HEAD
import VoiceControls from './components/VoiceControls.jsx';
import ShortcutsHelp from './components/ShortcutsHelp.jsx';
=======
import ShortcutsHelp from './components/ShortcutsHelp.jsx';
import VoiceControls from './components/VoiceControls.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
>>>>>>> feature/multi-mode-resume-jobs
import JobInput from './components/JobInput.jsx';
import Results from './components/Results.jsx';
import ProfileForm from './components/ProfileForm.jsx';
import SavedJobs from './components/SavedJobs.jsx';
import DisplaySettings from './components/DisplaySettings.jsx';
import { ModeProvider, useMode } from './context/ModeContext.jsx';
import { analyzeJobText, analyzeJobFile, analyzeJobUrl, getProfile } from './api.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

// Helper to evaluate profile completeness (fullName filled and at least 1 skill)
function checkProfileComplete(prof) {
  if (!prof) return false;
  const hasName = Boolean(prof.fullName && prof.fullName.trim().length > 0);
  const hasSkill = Array.isArray(prof.skills) && prof.skills.length > 0;
  return hasName && hasSkill;
}

function AppContent() {
<<<<<<< HEAD
  const { mode, isSelectingMode, announce, announcement } = useMode();
=======
  const { hasMode, isSelectingMode, announce, announcement } = useMode();
>>>>>>> feature/multi-mode-resume-jobs

  // Navigation order: "My profile" -> "Analyze a job" -> "Saved jobs"
  const [activeView, setActiveView] = useState('profile');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Profile tracking
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileIncompleteAlert, setProfileIncompleteAlert] = useState(false);

  // State for Keyboard Shortcuts Help dialog
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpOpenerRef = useRef(null);

  // Ref to the view heading for accessible focus management
  const viewHeadingRef = useRef(null);

  // Global keyboard shortcuts: "g p", "g a", "g s", "?", "Esc"
  const { isHelpOpen, openHelp, closeHelp, openerElementRef } = useKeyboardShortcuts({
    onNavigate: (view) => {
      if (view === 'profile') handleNavigateToProfile();
      else if (view === 'analyze') handleNavigateToAnalyze();
      else if (view === 'saved') handleNavigateToSaved();
    }
  });

  // Load profile on initial mount to know completeness
  useEffect(() => {
    async function loadInitialProfile() {
      try {
        const data = await getProfile();
        setCandidateProfile(data);
      } catch (_err) {
        // Silently catch network errors on initial profile load
      }
    }
    loadInitialProfile();
  }, []);

  // Announce and move focus to heading on view change
  useEffect(() => {
    if (!isSelectingMode && viewHeadingRef.current) {
      viewHeadingRef.current.focus();
    }

    const titles = {
      profile: 'My Profile | AccessHire',
      analyze: currentAnalysis
        ? `Analysis: ${currentAnalysis.jobTitle || 'Job'} | AccessHire`
        : 'Analyze a Job | AccessHire',
      saved: 'Saved Jobs | AccessHire'
    };

    if (isSelectingMode) {
      document.title = 'Choose Accessibility Mode | AccessHire';
      announce('Choose how you want to use AccessHire screen');
    } else {
      document.title = titles[activeView] || 'AccessHire';
      const pageNames = {
        profile: 'My profile page',
        analyze: currentAnalysis ? 'Job analysis results page' : 'Analyze a job page',
        saved: 'Saved jobs page'
      };
      announce(`You are on ${pageNames[activeView] || activeView}`);
    }
  }, [activeView, isSelectingMode, currentAnalysis, announce]);

  // Navigate to Analyze view with completeness guard
  const handleNavigateToAnalyze = () => {
    const isComplete = checkProfileComplete(candidateProfile);
    if (!isComplete) {
      setActiveView('profile');
      setProfileIncompleteAlert(true);
      announce('Please complete your profile first. We use it to check how well you match each job.');
    } else {
      setProfileIncompleteAlert(false);
      setActiveView('analyze');
    }
  };

  // Switch to My Profile view
  const handleNavigateToProfile = () => {
    setProfileIncompleteAlert(false);
    setActiveView('profile');
  };

  // Switch to Saved Jobs view (does not require complete profile)
  const handleNavigateToSaved = () => {
    setProfileIncompleteAlert(false);
    setActiveView('saved');
  };

  // Open and close shortcuts help dialog with focus restoration
  const handleOpenHelp = () => {
    helpOpenerRef.current = document.activeElement;
    setIsHelpOpen(true);
  };

  const handleCloseHelp = () => {
    setIsHelpOpen(false);
  };

  // Global keyboard shortcuts hook
  useKeyboardShortcuts({
    onNavigate: (targetView) => {
      if (targetView === 'profile') {
        handleNavigateToProfile();
      } else if (targetView === 'analyze') {
        handleNavigateToAnalyze();
      } else if (targetView === 'saved') {
        handleNavigateToSaved();
      }
    },
    onOpenHelp: handleOpenHelp,
    onCloseHelp: handleCloseHelp,
    isHelpOpen,
    enabled: !isSelectingMode
  });

  // Handler for text analysis
  const handleAnalyzeText = async (text) => {
    setLoading(true);
    setLoadingStatus('Analyzing job description with Gemini...');
    announce('Loading: Analyzing job description with Gemini...');
    try {
      const data = await analyzeJobText(text);
      setCurrentAnalysis(data);
      announce(`Results ready for ${data.jobTitle || 'job position'}`);
    } catch (err) {
      announce(`Analysis failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  // Handler for file upload analysis
  const handleAnalyzeFile = async (file) => {
    setLoading(true);
    setLoadingStatus('Reading file and analyzing requirements...');
    announce('Loading: Reading file and analyzing requirements with Gemini...');
    try {
      const data = await analyzeJobFile(file);
      setCurrentAnalysis(data);
      announce(`Results ready for ${data.jobTitle || 'job position'}`);
    } catch (err) {
      announce(`File analysis failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  // Handler for URL import analysis
  const handleAnalyzeUrl = async (url) => {
    setLoading(true);
    setLoadingStatus('Reading the page and extracting requirements...');
    announce('Loading: Reading web page and extracting requirements with Gemini...');
    try {
      const data = await analyzeJobUrl(url);
      setCurrentAnalysis(data);
      announce(`Results ready for ${data.jobTitle || 'job position'}`);
    } catch (err) {
      announce(`URL import failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  // Switch to Saved Jobs item
  const handleSelectSavedJob = (job) => {
    setCurrentAnalysis(job);
    setActiveView('analyze');
  };

  // Callback when profile is saved
  const handleProfileSaved = (updated) => {
    setCandidateProfile(updated);
    if (checkProfileComplete(updated)) {
      setProfileIncompleteAlert(false);
    }
  };

  return (
    <div className="app-container">
      {/* Skip to Main Content Link (Keyboard/Screen Reader) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

<<<<<<< HEAD
      {/* Screen reader live region for status announcements across the app */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="app-live-announcements"
      >
=======
      {/* Screen reader live region for announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
>>>>>>> feature/multi-mode-resume-jobs
        {announcement}
      </div>

      {/* Accessible Display Settings Panel */}
      <DisplaySettings />

      {/* Site Header Landmark */}
      <Header />

      {/* First Screen: Full-page Mode Selection Screen */}
      {isSelectingMode ? (
        <main id="main-content" aria-label="Accessibility Mode Selection" tabIndex={-1}>
          <ModeSelect
            onCompleted={() => {
              setActiveView('profile');
            }}
          />
        </main>
      ) : (
        <>
<<<<<<< HEAD
          {/* Keyboard Tips when in keyboard navigation mode */}
          {mode === 'keyboard' && (
            <KeyboardTips onOpenShortcutsHelp={handleOpenHelp} />
          )}
=======
          {/* Baseline Mode Notifications */}
          {hasMode('keyboard') && <KeyboardTips onOpenShortcutsHelp={openHelp} />}
          <VoiceControls />
>>>>>>> feature/multi-mode-resume-jobs

          {/* Voice controls when in voice assistance mode */}
          {mode === 'voice' && <VoiceControls />}

          {/* Navigation order: "My profile", "Analyze a job", "Saved jobs" */}
          <nav className="main-nav" role="navigation" aria-label="Main Navigation">
            <ul className="nav-list">
              <li>
                <button
                  type="button"
                  className={`nav-button ${activeView === 'profile' ? 'active' : ''}`}
                  onClick={handleNavigateToProfile}
                  aria-current={activeView === 'profile' ? 'page' : undefined}
                  aria-label="My profile page"
                >
                  My profile
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-button ${activeView === 'analyze' ? 'active' : ''}`}
                  onClick={handleNavigateToAnalyze}
                  aria-current={activeView === 'analyze' ? 'page' : undefined}
                  aria-label="Analyze a job page"
                >
                  Analyze a job
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-button ${activeView === 'saved' ? 'active' : ''}`}
                  onClick={handleNavigateToSaved}
                  aria-current={activeView === 'saved' ? 'page' : undefined}
                  aria-label="Saved jobs page"
                >
                  Saved jobs
                </button>
              </li>
            </ul>
          </nav>

          {/* Main Content Landmark */}
<<<<<<< HEAD
          <main id="main-content" aria-label="Main Content" tabIndex={-1}>
=======
          <main id="main-content" role="main" aria-label="Main Content" tabIndex={-1}>
>>>>>>> feature/multi-mode-resume-jobs
            {/* VIEW 1: MY PROFILE */}
            {activeView === 'profile' && (
              <div>
                <h1
                  ref={viewHeadingRef}
                  tabIndex={-1}
                  className="section-title"
                  style={{ marginBottom: '1.25rem' }}
                >
                  My Profile
                </h1>
                <ProfileForm
                  onProfileSaved={handleProfileSaved}
                  onContinueToAnalyze={() => {
                    setProfileIncompleteAlert(false);
                    setActiveView('analyze');
                  }}
                  profileIncompleteAlert={profileIncompleteAlert}
                />
              </div>
            )}

            {/* VIEW 2: ANALYZE A JOB */}
            {activeView === 'analyze' && (
              <div>
                <h1
                  ref={viewHeadingRef}
                  tabIndex={-1}
                  className="section-title"
                  style={{ marginBottom: '1.25rem' }}
                >
                  {currentAnalysis ? 'Job Analysis & Checklist' : 'Analyze a Job Posting'}
                </h1>

                {currentAnalysis ? (
                  <Results
                    analysis={currentAnalysis}
                    onNewAnalysis={() => setCurrentAnalysis(null)}
                    onEditProfile={() => setActiveView('profile')}
                  />
                ) : (
                  <JobInput
                    onAnalyzeText={handleAnalyzeText}
                    onAnalyzeFile={handleAnalyzeFile}
                    onAnalyzeUrl={handleAnalyzeUrl}
                    loading={loading}
                    loadingStatus={loadingStatus}
                  />
                )}
              </div>
            )}

            {/* VIEW 3: SAVED JOBS */}
            {activeView === 'saved' && (
              <div>
                <h1
                  ref={viewHeadingRef}
                  tabIndex={-1}
                  className="section-title"
                  style={{ marginBottom: '1.25rem' }}
                >
                  Saved Job Analyses
                </h1>
                <SavedJobs onSelectJob={handleSelectSavedJob} />
              </div>
            )}
          </main>

          {/* Keyboard Shortcuts Help Modal Dialog */}
          <ShortcutsHelp
            isOpen={isHelpOpen}
            onClose={handleCloseHelp}
            openerRef={helpOpenerRef}
          />
        </>
      )}

      {/* Footer Landmark */}
      <footer className="site-footer" role="contentinfo" aria-label="Site Footer">
        <p>
          <strong>AccessHire</strong> &bull; Job applications made accessible
        </p>
        <p style={{ marginTop: '0.35rem' }}>
          Accessible Assistive Technology designed with plain English, semantic markup, and WCAG AA standards.
        </p>
      </footer>
      {/* Keyboard Shortcuts Help Dialog (role="dialog", aria-modal, focus trap) */}
      <ShortcutsHelp
        isOpen={isHelpOpen}
        onClose={closeHelp}
        openerRef={openerElementRef}
      />
    </div>
  );
}

export default function App() {
  return (
    <ModeProvider>
      <AppContent />
    </ModeProvider>
  );
}
