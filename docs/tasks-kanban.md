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
- [Custom Fields](#custom-fields)
- [Task Comments & Checklists](#task-comments--checklists)
- [Kanban Sections](#kanban-sections)
- [Kanban Archive](#kanban-archive)
- [Project Context](#project-context)
- [Risk Matrix](#risk-matrix)
- [Smart Scheduling](#smart-scheduling)
- [Saved Views](#saved-views)
- [Eisenhower Matrix](#eisenhower-matrix)
- [Note Embeds](#note-embeds)
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

## Custom Fields

Extend task cards with your own data fields beyond the built-in properties.

### Adding Custom Fields

1. Go to **Settings** > **Tasks** > **Custom Fields**
2. Click **+ Add Field**
3. Configure the field:

| Field Type | Description | Example |
|-----------|-------------|---------|
| **Text** | Free-form text input | "Client Name", "Sprint Goal" |
| **Number** | Numeric value with optional unit | "Story Points", "Estimated Hours" |
| **Date** | Date picker | "Review Date", "Ship Date" |
| **Select** | Single choice from predefined options | "Component" (Frontend, Backend, Design) |
| **Multi-Select** | Multiple choices from predefined options | "Skills Required" (React, Python, DevOps) |

4. Enter a field name and configure options (for Select/Multi-Select)
5. Click **Save**

### Using Custom Fields

Custom fields appear in the task detail panel below the standard fields. Fill them in when creating or editing a task. Custom field values are visible on the card in Board View (toggle per field in Settings).

### Filtering and Sorting by Custom Fields

Custom fields appear in the Filter panel and as sort options in List View. For example, sort by "Story Points" descending to see the largest tasks first, or filter by "Component = Backend" to focus on backend work.

---

## Task Comments & Checklists

### Comments

Add discussion and context directly on task cards:

1. Open a task card
2. Scroll to the **Comments** section
3. Type your comment in the text box
4. Click **Post** (or press **Cmd+Enter** / **Ctrl+Enter**)

Comments are timestamped and appear in chronological order. Edit or delete your own comments via the three-dot menu on each comment.

### Checklists

Add lightweight checklists within a task for step-by-step tracking:

1. Open a task card
2. Scroll to the **Checklists** section
3. Click **+ Add Checklist**
4. Enter a checklist title (e.g., "Acceptance Criteria")
5. Add items one by one -- type and press Enter

Check off items as you complete them. The task card shows a progress indicator (e.g., "4 / 7") for each checklist. Multiple checklists are supported per task.

> **Tip:** Checklists are lighter than subtasks -- use them for quick step lists that don't need their own priority, due date, or assignment.

---

## Kanban Sections

Group cards within a column into logical sub-sections for better organization.

### Creating Sections

1. Click the three-dot menu on a column header
2. Select **Add Section**
3. Enter a section name (e.g., "Frontend", "Backend", "Design")
4. The section appears as a collapsible group within the column

### Managing Sections

- **Reorder sections:** Drag the section header up or down within the column
- **Rename:** Click the section name to edit inline
- **Collapse/Expand:** Click the arrow icon on the section header to toggle visibility
- **Delete:** Click the three-dot menu on the section header > **Delete Section** (tasks move to the column's default ungrouped area)

### Dragging Tasks into Sections

Drag a task card onto a section header to place it in that section. Tasks can be dragged between sections within the same column or across columns.

---

## Kanban Archive

Move completed tasks out of the active board to keep columns clean without losing data.

### Archiving Tasks

- **Single task:** Open task card > three-dot menu > **Archive**
- **Bulk archive:** In List View, select completed tasks > **Archive Selected**
- **Auto-archive:** Settings > Tasks > **Auto-Archive** > Enable. Tasks in the "Done" column are archived after a configurable delay (default: 7 days).

### Viewing Archived Tasks

1. Click the **Archive** button (box icon) at the top right of the board
2. Browse archived tasks with search and filters
3. Archived tasks show their original column, completion date, and all details

### Restoring Archived Tasks

1. Open the archive panel
2. Find the task
3. Click **Restore** -- the task returns to its original column

### Permanently Deleting Archived Tasks

In the archive panel, select tasks and click **Delete Permanently**. This action is irreversible.

---

## Project Context

Switch between project contexts to focus the board on a specific project's tasks.

### Using the Project Switcher

1. Click the **project dropdown** at the top of the Kanban board (shows "All Projects" by default)
2. Select a project to filter the board
3. Only tasks tagged with that project are displayed
4. All views (Board, List, Calendar, Gantt) respect the active project context

### Creating Projects

1. Go to **Settings** > **Tasks** > **Projects**
2. Click **+ New Project**
3. Enter a project name, color, and optional description
4. Click **Create**

### Assigning Tasks to Projects

When creating or editing a task, select a project from the **Project** dropdown. Tasks can belong to one project at a time.

---

## Risk Matrix

Assess and visualize risk for individual tasks using an impact/probability matrix.

### Adding Risk Assessment

1. Open a task card
2. Scroll to the **Risk** section
3. Set **Impact** (1--5 scale: Negligible, Minor, Moderate, Major, Severe)
4. Set **Probability** (1--5 scale: Rare, Unlikely, Possible, Likely, Almost Certain)
5. A risk score is calculated automatically (Impact x Probability)

### Risk Score Colors

| Score Range | Level | Color |
|------------|-------|-------|
| 1--4 | Low | Green |
| 5--9 | Medium | Yellow |
| 10--15 | High | Orange |
| 16--25 | Critical | Red |

Risk scores display as colored badges on task cards when enabled (Settings > Tasks > Show Risk Badges).

### Risk Matrix View

Access via **Tasks** > **PM Dashboard** > **Risk Matrix** tab. Tasks are plotted on a 5x5 grid with impact on the Y-axis and probability on the X-axis. Click any cell to see the tasks in that risk zone. Use this view to identify high-risk items that need mitigation plans.

---

## Smart Scheduling

AI-powered daily schedule generation that plans your day based on task priorities, deadlines, energy levels, and available time.

### Generating a Schedule

1. Click **Smart Schedule** button (calendar + sparkle icon) at the top of the board
2. Review the AI-generated daily plan showing:
   - Recommended task order
   - Suggested time blocks for each task
   - Break periods
   - Estimated completion times
3. Click **Apply** to create time blocks on your calendar, or **Adjust** to modify before applying

### How It Works

The scheduler considers:
- **Due dates** -- Urgent tasks are prioritized
- **Priority levels** -- High-priority tasks are scheduled for peak hours
- **Estimated durations** -- Based on subtask count and historical completion times
- **Dependencies** -- Blocked tasks are scheduled after their prerequisites
- **Calendar conflicts** -- Existing events are respected

### Customizing Preferences

In Settings > Tasks > Smart Scheduling:
- Set your **work hours** (e.g., 9 AM -- 5 PM)
- Set your **peak productivity hours** (e.g., 9 AM -- 12 PM)
- Configure **break frequency** (e.g., 5-minute break every 25 minutes)
- Adjust **buffer time** between tasks

---

## Saved Views

Create and save custom filter/sort configurations for quick access to the task views you use most.

### Creating a Saved View

1. Apply filters and sort options to the board (e.g., Priority = High, Assignee = Me, Sort by Due Date)
2. Click the **Save View** button (bookmark icon) in the filter bar
3. Enter a name (e.g., "My Urgent Tasks", "Sprint 12 Backend")
4. Click **Save**

### Switching Between Views

Click the **Views** dropdown at the top of the board to see all saved views. Select a view to instantly apply its filter and sort configuration. The active view name appears in the dropdown.

### Managing Saved Views

- **Edit:** Click the pencil icon next to a saved view to update its filters
- **Rename:** Click the view name in the dropdown to rename
- **Delete:** Click the trash icon next to a saved view
- **Set Default:** Right-click a view > **Set as Default** to load it automatically when opening the board

---

## Eisenhower Matrix

A four-quadrant view that organizes tasks by urgency and importance for better prioritization.

### Accessing the Eisenhower Matrix

Click **Eisenhower** in the view switcher (top right of the board, alongside Board, List, Calendar).

### The Four Quadrants

| Quadrant | Label | Description | Action |
|----------|-------|-------------|--------|
| **Q1** (top-left) | Urgent & Important | Crises, deadlines, pressing problems | Do first |
| **Q2** (top-right) | Not Urgent & Important | Planning, development, prevention | Schedule time |
| **Q3** (bottom-left) | Urgent & Not Important | Interruptions, some meetings, some emails | Delegate |
| **Q4** (bottom-right) | Not Urgent & Not Important | Time wasters, busywork | Eliminate |

### Assigning Quadrants

Tasks are placed into quadrants based on their priority and due date by default:
- **High priority + due soon** = Q1
- **High priority + no deadline** = Q2
- **Low priority + due soon** = Q3
- **Low priority + no deadline** = Q4

You can manually drag tasks between quadrants to override the automatic placement. Manual placement is remembered.

### Using the Matrix

- Focus your day on Q1 tasks
- Protect time for Q2 tasks (these drive long-term progress)
- Delegate or batch Q3 tasks
- Review Q4 tasks periodically and delete if unnecessary

---

## Note Embeds

Tasks can be embedded directly inside notes for cross-module visibility. When you embed a task in a note using the `/embed-task` slash command, the note displays a live card showing the task's title, status, priority, and due date. Changes to the task are reflected in the embed automatically.

See the **[Notes & Knowledge Management](./notes-editor.md#note-embeds)** guide for full details on embedding tasks, events, and spreadsheet data in notes.

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
