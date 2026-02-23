# Troubleshooting

A guide to resolving common issues in NeumanOS. Most problems can be solved with a page refresh.

---

## Table of Contents

- [Before You Start](#before-you-start)
- [Dashboard & Widgets](#dashboard--widgets)
- [Notes](#notes)
- [Tasks & Kanban](#tasks--kanban)
- [Calendar & Events](#calendar--events)
- [Time Tracking](#time-tracking)
- [Habits](#habits)
- [Link Library](#link-library)
- [Diagrams](#diagrams)
- [Forms](#forms)
- [Focus Mode](#focus-mode)
- [General Performance](#general-performance)
- [Data & Storage](#data--storage)
- [Browser-Specific Issues](#browser-specific-issues)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Report a Bug](#report-a-bug)
- [Related Guides](#related-guides)

---

## Before You Start

Try these steps first -- they resolve most issues:

1. **Refresh the page** (Cmd+R / Ctrl+R)
2. **Clear browser cache** (DevTools > Application > Clear Storage)
3. **Try a different browser** (Chrome, Firefox, Safari, Edge)
4. **Check browser console** (F12 > Console) for error messages

---

## Dashboard & Widgets

### Widgets Not Loading or Showing "Error"

1. Refresh page
2. Clear widget cache: Settings > Dashboard > Clear Cache
3. Remove and re-add widget
4. Check internet connection (some widgets need live APIs)

**Widget-specific tips:**
- **Weather Widget:** Allow geolocation permission in browser settings
- **Crypto/Stock widgets:** Free API tier may be rate-limited -- wait 60 seconds
- **Unsplash widget:** Requires internet connection for images

### Widget Layout Broken or Overlapping

1. Refresh page
2. Settings > Dashboard > Reset Layout
3. Try fullscreen (F11) then exit fullscreen
4. Resize browser window to trigger responsive layout

### Drag-and-Drop Not Working

1. Ensure you're hovering over the widget itself
2. Press Escape (may be stuck in edit mode)
3. Try different browser
4. Clear browser cache

---

## Notes

### Notes Not Saving

1. Check storage quota: Settings > Storage > View Usage
2. If storage is full (>90%), export backup and clear old notes
3. Try different browser
4. Check browser console (F12 > Console) for errors

> **Tip:** Export regularly via Settings > Backup > Export All Data.

### Can't Find a Note

1. Use Cmd+K global search (most reliable)
2. Check all folders (use "All Notes" filter)
3. Check Archive folder
4. Verify not filtered by tag (clear tag filters)

### Graph View Not Showing Connections

1. Ensure wiki links use `[[Note Title]]` syntax (not `[Note Title]`)
2. Verify linked notes actually exist
3. Add tags to notes for tag-based connections
4. Refresh page to rebuild graph
5. Click "Show All Nodes" filter

### Editor Formatting Broken

1. Switch to Markdown mode (MD toggle) then back
2. Select text, then apply formatting
3. Try different browser

---

## Tasks & Kanban

### Tasks Not Showing on Board

1. Refresh page
2. Check filters: Click filter button to verify no filters are applied
3. Scroll horizontally if board extends off-screen

### Drag-and-Drop Not Working in Kanban

1. Double-click task to open detail panel, change status there
2. Refresh page (dragging can break after long sessions)
3. Use keyboard (H/L keys) to move between columns
4. Try different browser

### Task Changes Not Saving

1. Check storage quota (Settings > Storage)
2. Close other tabs to free memory
3. Export backup before trying again

### Column Names Wrong or Missing

1. Refresh page
2. Settings > Tasks > Reset Default Columns
3. Clear browser cache and refresh

---

## Calendar & Events

### Events Not Showing

1. Refresh page
2. Click "Today" to jump to current date
3. Check filters (click filter to ensure events aren't hidden)
4. Verify event date (may be in past/future)

### Recurring Events Only Showing Once

1. Edit event > Recurrence section > verify settings
2. Check "End" condition is set to "Never" or a future date
3. Refresh page

### Reminders/Notifications Not Working

1. Check notification permissions: Settings > Calendar > Enable Notifications
2. Check browser notification permissions for os.neuman.dev
3. Check system Do Not Disturb settings

**Grant permission manually:**
1. Click browser address bar icon (lock or info)
2. Find Notifications permission
3. Change from "Block" to "Allow"
4. Refresh page

### Can't Import ICS File

1. Verify file is `.ics` format
2. Try exporting from the source again (file may be corrupted)
3. Try importing a smaller date range

### Gantt Chart Slow

1. Filter by project or date range to reduce visible tasks
2. Disable dependency arrow visualization
3. Try different browser
4. Close other tabs

---

## Time Tracking

### Timer Not Running

1. Refresh page
2. Check if accidentally paused (click pause button to resume)
3. Try starting timer again

### Time Entries Not Saving

1. Check storage quota (Settings > Storage)
2. Refresh page (may have saved but not displaying)

### Timer Showing Wrong Duration

1. Usually a display-only issue (data is accurate)
2. Refresh page to recalculate
3. Check system clock

### Billable Time Not Calculating

1. Verify billable rate is set (check entry, project, and global rates)
2. Refresh page to recalculate
3. Ensure time entry is marked as billable
4. Ensure project is assigned

---

## Habits

### Habit Not Tracking Completions

1. Verify the habit is active (not paused or archived)
2. Check if today's date falls within the habit's schedule (e.g., weekdays only)
3. Refresh page -- completion may have saved but not displayed
4. Check storage quota (Settings > Storage)

### Streak Showing Wrong Count

1. Refresh page to recalculate
2. Verify completions were logged on consecutive days (check habit history)
3. Check timezone settings (Settings > General > Timezone) -- midnight rollover affects streak boundaries

### Habit Reminders Not Working

1. Check browser notification permissions for os.neuman.dev
2. Verify reminder time is set in the habit's settings
3. Check system Do Not Disturb settings
4. Ensure the app tab is open (or installed as PWA)

### Can't Delete or Edit a Habit

1. Refresh page
2. Try opening the habit detail panel and editing from there
3. Check if the habit is part of a routine (unlink it first)

---

## Link Library

### Links Not Saving

1. Verify you clicked **Save** after entering the URL
2. Check storage quota (Settings > Storage)
3. Ensure the URL is valid (starts with `http://` or `https://`)

### Link Preview Not Loading

1. Some websites block preview generation -- this is expected
2. Check internet connection (previews require fetching the URL)
3. Try refreshing the page
4. Click **Refresh Preview** on the link card to retry

### Can't Find a Saved Link

1. Use the search bar in the Link Library
2. Check collections/folders -- the link may be in a different collection
3. Clear any active tag or collection filters
4. Use Cmd+K global search

### Duplicate Links

Link Library warns you when adding a URL that already exists. If duplicates appear, delete the extra entry manually. Bulk select and delete is supported.

---

## Diagrams

### Diagram Not Rendering

1. Refresh page
2. Check if the diagram type is supported (flowchart, sequence, mindmap, etc.)
3. Try creating a new diagram to verify the editor loads
4. Check browser console (F12 > Console) for errors

### Can't Edit Diagram Elements

1. Ensure you're in **Edit Mode** (click the pencil icon)
2. Try selecting elements with a single click before dragging
3. Zoom in if elements are too small to click accurately
4. Refresh page if the canvas becomes unresponsive

### Diagram Export Issues

1. Verify the export format is supported (PNG, SVG, PDF)
2. Try a different export format
3. For large diagrams, try zooming to fit before exporting
4. Check browser popup blocker settings (exports may open in a new tab)

### Diagram Performance Slow

1. Reduce the number of elements on a single diagram (split into multiple diagrams)
2. Disable animations in diagram settings
3. Close other browser tabs to free memory
4. Try a different browser

---

## Forms

### Form Not Saving Responses

1. Refresh page
2. Check storage quota (Settings > Storage)
3. Verify the form is in **Published** state (draft forms don't accept responses)
4. Check browser console for errors

### Form Validation Not Working

1. Verify validation rules are set on the field (e.g., required, min/max, pattern)
2. Test by submitting with invalid data -- error messages should appear below the field
3. Check that the field type matches the validation (e.g., number validation on a number field)

### Can't Share Form Link

1. Verify the form is published
2. Click **Share** and copy the link
3. Note that form responses are stored locally on the device where the form is hosted -- shared links only work when your NeumanOS instance is accessible

### Form Responses Not Appearing

1. Refresh page
2. Check the **Responses** tab on the form (not the form editor)
3. Verify responses were submitted on the same device/browser
4. Export responses to CSV to verify data exists

---

## Focus Mode

### Focus Mode Not Activating

1. Verify you're using the correct shortcut or button to enter Focus Mode
2. Refresh page
3. Check if Focus Mode is enabled in Settings > General > Focus Mode

### Notifications Still Appearing in Focus Mode

1. Go to Settings > Focus Mode > verify **Block Notifications** is enabled
2. Check if browser-level notifications are overriding Focus Mode settings
3. System-level notifications (OS) are not controlled by NeumanOS -- use your system's Do Not Disturb

### Timer Not Pausing When Exiting Focus Mode

1. Focus Mode timer and the time tracking timer are independent
2. If you want the time tracker to stop when Focus Mode ends, enable **Auto-Stop Timer** in Settings > Focus Mode
3. Refresh page if the timer display is stuck

### Blocked Modules Still Accessible

1. Go to Settings > Focus Mode > verify the correct modules are selected for blocking
2. Refresh page to apply changes
3. Note that keyboard shortcuts may still navigate to blocked modules -- this is a known limitation; the module will redirect you back to your focus area

---

## General Performance

### App Running Slowly

1. Close other tabs (RAM competition is the main cause)
2. Close browser extensions
3. Reduce widgets on dashboard (keep under 12)
4. Disable auto-refresh on widgets
5. Try private/incognito mode (extensions disabled)

### High Memory Usage

1. Close unused tabs
2. Reduce number of widgets
3. Archive large notes (1000+ lines)
4. Restart browser

### Battery Draining Fast (Laptop)

1. Disable auto-refresh on weather/crypto/news widgets
2. Set widgets to manual refresh
3. Close app when not actively using
4. Use dark theme (saves battery on OLED screens)

---

## Data & Storage

### Lost All My Data

1. Check if browser data was accidentally cleared
2. Check for backup files in your cloud-synced folder
3. Try different device (data may be on another computer)
4. If no backup exists, data is unfortunately irrecoverable

> **Tip:** Export data weekly and store backups in a cloud folder. See the [Backup & Sync Guide](./backup-sync.md).

### Storage Quota Exceeded

1. Export backup first: Settings > Backup > Export
2. Delete old notes/tasks
3. Clear old time entries
4. Clear browser cache: Settings > Storage > Clear Cache

Your browser typically allows 50GB+ of local storage.

---

## Browser-Specific Issues

### Chrome

- **Notifications not working:** Settings > Privacy > Notifications > Allowed sites > Add os.neuman.dev
- **Storage full:** Chrome sync may be using storage. Check Settings > Sync > Manage data

### Firefox

- **Drag-and-drop issues:** Update to latest Firefox version
- **Auto-save not available:** Firefox doesn't support the File System Access API. Use manual export instead.

### Safari

- **Widgets blank:** Safari has stricter storage limits. Clear cache or reduce widget count.
- **Notifications blocked:** Safari Settings > Privacy > Notifications > Allow

### Edge

- **Performance issues:** Disable unnecessary extensions. Edge can be memory-intensive.

---

## Advanced Troubleshooting

### Check Browser Console

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Perform the failing action
4. Look for red error messages
5. Screenshot errors for bug reports

**Common errors:**
- `QuotaExceededError` -- Storage full
- `NetworkError` -- Internet connection issue

### Rebuild Search Index

If search can't find notes: Settings > Advanced > Rebuild Search Index. May take 30 seconds to 2 minutes for large collections.

### Reset Application State

**Last resort -- clears everything:**
1. Settings > Advanced > Factory Reset
2. Confirm (irreversible)
3. App restarts with defaults
4. Import previous backup if needed

> **Warning:** Export a backup before resetting. This cannot be undone.

---

## Report a Bug

If troubleshooting doesn't help:

1. **Gather information:**
   - Browser name and version
   - Operating system
   - Steps to reproduce
   - Screenshots or video
   - Browser console errors (F12 > Console)

2. **Create GitHub issue:**
   [github.com/travisjneuman/neumanos/issues](https://github.com/travisjneuman/neumanos/issues)

3. **Expected response times:**
   - High priority (data loss, crashes): 24--48 hours
   - Medium priority (broken features): 1 week
   - Low priority (visual bugs): 2--4 weeks

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and concepts
- **[Backup & Sync](./backup-sync.md)** -- Protect your data with backups
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Shortcut reference
- **[AI Terminal](./ai-terminal.md)** -- AI-specific troubleshooting
- **[Privacy & Security](./privacy-security.md)** -- Data privacy details
