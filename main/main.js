const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const { watchClipboard } = require("./sensors/clipboard");
const { getActiveWindowTitle } = require("./sensors/activeWin");
const http = require("http");
require("dotenv").config();
const { summarize, qa } = require("../shared/summarizer");
const features = require("../shared/features");


let overlay;
let isVisible = true;
let activeWindowInterval = null;
const TOGGLE_HOTKEY = "CommandOrControl+Alt+O";

// Utility: detect running Vite dev server port
async function detectVitePort() {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  for (const p of ports) {
    const ok = await new Promise((res) => {
      const req = http.get(`http://localhost:${p}`, () => res(true)).on("error", () => res(false));
      req.end();
    });
    if (ok) return p;
  }
  return null;
}

async function createOverlay() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlay = new BrowserWindow({
    width: 820,
    height: 200,
    x: Math.round((width - 820) / 2),
    y: Math.round(height * 0.15),
    frame: false,
    transparent: false,
    backgroundColor: "#1e1e2e",
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  console.log("📱 Window created");

  const port = await detectVitePort();

  if (port) {
    console.log("Loading from Vite dev server on port " + port);
    await overlay.loadURL("http://localhost:" + port);
  } else {
    console.log("Loading production build...");
    await overlay.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
  }

  overlay.webContents.on("did-finish-load", () => {
    console.log("Renderer loaded, ready for events.");
    overlay.show();
  });

}

// Electron startup
app.whenReady().then(async () => {
  await createOverlay();

  // Toggle visibility (Ctrl+Alt+O)
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
      console.error("Failed to register toggle shortcut");
    } else {
      console.log("Toggle shortcut registered (Ctrl+Alt+O)");
    }
  } catch (err) {
    console.error("Error registering toggle shortcut:", err);
  }

  // Reset window position (Ctrl+Alt+R)
  try {
    globalShortcut.register("CommandOrControl+Alt+R", () => {
      if (!overlay) return;
      const { screen } = require("electron");
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      overlay.setPosition(
        Math.round((width - 820) / 2),
        Math.round(height * 0.15)
      );
      overlay.show();
      isVisible = true;
      console.log("Window position reset");
    });
    console.log("Reset shortcut registered (Ctrl+Alt+R)");
  } catch (err) {
    console.error("Error registering reset shortcut:", err);
  }

  // Move overlay
  const moveStep = 50;
  const move = (dx, dy) => {
    if (!overlay) return;
    const [x, y] = overlay.getPosition();
    overlay.setPosition(x + dx, y + dy);
  };
  try {
    globalShortcut.register("CommandOrControl+Alt+Up", () => move(0, -moveStep));
    globalShortcut.register("CommandOrControl+Alt+Down", () => move(0, moveStep));
    globalShortcut.register("CommandOrControl+Alt+Left", () => move(-moveStep, 0));
    globalShortcut.register("CommandOrControl+Alt+Right", () => move(moveStep, 0));
    console.log("Move shortcuts registered");
  } catch (err) {
    console.error("Error registering move shortcuts:", err);
  }

  // Quit (Ctrl+Alt+X)
  try {
    const quitRegistered = globalShortcut.register("CommandOrControl+Alt+X", () => {
      console.log("Quit shortcut pressed — closing app...");
      app.exit(0);
    });
    if (!quitRegistered) {
      console.error("Failed to register quit shortcut");
    } else {
      console.log("Quit shortcut registered (Ctrl+Alt+X)");
    }
  } catch (err) {
    console.error("Error registering quit shortcut:", err);
  }

  // Clipboard watcher
  watchClipboard(async (text) => {
    try {
      console.log("Clipboard text:", text.slice(0, 80));
      const { summary, followUps } = await summarize(text);
      if (overlay && overlay.webContents && !overlay.webContents.isDestroyed()) {
        overlay.webContents.send("clipboard-event", text);
        overlay.webContents.send("summary-event", { text, summary, followUps });
      }
    } catch (err) {
      console.error("Summarization error:", err);
    }
  });

  // Active window tracker
  activeWindowInterval = setInterval(async () => {
    try {
      const win = await getActiveWindowTitle();
      if (overlay && overlay.webContents && !overlay.webContents.isDestroyed()) {
        overlay.webContents.send("active-window", win);
      }
    } catch (e) {
      console.error(e);
    }
  }, 2000);
});

// IPC: Resize
ipcMain.handle("overlay:set-size", async (_evt, payload) => {
  if (!overlay) return;

  try {
    if (!payload || typeof payload !== "object") {
      return;
    }

    const { width, height } = payload;
    if (typeof width !== "number" || typeof height !== "number") {
      return;
    }

    await new Promise((r) => setTimeout(r, 200));

    const fixedW = width;
    const minH = 120;
    const maxH = 800;
    const clampedH = Math.max(minH, Math.min(Math.round(height), maxH));

    overlay.setResizable(true);
    overlay.setSize(fixedW, clampedH);
    overlay.setResizable(false);
  } catch (err) {
    console.error("overlay:set-size error:", err);
  }
});

ipcMain.handle("summarize", async (_evt, text) => {
  try {
    const { summary, followUps } = await summarize(text);
    return { summary, followUps };
  } catch (err) {
    console.error("Summarization IPC error:", err);
    return { summary: "Summarization failed.", followUps: [] };
  }
});

ipcMain.handle("qa:ask", async (_evt, { text, question }) => {
  try {
    const answer = await qa(text, question);
    return answer || "No answer generated.";
  } catch (err) {
    console.error("Q&A error:", err);
    return "Q&A failed.";
  }
});

ipcMain.handle("overlay:toggle", () => {
  if (!overlay) return false;
  isVisible = !isVisible;
  isVisible ? overlay.show() : overlay.hide();
  return isVisible;
});

// IPC: Features - Save Conversations
ipcMain.handle("features:saveConversation", async (_evt, { conversation, summary }) => {
  try {
    return features.saveConversation(conversation, summary);
  } catch (err) {
    console.error("Save conversation error:", err);
    return null;
  }
});

ipcMain.handle("features:getSavedConversations", async () => {
  try {
    return features.getSavedConversations();
  } catch (err) {
    console.error("Get saved conversations error:", err);
    return [];
  }
});

// IPC: Features - Translation
ipcMain.handle("features:translate", async (_evt, { text, targetLang }) => {
  try {
    return await features.translateText(text, targetLang);
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
});

// IPC: Features - Quick Actions
ipcMain.handle("features:copyToClipboard", async (_evt, text) => {
  try {
    return features.copyToClipboard(text);
  } catch (err) {
    console.error("Copy to clipboard error:", err);
    return false;
  }
});

ipcMain.handle("features:clearConversation", async () => {
  try {
    return features.clearConversation();
  } catch (err) {
    console.error("Clear conversation error:", err);
    return false;
  }
});

// IPC: Features - Text Analysis
ipcMain.handle("features:analyzeText", async (_evt, text) => {
  try {
    return features.analyzeText(text);
  } catch (err) {
    console.error("Analyze text error:", err);
    return null;
  }
});

// IPC: Features - Bookmarks
ipcMain.handle("features:bookmarkConversation", async (_evt, { conversation, summary, label }) => {
  try {
    return features.bookmarkConversation(conversation, summary, label);
  } catch (err) {
    console.error("Bookmark error:", err);
    return null;
  }
});

ipcMain.handle("features:getBookmarks", async () => {
  try {
    return features.getBookmarks();
  } catch (err) {
    console.error("Get bookmarks error:", err);
    return [];
  }
});

ipcMain.handle("features:deleteBookmark", async (_evt, id) => {
  try {
    return features.deleteBookmark(id);
  } catch (err) {
    console.error("Delete bookmark error:", err);
    return false;
  }
});

// IPC: Features - Export
ipcMain.handle("features:exportMarkdown", async (_evt, { summary, conversation }) => {
  try {
    return features.exportAsMarkdown(summary, conversation);
  } catch (err) {
    console.error("Export markdown error:", err);
    return '';
  }
});

ipcMain.handle("features:exportText", async (_evt, { summary, conversation }) => {
  try {
    return features.exportAsText(summary, conversation);
  } catch (err) {
    console.error("Export text error:", err);
    return '';
  }
});

// IPC: Features - Search
ipcMain.handle("features:search", async (_evt, query) => {
  try {
    return features.searchConversations(query);
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
});

// IPC: Features - Providers
ipcMain.handle("features:getProviders", async () => {
  try {
    return features.getAvailableProviders();
  } catch (err) {
    console.error("Get providers error:", err);
    return { ollama: false, gemini: false, mock: false };
  }
});

// IPC: Features - Settings
ipcMain.handle("features:getSettings", async () => {
  try {
    return features.getSettings();
  } catch (err) {
    console.error("Get settings error:", err);
    return {};
  }
});

ipcMain.handle("features:saveSettings", async (_evt, settings) => {
  try {
    return features.saveSettings(settings);
  } catch (err) {
    console.error("Save settings error:", err);
    return false;
  }
});

// IPC: Features - History
ipcMain.handle("features:getHistory", async () => {
  try {
    return features.getHistory();
  } catch (err) {
    console.error("Get history error:", err);
    return [];
  }
});

ipcMain.handle("features:clearHistory", async () => {
  try {
    return features.clearHistory();
  } catch (err) {
    console.error("Clear history error:", err);
    return false;
  }
});

// IPC: Analysis
ipcMain.handle("analyze-text", async (_evt, text) => {
  try {
    return features.analyzeText(text);
  } catch (err) {
    console.error("Analyze text error:", err);
    return null;
  }
});

// IPC: Bookmarks
ipcMain.handle("get-bookmarks", async () => {
  try {
    return features.getBookmarks();
  } catch (err) {
    console.error("Get bookmarks error:", err);
    return [];
  }
});

ipcMain.handle("bookmark-conversation", async (_evt, { summary, conversation, label }) => {
  try {
    return features.bookmarkConversation(conversation, summary, label);
  } catch (err) {
    console.error("Bookmark error:", err);
    return null;
  }
});

ipcMain.handle("delete-bookmark", async (_evt, id) => {
  try {
    return features.deleteBookmark(id);
  } catch (err) {
    console.error("Delete bookmark error:", err);
    return false;
  }
});

// IPC: History
ipcMain.handle("get-history", async () => {
  try {
    return features.getHistory();
  } catch (err) {
    console.error("Get history error:", err);
    return [];
  }
});

ipcMain.handle("clear-history", async () => {
  try {
    return features.clearHistory();
  } catch (err) {
    console.error("Clear history error:", err);
    return false;
  }
});

ipcMain.handle("save-conversation", async (_evt, { summary, conversation }) => {
  try {
    return features.saveConversation(conversation, summary);
  } catch (err) {
    console.error("Save conversation error:", err);
    return null;
  }
});

// IPC: Export
ipcMain.handle("export-markdown", async (_evt, { summary, conversation }) => {
  try {
    return features.exportAsMarkdown(summary, conversation);
  } catch (err) {
    console.error("Export markdown error:", err);
    return '';
  }
});

ipcMain.handle("export-text", async (_evt, { summary, conversation }) => {
  try {
    return features.exportAsText(summary, conversation);
  } catch (err) {
    console.error("Export text error:", err);
    return '';
  }
});

// IPC: Search
ipcMain.handle("search-history", async (_evt, query) => {
  try {
    return features.searchConversations(query);
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
});

// IPC: Provider
ipcMain.handle("get-provider", async () => {
  try {
    const settings = features.getSettings();
    return settings.provider || 'ollama';
  } catch (err) {
    console.error("Get provider error:", err);
    return 'ollama';
  }
});

ipcMain.handle("set-provider", async (_evt, provider) => {
  try {
    const settings = features.getSettings();
    settings.provider = provider;
    return features.saveSettings(settings);
  } catch (err) {
    console.error("Set provider error:", err);
    return false;
  }
});

// IPC: Mock Data
ipcMain.handle("get-mock-data", async (_evt, type) => {
  try {
    const mockData = {
      conversations: [
        { id: '1', summary: 'Sample conversation 1', conversation: ['Hello', 'Hi there'], timestamp: Date.now() },
        { id: '2', summary: 'Sample conversation 2', conversation: ['How are you?', 'I am good'], timestamp: Date.now() }
      ],
      bookmarks: [
        { id: '1', label: 'Important', summary: 'Bookmarked conversation', timestamp: Date.now() }
      ],
      history: [
        { id: '1', summary: 'History item 1', timestamp: Date.now() },
        { id: '2', summary: 'History item 2', timestamp: Date.now() }
      ]
    };
    return mockData[type] || null;
  } catch (err) {
    console.error("Get mock data error:", err);
    return null;
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (activeWindowInterval) {
    clearInterval(activeWindowInterval);
  }
});
app.on("window-all-closed", () => app.quit());
