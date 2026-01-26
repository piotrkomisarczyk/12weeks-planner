# 12 Weeks Planner

A web application for planning and monitoring long-term goals using a structured 12-week approach.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**12 Weeks Planner** is a web-based goal planning and tracking tool inspired by Brian P. Moran's "The 12 Week Year" and Brian Tracy's "Eat That Frog". The application provides users with a structured approach to achieving their long-term goals through focused 12-week planning cycles.

### Key Features

- **Hierarchical Goal Management**: Organize your work with a three-tier hierarchy (goals → milestones → weekly tasks → daily tasks)
- **Task Prioritization**: Categorize tasks using A/B/C priority levels to focus on what matters most
- **Advanced Task States**: Track progress with multiple states (to-do, in progress, completed, cancelled, postponed)
- **Visual Progress Tracking**: Monitor goal achievement with visual progress bars
- **Weekly Reflections**: Build self-awareness through structured weekly summary questions
- **Multiple Views**: Navigate between dashboard, goals, weekly planning, daily tasks, hierarchy view and weekly summaries
- **Privacy-Focused**: Personal planners with secure authentication - your data stays yours
- **Bilingual Support**: Available in English and Polish

### Target Users

Individual users seeking an advanced, structured approach to goal planning beyond simple to-do lists.

## Tech Stack

### Frontend

- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing for enhanced code quality and IDE support
- **[Astro 5](https://astro.build/)** - Modern web framework for building fast, content-focused websites with minimal JavaScript
- **[React 19](https://react.dev/)** - Component library for interactive UI elements where needed
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible, customizable component library built on Radix UI
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icon library

### Backend

- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative providing:
  - PostgreSQL database
  - Backend-as-a-Service SDK
  - Built-in authentication
  - Self-hosting capabilities

### CI/CD & Hosting

- **GitHub Actions** - Automated CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker containers

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit quality checks
- **lint-staged** - Run linters on staged files

### Testing

- **[Vitest](https://vitest.dev/)** - Unit testing framework for logic and validation
- **[Playwright](https://playwright.dev/)** - End-to-end testing and visual regression testing
- **[Axe-core](https://github.com/dequelabs/axe-core)** - Automated accessibility testing (ARIA labels validation)
- **Postman/REST Client** - Manual API endpoint testing using `.http` files from `api-tests/` directory
- **Supabase Dashboard/SQL Editor** - Database state verification and Row Level Security (RLS) policy testing

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md).

## Getting Started Locally

### Prerequisites

- **Node.js** version `22.14.0` (as specified in `.nvmrc`)
  - We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
    ```bash
    nvm use
    ```

- **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/12weeks-planner.git
   cd 12weeks-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the project root and add your Supabase credentials:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your Supabase project settings under API.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:4321` (or the port shown in your terminal)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the Astro development server with hot module replacement |
| `npm run build` | Creates an optimized production build |
| `npm run preview` | Previews the production build locally |
| `npm run astro` | Runs Astro CLI commands |
| `npm run lint` | Checks code for linting errors |
| `npm run lint:fix` | Automatically fixes linting errors where possible |
| `npm run format` | Formats code using Prettier |
| `npm test` | Runs all unit tests once |
| `npm run test:watch` | Runs unit tests in watch mode (auto-rerun on changes) |
| `npm run test:ui` | Opens Vitest UI for interactive test debugging |
| `npm run test:coverage` | Runs unit tests with coverage report |
| `npm run test:e2e` | Runs E2E tests with Playwright (headless) |
| `npm run test:e2e:ui` | Opens Playwright UI for interactive E2E testing |
| `npm run test:e2e:headed` | Runs E2E tests with browser visible |
| `npm run test:e2e:debug` | Runs E2E tests in debug mode with Playwright Inspector |
| `npm run test:e2e:codegen` | Opens Playwright codegen tool for recording tests |

### Development Workflow

For the best development experience:

```bash
# Start development server
npm run dev

# In another terminal, run linter in watch mode (optional)
npm run lint

# Before committing, format and fix issues
npm run lint:fix
npm run format
```

Git hooks via Husky will automatically run linting on staged files before commit.

## Project Scope

### MVP Features Included

✅ **Authentication System**
- User registration and login (email/password)
- Password reset functionality
- Secure session management

✅ **Planner Management**
- Create 12-week planners starting from Monday of current week
- Navigate between current and archived planners
- Soft-delete archival system

✅ **Goal Management**
- Create 1-5 goals per planner
- Add justifications for each goal
- Define up to 5 milestone tasks per goal with deadlines
- Manual progress tracking (0-100%)

✅ **Task Management**
- Weekly planning with main task and subtasks
- Ad-hoc tasks unrelated to goals
- A/B/C prioritization system
- Multiple task states (to-do, in progress, completed, cancelled, postponed)
- Task assignment to specific days
- Multi-day task copying with state history

✅ **Daily Task View**
- 1 most important task
- 2 secondary tasks
- 7 additional tasks
- State management and task copying

✅ **Weekly Summaries**
- Reflection questions (what worked, what didn't, what to improve)
- Auto-save functionality
- Goal progress updates

✅ **Dashboard & Navigation**
- Hierarchical task tree view (expand/collapse)
- Quick links to all views
- Progress visualization

✅ **Interface**
- Responsive desktop design
- SVG icons with ARIA labels
- Bilingual support (English/Polish)

### Not Included in MVP

❌ Planner sharing between users  
❌ Search functionality  
❌ Time-boxing / time tracking  
❌ Mobile application or mobile-responsive views  
❌ External integrations (calendar, notifications, reports)  
❌ Advanced security (2FA, audit logs)  
❌ Automated progress calculation  
❌ Cross-planner ad-hoc task migration  

### Future Considerations

Features not included in the MVP may be considered for future releases based on user feedback and product evolution.

## Project Status

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)

### Current Version: 0.0.1

The project is currently in **MVP development phase**. This is a solo development project focused on delivering core functionality for individual goal planning and tracking.

### Development Approach

- Solo developer project
- Agile/iterative development
- User story-driven feature development
- Focus on clean code and maintainability

### Success Metrics (Post-MVP)

- 90% of registered users create at least 1 planner
- 50% of users complete at least 1 goal at 100% progress in their first planner
- Average session time >5 minutes for 70% of visits
- 70%+ completion rate for weekly summaries

## License

This project's license will be determined. Please check back later for licensing information.

---

**Built with ❤️ using Astro, React, and Supabase**

