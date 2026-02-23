# Getting Started with NeumanOS

NeumanOS is a privacy-first, local-only productivity platform that helps you organize your life without surrendering your data. Everything you create stays on your device -- no cloud storage, no accounts, no data collection.

---

## Table of Contents

- [What Makes NeumanOS Different?](#what-makes-neumanos-different)
- [First Steps](#first-steps)
- [Essential Keyboard Shortcuts](#essential-keyboard-shortcuts)
- [Understanding Local Storage](#understanding-local-storage)
- [Next Steps](#next-steps)
- [Getting Help](#getting-help)
- [Quick Troubleshooting](#quick-troubleshooting)

---

## What Makes NeumanOS Different?

### Privacy First

- **100% Local Storage** -- All data stored in your browser with 50GB+ capacity
- **No Account Required** -- Start using immediately, no sign-up needed
- **Zero Tracking** -- No ads, no fingerprinting, no personal data collection
- **Open Source** -- Audit the code yourself (MIT License)

### All-in-One Platform

- **Notes** -- Rich text editor with markdown support and knowledge graph
- **Tasks** -- Professional Kanban boards with dependencies, subtasks, and Gantt view
- **Calendar** -- Full scheduling with events, reminders, and recurring patterns
- **Time Tracking** -- Timer with projects, billable hours, and invoice generation
- **Dashboard** -- 60+ customizable widgets
- **AI Terminal** -- 9 AI providers with encrypted API key storage
- **Habits** -- Daily habit tracking with streaks and analytics
- **Focus Mode** -- Distraction-free deep work environment with Pomodoro integration
- **Link Library** -- Bookmark management and link organization
- **Activity Feed** -- Track recent actions and changes across all modules
- **Energy Tracker** -- Monitor daily energy levels and optimize your schedule
- **PM Dashboard** -- Burndown charts, resource utilization, and project health metrics
- **Documents** -- Rich text documents with export support
- **Spreadsheets** -- Full spreadsheet editor with formulas and charts
- **Presentations** -- Create and present slide decks

---

## First Steps

### 1. Access NeumanOS

Visit **[https://os.neuman.dev](https://os.neuman.dev)**

No installation needed. The app runs directly in your browser.

**For offline use:** Click the install button in your browser's address bar to add NeumanOS as a Progressive Web App (PWA). This allows you to use it offline with full functionality.

### 2. Explore the Interface

The main navigation is on the left sidebar, organized into expandable categories:

**Dashboard** (fixed at top)
- **Today** -- Daily overview with tasks, events, habits
- **Link Library** -- Bookmark and link management

**Schedule** (draggable)
- **Timer** -- Start/stop time tracking
- **Pomodoro** -- Focus timer with breaks

**Notes** (draggable)
- **Daily Notes** -- One-click daily journal
- **Graph** -- Visual knowledge graph of linked notes

**Tasks** (draggable)
- **Timeline** -- Visual task timeline
- **Habits** -- Daily habit tracking with streaks

**Create** (draggable)
- **Documents** -- Rich text documents
- **Spreadsheets** -- Data and calculations
- **Presentations** -- Slide decks
- **Diagrams** -- Visual diagrams and flowcharts
- **Forms** -- Custom form builder

**Settings** -- Backup, preferences, and customization (in sidebar footer)

### 3. Create Your First Note

1. Click **Notes** in the sidebar
2. Click the **+ New Note** button (or press Cmd+N / Ctrl+N)
3. Enter a title (e.g., "Welcome to NeumanOS")
4. Start typing in the rich text editor
5. Your note auto-saves every few seconds

**Try slash commands:** Type `/` to see formatting options:
- `/heading` -- Create headings (H1, H2, H3)
- `/list` -- Bullet or numbered lists
- `/code` -- Code blocks with syntax highlighting
- `/quote` -- Blockquotes
- `/table` -- Insert tables

### 4. Create Your First Task

1. Click **Tasks** in the sidebar
2. Click **+ Add Task** in any column
3. Enter task title and press Enter
4. Click the task card to add details:
   - Description
   - Due date
   - Priority (High/Medium/Low)
   - Assignees
   - Subtasks
   - Dependencies

**Drag and drop:** Move tasks between columns (To Do, In Progress, Done).

### 5. Add a Calendar Event

1. Click **Schedule** in the sidebar
2. Click any date on the calendar
3. Enter event details:
   - Title and description
   - Start/end time
   - Location
   - Recurring pattern (daily/weekly/monthly)
   - Reminders
4. Click **Create Event**

> **Tip:** Click and drag across time slots in Week/Day view to create events quickly.

### 6. Start Time Tracking

**Method 1: Sidebar Timer**
1. Look at the right sidebar (timer panel)
2. Enter a description (e.g., "Working on project X")
3. Select a project (optional)
4. Click **Start** button
5. Timer runs in real-time
6. Click **Stop** when finished

**Method 2: Timer Tab**
1. Go to **Schedule** > **Timer** tab
2. Full-featured time tracking interface
3. View weekly statistics
4. See recent entries and click to continue

### 7. Customize Your Dashboard

1. Click **Dashboard** in the sidebar
2. Click **+ Add Widget** button
3. Browse 60+ widgets across categories:
   - Productivity (TaskSummary, RecentNotes, Pomodoro)
   - Information (Weather, HackerNews, Quotes)
   - Utilities (Calculator, QRCode, Currency)
   - Finance (Crypto, StockMarket)
4. Click a widget to add it to your dashboard
5. Drag widgets to rearrange
6. Click the gear icon on any widget for settings

---

## Essential Keyboard Shortcuts

Learn these shortcuts to work faster:

### Global Shortcuts

- **Ctrl+K** -- Open Synapse (command palette)
- **Ctrl+B** -- Toggle sidebar
- **Ctrl+N** -- Create new note
- **Ctrl+T** -- Create new task
- **Ctrl+E** -- Create new event (go to calendar)
- **Ctrl+D** -- Create daily note
- **Ctrl+Shift+T** -- Smart Templates
- **Ctrl+Shift+A** -- Toggle AI Terminal
- **Esc** -- Close modals and dialogs

### Page Navigation

- **Ctrl+1** through **Ctrl+8** -- Jump directly to Dashboard, Today, Notes, Tasks, Schedule, Create, Link Library, or Settings

### Notes Shortcuts

- **Ctrl+B** -- Bold text (when in editor)
- **Ctrl+I** -- Italic text
- **Ctrl+U** -- Underline text
- **/** -- Trigger slash commands menu

### Kanban Shortcuts (when focused)

- **J** -- Move down to next task
- **K** -- Move up to previous task
- **H** -- Move left to previous column
- **L** -- Move right to next column
- **N** -- Create new task in current column
- **E** -- Edit selected task
- **D** -- Delete selected task

> **Note:** On Mac, use Cmd instead of Ctrl for all shortcuts.

See [Keyboard Shortcuts Guide](./keyboard-shortcuts.md) for the complete list.

---

## Understanding Local Storage

### Where Is My Data?

All your data is stored in your browser's local database, right on your computer:

- **Capacity:** 50GB+ (depends on available disk space)
- **Location:** Browser profile folder on your device
- **Privacy:** Never leaves your device unless you export it

### What Happens If I Clear Browser Data?

**WARNING:** Clearing browser data will delete your NeumanOS data!

Always export backups before:
- Clearing browser cache/cookies
- Uninstalling your browser
- Switching computers

### How to Backup Your Data

**Export Everything:**
1. Go to **Settings** > **Backup & Sync**
2. Click **Export All Data**
3. Downloads a `.brain` file (compressed JSON)
4. Save this file somewhere safe (external drive, cloud storage you control)

**What's included in backups:**
- All notes and folders
- All tasks and projects
- All calendar events
- All time tracking entries
- Widget configurations
- Settings and preferences

**Restore from backup:**
1. Go to **Settings** > **Backup & Sync**
2. Click **Import Data**
3. Select your `.brain` file
4. Choose merge or replace option
5. Your data is restored

---

## Next Steps

Now that you understand the basics, explore these guides:

1. **[Dashboard & Widgets](./dashboard-widgets.md)** -- Customize your home page
2. **[Task Management](./tasks-kanban.md)** -- Master the Kanban board
3. **[Notes & Knowledge](./notes-editor.md)** -- Advanced note-taking features
4. **[Time Tracking](./time-tracking.md)** -- Professional time tracking
5. **[Calendar & Events](./calendar-events.md)** -- Scheduling and reminders
6. **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Work faster with shortcuts
7. **[Privacy & Security](./privacy-security.md)** -- How your data is protected

---

## Getting Help

### In-App Help

- Press **?** anywhere to see context-specific shortcuts
- Use **Cmd+K / Ctrl+K** and search "help" for FAQ
- Click **Support** in the footer for contact options

### Community & Support

- **GitHub Issues:** [Report bugs](https://github.com/travisjneuman/neumanos/issues)
- **Discussions:** [Ask questions](https://github.com/travisjneuman/neumanos/discussions)
- **Email:** [os@neuman.dev](mailto:os@neuman.dev)

---

## Quick Troubleshooting

### Data Not Saving?

- Check browser storage quota (Settings > Storage)
- Ensure JavaScript is enabled
- Try a different browser (Chrome, Firefox, Edge recommended)

### App Running Slow?

- Clear old time entries (keep last 90 days)
- Reduce number of active widgets
- Check browser memory usage

### Lost My Data?

- Check if you switched browsers or cleared cache
- Look for auto-exported backups (if enabled)
- Data cannot be recovered if cleared without backup

### Can't Install as PWA?

- Ensure you're using HTTPS (os.neuman.dev)
- Check browser supports PWA (Chrome, Edge, Safari do)
- Look for install icon in address bar

See the full [Troubleshooting Guide](./troubleshooting.md) for more solutions.

---

## Related Guides

- **[Dashboard & Widgets](./dashboard-widgets.md)** -- Customize your home page
- **[Notes & Knowledge](./notes-editor.md)** -- Rich text editing and knowledge graph
- **[Task Management](./tasks-kanban.md)** -- Kanban boards and project management
- **[Privacy & Security](./privacy-security.md)** -- Data privacy and security details
- **[Backup & Sync](./backup-sync.md)** -- Protect your data with backups
