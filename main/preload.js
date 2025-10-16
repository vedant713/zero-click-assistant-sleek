const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onClipboard: (cb) => ipcRenderer.on("clipboard-event", (_, t) => cb(t)),
  onActiveWindow: (cb) => ipcRenderer.on("active-window", (_, w) => cb(w)),
  setSize: (width, height) => ipcRenderer.invoke("overlay:set-size", { width, height }),
  toggle: () => ipcRenderer.invoke("overlay:toggle"),
});
