<<<<<<< HEAD
# AccessHire Accessibility Notes & Testing Guide

This document details the accessibility improvements implemented in AccessHire to ensure compliance with **WCAG 2.1 AA** and **Section 508** standards, with special focus on keyboard navigation and screen-reader assistance (including NVDA on Windows).

---

## 1. Summary Checklist of Enhancements

### Keyboard Navigation & Shortcuts
- [x] **Global Single & Two-Key Shortcuts:**
  - `g` then `p`: Navigate to **My profile**
  - `g` then `a`: Navigate to **Analyze a job**
  - `g` then `s`: Navigate to **Saved jobs**
  - `?`: Open the **Keyboard Shortcuts Help** dialog
  - `Esc`: Close the shortcuts dialog or dismiss menus
- [x] **Typing Guard:** Shortcuts are strictly suppressed whenever focus is inside an `<input>`, `<textarea>`, `<select>`, or `contentEditable` element, preventing conflicts while typing.
- [x] **Centralized Logic:** Hook logic encapsulated in [`client/src/hooks/useKeyboardShortcuts.js`](file:///c:/Users/User/accesshire-bytedynamo%20%282%29/accesshire-bytedynamo/client/src/hooks/useKeyboardShortcuts.js).
- [x] **Help Dialog & Focus Trap:** Implemented in [`client/src/components/ShortcutsHelp.jsx`](file:///c:/Users/User/accesshire-bytedynamo%20%282%29/accesshire-bytedynamo/client/src/components/ShortcutsHelp.jsx) with `role="dialog"`, `aria-modal="true"`, focus containment, and focus restoration to the opener element upon closing.
- [x] **Updated Keyboard Tips:** [`client/src/components/KeyboardTips.jsx`](file:///c:/Users/User/accesshire-bytedynamo%20%282%29/accesshire-bytedynamo/client/src/components/KeyboardTips.jsx) updated to display all shortcuts and includes an "All Shortcuts (?)" trigger button.

### Screen-Reader & Semantic Polish
- [x] **Active Navigation:** `aria-current="page"` dynamically set on the active item in the main navigation.
- [x] **Labelled Landmarks:** Every major region provides explicit landmark roles and labels:
  - Header: `<header className="site-header" role="banner" aria-label="AccessHire Header">`
  - Navigation: `<nav className="main-nav" aria-label="Main Navigation">`
  - Aside: `<aside className="keyboard-tips-panel" aria-label="Keyboard navigation assistance">`
  - Main: `<main id="main-content" aria-label="Main Content" tabIndex={-1}>`
  - Sections: `aria-labelledby` for Profile, Job Input, Analysis Results, and Saved Jobs.
  - Footer: `<footer className="site-footer" role="contentinfo" aria-label="Site Footer">`
- [x] **Accessible Form Error Summary:**
  - Standard accessible pattern (GOV.UK / W3C WAI) in [`ProfileForm.jsx`](file:///c:/Users/User/accesshire-bytedynamo%20%282%29/accesshire-bytedynamo/client/src/components/ProfileForm.jsx) and [`JobInput.jsx`](file:///c:/Users/User/accesshire-bytedynamo%20%282%29/accesshire-bytedynamo/client/src/components/JobInput.jsx).
  - Automatically shifts focus to the error summary container (`tabIndex={-1}`) upon failed submission.
  - Each item is a keyboard-accessible anchor link (`href="#field-id"`) that moves focus directly to the erroneous input.
  - Erroneous fields receive `aria-invalid="true"` and an inline error message linked via `aria-describedby`.
- [x] **Polite Status Announcements:**
  - Always-mounted polite live region (`aria-live="polite" aria-atomic="true"`).
  - Real-time announcements for:
    - **Loading:** `"Loading: Analyzing job description with Gemini..."`
    - **Results ready:** `"Results ready for [Job Title]"`
    - **Saved:** `"Candidate profile saved successfully."` and `"Checklist progress saved."`
    - **Deleted:** `"Job [Job Title] deleted from saved jobs."`
- [x] **Strict Heading Order:** Clean, uninterrupted heading hierarchy (`h1` -> `h2` -> `h3` -> `h4`) with single `<h1>` per view and no skipped levels.
- [x] **Descriptive Link & Button Names:** Replaced ambiguous actions with descriptive `aria-label`s (e.g., `"Delete saved analysis for Frontend Developer"`, `"View original job page for Frontend Developer (opens in new window)"`).
- [x] **Cleanup:** Removed temporary `ModeNotice.jsx` and all its references across the application.

---

## 2. How to Test with NVDA (Windows)

NVDA (NonVisual Desktop Access) is a free, open-source screen reader for Windows.

### Prerequisites
1. Download and start NVDA on Windows (`Ctrl + Alt + N` to launch).
2. Open AccessHire in Chrome, Edge, or Firefox (`http://localhost:3000`).

### Test Procedure
1. **Landmarks Inspection (`NVDA + F7`):**
   - Press `NVDA + F7` to open the Elements List.
   - Choose **Landmarks** (`Alt + D`).
   - Verify all major regions are announced with clear labels:
     - `banner AccessHire Header`
     - `navigation Main Navigation`
     - `main Main Content`
     - `region Candidate Details` (or active section)
     - `contentinfo Site Footer`
2. **Heading Hierarchy Navigation (`H` key):**
   - Press `H` in browse mode to cycle through headings:
     - Level 1: `My Profile` (Page heading)
     - Level 2: `Candidate Details`
   - Switch to **Analyze a job**; press `H`:
     - Level 1: `Analyze a Job Posting`
     - Level 2: `Job Description Input`
   - Open an analysis; press `H`:
     - Level 1: `Job Analysis & Checklist`
     - Level 2: `[Job Title]`
     - Level 3: `Plain English Summary`, `Profile Compatibility`, `Documents Needed`, etc.
   - Confirm NVDA reports consistent levels without skipping (no jump from `h1` directly to `h3`).
3. **Active Nav Item Announcement:**
   - Press `Tab` into the main navigation.
   - Verify NVDA announces `"current page, My profile"` when focused on the active button.
4. **Live Status Announcements:**
   - **Save Profile:** Change a field in My Profile and press Enter on "Save Profile". NVDA will announce:
     > *"Candidate profile saved successfully."*
   - **Job Analysis Loading:** In Analyze a job, click "Analyze Job". NVDA announces:
     > *"Loading: Analyzing job description with Gemini..."*
   - **Results Ready:** When Gemini finishes, NVDA announces:
     > *"Results ready for [Job Title]"*
   - **Checklist Progress:** Mark any step done in Guided Apply. NVDA announces:
     > *"Checklist progress saved."*
   - **Job Deletion:** Go to Saved Jobs, click "Delete", and confirm the prompt. NVDA announces:
     > *"Job [Job Title] deleted from saved jobs."*
5. **Form Error Summary Verification:**
   - Go to **My Profile**, clear the **Full Name** field, and press **Save Profile**.
   - NVDA immediately shifts focus to the Error Summary and announces:
     > *"Alert. There is a problem. Enter your full name."*
   - Press `Tab` or Down Arrow to hear the error link, then press `Enter`. Focus immediately jumps to the Full Name input field.
   - NVDA announces the input field as `"invalid entry, Enter your full name"`.
6. **Shortcuts Dialog & Focus Trap:**
   - Press `?` outside any text input.
   - NVDA announces:
     > *"Keyboard Shortcuts dialog. Press these keys anytime you are not typing in a form field."*
   - Press `Tab` repeatedly. Verify NVDA cycles only through the close button, shortcut list, and "Got it" button, without reading background content.
   - Press `Esc`. The dialog closes, and NVDA returns focus to your previous position on the page.

---

## 3. How to Test with Keyboard Alone (2-Minute Test)

You can verify all keyboard features in 2 minutes without a mouse:

1. **Skip Link (10s):**
   - Reload `http://localhost:3000`. Press `Tab` once.
   - Verify the `"Skip to main content"` banner appears at the top.
   - Press `Enter`. Verify focus moves directly to the main content container.
2. **Global Shortcuts Navigation (20s):**
   - Press `g` then `a` (outside any input). The app instantly switches to **Analyze a job**.
   - Press `g` then `s`. The app instantly switches to **Saved jobs**.
   - Press `g` then `p`. The app returns to **My profile**.
3. **Shortcuts Help Dialog & Focus Trap (30s):**
   - Press `?`. The Keyboard Shortcuts dialog opens immediately.
   - Press `Tab` multiple times. Focus will cycle from `Close (Esc)` down to `Got it`, and loop back to `Close (Esc)`. Focus never leaks to the page underneath.
   - Press `Esc`. The dialog closes, and focus returns to the element you were on before pressing `?`.
4. **Typing Guard (15s):**
   - In **My profile**, focus the **Professional Summary** textarea.
   - Type `"Looking for great roles in accessibility."`
   - Notice that pressing `g`, `p`, `a`, `s`, or `?` while typing simply inserts the letters and question mark into the textarea without triggering any shortcuts.
5. **Form Error Summary & Focus Jump (25s):**
   - In **My profile**, select all text in **Full Name** and press `Backspace` to clear it.
   - Press `Tab` to reach **Save Profile** and press `Enter`.
   - The **"There is a problem"** error summary appears and receives active keyboard focus (indicated by a high-contrast focus ring).
   - Press `Tab` to reach the link `"Enter your full name"` and press `Enter`.
   - Focus immediately jumps directly into the **Full Name** input field.
6. **Step Progress in Results (20s):**
   - Press `g` then `a` to go to Analyze a job.
   - Tab to **"Use Sample Job"** and press `Enter`.
   - Tab to **"Analyze Job"** and press `Enter`.
   - When results appear, Tab down to the **"Mark step done"** checkbox in the Guided Apply card and press `Space` to toggle it.
   - Notice the status announcement and save confirmation.
=======
# AccessHire Accessibility Implementation & Testing Guide

This document details the accessibility features, WCAG 2.1 AA compliance accomplishments, and testing verification guides for **AccessHire** (ByteDynamo), specifically focused on **Keyboard Navigation** and **Screen-Reader (NVDA on Windows)** support.

---

## 1. Accomplishments & Implementation Checklist

### Global Keyboard Navigation & Shortcuts
- [x] **Two-Key Navigation Sequences:**
  - `g` then `p`: Navigates immediately to **My Profile** (`handleNavigateToProfile`).
  - `g` then `a`: Navigates to **Analyze a Job** (`handleNavigateToAnalyze` with profile completeness guard).
  - `g` then `s`: Navigates to **Saved Jobs** (`handleNavigateToSaved`).
  - Sequence timeout: 1200ms grace window between `g` and the target key.
- [x] **Typing Input Suppression:** Global shortcuts are disabled whenever the user is actively focused in an `<input>`, `<textarea>`, `<select>`, or any `contenteditable` container (`isEditableTarget` in `useKeyboardShortcuts.js`).
- [x] **Help Modal Shortcut (`?`):** Pressing `?` anywhere outside input fields opens the accessible keyboard shortcuts dialog.
- [x] **Escape Shortcut (`Esc`):** Closes the shortcuts dialog and other overlay panels, returning focus cleanly to the trigger.

### Accessible Shortcuts Modal Dialog (`ShortcutsHelp.jsx`)
- [x] **WAI-ARIA Dialog Semantics:** Container has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="shortcuts-dialog-title"`, and `aria-describedby="shortcuts-dialog-description"`.
- [x] **Focus Trap:** When the dialog is active, focus is trapped inside. Pressing `Tab` from the last focusable element wraps around to the first, and pressing `Shift + Tab` from the first element wraps around to the last.
- [x] **Initial Focus Placement:** Focus shifts automatically to the close button inside the dialog upon opening.
- [x] **Focus Restoration:** When closed (via `Esc`, Close button, or "Got it" button), focus returns automatically to the element that opened it (`openerRef`).

### Keyboard Navigation Tips Panel (`KeyboardTips.jsx`)
- [x] Rendered prominently when **Keyboard Navigation Mode** is active.
- [x] Details the `g p`, `g a`, `g s`, `?`, and `Esc` key sequences.
- [x] Includes an explicit button to open the full shortcuts dialog for keyboard users.
- [x] Collapsible with `aria-expanded` and `aria-controls` for low visual noise.

### Screen-Reader Landmark & Semantic Polish
- [x] **Removal of Temporary Notices:** Removed `ModeNotice.jsx` and cleaned up all imports/mounts.
- [x] **Semantic Landmark Regions:**
  - `<header className="site-header" role="banner">`
  - `<nav className="main-nav" role="navigation" aria-label="Main Navigation">`
  - `<main id="main-content" role="main" aria-label="Main Content" tabIndex={-1}>`
  - `<aside className="keyboard-tips-panel" role="complementary" aria-label="Keyboard navigation assistance">`
  - `<footer className="site-footer" role="contentinfo" aria-label="Site Footer">`
- [x] **Active Page Indication:** Active navigation item has `aria-current="page"` (`nav-button active`), while inactive items omit it.
- [x] **Heading Hierarchy:** Strictly maintains `h1` (one per view, receiving programmatic focus on navigation) > `h2` (major section cards) > `h3` (sub-sections) > `h4` (step and skills cards).
- [x] **Descriptive Names & Labels:**
  - Delete buttons include the job title: `aria-label="Delete [Job Title] from saved jobs"`.
  - External links announce new window behavior: `aria-label="View original job page for [Job Title] (opens in new tab)"`.
  - Open analysis buttons include target: `aria-label="Open analysis for [Job Title]"`.
- [x] **Touch Target Sizes:** All interactive buttons and inputs have `minHeight: 44px` (or >= 44px) meeting WCAG 2.5.5 / 2.5.8 target size criteria.

### Form Validation & Error Summary (`ProfileForm.jsx`)
- [x] **Accessible Error Summary:** When form validation fails, an alert box with `role="alert"` and `aria-labelledby` appears at the top of the form.
- [x] **Automatic Focus Shift:** Focus is automatically moved to the error summary container (`tabIndex={-1}`) so screen-reader users immediately hear the error count and messages.
- [x] **Jump Links to Invalid Fields:** Each error in the summary is a clickable anchor link that jumps keyboard focus directly into the invalid form field.
- [x] **Field-Level Indicators:** Invalid inputs receive `aria-invalid="true"` and `aria-describedby` linking to their specific error text element (`id="fullname-error"`, `id="skills-error"`).

### Polite Live Region Announcements
- [x] Global polite live region rendered in `App.jsx`:
  ```html
  <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {announcement}
  </div>
  ```
- [x] **Announcements emitted for:**
  - View changes: *"You are on My profile page"*, *"You are on Analyze a job page"*, *"You are on Saved jobs page"*.
  - Mode selection: *"Choose how you want to use AccessHire screen"*.
  - Job analysis lifecycle: *"Analyzing job description"*, *"Analysis ready for [Job Title]"*, *"Analysis failed: [error message]"*.
  - Profile actions: *"Profile saved successfully."*, *"Please complete your profile first."*.
  - Saved jobs: *"Loaded [N] saved job applications."*, *"Removed [Job Title] from your saved jobs."*.
  - Checklist progress: *"Progress saved. Step [N] marked done."*.

---

## 2. NVDA (Windows) Screen-Reader Testing Guide

### Prerequisites
1. Start the client dev server: `npm run dev` in `client/` (running on `http://localhost:3000`).
2. Start the backend: `npm run dev` in `server/` (running on `http://localhost:5000`).
3. Open **Google Chrome**, **Microsoft Edge**, or **Mozilla Firefox**.
4. Start **NVDA** (default Windows shortcut: `Ctrl + Alt + N`).

### Test 1: Landmark Navigation
1. Press `D` to navigate through landmarks.
2. **Verify:** NVDA announces each landmark in order:
   - *"banner"* (Header)
   - *"navigation, Main Navigation"* (Nav bar)
   - *"main, Main Content"* (Active view)
   - *"contentinfo, Site Footer"* (Footer)
3. Press `Shift + D` to verify backward landmark navigation.

### Test 2: Active Navigation State
1. Tab into the navigation bar.
2. When focused on the active view button (e.g., "My profile"), NVDA should announce:
   - *"My profile, current page, button"*
3. Move focus to "Analyze a job" or "Saved jobs":
   - NVDA should announce: *"Analyze a job, button"* (without "current page").

### Test 3: Heading Navigation & Programmatic Focus
1. Switch views by activating "Saved jobs" with `Enter` or pressing `g` then `s`.
2. **Verify:** NVDA immediately announces the new view heading (`h1`): *"Saved Job Analyses, heading level 1"*.
3. Press `H` to cycle through section headings:
   - `h2`: *"Saved Job Applications (N)"*
   - `h3`: Job titles in the list
4. Verify no heading levels are skipped.

### Test 4: Form Error Summary & Field Jumping
1. Navigate to "My profile" (`g` then `p`).
2. Clear the "Full Name" and "Skills" fields.
3. Tab to the "Save Profile" button and press `Enter`.
4. **Verify:**
   - NVDA immediately moves focus to the error summary and announces:
     *"Alert: There is a problem (2 errors). Please review and correct the errors below..."*
   - Tab into the error list inside the summary.
   - Press `Enter` on *"Full name is required. Please enter your name."*
   - NVDA should jump focus directly into the "Full Name" input, announcing:
     *"Full Name, required, invalid entry, edit, has auto complete, Full name is required."*

### Test 5: Live Region Announcements
1. In "Saved jobs", locate any job card and tab to the "Delete" button.
2. Press `Enter` and confirm the browser prompt.
3. **Verify:** NVDA automatically speaks the live announcement without moving focus away:
   - *"Removed '[Job Title]' from your saved jobs."*
4. In "Analyze a job", paste sample text and press "Analyze Job":
   - NVDA announces: *"Analyzing job description"*
   - When complete, NVDA announces: *"Analysis ready for Frontend Accessibility Specialist"*

---

## 3. Keyboard-Only Testing Guide (No Mouse)

### Test 1: Visual Focus Outlines
1. Press `Tab` repeatedly from the address bar through all interactive elements.
2. **Verify:** Every link, button, input, and checkbox displays a prominent, high-contrast 3px (or 4px in Keyboard Mode) focus indicator. No element has `outline: none` without a replacement.

### Test 2: Skip to Main Content Link
1. Press `F5` to refresh the page.
2. Press `Tab` once.
3. **Verify:** The "Skip to main content" link becomes visible at the top-left of the viewport.
4. Press `Enter`.
5. **Verify:** Focus jumps directly past the header and navigation to `#main-content`.

### Test 3: Two-Key Navigation Sequences (`g` then `letter`)
1. Ensure focus is NOT inside an editable field (click background or press `Esc`).
2. Press `g`, release it, then press `p`.
   - **Result:** View switches to **My Profile**.
3. Press `g`, release it, then press `a`.
   - **Result:** View switches to **Analyze a job** (or prompts profile completion if incomplete).
4. Press `g`, release it, then press `s`.
   - **Result:** View switches to **Saved jobs**.

### Test 4: Typing Guard (Shortcut Inactivity During Text Entry)
1. Navigate to **My Profile**.
2. Tab into the **Full Name** input field.
3. Type: `g p g a g s`.
4. **Verify:** The text `g p g a g s` is entered into the text field. The application DOES NOT navigate away or trigger any shortcuts.

### Test 5: Shortcuts Help Modal (`?` and `Esc`) & Focus Trap
1. Tab outside all form fields (e.g., focus the "My profile" nav button).
2. Press `?` on the keyboard.
   - **Result:** The "Keyboard Shortcuts" modal dialog opens.
   - **Verify:** Focus is automatically placed on the "✕ Close" button inside the modal.
3. Press `Tab` repeatedly:
   - Focus cycles through the Close button and the "Got it (Esc)" button at the bottom.
   - Focus NEVER leaves the modal into the background page.
4. Press `Shift + Tab` on the Close button:
   - Focus wraps around to the last button ("Got it (Esc)").
5. Press `Escape`:
   - The modal closes immediately.
   - Focus is automatically restored to the element that had focus before pressing `?`.

### Test 6: Checklist Checkbox Interaction
1. On the Job Analysis Results page, scroll or tab down to the **Guided Application Steps**.
2. Tab to the "Mark step done" checkbox.
3. Press `Space` to toggle the checkbox.
   - **Result:** Step status updates and save status confirms: *"Progress saved."*
4. Tab to the "Next Step →" button and press `Enter` to advance to the next step.

---

## 4. Summary Table of Standards Compliance

| WCAG 2.1 Criterion | Implementation | Status |
| :--- | :--- | :--- |
| **1.3.1 Info and Relationships** | Semantic landmarks (`banner`, `nav`, `main`, `contentinfo`), proper heading levels (`h1`-`h4`), `<fieldset>` and `<legend>`. | **Pass** |
| **2.1.1 Keyboard** | All features accessible via Tab, Shift+Tab, Enter, Space; custom shortcuts `g p`, `g a`, `g s`, `?`, `Esc`. | **Pass** |
| **2.1.2 No Keyboard Trap** | Modal dialog implements strict, cyclic focus trap that releases cleanly upon pressing `Esc` or clicking Close. | **Pass** |
| **2.1.4 Character Key Shortcuts** | Shortcuts (`g`, `?`) are inactive when focus is in any editable text component (`isEditableTarget`). | **Pass** |
| **2.4.1 Bypass Blocks** | Prominent "Skip to main content" link at the very top of DOM. | **Pass** |
| **2.4.3 Focus Order** | Logical DOM tab order following visual presentation and programmatic heading focus on view change. | **Pass** |
| **2.4.7 Focus Visible** | 3px to 4px high-contrast solid focus rings with offset on all interactive controls. | **Pass** |
| **2.5.5 / 2.5.8 Target Size** | All interactive action buttons have minimum dimensions of 44px by 44px. | **Pass** |
| **3.2.1 / 3.2.2 On Focus / Input** | Navigation never triggers automatically on focus or text typing. | **Pass** |
| **3.3.1 Error Identification** | Clear client-side form validation marking invalid fields with `aria-invalid="true"`. | **Pass** |
| **3.3.3 Error Suggestion** | Form error summary provides specific remediation instructions with direct jump links to fields. | **Pass** |
| **4.1.2 Name, Role, Value** | Native HTML controls, ARIA states (`aria-current="page"`, `aria-modal="true"`, `aria-expanded`). | **Pass** |
| **4.1.3 Status Messages** | Polite `role="status"` live region announces loading, results ready, saving, and deletion without shifting focus. | **Pass** |
>>>>>>> feature/multi-mode-resume-jobs
