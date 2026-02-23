# Keyboard Shortcuts

NeumanOS supports extensive keyboard shortcuts across all modules. This guide lists every shortcut available, sourced directly from the in-app help.

**Platform note:** On Mac, use Cmd instead of Ctrl for all shortcuts listed below.

---

## Table of Contents

- [Global Shortcuts](#global-shortcuts)
- [Page Navigation (Ctrl+Number)](#page-navigation-ctrlnumber)
- [Go To (G then key)](#go-to-g-then-key)
- [Quick Create](#quick-create)
- [Synapse (Command Palette)](#synapse-command-palette)
- [Notes Editor](#notes-editor)
- [Kanban Board](#kanban-board)
- [Calendar](#calendar)
- [Accessibility](#accessibility)
- [Tips for Mastering Shortcuts](#tips-for-mastering-shortcuts)
- [Quick Reference Card](#quick-reference-card)
- [Related Guides](#related-guides)

---

## Global Shortcuts

These shortcuts work on any page in NeumanOS:

| Shortcut | Action |
|----------|--------|
| **Ctrl+K** | Open Synapse (command palette) |
| **F1** | Open help & support |
| **Ctrl+/** | Open help |
| **Ctrl+B** | Toggle sidebar |
| **Ctrl+Shift+A** | Toggle AI Terminal |
| **Ctrl+Shift+P** | Toggle project context |
| **Esc** | Close modal / clear selection |

---

## Page Navigation (Ctrl+Number)

Jump directly to any page using Ctrl and a number key:

| Shortcut | Page |
|----------|------|
| **Ctrl+1** | Dashboard |
| **Ctrl+2** | Today |
| **Ctrl+3** | Notes |
| **Ctrl+4** | Tasks |
| **Ctrl+5** | Schedule |
| **Ctrl+6** | Create (Docs) |
| **Ctrl+7** | Link Library |
| **Ctrl+8** | Settings |

---

## Go To (G then key)

Press G followed by another key to navigate. These are two-key sequences, not simultaneous presses.

| Shortcut | Destination |
|----------|-------------|
| **G then D** | Go to Dashboard |
| **G then T** | Go to Tasks |
| **G then N** | Go to Notes |
| **G then H** | Go to Habits |
| **G then C** | Go to Calendar |
| **G then S** | Go to Settings |
| **G then O** | Go to Today |
| **G then L** | Go to Links |
| **G then F** | Go to Focus |

---

## Quick Create

Shortcuts for creating new items from anywhere:

| Shortcut | Action |
|----------|--------|
| **C** | Quick add task (single key, only when not in a text field) |
| **Ctrl+N** | New note |
| **Ctrl+T** | New task |
| **Ctrl+E** | New event (go to calendar) |
| **Ctrl+Shift+T** | Smart Templates |
| **Ctrl+D** | Create daily note |

---

## Synapse (Command Palette)

Open Synapse with **Ctrl+K**, then use these prefixes to filter:

| Prefix | Mode | Example |
|--------|------|---------|
| (none) | Search all | "project plan" |
| **>** | Enter command mode | ">create note" |
| **?** | Enter help mode | "?shortcuts" |
| **/** | Enter navigation mode | "/tasks" |
| **tag:name** | Filter by tag | "tag:work" |
| **date:today** | Filter by date | "date:today" |

### Synapse Navigation

| Shortcut | Action |
|----------|--------|
| **Up/Down** | Navigate results |
| **Enter** | Execute selected result |
| **Esc** | Close Synapse |
| **Tab** | Cycle through result categories |

---

## Notes Editor

### Editor Formatting

| Shortcut | Action |
|----------|--------|
| **Ctrl+D** | Create daily note |
| **Ctrl+Shift+E** | Export notes |
| **Ctrl+B** | Bold text |
| **Ctrl+I** | Italic text |
| **Ctrl+U** | Underline text |
| **/** | Open slash commands |
| **[[** | Insert wiki link |

### Slash Commands

Type `/` in the editor to access:

| Command | Result |
|---------|--------|
| `/heading` | H1, H2, H3 |
| `/list` | Bullet or numbered list |
| `/code` | Code block |
| `/quote` | Blockquote |
| `/table` | Insert table |

---

## Kanban Board

These shortcuts work when the Kanban board is focused (not when typing in an input field).

### Navigation

| Shortcut | Action |
|----------|--------|
| **J** | Move down to next task |
| **K** | Move up to previous task |
| **H** | Move left to previous column |
| **L** | Move right to next column |

### Actions

| Shortcut | Action |
|----------|--------|
| **N** | Create new task in current column |
| **E** | Edit selected task |
| **D** | Delete selected task |

---

## Calendar

### View Navigation

| Shortcut | Action |
|----------|--------|
| **T** | Jump to today |
| **Left/Right** | Previous/Next period |
| **M** | Month view |
| **W** | Week view |
| **D** | Day view |
| **A** | Agenda view |

### Event Actions

| Shortcut | Action |
|----------|--------|
| **N** | New event on selected date |
| **E** | Edit selected event |
| **Delete** | Delete selected event |
| **Enter** | Open event detail |
| **Esc** | Close modal |

---

## Accessibility

### Keyboard-Only Navigation

NeumanOS is fully navigable with keyboard only:
- **Tab** to move between interactive elements
- **Enter** to activate buttons/links
- **Space** to toggle checkboxes
- **Arrow keys** for dropdowns and lists
- **Esc** to cancel/close

### Screen Reader Support

All shortcuts work with screen readers (NVDA, JAWS, VoiceOver). The interface uses ARIA labels, focus ring indicators, role attributes, and live region announcements.

---

## Tips for Mastering Shortcuts

### Start with These 5 Essentials

1. **Ctrl+K** -- Open Synapse (most powerful shortcut)
2. **Ctrl+N** -- Quick note creation
3. **Ctrl+1 to Ctrl+8** -- Direct page navigation
4. **Esc** -- Close anything
5. **C** -- Quick add task from anywhere

Master these first, then gradually add the G-key navigation and editor shortcuts.

### Single-Key vs. Modified Shortcuts

Single-key shortcuts (C, G, J, K, H, L, N, E, D) only work when you are **not** typing in an input field. If a shortcut isn't working, click outside any text input and try again.

Modified shortcuts (Ctrl+K, Ctrl+N, etc.) work everywhere, including while typing.

### Context Matters

Many shortcuts are context-sensitive:
- **J/K** navigate tasks in Kanban, notes in Notes page
- **N** creates task in Kanban, note in Notes page, event in Calendar
- **E** edits selected item (task, note, event)
- **D** deletes in Kanban, switches to Day view in Calendar

Same keys, different context, logical behavior.

### Discoverability

Press **Ctrl+/** or **F1** anywhere to see available shortcuts. Or open Synapse with **Ctrl+K** and type `?shortcuts`.

---

## Quick Reference Card

```
GLOBAL
  Ctrl+K           Open Synapse (command palette)
  Ctrl+B           Toggle sidebar
  Ctrl+Shift+A     Toggle AI Terminal
  F1 / Ctrl+/      Help
  Esc              Close modal

PAGE NAVIGATION
  Ctrl+1           Dashboard
  Ctrl+2           Today
  Ctrl+3           Notes
  Ctrl+4           Tasks
  Ctrl+5           Schedule
  Ctrl+6           Create (Docs)
  Ctrl+7           Link Library
  Ctrl+8           Settings

QUICK CREATE
  C                Quick add task
  Ctrl+N           New note
  Ctrl+T           New task
  Ctrl+E           New event
  Ctrl+D           Daily note
  Ctrl+Shift+T     Smart Templates

GO TO
  G then D/T/N/H/C/S/O/L/F
  Dashboard/Tasks/Notes/Habits/Calendar/Settings/Today/Links/Focus

NOTES EDITOR
  Ctrl+B/I/U       Bold / Italic / Underline
  /                Slash commands
  [[               Wiki link

KANBAN
  J / K            Navigate tasks (down/up)
  H / L            Switch columns (left/right)
  N                New task
  E                Edit task
  D                Delete task

CALENDAR
  T                Today
  Left/Right       Previous/Next
  M / W / D / A    Month/Week/Day/Agenda view
  N                New event
```

> **Tip:** On Mac, use Cmd instead of Ctrl for all shortcuts above.

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic concepts and first steps
- **[Notes Editor](./notes-editor.md)** -- Note-specific shortcuts and slash commands
- **[Task Management](./tasks-kanban.md)** -- Kanban keyboard navigation
- **[Calendar & Events](./calendar-events.md)** -- Calendar view shortcuts
- **[AI Terminal](./ai-terminal.md)** -- Terminal shortcuts
