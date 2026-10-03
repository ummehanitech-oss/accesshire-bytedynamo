import React, { useState, useEffect, useRef } from 'react';
import { useMode } from '../context/ModeContext.jsx';
import {
  speak,
  stopSpeaking,
  isSpeechSynthesisSupported
} from '../voice/speechSynthesis.js';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported
} from '../voice/speechRecognition.js';
import {
  VOICE_COMMANDS,
  matchVoiceCommand
} from '../voice/voiceCommands.js';
import {
  navigateToView,
  getJobSummaryText,
  getCurrentGuidedStepInfo,
  advanceToNextStep,
  returnToPreviousStep,
  toggleCurrentStepCompletion
} from '../voice/voiceDomActions.js';
import '../voice/voice.css';

/**
 * VoiceControls Component
 * Provides complete voice assistance functionality:
 * 1. Speech synthesis output ("Read summary", "Read steps", "Read current step", "Stop")
 * 2. Voice command recognition (English, started by "Start listening" button)
 * 3. Accessible live status region (role="status")
 * 4. Error messages for unsupported browsers or blocked microphones
 * 5. Visible commands help list and vendor privacy notice
 * 6. Read Aloud toggle (Default ON without screen-reader, OFF with screen-reader)
 * 
 * Plain English comments throughout.
 */
export default function VoiceControls() {
  const { hasMode } = useMode();
  const isScreenReaderActive = hasMode('screen-reader');

  // Read aloud toggle state:
  // Default: ON if screen-reader is not selected, OFF if it is.
  // Persist user's choice in localStorage ('accesshire_readaloud': 'on' | 'off').
  // Explicit saved choice wins if present; otherwise follows screen-reader mode.
  const [readAloudOverride, setReadAloudOverride] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accesshire_readaloud');
      if (saved === 'on') return true;
      if (saved === 'off') return false;
    }
    return null;
  });

  const readAloud = readAloudOverride !== null ? readAloudOverride : !isScreenReaderActive;

  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [lastCommandRun, setLastCommandRun] = useState('');
  const [statusMessage, setStatusMessage] = useState('Microphone idle. Click "Start listening" to speak.');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelpList, setShowHelpList] = useState(true);
  const [showTurnOnPrompt, setShowTurnOnPrompt] = useState(false);

  // References
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const handleTranscriptRef = useRef(null);

  // Check browser capabilities
  const hasRecognitionSupport = isSpeechRecognitionSupported();
  const hasSynthesisSupport = isSpeechSynthesisSupported();

  // Keep isSpeakingRef synchronized
  useEffect(() => {
    isSpeakingRef.current = isSpeakingState;
  }, [isSpeakingState]);

  // Clean up speech and microphone on unmount or mode switch
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handler: Toggle Read Aloud explicitly
  const handleToggleReadAloud = () => {
    const next = !readAloud;
    setReadAloudOverride(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accesshire_readaloud', next ? 'on' : 'off');
    }
    if (!next) {
      stopSpeaking();
      setIsSpeakingState(false);
      setStatusMessage('Read aloud turned off. Spoken speech is muted.');
    } else {
      setStatusMessage('Read aloud turned on.');
      setShowTurnOnPrompt(false);
    }
  };

  const handleTurnOnReadAloud = () => {
    setReadAloudOverride(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accesshire_readaloud', 'on');
    }
    setStatusMessage('Read aloud turned on.');
    setShowTurnOnPrompt(false);
  };

  // Handler: Stop all audio
  const handleStopAll = () => {
    stopSpeaking();
    setIsSpeakingState(false);
    setStatusMessage('Speech stopped.');
    setLastCommandRun('Stop speech');
  };

  // Central Helper: Route every speech-synthesis call through here to check readAloud toggle
  const speakWithStatus = (text, commandName) => {
    if (!text || !text.trim()) return;

    if (commandName) {
      setLastCommandRun(commandName);
    }

    // Suppress speech if Read Aloud is OFF
    if (!readAloud) {
      return;
    }

    if (!hasSynthesisSupport) {
      setErrorMessage('Speech output is not supported by your browser.');
      return;
    }

    speak(text, {
      onStart: () => {
        setIsSpeakingState(true);
      },
      onEnd: () => {
        setIsSpeakingState(false);
      },
      onError: (err) => {
        setIsSpeakingState(false);
        setErrorMessage(err);
      }
    });
  };

  // Handler: Read Plain English Summary
  const handleReadSummary = () => {
    if (!readAloud) {
      setStatusMessage('Read aloud is off. Turn it on, or use your screen reader.');
      setShowTurnOnPrompt(true);
      setLastCommandRun('Read summary');
      return;
    }

    setShowTurnOnPrompt(false);
    const summary = getJobSummaryText();
    if (summary) {
      setStatusMessage('Reading plain English job summary aloud.');
      speakWithStatus(`Plain English Job Summary: ${summary}`, 'Read summary');
    } else {
      const msg = 'No job summary is currently available. Please analyze a job first.';
      setStatusMessage(msg);
      speakWithStatus(msg, 'Read summary');
    }
  };

  // Handler: Read the current guided application step
  const handleReadCurrentStep = () => {
    if (!readAloud) {
      setStatusMessage('Read aloud is off. Turn it on, or use your screen reader.');
      setShowTurnOnPrompt(true);
      setLastCommandRun('Read current step');
      return;
    }

    setShowTurnOnPrompt(false);
    const stepInfo = getCurrentGuidedStepInfo();
    if (stepInfo.exists) {
      const statusText = stepInfo.isDone ? 'Marked as completed.' : 'Not completed yet.';
      const speech = `${stepInfo.indicator || 'Current step'}: ${stepInfo.title}. ${stepInfo.detail}. Status: ${statusText}`;
      setStatusMessage(`Reading ${stepInfo.indicator || 'current step'}.`);
      speakWithStatus(speech, 'Read current step');
    } else {
      const msg = 'No active application step is on screen. Please navigate to an analyzed job.';
      setStatusMessage(msg);
      speakWithStatus(msg, 'Read current step');
    }
  };

  // Handler: Read all application steps
  const handleReadSteps = () => {
    if (!readAloud) {
      setStatusMessage('Read aloud is off. Turn it on, or use your screen reader.');
      setShowTurnOnPrompt(true);
      setLastCommandRun('Read steps');
      return;
    }

    setShowTurnOnPrompt(false);
    // Check if checklist view button is available to ensure all steps can be read
    const fullChecklistBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Full Checklist View')
    );

    if (fullChecklistBtn) {
      fullChecklistBtn.click();
    }

    setTimeout(() => {
      const checklistItems = document.querySelectorAll('li:has(input[id^="full-step-"])');
      if (checklistItems.length > 0) {
        const stepTexts = [];
        checklistItems.forEach((li, idx) => {
          const title = li.querySelector('strong')?.textContent.trim() || `Step ${idx + 1}`;
          const detail = li.querySelector('span')?.textContent.trim() || '';
          const checkbox = li.querySelector('input[type="checkbox"]');
          const isDone = checkbox && checkbox.checked ? 'Completed.' : 'Not completed.';
          stepTexts.push(`Step ${idx + 1}: ${title}. ${detail}. Status: ${isDone}`);
        });

        const fullScript = `Application steps checklist. There are ${checklistItems.length} steps. ${stepTexts.join(' ')}`;
        setStatusMessage(`Reading all ${checklistItems.length} application steps.`);
        speakWithStatus(fullScript, 'Read steps');
      } else {
        const stepInfo = getCurrentGuidedStepInfo();
        if (stepInfo.exists) {
          handleReadCurrentStep();
        } else {
          const msg = 'No application steps available yet. Please analyze a job first to view the checklist.';
          setStatusMessage(msg);
          speakWithStatus(msg, 'Read steps');
        }
      }
    }, 100);
  };

  // Handler: Execute voice command
  const executeCommand = (command, transcript) => {
    setHeardText(transcript);
    setErrorMessage('');

    switch (command.id) {
      case 'next_step': {
        const result = advanceToNextStep();
        setStatusMessage(result.message);
        setLastCommandRun('Next step');
        if (result.success) {
          speakWithStatus('Next step.', 'Next step');
          setTimeout(() => {
            const info = getCurrentGuidedStepInfo();
            if (info.exists) {
              speakWithStatus(`Now on ${info.indicator}: ${info.title}. ${info.detail}`);
            }
          }, 400);
        } else {
          speakWithStatus(result.message, 'Next step');
        }
        break;
      }

      case 'previous_step': {
        const result = returnToPreviousStep();
        setStatusMessage(result.message);
        setLastCommandRun('Previous step');
        if (result.success) {
          speakWithStatus('Previous step.', 'Previous step');
          setTimeout(() => {
            const info = getCurrentGuidedStepInfo();
            if (info.exists) {
              speakWithStatus(`Now on ${info.indicator}: ${info.title}. ${info.detail}`);
            }
          }, 400);
        } else {
          speakWithStatus(result.message, 'Previous step');
        }
        break;
      }

      case 'mark_done': {
        const result = toggleCurrentStepCompletion();
        setStatusMessage(result.message);
        setLastCommandRun('Mark done');
        speakWithStatus(result.message, 'Mark done');
        break;
      }

      case 'read_summary': {
        handleReadSummary();
        break;
      }

      case 'read_steps': {
        handleReadSteps();
        break;
      }

      case 'read_current_step': {
        handleReadCurrentStep();
        break;
      }

      case 'stop': {
        handleStopAll();
        break;
      }

      case 'go_to_profile': {
        const result = navigateToView('profile');
        setStatusMessage(result.message);
        setLastCommandRun('Go to profile');
        speakWithStatus('Navigating to My Profile.', 'Go to profile');
        break;
      }

      case 'go_to_analyze': {
        const result = navigateToView('analyze');
        setStatusMessage(result.message);
        setLastCommandRun('Go to analyze');
        speakWithStatus('Navigating to Analyze a Job.', 'Go to analyze');
        break;
      }

      case 'go_to_saved_jobs': {
        const result = navigateToView('saved');
        setStatusMessage(result.message);
        setLastCommandRun('Go to saved jobs');
        speakWithStatus('Navigating to Saved Jobs.', 'Go to saved jobs');
        break;
      }

      case 'help': {
        setShowHelpList(true);
        const helpScript =
          'Available voice commands are: next step, previous step, mark done, read summary, read steps, stop, go to profile, go to analyze, go to saved jobs, and help.';
        setStatusMessage('Displaying voice commands help.');
        setLastCommandRun('Help');
        speakWithStatus(helpScript, 'Help');
        break;
      }

      default:
        break;
    }
  };

  // Handler: When speech transcript arrives
  const handleTranscript = (transcript) => {
    if (isSpeakingRef.current) {
      return;
    }

    setHeardText(transcript);
    const matched = matchVoiceCommand(transcript);

    if (matched) {
      executeCommand(matched, transcript);
    } else {
      setStatusMessage(`Heard: "${transcript}" (Command not recognized. Say "help" for a list of commands.)`);
      setLastCommandRun('Unrecognized command');
      speakWithStatus(
        `I heard ${transcript}, but did not recognize that command. Say help for commands.`,
        'Unrecognized'
      );
    }
  };

  useEffect(() => {
    handleTranscriptRef.current = handleTranscript;
  });

  // Handler: Toggle Listening
  const handleToggleListening = () => {
    setErrorMessage('');

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setStatusMessage('Microphone paused.');
    } else {
      if (!hasRecognitionSupport) {
        setErrorMessage(
          'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice input.'
        );
        return;
      }

      if (!recognitionRef.current) {
        recognitionRef.current = createSpeechRecognition({
          onStart: () => {
            setIsListening(true);
            setStatusMessage('Listening for your voice command...');
          },
          onResult: (transcript) => {
            handleTranscriptRef.current?.(transcript);
          },
          onError: (errMsg) => {
            setErrorMessage(errMsg);
            setIsListening(false);
            setStatusMessage('Microphone stopped due to an error.');
          },
          onEnd: () => {
            setIsListening(false);
          }
        });
      }

      recognitionRef.current.start();
    }
  };

  // Requirement: Show panel when voice mode is active in the multi-mode set
  if (!hasMode('voice')) {
    return null;
  }

  return (
    <section
      className="voice-controls-panel"
      role="region"
      aria-labelledby="voice-panel-heading"
    >
      {/* Panel Header with Read Aloud toggle and Voice Status Badge */}
      <div className="voice-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 id="voice-panel-heading" className="voice-panel-title" style={{ margin: 0 }}>
          <span aria-hidden="true">&#127908;</span>
          <span>Voice Assistance Controls</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Labelled Read Aloud Toggle */}
          <label
            htmlFor="voice-readaloud-toggle"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--color-text-main)',
              backgroundColor: 'var(--color-surface-alt)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}
          >
            <input
              type="checkbox"
              id="voice-readaloud-toggle"
              checked={readAloud}
              onChange={handleToggleReadAloud}
              style={{
                width: '1.15rem',
                height: '1.15rem',
                accentColor: 'var(--color-primary)',
                cursor: 'pointer'
              }}
            />
            <span>Read aloud (spoken by AccessHire)</span>
          </label>

          <div className="voice-panel-badge" aria-label="Voice assistance status">
            <span
              className={`voice-status-indicator ${
                isListening ? 'listening' : isSpeakingState ? 'speaking' : ''
              }`}
              aria-hidden="true"
            />
            <span>{isListening ? 'Microphone Active' : isSpeakingState ? 'Speaking' : 'Voice Mode Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Button Toolbar */}
      <div className="voice-toolbar" role="toolbar" aria-label="Voice assistance controls toolbar">
        {/* 1. Start / Stop Listening Button */}
        <button
          type="button"
          className={`voice-btn ${isListening ? 'voice-btn-listening' : 'voice-btn-listen'}`}
          onClick={handleToggleListening}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop listening for voice commands' : 'Start listening for voice commands'}
        >
          <span aria-hidden="true">{isListening ? '⏹' : '🎤'}</span>
          <span>{isListening ? 'Stop Listening' : 'Start Listening'}</span>
        </button>

        {/* 2. Read Summary Button */}
        <button
          type="button"
          className="voice-btn voice-btn-action"
          onClick={handleReadSummary}
          aria-label="Read job summary aloud"
        >
          <span aria-hidden="true">&#128227;</span>
          <span>Read Summary</span>
        </button>

        {/* 3. Read Steps Button */}
        <button
          type="button"
          className="voice-btn voice-btn-action"
          onClick={handleReadSteps}
          aria-label="Read application steps aloud"
        >
          <span aria-hidden="true">&#128203;</span>
          <span>Read Steps</span>
        </button>

        {/* 4. Read Current Step Button */}
        <button
          type="button"
          className="voice-btn voice-btn-action"
          onClick={handleReadCurrentStep}
          aria-label="Read currently selected application step aloud"
        >
          <span aria-hidden="true">&#128065;</span>
          <span>Read Current Step</span>
        </button>

        {/* 5. Stop Speech Button */}
        <button
          type="button"
          className="voice-btn voice-btn-stop"
          onClick={handleStopAll}
          aria-label="Stop reading and cancel speech"
        >
          <span aria-hidden="true">&#9209;</span>
          <span>Stop</span>
        </button>
      </div>

      {/* Error Alert Box for Unsupported Browsers or Blocked Permissions */}
      {errorMessage && (
        <div
          className="alert-box error"
          role="alert"
          style={{ marginBottom: '1.25rem' }}
        >
          <span aria-hidden="true">&#9888;</span>
          <div>
            <strong>Voice Notice:</strong> {errorMessage}
            <div style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>
              All keyboard shortcuts, buttons, and site navigation remain fully accessible.
            </div>
          </div>
        </div>
      )}

      {/* Clear Status Area with role="status" */}
      <div
        className="voice-status-area"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="voice-status-row">
          <span
            className={`voice-status-indicator ${
              isListening ? 'listening' : isSpeakingState ? 'speaking' : ''
            }`}
            aria-hidden="true"
          />
          <strong>Status:</strong>
          <span>{statusMessage}</span>
        </div>

        {/* Show prompt with button to turn Read Aloud on when user attempted a read command while OFF */}
        {showTurnOnPrompt && !readAloud && (
          <div style={{ marginTop: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTurnOnReadAloud}
              style={{ minHeight: '38px', padding: '0.35rem 0.85rem', fontSize: '0.9rem' }}
            >
              Turn on read aloud
            </button>
          </div>
        )}

        <div className="voice-status-details">
          <div>
            <span className="voice-tag">Heard speech:</span>
            <span className="voice-heard-text">
              {heardText ? `"${heardText}"` : 'None yet (Click "Start listening" and speak)'}
            </span>
          </div>

          <div>
            <span className="voice-tag">Command run:</span>
            {lastCommandRun ? (
              <span className="voice-command-tag">{lastCommandRun}</span>
            ) : (
              <span style={{ color: 'var(--color-text-subtle)' }}>None yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Visible "Voice commands" Help List */}
      <div className="voice-help-container">
        <button
          type="button"
          className="voice-help-toggle-btn"
          onClick={() => setShowHelpList((prev) => !prev)}
          aria-expanded={showHelpList}
          aria-controls="voice-commands-list"
          aria-label={showHelpList ? 'Hide voice commands help list' : 'Show voice commands help list'}
        >
          <span aria-hidden="true">{showHelpList ? '▼' : '►'}</span>
          <span>{showHelpList ? 'Hide Voice Commands Guide' : 'Show Voice Commands Guide'}</span>
        </button>

        {showHelpList && (
          <div id="voice-commands-list" className="voice-help-grid">
            {VOICE_COMMANDS.map((cmd) => (
              <div key={cmd.id} className="voice-help-card">
                <div className="voice-help-command">
                  <span>Say: </span>
                  <code>{cmd.name}</code>
                </div>
                <div className="voice-help-desc">{cmd.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Cloud Speech Processing Privacy Note */}
      <div className="voice-privacy-notice" role="note">
        <span aria-hidden="true">&#128274;</span>
        <div>
          <strong>Privacy Note:</strong> Voice recognition in some browsers (such as Google Chrome and Microsoft Edge) is processed by the browser vendor's cloud speech service. AccessHire does not record, store, or transmit your audio recordings to our servers.
        </div>
      </div>
    </section>
  );
}
