# Task Management & Kanban Board

NeumanOS provides a professional Kanban board for managing tasks, tracking progress, and visualizing projects. Drag-and-drop task cards between customizable columns, add subtasks and dependencies, view Gantt charts, and monitor project health -- all stored locally on your device.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Tasks](#creating-tasks)
- [Managing Tasks](#managing-tasks)
- [Subtasks](#subtasks)
- [Task Dependencies](#task-dependencies)
- [Custom Columns](#custom-columns)
- [WIP Limits](#wip-limits-work-in-progress)
- [Team Members & Assignees](#team-members--assignees)
- [Views](#views)
- [PM Dashboard](#pm-dashboard)
- [Gantt View](#gantt-view)
- [Resource Allocation](#resource-allocation)
- [Bulk Operations](#bulk-operations)
- [Filters & Search](#filters--search)
- [Card Attachments & Covers](#card-attachments--covers)
- [Export](#export)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## Getting Started

Click **Tasks** in the left sidebar to open the Kanban board.

New boards start with three columns:
1. **To Do** -- Backlog of tasks
2. **In Progress** -- Active work
3. **Done** -- Completed tasks

You can customize these columns (see Custom Columns below).

---

## Creating Tasks

### Quick Add

1. Click **+ Add Task** button in any column
2. Enter task title
3. Press **Enter** to create

### Full Task Creation

1. Click **+ Add Task** in any column
2. Enter title in the modal
3. Fill in optional details:
   - **Description** -- Full task details
   - **Due Date** -- Calendar picker
   - **Priority** -- High (red), Medium (yellow), Low (gray)
   - **Assignees** -- Team members
   - **Labels/Tags** -- Categorization
4. Click **Create Task**

> **Tip:** Press **N** (when board is focused) to create a task in the currently selected column. Press **Cmd+Shift+T** anywhere in the app to open Quick Add.

---

## Managing Tasks

### Edit a Task

- **Click** the task card to open the detail panel
- **Keyboard:** Select task with J/K, press **E**

All fields are editable: title, description, status, priority, due date, assignees, tags, subtasks, dependencies, and attachments.

### Move Tasks Between Columns

- **Drag-and-Drop:** Click and hold, drag to target column, release
- **Keyboard:** Select task (J/K), press **H** (left) or **L** (right)
- **Detail Panel:** Open task, change the **Status** dropdown

### Delete Tasks

- Click task > trash icon > Confirm
- Keyboard: Select task, press **D** > Confirm
- Three-dot menu > Delete

### Duplicate Tasks

Open task card > three-dot menu > **Duplicate**. Creates a new task with the same properties.

---

## Subtasks

### Create Subtasks

1. Open task card
2. Scroll to **Subtasks** section
3. Click **+ Add Subtask**
4. Enter subtask title, description, priority, and due date

### Track Progress

Subtasks show a progress bar on the parent task card:
- **Green badge** -- All subtasks complete
- **Blue badge** -- Some subtasks complete (e.g., "3 / 5")
- **Gray badge** -- No subtasks complete

Click the checkbox next to any subtask to toggle completion.

---

## Task Dependencies

### Dependency Types

NeumanOS supports four professional dependency types:

| Type | Abbreviation | Meaning | Example |
|------|-------------|---------|---------|
| Finish-to-Start | FS | B starts when A finishes | "Write code" before "Review code" |
| Start-to-Start | SS | B starts when A starts | "Write docs" with "Write code" |
| Finish-to-Finish | FF | B finishes when A finishes | "Testing" with "Development" |
| Start-to-Finish | SF | B finishes when A starts | "Night shift" ends when "Day shift" starts |

### Add Dependencies

1. Open task card
2. Scroll to **Dependencies** section
3. Click **+ Add Dependency**
4. Select dependency type, related task, and optional lag time
5. Click **Add**

Positive lag adds delay (e.g., +2 days), negative lag allows overlap (e.g., -1 day).

> **Tip:** NeumanOS automatically prevents circular dependencies. If Task B already depends on Task A, you cannot make Task A depend on Task B.

---

## Custom Columns

- **Add Column:** Click **+ Add Column** (right side of board), enter name, press Enter
- **Rename Column:** Click column header three-dot menu > **Rename**
- **Delete Column:** Click column header three-dot menu > **Delete Column** (tasks move to "To Do")
- **Reorder Columns:** Click and hold column header, drag to new position

---

## WIP Limits (Work In Progress)

### Set WIP Limits

1. Click column header three-dot menu
2. Select **Set WIP Limit**
3. Enter maximum number of tasks allowed

### Visual Indicators

- **Green count** -- Under limit (e.g., "5 / 8")
- **Yellow count** -- At limit (e.g., "8 / 8")
- **Red count** -- Over limit (e.g., "10 / 8")

**Soft Limits (Default):** Warnings shown when at/over limit, but you can still add tasks.

**Hard Limits:** Enable in **Settings** > **Tasks** > **Enforce WIP limits strictly** to block dragging tasks into full columns.

---

## Team Members & Assignees

### Add Team Members

1. Go to **Settings** > **Team**
2. Click **+ Add Member**
3. Enter name, email (optional), and avatar color
4. Click **Create**

### Assign Tasks

1. Open task card > **Assignees** section
2. Click **+ Add Assignee**
3. Search and select team members (multi-select allowed)
4. Assignee avatars appear on the task card

### Filter by Assignee

Click **Filter** (top right of board) > **Assignee** > Choose team member.

---

## Views

### Board View (Default)

Classic Kanban columns with drag-and-drop cards. Best for visual workflow and daily standups.

### List View

Table format with sortable columns (title, status, priority, due date, assignees, subtask progress). Supports bulk select with checkboxes, bulk actions, and CSV export.

Access: Click **List** button (top right).

### Calendar View

Month grid showing tasks on their due dates, color-coded by status. Click task to open detail, click date to create a task.

Access: Click **Calendar** button (top right).

---

## PM Dashboard

Access the PM Dashboard for project-level visibility: Click **Tasks** > **PM Dashboard** tab.

### Burndown Charts

Track progress with visual burndown:
- X-axis shows days, Y-axis shows remaining work
- **Above ideal line** = Behind schedule
- **On ideal line** = On track
- **Below ideal line** = Ahead of schedule

Configure date range, metric (story points or task count), and project filter.

### Project Health Metrics

| Metric | What It Measures |
|--------|-----------------|
| **Velocity** | Tasks completed per week |
| **Cycle Time** | Average time from start to done |
| **Lead Time** | Time from creation to completion |
| **WIP Age** | How long tasks stay in progress |
| **Throughput** | Tasks completed per day |

Health status is color-coded: green (healthy), yellow (warning), red (critical).

### Resource Utilization

Bar chart showing each team member's workload:
- **Green (60--80%)** -- Optimal
- **Yellow (80--100%)** -- High
- **Red (>100%)** -- Overallocated

---

## Gantt View

Access: Click **Tasks** > **Gantt** tab.

### Dependency Arrows

Task relationships are shown as arrows:
- **Gray** -- Normal dependency
- **Red** -- Critical path (delays affect project end date)
- **Orange** -- At risk (tight timeline)

### Drag-to-Reschedule

- **Move Task:** Click and hold task bar, drag horizontally to new dates
- **Resize Task:** Hover over left or right edge, drag to extend or shorten duration
- When moving a task, dependents automatically shift. Warnings appear if moves create conflicts.

### Critical Path Highlighting

1. Click **View Options** (gear icon) in Gantt toolbar
2. Toggle **Show Critical Path**
3. Critical tasks highlighted in red -- these are the tasks where any delay extends the project end date

### Milestones

Create a task with zero duration (same start and end date) or toggle **Is Milestone** in task details. Milestones display as diamond shapes on the Gantt chart.

---

## Resource Allocation

Access: **Tasks** > **Resources** tab.

### Views

- **Team View** -- All members side by side
- **Individual View** -- Detailed breakdown per person
- **Timeline View** -- Allocation over time

### Capacity Warnings

- **Overallocated** -- >100% capacity assigned
- **Underallocated** -- <50% capacity
- **Conflict** -- Same person assigned to overlapping tasks

Click warning icons to see details, view conflicting assignments, and reassign or adjust dates.

### Availability Calendar

Set standard hours and time off for each team member in **Settings** > **Team**. Capacity calculations adjust automatically.

---

## Bulk Operations

### In List View

1. Click checkboxes on individual tasks (or **Select All**)
2. Available bulk actions:
   - **Change Status** -- Move all to a column
   - **Change Priority** -- Set priority for all
   - **Delete** -- Remove all (with confirmation)
   - **Export** -- Download as CSV

> **Tip:** Shift+Click to select a range of tasks.

---

## Filters & Search

### Search Tasks

Type in the search box (top of board) to filter by task title, description, or tags. Results update in real-time.

### Filter Panel

Click **Filter** to open advanced filters:
- **Status** -- Specific columns only
- **Priority** -- High, Medium, or Low
- **Assignee** -- Specific person
- **Due Date** -- Overdue, due this week, no due date
- **Tags** -- Specific labels

All filters use AND logic. Click **Clear All** to reset.

---

## Card Attachments & Covers

### Add Attachments

1. Open task card > **Attachments** tab
2. Click **+ Add Attachment**
3. Choose file from your device

Any file type is supported (images, PDFs, documents, etc.).

### Image Covers

When you attach an image file (PNG, JPG, GIF), the first image automatically becomes the card cover at the top of the task card.

- **Fit Mode** (default) -- Full image visible
- **Fill Mode** -- Image cropped to fill card width

Change mode in Attachments tab > **Cover Mode** dropdown.

---

## Export

### Export to CSV

1. Go to List View
2. Apply filters (optional -- only filtered tasks export)
3. Click **Export** button
4. Downloads `tasks_export.csv` with title, description, status, priority, due date, assignees, tags, subtasks, and timestamps

---

## Best Practices

### Organize with Columns

**Good column examples:**
- **Development:** Backlog > In Progress > Review > Testing > Done
- **Sales:** Lead > Contacted > Proposal > Negotiation > Closed
- **Content:** Ideas > Writing > Editing > Published

> **Tip:** Keep 4--6 columns. Too many creates confusion.

### Use Priorities Wisely

- **High Priority (Red)** -- Urgent, blocking others, deadlines approaching
- **Medium Priority (Yellow)** -- Important but not urgent
- **Low Priority (Gray)** -- Nice to have, can wait

Don't mark everything high priority -- it defeats the purpose.

### Break Down Large Tasks

If a task takes more than a few days, add subtasks. Each subtask should be completable in 1--2 hours.

### Set Realistic WIP Limits

Formula: Number of team members x 2. Example: 3 people = WIP limit of 6 in "In Progress."

### Review Regularly

- **Daily:** Check overdue tasks, update progress
- **Weekly:** Review completed work, plan next week
- **Monthly:** Clean up done column, archive old tasks

---

## Troubleshooting

### Tasks Not Saving
- Check browser storage quota (Settings > Storage)
- No internet connection required -- data saves locally

### Drag-and-Drop Not Working
- Try refreshing the page
- Check browser compatibility (Chrome, Firefox, Edge recommended)

### Can't See All Columns
- Scroll horizontally on the board
- Use keyboard navigation (H/L keys)

### Lost Tasks After Deleting Column
- Deleted column tasks move to "To Do" automatically
- Check "To Do" column for your tasks

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and concepts
- **[Calendar & Events](./calendar-events.md)** -- Integrate tasks with calendar
- **[Time Tracking](./time-tracking.md)** -- Track time on tasks
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Complete shortcut reference
- **[Troubleshooting](./troubleshooting.md)** -- More solutions
