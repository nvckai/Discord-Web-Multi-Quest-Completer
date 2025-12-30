# Discord Web Multi Quest Completer

<img align="right" src="./assets/icon.png" width=200 alt="Discord Quest Completer logo">

Extension that automatically completes multiple Discord quests spoofing. No more manually watching videos or playing games - just click a button and let it run all quests at once.

Created with ❤️ by [**Nick Aidil**](https://discord.my.id) 🌸


> [!NOTE]
> Discord Multi Quest Completer is now **ready-to-use**!

## What it does

This extension hooks into Discord's quest system and automatically completes the requirements for all active quests concurrently. It works with:

- Video watching quests (WATCH_VIDEO, WATCH_VIDEO_ON_MOBILE)
- Desktop game playing (PLAY_ON_DESKTOP) 
- Desktop streaming (STREAM_ON_DESKTOP)
- Activity playing (PLAY_ACTIVITY)

The extension spoofs your user-agent to make Discord think you're using the desktop app, which is required for some quest types to work properly. Supports multi-quest execution for maximum efficiency.

## Installation

1. Clone or download this repo
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Toggle "Developer mode" on (top right corner)
4. Click "Load unpacked" and select the extension folder
5. You're done!

## How to use

1. Go to `https://discord.com/quest-home` in your browser
2. Accept quests if you haven't already
3. Look for the "Running Quests" button in the bottom right corner with a Symbol icon
4. Click it and check the browser console (F12) for progress updates
5. Expand the panel to see quest details (shows Discord ID and credits)

The extension will automatically detect all your active quests and start completing them simultaneously. Progress is logged to the console so you can see what's happening for each quest.

## Requirements

- Chrome or any Chromium-based browser (Edge, Brave, etc.)
- A Discord account with quests available
- Accepted quests on the quest-home page

## How it works

The extension uses advanced techniques:

- **User-Agent override**: Modifies HTTP headers and navigator properties to mimic Discord desktop
- **Webpack module injection**: Hooks into Discord's internal stores (QuestsStore, RunningGameStore, etc.)
- **Multi-quest concurrency**: Runs all eligible quests in parallel using Promise.all
- **API spoofing**: Intercepts quest progress updates and sends fake data
- **Smart detection**: Filters quests by expiration and completion status

For streaming quests, you still need at least one other person in the voice channel - the extension can't fake that part.

## Troubleshooting

**Button doesn't appear:**
- Make sure you're on `discord.com/quest-home`
- Refresh the page
- Check that the extension is enabled in `chrome://extensions/`

**Quest not completing:**
- Open the console (F12) and check for error messages
- Make sure you've accepted the quests first
- Some quest types work better in the actual Discord desktop app
- Try refreshing and running the code again

**User-Agent warnings:**
- The console might show warnings about user-agent detection - this is normal
- The extension uses multiple methods to override it, so it should still work

## Technical details

Built with Manifest V3. Uses:
- `declarativeNetRequest` for header modification
- Content scripts for quest page interaction
- Background service worker for script injection
- Webpack module interception for Discord internals
- Concurrent execution with async/await and Promise.all
## Mobile Version Supported (Android)

1. Download this extension
2. Download Kiwi Browser: [Download Kiwi](https://github.com/kiwibrowser/src.next/releases)
3. Open Kiwi Browser and go to `kiwi://extensions`
   - Or tap the three dots → select "Extensions"
4. Enable Developer mode, then tap `+ (from .zip/crx/.user.js)` and upload the downloaded extension
5. After that, open Discord Quests page: [Quest](https://discord.com/quest-home), accept at least one quest and choose **Playing on Desktop**, then **REFRESH**
   - A "Running Quests" button will appear. Click it and check console for progress updates
   - If it doesn't work, refresh the quest page again

This version supports multi-quest execution on mobile with the same concurrent processing as desktop.

> [!WARNING]
> This is a tool for automating Discord quests. Use at your own risk and be aware of Discord's Terms of Service. I'm not responsible if your account gets flagged or banned.



