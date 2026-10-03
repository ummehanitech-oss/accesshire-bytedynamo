/**
 * Speech Synthesis Helper
 * Handles text-to-speech output using the browser's native window.speechSynthesis API.
 * Plain English comments throughout.
 */

let activeUtterance = null;

/**
 * Check if the browser supports speech synthesis.
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Check if speech is currently active.
 */
export function isSpeaking() {
  return Boolean(activeUtterance);
}

/**
 * Stop any ongoing speech output immediately.
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

/**
 * Speak the provided text aloud using speech synthesis.
 * Cancels any currently playing audio before speaking the new text.
 * 
 * @param {string} text - The text to read aloud
 * @param {Object} options - Callbacks and voice settings
 * @param {Function} [options.onStart] - Called when speaking begins
 * @param {Function} [options.onEnd] - Called when speaking completes
 * @param {Function} [options.onError] - Called if speaking fails
 * @param {number} [options.rate=1.0] - Speech rate (0.8 - 1.2 recommended)
 */
export function speak(text, options = {}) {
  if (!isSpeechSynthesisSupported()) {
    if (options.onError) {
      options.onError('Speech synthesis is not supported by your browser.');
    }
    return;
  }

  // Cancel any speech that is currently playing
  stopSpeaking();

  if (!text || !text.trim()) {
    if (options.onEnd) options.onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'en-US';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;

  // Pick an English voice if available
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en') && !v.localService) ||
                         voices.find(v => v.lang && v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
  }

  utterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (event) => {
    activeUtterance = null;
    // Don't report cancellation as an error (e.g. when user clicks stop)
    if (event.error === 'canceled' || event.error === 'interrupted') {
      if (options.onEnd) options.onEnd();
      return;
    }
    if (options.onError) {
      options.onError(`Speech error: ${event.error || 'Unknown error'}`);
    }
  };

  // Keep a reference to prevent garbage collection in Chromium browsers
  activeUtterance = utterance;

  window.speechSynthesis.speak(utterance);
}
