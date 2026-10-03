/**
 * Speech Recognition Helper
 * Manages browser speech-to-text recognition using SpeechRecognition or webkitSpeechRecognition.
 * Plain English comments throughout.
 */

/**
 * Check if the browser supports speech recognition.
 */
export function isSpeechRecognitionSupported() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/**
 * Create a speech recognition controller.
 * 
 * @param {Object} callbacks
 * @param {Function} callbacks.onStart - Triggered when the microphone begins listening
 * @param {Function} callbacks.onResult - Triggered with the recognized speech text
 * @param {Function} callbacks.onError - Triggered with a friendly error message
 * @param {Function} callbacks.onEnd - Triggered when listening stops
 */
export function createSpeechRecognition({ onStart, onResult, onError, onEnd }) {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognitionClass) {
    return {
      start: () => {
        if (onError) {
          onError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
        }
      },
      stop: () => {},
      isSupported: false
    };
  }

  let recognition = null;
  let shouldBeListening = false;
  let restartTimeoutId = null;

  function initRecognition() {
    recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (onStart) onStart();
    };

    recognition.onresult = (event) => {
      if (!event.results || event.results.length === 0) return;

      // Only act on final results to avoid duplicate execution from interim results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && result[0]) {
          const transcript = result[0].transcript;
          if (transcript && transcript.trim() && onResult) {
            onResult(transcript.trim());
          }
        }
      }
    };

    recognition.onerror = (event) => {
      let friendlyMessage = 'Microphone error occurred.';

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          friendlyMessage =
            'Microphone access was denied. Please allow microphone access in your browser settings to use voice commands.';
          shouldBeListening = false;
          break;
        case 'no-speech':
          // Standard timeout when no speech is detected; ignore if still supposed to listen
          return;
        case 'audio-capture':
          friendlyMessage = 'No microphone was detected on your computer.';
          shouldBeListening = false;
          break;
        case 'network':
          friendlyMessage = 'A network issue occurred while connecting to the speech service.';
          break;
        case 'aborted':
          // Stopped intentionally by user
          return;
        default:
          friendlyMessage = `Voice recognition error: ${event.error}`;
      }

      if (onError) onError(friendlyMessage);
    };

    recognition.onend = () => {
      // If the user requested to keep listening and no permanent error occurred, restart
      if (shouldBeListening) {
        clearTimeout(restartTimeoutId);
        restartTimeoutId = setTimeout(() => {
          if (shouldBeListening && recognition) {
            try {
              recognition.start();
            } catch {
              // Ignore already-started errors
            }
          }
        }, 300);
      } else {
        if (onEnd) onEnd();
      }
    };
  }

  return {
    isSupported: true,
    start: () => {
      shouldBeListening = true;
      clearTimeout(restartTimeoutId);
      if (!recognition) {
        initRecognition();
      }
      try {
        recognition.start();
      } catch {
        // If already started or pending, re-init and restart
        try {
          recognition.abort();
        } catch {
          // Ignore abort errors
        }
        initRecognition();
        try {
          recognition.start();
        } catch (e) {
          if (onError) onError(`Could not start microphone: ${e.message}`);
        }
      }
    },
    stop: () => {
      shouldBeListening = false;
      clearTimeout(restartTimeoutId);
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          try {
            recognition.abort();
          } catch {
            // Ignore abort errors
          }
        }
      }
      if (onEnd) onEnd();
    }
  };
}
