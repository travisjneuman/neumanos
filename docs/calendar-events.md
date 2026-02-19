# Calendar & Scheduling

NeumanOS provides full calendar and scheduling capabilities. Create events, set reminders, handle recurring patterns, integrate with tasks and time tracking, and visualize your schedule with Gantt charts -- all stored locally on your device.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Calendar Views](#calendar-views)
- [Creating Events](#creating-events)
- [Editing & Managing Events](#editing--managing-events)
- [Drag-and-Drop](#drag-and-drop)
- [Recurring Events](#recurring-events)
- [Reminders & Notifications](#reminders--notifications)
- [Conflict Detection](#conflict-detection)
- [Import & Export](#import--export)
- [Task Integration](#task-integration)
- [Gantt Chart](#gantt-chart)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## Getting Started

Click **Schedule** in the left sidebar to open the calendar.

**Interface Overview:**
- **Calendar Tab** -- Main calendar views (Month/Week/Day/Gantt)
- **Timer Tab** -- Time tracking interface
- **Top Bar** -- View switcher, navigation, today button
- **Sidebar** -- Mini calendar, upcoming events

---

## Calendar Views

### Month View (Default)

Full month grid with events shown as colored blocks. Click a date to see day detail, click an event to view/edit details.

- **Navigate:** Arrow buttons for previous/next month, "Today" button to jump to current date, mini calendar for quick navigation

### Week View

7-day view with hourly time slots (30-minute increments). Events are positioned by start/end time.

**Creating events:** Click a time slot to create with time pre-filled, or click-and-drag from start to end time.

### Day View

Single day with hourly breakdown. More vertical space for event details.

### Gantt View

Timeline view of all tasks and projects with horizontal bars showing duration, dependency arrows, color-coding by priority, and zoom controls.

### Agenda View

List format of upcoming events (next 30 days, configurable), grouped by date. No grid layout -- easier to scan.

---

## Creating Events

### Quick Create

1. Click any date in Month View
2. Enter event title
3. (Optional) Set time, duration, and details
4. Click **Create Event**

Default behavior: All-day event if no time specified, 1-hour duration if time specified.

### Full Create

1. Click **+ New Event** or click a date
2. Fill in fields:
   - **Title** (required)
   - **Description** (optional)
   - **Date** and **Time** (or toggle All-day)
   - **Location** (optional)
   - **Recurrence** (optional)
   - **Reminders** (optional)
3. Click **Create Event**

### All-Day Events

Enable the **All-day** toggle when creating. The event appears at the top of the day rather than in the time grid. Examples: birthdays, holidays, deadlines, travel days.

### Multi-Day Events

Set different start and end dates (e.g., Dec 8 to Dec 10). The event spans multiple days as a continuous block. Examples: conferences, vacations, project sprints.

---

## Editing & Managing Events

### Edit Event

Click event > Edit button > Modify details > Save. Or drag event to new time/date.

### Delete Event

1. Click event to open detail view
2. Click **Delete** button
3. For single events: deleted immediately
4. For recurring events: prompts "Delete this event" or "Delete all events in series"

### Duplicate Event

Click event > three-dot menu > **Duplicate**. New event created with same details.

---

## Drag-and-Drop

### Reschedule by Dragging

**Month View:** Click and hold event, drag to new date. Time preserved, date updated.

**Week/Day View:** Click and hold event, drag to new time slot (same day or different day). Date and time updated.

---

## Recurring Events

### Create Recurring Event

1. Create event as normal
2. Enable **Repeat** toggle in the Recurrence section
3. Configure:
   - **Frequency** -- Daily, Weekly, Monthly, Yearly
   - **Interval** -- Every X days/weeks/months/years
   - **Days of Week** (weekly) -- Select specific days
   - **Day of Month** (monthly) -- Select specific date
   - **End Condition** -- Never, after N occurrences, or until date
4. Click **Create Event**

### Recurrence Examples

| Event | Frequency | Days | End |
|-------|-----------|------|-----|
| Daily standup (weekdays) | Weekly, 1 week | Mon--Fri | Never |
| Monthly review | Monthly, 1 month | 1st of month | Never |
| Annual review | Yearly, 1 year | Jan 15 | Never |
| 10-week course | Weekly, 1 week | Tuesday | After 10 |

### Edit Recurring Events

When editing a recurring event, you're prompted: "Edit this event or all events in the series?"

- **Edit This Event** -- Changes apply only to this occurrence
- **Edit All Events** -- Changes apply to entire series

---

## Reminders & Notifications

### Set Reminders

1. Create or edit event
2. In the **Reminders** section, click **+ Add Reminder**
3. Select timing: at event time, 5/15/30 minutes before, 1 hour before, 1 day before, or custom
4. Add multiple reminders if needed

### Browser Notifications

NeumanOS uses browser-native notifications:

- First time: Allow notifications when prompted for os.neuman.dev
- Notifications appear at the scheduled time (even if the app tab is in background)
- Shows event title and time
- Click notification to open calendar

> **Tip:** If notifications aren't working, click the browser address bar icon (lock/info), find "Notifications" permission, and change to "Allow."

---

## Conflict Detection

When creating or editing events, the system checks for time overlaps. If a conflict is found, a warning message appears showing the conflicting events with titles and times. You can still create the event (soft warning).

---

## Import & Export

### Export Calendar (ICS Format)

1. Go to **Settings** > **Calendar**
2. Click **Export Calendar**
3. Downloads `.ics` file (RFC 5545 standard)

Compatible with Google Calendar, Outlook, and Apple Calendar.

### Import Calendar (ICS Format)

1. Export calendar from your source app as `.ics`
2. Go to NeumanOS **Settings** > **Calendar**
3. Click **Import Calendar**
4. Select `.ics` file
5. Choose **Merge** (add to existing) or **Replace** (delete all, import new)
6. Click **Import**

**Imported:** Event titles, descriptions, locations, dates, times, recurring patterns, all-day events, multi-day events.

**Not imported:** Attendees/guests, attachments, event colors.

---

## Task Integration

Tasks with due dates automatically appear on the calendar (different color than events). Click a task to open its Kanban card detail. Drag to reschedule the due date.

**Enable/disable:** Settings > Calendar > Toggle "Show tasks on calendar"

**Create Task from Calendar:** Right-click date > **Create Task** (due date auto-set).

---

## Gantt Chart

### What It Shows

Tasks and events on a horizontal timeline with bars representing duration. Color-coded by priority (red = high, blue = medium, gray = low) with dependency arrows connecting related tasks.

### Using Gantt View

- Scroll left/right to move through timeline
- Zoom in/out to adjust time scale
- Click task bar to open task details
- Drag task bars to reschedule
- Filter by project, priority, or status

---

## Best Practices

### Event Naming

**Good:** "Team Standup - Daily Sync", "Client ABC - Kickoff Meeting", "Dentist - Dr. Smith"

**Avoid:** Generic titles like "Meeting", "Call", "Appointment"

### Recurring Event Strategy

Use recurrence for weekly team meetings, monthly reviews, annual events. Don't use recurrence for one-off events or events with frequently changing details.

### Reminder Timing

| Event Type | Recommended Reminder |
|-----------|---------------------|
| Work meetings | 15 minutes before |
| Appointments | 1 hour before |
| Deadlines | 1 day before |
| Birthdays | 1 week before |

> **Tip:** Set multiple reminders for important events (e.g., 1 day before + 15 minutes before).

### Regular Review

- **Weekly:** Check upcoming week, reschedule conflicts
- **Monthly:** Review next month, add recurring events for new commitments
- **Quarterly:** Export backup of calendar data

---

## Troubleshooting

### Events Not Appearing
- Check view is showing correct date range
- Click "Today" to verify
- Refresh page to reload data

### Notifications Not Working
- Check browser notification permissions (Settings > Calendar)
- Ensure app is open or installed as PWA
- Check system Do Not Disturb settings

### Import Failed
- Verify file is `.ics` format
- Try importing smaller date ranges
- Check file isn't corrupted

### Drag-and-Drop Not Working
- Refresh page
- Try different browser (Chrome, Firefox, Edge recommended)

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and concepts
- **[Task Management](./tasks-kanban.md)** -- Integrate tasks with calendar
- **[Time Tracking](./time-tracking.md)** -- Track time on events
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Calendar shortcuts
- **[Troubleshooting](./troubleshooting.md)** -- More solutions
