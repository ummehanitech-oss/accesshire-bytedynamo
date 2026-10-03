/**
 * Voice Commands Definition & Flexible Matcher
 * Maps spoken phrases to recognized application actions.
 * Plain English comments throughout.
 */

export const VOICE_COMMANDS = [
  {
    id: 'next_step',
    name: 'next step',
    description: 'Advance to the next application step in the checklist.',
    examples: ['"next step"', '"next"']
  },
  {
    id: 'previous_step',
    name: 'previous step',
    description: 'Go back to the previous application step in the checklist.',
    examples: ['"previous step"', '"back"']
  },
  {
    id: 'mark_done',
    name: 'mark done',
    description: 'Toggle the current step as finished or unfinished.',
    examples: ['"mark done"', '"mark complete"']
  },
  {
    id: 'read_summary',
    name: 'read summary',
    description: 'Read the simplified plain English job summary aloud.',
    examples: ['"read summary"', '"speak summary"']
  },
  {
    id: 'read_steps',
    name: 'read steps',
    description: 'Read all application checklist steps in order.',
    examples: ['"read steps"', '"read all steps"']
  },
  {
    id: 'stop',
    name: 'stop',
    description: 'Stop any current speech output immediately.',
    examples: ['"stop"', '"stop speaking"']
  },
  {
    id: 'go_to_profile',
    name: 'go to profile',
    description: 'Navigate to the My Profile screen.',
    examples: ['"go to profile"', '"open profile"']
  },
  {
    id: 'go_to_analyze',
    name: 'go to analyze',
    description: 'Navigate to the Analyze a Job screen.',
    examples: ['"go to analyze"', '"analyze a job"']
  },
  {
    id: 'go_to_saved_jobs',
    name: 'go to saved jobs',
    description: 'Navigate to the Saved Jobs list screen.',
    examples: ['"go to saved jobs"', '"saved jobs"']
  },
  {
    id: 'help',
    name: 'help',
    description: 'Hear and view the list of available voice commands.',
    examples: ['"help"', '"what can I say"']
  }
];

/**
 * Match a raw speech transcript against our supported commands.
 * Matches flexibly using lowercase conversion, trimming, and substring containment.
 * 
 * @param {string} rawTranscript - Spoken text detected by speech recognition
 * @returns {{ id: string, name: string, matchedPhrase: string } | null}
 */
export function matchVoiceCommand(rawTranscript) {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return null;
  }

  // Convert to lowercase and remove extraneous punctuation
  const clean = rawTranscript.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;

  // 1. Next step
  if (
    clean === 'next' ||
    clean.includes('next step') ||
    clean.includes('step forward') ||
    clean.includes('forward step') ||
    clean.includes('go to next')
  ) {
    return { id: 'next_step', name: 'next step', matchedPhrase: rawTranscript };
  }

  // 2. Previous step
  if (
    clean === 'previous' ||
    clean === 'back' ||
    clean.includes('previous step') ||
    clean.includes('prior step') ||
    clean.includes('back step') ||
    clean.includes('go back') ||
    clean.includes('last step')
  ) {
    return { id: 'previous_step', name: 'previous step', matchedPhrase: rawTranscript };
  }

  // 3. Mark done
  if (
    clean.includes('mark done') ||
    clean.includes('mark as done') ||
    clean.includes('mark step done') ||
    clean.includes('mark complete') ||
    clean.includes('mark finished') ||
    clean.includes('check step') ||
    clean.includes('toggle step') ||
    clean.includes('toggle done')
  ) {
    return { id: 'mark_done', name: 'mark done', matchedPhrase: rawTranscript };
  }

  // 4. Read summary
  if (
    clean.includes('read summary') ||
    clean.includes('speak summary') ||
    clean.includes('read the summary') ||
    clean.includes('tell me the summary') ||
    clean.includes('job summary')
  ) {
    return { id: 'read_summary', name: 'read summary', matchedPhrase: rawTranscript };
  }

  // 5. Read steps
  if (
    clean.includes('read steps') ||
    clean.includes('speak steps') ||
    clean.includes('read all steps') ||
    clean.includes('read checklist') ||
    clean.includes('read the steps') ||
    clean.includes('read application steps')
  ) {
    return { id: 'read_steps', name: 'read steps', matchedPhrase: rawTranscript };
  }

  // 6. Stop
  if (
    clean === 'stop' ||
    clean.includes('stop speech') ||
    clean.includes('stop speaking') ||
    clean.includes('stop reading') ||
    clean.includes('shut up') ||
    clean.includes('quiet') ||
    clean.includes('cancel speech') ||
    clean.includes('pause speech')
  ) {
    return { id: 'stop', name: 'stop', matchedPhrase: rawTranscript };
  }

  // 7. Go to profile
  if (
    clean === 'profile' ||
    clean.includes('go to profile') ||
    clean.includes('open profile') ||
    clean.includes('show profile') ||
    clean.includes('my profile') ||
    clean.includes('navigate to profile')
  ) {
    return { id: 'go_to_profile', name: 'go to profile', matchedPhrase: rawTranscript };
  }

  // 8. Go to analyze
  if (
    clean === 'analyze' ||
    clean === 'analyse' ||
    /go to analy[sz]e/.test(clean) ||
    /open analy[sz]e/.test(clean) ||
    /analy[sz]e a job/.test(clean) ||
    /analy[sz]e job/.test(clean) ||
    /show analy[sz]e/.test(clean) ||
    /navigate to analy[sz]e/.test(clean)
  ) {
    return { id: 'go_to_analyze', name: 'go to analyze', matchedPhrase: rawTranscript };
  }

  // 9. Go to saved jobs
  if (
    clean === 'saved' ||
    clean.includes('go to saved jobs') ||
    clean.includes('open saved jobs') ||
    clean.includes('saved jobs') ||
    clean.includes('saved job') ||
    clean.includes('saved applications') ||
    clean.includes('show saved jobs') ||
    clean.includes('navigate to saved jobs')
  ) {
    return { id: 'go_to_saved_jobs', name: 'go to saved jobs', matchedPhrase: rawTranscript };
  }

  // 10. Help
  if (
    clean === 'help' ||
    clean.includes('help') ||
    clean.includes('what can i say') ||
    clean.includes('commands') ||
    clean.includes('voice commands') ||
    clean.includes('show commands') ||
    clean.includes('list commands')
  ) {
    return { id: 'help', name: 'help', matchedPhrase: rawTranscript };
  }

  // Bonus: Read current step
  if (
    clean.includes('read current step') ||
    clean.includes('current step') ||
    clean.includes('read this step') ||
    clean.includes('where am i')
  ) {
    return { id: 'read_current_step', name: 'read current step', matchedPhrase: rawTranscript };
  }

  return null;
}
