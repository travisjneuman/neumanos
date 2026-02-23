# Backup & Sync

NeumanOS stores all your data locally in your browser for maximum privacy. Auto-save backs up your data to a cloud-synced folder on your computer, keeping your data safe and accessible across devices -- without NeumanOS ever having access to your files.

---

## Table of Contents

- [Why Backup?](#why-backup)
- [How Auto-Save Works](#how-auto-save-works)
- [Setting Up Your Backup Folder](#setting-up-your-backup-folder)
- [Cloud Provider Instructions](#cloud-provider-instructions)
- [Syncing Across Devices](#syncing-across-devices)
- [Restoring from Backup](#restoring-from-backup)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Cloud Provider Comparison](#cloud-provider-comparison)
- [Related Guides](#related-guides)

---

## Why Backup?

Your data lives entirely in your browser's local storage. This means complete privacy and zero tracking, but it also means data can be lost if your browser cache is cleared, your computer crashes, you switch browsers or devices, or storage becomes corrupted.

Auto-save protects you with automatic backups every 30 seconds to a cloud-synced folder that you control.

> **Tip:** NeumanOS never has access to your backup files. They're stored in your cloud folder that you control.

---

## How Auto-Save Works

1. You choose a folder on your computer using the native folder picker
2. NeumanOS saves backups to that folder every 30 seconds (configurable)
3. Your cloud provider syncs the folder to the cloud
4. The cloud provider syncs the folder to your other devices
5. You can restore from any backup file on any device

### What Gets Backed Up

Everything:
- Notes (all content, formatting, images)
- Tasks (Kanban boards, subtasks, dependencies)
- Calendar events (all events, recurring events, reminders)
- Time tracking data (entries, billable hours)
- Habits tracking (streaks, achievements)
- Link library (all saved links and collections)
- Diagrams (all diagram data and layouts)
- Forms (form definitions and responses)
- Smart templates (built-in and custom templates)
- Energy logs (energy level tracking data)
- Activity feed (action history)
- Daily quests (quest progress, streaks, XP)
- Dashboard widgets (layout, configuration, custom widgets)
- Flashcard data (decks, cards, spaced repetition state)
- Custom CSS (theme customizations)
- Routines (routine definitions and completion history)
- All settings and preferences

### Backup File Format

Backups are saved as `.brain` files (compressed JSON):

```
NeumanOS-2025-12-27-143022.brain
```

Naming format: `[CustomName]-YYYY-MM-DD-HHmmss.brain`

Files are compressed with gzip (~70% size reduction) and include metadata (export date, version, item count).

### Versioning

Auto-save keeps multiple versions of your backups (default: 7). Older backups are automatically deleted when the limit is reached.

```
.neuman-backups/
  NeumanOS-2025-12-27-143022.brain  (most recent)
  NeumanOS-2025-12-27-140511.brain
  NeumanOS-2025-12-27-133045.brain
  ...
```

---

## Setting Up Your Backup Folder

### Step 1: Choose a Cloud Provider

| Provider | Free Storage | Best For |
|----------|-------------|----------|
| **Google Drive** | 15GB | Most storage, works everywhere |
| **iCloud Drive** | 5GB | Apple users |
| **OneDrive** | 5GB | Windows users (built-in) |
| **Proton Drive** | 1GB (encrypted) | Privacy-focused users |
| **Dropbox** | 2GB | Reliable, widely supported |

### Step 2: Install the Desktop App

You must install your cloud provider's desktop app for automatic syncing:

- **iCloud Drive:** Built into macOS, or [download for Windows](https://support.apple.com/en-us/HT204283)
- **Google Drive:** [Download](https://google.com/drive/download)
- **OneDrive:** Built into Windows 10/11, or download for macOS
- **Proton Drive:** [Download](https://proton.me/drive)
- **Dropbox:** [Download](https://dropbox.com/install)

### Step 3: Create a Backup Folder

1. Open Finder (macOS) or File Explorer (Windows)
2. Navigate to your cloud-synced folder
3. Create a new folder named **"NeumanOS Backups"** (or any name)

### Step 4: Enable Auto-Save in NeumanOS

1. Open NeumanOS
2. Go to **Settings** > **Backup & Sync**
3. Click **"Choose Folder"**
4. Navigate to the folder you created
5. Click **"Select"**
6. Auto-save is now enabled

---

## Cloud Provider Instructions

### iCloud Drive

**macOS:** iCloud Drive is built in. Open System Settings > Apple ID > iCloud > enable iCloud Drive. Access via Finder sidebar or `~/Library/Mobile Documents/com~apple~CloudDocs/`.

**Windows:** Install iCloud for Windows from the [Microsoft Store](https://support.apple.com/en-us/HT204283). Sign in with your Apple ID, enable iCloud Drive. Access via File Explorer sidebar or `C:\Users\[YourUsername]\iCloudDrive\`.

### Google Drive

**macOS:** [Download Google Drive for Desktop](https://google.com/drive/download). Install, sign in. Choose "Mirror files" for backups (full local copy). Access via Finder sidebar or `~/Google Drive/My Drive/`.

**Windows:** [Download Google Drive for Desktop](https://google.com/drive/download). Install, sign in. Choose "Mirror files" for backups. Access via File Explorer as `G:\My Drive\`.

### OneDrive

**macOS:** Download from the [Mac App Store](https://apps.apple.com/app/onedrive/id823766827). Sign in with Microsoft account. Access via Finder sidebar or `~/OneDrive/`.

**Windows:** Pre-installed on Windows 10/11. Click the cloud icon in system tray to sign in. Access via File Explorer sidebar or `C:\Users\[YourUsername]\OneDrive\`.

### Proton Drive

[Download Proton Drive](https://proton.me/drive/download) for macOS or Windows. Sign in with your Proton account. Proton Drive uses end-to-end encryption -- files are encrypted before upload.

- macOS path: `~/Proton Drive/`
- Windows path: `C:\Users\[YourUsername]\Proton Drive\`

### Dropbox

[Download Dropbox](https://dropbox.com/install) for macOS or Windows. Sign in, choose "Local" sync for backups (full copy).

- macOS path: `~/Dropbox/`
- Windows path: `C:\Users\[YourUsername]\Dropbox\`

---

## Syncing Across Devices

### How It Works

1. You make changes in NeumanOS (Device 1)
2. Auto-save creates backup file (~30 seconds)
3. Cloud provider syncs to cloud (1--5 minutes)
4. Cloud provider syncs to Device 2 (1--5 minutes)
5. Restore from backup on Device 2

Total sync time: usually 2--10 minutes.

### Setting Up Multiple Devices

On each device:
1. Install cloud provider's desktop app
2. Sign in with the same account
3. Wait for initial sync to complete
4. Open NeumanOS in your browser
5. Go to **Settings** > **Backup & Sync**
6. Click **"Choose Folder"** and select the same backup folder
7. Auto-save is now syncing across devices

### Restoring on a New Device

1. Install cloud provider's desktop app and sign in
2. Wait for backup files to sync
3. Open NeumanOS
4. Go to **Settings** > **Backup & Restore**
5. Click **"Import Brain"**
6. Select the most recent `.brain` file
7. Enable auto-save on the new device by choosing the same backup folder

---

## Restoring from Backup

### When to Restore

- Accidentally deleted data
- Switched browsers or devices
- Browser cache was cleared
- Want to recover an older version of your data

### How to Restore

1. Open your backup folder in Finder/File Explorer
2. Find the `.brain` file you want (named with timestamps)
3. Open NeumanOS > **Settings** > **Backup & Restore**
4. Click **"Import Brain"**
5. Select the file
6. Review the preview (item count, file size, date)
7. Click **"Import"**
8. Data is restored

> **Tip:** Currently, backups restore all data at once. Partial restore (just notes or just tasks) is not yet supported.

---

## Troubleshooting

### Auto-Save Not Working

1. Check if enabled: Settings > Backup & Sync > look for "Auto-Save Status: Enabled"
2. Check folder permissions: try creating a test file manually in the backup folder
3. Check browser support: requires Chrome 86+, Edge 86+, or Safari 15.2+. Firefox does not support the File System Access API -- use manual export instead.
4. Re-select folder: Settings > Backup & Sync > "Change Folder" > select same folder (refreshes permissions)

### Backups Not Syncing to Cloud

1. Check cloud provider sync status in menu bar/system tray
2. Check internet connection
3. Check storage quota (full storage prevents syncing)
4. Right-click backup folder and force sync

### Import Failed

1. Try an older backup file
2. Check file size (0 bytes means corrupted)
3. Create a fresh manual export from your working device and import that

### Multiple Devices Out of Sync

1. Identify which device has the most up-to-date data
2. On that device: Settings > Backup & Restore > Export Brain
3. On the other device: Import that backup file
4. Ensure auto-save is enabled on both devices

---

## FAQ

**Do I need a cloud provider?** No, but it's recommended. Without one, backups only stay on that device. With one, backups sync to all your devices.

**Is my data encrypted?** Proton Drive provides end-to-end encryption. Other providers encrypt in transit and at rest on their servers.

**Can I use multiple cloud providers?** Auto-save supports one folder at a time. Use manual export to create backups in multiple locations.

**How much storage do backups use?** Typical sizes: 100 notes is about 50 KB, 1,000 notes is about 500 KB, 10,000 notes with images is 10--50 MB. With 7 backup versions, even heavy use rarely exceeds 100 MB.

**Can I disable auto-save?** Yes. Settings > Backup & Sync > toggle Auto-Save Status off. You can still export manually.

**Can I change the backup file name?** Yes. Settings > Backup & Sync > Configuration > change File Name.

**How do I view what's inside a .brain file?** Rename to `.brain.gz`, decompress with any gzip tool, open the resulting JSON in a text editor. Don't manually edit -- it can corrupt the file.

**Can I schedule backups?** Auto-save already runs automatically. Adjust the interval (10 seconds to 5 minutes) in Settings > Backup & Sync > Configuration.

**What browsers support auto-save?** Chrome 86+, Edge 86+, Safari 15.2+, iOS Safari 15.2+. Firefox is not supported (use manual export).

---

## Cloud Provider Comparison

| Feature | iCloud | Google Drive | OneDrive | Proton Drive | Dropbox |
|---------|--------|-------------|----------|-------------|---------|
| Free Storage | 5GB | 15GB | 5GB | 1GB | 2GB |
| Desktop App | macOS built-in | Yes | Windows built-in | Yes | Yes |
| Platforms | macOS, iOS, Windows | All | All | All | All |
| Encryption | Transit + at rest | Transit + at rest | Transit + at rest | End-to-end | Transit + at rest |
| Best For | Apple users | Most storage | Windows users | Privacy | Reliability |

**Recommendations:**
- **Most users:** Google Drive (15GB free, works everywhere)
- **Apple users:** iCloud Drive (seamless across devices)
- **Windows users:** OneDrive (built-in)
- **Privacy-focused:** Proton Drive (end-to-end encrypted)

---

## Related Guides

- **[Getting Started](./getting-started.md)** -- Basic setup and backup overview
- **[Privacy & Security](./privacy-security.md)** -- How your data is protected
- **[Troubleshooting](./troubleshooting.md)** -- More solutions
