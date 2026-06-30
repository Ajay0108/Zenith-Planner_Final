Zenith Planner — Hackathon Submission Document
Vibe2Ship Hackathon | Team: Zenith | Submitted by: Ajay

[!IMPORTANT]
🔑 Judge / Reviewer Test Account
To experience the full app with pre-loaded data, please use the dedicated test account below:

Field
Details
Live App URL
https://zenith-planner-454285673626.us-central1.run.app
Login Email
test@zenithplanner.com
Password
Zenith@2026
GitHub Repo
https://github.com/Ajay0108/Zenith-Planner_Final


Click "Sign In with Email" on the login screen and use the credentials above. Alternatively, click "Continue as Guest" for the offline demo mode.

📌 Executive Summary
Zenith Planner is an AI-powered, full-stack productivity and life-management application built to solve one of the most universal human problems: the inability to effectively prioritize what truly matters in a chaotic, information-overloaded world.

Most productivity apps are simple to-do lists. Zenith Planner is not. It combines the classic Eisenhower Priority Matrix, Ikigai life-purpose philosophy, Google Gemini 2.5 Flash AI, Google Calendar, Gmail intelligence, and a behavioral learning engine — all in one seamless, beautiful experience.

Users can dump their thoughts in any form — text, voice, or image — and Zenith's AI will automatically parse, categorize, schedule, and prioritize every task intelligently. The result: less mental overhead, more intentional action.

Live URL: https://zenith-planner-454285673626.us-central1.run.app GitHub Repository: https://github.com/Ajay0108/Zenith-Planner_Final Test Account Email: test@zenithplanner.com | Password: Zenith@2026


🏗️ Tech Stack
Layer
Technology
Frontend
React 18 + TypeScript + Vite
Styling
Vanilla CSS + Tailwind Utility Classes
Backend
Node.js + Express.js (TypeScript)
AI Engine
Google Gemini 2.5 Flash (@google/genai)
Authentication
Firebase Auth (Google SSO, Email/Password, Anonymous/Guest)
Database
Firebase Cloud Firestore (real-time, per-user sync)
Hosting
Google Cloud Run (serverless, auto-scaling)
CI/CD
GitHub → Google Cloud Build → Cloud Run
APIs
Google Calendar API, Gmail API, Google OAuth 2.0



🚀 Core Features — Full Breakdown
1. 🧠 AI-Powered Brain Dump Portal
The signature feature of Zenith Planner. Users can dump anything — a chaotic wall of text, a list of tasks, a voice transcription, or even a photo of a handwritten to-do list — into the AI portal.

What happens next (fully automated):

Gemini 2.5 Flash parses the raw input using a multi-step Chain of Thought reasoning process.
It identifies every distinct task, even from a single complex sentence.
It splits multiple tasks automatically using intelligent NLP separators (connectors like "and", "then", "phir", "aur", "uske baad" — including Hinglish/Hindi support).
Sentences ending with . are treated as new task boundaries.
Each task is classified, categorized, and scheduled autonomously.
Repetitive tasks (e.g., "feed dog thrice a day") generate multiple separate tasks with intelligently spaced timelines (Morning, Afternoon, Evening).

Fallback Intelligence (Offline Mode): If the Gemini API is unavailable, a custom offline fallback parser activates instantly. It uses a rule-based NLP engine with persona-aware categorization to ensure the app never fails or crashes, even without an internet connection.


2. 🗂️ Eisenhower Priority Matrix — Bento Grid
The core productivity framework of Zenith, visualized as a premium 6-box Bento Grid dashboard:

Box
Category
Purpose
#1
Urgent & Important
Do First — Critical deadlines
#2
Important Not Urgent
Schedule — Long-term goals
#3
Urgent Not Important
Delegate — Interruptions
#4
Not Urgent / Important
Eliminate — Distractions
#5
Ikigai
Life Purpose — Passion tasks
#6
Personal Notes
General reminders & fallbacks


Each box is color-themed, scrollable, and dynamically populated from the live task state.
Tasks can be completed or deleted directly from the matrix.
Tasks can be added quickly from within each quadrant.
A "Note to Self" textarea sits below the grid for personal reflections and stream-of-consciousness writing, auto-saved to cloud.


3. 🎭 Persona-Adaptive AI
Users select their life role/persona, and the AI changes its entire categorization logic:

Student / Learner: Exams → Q1, Study sessions → Q2, Campus socializing → Q3
Business Owner / Entrepreneur: Client meetings → Q1, Strategy planning → Q2
Tech Professional / Developer: Production bugs → Q1, Architecture work → Q2
Retired Individual: Medical appointments → Q1, Memoir writing → Q2
Universal Rules: Well-being tasks (gym, yoga, family, pets) always map to Ikigai — never miscategorized.

The AI persona engine works for all input types: text, voice, and image.


4. 🔗 Google Workspace Integration
Google Calendar Sync
Fetches real Google Calendar events via OAuth 2.0 and the Google Calendar REST API.
Displays a live calendar mini-view in the sidebar.
Gemini AI reads the calendar context before scheduling new tasks to avoid conflicts.
Gmail Intelligence
Fetches latest unread Gmail messages using the Gmail REST API.
Gemini 2.5 Flash analyzes email content and automatically extracts actionable tasks from emails.
Extracted tasks are categorized and added directly into the Priority Matrix.


5. 💬 Gemini AI Assistant Bar (Header) — with Deep Dive Redirection
A persistent conversational AI assistant in the top header bar. Users can:

Ask questions like "Summarize my tasks for today"
Give voice or image inputs directly to the AI.
Get back a friendly reply plus auto-scheduled tasks added to the Matrix.
The AI bar reads calendar context + task list + behavioral patterns + persona for intelligent, context-aware responses.

New: Open-Ended Question Detection & Gemini Deep Dive:

If a user asks an open-ended question — "How should I approach this?", "How can I fix that?", "How to get started?" — the AI detects this intent.
It first creates a relevant task in the Matrix (so the action is tracked).
Then it appends a smart deep-dive prompt in the reply: "If you want to deep dive or research this further, click the Gemini Sparkles icon on the left to chat directly with Gemini!"
The Sparkles (✨) icon on the left side of the Gemini Bar is now a live clickable link that opens gemini.google.com in a new tab for unlimited, full-depth AI research.
This creates a seamless handoff: Zenith handles your structured task management, and Gemini handles your open-ended research and exploration.


6. 🏅 Gamification & Reward System
To make productivity addictive, Zenith has a full gamification layer:

Points System: Every task category awards points (Ikigai = 75pts, Urgent & Important = 40pts, Personal Notes = 5pts).
Streak Tracker: Daily login streaks are tracked and displayed.
Rank System: Users climb through named ranks (e.g., Focus Alchemist, Zenith Master) based on total points earned.
Rewards View: A dedicated rewards tab shows progress, badges, and milestones.




7. 🍅 Pomodoro Timer (Integrated Focus Mode)
A fully functional Pomodoro timer built into the app:

Configurable work and break durations.
Tracks Pomodoro sessions and break counts in the user stats.
Works seamlessly alongside the task list for focused execution.


8. 📊 Dashboard & Behavioral Learning Engine
The Dashboard View provides:

Visual task completion analytics.
AI Behavioral Insights that learn from user completion patterns:
"Morning Deep Work Bias: You complete 3x more focus tasks before 12 PM."
"Afternoon Execution Window: Urgent tasks handled best 12–5 PM."
Pattern data is stored per-user and used by the Gemini AI to make smarter scheduling recommendations over time.


9. 👤 Multi-Mode Authentication (All Account Types)
Zenith supports three distinct user modes:

Mode
Storage
Features
Google Sign-In (Gmail)
Firestore cloud sync
Full features + Calendar + Gmail
Email/Password Account
Firestore cloud sync
Full features (no workspace APIs)
Guest / Offline Mode
Browser LocalStorage
100% offline, all core features


All bug fixes, AI improvements, and UI upgrades apply equally to all three user types — no feature is gated unfairly.


10. 🔒 Smart Guardrails & UX Protections
Several intelligent safety systems protect data quality:

50-Task Limit: Maximum 50 active tasks enforced to maintain focus and prevent overwhelm.
Duplicate Task Detection: If the same task title (case-insensitive) is added again, a popup warns the user and blocks the duplicate.
Duplicate File Upload Warning: If the same image is uploaded twice to the AI portal, the system detects and warns the user.
Manual Task Categorization Bypass (skipAutoCategorize): When a user manually selects a category while adding a task, the AI does NOT override it. User choice always wins.
Title Tooltip: Long task titles that are truncated in the UI show the full text on mouse hover.
Rate Limiting: The backend API has a rate limiter (100 requests/15 min) to prevent abuse.


11. 🎯 Habit Tracker
15-day visual habit calendar.
Tracks daily login and task completion consistency.
Displays streaks and daily habit notes.


12. 🔔 Notifications View
Displays Gmail messages pulled from the user's inbox.
Shows workspace notifications and AI-extracted email task summaries.


🧩 How Zenith Solves the Core Problem
The Problem: People are overwhelmed by tasks but don't know what to work on first. Existing tools (Notion, Todoist, etc.) require significant manual setup and categorization effort. Users often add tasks but never prioritize them, leading to procrastination and burnout.

Zenith's Solution (The "Why It's Better" Argument):

Traditional Apps
Zenith Planner
Manual task entry, manual category selection
AI auto-categorizes from any raw input (text, voice, photo)
Flat to-do lists with no strategic framework
Eisenhower Matrix + Ikigai fusion — scientifically backed prioritization
No understanding of context
Reads your calendar, email, and past behavior before suggesting anything
One-size-fits-all logic
Persona-adaptive AI changes its entire brain for each user role
Works only when online
Intelligent offline fallback — app never crashes or fails
No behavioral learning
AI learns your productivity patterns and adapts scheduling
Gamification is an afterthought
Points, ranks, streaks built into the core loop


In short: Zenith is the only productivity app that understands you — your role, your schedule, your behavior, your goals — and proactively organizes your life so you don't have to.


🌐 System Architecture
User Input (Text / Voice / Photo)

        ↓

React Frontend (Vite + TypeScript)

        ↓

Express.js Backend (Node.js)

        ↓

Google Gemini 2.5 Flash API

  ├─ /api/gemini/categorize  → Brain Dump parsing

  ├─ /api/gemini/chat        → Assistant bar conversation

  ├─ /api/gemini/classify    → Single task classification

  └─ /api/workspace/*        → Calendar + Gmail integration

        ↓

Firebase Firestore (per-user cloud storage)

        ↓

Google Cloud Run (Serverless hosting, auto-scales to zero)


📈 Impact & Potential
Target Users: Students, professionals, entrepreneurs, retirees — anyone with a task backlog.
Accessibility: Works fully offline for users without constant internet access.
Scalability: Cloud Run auto-scales to zero cost when idle, and handles bursts automatically.
Extensibility: The persona system, Gemini prompts, and behavioral engine can be extended with minimal code.
International: Hinglish/Hindi multi-language input already supported in the AI parser — global-ready.


👨‍💻 Developer
Ajay — Full-stack developer, AI integration, UX design, cloud deployment.

Built with ❤️ using Google Gemini AI, Firebase, and Google Cloud Run.



Document Version: 1.0 | Date: June 30, 2026

