# Time Tracking

NeumanOS provides professional time tracking with start/stop timers, project support, billable hours, invoice generation, and detailed reports -- all stored locally on your device with complete privacy.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Using the Sidebar Timer](#using-the-sidebar-timer)
- [Using the Timer Tab](#using-the-timer-tab)
- [Manual Time Entry](#manual-time-entry)
- [Projects](#projects)
- [Reports & Analytics](#reports--analytics)
- [Calendar View](#calendar-view)
- [Billable Hours & Invoicing](#billable-hours--invoicing)
- [Bulk Operations](#bulk-operations)
- [Export](#export)
- [Pomodoro Integration](#pomodoro-integration)
- [Time Rounding](#time-rounding)
- [Weekly Timesheet View](#weekly-timesheet-view)
- [Auto-Tracking](#auto-tracking)
- [Advanced Reports](#advanced-reports)
- [Idle Detection](#idle-detection)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## Getting Started

### Two Ways to Track Time

**1. Sidebar Timer Panel (Always Available)**
- Visible on every page (right side)
- Quick start/stop without navigation
- Shows running timer in real-time
- Recent entries with click-to-continue
- Today's total time

**2. Timer Tab (Full Interface)**
- Go to **Schedule** > **Timer** tab
- Weekly statistics chart
- Today/weekly/daily average displays
- Recent entries grid
- Synchronized with sidebar timer

Both interfaces update in real-time -- start timer in sidebar, see it in Timer tab and vice versa.

---

## Using the Sidebar Timer

### Start Tracking

1. Enter description (e.g., "Working on project documentation")
2. (Optional) Select a project from dropdown
3. Click **Start** button
4. Timer begins running in real-time (HH:MM:SS format)

### Pause & Resume

- Click **Pause** to stop counting while preserving elapsed time
- Click **Resume** to continue from where you paused
- Use for lunch breaks, meetings, or context switches

### Stop Tracking

1. Click **Stop** button
2. Time entry is saved automatically
3. Appears in recent entries list
4. Today's total updates
5. Timer resets to 00:00:00, ready for next entry

### Continue from Recent Entry

The sidebar shows entries from the last 48 hours:

1. Hover over an entry
2. Click **Continue** button (play icon)
3. New timer starts with same description and project
4. Original entry is preserved

---

## Using the Timer Tab

Go to **Schedule** > **Timer** tab.

**Top Section:** Running timer (synchronized with sidebar) with start/stop/pause controls.

**Statistics Cards:**
- **Today** -- Total time tracked today
- **This Week** -- Mon-Sun total
- **Daily Average** -- Average time per day (last 7 days)

**Weekly Chart:** Bar chart showing last 7 days. Hover to see exact time per day.

**Recent Entries Grid:** Tabular view with description, project, duration, date, and actions. Click **Continue** to start a new timer with the same details.

---

## Manual Time Entry

Use manual entry when you forgot to start the timer or need to log time retroactively.

1. Go to **Schedule** > **Timer** tab
2. Click **+ Manual Entry**
3. Enter details:
   - **Description** (required)
   - **Project** (optional)
   - **Date** (date picker)
   - **Duration** (see input modes below)
4. Click **Save**

### Duration Input Modes

**Time Range:** Enter start time (e.g., "9:00 AM") and end time (e.g., "11:30 AM"). Duration calculated automatically.

**Duration:** Enter hours and minutes directly. Start time set to current time (or manual override).

Toggle between modes using the switch in the modal.

---

## Projects

### Why Use Projects?

- Group related time entries
- Filter reports by client/project
- Color-code calendar entries
- Calculate billable hours per project
- Generate invoices

### Create a Project

1. Go to **Settings** > **Time Tracking**
2. Click **+ New Project**
3. Enter project name (e.g., "Client A - Website Redesign"), color, billable toggle, and hourly rate
4. Click **Create**

### Assign Project to Entry

- **When starting timer:** Select project from dropdown before clicking Start
- **When editing entry:** Click entry > Edit > Change project dropdown
- **Bulk assign:** Use List View > Select multiple entries > Change Project

### Archive Projects

Go to **Settings** > **Time Tracking** > Find project > Click **Archive**. Data is preserved, project hidden from active list. Click "Show Archived" to view and restore.

---

## Reports & Analytics

### Daily Summary

Shows total time today, time by project breakdown, bar chart of last 7 days. Great for daily standups and timesheet verification.

### Weekly Summary

Shows Mon-Sun total, daily breakdown bar chart, week-over-week comparison, and project distribution pie chart. Useful for weekly reviews and client reporting.

### Monthly Reports

Shows 30-day heat map, total hours per project, billable vs non-billable breakdown, and trends over time. Ideal for monthly invoicing and productivity analysis.

---

## Calendar View

Go to **Schedule** > **Calendar** tab to see time entries as colored blocks on calendar dates:

- Colors match project colors
- Hover to see entry details (description, duration)
- Multiple entries per day stack vertically
- Click to view/edit entry
- Navigate with Previous/Next month buttons and "Today" button

---

## Billable Hours & Invoicing

### Mark Entries as Billable

- When creating/editing an entry, enable the **Billable** checkbox
- Billable entries display a dollar icon on the card
- Bulk update: Select multiple entries in List View > **Mark as Billable**

### Set Hourly Rates

Rates apply in a hierarchy -- the first available rate is used:

| Level | How to Set | Use Case |
|-------|-----------|----------|
| **Entry Rate** | Edit individual entry > Custom Rate | Rush jobs, special pricing |
| **Project Rate** | Settings > Time Tracking > Edit project > Custom Rate | Per-client rates |
| **Global Rate** | Settings > Time Tracking > Billing > Default Hourly Rate | Your standard rate |

### Generate Invoices

1. Go to **Reports** > **Invoicing**
2. Select date range
3. Select project (optional)
4. Filter **Billable Only**
5. Review entries and totals
6. Click **Generate Invoice**

**Invoice includes:** Line items (date, description, hours, rate, amount), subtotal, tax (if configured), total, project/client details, and auto-incremented invoice number.

**Export formats:** PDF (professional layout), CSV (for accounting software), JSON (data backup).

### Invoice History

View all generated invoices in **Settings** > **Invoicing**. Track status (Draft, Sent, Paid, Overdue), click to view/download, and mark as Sent or Paid.

### Billable Categories Reference

| Category | Typically Billable? |
|----------|-------------------|
| Client meetings | Yes |
| Development work | Yes |
| Internal meetings | No |
| Administrative tasks | No |
| Training/learning | Negotiable |
| Travel time | Depends on contract |

---

## Bulk Operations

1. Enable checkboxes in Timer tab or List View
2. Click checkboxes on individual entries (or **Select All**)
3. Available actions:
   - **Delete** -- Remove selected entries
   - **Change Project** -- Reassign all to different project
   - **Mark Billable / Non-Billable** -- Toggle billable flag
   - **Export** -- Download selected entries as CSV

> **Tip:** Shift+Click to select a range.

---

## Export

### Export to CSV

1. Go to Timer tab or Time Tracking page
2. Apply filters (date range, project, billable) if desired
3. Click **Export**
4. Downloads CSV file

**CSV format example:**
```
Description,Project,Date,Start Time,End Time,Duration,Billable,Hourly Rate,Total
"Client meeting",Project A,2025-12-08,09:00,10:30,01:30:00,Yes,150.00,225.00
```

Use with QuickBooks, FreshBooks, Wave, Google Sheets, or Excel.

---

## Pomodoro Integration

Link Pomodoro focus sessions to tasks and habits for structured time management.

### Starting a Pomodoro Session

1. Open the timer (sidebar or Timer tab)
2. Click the **tomato icon** to switch to Pomodoro mode
3. Select a linked task or habit (optional)
4. Click **Start** to begin a 25-minute focus session

### Pomodoro Cycle

The default cycle follows the classic pattern:

| Phase | Duration | What Happens |
|-------|----------|-------------|
| **Focus** | 25 minutes | Timer counts down, linked task is tracked |
| **Short Break** | 5 minutes | Notification to rest, timer pauses tracking |
| **Focus** | 25 minutes | Next session begins |
| **Long Break** | 15 minutes | After 4 focus sessions, a longer break |

### Linking to Tasks

When you start a Pomodoro session with a linked task, the focus time is automatically recorded as a time entry on that task. Completed Pomodoro sessions appear in the task's time history.

### Linking to Habits

Link Pomodoro sessions to habits (e.g., "Deep Work" or "Study") to track habit streaks alongside focused time. Each completed Pomodoro counts as a habit completion for the day.

### Customizing Durations

In Settings > Time Tracking > Pomodoro:
- **Focus duration:** 15--60 minutes (default: 25)
- **Short break:** 3--15 minutes (default: 5)
- **Long break:** 10--30 minutes (default: 15)
- **Sessions before long break:** 2--6 (default: 4)

---

## Time Rounding

Round time entries to the nearest increment for cleaner timesheets and invoicing.

### Enabling Time Rounding

1. Go to **Settings** > **Time Tracking** > **Rounding**
2. Enable **Round Time Entries**
3. Select the rounding increment:

| Increment | Example |
|-----------|---------|
| **5 minutes** | 1h 23m becomes 1h 25m |
| **10 minutes** | 1h 23m becomes 1h 20m |
| **15 minutes** | 1h 23m becomes 1h 30m |
| **30 minutes** | 1h 23m becomes 1h 30m |

### Rounding Direction

- **Nearest** (default) -- Rounds to the closest increment
- **Up** -- Always rounds up (conservative for billing)
- **Down** -- Always rounds down

### When Rounding Applies

Rounding is applied at display and export time. The raw duration is always preserved in the database. Reports, invoices, and CSV exports use the rounded values. You can toggle rounding off at any time to see exact durations.

---

## Weekly Timesheet View

A dedicated grid view designed for reviewing and submitting weekly time.

### Accessing the Timesheet

Go to **Schedule** > **Timer** tab > click **Timesheet** (grid icon in the top right).

### Layout

The timesheet displays a grid with:
- **Rows:** One row per project (or per task, togglable)
- **Columns:** Monday through Sunday, plus a weekly total column
- **Cells:** Total hours for that project on that day

### Editing in the Timesheet

Click any cell to add or modify time for that project/day combination. Enter hours directly (e.g., "2.5" for 2 hours 30 minutes) or use the time picker. Changes are saved automatically and reflected in the main timer entries.

### Navigation

Use the arrow buttons to move between weeks. The current week is highlighted. Click **This Week** to jump back to the current week.

### Totals

- **Row totals:** Total hours per project for the week
- **Column totals:** Total hours per day across all projects
- **Grand total:** Total hours for the entire week (bottom-right corner)

---

## Auto-Tracking

Receive automatic suggestions to start tracking time based on your activity.

### How It Works

When enabled, NeumanOS monitors your in-app activity and suggests starting a timer when:

- You open a task and begin editing its description or subtasks
- You move a task to "In Progress"
- You start a Pomodoro session without a linked timer
- You begin editing a note linked to an active project

A non-intrusive prompt appears: "It looks like you're working on [Task/Project]. Start tracking?" Click **Start** to begin, or **Dismiss** to ignore.

### Configuration

In Settings > Time Tracking > Auto-Tracking:
- **Enable/disable** auto-tracking suggestions
- **Suggestion sensitivity:** Low (only obvious triggers), Medium, High (frequent suggestions)
- **Auto-start:** Optionally start the timer automatically without prompting (for power users)

> **Tip:** Auto-tracking suggestions learn from your dismissals. If you consistently dismiss a suggestion type, it stops appearing.

---

## Advanced Reports

Go beyond basic summaries with detailed analytics and custom report configurations.

### Report Types

| Report | What It Shows |
|--------|--------------|
| **Time by Project** | Stacked bar chart of hours across projects, filterable by date range |
| **Time by Day of Week** | Heatmap showing which days you log the most time |
| **Billable vs Non-Billable** | Pie chart and trend line comparing billable and non-billable hours |
| **Productivity Trends** | Line graph of daily/weekly hours over time with rolling averages |
| **Project Comparison** | Side-by-side breakdown of hours, costs, and billable ratios across projects |
| **Team Summary** | Per-member totals, averages, and billable percentages (when team members are configured) |

### Custom Date Ranges

All reports support custom date ranges: Today, This Week, This Month, Last 30 Days, Last 90 Days, This Quarter, This Year, or a custom start/end date.

### Exporting Reports

Click **Export** on any report to download as:
- **PDF** -- Formatted report with charts and tables
- **CSV** -- Raw data for spreadsheet analysis
- **JSON** -- Structured data for integrations

### Scheduled Reports

In Settings > Time Tracking > Reports, set up **automated report emails** (weekly or monthly). Reports are generated as PDFs and saved to your backup folder.

---

## Idle Detection

### What It Does

Detects when you've been inactive and prompts you to adjust your time entry. Uses browser-native APIs only -- no external tracking, no data sent anywhere.

### Configuration

1. Go to **Settings** > **Time Tracking**
2. Enable **Idle Detection**
3. Set **Idle Threshold** (1--30 minutes)

### How It Works

When your timer is running and you're idle past the threshold:

1. A prompt appears: "You've been idle for X minutes. What would you like to do?"
2. **Keep Time** -- No changes
3. **Discard Idle Time** -- Subtract idle minutes from total
4. **Adjust Manually** -- Opens edit modal to set exact duration

---

## Best Practices

### Timer Hygiene

- **Start timer immediately** when beginning work -- don't wait until later
- **Use descriptive entries** -- "Updated client proposal - sections 3-5" not "Work"
- **Stop timer during breaks** unless you're tracking meeting time

### Project Organization

- **Keep projects specific** -- "Client A - Website Redesign" not "Freelance Work"
- **Use consistent naming** -- "ClientName - ProjectName" format
- **Archive completed projects** -- Keeps active list clean, data preserved

### Regular Reviews

- **Daily:** Check today's total matches work hours
- **Weekly:** Review weekly summary, look for patterns
- **Monthly:** Generate invoices, archive old entries, verify accuracy

---

## Troubleshooting

### Timer Not Starting
- Refresh page
- Check browser permissions (JavaScript enabled)
- Check browser console for errors

### Entries Not Saving
- Check browser storage quota (Settings > Storage)
- Try different browser (Chrome, Firefox, Edge recommended)

### Incorrect Time Calculations
- Verify start/end times are in same time zone
- Check manual entry inputs (hours/minutes)
- Refresh page to recalculate

### Calendar View Not Showing Entries
- Verify entries have valid dates
- Check calendar is showing correct month
- Refresh page

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and concepts
- **[Task Management](./tasks-kanban.md)** -- Track time on tasks
- **[Calendar & Events](./calendar-events.md)** -- See time entries on calendar
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Timer shortcuts
- **[Backup & Sync](./backup-sync.md)** -- Protect your time data
