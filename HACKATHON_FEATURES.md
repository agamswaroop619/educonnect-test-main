# Hackathon Feature Ideas — Scholarly

A prioritised list of AI and smart integrations that can be demoed live. Each entry notes which existing page it plugs into, the core API/model needed, and rough implementation complexity.

---

## Tier 1 — High Impact, Buildable in a Few Hours

These are the ones to lead with in your demo.

### 1. AI-Generated Notes
**Page:** Courses / AI Assistant  
**What it does:** Student picks a subject + chapter → AI returns structured notes: key definitions, concept summary, 3–5 bullet takeaways, and a mnemonic or analogy.  
**API:** OpenAI GPT-4o / Gemini Flash with a structured JSON prompt  
**Why it wins:** Directly solves the #1 student pain point. Flashcard export (CSV/PDF) is a quick bonus add-on.

---

### 2. Assignment Correction & Feedback
**Page:** Homework  
**What it does:** Student uploads a photo or pastes text of their answer → AI compares against expected solution, highlights mistakes, gives a score out of 10, and suggests what to revise.  
**API:** GPT-4o Vision (for handwritten/photo answers) or text-only GPT-4o  
**Why it wins:** Tangible, emotional demo — paste a wrong answer and watch it get corrected in real time.

---

### 3. Smart Quiz Generator
**Page:** Courses (new "Practice" tab per subject)  
**What it does:** Pick a chapter and difficulty → AI generates 5–10 MCQs or short-answer questions. Student answers inline, gets instant explanations for wrong answers.  
**API:** GPT-4o with function calling to return structured `{ question, options[], correct, explanation }`  
**Why it wins:** Full interactive loop — generate → attempt → review — all in one screen.

---

### 4. Attendance Risk Predictor
**Page:** Attendance  
**What it does:** Given the student's monthly attendance trend (already in mock data), a small ML model or LLM prompt flags if they're at risk of falling below the 75% threshold, and suggests which upcoming classes they must not miss.  
**API:** GPT-4o with attendance JSON passed in context, OR a simple rule-based model  
**Why it wins:** Proactive, not reactive. Easy to visualise — add a red/amber/green "Risk" badge to the existing ProgressRing.

---

### 5. Personalised Study Planner
**Page:** Home / Calendar  
**What it does:** Feed in pending homework, exam dates (from calendar), and subject progress percentages → AI outputs a day-by-day study schedule for the next 7 days, respecting the timetable's free periods.  
**API:** GPT-4o with all relevant mock data injected as context  
**Why it wins:** Combines 4 existing data sources (homework, calendar, timetable, courses) into one high-value output. Very demo-friendly.

---

## Tier 2 — Strong, Slightly More Work

Worth building if you have time after Tier 1.

### 6. AI Report Card Summariser + Parent Letter
**Page:** Reports  
**What it does:** One-click → AI writes a plain-language summary of the term's performance ("Atam excelled in Maths but needs more practice in Chemistry organic reactions…") and drafts a parent communication email.  
**API:** GPT-4o with the full `reports` mock data as context  
**Why it wins:** Saves teachers hours of writing. Dual audience (student + parent) makes it feel complete.

---

### 7. Handwriting / OCR Homework Scanner
**Page:** Homework (new "Scan & Submit" button)  
**What it does:** Student takes a photo of handwritten work → OCR extracts text → feeds into the assignment correction feature (Feature 2). Two-step pipeline.  
**API:** Google Cloud Vision API or Tesseract.js (client-side) for OCR, then GPT-4o for correction  
**Why it wins:** Bridges the physical–digital gap. Handwritten work is the norm in Indian schools.

---

### 8. AI Doubt Solver with Diagram Support
**Page:** AI Assistant (upgrade existing chat)  
**What it does:** Upgrade the current dummy chat to a real GPT-4o Vision call. Student can paste a question or upload a textbook photo. AI explains step-by-step with LaTeX rendering for equations.  
**API:** GPT-4o Vision + KaTeX or MathJax for rendering  
**Why it wins:** The AI Assistant page already exists — this is a drop-in upgrade, not a new page.

---

### 9. Smart Library Recommender
**Page:** Library  
**What it does:** Based on the student's subjects, current chapters, and reading history → AI recommends 3–5 books or articles from a curated list. Adds a "Recommended for You" section.  
**API:** GPT-4o with reading history + subject context, or a simple embedding similarity search  
**Why it wins:** Low effort, high polish. Recommenders always demo well.

---

### 10. Fee Anomaly & Scholarship Matcher
**Page:** Fees  
**What it does:** AI scans the fee structure + family profile and surfaces applicable government scholarships or fee-waiver schemes (based on a scraped/static dataset of schemes), with a one-click "Apply" stub.  
**API:** GPT-4o RAG over a static JSON of scholarship schemes  
**Why it wins:** High social impact angle, very relevant for the Indian school context.

---

## Tier 3 — Demo-Worthy Extras (Quick Wins)

Short to build, good for filling out the demo narrative.

### 11. Mood / Wellbeing Check-in
**Page:** Home (widget)  
**What it does:** Daily one-tap emoji mood log. If student logs negative mood 3 days in a row, the AI writes a short supportive message and suggests a counsellor visit.  
**API:** GPT-4o for the message; mood data stored in `localStorage`  

---

### 12. Teacher Feedback Tone Analyser
**Page:** Messages  
**What it does:** Paste or receive a teacher message → AI flags tone (encouraging / neutral / concerning) and suggests a polite reply.  
**API:** GPT-4o sentiment + reply draft  

---

### 13. Transport ETA Notification (Real-time)
**Page:** Transport  
**What it does:** Mock a WebSocket feed that updates bus position every few seconds. AI predicts delay based on "traffic conditions" (a random jitter) and pushes a browser notification.  
**API:** No external AI needed — simple simulation + Web Notifications API  

---

### 14. Voice-to-Question (Speech Input)
**Page:** AI Assistant  
**What it does:** Microphone button → Web Speech API transcribes student's spoken question → sends to GPT-4o → reads answer back via Web Speech Synthesis.  
**API:** Browser-native Web Speech API (no cost), GPT-4o for the answer  

---

### 15. Automated Circular Summariser
**Page:** Circulars  
**What it does:** Long PDF circular → AI extracts: date, action required, deadline, and a one-line TLDR. Shows a "Summary" chip next to each circular.  
**API:** GPT-4o with circular text as context; PDF.js for parsing  

---

## Recommended Demo Stack for the Hackathon

| Layer | Choice |
|---|---|
| AI API | OpenAI GPT-4o (vision + text) |
| Fallback / cheaper | Google Gemini 1.5 Flash |
| OCR | Tesseract.js (client-side, no API key needed) |
| Math rendering | KaTeX |
| State | React `useState` + `localStorage` (no backend needed for demo) |
| PDF parsing | PDF.js |

---

## Suggested Demo Flow (5-minute pitch)

1. **Home** → Personalised study planner generates today's schedule (Feature 5)
2. **Homework** → Upload photo of a wrong answer → AI corrects it (Features 2 + 7)
3. **Courses** → Generate chapter notes for "Trigonometry" in 3 seconds (Feature 1)
4. **Courses** → Run a 5-question quiz on the same chapter (Feature 3)
5. **Reports** → One-click parent letter (Feature 6)
6. **AI Assistant** → Voice question → spoken answer (Feature 14)

This arc shows the full student journey — plan, attempt, learn, review, communicate — all AI-assisted.
