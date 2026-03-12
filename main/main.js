const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const { watchClipboard } = require("./sensors/clipboard");
const { getActiveWindowTitle } = require("./sensors/activeWin");
const http = require("http");
require("dotenv").config();
const { summarize, qa } = require("../shared/summarizer");


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

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (activeWindowInterval) {
    clearInterval(activeWindowInterval);
  }
});
app.on("window-all-closed", () => app.quit());
