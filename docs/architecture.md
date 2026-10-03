# AccessHire - Architecture & Data Flow
**Team ByteDynamo | RepoForge Hackathon | PS003**

This document outlines the high-level architecture, module breakdown, and data flow for AccessHire, an accessible job application assistant.

---

## 1. System Overview Diagram

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|   React (Vite) + Plain CSS (layout.css, accessibility.css)                        |
|                                                                                   |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   |   Analyze View    |  |  My Profile View   |  |      Saved Jobs View       |   |
|   |  - Paste Text     |  | - Full Name, Email |  | - History of analyses      |   |
|   |  - Upload .txt/.pdf  | - Skills, Exp, Edu |  | - Open saved analysis      |   |
|   |  - Import from URL|  | - Accessibility Pref  | - Step progress tracking   |   |
|   +---------+---------+  +---------+----------+  +-------------+--------------+   |
+-------------|----------------------|---------------------------|------------------+
              |                      |                           |
              | HTTP POST /api/analyze* | HTTP GET/PUT /api/profile | HTTP GET/PATCH /api/applications*
              v                      v                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND API (Node + Express)                          |
|   server/src/index.js (Port 5000, CORS restricted, 1MB limit, Error Handler)      |
|                                                                                   |
|   +--------------------------+  +----------------------+  +-------------------+   |
|   |     Analyze Routes       |  |    Profile Routes    |  | Applications Route|   |
|   |  POST /api/analyze       |  |  GET /api/profile    |  | GET /api/apps     |   |
|   |  POST /api/analyze/upload|  |  PUT /api/profile    |  | GET /api/apps/:id |   |
|   |  POST /api/analyze/url   |  +----------+-----------+  | PATCH /api/apps/:id   |
|   +-------------+------------+             |              +---------+---------+   |
|                 |                          |                        |             |
|                 v                          v                        v             |
|   +--------------------------+  +---------------------------------------------+   |
|   |       Services           |  |                 Storage                     |   |
|   | - urlImport.js           |  | server/src/storage.js                       |   |
|   |   (SSRF, fetch, cheerio) |  | (Safe atomic JSON read/write)               |   |
|   | - gemini.js              |  |  -> server/data/profile.json                |   |
|   |   (@google/genai SDK)    |  |  -> server/data/applications.json           |   |
|   +-------------+------------+  +---------------------------------------------+   |
+-----------------|-----------------------------------------------------------------+
                  |
                  v
+-----------------------------------------------------------------------------------+
|                              EXTERNAL SERVICES                                    |
|   Google Gemini API (gemini-2.5-flash) via @google/genai                          |
|   - Plain English generation (Grade 6 level)                                      |
|   - Skill matching & compatibility scoring                                        |
|   - Document & checklist generation                                               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component & Service Breakdown

### Frontend (`/client`)
- **`App.jsx`**: Thin orchestrator managing the 3 active views (`analyze`, `profile`, `saved`), current analysis state, and accessible focus management when navigating.
- **`api.js`**: Clean `fetch` helper for all backend endpoints.
- **`components/JobInput.jsx`**: Handles the 3 input methods:
  1. Paste textarea (200–12,000 characters).
  2. File upload (`.txt`, `.pdf` up to 5 MB).
  3. URL import with SSRF safety and user fallback.
- **`components/Results.jsx`**: Renders analysis breakdown:
  - `SummaryCard`: Plain simple English summary.
  - `ScoreCard`: Match score (0–100) with descriptive words, matched skills, and missing skills.
  - `DocumentsList` & `InformationNeeded`: Clear itemized requirements.
  - `GuidedApply`: Step-by-step application walkthrough with persistent checklist checkboxes.
- **`components/ProfileForm.jsx`**: View and edit candidate profile information.
- **`components/SavedJobs.jsx`**: Review past analyses and monitor checklist progress.
- **`styles/accessibility.css` & `styles/layout.css`**: Separated CSS files providing WCAG AA compliant contrast, 3px visible focus rings, touch targets, and reduced motion support.

### Backend (`/server`)
- **`server/src/index.js`**: Express server mounting modular routes with CORS restricted to localhost, 1 MB JSON payload limit, and central error handling without stack trace leaks.
- **`server/src/services/gemini.js`**: Connects to the Gemini API using `@google/genai`. Supplies system instructions for grade 6 plain English, constructs candidate profile comparison, and safely normalizes JSON results.
- **`server/src/services/urlImport.js`**: Safe single-page job importer:
  - **SSRF Protection:** Resolves hostname and rejects private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), and link-local addresses.
  - **Redirect Safety:** Enforces maximum of 3 redirects, re-validating IP addresses on every hop.
  - **Cheerio & JSON-LD Extraction:** Parses schema.org `JobPosting` structured data or extracts clean text from `<main>`, `<article>`, or `<body>`.
- **`server/src/storage.js`**: Local atomic storage helper (`profile.json`, `applications.json`). Uses temp files and atomic renames to prevent partial write corruption.
- **`db/schema.sql`**: Draft relational MySQL schema designing `profiles`, `profile_skills`, `job_analyses`, `analysis_steps`, and `checklist_progress`.

---

## 3. Detailed Data Flows

### A. Paste Flow
1. User pastes job text (>= 200 characters) in `JobInput`.
2. Client sends `POST /api/analyze` with `{ jobText }`.
3. Express validates length and loads the saved candidate profile from `storage.js`.
4. `gemini.js` formats the prompt with profile details and job description.
5. Gemini model processes the prompt and returns structured JSON.
6. Server normalizes the result, generates an application ID, and saves it to `applications.json`.
7. Client receives the response, renders `Results`, and announces the update via `aria-live="polite"`.

### B. File Upload Flow (.txt / .pdf)
1. User selects a `.txt` or `.pdf` file in `JobInput` (<= 5 MB).
2. Client sends `POST /api/analyze/upload` via `multipart/form-data`.
3. Multer buffers the file in memory (no disk write).
4. For `.txt`, text is decoded as UTF-8. For `.pdf`, `pdf-parse` extracts textual content.
5. If the PDF is scanned or lacks extractable text, a 422 error is returned asking the user to paste text.
6. The extracted text is passed to the common `analyzeJob` service and auto-saved.

### C. URL Import Flow
1. User provides a public job page URL in `JobInput`.
2. Client sends `POST /api/analyze/url` with `{ url }`.
3. `urlImport.js` validates URL syntax, resolves DNS, and blocks private/loopback/link-local IP addresses.
4. Server performs HTTP GET with a 10s timeout, checking Content-Type (`text/html`) and following at most 3 safe redirects.
5. Text is extracted from JSON-LD schema or cleaned HTML (scripts, nav, and styling removed).
6. If the page is blocked (HTTP 401/403/429) or lacks readable text (< 200 chars), a friendly 422 message directs the user to paste instead.
7. Valid text is passed to `analyzeJob`, saved with `sourceUrl`, and returned to the client.

### D. Progress Tracking Flow
1. User marks a checklist step as completed in `GuidedApply`.
2. Client immediately updates local state and issues `PATCH /api/applications/:id` with `{ completedSteps: [0, 1] }`.
3. Server updates `applications.json` atomically and confirms save status.
