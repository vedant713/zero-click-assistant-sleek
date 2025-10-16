const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onClipboard: (cb) => ipcRenderer.on("clipboard-event", (_, t) => cb(t)),
  onActiveWindow: (cb) => ipcRenderer.on("active-window", (_, w) => cb(w)),
  onSummary: (cb) => ipcRenderer.on("summary-event", (_, data) => cb(data)),
  onSummaryStream: (cb) => ipcRenderer.on("summary-stream", (_, data) => cb(data)),
  setSize: (width, height) => ipcRenderer.invoke("overlay:set-size", { width, height }),
  toggle: () => ipcRenderer.invoke("overlay:toggle"),
});
