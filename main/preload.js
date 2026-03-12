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

  // Features - Save Conversations
  saveConversation: (conversation, summary) => 
    ipcRenderer.invoke("features:saveConversation", { conversation, summary }),
  getSavedConversations: () => 
    ipcRenderer.invoke("features:getSavedConversations"),

  // Features - Translation
  translate: (text, targetLang) => 
    ipcRenderer.invoke("features:translate", { text, targetLang }),

  // Features - Quick Actions
  copyToClipboard: (text) => ipcRenderer.invoke("features:copyToClipboard", text),
  clearConversation: () => ipcRenderer.invoke("features:clearConversation"),

  // Features - Text Analysis
  analyzeText: (text) => ipcRenderer.invoke("features:analyzeText", text),

  // Features - Bookmarks
  bookmarkConversation: (conversation, summary, label) => 
    ipcRenderer.invoke("features:bookmarkConversation", { conversation, summary, label }),
  getBookmarks: () => ipcRenderer.invoke("features:getBookmarks"),
  deleteBookmark: (id) => ipcRenderer.invoke("features:deleteBookmark", id),

  // Features - Export
  exportMarkdown: (summary, conversation) => 
    ipcRenderer.invoke("features:exportMarkdown", { summary, conversation }),
  exportText: (summary, conversation) => 
    ipcRenderer.invoke("features:exportText", { summary, conversation }),

  // Features - Search
  searchConversations: (query) => ipcRenderer.invoke("features:search", query),

  // Features - Providers
  getProviders: () => ipcRenderer.invoke("features:getProviders"),

  // Features - Settings
  getSettings: () => ipcRenderer.invoke("features:getSettings"),
  saveSettings: (settings) => ipcRenderer.invoke("features:saveSettings", settings),

  // Features - History
  getHistory: () => ipcRenderer.invoke("features:getHistory"),
  clearHistory: () => ipcRenderer.invoke("features:clearHistory"),

  // Analysis
  analyzeText: (text) => ipcRenderer.invoke("analyze-text", text),

  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke("get-bookmarks"),
  bookmarkConversation: (summary, conversation, label) => 
    ipcRenderer.invoke("bookmark-conversation", { summary, conversation, label }),
  deleteBookmark: (id) => ipcRenderer.invoke("delete-bookmark", id),

  // History
  getHistory: () => ipcRenderer.invoke("get-history"),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  saveConversation: (summary, conversation) => 
    ipcRenderer.invoke("save-conversation", { summary, conversation }),

  // Export
  exportAsMarkdown: (summary, conversation) => 
    ipcRenderer.invoke("export-markdown", { summary, conversation }),
  exportAsText: (summary, conversation) => 
    ipcRenderer.invoke("export-text", { summary, conversation }),

  // Search
  searchHistory: (query) => ipcRenderer.invoke("search-history", query),

  // Provider
  getCurrentProvider: () => ipcRenderer.invoke("get-provider"),
  setProvider: (provider) => ipcRenderer.invoke("set-provider", provider),

  // Mock Data
  getMockData: (type) => ipcRenderer.invoke("get-mock-data", type),
});
