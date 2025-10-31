const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Existing event listeners
  onClipboard: (cb) => ipcRenderer.on("clipboard-event", (_, t) => cb(t)),
  onActiveWindow: (cb) => ipcRenderer.on("active-window", (_, w) => cb(w)),
  onSummary: (cb) => ipcRenderer.on("summary-event", (_, data) => cb(data)),
  onSummaryStream: (cb) => ipcRenderer.on("summary-stream", (_, data) => cb(data)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  // Existing actions
  summarize: (text) => ipcRenderer.invoke("summarize", text),
  setSize: (size) => ipcRenderer.invoke("overlay:set-size", size),

  toggle: () => ipcRenderer.invoke("overlay:toggle"),

  // 🧠 NEW — Q&A bridge
  qa: (text, question) => ipcRenderer.invoke("qa:ask", { text, question }),
});
