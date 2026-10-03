/**
 * Voice DOM Actions Helper
 * Interacts with AccessHire navigation, summaries, and guided application steps via DOM elements.
 * Plain English comments throughout.
 */

/**
 * Navigate to one of the main views: 'profile', 'analyze', or 'saved'.
 * Finds and clicks the corresponding button in the main navigation bar.
 * 
 * @param {'profile' | 'analyze' | 'saved'} viewTarget 
 * @returns {{ success: boolean, message: string }}
 */
export function navigateToView(viewTarget) {
  const navButtons = Array.from(document.querySelectorAll('.main-nav .nav-button'));

  const targets = {
    profile: ['my profile', 'profile'],
    analyze: ['analyze a job', 'analyze', 'analyse a job', 'analyse'],
    saved: ['saved jobs', 'saved']
  };

  const keywords = targets[viewTarget] || [];
  const targetButton = navButtons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    return keywords.some(k => text.includes(k));
  });

  if (targetButton) {
    targetButton.click();
    targetButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const names = {
      profile: 'My Profile',
      analyze: 'Analyze a Job',
      saved: 'Saved Jobs'
    };
    return { success: true, message: `Navigating to ${names[viewTarget] || viewTarget}.` };
  }

  return { success: false, message: `Could not find navigation button for ${viewTarget}.` };
}

/**
 * Extract the plain English job summary from the active page if available.
 * 
 * @returns {string | null}
 */
export function getJobSummaryText() {
  const summaryParagraph = document.querySelector('.summary-container p');
  if (summaryParagraph && summaryParagraph.textContent.trim()) {
    return summaryParagraph.textContent.trim();
  }
  return null;
}

/**
 * Get information about the currently active guided application step in wizard mode.
 * 
 * @returns {{
 *   exists: boolean,
 *   indicator?: string,
 *   title?: string,
 *   detail?: string,
 *   isDone?: boolean,
 *   canNext?: boolean,
 *   canPrev?: boolean
 * }}
 */
export function getCurrentGuidedStepInfo() {
  const wizardCard = document.querySelector('.guided-step-card');
  if (!wizardCard) {
    return { exists: false };
  }

  const indicator = wizardCard.querySelector('.step-indicator')?.textContent.trim() || '';
  const title = wizardCard.querySelector('.step-title')?.textContent.trim() || '';
  const detail = wizardCard.querySelector('.step-detail')?.textContent.trim() || '';
  const checkbox = wizardCard.querySelector('input[type="checkbox"]');
  const isDone = checkbox ? checkbox.checked : false;

  const buttons = Array.from(wizardCard.querySelectorAll('button'));
  const prevBtn = buttons.find(b => b.textContent.includes('Previous Step'));
  const nextBtn = buttons.find(b => b.textContent.includes('Next Step'));

  return {
    exists: true,
    indicator,
    title,
    detail,
    isDone,
    canPrev: Boolean(prevBtn && !prevBtn.disabled),
    canNext: Boolean(nextBtn && !nextBtn.disabled)
  };
}

/**
 * Advance to the next guided application step.
 * 
 * @returns {{ success: boolean, message: string }}
 */
export function advanceToNextStep() {
  const wizardCard = document.querySelector('.guided-step-card');
  if (!wizardCard) {
    return {
      success: false,
      message: 'No step-by-step checklist is open. Please analyze a job first.'
    };
  }

  const nextBtn = Array.from(wizardCard.querySelectorAll('button')).find(b =>
    b.textContent.includes('Next Step')
  );

  if (!nextBtn) {
    return { success: false, message: 'Next step button not found.' };
  }

  if (nextBtn.disabled) {
    return { success: false, message: 'You are already on the last application step.' };
  }

  nextBtn.click();
  return { success: true, message: 'Moving to the next application step.' };
}

/**
 * Go back to the previous guided application step.
 * 
 * @returns {{ success: boolean, message: string }}
 */
export function returnToPreviousStep() {
  const wizardCard = document.querySelector('.guided-step-card');
  if (!wizardCard) {
    return {
      success: false,
      message: 'No step-by-step checklist is open. Please analyze a job first.'
    };
  }

  const prevBtn = Array.from(wizardCard.querySelectorAll('button')).find(b =>
    b.textContent.includes('Previous Step')
  );

  if (!prevBtn) {
    return { success: false, message: 'Previous step button not found.' };
  }

  if (prevBtn.disabled) {
    return { success: false, message: 'You are already on the first application step.' };
  }

  prevBtn.click();
  return { success: true, message: 'Going back to the previous application step.' };
}

/**
 * Toggle the checkbox for the current guided application step.
 * 
 * @returns {{ success: boolean, message: string }}
 */
export function toggleCurrentStepCompletion() {
  const wizardCard = document.querySelector('.guided-step-card');
  if (wizardCard) {
    const checkbox = wizardCard.querySelector('input[type="checkbox"]');
    if (checkbox) {
      // Current state before toggle
      const wasDone = checkbox.checked;
      checkbox.click();
      const nowDone = !wasDone;
      return {
        success: true,
        message: nowDone ? 'Marked step as done.' : 'Marked step as not completed.'
      };
    }
  }

  // Fallback for checklist view
  const checklistCheckboxes = Array.from(
    document.querySelectorAll('input[id^="full-step-"]')
  );
  if (checklistCheckboxes.length > 0) {
    // Find the first unchecked box, or toggle the first box
    const target = checklistCheckboxes.find(cb => !cb.checked) || checklistCheckboxes[0];
    const wasDone = target.checked;
    target.click();
    const nowDone = !wasDone;
    return {
      success: true,
      message: nowDone ? 'Marked checklist step as done.' : 'Marked checklist step as not done.'
    };
  }

  return {
    success: false,
    message: 'No application step checkbox is currently on screen.'
  };
}

/**
 * Collect all checklist steps available in the checklist view or guided card.
 * 
 * @returns {Array<{ number: number, title: string, detail: string, isDone: boolean }>}
 */
export function getAllApplicationSteps() {
  const results = [];

  // Check if checklist view items are visible
  const checklistItems = document.querySelectorAll('li:has(input[id^="full-step-"])');
  if (checklistItems.length > 0) {
    checklistItems.forEach((li, idx) => {
      const title = li.querySelector('strong')?.textContent.trim() || `Step ${idx + 1}`;
      const detail = li.querySelector('span')?.textContent.trim() || '';
      const checkbox = li.querySelector('input[type="checkbox"]');
      results.push({
        number: idx + 1,
        title,
        detail,
        isDone: checkbox ? checkbox.checked : false
      });
    });
    return results;
  }

  // If in wizard view, we can check the guided-step-card
  const stepInfo = getCurrentGuidedStepInfo();
  if (stepInfo.exists) {
    results.push({
      number: 1,
      title: stepInfo.title || 'Current Step',
      detail: stepInfo.detail || '',
      isDone: Boolean(stepInfo.isDone)
    });
  }

  return results;
}
