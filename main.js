const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');

let tray = null;
let window = null;
let isQuitting = false;


// Create the main window
function createWindow() {
  window = new BrowserWindow({
    width: 350,
    height: 250, // Start with minimum height
    show: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false, // Keep this false since we're controlling height programmatically
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

// Create system tray
function createTray() {
  // Create tray icon
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));

  // Tray tooltip
  tray.setToolTip('Todo App - Click to open');

  // Context menu for right-click
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Task',
      click: () => {
        showWindow();
      }
    },
    {
      label: '➕ Quick Add Task',
      click: () => {
        showWindow();
        // Focus on input field
        window.webContents.send('focus-input');
      }
    },
    {
      type: 'separator'
    },
    {
      label: '🌓 Toggle Theme',
      click: () => {
        showWindow();
        window.webContents.executeJavaScript('toggleTheme()');
      }
    },
    {
      type: 'separator'
    },
    {
      label: '❌ Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Single click to toggle window
  tray.on('click', () => {
    toggleWindow();
  });

  // Double click to show window
  tray.on('double-click', () => {
    showWindow();
  });
}

// Show window near system tray
function showWindow() {
  if (!window) {
    createWindow();
  }

  // Position window near system tray
  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();

  // Calculate position (bottom-right corner)
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y - windowBounds.height - 10);

  window.setPosition(x, y);
  window.show();
  window.focus();
}

// Toggle window visibility
function toggleWindow() {
  if (window && window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
}

// App ready
app.whenReady().then(() => {
  createTray();
  createWindow();

  // Register global shortcut (Ctrl+Shift+T)
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    toggleWindow();
  });

  // Handle window height updates
ipcMain.on('update-window-height', (event, height) => {
  if (window) {
    const bounds = window.getBounds(); // current position & size
    const { width, x, y, height: currentHeight } = bounds;

    // Calculate new Y so the window stays at the bottom
    const newY = y + (currentHeight - height);
 
    window.setBounds(
      { x, y: newY, width, height },
      true // animate
    );
  }
});
    ipcMain.on('hide-window', () => {
  if (window) {
    window.hide();
  }
});



  // Update tray tooltip with task count
  ipcMain.on('update-tray-tooltip', (event, taskCount) => {
    const tooltip = taskCount.total === 0 
      ? 'Todo App - No tasks'
      : `Todo App - ${taskCount.active} active, ${taskCount.completed} completed`;
    tray.setToolTip(tooltip);
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  // Keep app running in tray
});

// Activate app (macOS)
app.on('activate', () => {
  showWindow();
});

// Before quit
app.on('before-quit', () => {
  isQuitting = true;
});

// Cleanup
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});