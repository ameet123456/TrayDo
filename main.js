const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let tray = null;
let window = null;
let isQuitting = false;

// Path to tasks.json file (stored in AppData)
const TASKS_FILE = path.join(app.getPath('userData'), 'tasks.json');

// --- File operations ---
async function loadTasksFromFile() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    console.log('No tasks file found or error reading, creating new one');
    return [];
  }
}

async function saveTasksToFile(tasks) {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
}

// --- Create the main window ---
function createWindow() {
  if (window) return; // avoid duplicates

  window = new BrowserWindow({
    width: 350,
    height: 250,
    show: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    minHeight: 250,
    maxHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  window.loadFile('index.html');

  // Hide window instead of closing
  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });

  // Hide when clicking outside
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
}

// --- Create system tray ---
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  tray.setToolTip('Todo App - Loading...');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Tasks',
      click: () => showWindow()
    },
    {
      label: '➕ Quick Add Task',
      click: () => {
        showWindow();
        if (window) window.webContents.send('focus-input');
      }
    },
    { type: 'separator' },
    {
      label: '🌓 Toggle Theme',
      click: () => {
        showWindow();
        if (window) window.webContents.executeJavaScript('toggleTheme()');
      }
    },
    { type: 'separator' },
    {
      label: '❌ Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Single click toggles window
  tray.on('click', toggleWindow);

  // Double click shows window
  tray.on('double-click', showWindow);
}

// --- Show window near system tray ---
function showWindow() {
  if (!window) createWindow();

  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();

  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y - windowBounds.height - 10);

  window.setPosition(x, y);
  window.show();
  window.focus();
}

// --- Toggle window ---
function toggleWindow() {
  if (window && window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
}

// --- Prevent multiple instances ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
}

// --- App ready ---
app.whenReady().then(() => {
  createTray();  // ✅ tray shows immediately
  setTimeout(createWindow, 1000); // lazy-load window after 1s

  globalShortcut.register('CommandOrControl+Shift+T', toggleWindow);

  // IPC handlers
  ipcMain.handle('load-tasks', async () => await loadTasksFromFile());
  ipcMain.handle('save-tasks', async (event, tasks) => await saveTasksToFile(tasks));

  ipcMain.on('update-window-height', (event, height) => {
    if (window) {
      const bounds = window.getBounds();
      const { width, x, y, height: currentHeight } = bounds;
      const newY = y + (currentHeight - height);
      window.setBounds({ x, y: newY, width, height }, true);
    }
  });

  ipcMain.on('hide-window', () => {
    if (window) window.hide();
  });

  ipcMain.on('update-tray-tooltip', (event, taskCount) => {
    const tooltip =
      taskCount.total === 0
        ? 'Todo App - No tasks'
        : `Todo App - ${taskCount.active} active, ${taskCount.completed} completed`;
    tray.setToolTip(tooltip);
  });
});

// --- Quit rules ---
app.on('window-all-closed', () => {});
app.on('activate', () => showWindow());
app.on('before-quit', () => (isQuitting = true));
app.on('will-quit', () => globalShortcut.unregisterAll());
