# Limit Requirements Plan

## Overview

This document provides a comprehensive analysis of all limit requirements defined across the 12 Weeks Planner project documentation, including the Database Plan, API Plan, PRD, and UI Plan.

---

## Database Plan (docs/db-plan.md)

### **Plans Table**

- ✓ Status values limited to: `'ready'`, `'active'`, `'completed'`, `'archived'`
- ✓ Only **1 active plan** per user at a time (enforced by trigger `ensure_single_active_plan`)

### **Long-term Goals Table**

- ✓ **Minimum 1, Maximum 6 goals** per plan (enforced by trigger `validate_goal_count_per_plan`)
- ✓ Progress percentage: **0-100%**
- ✓ Position range: **1-6**
- ✓ Category limited to: `'work'`, `'finance'`, `'hobby'`, `'relationships'`, `'health'`, `'development'`

### **Milestones Table**

- ✓ **Maximum 5 milestones** per goal (enforced by trigger `validate_milestone_count_per_goal`)
- ✓ Position range: **1-5**

### **Weekly Goals Table**

- ✓ Week number range: **1-12**
- ✓ **Maximum 3 weekly goals** per week (mentioned in PRD, not explicitly in DB triggers)

### **Tasks Table**

- ✓ Priority limited to: `'A'`, `'B'`, `'C'`
- ✓ Status limited to: `'todo'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'postponed'`
- ✓ Task type limited to: `'weekly_main'`, `'weekly_sub'`, `'ad_hoc'`
- ✓ Week number range: **1-12**
- ✓ Due day range: **1-7** (Monday=1)
- ✓ **Maximum 15 subtasks** per weekly goal (enforced by trigger `validate_weekly_subtask_count`)
- ✓ **Maximum 100 ad-hoc tasks** per week (enforced by trigger `validate_ad_hoc_task_count`)
- ✓ **Maximum 10 tasks** per day (same week number and due day) (enforced by trigger `validate_daily_task_count`)

### **Weekly Reviews Table**

- ✓ Week number range: **1-12**

---

## API Plan (docs/api/api-plan.md)

### **Plans Endpoints**

- ✓ Query limit default: **50**, with pagination offset
- ✓ Only **1 active plan** per user (enforced by database trigger)
- ✓ Status values: `'ready'`, `'active'`, `'completed'`, `'archived'`

### **Goals Endpoints**

- ✓ **Minimum 1, Maximum 6 goals** per plan
- ✓ Progress percentage: **0-100%**
- ✓ Position range: **1-6**
- ✓ Title max length: **255 characters**
- ✓ Category: `'work'`, `'finance'`, `'hobby'`, `'relationships'`, `'health'`, `'development'`

### **Milestones Endpoints**

- ✓ **Maximum 5 milestones** per goal
- ✓ Position range: **1-5**
- ✓ Title max length: **255 characters**

### **Weekly Goals Endpoints**

- ✓ Week number range: **1-12**
- ✓ Title max length: **255 characters**

### **Tasks Endpoints**

- ✓ Priority: `'A'`, `'B'`, `'C'`
- ✓ Status: `'todo'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'postponed'`
- ✓ Task type: `'weekly_main'`, `'weekly_sub'`, `'ad_hoc'`
- ✓ Week number range: **1-12**
- ✓ Due day range: **1-7**
- ✓ Title max length: **255 characters**
- ✓ **Maximum 15 weekly subtasks** per weekly goal
- ✓ **Maximum 100 ad-hoc tasks** per week
- ✓ **Maximum 10 tasks** per day (same week number and due day)

### **Weekly Reviews Endpoints**

- ✓ Week number range: **1-12**
- ✓ Only **1 review per week** per plan

### **General API Limits**

- ✓ Default pagination limit: **50 results**
- ✓ Maximum pagination limit: **100 results**
- ✓ Rate limiting: **100 requests per minute** per user

### **Authentication**

- ✓ Password minimum length: **8 characters**
- ✓ Session duration: **1 hour** of inactivity
- ✓ Password reset token expiry: **1 hour**

---

## PRD (docs/prd.md)

### **Plans (US-004)**

- ✓ **Minimum 1 goal** required before plan creation
- ✓ Plan duration: **12 weeks**
- ✓ Start date must be **Monday**

### **Goals (US-006)**

- ✓ **1-6 goals** per plan
- ✓ **Up to 5 milestones** (tasks/kamieni milowych) per goal
- ✓ Progress: **0-100%**
- ✓ Categories: work, finance, hobby, relationships, health, development

### **Weekly Tasks (US-007)**

- ✓ **Maximum 3 weekly goals** per week
- ✓ **0-15 subtasks** per weekly goal
- ✓ **0-100 ad-hoc tasks** per week
- ✓ Priority: **A, B, C**
- ✓ Status: to do, in progress, completed, cancelled, postponed

### **Daily Tasks (US-008)**

- ✓ **1 most important** task slot
- ✓ **2 secondary** task slots
- ✓ **7 additional** task slots
- ✓ Total: **10 tasks** per day (same week number and due day)

### **Weekly Reviews (US-009)**

- ✓ **3 questions** (3 textarea fields)
- ✓ Progress slider: **0-100%** with **5% increments**

### **Authentication (US-001, US-003)**

- ✓ Password minimum: **8 characters**
- ✓ Session timeout: **1 hour** of inactivity
- ✓ Password reset link expiry: **1 hour**

---

## UI Plan (docs/ui/day-view-implementation-plan.md)

### **Day View Limits**

- ✓ **1 most important** task (Priority A)
- ✓ **2 secondary** tasks (Priority A or B)
- ✓ **7 additional** tasks (any priority)
- ✓ Total: **10 tasks** per day (same week number and due day)

---

## Summary by Category

### **Structural Limits**

- Plans: 12 weeks duration, 1 active per user
- Goals: 1-6 per plan
- Milestones: 0-5 per goal
- Weekly goals: 0-3 per week
- Tasks per weekly goal: 0-15 subtasks
- Ad-hoc tasks: 0-100 per week
- Daily task slots: 1+2+7 = 10 total

### **Data Range Limits**

- Week numbers: 1-12
- Day numbers: 1-7 (Monday-Sunday)
- Progress percentage: 0-100%
- Position values: 1-6
- String lengths: 255 characters (titles)

### **Authentication & Security Limits**

- Password length: minimum 8 characters
- Session timeout: 1 hour inactivity
- Rate limit: 100 requests/minute
- API pagination: 50 default, 100 maximum

### **Enum Value Limits**

- Plan status: 4 values (ready, active, completed, archived)
- Goal category: 6 values (work, finance, hobby, relationships, health, development)
- Task priority: 3 values (A, B, C)
- Task status: 5 values (todo, in_progress, completed, cancelled, postponed)
- Task type: 3 values (weekly_main, weekly_sub, ad_hoc)

---

## Notes

This comprehensive limit structure ensures data consistency across the database, API, and UI layers while preventing abuse and maintaining application performance. All limits are enforced through a combination of:

1. **Database constraints** (CHECK constraints, triggers)
2. **API validation** (request validation before database operations)
3. **UI validation** (client-side validation for better UX)

### Implementation Status

Most limits are enforced at the database level through triggers and constraints, ensuring data integrity regardless of the entry point. The API layer provides additional validation and user-friendly error messages, while the UI layer prevents invalid input before submission.

---

**Document Version:** 1.1  
**Last Updated:** 2026-01-10  
**Generated From:** db-plan.md, api-plan.md, prd.md, day-view-implementation-plan.md
