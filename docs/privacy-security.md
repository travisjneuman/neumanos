# Privacy & Security

NeumanOS is built on a simple principle: your data belongs to you. This guide explains where your data lives, what we collect (almost nothing), and how your information is protected.

---

## Table of Contents

- [Where Your Data Lives](#where-your-data-lives)
- [Privacy Guarantees](#privacy-guarantees)
- [Analytics Disclosure](#analytics-disclosure)
- [Dashboard Widgets & External Data](#dashboard-widgets--external-data)
- [AI Terminal Security](#ai-terminal-security)
- [Backing Up Your Data](#backing-up-your-data)
- [Browser Security Tips](#browser-security-tips)
- [Related Guides](#related-guides)

---

## Where Your Data Lives

All your data -- notes, tasks, calendar events, time entries, settings, and widget configurations -- is stored **locally in your web browser** on your own device. NeumanOS uses your browser's built-in storage, which provides 50GB+ of capacity depending on your available disk space.

**What this means in practice:**

- Your data lives on your computer, not on our servers
- No internet connection is required to use NeumanOS (after the initial page load)
- Nobody -- not even us -- can access your data remotely
- If you clear your browser data, your NeumanOS data goes with it (so back up regularly)

Your data never leaves your device unless you explicitly export it, set up auto-save to a cloud folder you control, or use optional dashboard widgets that fetch data from external APIs (see [Dashboard Widgets & External Data](#dashboard-widgets--external-data) below).

---

## Privacy Guarantees

### What NeumanOS Does NOT Collect

- No account creation or email addresses
- No passwords (except your optional AI encryption password, stored in memory only)
- No behavior tracking, user profiling, or advertising analytics
- No crash reports or error telemetry
- No cookies (except theme preference)
- No fingerprinting
- No advertising or marketing data
- No personal data of any kind

### What NeumanOS Does NOT Do

- We do not create user accounts
- We do not store data on our servers
- We do not sell or share data (we don't have any to sell)
- We do not track which features you use
- We do not know how many notes you have, what tasks you create, or how you use the app

### Open Source

NeumanOS is open source under the MIT License. You can audit the entire codebase yourself to verify these claims:

- **Repository:** [github.com/travisjneuman/neumanos](https://github.com/travisjneuman/neumanos)

---

## Analytics Disclosure

NeumanOS uses **Cloudflare Web Analytics** for basic, privacy-respecting site metrics.

### What Cloudflare Web Analytics Does

- Counts page views (aggregate, not per-user)
- Shows country-level distribution of visitors
- Measures basic performance metrics (page load time)

### What Cloudflare Web Analytics Does NOT Do

- Does NOT use cookies
- Does NOT use fingerprinting
- Does NOT store IP addresses
- Does NOT track individual users
- Does NOT identify returning visitors
- Does NOT collect any personal data

Cloudflare Web Analytics is GDPR and CCPA compliant. It provides only aggregate, anonymized metrics -- we can see that "500 people visited this week from 20 countries" but we cannot identify any individual.

### Blocking Analytics

You can block Cloudflare Web Analytics with any standard ad blocker. The app works perfectly without it. Blocking analytics has zero impact on functionality.

---

## Dashboard Widgets & External Data

Some optional dashboard widgets fetch data from third-party APIs to display real-time information. These requests only happen when you actively add the widget to your dashboard.

### Widgets That Contact External Services

**Location-based widgets:**

| Widget | Service | Data Sent |
|--------|---------|-----------|
| **IP Info** | ipapi.co | Your IP address (sent automatically by the HTTP request) |
| **Weather Forecast** | api.open-meteo.com | Approximate location coordinates |
| **Weather Map** | api.open-meteo.com, OpenStreetMap tiles | Approximate location coordinates |
| **Air Quality** | air-quality-api.open-meteo.com | Approximate location coordinates |

**News category widgets** (all contact external APIs, no personal data sent):

| Widget | Service |
|--------|---------|
| **Hacker News** | news.ycombinator.com API |
| **Reddit** | reddit.com public API |
| **AI News** | Various news aggregator APIs |
| **Sports** | site.api.espn.com |
| **Wikipedia** | en.wikipedia.org API |
| **Motivational** | Quotes API |

**Dev category widgets** (all contact external APIs, no personal data sent):

| Widget | Service |
|--------|---------|
| **GitHub / GitHub Trending** | api.github.com |
| **Dev.to** | dev.to API |
| **Awesome Lists** | GitHub API |
| **Repo Stats** | GitHub API |
| **Package Stats** | npm registry API |
| **Twitch** | Twitch API |
| **YouTube** | YouTube public API |

**Finance category widgets** (all contact external APIs, no personal data sent):

| Widget | Service |
|--------|---------|
| **Stock Market** | Financial data APIs |
| **Crypto** | CoinGecko or similar API |
| **Currency Converter** | Exchange rate APIs |

**Fun category widgets** (all contact external APIs, no personal data sent):

| Widget | Service |
|--------|---------|
| **Quote of the Day** | Quotes API |
| **Random Facts** | Facts API |
| **Jokes** | JokeAPI |
| **Word of the Day** | Dictionary API |
| **Bored** | BoredAPI |

**Other widgets contacting external services:**

| Widget | Service | Data Sent |
|--------|---------|-----------|
| **Unsplash** | unsplash.com | No personal data |
| **Dictionary** | Free dictionary API | Search terms only |
| **Uptime** | Target URLs you configure | HTTP requests to those URLs |

**General rule:** All widgets in the **news**, **dev**, **finance**, and **fun** categories contact external APIs to fetch content. Widgets in the **core** and **productivity** categories read only from your local data and make no external requests (except AI Briefing, which uses your configured AI provider).

### Widgets That Stay Fully Local

These widgets never contact any external service:

- My Day, Task Summary, Tasks Quick Add, Upcoming Events, Recent Notes, Habit Summary, Activity Feed, Bookmarks, Quick Add
- Pomodoro, Shortcuts, Countdown, Flashcard, Daily Quests, Energy Tracker, Productivity Karma, Weekly Insights, Clipboard, Tab Manager, Forms, Analytics, Portfolio
- Calculator, QR Code Generator, Unit Converter, Color Palette
- Pixel Art, Typing Test, Memory Game

### How to Control This

- **Widgets are opt-in** -- no external requests are made until you add a widget to your dashboard
- **Remove any widget at any time** to immediately stop those requests
- **No accounts or tokens** are shared with these services (except your own AI API keys with AI providers)
- **Check widget categories** -- core and productivity widgets are local-only; news, dev, finance, and fun widgets contact external APIs

These external requests are the only exception to the "data never leaves your device" principle. All your notes, tasks, calendar events, and other content remain entirely local.

---

## AI Terminal Security

If you use the AI Terminal with your own API keys, those keys receive special protection.

### Encryption

- API keys are encrypted with **AES-256** encryption before being stored
- You set a password that encrypts your keys (minimum 12 characters recommended)
- Your password is held in memory only -- it is never written to disk
- Your password is never sent over the network

### Key Storage

- Encrypted keys are stored in your browser's local storage
- Keys are decrypted only when needed and only in memory
- Keys are sent **only** to the AI provider you choose (OpenAI, Anthropic, etc.)
- Keys are **never** sent to NeumanOS servers

### What Happens During an AI Conversation

1. You type a message
2. NeumanOS decrypts your API key in memory
3. Your message is sent directly from your browser to the AI provider
4. The AI provider responds directly to your browser
5. NeumanOS never sees, stores, or relays your conversations

### Chat History Storage

AI conversation history is stored locally in your browser as plaintext (not encrypted). If your device or browser profile is compromised, conversation history could be read. You can clear chat history at any time from the AI Terminal settings.

### Password Expiry

You can configure how long your password stays active:
- **Daily** -- Most secure, re-enter every 24 hours
- **Weekly** -- Balanced security and convenience
- **Monthly** -- Most convenient, re-enter every 30 days

> **Tip:** Use a password manager to store your encryption password. If you forget it, you'll need to clear all keys and re-add them.

### If Your API Key Is Compromised

1. Immediately revoke the key in the provider's dashboard
2. Generate a new key
3. Check usage/billing for unauthorized activity
4. Report to the provider if unauthorized charges occurred
5. Update the key in NeumanOS settings
6. Set spending limits in provider dashboards when available

---

## Backing Up Your Data

Since your data is stored locally, backups are essential. NeumanOS provides two backup methods:

### Manual Export

1. Go to **Settings** > **Backup & Sync**
2. Click **Export All Data**
3. Downloads a `.brain` file (compressed JSON)
4. Store this file somewhere safe

### Auto-Save to Cloud Folder

1. Set up a cloud-synced folder on your computer (Google Drive, iCloud, OneDrive, Proton Drive, or Dropbox)
2. Go to **Settings** > **Backup & Sync**
3. Click **Choose Folder** and select your cloud folder
4. NeumanOS automatically saves backups every 30 seconds

**Privacy note:** Auto-save writes files to a folder you control on your computer. NeumanOS never has access to your cloud account -- your cloud provider's desktop app handles the syncing independently.

**What's included in backups:**
- All notes and folders
- All tasks and projects
- All calendar events
- All time tracking entries
- Widget configurations
- Settings and preferences
- AI chat history (encrypted keys excluded by default)

> **Tip:** For maximum privacy with cloud backups, use **Proton Drive** which provides end-to-end encryption.

See the [Backup & Sync Guide](./backup-sync.md) for detailed setup instructions.

---

## Browser Security Tips

### Protect Your Data

- **Don't clear browser data** without exporting a backup first
- **Use auto-save** to a cloud folder for continuous protection
- **Export backups regularly** -- at minimum once a month
- **Keep your browser updated** for the latest security patches
- **Install NeumanOS as a PWA** for offline access and added stability

### Recommended Browsers

NeumanOS works in all modern browsers. For the best experience:
- **Chrome 86+** -- Best compatibility, auto-save support
- **Edge 86+** -- Full feature support
- **Safari 15.2+** -- Full feature support
- **Firefox 88+** -- Works well, but auto-save to folder is not supported (use manual export)

### Shared or Public Computers

If you use NeumanOS on a shared computer:
- Always use a private/incognito window
- Your data will be deleted when you close the window
- Never enter AI API keys on shared computers
- Export your data before closing if needed

---

## Related Guides

- **[Backup & Sync](./backup-sync.md)** -- Detailed backup setup and cloud provider instructions
- **[AI Terminal](./ai-terminal.md)** -- API key setup and provider security details
- **[Getting Started](./getting-started.md)** -- Overview of NeumanOS and local storage
- **[Troubleshooting](./troubleshooting.md)** -- Data recovery and storage issues
