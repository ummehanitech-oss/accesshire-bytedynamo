# accesshire-bytedynamo
AccessHire by ByteDynamo — RepoForge Hackathon (Problem Statement PS003)

**AccessHire** is an accessible job application assistant engineered to remove barriers for job seekers, especially neurodivergent applicants and people with disabilities. It translates dense, jargon-laden job postings into plain, simple English, computes a candidate compatibility score against a saved profile, identifies required application documents, and generates a step-by-step interactive checklist.

---

## 📋 Table of Contents
- [Problem & Solution (PS003)](#-problem--solution-ps003)
- [Features Built So Far](#-features-built-so-far)
- [URL Import Feature & Safety](#-url-import-feature--safety)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Setup & Run Instructions](#-setup--run-instructions)
  - [Prerequisites](#prerequisites)
  - [1. Server Setup](#1-server-setup)
  - [2. Client Setup](#2-client-setup)
- [API Reference](#-api-reference)
- [Draft Database Schema](#-draft-database-schema)
- [Accessibility Design](#-accessibility-design)
- [Testing & Demo Samples](#-testing--demo-samples)
- [Credits & Acknowledgments](#-credits--acknowledgments)

---

## 🎯 Problem & Solution (PS003)

### The Problem
Job advertisements are frequently packed with corporate buzzwords, confusing abbreviations, ambiguous qualifications, and scattered application steps. For many capable candidates—including neurodivergent individuals and applicants using assistive technologies—this process induces cognitive overload and discourages applying.

### The AccessHire Solution
AccessHire creates a streamlined, low-stress bridge between job seekers and job postings:
1. **Plain Language Translation:** Summarizes job duties at approximately a grade 6 reading level using short, direct sentences.
2. **Three Input Methods:** Paste job text, upload a `.txt` or `.pdf` file (processed in-memory), or import directly from a public job page link.
3. **Candidate Compatibility Matching:** Compares required skills against the applicant's profile to provide an objective score (0–100) and rationale.
4. **Actionable Guided Checklist:** Converts confusing application instructions into sequential, manageable steps with saved checkbox progress.
5. **No Clutter:** Simple, beginner-readable architecture adhering to strict accessibility guidelines.

---

## ✨ Features Built So Far

- **Three Analysis Input Channels:**
  - **Paste Text:** Clean, labeled textarea supporting 200 to 12,000 characters.
  - **File Upload:** In-memory extraction for `.txt` (UTF-8) and `.pdf` (`pdf-parse`) up to 5 MB. Files are never saved to disk.
  - **URL Import:** Safe single-page fetch using Cheerio and JSON-LD schema parsing.
- **Candidate Profile Management:** View and edit personal skills, years of experience, education, professional summary, and accessibility preferences stored locally in `server/data/profile.json`.
- **Gemini AI Integration:** Powered by the official `@google/genai` package with `gemini-2.5-flash`, structured JSON enforcement, and automatic retry on invalid responses.
- **Saved Applications & Progress Tracking:** History of analyzed jobs stored locally in `server/data/applications.json` (capped at the newest 50 entries). Checkbox step completion is persistently updated via `PATCH`.
- **Accessibility Mode First Screen:** Full-page entry screen to select Voice assistance, Keyboard navigation, Screen reader friendly, or Simplified visual mode. The choice persists in localStorage and backend profile, with dynamic header indicators and a "Change mode" button.
- **Profile-First Navigation Flow:** Structured flow (Mode screen -> My profile -> Analyze a job -> Saved jobs). "Analyze a job" is guarded until the user completes their profile with a full name and at least one skill.
- **Zero-Score Rule:** When a compatibility score is 0, guided application steps and checklists are hidden, displaying an informative status card with missing skills and options to edit profile or try another job.
- **Keyboard & Screen Reader Accessibility:** 3px focus rings (4px in keyboard mode), keyboard tips panel, screen reader live announcements, skip-to-content link, semantic landmarks, and automatic focus management on navigation.
- **Global Keyboard Navigation Shortcuts:** Rapid two-key sequences (`g` then `p` for My Profile, `g` then `a` for Analyze a Job, `g` then `s` for Saved Jobs) active when not typing in editable fields. Pressing `?` opens shortcuts help, and `Esc` dismisses modals.
- **Accessible Shortcuts Modal with Focus Trap:** Modal dialog equipped with `role="dialog"`, `aria-modal="true"`, cyclic Tab/Shift+Tab focus trapping, and automatic focus restoration to the opener element upon closure.
- **Screen Reader Landmarks & Polish:** Fully labeled semantic regions (`banner`, `navigation`, `main`, `contentinfo`), active navigation state flagged with `aria-current="page"`, and descriptive accessible labels on all action controls.
- **Form Error Summary with Field Anchors:** The candidate profile form validates inputs upon submission and renders a prominent `role="alert"` error summary that shifts focus and provides clickable links jumping directly to invalid fields.
- **Polite Live Announcements:** Global `role="status"` polite live region announces view changes, analysis lifecycle events, results ready, profile updates, and job removals without disrupting screen reader reading flow.
- **Simplified Visual Mode (`data-mode="simplified"`):** Streamlined single-column experience with enlarged base text (>=20px), generous spacing, low-distraction styling, plain buttons, and non-essential content (such as secondary descriptions and footer) hidden.
- **One-Section-at-a-Time Results Stepper:** In simplified mode, analysis results are presented sequentially across 5 focused stages (Summary, Score, Documents, Information, Steps) with big Next/Back buttons and a "Section X of 5" status label.
- **Accessible Display Settings Panel:** An accessible, labelled panel toggled via a dedicated button, closable with the `Esc` key, and available across all application modes.
- **High-Contrast Theme (Contrast >= 7:1):** WCAG AAA-compliant dark theme featuring pure black background, light text, strong borders, and stateful toggle buttons with `aria-pressed`.
- **Customizable Root Text Scaling:** Dynamic text sizing buttons (smaller, normal, larger, largest) driven by CSS variables on `<html>`, persisted across sessions in `localStorage`.
- **Voice Assistance Mode:** Dedicated voice-driven and hands-free interface enabled when "Voice assistance mode" is selected.
  - **Speech Synthesis Output:** Integrated speech synthesis controls allowing users to read the plain English summary, all application steps, or individual guided wizard steps aloud, with immediate stop capability.
  - **Voice Command Recognition:** Built with native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), activated strictly on-demand via a manual "Start listening" button with flexible English phrase matching.
  - **Complete Action Set:** Hands-free execution for `"next step"`, `"previous step"`, `"mark done"`, `"read summary"`, `"read steps"`, `"stop"`, `"go to profile"`, `"go to analyze"`, `"go to saved jobs"`, and `"help"`.
  - **Accessible Live Status & Privacy:** Polite `role="status"` region announcing heard speech and executed commands, 44px touch targets, error handling with keyboard fallback, and cloud speech privacy notice.

---

## 🌐 URL Import Feature & Safety

AccessHire includes a minimal, safe **"Import from job page link"** input method:
- **Direct Single-Page Fetch:** Fetches only the single page supplied by the user without crawling or background spiders.
- **SSRF (Server-Side Request Forgery) Protection:** Resolves hostnames and strictly prohibits access to `localhost`, loopback (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local addresses (`169.254.0.0/16`).
- **Safe Fetch Limits:** 10-second timeout, maximum 3 redirects (with re-validated IP addresses), maximum 1.5 MB download size, and `text/html` content validation.
- **Extraction Order:**
  1. Inspects `<script type="application/ld+json">` for schema.org `JobPosting` data.
  2. Falls back to Cheerio semantic element parsing (`<main>`, `<article>`, `<body>`), removing scripts, navigation, forms, and headers.
- **Graceful Fallback:** If a site blocks automated fetching (HTTP 401, 403, 429), requires a login, or lacks readable text (< 200 characters), AccessHire returns a friendly 422 error and automatically shifts keyboard focus to the paste textarea.

---

## 🛠 Tech Stack

- **Frontend:**
  - React 19 (via Vite)
  - Plain Vanilla CSS (`src/styles/layout.css` and `src/styles/accessibility.css`)
  - No external CSS frameworks or Tailwind
- **Backend:**
  - Node.js (v18+) & Express.js
  - `@google/genai` (Official Google Gen AI SDK)
  - `cheerio` (HTML text parsing for URL imports)
  - `pdf-parse` (In-memory PDF text extraction)
  - `multer` (In-memory file upload handling)
  - `cors` & `dotenv`
- **Storage & Database:**
  - Local atomic JSON storage (`server/data/profile.json`, `server/data/applications.json`)
  - Draft MySQL schema (`db/schema.sql`) for future migration.

---

## 📂 Repository Structure

```text
accesshire-bytedynamo/
├── client/                     # React frontend (Vite)
│   ├── index.html              # HTML entry point with metadata
│   ├── package.json            # Client scripts & dependencies
│   ├── vite.config.js          # Vite config with /api proxy to localhost:5000
│   └── src/
│       ├── main.jsx            # React root mount
│       ├── App.jsx             # Thin state & view orchestrator
│       ├── api.js              # Lightweight fetch wrapper for all endpoints
│       ├── index.css           # CSS entry point importing sub-stylesheets
│       ├── styles/
│       │   ├── layout.css          # Look, cards, buttons, responsive design
│       │   └── accessibility.css   # Focus rings, skip link, sr-only, reduced motion
│       └── components/
│           ├── Header.jsx          # Site branding & project metadata
│           ├── JobInput.jsx        # Paste, file upload, & URL import forms
│           ├── Results.jsx         # SummaryCard, ScoreCard, GuidedApply checklist
│           ├── ProfileForm.jsx     # View & edit candidate profile
│           └── SavedJobs.jsx       # Saved applications list & progress
├── server/                     # Node.js + Express backend
│   ├── package.json            # Server dependencies & scripts
│   ├── index.js                # Root entry point delegating to src/index.js
│   ├── .env.example            # Environment variable template
│   ├── data/
│   │   ├── .gitkeep            # Version control placeholder
│   │   ├── profile.json        # Saved candidate profile (git-ignored)
│   │   └── applications.json   # Saved job analyses (git-ignored)
│   └── src/
│       ├── index.js            # Express server initialization & middleware
│       ├── storage.js          # Safe atomic file read/write helper
│       ├── routes/
│       │   ├── health.js           # GET /api/health
│       │   ├── analyze.js          # POST /api/analyze, /upload, /url
│       │   ├── profile.js          # GET /api/profile, PUT /api/profile
│       │   └── applications.js     # GET, PATCH, DELETE /api/applications
│       ├── services/
│       │   ├── gemini.js           # Gemini API integration & prompt engine
│       │   └── urlImport.js        # SSRF validation, fetching, & extraction
│       └── utils/
│           └── errorHandler.js     # Central error handler
├── db/
│   └── schema.sql              # Draft MySQL schema (not connected)
├── docs/
│   ├── architecture.md         # Text diagram & data flow explanations
│   └── samples/
│       └── sample-job.txt      # Realistic sample job posting for demos
├── .gitignore                  # Git ignore rules (protects .env and server/data/*.json)
└── README.md                   # Project documentation
```

---

## 🚀 Setup & Run Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Server Setup

Navigate to the `server/` directory:

```bash
cd server
npm install
```

Copy the environment template:

```bash
# On Windows (PowerShell):
Copy-Item .env.example .env

# On macOS/Linux:
cp .env.example .env
```

Open `.env` and add your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** The `.env` file is excluded in `.gitignore` and must never be committed to git.

Start the backend server:

```bash
# Development mode with auto-reload:
npm run dev

# Or production start:
npm start
```
*The server will run on **`http://localhost:5000`**.*

---

### 2. Client Setup

Open a second terminal window and navigate to `client/`:

```bash
cd client
npm install
npm run dev
```

*The Vite dev server will run on **`http://localhost:3000`**.*  
Open your browser to: **`http://localhost:3000/`**

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check returning `{ ok: true }`. |
| `/api/profile` | `GET` | Retrieve saved candidate profile. |
| `/api/profile` | `PUT` | Update and sanitize candidate profile fields. |
| `/api/analyze` | `POST` | Analyze raw pasted job description text (200–12,000 chars). |
| `/api/analyze/upload` | `POST` | Multipart upload for `.txt` or `.pdf` file (max 5 MB). |
| `/api/analyze/url` | `POST` | Import and analyze a single public job page link. |
| `/api/applications` | `GET` | List newest 50 saved analyses. |
| `/api/applications/:id` | `GET` | Retrieve full analysis details and checklist steps. |
| `/api/applications/:id` | `PATCH` | Update completed checklist steps: `{ completedSteps: [0, 1] }`. |
| `/api/applications/:id` | `DELETE` | Remove a saved job application. |

---

## 🧪 Testing & Demo Samples

### 2-Minute Quick Test Checklist
1. **Paste Flow:** In the "Analyze a Job" view, click **"Use Sample Job"** to load the built-in sample text, then click **"Analyze Job"**.
2. **Review Breakdown:** Confirm the Plain English Summary, Score Card (words + number), Documents Needed, and Guided Application Steps render.
3. **Step Checklist:** Toggle the "Mark step done" checkbox in the Guided Apply card. Switch to "Full Checklist View" to verify progress persists.
4. **File Upload:** In Method 2, upload [`docs/samples/sample-job.txt`](file:///c:/Users/Jassiya/accesshire-bytedynamo/docs/samples/sample-job.txt) and click **"Upload and Analyze"**.
5. **Profile Editing:** Click **"My Profile"** in the top navigation. Update your skills or experience, click **"Save Profile"**, and observe the confirmation message.
6. **Saved Jobs:** Click **"Saved Jobs"** in the navigation. Verify that your recent analyses are listed with scores and progress. Click **"Open Analysis"** to view any job.

### Public-Style URL Test Cases

#### Case 1: Working Public Job Page (Expected Behavior)
- **Target URL:** Any public, server-rendered job posting containing clean semantic HTML or schema.org `JobPosting` structured data.
- **Action:** Paste the link into "Method 3: Import from Link" and click "Import and Analyze".
- **Expected Behavior:** AccessHire fetches the page, extracts the job details via Cheerio/JSON-LD, sends the text to Gemini, saves the result with `sourceUrl`, and displays a "View original job page" link alongside the analysis.

#### Case 2: Blocked / JavaScript-Only Page (Expected Behavior)
- **Target URL:** A job page protected by anti-bot measures, requiring a login, or loaded purely via heavy client-side JavaScript (e.g. LinkedIn login walls).
- **Action:** Paste the link into "Method 3" and click "Import and Analyze".
- **Expected Behavior:** The backend safely catches the restriction (HTTP 401/403/429 or text < 200 characters) and returns HTTP 422 with the friendly message:
  > *"We could not read this page. Many job sites block automatic reading or need a login. Please paste the job description text instead."*
  The frontend announces this message in an accessible `role="alert"` box and automatically focuses the paste textarea so the user can immediately paste the text.

#### Case 3: Blocked Internal Address (SSRF Prevention)
- **Target URL:** `http://localhost:5000/api/health` or `http://192.168.1.1`
- **Expected Behavior:** The server halts DNS resolution on private/loopback IP ranges and immediately returns HTTP 403:
  > *"Access to local network and internal addresses is prohibited."*

---

## ♿ Accessibility Design

AccessHire was designed from the ground up to support accessible assistive technology:
- **Semantic Structure:** Native HTML5 landmark tags (`<header>`, `<nav aria-label>`, `<main>`, `<footer>`), valid heading hierarchy (`h1` > `h2` > `h3`), and native `<button>`, `<label for>`, `<fieldset>`, and `<legend>` elements.
- **Visual Focus Outlines:** High-visibility 3px blue focus rings with 3px offsets (`:focus-visible`) for all interactive elements.
- **Complete Keyboard Operability:** Every feature is usable using `Tab`, `Shift+Tab`, `Space`, and `Enter` alone.
- **Global Keyboard Shortcuts:** Fast single- and two-key shortcuts (`g` then `p` for Profile, `g` then `a` for Analyze, `g` then `s` for Saved Jobs, `?` for Help, `Esc` to close), automatically disabled while typing in fields.
- **Accessible Dialog with Focus Trap:** Shortcuts Help dialog uses `role="dialog"`, `aria-modal="true"`, keeps focus trapped within interactive elements, and restores focus to the opener on close.
- **Labelled Landmarks & Active Page:** Explicit `aria-label`s on every landmark (`header`, `nav`, `aside`, `main`, `footer`), paired with dynamic `aria-current="page"` on the active nav item.
- **Form Error Summary with Anchor Links:** Failed form submissions automatically shift focus to an error summary box with direct jump links to invalid inputs and inline error descriptions.
- **Real-Time Status Announcements:** Polite live regions (`aria-live="polite"`) announce background progress for loading, analysis results ready, saved updates, and job deletions.
- **Live Announcements:** Dynamic updates use `aria-live="polite"` regions and `role="status"`/`role="alert"` for real-time screen reader feedback.
- **Focus Management:** Navigation between views and analysis results shifts focus directly to the target heading (`tabIndex={-1}`) to keep assistive tech synchronized.
- **Accessible Text & Touch Targets:** All body copy is at least 16px with a 1.6 line height and contrast exceeding 4.5:1. Interactive touch targets are sized at >= 44px.
- **Reduced Motion:** Fully honors `prefers-reduced-motion: reduce`.

---

## 🤝 Credits & Acknowledgments

- **Team ByteDynamo** — Creators of AccessHire for the RepoForge Hackathon (Problem Statement PS003).
- **Google Gen AI SDK (`@google/genai`)** — Official SDK for Gemini model integration.
- **Google Gemini API (`gemini-2.5-flash`)** — AI engine for plain-language translation and compatibility scoring.
- **Cheerio** — Fast, lightweight HTML text extraction and JSON-LD schema parsing.
- **pdf-parse** — In-memory text extraction for PDF job descriptions.
- **Multer** — Safe in-memory multipart file upload processing.
- **Express.js & Node.js** — Backend web application framework.
- **React & Vite** — Modern frontend library and build tool.
- **Antigravity** — Advanced agentic development platform.
