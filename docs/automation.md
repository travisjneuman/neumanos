# Automation & Quick Notes

Create rules that trigger actions automatically -- save time, ensure consistency, and reduce manual work. All automations run locally on your device with no server processing and no data sent anywhere.

---

## Table of Contents

- [What You Can Automate](#what-you-can-automate)
- [Creating Automations](#creating-automations)
- [Triggers](#triggers)
- [Conditions](#conditions)
- [Actions](#actions)
- [Variables](#variables)
- [Example Automations](#example-automations)
- [Managing Automations](#managing-automations)
- [Quick Notes via Terminal](#quick-notes-via-terminal)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## What You Can Automate

- Auto-tag tasks when created
- Move tasks to "Done" when all subtasks complete
- Create daily notes automatically
- Start timer when task moves to "In Progress"
- Create tasks from calendar events
- Send notifications based on conditions

---

## Creating Automations

1. Click **Automations** in sidebar
2. Click **+ New Automation**
3. Give it a name (e.g., "Auto-tag work tasks")
4. Set trigger (what starts it)
5. Set condition (optional -- when to run)
6. Set action (what to do)
7. Click **Save**

You can have up to 50 active automations, with up to 10 actions per automation.

---

## Triggers

### Task Triggers

| Trigger | Fires When |
|---------|-----------|
| `task.created` | New task is created |
| `task.updated` | Any field changes |
| `task.moved` | Status changes |
| `task.completed` | Task marked done |
| `task.due` | Due date reached |

### Note Triggers

| Trigger | Fires When |
|---------|-----------|
| `note.created` | New note created |
| `note.updated` | Content changes |
| `note.opened` | Note is opened |

### Calendar Triggers

| Trigger | Fires When |
|---------|-----------|
| `event.created` | New event created |
| `event.starting` | 15 minutes before start |
| `event.started` | Event starts |
| `event.ended` | Event ends |

### Time Triggers

| Trigger | Fires When |
|---------|-----------|
| `timer.started` | Tracking begins |
| `timer.stopped` | Tracking ends |
| `schedule` | Specific time/day |

---

## Conditions

Filter when an action runs:

**Field conditions:** Contains, Equals, Greater than, Less than
- Title contains "urgent" > set high priority
- Due date < 3 days > send notification

**Logical operators:**
- **AND** -- All must be true
- **OR** -- Any can be true
- **NOT** -- Must be false

---

## Actions

### Task Actions
- Create task with title/description/due date
- Update existing task
- Move to column
- Add/remove tags
- Set due date

### Note Actions
- Create note in folder
- Update existing note
- Move to folder

### Calendar Actions
- Create event from task
- Update event time

### Notifications
- Show browser alert with custom message
- Use variables: `{task.title}`, `{date}`

### Time Tracking
- Start/stop timer
- Create time entry

---

## Variables

Use dynamic data in automations:

| Variable | Value |
|----------|-------|
| `{task.title}` | Task title |
| `{task.status}` | Task status |
| `{task.priority}` | Task priority |
| `{note.title}` | Note title |
| `{note.folder}` | Note folder |
| `{event.title}` | Event title |
| `{event.date}` | Event date |
| `{event.time}` | Event time |
| `{today}` | Today's date |
| `{tomorrow}` | Tomorrow's date |
| `{+7days}` | Date 7 days from now |

**Example:** Auto-create task from event with title "{event.title} - Follow-up" and due date {event.date} + 1 day.

---

## Example Automations

### 1. Auto-tag urgent tasks

- **Trigger:** task.created
- **Condition:** Title contains "urgent" OR "asap"
- **Action:** Set priority to High

### 2. Complete parent when all subtasks done

- **Trigger:** Subtask completed
- **Condition:** All subtasks complete
- **Action:** Mark task as Done

### 3. Weekly review reminder

- **Trigger:** Every Friday 4 PM
- **Action:** Create task "Weekly Review"

### 4. Auto-start timer for work

- **Trigger:** Task moved
- **Condition:** New status is "In Progress" AND tag is "work"
- **Action:** Start timer

---

## Managing Automations

- **View:** Click **Automations** in sidebar
- **Edit:** Click automation > modify trigger/condition/action > Save
- **Pause:** Toggle switch (won't run when paused)
- **Delete:** Click trash icon (confirm)
- **History:** Click **History** tab to see what ran, when, and results

### Recursion Protection

To prevent infinite loops, automations stop after 10 levels of depth. For example, if Automation A creates a task that triggers Automation B that tags it, triggering Automation C -- the chain stops after 10 levels.

---

## Quick Notes via Terminal

Access: Open AI Terminal (Cmd+`)

Use terminal commands for fast capture without leaving your current context:

| Command | What It Does |
|---------|-------------|
| `/note "Meeting notes for client ABC"` | Creates a note |
| `/task "Follow up with design team"` | Creates a task |
| `/event "Team standup tomorrow 9am"` | Creates an event |

Items are created in the background and the terminal stays open so you can continue working.

> **Tip:** This is the fastest way to capture ideas from anywhere in the app -- one command and you're done.

---

## Best Practices

- **Start simple:** One trigger, one condition, one action
- **Test in isolation:** Create one automation, verify it works before adding more
- **Use descriptive names:** "Auto-tag work tasks" not "Automation 1"
- **Document purpose:** Add notes about why each automation exists
- **Monitor regularly:** Check automation history to verify correct behavior

---

## Troubleshooting

### Automation not triggering?
- Check if paused (toggle should be ON)
- Verify trigger matches your action
- Check conditions (may be too narrow)
- See automation history for errors

### Automation running too often?
- Conditions may be too broad
- Add more specific conditions
- Review automation history

### Action not working?
- Check variable syntax: `{task.title}` not `{task title}`
- Verify field names are correct
- Make sure target exists (folder, column, etc.)
- Check history for error messages

---

## Related Guides

- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Automation shortcuts
- **[Task Management](./tasks-kanban.md)** -- Task triggers and actions
- **[Notes & Knowledge](./notes-editor.md)** -- Note triggers and actions
- **[Calendar & Events](./calendar-events.md)** -- Calendar triggers and actions
- **[AI Terminal](./ai-terminal.md)** -- Quick Notes via terminal commands
