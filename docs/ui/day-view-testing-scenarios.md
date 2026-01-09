# Day View Testing Scenarios

This document outlines manual testing scenarios for the Day View implementation.

## Prerequisites
- Active plan with status 'active' or 'ready'
- Plan with configured long-term goals and milestones
- Plan with weekly goals for the current week
- Tasks distributed across different days and priorities

## Testing Checklist

### 1. Navigation & Routing

#### Test 1.1: Direct URL Access
- [ ] Navigate to `/plans/[id]/week/1/day/1`
- [ ] Verify page loads correctly with Day 1 data
- [ ] Verify week badge shows "Week 1"
- [ ] Verify computed date is correct (plan start date + 0 days)

#### Test 1.2: Day Navigation (Previous/Next)
- [ ] Click "Previous Day" button when on Day 2
- [ ] Verify navigation to Day 1
- [ ] Verify button is disabled on Day 1 of Week 1
- [ ] Click "Next Day" button
- [ ] Verify navigation to Day 2
- [ ] Test cross-week navigation (Day 7 → Week 2 Day 1)
- [ ] Verify button is disabled on Day 7 of Week 12

#### Test 1.3: Week Progress Bar
- [ ] Click on different days in the progress bar (Mon-Sun)
- [ ] Verify navigation to correct day
- [ ] Verify current day is highlighted
- [ ] Verify visual distinction for past/future days

#### Test 1.4: Date Picker
- [ ] Click on date display to open calendar
- [ ] Verify dates outside plan range are disabled
- [ ] Select a date within plan range
- [ ] Verify navigation to correct week and day
- [ ] Test cross-week date selection

### 2. Task Slots & Limits

#### Test 2.1: Most Important Slot (Limit: 1)
- [ ] Verify slot shows "0 / 1" when empty
- [ ] Verify no empty state message (only "+ Add Task" button visible)
- [ ] Add a task
- [ ] Verify counter updates to "1 / 1"
- [ ] Verify "Add Task" button is disabled
- [ ] Verify button shows "Slot Full (max 1)"
- [ ] Try adding via API (should fail with validation)

#### Test 2.2: Secondary Slot (Limit: 2)
- [ ] Add first task, verify counter shows "1 / 2"
- [ ] Add second task, verify counter shows "2 / 2"
- [ ] Verify "Add Task" button is disabled
- [ ] Verify red badge when full

#### Test 2.3: Additional Slot (Limit: 7)
- [ ] Add tasks incrementally
- [ ] Verify counter updates correctly (X / 7)
- [ ] Add up to 7 tasks
- [ ] Verify slot becomes full
- [ ] Verify button behavior

### 3. Task Creation

#### Test 3.1: Inline Task Addition
- [ ] Click "Add Task" in Most Important slot
- [ ] Type task title and press Enter
- [ ] Verify task appears with priority A
- [ ] Verify task has correct week_number and due_day
- [ ] Verify toast notification "Task created"

#### Test 3.2: Task Default Values
- [ ] Add task in Secondary slot
- [ ] Verify default priority is B
- [ ] Add task in Additional slot
- [ ] Verify default priority is C
- [ ] Verify all tasks have task_type = 'ad_hoc'
- [ ] Verify due_day is set to current dayNumber

#### Test 3.3: Empty Title Validation
- [ ] Try to add task with empty title
- [ ] Verify task is not created
- [ ] Try with whitespace-only title
- [ ] Verify trimming occurs

### 4. Task Status Changes

#### Test 4.1: Status Cycle (Click)
- [ ] Click task status icon
- [ ] Verify cycle: todo → in_progress → completed
- [ ] Verify visual changes (opacity, line-through)

#### Test 4.2: Status Dropdown (Chevron)
- [ ] Click chevron on status control
- [ ] Verify all 5 statuses available
- [ ] Select 'postponed' status
- [ ] Verify update
- [ ] Select 'cancelled' status
- [ ] Verify task styling

#### Test 4.3: Confetti on Completion
- [ ] Complete all tasks in all slots
- [ ] Verify confetti overlay appears
- [ ] Verify celebration message
- [ ] Click "Close" button
- [ ] Verify confetti disappears

### 5. Priority Changes & Slot Movement

#### Test 5.1: Priority Click (Cyclic)
- [ ] Click priority badge on task
- [ ] Verify cycle A → B → C → A
- [ ] Verify badge updates immediately
- [ ] Verify slot movement is debounced (wait 1000ms)

#### Test 5.1b: Priority Change Debounce
- [ ] Click priority badge to change from C to A
- [ ] Verify badge changes immediately (optimistic UI)
- [ ] Verify no network request sent yet
- [ ] Click again within 1 second to change to B
- [ ] Verify badge updates to B immediately
- [ ] Click again within 1 second to change to C
- [ ] Wait 1000ms without clicking
- [ ] Verify network request sent only once with final priority (C)
- [ ] Verify previous timeouts were cancelled
- [ ] Verify task moves to appropriate slot if needed

#### Test 5.2: Priority Change with Slot Movement
- [ ] Create task with priority C in Additional slot
- [ ] Change priority to A via badge click
- [ ] Verify task moves to Most Important (if space available)
- [ ] If Most Important full, verify moves to Secondary
- [ ] If both full, verify stays in Additional

#### Test 5.3: Slot Full Validation
- [ ] Fill Most Important slot (1 task)
- [ ] Try changing Additional task priority to A
- [ ] Verify toast error if target slots full
- [ ] Verify optimistic update rollback

#### Test 5.4: Context Menu Priority Change
- [ ] Open task context menu (three dots)
- [ ] Select "Change Priority" → High (A)
- [ ] Verify same slot movement logic applies

### 6. Drag & Drop Reordering

#### Test 6.1: Reorder Within Slot
- [ ] Add 2 tasks to Secondary slot
- [ ] Drag second task above first
- [ ] Verify order changes
- [ ] Verify positions update in backend
- [ ] Refresh page and verify order persists

#### Test 6.2: Position Encoding
- [ ] Check task position values in network tab
- [ ] Verify format: weekOrder * 100 + dayRank
- [ ] Reorder tasks
- [ ] Verify only dayRank changes, weekOrder preserved

#### Test 6.3: Cross-Slot Drag Prevention
- [ ] Try dragging task from Secondary to Additional
- [ ] Verify drag is blocked (only in-slot reorder allowed)

### 7. Day Assignment

#### Test 7.1: Assign to Different Day
- [ ] Open task context menu
- [ ] Select "Assign to Day" → Wednesday (3)
- [ ] Verify task disappears from current day
- [ ] Navigate to Wednesday
- [ ] Verify task appears on Wednesday

#### Test 7.2: Clear Day Assignment
- [ ] Open task context menu
- [ ] Select "Assign to Day" → Clear Day
- [ ] Verify due_day set to null
- [ ] Verify task still visible in current view (week view)

### 8. Copy & Move Operations

#### Test 8.1: Copy Task
- [ ] Open context menu on completed task
- [ ] Verify "Copy to Another Day" is disabled
- [ ] Open context menu on active task
- [ ] Click "Copy to Another Day"
- [ ] Select target day
- [ ] Verify original task remains
- [ ] Navigate to target day
- [ ] Verify copied task appears (status reset to 'todo')

#### Test 8.2: Move Task
- [ ] Open context menu on active task
- [ ] Click "Move to Another Day"
- [ ] Enter day number (1-7)
- [ ] Verify task disappears from current day
- [ ] Navigate to target day
- [ ] Verify task appears

#### Test 8.3: Completed Task Restriction
- [ ] Mark task as completed
- [ ] Open context menu
- [ ] Verify copy/move shows disabled message
- [ ] Verify message: "Cannot copy/move completed or cancelled tasks"

### 9. Goal & Milestone Linking

#### Test 9.1: Link Goal & Milestone
- [ ] Click context menu → "Link Goal & Milestone"
- [ ] Select a long-term goal from dropdown
- [ ] Select a milestone from filtered list
- [ ] Click "Link"
- [ ] Verify badge hierarchy appears: Category > Goal > Milestone

#### Test 9.2: Badge Hierarchy Display
- [ ] Create task and link to goal with category "Work"
- [ ] Verify blue "WORK" badge appears
- [ ] Verify goal name with Link2 icon
- [ ] Verify milestone name with Flag icon

#### Test 9.3: Unlink Goal
- [ ] Open Goal & Milestone Picker
- [ ] Select "None" for goal
- [ ] Verify badges disappear

### 10. Weekly Goal Assignment

#### Test 10.1: Assign to Weekly Goal
- [ ] Open context menu (ad-hoc task only)
- [ ] Select "Assign to Weekly Goal"
- [ ] Choose weekly goal from list
- [ ] Verify task_type changes to 'weekly_sub'
- [ ] Verify weekly goal badge appears
- [ ] Verify inherits goal/milestone from weekly goal

#### Test 10.2: Weekly Goal Task Limit
- [ ] Assign 10 tasks to a weekly goal
- [ ] Try assigning 11th task
- [ ] Verify error toast (if backend enforces limit)

#### Test 10.3: Unassign from Weekly Goal
- [ ] Open context menu on weekly_sub task
- [ ] Click "Unassign from Weekly Goal"
- [ ] Verify task_type changes to 'ad_hoc'
- [ ] Verify weekly goal badge disappears

### 11. Task Editing

#### Test 11.1: Inline Title Edit
- [ ] Click task title (non-completed)
- [ ] Modify text
- [ ] Press Enter
- [ ] Verify update saved
- [ ] Verify toast (if applicable)

#### Test 11.2: Edit Validation
- [ ] Click task title
- [ ] Clear all text and press Enter
- [ ] Verify original title restored (no empty title)
- [ ] Verify no API call made

#### Test 11.3: Edit Cancellation
- [ ] Click task title
- [ ] Modify text
- [ ] Press Escape
- [ ] Verify original title restored

#### Test 11.4: Completed Task Edit Lock
- [ ] Mark task as completed
- [ ] Try clicking title
- [ ] Verify edit mode doesn't activate

### 12. Task Deletion

#### Test 12.1: Delete Confirmation
- [ ] Open context menu → Delete Task
- [ ] Verify confirmation dialog appears
- [ ] Click Cancel
- [ ] Verify task remains
- [ ] Repeat and click OK
- [ ] Verify task deleted
- [ ] Verify toast "Task deleted"

#### Test 12.2: Slot Counter Update
- [ ] Note slot counter before deletion
- [ ] Delete task
- [ ] Verify counter decrements
- [ ] Verify "Add Task" button re-enabled if was full

### 13. Error Handling

#### Test 13.1: Network Error
- [ ] Disable network (DevTools offline mode)
- [ ] Try creating task
- [ ] Verify error toast appears
- [ ] Verify optimistic update rolls back

#### Test 13.2: API Validation Error
- [ ] Manually trigger limit violation via API
- [ ] Verify error message displayed
- [ ] Verify state remains consistent

#### Test 13.3: Loading State
- [ ] Navigate to day view with slow network
- [ ] Verify loading spinner appears
- [ ] Verify "Loading day plan..." message

#### Test 13.4: Error State with Retry
- [ ] Force API error (e.g., invalid planId)
- [ ] Verify error UI displays
- [ ] Click "Try Again" button
- [ ] Verify refetch attempt

### 14. Optimistic UI Updates

#### Test 14.1: Status Change Optimism
- [ ] Click status before API responds
- [ ] Verify immediate UI update
- [ ] Verify API call in network tab
- [ ] If API fails, verify rollback

#### Test 14.2: Create Task Optimism
- [ ] Add task with slow network
- [ ] Verify task appears immediately
- [ ] Verify temporary ID used
- [ ] Verify real ID after API response

#### Test 14.3: Delete Optimism
- [ ] Delete task
- [ ] Verify immediate removal
- [ ] If API fails, verify task reappears

### 15. Saving Indicator

#### Test 15.1: Visual Feedback
- [ ] Make multiple changes rapidly
- [ ] Verify "Saving..." indicator appears bottom-left
- [ ] Verify spinner animation
- [ ] Verify disappears after save complete

### 16. Responsive Design

#### Test 16.1: Mobile View
- [ ] Resize window to mobile width (< 768px)
- [ ] Verify vertical stacked layout displays properly
- [ ] Verify touch interactions work
- [ ] Verify date picker is usable

#### Test 16.2: Tablet View
- [ ] Resize to tablet width (768-1024px)
- [ ] Verify vertical layout is centered and readable

#### Test 16.3: Desktop View
- [ ] Verify vertical stacked layout with max-width constraint (max-w-4xl / 896px)
- [ ] Verify proper spacing and sizing
- [ ] Verify content is centered on wide screens
- [ ] Verify header and all slots have identical width (perfectly aligned)
- [ ] Verify no horizontal overflow or misalignment
- [ ] Measure widths in DevTools to confirm matching dimensions

### 17. Accordion Collapse/Expand

#### Test 17.1: Basic Collapse/Expand
- [ ] Click on Most Important header to collapse
- [ ] Verify tasks list is hidden
- [ ] Verify counter still visible
- [ ] Verify chevron rotates to indicate collapsed state
- [ ] Click header again to expand
- [ ] Verify tasks list reappears
- [ ] Verify smooth animation

#### Test 17.2: Independent Slot States
- [ ] Collapse Most Important slot
- [ ] Verify Secondary and Additional remain expanded
- [ ] Collapse Secondary slot
- [ ] Verify Most Important and Additional states unchanged
- [ ] Expand/collapse all three independently

#### Test 17.3: Adding Tasks When Collapsed
- [ ] Collapse a slot (e.g., Secondary)
- [ ] Expand the slot
- [ ] Click "Add Task" button
- [ ] Verify inline input appears
- [ ] Add task successfully
- [ ] Verify task appears in list

#### Test 17.4: Task Operations When Expanded
- [ ] Ensure slot is expanded
- [ ] Perform task operations (status change, edit, delete)
- [ ] Verify all operations work normally
- [ ] Collapse and re-expand
- [ ] Verify changes persisted

#### Test 17.5: Priority Change with Slot Collapsed
- [ ] Add task to Secondary slot
- [ ] Collapse Secondary slot
- [ ] Change task priority from B to A
- [ ] Wait 1000ms for debounce
- [ ] Verify task moves to Most Important (even if collapsed)
- [ ] Expand Most Important to verify task is there

#### Test 17.6: Default State
- [ ] Navigate to day view
- [ ] Verify all three slots are expanded by default
- [ ] Refresh page
- [ ] Verify all slots expanded again (no state persistence)

### 18. Edge Cases

#### Test 18.1: Week/Day Boundaries
- [ ] Navigate to Week 1, Day 1
- [ ] Verify "Previous Day" disabled
- [ ] Navigate to Week 12, Day 7
- [ ] Verify "Next Day" disabled

#### Test 18.2: Empty Slots
- [ ] View day with no tasks
- [ ] Verify no empty state message displayed
- [ ] Verify only "Add Task" button visible

#### Test 18.3: Plan Date Validation
- [ ] Try navigating beyond plan end (Week 13)
- [ ] Verify redirect to valid week/day
- [ ] Try dayNumber > 7
- [ ] Verify redirect to Day 1

#### Test 18.4: Archived Plan
- [ ] Archive a plan
- [ ] Try accessing day view
- [ ] Verify redirect to goals view

### 19. Position Logic Integration

#### Test 19.1: Week View Compatibility
- [ ] Create tasks in week view
- [ ] Navigate to day view
- [ ] Reorder tasks in day view
- [ ] Return to week view
- [ ] Verify week view order unchanged (weekOrder preserved)

#### Test 19.2: Position Normalization
- [ ] Create many tasks (simulate high position values)
- [ ] Verify position encoding works correctly
- [ ] Check position values don't overflow

## Performance Tests

### Test P1: Large Dataset
- [ ] Create 7 tasks in Additional slot
- [ ] Navigate between days
- [ ] Verify no lag or performance issues

### Test P2: Rapid Interactions
- [ ] Rapidly change task statuses
- [ ] Verify debouncing/queuing works
- [ ] Verify no race conditions

### Test P3: Multiple Tabs
- [ ] Open same day view in 2 tabs
- [ ] Make changes in tab 1
- [ ] Verify tab 2 doesn't have stale data on next action

## Accessibility Tests

### Test A1: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Test task operations via keyboard

### Test A2: Screen Reader
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify labels are announced correctly
- [ ] Verify status changes are announced

### Test A3: Color Contrast
- [ ] Verify priority badges meet WCAG standards
- [ ] Verify text readability in all states

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Notes
- Document any bugs found with reproduction steps
- Note any UX improvements discovered during testing
- Track API response times for performance baseline

