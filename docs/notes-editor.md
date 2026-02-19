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

### Export Single Note to Markdown

1. Open note
2. Click three-dot menu (top right)
3. Select **Export as Markdown**
4. Downloads `note-title.md` file

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
