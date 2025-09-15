# Todo Tray App

A lightweight system tray task manager built with Electron. Quick access to your tasks without desktop clutter.

## Features

- **System Tray Integration** - Lives in your system tray with one-click access
- **Global Shortcuts** - `Ctrl+Shift+T` to toggle from anywhere
- **Dark/Light Themes** - Beautiful themes with smooth transitions
- **Smart Filtering** - Active/completed task views with 24h auto-cleanup
- **Local Storage** - Tasks saved locally, no cloud dependency
- **Auto-Hide** - Disappears when you click away for distraction-free work

## Tech Stack

- Electron (Desktop framework)
- HTML/CSS/JavaScript (Frontend)
- Lucide Icons (UI icons)
- Node.js (File system integration)

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd todo-tray-app
npm install

# Run the app
npm start
```

## Usage

- Add tasks and press Enter
- `Ctrl+Shift+T` to toggle window
- Click tray icon for quick access
- Toggle theme with sun/moon button

## Key Implementation

- Dynamic window sizing based on task count
- Smart positioning relative to system tray
- IST timezone formatting for timestamps
- Auto-hide on focus loss (except during development)

---

Built for productivity enthusiasts who want quick task access without workflow interruption.
