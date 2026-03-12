const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} = require('electron');
const path = require('path');
const { watchClipboard, setOptions, pause, resume, getStatus } = require('./sensors/clipboard');
const { getActiveWindowTitle } = require('./sensors/activeWin');
const http = require('http');
const fs = require('fs');
require('dotenv').config();
const { summarize, qa } = require('../shared/summarizer');
const features = require('../shared/features');

const DEFAULT_HOTKEYS = {
  toggle: 'CommandOrControl+Alt+O',
  resetPosition: 'CommandOrControl+Alt+R',
  moveUp: 'CommandOrControl+Alt+Up',
  moveDown: 'CommandOrControl+Alt+Down',
  moveLeft: 'CommandOrControl+Alt+Left',
  moveRight: 'CommandOrControl+Alt+Right',
  quit: 'CommandOrControl+Alt+X',
  snapTopLeft: 'CommandOrControl+Alt+1',
  snapTopCenter: 'CommandOrControl+Alt+2',
  snapTopRight: 'CommandOrControl+Alt+3',
  snapBottomLeft: 'CommandOrControl+Alt+4',
  snapBottomCenter: 'CommandOrControl+Alt+5',
  snapBottomRight: 'CommandOrControl+Alt+6',
  snapCenter: 'CommandOrControl+Alt+7',
  snapReset: 'CommandOrControl+Alt+0',
  commandPalette: 'CommandOrControl+K',
};

const HOTKEYS_FILE = path.join(__dirname, '../data/hotkeys.json');

function loadHotkeys() {
  try {
    if (fs.existsSync(HOTKEYS_FILE)) {
      const data = fs.readFileSync(HOTKEYS_FILE, 'utf-8');
      return { ...DEFAULT_HOTKEYS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error loading hotkeys:', err);
  }
  return { ...DEFAULT_HOTKEYS };
}

let currentHotkeys = loadHotkeys();

function registerHotkeys() {
  globalShortcut.unregisterAll();

  try {
    globalShortcut.register(currentHotkeys.toggle, () => {
      if (!overlay) return;
      isVisible = !isVisible;
      if (isVisible) {
        overlay.show();
        overlay.focus();
      } else {
        overlay.hide();
      }
    });
  } catch (err) {
    console.error('Error registering toggle hotkey:', err);
  }

  try {
    globalShortcut.register(currentHotkeys.resetPosition, () => {
      if (!overlay) return;
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      overlay.setPosition(Math.round((width - 820) / 2), Math.round(height * 0.15));
      overlay.show();
      isVisible = true;
    });
  } catch (err) {
    console.error('Error registering reset hotkey:', err);
  }

  const moveStep = 50;
  const move = (dx, dy) => {
    if (!overlay) return;
    const [x, y] = overlay.getPosition();
    overlay.setPosition(x + dx, y + dy);
  };

  try {
    globalShortcut.register(currentHotkeys.moveUp, () => move(0, -moveStep));
    globalShortcut.register(currentHotkeys.moveDown, () => move(0, moveStep));
    globalShortcut.register(currentHotkeys.moveLeft, () => move(-moveStep, 0));
    globalShortcut.register(currentHotkeys.moveRight, () => move(moveStep, 0));
  } catch (err) {
    console.error('Error registering move hotkeys:', err);
  }

  const snapPositions = {
    snapTopLeft: { x: 0, y: 0 },
    snapTopCenter: { x: 'center', y: 0 },
    snapTopRight: { x: 'right', y: 0 },
    snapBottomLeft: { x: 0, y: 'bottom' },
    snapBottomCenter: { x: 'center', y: 'bottom' },
    snapBottomRight: { x: 'right', y: 'bottom' },
    snapCenter: { x: 'center', y: 'center' },
    snapReset: null,
  };

  const snapToPosition = pos => {
    if (!overlay) return;
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const windowWidth = 820;
    const windowHeight = 200;

    let x, y;
    if (!pos) {
      x = Math.round((width - windowWidth) / 2);
      y = Math.round(height * 0.15);
    } else {
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
    }

    overlay.setPosition(x, y);
    overlay.show();
    isVisible = true;
  };

  try {
    globalShortcut.register(currentHotkeys.snapTopLeft, () =>
      snapToPosition(snapPositions.snapTopLeft)
    );
    globalShortcut.register(currentHotkeys.snapTopCenter, () =>
      snapToPosition(snapPositions.snapTopCenter)
    );
    globalShortcut.register(currentHotkeys.snapTopRight, () =>
      snapToPosition(snapPositions.snapTopRight)
    );
    globalShortcut.register(currentHotkeys.snapBottomLeft, () =>
      snapToPosition(snapPositions.snapBottomLeft)
    );
    globalShortcut.register(currentHotkeys.snapBottomCenter, () =>
      snapToPosition(snapPositions.snapBottomCenter)
    );
    globalShortcut.register(currentHotkeys.snapBottomRight, () =>
      snapToPosition(snapPositions.snapBottomRight)
    );
    globalShortcut.register(currentHotkeys.snapCenter, () =>
      snapToPosition(snapPositions.snapCenter)
    );
    globalShortcut.register(currentHotkeys.snapReset, () =>
      snapToPosition(snapPositions.snapReset)
    );
  } catch (err) {
    console.error('Error registering snap hotkeys:', err);
  }

  try {
    globalShortcut.register(currentHotkeys.quit, () => {
      isQuitting = true;
      app.exit(0);
    });
  } catch (err) {
    console.error('Error registering quit hotkey:', err);
  }

  console.log('Hotkeys registered');
}

let overlay;
let tray;
let isVisible = true;
let isQuitting = false;
let activeWindowInterval = null;

// Input validation helpers
function isValidString(value, maxLength = 100000) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isValidObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let isPaused = false;

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

  overlay.on('close', event => {
    if (!app.isQuitting) {
      event.preventDefault();
      overlay.hide();
    }
  });

  // Cleanup interval when window is closed
  overlay.on('closed', () => {
    if (activeWindowInterval) {
      clearInterval(activeWindowInterval);
      activeWindowInterval = null;
    }
  });
}

function createTray() {
  const iconSize = 16;
  const icon = nativeImage.createEmpty();
  const canvas = Buffer.alloc(iconSize * iconSize * 4);
  for (let i = 0; i < iconSize * iconSize; i++) {
    canvas[i * 4] = 30;
    canvas[i * 4 + 1] = 30;
    canvas[i * 4 + 2] = 46;
    canvas[i * 4 + 3] = 255;
  }
  const trayIcon = nativeImage.createFromBuffer(canvas, { width: iconSize, height: iconSize });

  tray = new Tray(trayIcon);
  tray.setToolTip('Zero-Click Assistant');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Overlay',
      click: () => {
        if (overlay && !overlay.isDestroyed()) {
          if (overlay.isVisible()) {
            overlay.hide();
            isVisible = false;
          } else {
            overlay.show();
            overlay.focus();
            isVisible = true;
          }
        }
      },
    },
    {
      label: isPaused ? 'Resume Monitoring' : 'Pause Monitoring',
      click: () => {
        if (isPaused) {
          resume();
          isPaused = false;
        } else {
          pause();
          isPaused = true;
        }
        updateTrayMenu();
      },
    },
    {
      label:
        overlay && !overlay.isDestroyed() && overlay.isAlwaysOnTop()
          ? 'Disable Always On Top'
          : 'Enable Always On Top',
      click: () => {
        if (overlay && !overlay.isDestroyed()) {
          const current = overlay.isAlwaysOnTop();
          overlay.setAlwaysOnTop(!current);
          updateTrayMenu();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (overlay && !overlay.isDestroyed()) {
      if (overlay.isVisible()) {
        overlay.hide();
        isVisible = false;
      } else {
        overlay.show();
        overlay.focus();
        isVisible = true;
      }
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Overlay',
      click: () => {
        if (overlay && !overlay.isDestroyed()) {
          if (overlay.isVisible()) {
            overlay.hide();
            isVisible = false;
          } else {
            overlay.show();
            overlay.focus();
            isVisible = true;
          }
        }
      },
    },
    {
      label: isPaused ? 'Resume Monitoring' : 'Pause Monitoring',
      click: () => {
        if (isPaused) {
          resume();
          isPaused = false;
        } else {
          pause();
          isPaused = true;
        }
        updateTrayMenu();
      },
    },
    {
      label:
        overlay && !overlay.isDestroyed() && overlay.isAlwaysOnTop()
          ? 'Disable Always On Top'
          : 'Enable Always On Top',
      click: () => {
        if (overlay && !overlay.isDestroyed()) {
          const current = overlay.isAlwaysOnTop();
          overlay.setAlwaysOnTop(!current);
          updateTrayMenu();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(async () => {
  await createOverlay();
  createTray();

  registerHotkeys();

  ipcMain.handle('hotkeys:get', async () => {
    try {
      return { ...DEFAULT_HOTKEYS, ...currentHotkeys };
    } catch (err) {
      console.error('Error getting hotkeys:', err);
      return DEFAULT_HOTKEYS;
    }
  });

  ipcMain.handle('hotkeys:save', async (_evt, hotkeys) => {
    try {
      if (!isValidObject(hotkeys)) {
        return { error: 'Invalid hotkeys: must be a non-null object' };
      }
      currentHotkeys = { ...DEFAULT_HOTKEYS, ...hotkeys };
      const dataDir = path.dirname(HOTKEYS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(HOTKEYS_FILE, JSON.stringify(currentHotkeys, null, 2));
      registerHotkeys();
      return { success: true };
    } catch (err) {
      console.error('Error saving hotkeys:', err);
      return { error: err.message };
    }
  });

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

  ipcMain.handle('clipboard:setDebounce', async (_evt, debounceTime) => {
    try {
      if (typeof debounceTime === 'number' && debounceTime > 0) {
        setOptions({ debounceTime });
        return { success: true, debounceTime };
      }
      return { error: 'Invalid debounceTime: must be a positive number' };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('clipboard:setMinLength', async (_evt, minLength) => {
    try {
      if (typeof minLength === 'number' && minLength > 0) {
        setOptions({ minLength });
        return { success: true, minLength };
      }
      return { error: 'Invalid minLength: must be a positive number' };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('clipboard:pause', async () => {
    try {
      pause();
      return { success: true, isPaused: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('clipboard:resume', async () => {
    try {
      resume();
      return { success: true, isPaused: false };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('clipboard:status', async () => {
    try {
      return getStatus();
    } catch (err) {
      return { error: err.message };
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

ipcMain.handle('overlay:setAlwaysOnTop', (_evt, enabled) => {
  if (!overlay || overlay.isDestroyed()) return false;
  overlay.setAlwaysOnTop(enabled);
  return enabled;
});

ipcMain.handle('overlay:setOpacity', async (_evt, opacity) => {
  if (overlay && !overlay.isDestroyed()) {
    overlay.setOpacity(Math.max(0.3, Math.min(1.0, opacity)));
  }
});

ipcMain.handle('overlay:setPreset', async (_evt, preset) => {
  const presets = {
    small: { width: 600, height: 150 },
    medium: { width: 820, height: 200 },
    large: { width: 1000, height: 400 },
    wide: { width: 1200, height: 300 },
  };
  const size = presets[preset] || presets.medium;
  if (overlay && !overlay.isDestroyed()) {
    overlay.setSize(size.width, size.height);
  }
});

ipcMain.handle('overlay:getState', async () => {
  if (!overlay || overlay.isDestroyed()) return null;
  return {
    opacity: overlay.getOpacity(),
    alwaysOnTop: overlay.isAlwaysOnTop(),
    bounds: overlay.getBounds(),
    isVisible: overlay.isVisible(),
  };
});

ipcMain.handle(
  'features:saveConversation',
  async (_evt, { conversation, summary, tags, category }) => {
    try {
      return features.saveConversation(conversation, summary, tags, category);
    } catch (err) {
      console.error('Save conversation error:', err);
      return null;
    }
  }
);

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

ipcMain.handle('export:asJSON', async (_evt, { data, options }) => {
  try {
    if (!isValidObject(data)) {
      return { error: 'Invalid data: must be a non-null object' };
    }
    return features.exportAsJSON(data, options || {});
  } catch (err) {
    console.error('Export JSON error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('export:asHTML', async (_evt, { data, options }) => {
  try {
    if (!isValidObject(data)) {
      return { error: 'Invalid data: must be a non-null object' };
    }
    return features.exportAsHTML(data, options || {});
  } catch (err) {
    console.error('Export HTML error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('export:asPDF', async (_evt, { html, filename }) => {
  const { dialog } = require('electron');

  const result = await dialog.showSaveDialog(overlay, {
    title: 'Export as PDF',
    defaultPath: filename || 'summary.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      landscape: false,
      pageSize: 'A4',
    });

    fs.writeFileSync(result.filePath, pdfData);

    pdfWindow.close();

    return { success: true, path: result.filePath };
  } catch (err) {
    console.error('PDF export error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export:bulk', async (_evt, { conversationIds, format }) => {
  try {
    if (conversationIds && !Array.isArray(conversationIds)) {
      return { error: 'Invalid conversationIds: must be an array' };
    }
    if (!isValidString(format, 20)) {
      return { error: 'Invalid format: must be a non-empty string' };
    }
    const validFormats = ['json', 'html', 'markdown', 'text'];
    if (!validFormats.includes(format)) {
      return { error: `Invalid format: must be one of ${validFormats.join(', ')}` };
    }
    return features.exportConversationsBulk(conversationIds || [], format);
  } catch (err) {
    console.error('Bulk export error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:shareFormattedText', async (_evt, data) => {
  try {
    if (!isValidObject(data)) {
      return { error: 'Invalid data: must be a non-null object' };
    }
    return features.shareAsFormattedText(data);
  } catch (err) {
    console.error('Share formatted text error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('features:shareMarkdown', async (_evt, data) => {
  try {
    if (!isValidObject(data)) {
      return { error: 'Invalid data: must be a non-null object' };
    }
    return features.shareAsMarkdown(data);
  } catch (err) {
    console.error('Share markdown error:', err);
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

ipcMain.handle('settings:getAdvanced', async () => {
  try {
    return features.getAdvancedSettings();
  } catch (err) {
    console.error('Get advanced settings error:', err);
    return {};
  }
});

ipcMain.handle('settings:saveAdvanced', async (_evt, settings) => {
  try {
    if (!isValidObject(settings)) {
      return { error: 'Invalid settings: must be a non-null object' };
    }
    features.saveAdvancedSettings(settings);

    if (typeof settings.windowOpacity === 'number' && overlay && !overlay.isDestroyed()) {
      overlay.setOpacity(settings.windowOpacity);
    }
    if (typeof settings.alwaysOnTop === 'boolean' && overlay && !overlay.isDestroyed()) {
      overlay.setAlwaysOnTop(settings.alwaysOnTop);
    }
    if (typeof settings.clipboardDebounce === 'number') {
      setOptions({ debounceTime: settings.clipboardDebounce });
    }
    if (typeof settings.clipboardMinLength === 'number') {
      setOptions({ minLength: settings.clipboardMinLength });
    }

    return { success: true };
  } catch (err) {
    console.error('Save advanced settings error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('settings:getModelOptions', async () => {
  try {
    return features.getModelOptions();
  } catch (err) {
    console.error('Get model options error:', err);
    return { ollama: [], gemini: [] };
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

ipcMain.handle('history:addTag', async (_evt, { conversationId, tag }) => {
  try {
    if (!isValidString(conversationId, 200)) {
      return { error: 'Invalid conversationId: must be a non-empty string under 200 characters' };
    }
    if (!isValidString(tag, 100)) {
      return { error: 'Invalid tag: must be a non-empty string under 100 characters' };
    }
    return features.addTagToConversation(conversationId, tag);
  } catch (err) {
    console.error('Add tag error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('history:removeTag', async (_evt, { conversationId, tag }) => {
  try {
    if (!isValidString(conversationId, 200)) {
      return { error: 'Invalid conversationId: must be a non-empty string under 200 characters' };
    }
    if (!isValidString(tag, 100)) {
      return { error: 'Invalid tag: must be a non-empty string under 100 characters' };
    }
    return features.removeTagFromConversation(conversationId, tag);
  } catch (err) {
    console.error('Remove tag error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('history:getTags', async () => {
  try {
    return features.getAllTags();
  } catch (err) {
    console.error('Get tags error:', err);
    return [];
  }
});

ipcMain.handle('history:setCategory', async (_evt, { conversationId, category }) => {
  try {
    if (!isValidString(conversationId, 200)) {
      return { error: 'Invalid conversationId: must be a non-empty string under 200 characters' };
    }
    if (!isValidString(category, 50)) {
      return { error: 'Invalid category: must be a non-empty string under 50 characters' };
    }
    return features.setConversationCategory(conversationId, category);
  } catch (err) {
    console.error('Set category error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('history:getByDateRange', async (_evt, { startDate, endDate }) => {
  try {
    if (!isValidString(startDate, 50)) {
      return { error: 'Invalid startDate: must be a non-empty string' };
    }
    if (!isValidString(endDate, 50)) {
      return { error: 'Invalid endDate: must be a non-empty string' };
    }
    return features.getConversationsByDateRange(startDate, endDate);
  } catch (err) {
    console.error('Get by date range error:', err);
    return [];
  }
});

ipcMain.handle('history:search', async (_evt, { query, options }) => {
  try {
    if (query && !isValidString(query, 1000)) {
      return { error: 'Invalid query: must be a non-empty string under 1000 characters' };
    }
    return features.searchConversationsAdvanced(query, options || {});
  } catch (err) {
    console.error('Advanced search error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('history:getCategories', async () => {
  try {
    return features.getAllCategories();
  } catch (err) {
    console.error('Get categories error:', err);
    return [];
  }
});

ipcMain.handle('history:getByCategory', async (_evt, category) => {
  try {
    if (!isValidString(category, 50)) {
      return { error: 'Invalid category: must be a non-empty string under 50 characters' };
    }
    return features.getConversationsByCategory(category);
  } catch (err) {
    console.error('Get by category error:', err);
    return [];
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
  isQuitting = true;
});

app.on('window-all-closed', () => {
  isQuitting = true;
  app.quit();
});
