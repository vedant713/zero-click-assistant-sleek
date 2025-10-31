const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const { watchClipboard } = require("./sensors/clipboard");
const { getActiveWindowTitle } = require("./sensors/activeWin");
const http = require("http");
require("dotenv").config();
const { summarizeWithGemini, qaWithGemini } = require("../shared/summarizer");


let overlay;
let isVisible = true;
const TOGGLE_HOTKEY = "Control+Shift+Space";

// Utility: detect running Vite dev server port
async function detectVitePort() {
  const ports = [5173, 5174, 5175];
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
  overlay = new BrowserWindow({
    width: 820, // ✅ match your fixed width
    height: 140,
    x: 600,
    y: 100,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false, // ✅ prevent Electron from recalculating internal frame bounds
    backgroundColor: "#00000000",
    roundedCorners: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    backgroundMaterial: "acrylic",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });


  const port = await detectVitePort();

  if (port) {
    console.log(`✅ Connected to Vite dev server on port ${port}`);
    await overlay.loadURL(`http://localhost:${port}`);
  } else {
    console.log("⚙️ No Vite server found. Loading production build...");
    await overlay.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
  }

overlay.webContents.on("did-finish-load", () => {
  console.log("🖥 Renderer loaded, ready for events.");
  overlay.setSize(820, 140); // ✅ ensure the width matches once DOM is ready
});

}

// Electron startup
app.whenReady().then(async () => {
  await createOverlay();

  // 🔹 Toggle visibility (Ctrl + Shift + Space)
  globalShortcut.register(TOGGLE_HOTKEY, () => {
    if (!overlay) return;
    isVisible = !isVisible;
    isVisible ? overlay.show() : overlay.hide();
  });

  // 🔹 Move overlay
  const moveStep = 50;
  const move = (dx, dy) => {
    if (!overlay) return;
    const [x, y] = overlay.getPosition();
    overlay.setPosition(x + dx, y + dy);
  };
  globalShortcut.register("CommandOrControl+Up", () => move(0, -moveStep));
  globalShortcut.register("CommandOrControl+Down", () => move(0, moveStep));
  globalShortcut.register("CommandOrControl+Left", () => move(-moveStep, 0));
  globalShortcut.register("CommandOrControl+Right", () => move(moveStep, 0));

  // 🔹 Quit (Ctrl + Shift + Q)
  globalShortcut.register("Control+Shift+Q", () => {
    console.log("👋 Quit shortcut pressed — closing app...");
    app.quit();
  });

  // 📋 Clipboard watcher → summarize
  watchClipboard(async (text) => {
    try {
      console.log("📋 Clipboard text:", text.slice(0, 80));
      const { summary, followUps } = await summarizeWithGemini(text);
      if (overlay && overlay.webContents && !overlay.webContents.isDestroyed()) {
        overlay.webContents.send("summary-event", { text, summary, followUps });
      }
    } catch (err) {
      console.error("Summarization error:", err);
    }
  });


  // 🪟 Active window tracker
  setInterval(async () => {
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

// 🧩 IPC: Resize + Toggle
let resizeTimeout;
ipcMain.handle("overlay:set-size", async (_evt, payload) => {
  if (!overlay) return;

  try {
    // Defensive: verify object
    if (!payload || typeof payload !== "object") {
      console.warn("⚠️ overlay:set-size invalid payload type:", payload);
      return;
    }

    const { width, height } = payload;
    if (typeof width !== "number" || typeof height !== "number") {
      console.warn("⚠️ overlay:set-size missing numeric width/height:", payload);
      return;
    }

    // Wait slightly to let the DOM settle — no closure leak
    await new Promise((r) => setTimeout(r, 200));

    const fixedW = width;
    const minH = 120;
    const maxH = 800;
    const clampedH = Math.max(minH, Math.min(Math.round(height), maxH));

    overlay.setResizable(true);
    overlay.setSize(fixedW, clampedH);
    overlay.setResizable(false);
  } catch (err) {
    console.error("❌ overlay:set-size error:", err);
  }
});



ipcMain.handle("summarize", async (_evt, text) => {
  try {
    console.log("🧠 Summarization IPC received.");
    const { summary, followUps } = await summarizeWithGemini(text);
    console.log("✅ Summarization complete — returning to renderer.");
    return { summary, followUps };
  } catch (err) {
    console.error("❌ Summarization IPC error:", err);
    return { summary: "Summarization failed.", followUps: [] };
  }
});

// 💬 NEW — Q&A Handler
ipcMain.handle("qa:ask", async (_evt, { text, question }) => {
  try {
    console.log("💬 Ask Mode:", question);
    const answer = await qaWithGemini(text, question); // ✅ fixed variable
    console.log("✅ Q&A done — sending back answer.");
    return answer || "No answer generated.";
  } catch (err) {
    console.error("❌ Gemini Q&A error:", err);
    return "Q&A failed.";
  }
});

ipcMain.handle("refresh-window", () => {
  if (overlay && !overlay.isDestroyed()) {
    overlay.setBackgroundColor("#00000000");
    overlay.setOpacity(0.9999);  // Force compositor to redraw
    setTimeout(() => overlay.setOpacity(1), 50);
  }
});




ipcMain.handle("overlay:toggle", () => {
  if (!overlay) return false;
  isVisible = !isVisible;
  isVisible ? overlay.show() : overlay.hide();
  return isVisible;
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
