import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import ModeSelect from './components/ModeSelect.jsx';
import KeyboardTips from './components/KeyboardTips.jsx';
import ModeNotice from './components/ModeNotice.jsx';
import JobInput from './components/JobInput.jsx';
import Results from './components/Results.jsx';
import ProfileForm from './components/ProfileForm.jsx';
import SavedJobs from './components/SavedJobs.jsx';
import { ModeProvider, useMode } from './context/ModeContext.jsx';
import { analyzeJobText, analyzeJobFile, analyzeJobUrl, getProfile } from './api.js';

// Helper to evaluate profile completeness (fullName filled and at least 1 skill)
function checkProfileComplete(prof) {
  if (!prof) return false;
  const hasName = Boolean(prof.fullName && prof.fullName.trim().length > 0);
  const hasSkill = Array.isArray(prof.skills) && prof.skills.length > 0;
  return hasName && hasSkill;
}

function AppContent() {
  const { mode, modeInfo, isSelectingMode, announce, announcement } = useMode();

  // Navigation order: "My profile" -> "Analyze a job" -> "Saved jobs"
  const [activeView, setActiveView] = useState('profile');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Profile tracking
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileIncompleteAlert, setProfileIncompleteAlert] = useState(false);

  // Ref to the view heading for accessible focus management
  const viewHeadingRef = useRef(null);

  // Load profile on initial mount to know completeness
  useEffect(() => {
    async function loadInitialProfile() {
      try {
        const data = await getProfile();
        setCandidateProfile(data);
      } catch (err) {
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
  }, [activeView, isSelectingMode, currentAnalysis]);

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

  // Handler for text analysis
  const handleAnalyzeText = async (text) => {
    setLoading(true);
    setLoadingStatus('Analyzing job description with Gemini...');
    announce('Analyzing job description');
    try {
      const data = await analyzeJobText(text);
      setCurrentAnalysis(data);
      announce(`Analysis ready for ${data.jobTitle || 'job position'}`);
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
    announce('Reading uploaded file');
    try {
      const data = await analyzeJobFile(file);
      setCurrentAnalysis(data);
      announce(`Analysis ready for ${data.jobTitle || 'job position'}`);
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
    announce('Reading job web page');
    try {
      const data = await analyzeJobUrl(url);
      setCurrentAnalysis(data);
      announce(`Analysis ready for ${data.jobTitle || 'job position'}`);
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

      {/* Screen reader live region for announcements */}
      {mode === 'screen-reader' && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      )}

      {/* Site Header */}
      <Header />

      {/* First Screen: Full-page Mode Selection Screen */}
      {isSelectingMode ? (
        <main id="main-content" tabIndex={-1}>
          <ModeSelect
            onCompleted={() => {
              setActiveView('profile');
            }}
          />
        </main>
      ) : (
        <>
          {/* Baseline Mode Notifications */}
          {mode === 'keyboard' && <KeyboardTips />}
          {(mode === 'voice' || mode === 'simplified') && (
            <ModeNotice modeTitle={modeInfo ? modeInfo.title : 'Selected Mode'} />
          )}

          {/* Navigation order: "My profile", "Analyze a job", "Saved jobs" */}
          <nav className="main-nav" aria-label="Main Navigation">
            <ul className="nav-list">
              <li>
                <button
                  type="button"
                  className={`nav-button ${activeView === 'profile' ? 'active' : ''}`}
                  onClick={handleNavigateToProfile}
                  aria-current={activeView === 'profile' ? 'page' : undefined}
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
                >
                  Saved jobs
                </button>
              </li>
            </ul>
          </nav>

          {/* Main Content Landmark */}
          <main id="main-content" tabIndex={-1}>
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
        </>
      )}

      {/* Footer Landmark */}
      <footer className="site-footer" role="contentinfo">
        <p>
          <strong>AccessHire</strong> &bull; Job applications made accessible
        </p>
        <p style={{ marginTop: '0.35rem' }}>
          Accessible Assistive Technology designed with plain English, semantic markup, and WCAG AA standards.
        </p>
      </footer>
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
