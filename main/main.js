const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const { watchClipboard } = require("./sensors/clipboard");
const { getActiveWindowTitle } = require("./sensors/activeWin");
const http = require("http");

let overlay;
let isVisible = true;
const TOGGLE_HOTKEY = "Control+Shift+Space";

// Detect available Vite port
async function detectVitePort() {
  const ports = [5173, 5174, 5175];
  for (const p of ports) {
    try {
      const res = await new Promise((resolve) => {
        const req = http
          .get(`http://localhost:${p}`, () => resolve(true))
          .on("error", () => resolve(false));
        req.end();
      });
      if (res) return p;
    } catch {
      continue;
    }
  }
  return null;
}

async function createOverlay() {
  overlay = new BrowserWindow({
    width: 700,
    height: 140,
    x: 600,
    y: 100,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    opacity: 0.96,
    roundedCorners: true,
    // ✅ must be resizable for dynamic size updates
    resizable: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  const port = await detectVitePort();

  if (port) {
    console.log(`✅ Connected to Vite dev server on port ${port}`);
    overlay.loadURL(`http://localhost:${port}`);
  } else {
    console.log("⚙️ No Vite server found. Loading production build...");
    overlay.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
  }
}

app.whenReady().then(async () => {
  await createOverlay();

  // 🧠 Toggle visibility
  globalShortcut.register(TOGGLE_HOTKEY, () => {
    if (!overlay) return;
    isVisible = !isVisible;
    isVisible ? overlay.show() : overlay.hide();
  });

  // 🧭 Move overlay
  const moveStep = 50;
  const moveWindow = (dx, dy) => {
    if (!overlay) return;
    const [curX, curY] = overlay.getPosition();
    overlay.setPosition(curX + dx, curY + dy);
  };

  globalShortcut.register("CommandOrControl+Up", () => moveWindow(0, -moveStep));
  globalShortcut.register("CommandOrControl+Down", () => moveWindow(0, moveStep));
  globalShortcut.register("CommandOrControl+Left", () => moveWindow(-moveStep, 0));
  globalShortcut.register("CommandOrControl+Right", () => moveWindow(moveStep, 0));

  // ❌ Quit shortcut (Ctrl + Shift + Q)
  globalShortcut.register("Control+Shift+Q", () => {
    console.log("👋 Quit shortcut pressed — closing app...");
    app.quit();
  });

  // 📋 Clipboard listener
  watchClipboard((text) => {
    overlay?.webContents?.send("clipboard-event", text);
  });

  // 🪟 Active window tracker
  setInterval(async () => {
    try {
      const win = await getActiveWindowTitle();
      overlay?.webContents?.send("active-window", win);
    } catch (e) {
      console.error(e);
    }
  }, 2000);
});

// 🧩 IPC Handlers
ipcMain.handle("overlay:set-size", (_evt, { width, height }) => {
  if (!overlay) return false;

  const minH = 120;
  const maxH = 800;
  const clampedH = Math.max(minH, Math.min(Math.round(height), maxH));
  const clampedW = Math.max(400, Math.min(Math.round(width), 1000));

  // ✅ This line actually resizes the window
  overlay.setSize(clampedW, clampedH);
  return true;
});

ipcMain.handle("overlay:toggle", () => {
  if (!overlay) return false;
  isVisible = !isVisible;
  isVisible ? overlay.show() : overlay.hide();
  return isVisible;
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
