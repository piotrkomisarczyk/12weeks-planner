You are an AI code generator tasked with creating a minimal Proof of Concept (PoC) for the 12 Weeks Planner web application. This application is a tool for planning and monitoring long-term goals over 12 weeks. The PoC should verify the basic MVP functionality, focusing exclusively on core elements: creating and managing a 12-week planner, defining goals with tasks, basic weekly and daily task management (with priorities and states), and simple navigation views (dashboard, goals, week, day). Exclude all non-essential features such as: planner sharing, search, timeboxing, external integrations (e.g., calendar, notifications), automatic progress calculation, advanced weekly summaries with reflection, planner archiving, language switching, summary navigation, error handling beyond basic validations, and full mobile responsiveness. The PoC doesn't need to be fully production-ready – focus on a working prototype that allows users to register, create a planner, add goals and tasks, and view them in basic views. Use the following tech stack: Frontend (TypeScript 5, Astro 5, Tailwind 4, Shadcn/ui, React 19); Backend (Supabase for PostgreSQL database and SDK); CI/CD and hosting (Github Actions, DigitalOcean – but in the PoC focus on local/hosted Supabase setup). The application should be available in English (no Polish support in PoC).
MVP Description (abbreviated from PRD.md, focused on basics):
Planner Management: Creating a 12-week planner (starting from Monday of the current week, default name "Planner\_[date]"). Navigation: planner list on dashboard (previous/next). Validation: min. 1 goal per planner.
Goals: 1-5 goals per planner, each with a title, justification (textarea), manual progress bar (slider 0-100%), and up to 5 tasks (milestones) with deadlines (date picker). Dashboard visualization with goal list and progress.
Weekly Tasks: In week view: 1 main task (linked to goals/milestones), up to 10 subtasks, up to 10 ad-hoc tasks (unlinked). Priorities: A/B/C (dropdown). States: to do, in progress, completed, cancelled, moved (SVG icons with ARIA labels). Ability to assign tasks to days via context menu. No drag-and-drop in PoC.
Day View: For selected day: 1 most important task, 2 secondary (linked to goals), 7 additional (ad-hoc or extra). Copy tasks between days preserving state history (simple database duplication). Change states with icon (cycle through). Slot limits.
Views and Navigation: Dashboard: hierarchy tree (expand/collapse) with goals and tasks (ad-hoc under 'ad-hoc' node); links to views (goals, week, day). Goals view: edit goals/tasks. Week view: task planning. Day view: task list with navigation (previous/next day, date picker within planner range). Week number displayed at top of views. No summaries in PoC.
Database (Supabase): Tables: users (automatic with Auth), planners (name, start date, user_id), goals (title, justification, progress, planner_id), tasks (title, priority, state, type: weekly/daily/ad-hoc, relationships: goal_id/task_id, assignment date). Use foreign keys for hierarchy. Manual records (no auto-calc).

Instructions for You (the generator):
Plan the work before coding: Before starting the PoC creation, prepare a detailed plan in markdown format:
Step 1: Project setup (Astro + Supabase initialization, dependency installation: TypeScript, Tailwind, Shadcn/ui, React). Describe folder structure (e.g., src/pages for views, src/components for UI, supabase config).
Step 2: Backend implementation (Supabase database schema: tables and relationships).
Step 3: Basic frontend views (dashboard, routing in Astro).
Step 4: Integration (CRUD for planners/goals/tasks via Supabase client; states and priorities in React components).
Step 5: PoC testing (manual: registration → planner → goals → tasks → views; edge cases like limits, validations).
PoC Scope: List exactly what will be implemented (e.g., "Planner creation with validation", but "No task copying between weeks"). Estimated time/number of files.
Risks and Assumptions: E.g., local Supabase for dev, no CI/CD in PoC.
Send this plan to the user and wait for their acceptance or feedback. Do not proceed to coding until you receive approval (e.g., "OK, go ahead" or change suggestions). If accepted, confirm and start generating code step by step (each step as a separate message with code in markdown blocks, with explanations).
Generating PoC after acceptance:
Generate code modularly: first setup, then core features. Use TypeScript for types (e.g., interfaces for Goal, Task).
UI: Simple, desktop-responsive (Tailwind + Shadcn/ui components like Button, Input, Slider, Select). Icons for states (e.g., Lucide React).
Validations: Basic (e.g., min. 1 goal, limits via form libraries like React Hook Form).
Errors: Show toasts/alerts for validations (use sonner or similar).
Deployment: Instructions for running locally (npm run dev) and Supabase setup (env vars).
At the end: PoC verification checklist (e.g., "Test: Create planner, add goal, assign task to day").
Limitations: Keep PoC minimal (approx. 10-15 files), no performance optimization. If anything is unclear, ask the user. Goal: Working prototype verifying that the stack and MVP flow are feasible.
