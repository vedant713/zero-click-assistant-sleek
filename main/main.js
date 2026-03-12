const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const { watchClipboard } = require('./sensors/clipboard');
const { getActiveWindowTitle } = require('./sensors/activeWin');
const http = require('http');
require('dotenv').config();
const { summarize, qa } = require('../shared/summarizer');
const features = require('../shared/features');

let overlay;
let isVisible = true;
let activeWindowInterval = null;
const TOGGLE_HOTKEY = 'CommandOrControl+Alt+O';

// Input validation helpers
function isValidString(value, maxLength = 100000) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isValidObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function detectVitePort() {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  for (const p of ports) {
    const ok = await new Promise(res => {
      const req = http.get(`http://localhost:${p}`, () => res(true)).on('error', () => res(false));
      req.end();
    });
    if (ok) return p;
  }
  return null;
}

async function createOverlay() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlay = new BrowserWindow({
    width: 820,
    height: 200,
    x: Math.round((width - 820) / 2),
    y: Math.round(height * 0.15),
    frame: false,
    transparent: false,
    backgroundColor: '#1e1e2e',
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  console.log('📱 Window created');

  const port = await detectVitePort();

  if (port) {
    console.log('Loading from Vite dev server on port ' + port);
    await overlay.loadURL('http://localhost:' + port);
  } else {
    console.log('Loading production build...');
    await overlay.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  overlay.webContents.on('did-finish-load', () => {
    console.log('Renderer loaded, ready for events.');
    overlay.show();
  });

  // Cleanup interval when window is closed
  overlay.on('closed', () => {
    if (activeWindowInterval) {
      clearInterval(activeWindowInterval);
      activeWindowInterval = null;
    }
  });
}

app.whenReady().then(async () => {
  await createOverlay();

  try {
    const toggleRegistered = globalShortcut.register(TOGGLE_HOTKEY, () => {
      if (!overlay) return;
      isVisible = !isVisible;
      if (isVisible) {
        overlay.show();
        overlay.focus();
      } else {
        overlay.hide();
      }
    });
    if (!toggleRegistered) {
      console.error('Failed to register toggle shortcut');
    } else {
      console.log('Toggle shortcut registered (Ctrl+Alt+O)');
    }
  } catch (err) {
    console.error('Error registering toggle shortcut:', err);
  }

  try {
    globalShortcut.register('CommandOrControl+Alt+R', () => {
      if (!overlay) return;
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      overlay.setPosition(Math.round((width - 820) / 2), Math.round(height * 0.15));
      overlay.show();
      isVisible = true;
      console.log('Window position reset');
    });
    console.log('Reset shortcut registered (Ctrl+Alt+R)');
  } catch (err) {
    console.error('Error registering reset shortcut:', err);
  }

  const moveStep = 50;
  const move = (dx, dy) => {
    if (!overlay) return;
    const [x, y] = overlay.getPosition();
    overlay.setPosition(x + dx, y + dy);
  };
  try {
    globalShortcut.register('CommandOrControl+Alt+Up', () => move(0, -moveStep));
    globalShortcut.register('CommandOrControl+Alt+Down', () => move(0, moveStep));
    globalShortcut.register('CommandOrControl+Alt+Left', () => move(-moveStep, 0));
    globalShortcut.register('CommandOrControl+Alt+Right', () => move(moveStep, 0));
    console.log('Move shortcuts registered');
  } catch (err) {
    console.error('Error registering move shortcuts:', err);
  }

  const snapPositions = {
    1: { x: 0, y: 0 },
    2: { x: 'center', y: 0 },
    3: { x: 'right', y: 0 },
    4: { x: 0, y: 'bottom' },
    5: { x: 'center', y: 'bottom' },
    6: { x: 'right', y: 'bottom' },
    7: { x: 'center', y: 'center' },
    0: null,
  };

  const snapToPosition = pos => {
    if (!overlay) return;
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const windowWidth = 820;
    const windowHeight = 200;

    let x, y;
    if (pos.x === 'center') {
      x = Math.round((width - windowWidth) / 2);
    } else if (pos.x === 'right') {
      x = width - windowWidth;
    } else {
      x = pos.x;
    }

    if (pos.y === 'center') {
      y = Math.round((height - windowHeight) / 2);
    } else if (pos.y === 'bottom') {
      y = height - windowHeight;
    } else {
      y = pos.y;
    }

    overlay.setPosition(x, y);
    overlay.show();
    isVisible = true;
  };

  try {
    globalShortcut.register('CommandOrControl+Alt+1', () => snapToPosition(snapPositions[1]));
    globalShortcut.register('CommandOrControl+Alt+2', () => snapToPosition(snapPositions[2]));
    globalShortcut.register('CommandOrControl+Alt+3', () => snapToPosition(snapPositions[3]));
    globalShortcut.register('CommandOrControl+Alt+4', () => snapToPosition(snapPositions[4]));
    globalShortcut.register('CommandOrControl+Alt+5', () => snapToPosition(snapPositions[5]));
    globalShortcut.register('CommandOrControl+Alt+6', () => snapToPosition(snapPositions[6]));
    globalShortcut.register('CommandOrControl+Alt+7', () => snapToPosition(snapPositions[7]));
    globalShortcut.register('CommandOrControl+Alt+0', () => snapToPosition(snapPositions[0]));
    console.log('Snap shortcuts registered (Ctrl+Alt+0-7)');
  } catch (err) {
    console.error('Error registering snap shortcuts:', err);
  }

  try {
    const quitRegistered = globalShortcut.register('CommandOrControl+Alt+X', () => {
      console.log('Quit shortcut pressed — closing app...');
      app.exit(0);
    });
    if (!quitRegistered) {
      console.error('Failed to register quit shortcut');
    } else {
      console.log('Quit shortcut registered (Ctrl+Alt+X)');
    }
  } catch (err) {
    console.error('Error registering quit shortcut:', err);
  }

  watchClipboard(async text => {
    try {
      console.log('Clipboard text:', text.slice(0, 80));
      const { summary, followUps } = await summarize(text);
      if (overlay && overlay.webContents && !overlay.webContents.isDestroyed()) {
        overlay.webContents.send('clipboard-event', text);
        overlay.webContents.send('summary-event', { text, summary, followUps });
      }
    } catch (err) {
      console.error('Summarization error:', err);
    }
  });

  activeWindowInterval = setInterval(async () => {
    try {
      if (!overlay || overlay.isDestroyed()) {
        clearInterval(activeWindowInterval);
        return;
      }
      const win = await getActiveWindowTitle();
      if (overlay && overlay.webContents && !overlay.webContents.isDestroyed()) {
        overlay.webContents.send('active-window', win);
      }
    } catch (e) {
      console.error('Active window error:', e);
    }
  }, 2000);
});

ipcMain.handle('overlay:set-size', async (_evt, payload) => {
  if (!overlay) return;

  try {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const { width, height } = payload;
    if (typeof width !== 'number' || typeof height !== 'number') {
      return;
    }

    await new Promise(r => setTimeout(r, 200));

    const fixedW = width;
    const minH = 120;
    const maxH = 800;
    const clampedH = Math.max(minH, Math.min(Math.round(height), maxH));

    overlay.setResizable(true);
    overlay.setSize(fixedW, clampedH);
    overlay.setResizable(false);
  } catch (err) {
    console.error('overlay:set-size error:', err);
  }
});

ipcMain.handle('summarize', async (_evt, text) => {
  try {
    const { summary, followUps } = await summarize(text);
    return { summary, followUps };
  } catch (err) {
    console.error('Summarization IPC error:', err);
    return { summary: 'Summarization failed.', followUps: [] };
  }
});

ipcMain.handle('qa:ask', async (_evt, { text, question }) => {
  try {
    const answer = await qa(text, question);
    return answer || 'No answer generated.';
  } catch (err) {
    console.error('Q&A error:', err);
    return 'Q&A failed.';
  }
});

ipcMain.handle('overlay:toggle', () => {
  if (!overlay) return false;
  isVisible = !isVisible;
  isVisible ? overlay.show() : overlay.hide();
  return isVisible;
});

ipcMain.handle('features:saveConversation', async (_evt, { conversation, summary }) => {
  try {
    return features.saveConversation(conversation, summary);
  } catch (err) {
    console.error('Save conversation error:', err);
    return null;
  }
});

ipcMain.handle('features:getSavedConversations', async () => {
  try {
    return features.getSavedConversations();
  } catch (err) {
    console.error('Get saved conversations error:', err);
    return [];
  }
});

ipcMain.handle('features:translate', async (_evt, { text, targetLang }) => {
  try {
    if (!isValidString(text, 50000)) {
      return { error: 'Invalid text: must be a non-empty string under 50000 characters' };
    }
    if (!isValidString(targetLang, 20)) {
      return { error: 'Invalid targetLang: must be a non-empty string under 20 characters' };
    }
    return await features.translateText(text, targetLang);
  } catch (err) {
    console.error('Translation error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:copyToClipboard', async (_evt, text) => {
  try {
    if (!isValidString(text, 100000)) {
      return { error: 'Invalid text: must be a non-empty string under 100000 characters' };
    }
    return features.copyToClipboard(text);
  } catch (err) {
    console.error('Copy to clipboard error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:clearConversation', async () => {
  try {
    return features.clearConversation();
  } catch (err) {
    console.error('Clear conversation error:', err);
    return false;
  }
});

ipcMain.handle('features:analyzeText', async (_evt, text) => {
  try {
    if (!isValidString(text, 50000)) {
      return { error: 'Invalid text: must be a non-empty string under 50000 characters' };
    }
    return features.analyzeText(text);
  } catch (err) {
    console.error('Analyze text error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:bookmarkConversation', async (_evt, { conversation, summary, label }) => {
  try {
    if (!isValidObject(conversation)) {
      return { error: 'Invalid conversation: must be a non-null object' };
    }
    if (!isValidString(summary, 10000)) {
      return { error: 'Invalid summary: must be a non-empty string under 10000 characters' };
    }
    if (!isValidString(label, 100)) {
      return { error: 'Invalid label: must be a non-empty string under 100 characters' };
    }
    return features.bookmarkConversation(conversation, summary, label);
  } catch (err) {
    console.error('Bookmark error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:getBookmarks', async () => {
  try {
    return features.getBookmarks();
  } catch (err) {
    console.error('Get bookmarks error:', err);
    return [];
  }
});

ipcMain.handle('features:deleteBookmark', async (_evt, id) => {
  try {
    return features.deleteBookmark(id);
  } catch (err) {
    console.error('Delete bookmark error:', err);
    return false;
  }
});

ipcMain.handle('features:exportMarkdown', async (_evt, { summary, conversation }) => {
  try {
    if (!isValidString(summary, 50000)) {
      return { error: 'Invalid summary: must be a non-empty string under 50000 characters' };
    }
    if (!isValidObject(conversation)) {
      return { error: 'Invalid conversation: must be a non-null object' };
    }
    return features.exportAsMarkdown(summary, conversation);
  } catch (err) {
    console.error('Export markdown error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:exportText', async (_evt, { summary, conversation }) => {
  try {
    if (!isValidString(summary, 50000)) {
      return { error: 'Invalid summary: must be a non-empty string under 50000 characters' };
    }
    if (!isValidObject(conversation)) {
      return { error: 'Invalid conversation: must be a non-null object' };
    }
    return features.exportAsText(summary, conversation);
  } catch (err) {
    console.error('Export text error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:search', async (_evt, query) => {
  try {
    if (!isValidString(query, 1000)) {
      return { error: 'Invalid query: must be a non-empty string under 1000 characters' };
    }
    return features.searchConversations(query);
  } catch (err) {
    console.error('Search error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:getProviders', async () => {
  try {
    return features.getAvailableProviders();
  } catch (err) {
    console.error('Get providers error:', err);
    return { ollama: false, gemini: false, mock: false };
  }
});

ipcMain.handle('features:getSettings', async () => {
  try {
    return features.getSettings();
  } catch (err) {
    console.error('Get settings error:', err);
    return {};
  }
});

ipcMain.handle('features:saveSettings', async (_evt, settings) => {
  try {
    if (!isValidObject(settings)) {
      return { error: 'Invalid settings: must be a non-null object' };
    }
    return features.saveSettings(settings);
  } catch (err) {
    console.error('Save settings error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:getHistory', async () => {
  try {
    return features.getHistory();
  } catch (err) {
    console.error('Get history error:', err);
    return [];
  }
});

ipcMain.handle('features:clearHistory', async () => {
  try {
    return features.clearHistory();
  } catch (err) {
    console.error('Clear history error:', err);
    return false;
  }
});

ipcMain.handle('features:setAutoStart', async (_evt, { enabled }) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
    });
    return true;
  } catch (err) {
    console.error('Set autostart error:', err);
    return false;
  }
});

ipcMain.handle('features:getAutoStart', async () => {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (err) {
    console.error('Get autostart error:', err);
    return false;
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (activeWindowInterval) {
    clearInterval(activeWindowInterval);
  }
});
app.on('window-all-closed', () => app.quit());
