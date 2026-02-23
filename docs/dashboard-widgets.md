# 60+ Dashboard Widgets

The NeumanOS dashboard is your customizable home page with 60+ widgets across nine categories. All widgets are free forever, and you can arrange them to suit your workflow.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Core Widgets](#core-widgets)
- [Productivity Widgets](#productivity-widgets)
- [News Widgets](#news-widgets)
- [Fun Widgets](#fun-widgets)
- [Finance Widgets](#finance-widgets)
- [Visual Widgets](#visual-widgets)
- [Dev Widgets](#dev-widgets)
- [Utility Widgets](#utility-widgets)
- [Custom Widgets](#custom-widgets)
- [Widget Sizes](#widget-sizes)
- [Widget Layout & Customization](#widget-layout--customization)
- [Saved Dashboard Layouts](#saved-dashboard-layouts)
- [Dashboard Templates](#dashboard-templates)
- [Custom Widget Builder](#custom-widget-builder)
- [Performance Tips](#performance-tips)
- [Request a Widget](#request-a-widget)
- [Related Guides](#related-guides)

---

## Getting Started

### Access Dashboard

Click **Dashboard** in the left sidebar. This is your customizable home page.

### Add Widgets

1. Click **+ Add Widget** button (top right)
2. Browse widget library by category
3. Click widget card to add to dashboard
4. Widget appears in next available grid position
5. Optionally drag to reposition

### Remove Widgets

- **Method 1:** Hover over widget > Click gear icon > "Remove"
- **Method 2:** Right-click widget > "Remove Widget"
- **Method 3:** Widget settings menu > "Remove from Dashboard"

### Configure Widgets

Each widget has a settings menu (gear icon):
- **Refresh interval** -- How often to update data (30s, 1m, 5m, etc.)
- **Display options** -- Size, color, theme variations
- **Data source** -- API keys (if required), filters, categories
- **Notifications** -- Enable/disable alerts for certain widgets

---

## Core Widgets

These widgets integrate directly with NeumanOS modules and display your local data.

### My Day (`myday`)

A daily overview combining tasks due today, upcoming events, habits, and energy level into a single glanceable widget. Your personal command center for the day.

---

### Task Summary (`taskssummary`)

Shows a task overview with status breakdown (To Do, In Progress, Done). Displays total task count with color-coded status distribution. Click to navigate directly to your Kanban board.

| Setting | Options |
|---------|---------|
| Filter by status | All, To Do, In Progress, Done |
| Date range | All time, this week, this month |
| Show completed | Toggle on/off |

> **Tip:** Great for morning dashboard reviews and daily standup prep.

---

### Tasks Quick Add (`tasksquickadd`)

Rapid task creation without navigating away from your dashboard. Type a task title and press Enter to add it instantly to your board.

---

### Upcoming Events (`upcomingevents`)

Displays the next 7 days of calendar events in chronological order, color-coded by event type. Click any event to open calendar detail.

| Setting | Options |
|---------|---------|
| Days to show | 1--30 |
| All-day events | Toggle on/off |
| Event type filter | Work, personal, etc. |

---

### Recent Notes (`recentnotes`)

Shows your last 5 edited notes with titles, folder paths, and relative timestamps. Click any note to open it in the editor.

| Setting | Options |
|---------|---------|
| Notes to show | 3--10 |
| Favorites only | Toggle on/off |
| Folder filter | Specific folder or all |

---

### Habit Summary (`habitsummary`)

Displays your habit streaks, completion rates, and today's pending habits. Click any habit to mark it complete directly from the dashboard.

---

### Activity Feed (`activityfeed`)

A chronological feed of your recent actions across all modules -- notes edited, tasks completed, events created, habits checked off. Keeps you aware of your productivity patterns.

---

### AI Briefing (`aibriefing`)

An AI-generated summary of your day: upcoming deadlines, overdue tasks, habit streaks at risk, and schedule conflicts. Requires an AI provider to be configured.

---

### Bookmarks (`bookmarks`)

Quick access to your saved bookmarks from the Link Library, displayed as a compact grid on your dashboard.

---

### Quick Add (`quickadd`)

Rapid creation for tasks, events, and notes without navigating away from your dashboard. Uses a tabbed interface with keyboard shortcuts (Enter to create, Tab to switch tabs).

| Setting | Options |
|---------|---------|
| Default type | Task, Event, or Note |
| Default task column | Any column |
| Default note folder | Any folder |

> **Tip:** Perfect for capturing ideas without breaking your flow.

---

## Productivity Widgets

### Pomodoro (`pomodoro`)

A 25/5 minute Pomodoro timer for focus sessions with audio notification on completion, session counter, and visual progress ring.

| Setting | Options |
|---------|---------|
| Work duration | 15--60 minutes |
| Break duration | 5--15 minutes |
| Auto-start break | Toggle on/off |
| Sound volume | Adjustable |

---

### Shortcuts (`shortcuts`)

A customizable quick links grid. Add your frequently visited sites with custom icons, drag to reorder, and click to open in a new tab.

| Setting | Options |
|---------|---------|
| Links | Add/edit/remove |
| Icons | 100+ icon library |
| Layout | Grid arrangement |

> **Tip:** Use this to replace your browser bookmarks bar as a personal start page.

---

### Countdown (`countdown`)

Count down to important dates with custom message, days/hours/minutes/seconds display, and notifications. Supports multiple countdown instances.

---

### Flashcard (`flashcard`)

Create and review flashcards using spaced repetition. Supports markdown formatting and can be linked to notes for study sessions.

---

### Daily Quests (`dailyquests`)

Gamified daily goals that reset each day. Complete quests to build streaks and earn productivity karma. Configurable quest lists.

---

### Energy Tracker (`energytracker`)

Log your energy levels throughout the day and visualize patterns over time. Helps you identify your peak productivity hours.

---

### Productivity Karma (`productivitykarma`)

A gamified productivity score based on tasks completed, habits maintained, focus sessions, and daily quest completion. Track your streak and level up.

---

### Weekly Insights (`weeklyinsights`)

An end-of-week summary showing tasks completed, time tracked, habits maintained, and focus hours. Compare week-over-week trends.

---

### Clipboard (`clipboard`)

A persistent clipboard manager. Copy text and it stays accessible across sessions. Pin frequently used snippets for quick access.

---

### Tab Manager (`tabmanager`)

Manage your browser tabs from within NeumanOS. Save tab groups, restore sessions, and reduce tab clutter.

---

### Forms (`forms`)

Create and manage custom forms. Collect structured data with text fields, dropdowns, checkboxes, and more. Responses stored locally.

---

### Uptime (`uptime`)

Monitor website availability. Enter URLs to track and get notified when sites go down. Shows uptime percentage and response times.

---

### Analytics (`analytics`)

View your NeumanOS usage analytics -- notes created, tasks completed, time tracked, and feature usage patterns over time.

---

### Portfolio (`portfolio`)

Track your investment portfolio with positions, gains/losses, and allocation breakdown. All data stored locally.

---

## News Widgets

All news widgets contact external APIs to fetch content. No personal data is sent -- only public API requests.

### Hacker News (`hackernews`)

Top stories from Hacker News with title, points, and comment count. Click to read on news.ycombinator.com.

| Setting | Options |
|---------|---------|
| Story count | 5--20 |
| Sort by | Top, new, best, ask, show |

---

### Reddit (`reddit`)

Top posts from your configured subreddits with post title, score, and comments. Supports multiple subreddits.

| Setting | Options |
|---------|---------|
| Subreddits | Comma-separated list |
| Post count | 5--20 |
| Sort | Hot, new, top, rising |
| Time range | Hour, day, week, month |

---

### AI News (`ainews`)

Curated artificial intelligence and machine learning news from top sources.

---

### Sports (`sports`)

Live sports scores and schedules from ESPN. Covers major leagues including NFL, NBA, MLB, NHL, and soccer.

---

### Wikipedia (`wikipedia`)

Random or featured Wikipedia articles. Learn something new every time you open your dashboard.

---

### Motivational (`motivational`)

Motivational quotes and affirmations to keep you inspired throughout the day.

---

---

## Fun Widgets

### Quote of the Day (`quote`)

Daily inspirational quote with author. Includes share button (copy to clipboard), refresh for new quote, and ability to save favorites.

| Setting | Options |
|---------|---------|
| Category | Inspirational, funny, tech, stoic |
| Auto-rotate | Daily, hourly, manual |

---

### Random Facts (`facts`)

Fun facts from various categories with refresh and share buttons.

| Setting | Options |
|---------|---------|
| Category | Science, history, nature, random |
| Auto-refresh | Configurable |

---

### Jokes (`joke`)

Programming jokes and puns in one-liner and Q&A format. Safe for work content.

| Setting | Options |
|---------|---------|
| Type | Programming, general, puns |

---

### Word of the Day (`wordofday`)

Vocabulary builder with definitions, pronunciation, examples, and part of speech. Save words to favorites.

| Setting | Options |
|---------|---------|
| Difficulty | Beginner, intermediate, advanced |

---

### Bored (`bored`)

Random activity suggestions including activity name, type, participant count, accessibility level, and cost estimate. Filter by type and participants.

---

### Pixel Art (`pixelart`)

A pixel art canvas for creative breaks. Draw pixel art directly on your dashboard and save your creations.

---

### Typing Test (`typingtest`)

Test and improve your typing speed and accuracy. Tracks WPM, accuracy, and progress over time.

---

### Memory Game (`memorygame`)

A classic card-matching memory game for quick mental breaks. Tracks your best times.

---

## Finance Widgets

All finance widgets contact external APIs for live market data.

### Stock Market (`stockmarket`)

Stock prices and indices with ticker symbol search, current price, day change percentage, and simple line charts.

| Setting | Options |
|---------|---------|
| Tickers | Comma-separated symbols |
| Refresh | 1m, 5m, 15m |

---

### Crypto (`crypto`)

Cryptocurrency prices for Bitcoin, Ethereum, and 100+ altcoins. Shows current price, 24h change, market cap, volume, and sparkline charts.

| Setting | Options |
|---------|---------|
| Coins | BTC, ETH, ADA, SOL, etc. |
| Refresh | 1m, 5m, 15m |
| Currency | USD, EUR, BTC |

---

### Currency Converter (`currency`)

Live currency conversion with 150+ currencies, real-time exchange rates, and swap direction button. No API key required.

---

## Visual Widgets

### Unsplash (`unsplash`)

Beautiful daily photos from Unsplash with photographer credit, refresh button, download button, and category filter. No API key required.

| Setting | Options |
|---------|---------|
| Category | Nature, tech, architecture, minimal, etc. |
| Auto-refresh | Daily, hourly, manual |
| Orientation | Landscape, portrait, any |

---

### Color Palette (`colorpalette`)

HEX/RGB/HSL color picker and converter with visual picker, one-click copy to clipboard, color history, and palette generator (complementary, analogous, triadic).

---

### Weather Map (`weathermap`)

Interactive weather map overlay on OpenStreetMap. View temperature, precipitation, and wind patterns for any region.

---

### Weather Forecast (`weatherforecast`)

Current weather plus 7-day forecast with temperature, conditions, hourly breakdown, and sunrise/sunset times. Uses Open-Meteo (free, no API key required). Location is stored locally and never sent to NeumanOS servers.

| Setting | Options |
|---------|---------|
| Location | Auto-detect or manual |
| Units | Fahrenheit / Celsius |
| Refresh | 5--60 minutes |

---

### Air Quality (`airquality`)

Real-time air quality index for your location with pollutant breakdown. Uses Open-Meteo air quality API.

---

## Dev Widgets

These widgets are designed for developers and contact external APIs.

### GitHub (`github`)

Your GitHub profile overview showing contribution graph, recent repos, and activity summary. Requires a GitHub username (no API key needed for public data).

---

### GitHub Trending (`githubtrending`)

Trending repositories on GitHub showing repo name, description, stars, and language.

| Setting | Options |
|---------|---------|
| Language | JavaScript, Python, All, etc. |
| Time range | Today, this week, this month |
| Count | 5--15 |

---

### Dev.to (`devto`)

Trending developer articles from dev.to with tags, reading time, and reactions.

| Setting | Options |
|---------|---------|
| Tag filter | javascript, python, webdev, etc. |
| Count | 5--15 |
| Sort | Latest, top, rising |

---

### Awesome Lists (`awesomelists`)

Browse curated awesome lists from GitHub. Discover tools, libraries, and resources organized by topic.

---

### Repo Stats (`repostats`)

Display stats for any GitHub repository -- stars, forks, issues, and recent activity.

---

### Package Stats (`packagestats`)

NPM package download statistics. Track weekly downloads, version history, and bundle size for any npm package.

---

### Twitch (`twitch`)

See who's live on Twitch in your followed channels or browse top streams by category.

---

### YouTube (`youtube`)

Display recent uploads or trending videos from YouTube channels you follow.

---

## Utility Widgets

### Calculator (`calculator`)

Basic calculator with standard layout, keyboard input, memory functions (M+, M-, MR, MC), and history of recent calculations.

---

### QR Code Generator (`qrcode`)

Generate QR codes from text or URLs. Download as PNG with adjustable size (100px--500px) and error correction levels.

---

### Unit Converter (`unitconverter`)

Convert between units of measurement -- length, weight, temperature, volume, speed, data, and more.

---

### World Clock (`worldclock`)

Display up to 6 timezones simultaneously in analog or digital format. Daylight saving time aware.

---

### Dictionary (`dictionary`)

Quick word definitions with search, definitions, phonetics, synonyms, antonyms, example sentences, and audio pronunciation.

---

### IP Info (`ipinfo`)

Displays your current IP address (IPv4/IPv6), ISP, city, region, country, and VPN detection. Copy IP to clipboard with one click. No data is stored.

---

## Custom Widgets

### Custom Widget Builder

NeumanOS includes a custom widget builder for creating your own dashboard widgets. Build widgets using HTML, CSS, and JavaScript with access to the NeumanOS API for reading your local data (notes, tasks, events).

**How to create a custom widget:**

1. Click **+ Add Widget** > **Custom** category
2. Select **Create Custom Widget**
3. Use the built-in code editor to write your widget
4. Preview in real-time as you code
5. Save and add to your dashboard

Custom widgets have access to:
- Your notes, tasks, and calendar data (read-only)
- External APIs via fetch
- Local storage for widget-specific settings
- Theme variables for consistent styling

---

## Widget Sizes

Widgets support three width sizes on the dashboard grid:

| Size | Grid Columns | Best For |
|------|-------------|----------|
| **1x** (Small) | 1 column | Compact info: clock, quote, quick add |
| **2x** (Medium) | 2 columns | Standard widgets: task summary, news feeds, charts |
| **3x** (Large) | 3 columns | Full-width: weather map, calendar view, activity feed |

To change a widget's size, hover over the widget and drag the resize handle on the bottom-right corner. Widget content automatically adapts to the new dimensions.

---

## Widget Layout & Customization

### Grid System

Widgets use a responsive drag-and-drop grid:
- 12 columns on desktop, 6 on tablet, 1 on mobile
- Snap-to-grid alignment
- Overlap prevention (widgets push others when dragged)
- Resize handles on corners

### Resize Widgets

1. Hover over widget bottom-right corner
2. Cursor changes to resize icon
3. Click and drag to resize
4. Release to set new size
5. Widget content adapts to new dimensions

### Save Layout

Your widget arrangement auto-saves automatically. No manual save needed -- changes persist immediately.

### Reset Layout

1. Go to **Settings** > **Dashboard**
2. Click **Reset Layout**
3. Confirm reset
4. Dashboard returns to default layout

---

## Saved Dashboard Layouts

You can save multiple dashboard layouts and switch between them depending on your context (work, personal, weekend, etc.).

**Save a layout:**

1. Arrange your dashboard the way you want
2. Click the layout menu (grid icon in dashboard toolbar)
3. Click **Save Current Layout**
4. Name your layout (e.g., "Work Dashboard", "Morning Routine")

**Switch layouts:**

1. Click the layout menu
2. Select a saved layout
3. Dashboard instantly reconfigures

**Delete a layout:**

1. Click the layout menu
2. Hover over the layout name
3. Click the trash icon

Layouts save everything: which widgets are active, their positions, sizes, and individual widget settings.

---

## Dashboard Templates

NeumanOS provides pre-built dashboard templates to help you get started quickly:

| Template | Description |
|----------|-------------|
| **Productivity** | Task summary, upcoming events, pomodoro, quick add, habit summary |
| **Developer** | GitHub trending, Hacker News, Dev.to, package stats, repo stats |
| **Finance** | Stock market, crypto, currency converter, portfolio, AI news |
| **Minimal** | My Day, recent notes, quote, weather forecast |
| **Full Overview** | A broad selection across all categories |

**Apply a template:**

1. Click **+ Add Widget** > **Templates** tab
2. Preview the template layout
3. Click **Apply Template**
4. Optionally merge with or replace your current layout

---

## Performance Tips

### Limit Active Widgets

Keep fewer than 12 widgets active for optimal performance. Each widget makes API calls and consumes CPU for real-time updates.

> **Tip:** Add widgets you check daily, remove rarely-used ones.

### Disable Auto-Refresh

Widgets with auto-refresh (weather, news, crypto) can slow things down:

1. Click widget settings (gear icon)
2. Set **Refresh Interval** to "Manual"
3. Click refresh button when needed

This is especially helpful on slow internet connections or when battery saving matters on laptops.

### Lazy Loading

Widgets only load when scrolled into view, so your initial page load stays fast. Widgets appear as you scroll down.

---

## Request a Widget

Want a widget we don't have?

1. Create a GitHub issue: [Feature Request](https://github.com/travisjneuman/neumanos/issues)
2. Include the widget name, description, use case, and data source
3. Community votes on requests
4. Popular requests get prioritized

---

## Complete Widget Registry

For quick reference, here are all 60 registered widget IDs:

`myday`, `taskssummary`, `tasksquickadd`, `upcomingevents`, `recentnotes`, `habitsummary`, `quote`, `crypto`, `hackernews`, `facts`, `github`, `joke`, `unsplash`, `pomodoro`, `reddit`, `devto`, `wordofday`, `currency`, `worldclock`, `ipinfo`, `qrcode`, `colorpalette`, `weathermap`, `calculator`, `unitconverter`, `countdown`, `shortcuts`, `stockmarket`, `wikipedia`, `bored`, `dictionary`, `ainews`, `airquality`, `packagestats`, `pixelart`, `typingtest`, `memorygame`, `motivational`, `githubtrending`, `awesomelists`, `repostats`, `sports`, `twitch`, `youtube`, `analytics`, `clipboard`, `tabmanager`, `uptime`, `forms`, `bookmarks`, `activityfeed`, `aibriefing`, `flashcard`, `dailyquests`, `energytracker`, `portfolio`, `weeklyinsights`, `weatherforecast`, `quickadd`, `productivitykarma`

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Dashboard overview and setup
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Widget navigation shortcuts
- **[Privacy & Security](./privacy-security.md)** -- Which widgets contact external services
- **[Troubleshooting](./troubleshooting.md)** -- Widget-specific fixes
