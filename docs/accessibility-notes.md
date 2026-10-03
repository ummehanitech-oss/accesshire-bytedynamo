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
