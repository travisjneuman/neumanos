# Notes & Knowledge Management

NeumanOS provides a rich text editor with markdown support, folder organization, wiki-style linking, and a visual knowledge graph. Think of it as a local-first note-taking app where your data never leaves your device.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Notes](#creating-notes)
- [Editing Notes](#editing-notes)
- [Organizing Notes](#organizing-notes)
- [Searching Notes](#searching-notes)
- [Wiki-Style Links](#wiki-style-links)
- [Tags](#tags)
- [Graph View](#graph-view)
- [Export & Import](#export--import)
- [Best Practices](#best-practices)
- [Version History](#version-history)
- [Note Attachments](#note-attachments)
- [Bulk Operations](#bulk-operations)
- [Daily Notes](#daily-notes)
- [AI Writing Assist](#ai-writing-assist)
- [Smart Templates](#smart-templates)
- [Note Embeds](#note-embeds)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## Getting Started

Click **Notes** in the left sidebar to open the notes editor.

**Interface Overview:**
- **Left Panel** -- Folder tree and note list
- **Middle Panel** -- Note editor
- **Right Panel** -- Tags, backlinks (when applicable)

---

## Creating Notes

### Quick Create

- **Method 1:** Click **+ New Note** button (top left)
- **Method 2:** Press **Cmd+N** (Mac) or **Ctrl+N** (Windows/Linux)
- **Method 3:** Right-click a folder > **New Note**

### Create in Specific Folder

1. Navigate to target folder in left panel
2. Click folder to select it
3. Click **+ New Note** or press **Cmd+N**
4. Note appears in that folder

> **Tip:** Use arrow keys to navigate folders before pressing Cmd+N.

---

## Editing Notes

### Rich Text Editor

The default editor provides rich formatting:

**Keyboard Shortcuts:**
- **Cmd+B / Ctrl+B** -- Bold text
- **Cmd+I / Ctrl+I** -- Italic text
- **Cmd+U / Ctrl+U** -- Underline text
- **Cmd+K / Ctrl+K** -- Insert link (when text selected)

**Toolbar Buttons:**
- Bold, Italic, Underline
- Code (inline code)
- Undo / Redo

### Slash Commands

Type **/** anywhere in the editor to trigger the slash menu:

| Command | Result |
|---------|--------|
| `/heading` | H1, H2, or H3 headings |
| `/list` | Bullet list or numbered list |
| `/code` | Code block with syntax highlighting |
| `/quote` | Blockquote |
| `/table` | Insert 3x3 table (resizable) |

**Example workflow:**
1. Type `/h`
2. Menu shows "Heading" options
3. Select "Heading 2" with arrow keys or click
4. Type your heading text

### Markdown Shortcuts

The editor auto-converts markdown as you type:

**Headings:**
- `# Text` becomes H1
- `## Text` becomes H2
- `### Text` becomes H3

**Lists:**
- `* Text` or `- Text` becomes a bullet list
- `1. Text` becomes a numbered list

**Formatting:**
- `**bold**` becomes **bold**
- `*italic*` becomes *italic*
- `` `code` `` becomes inline code

**Links:**
- URLs automatically become clickable
- `[text](url)` becomes a clickable link

### Markdown Mode

For power users who prefer writing in pure markdown:

1. Click **MD** toggle button (top right of editor)
2. Editor switches to plain text markdown
3. Edit with full markdown syntax
4. Toggle back to see rich preview

---

## Organizing Notes

### Folders

**Create Folder:**
1. Click **+ New Folder** button (below search)
2. Enter folder name
3. Press Enter

**Create Nested Folder:**
1. Right-click parent folder
2. Select **New Subfolder**
3. Enter name

**Rename Folder:** Right-click > **Rename** > Enter new name

**Delete Folder:** Right-click > **Delete** > Confirm. All notes in the folder are deleted too. You have 10 seconds to click **Undo** in the toast notification.

### Drag-and-Drop

- **Move notes between folders:** Click and hold a note, drag to target folder, release
- **Move folders:** Click and hold a folder, drag to parent folder or root, release
- **Reorder notes:** Drag notes up/down within the same folder

### Favorites & Pins

- **Favorite a Note:** Hover over note in list, click star icon. Note appears in "Favorites" filter.
- **Pin a Note:** Hover over note in list, click pin icon. Note stays at top of list even when sorted.

> **Tip:** Pin frequently referenced notes, favorite important projects.

---

## Searching Notes

### Quick Search (Cmd+K)

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the command palette:

1. Type search query
2. Results show matching notes, tasks, events
3. Use arrow keys to navigate results
4. Press Enter to open

Search is case-insensitive with partial word matching.

### In-Page Search

Use the search box at the top of the notes panel:

1. Click search box
2. Type your query
3. Note list filters in real-time
4. Shows matching notes with highlighted snippets

---

## Wiki-Style Links

### Create Links Between Notes

**Syntax:** `[[Note Title]]`

**Autocomplete workflow:**
1. Type `[[` in the editor
2. Autocomplete dropdown appears
3. Type to search for notes (fuzzy matching)
4. Use arrow keys to navigate results
5. Press **Enter** to insert link
6. Link appears as `[[Note Title]]`

**Autocomplete features:**
- Fuzzy search (matches "prjct" to "Project Plan")
- Shows folder path for context
- Highlights matching characters
- Max 10 results for performance

Links are clickable in the editor -- click to navigate to the linked note.

---

## Tags

### Add Tags to Notes

**Method 1:** Tag picker (right panel when editing)
1. Click **+ Add Tag** button
2. Type tag name
3. Press Enter or click suggestion

**Method 2:** Inline tags (in note content)
- Type `#tagname` in note
- Tag automatically extracted and added to metadata

### Nested Tags (Hierarchical Organization)

Use `/` separator for hierarchy:

- `projects/work/client-a`
- `projects/personal/home-renovation`
- `learning/programming/javascript`

The tag picker expands to a tree view showing hierarchy. Selecting a parent tag includes all child notes. For example, filtering by `projects` shows all `projects/work/...` and `projects/personal/...` notes.

### Filter by Tags

1. Click tag in right panel
2. Note list filters to show only notes with that tag
3. Click **X** to clear filter

**Multi-tag filtering:** Select multiple tags -- only notes with ALL selected tags are shown (AND logic).

---

## Graph View

### Visualize Note Connections

Access: Click **Graph** button (top right of notes panel)

**What it shows:**
- Each note is a node (circle)
- Wiki links create connections (lines)
- Tag-based connections (dashed lines)
- Bidirectional links are stronger (thicker lines)

**Interactive features:**
- Click and drag nodes to rearrange
- Scroll to zoom in/out
- Double-click node to navigate to note

### Focus Mode

1. Click any node on the graph
2. Graph filters to show only connected notes
3. Depth slider controls how many hops to show (1--3)
4. Click empty space to unfocus

### Visual Analytics

- **Node Sizing:** Nodes scale based on link count. Hub notes (many connections) are larger.
- **Color Grouping:** Group by folder or by tag. Color legend shows active groups.
- **Link Strength:** Strong links (bidirectional), medium links (single direction), weak links (tag-based) are visually distinct.

### Advanced Filters

Click **Filters** button to open the advanced panel:

- **Text Search** -- Filter nodes by note title
- **Tag Filter** -- Multi-select tags (AND logic)
- **Node Type** -- Notes only, tags only, or both

### Orphan Detection

Notes with no wiki links and no tags are highlighted as orphans (magenta fill, orange border). The system suggests connections based on similar titles, same folder, recent edits, and content overlap. Use one-click actions to add wiki links or tags.

---

## Export & Import

### Export Single Note

1. Open note
2. Click three-dot menu (top right)
3. Select **Export**
4. Choose format from the export modal:

| Format | Extension | Best For |
|--------|-----------|----------|
| **Markdown** | `.md` | Plain text editors, GitHub, Obsidian |
| **HTML** | `.html` | Sharing in browsers, email |
| **PDF** | `.pdf` | Printing, formal sharing |
| **Plain Text** | `.txt` | Maximum compatibility |

5. Click **Download** to save the file

### Export All Data

Go to **Settings** > **Backup & Sync** > **Export All Data**

Downloads a `.brain` file containing all notes, folders, tasks, events, time entries, and settings.

---

## Best Practices

### Note Naming

**Good note titles:**
- "Project Alpha - Meeting Notes 2025-12-27"
- "React Hooks - useEffect Best Practices"
- "Client XYZ - Requirements"

**Avoid:** "Untitled", "Notes", "Temp" -- always give your notes descriptive names.

### Folder Structure

```
Projects/
  Work/
    Client-A/
    Client-B/
  Personal/
    Home-Renovation/
    Learning/
Reference/
  Recipes/
  Checklists/
  Templates/
Archive/
  2024/
  2023/
```

> **Tip:** Keep it flat initially -- only add nesting as needed. Too much hierarchy early creates friction.

### Linking Strategy

Create links when a note references another note or when a concept appears in multiple places. Don't over-link -- focus on meaningful connections, not every mention.

### Tag Taxonomy

Design your tag hierarchy before using extensively:

```
projects/work/...
projects/personal/...
learning/programming/...
status/draft
status/final
```

Be consistent: decide on singular vs plural, use lowercase, and document your tag system in a "Tag System" note.

### Regular Maintenance

- **Weekly:** Review orphan notes (add tags or links), delete duplicates or outdated notes
- **Monthly:** Export full backup, review tag system, check graph view for disconnected clusters

---

## Version History

Every note maintains automatic version snapshots so you can review past states, compare changes, and restore previous versions.

### Viewing Version History

1. Open a note
2. Click three-dot menu (top right) > **Version History**
3. A timeline panel opens showing all saved snapshots

Each snapshot shows the date, time, and a summary of what changed (e.g., "Added 3 paragraphs", "Deleted heading").

### Comparing Versions

1. In the version history panel, select two versions
2. Click **Compare**
3. A side-by-side diff view highlights additions (green), deletions (red), and modifications (yellow)

### Restoring a Version

1. Select a version in the history panel
2. Click **Restore This Version**
3. Confirm the action
4. The note reverts to that snapshot

The current state is saved as a new snapshot before restoring, so you never lose work.

### Snapshot Frequency

Snapshots are created automatically when you stop typing for 30 seconds (configurable in Settings > Notes > Version History Interval). You can also create a manual snapshot at any time by pressing **Cmd+Shift+S** (Mac) or **Ctrl+Shift+S** (Windows/Linux).

---

## Note Attachments

Attach files directly to any note for quick reference alongside your writing.

### Adding Attachments

1. Open a note
2. Click the **paperclip icon** in the toolbar, or drag and drop files onto the editor
3. Select one or more files from your device
4. Files appear in the **Attachments** section below the editor

### Supported File Types

Any file type is supported -- images, PDFs, documents, spreadsheets, archives, and more. Image attachments display inline previews. Other file types show an icon with the file name and size.

### Managing Attachments

- **Download:** Click the download icon next to any attachment
- **Remove:** Click the **X** icon on an attachment and confirm
- **Reorder:** Drag attachments to change their display order

### Storage

Attachments are stored locally in your browser alongside your notes. They are included in `.brain` backups and count toward your browser storage quota.

> **Tip:** Keep attachments under 10 MB each for best performance. Use links for large files stored in cloud services.

---

## Bulk Operations

Select multiple notes at once to perform actions in batch.

### Selecting Notes

1. Hold **Cmd** (Mac) or **Ctrl** (Windows/Linux) and click notes in the list to select individually
2. Hold **Shift** and click to select a range
3. Press **Cmd+A** (Mac) or **Ctrl+A** (Windows/Linux) to select all visible notes

A selection toolbar appears at the top showing the count of selected notes.

### Available Bulk Actions

| Action | What It Does |
|--------|-------------|
| **Move to Folder** | Move all selected notes to a chosen folder |
| **Add Tags** | Apply one or more tags to all selected notes |
| **Remove Tags** | Strip specific tags from all selected notes |
| **Delete** | Delete all selected notes (with confirmation) |
| **Export** | Download selected notes as individual files or a combined archive |

### Clearing Selection

Click **Deselect All** in the selection toolbar, or press **Escape**.

---

## Daily Notes

A dedicated feature for journaling and daily logging with a built-in calendar view.

### Creating a Daily Note

- **Keyboard shortcut:** Press **Ctrl+D** (Windows/Linux) or **Cmd+D** (Mac)
- **Sidebar:** Click the **calendar icon** in the notes panel header
- If a note for today already exists, it opens that note instead of creating a duplicate

### Daily Note Format

Each daily note is automatically titled with the current date (e.g., "2026-02-22 - Saturday") and placed in a **Daily Notes** folder. A default template is applied with sections for the day's goals, log, and reflections. You can customize this template in Settings > Notes > Daily Note Template.

### Calendar View

Click the **calendar icon** at the top of the notes panel to open the daily notes calendar:

- Days with existing daily notes are highlighted with a dot
- Click any date to open (or create) the daily note for that day
- Navigate months with arrow buttons
- Today's date is always highlighted

### Linking Daily Notes

Daily notes support all standard features -- wiki links, tags, attachments. Use them to link to project notes, meeting notes, or tasks for a connected daily record.

---

## AI Writing Assist

A contextual AI menu that helps you write, edit, and organize note content. All processing is described in the [AI Terminal](./ai-terminal.md) documentation.

### Accessing AI Writing Assist

1. Select text in the editor (or place your cursor in a paragraph)
2. Click the **sparkle icon** that appears in the toolbar, or press **Cmd+J** (Mac) / **Ctrl+J** (Windows/Linux)
3. The AI menu appears with available actions

### Available Actions

| Action | What It Does |
|--------|-------------|
| **Summarize** | Condenses selected text into a brief summary |
| **Extract Action Items** | Pulls out tasks and to-dos from meeting notes or freeform text |
| **Improve Writing** | Rewrites for clarity, grammar, and tone |
| **Generate Outline** | Creates a structured outline from a topic or rough notes |
| **Expand** | Elaborates on a short passage with more detail |
| **Simplify** | Rewrites in plainer, more accessible language |

### Using Results

After the AI generates output, you can:

- **Replace** the selected text with the result
- **Insert Below** to keep the original and add the result underneath
- **Copy** the result to clipboard
- **Regenerate** if the first result isn't what you need

> **Tip:** For best results with "Extract Action Items," select the full body of meeting notes or brainstorm text. The AI will create a checklist you can convert directly into tasks.

---

## Smart Templates

Pre-built and custom templates for quickly creating structured notes with consistent formatting.

### Accessing Smart Templates

- Press **Ctrl+Shift+T** (Windows/Linux) or **Cmd+Shift+T** (Mac) to open the template picker
- Or click **+ New Note** > **From Template**

### Built-in Templates

| Template | Contents |
|----------|---------|
| **Meeting Notes** | Attendees, agenda, discussion points, action items, follow-ups |
| **Project Plan** | Objectives, scope, timeline, milestones, risks, resources |
| **Weekly Review** | Wins, challenges, lessons learned, next week priorities |
| **Decision Log** | Context, options considered, decision, rationale, outcome |
| **1-on-1 Notes** | Check-in, discussion topics, action items, feedback |
| **Research Notes** | Question, sources, findings, analysis, conclusions |

### Creating Custom Templates

1. Open Settings > Notes > Smart Templates
2. Click **+ New Template**
3. Enter a template name and optional description
4. Write the template content using the full rich text editor
5. Click **Save Template**

Custom templates appear alongside built-in templates in the template picker.

### Editing and Deleting Templates

In Settings > Notes > Smart Templates, click any custom template to edit its content or click the trash icon to delete. Built-in templates cannot be deleted but can be hidden.

---

## Note Embeds

Embed live data from other modules directly inside your notes using slash commands. Embeds update in real-time as the source data changes.

### Embedding a Task

1. Type `/embed-task` in the editor
2. Search for the task by title
3. Select the task from results
4. An inline task card appears showing title, status, priority, and due date

Click the embedded task to open the full task detail panel. Changes to the task (status, priority) are reflected in the embed automatically.

### Embedding a Calendar Event

1. Type `/embed-event` in the editor
2. Search for the event by title or browse upcoming events
3. Select the event
4. An inline event card appears showing title, date, time, and location

### Embedding Spreadsheet Data

1. Type `/embed-sheet` in the editor
2. Select a spreadsheet and cell range
3. A live table renders inline with the selected data

Edits to the source spreadsheet are reflected in the embed. The embed is read-only within the note -- click it to open the source spreadsheet for editing.

### Managing Embeds

- **Remove an embed:** Click the embed, then click the **X** icon or press **Delete**
- **Resize:** Drag the bottom edge of an embed to adjust its height
- Embeds are included when exporting notes (rendered as static content in exported files)

---

## Advanced Features

### Note Templates

1. Create a note with your template structure
2. Add tag `#template`
3. When creating a new note, select the template
4. Content is copied to the new note

**Example templates:** Meeting notes, project planning, weekly review.

### Code Blocks

1. Type `/code` to insert code block
2. Select language (JavaScript, Python, etc.)
3. Paste or type code
4. Syntax highlighting applies automatically

**Supported languages:** JavaScript, TypeScript, Python, Java, C++, HTML, CSS, Markdown, JSON, YAML, SQL, and more.

### Tables

Insert tables with `/table` command (default 3x3). Click cell to edit, Tab to move to next cell, Enter to move to next row.

---

## Troubleshooting

### Notes Not Saving
- Check browser storage quota (Settings > Storage)
- Try different browser

### Can't Find a Note
- Use Cmd+K global search
- Check if note is in different folder
- Verify not filtered by tag
- Check Archive folder

### Graph View Not Showing Connections
- Ensure wiki links use `[[Note Title]]` syntax
- Check if notes have tags
- Try "Show All Nodes" filter option
- Refresh page to rebuild graph

### Auto-Save Failed
- Check browser storage quota
- Close other tabs (memory limit)
- Export backup and reimport data

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and concepts
- **[Dashboard & Widgets](./dashboard-widgets.md)** -- RecentNotes widget
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Complete shortcut reference
- **[Backup & Sync](./backup-sync.md)** -- Protecting your notes with backups
