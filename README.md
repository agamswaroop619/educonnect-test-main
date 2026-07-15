# Scholarly

> One portal. Every person in the school building.

---

## Elevator Pitch

Schools generate a constant stream of information — attendance records, homework, grades, fee dues, bus locations, circulars — and today that information lives in five different apps, a WhatsApp group, and a printed notice board. Scholarly brings it all into one clean, role-aware portal. Students track their own progress. Parents stay in the loop without calling the school office. Teachers manage their class in seconds. Admins broadcast to everyone from a single place. No friction. No redundant tools.

---

## What Scholarly does for each user

### 🎒 Students
The student's personal academic hub. From the home dashboard they get an instant read on where they stand — attendance streak, CGPA, pending tasks for today, and days left in the academic year — all in one glance. Drilling deeper, they can track chapter-by-chapter progress across every subject, check homework deadlines, review their report card with teacher remarks, see their weekly timetable, manage leave requests, and even chat with an AI assistant when they're stuck on a problem.

### 👨‍👩‍👧 Parents
Parents get a real-time window into their child's school life without having to call anyone. They can check whether their child attended class today, see pending or overdue assignments, review the term report card, confirm the bus is on its way, and stay on top of fee dues and payment history. Anything the school sends out — circulars, event notices — lands here too. One place, always up to date.

### 🧑‍🏫 Teachers
Teachers see their class the way a coach sees a scoreboard. The class overview page lists every student with attendance bars, CGPA, and a trend indicator (improving, stable, declining). Students who need attention are automatically flagged. Teachers can drill into subject-level class averages, communicate directly with students and parents, and post announcements. Less admin overhead, more time for teaching.

### 🏫 School Admins
Admins get a bird's-eye view of the school. They can broadcast circulars to all users, manage the school calendar (holidays, exams, PTMs), and review class-level performance summaries. The role-based access system means they see the full picture where teachers and parents only see what's relevant to them.

---

## Tech Stack

### Core Framework & Runtime

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component model |
| TypeScript | 5.8 | Type safety across the entire codebase |
| TanStack Start | 1.168 | SSR-capable full-stack React framework (Vite + Nitro) |
| TanStack Router | 1.170 | File-based type-safe routing |
| TanStack Query | 5.101 | Server state management and data fetching |
| Vite | 8.0 | Dev server and build tool |
| Nitro | 3.0 | Server runtime for SSR and deployment |

### UI & Styling

| Technology | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4.2 | Utility-first styling |
| tw-animate-css | 1.3 | CSS animation utilities (fade, slide, zoom) |
| Radix UI | various | Accessible, unstyled UI primitives (dialogs, dropdowns, switches, etc.) |
| shadcn/ui | — | Component layer built on top of Radix UI |
| Lucide React | 0.575 | Icon library |
| Bricolage Grotesque + Inter | — | Display and body typefaces (Google Fonts) |
| class-variance-authority | 0.7 | Variant-driven component styling |
| tailwind-merge | 3.5 | Safe Tailwind class merging |
| clsx | 2.1 | Conditional class names |

### Data Visualisation & Forms

| Technology | Version | Purpose |
|---|---|---|
| Recharts | 2.15 | Bar charts, line charts (attendance trends, CGPA) |
| React Hook Form | 7.71 | Form state and validation |
| Zod | 3.24 | Schema validation |
| date-fns | 4.1 | Date formatting and manipulation |

### UX & Interaction

| Technology | Version | Purpose |
|---|---|---|
| Sonner | 2.0 | Toast notifications |
| Vaul | 1.1 | Drawer / bottom-sheet component |
| Embla Carousel | 8.6 | Touch-friendly carousels |
| cmdk | 1.1 | Command palette |
| input-otp | 1.4 | OTP input field |
| react-resizable-panels | 4.6 | Resizable split-pane layouts |
| react-day-picker | 9.14 | Calendar date picker |

### Tooling & Quality

| Technology | Version | Purpose |
|---|---|---|
| ESLint | 9.32 | Linting |
| Prettier | 3.7 | Code formatting |
| typescript-eslint | 8.56 | TypeScript-aware lint rules |
| vite-tsconfig-paths | 6.0 | `@/` path alias resolution |

---

## Scope of Project

### AI-Powered Features
- **AI-generated notes** — Student picks a subject and chapter; AI returns structured notes, key definitions, and a mnemonic
- **Assignment correction** — Upload a photo of handwritten work or paste text; AI scores it, highlights mistakes, and suggests what to revise
- **Smart quiz generator** — Generates MCQs or short-answer questions for any chapter with instant explanations for wrong answers
- **Personalised study planner** — Combines pending homework, exam dates, and subject progress to generate a day-by-day 7-day study schedule
- **Report card summariser** — One-click AI summary of the term's performance, with a draft parent communication email
- **AI doubt solver with image support** — GPT-4o Vision for answering questions from textbook photos, with LaTeX math rendering

### Platform Expansion
- **Real backend** — Replace mock data with a database (PostgreSQL + Prisma) and a REST or tRPC API layer
- **Push notifications** — Browser and mobile push for homework reminders, fee dues, transport delays
- **Offline support** — PWA with service workers so the app works without internet (common in low-connectivity school environments)
- **Mobile apps** — React Native port sharing the same API and design system

### School Operations
- **Attendance risk predictor** — Flags students at risk of falling below the 75% threshold with recommended actions
- **Exam scheduling and results** — Full exam management workflow from scheduling to result publication
- **Fee payment gateway** — Integrate Razorpay or PayU for in-app fee payments
- **Scholarship matcher** — AI scans the fee profile and surfaces applicable government scholarship schemes
- **Staff management** — Teacher schedules, substitution management, HR module for admins

### Communication
- **Parent-teacher meeting booking** — Online slot booking for PTMs instead of paper tokens
- **Voice messages** — Audio clips in the messaging thread for quick parent-teacher communication
- **Multilingual support** — UI in Hindi, Tamil, Telugu and other regional languages, critical for parent adoption in India
