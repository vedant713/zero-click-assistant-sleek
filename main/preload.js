const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing event listeners
  onClipboard: cb => ipcRenderer.on('clipboard-event', (_, t) => cb(t)),
  onActiveWindow: cb => ipcRenderer.on('active-window', (_, w) => cb(w)),
  onSummary: cb => ipcRenderer.on('summary-event', (_, data) => cb(data)),
  onSummaryStream: cb => ipcRenderer.on('summary-stream', (_, data) => cb(data)),
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
  // Existing actions
  summarize: text => ipcRenderer.invoke('summarize', text),
  setSize: size => ipcRenderer.invoke('overlay:set-size', size),

  toggle: () => ipcRenderer.invoke('overlay:toggle'),

  setOpacity: opacity => ipcRenderer.invoke('overlay:setOpacity', opacity),
  setAlwaysOnTop: value => ipcRenderer.invoke('overlay:setAlwaysOnTop', value),
  setPreset: preset => ipcRenderer.invoke('overlay:setPreset', preset),
  getWindowState: () => ipcRenderer.invoke('overlay:getState'),

  // 🧠 NEW — Q&A bridge
  qa: (text, question) => ipcRenderer.invoke('qa:ask', { text, question }),

  // Features - Save Conversations
  saveConversation: (conversation, summary) =>
    ipcRenderer.invoke('features:saveConversation', { conversation, summary }),
  getSavedConversations: () => ipcRenderer.invoke('features:getSavedConversations'),

  // Features - Translation
  translate: (text, targetLang) => ipcRenderer.invoke('features:translate', { text, targetLang }),

  // Features - Quick Actions
  copyToClipboard: text => ipcRenderer.invoke('features:copyToClipboard', text),
  clearConversation: () => ipcRenderer.invoke('features:clearConversation'),

  // Features - Text Analysis
  analyzeText: text => ipcRenderer.invoke('features:analyzeText', text),

  // Features - Bookmarks
  bookmarkConversation: (conversation, summary, label) =>
    ipcRenderer.invoke('features:bookmarkConversation', { conversation, summary, label }),
  getBookmarks: () => ipcRenderer.invoke('features:getBookmarks'),
  deleteBookmark: id => ipcRenderer.invoke('features:deleteBookmark', id),

  // Features - Export
  exportMarkdown: (summary, conversation) =>
    ipcRenderer.invoke('features:exportMarkdown', { summary, conversation }),
  exportText: (summary, conversation) =>
    ipcRenderer.invoke('features:exportText', { summary, conversation }),
  exportAsJSON: (data, options) => ipcRenderer.invoke('export:asJSON', { data, options }),
  exportAsHTML: (data, options) => ipcRenderer.invoke('export:asHTML', { data, options }),
  exportAsPDF: (html, filename) => ipcRenderer.invoke('export:asPDF', { html, filename }),
  exportBulk: (conversationIds, format) =>
    ipcRenderer.invoke('export:bulk', { conversationIds, format }),
  shareFormattedText: data => ipcRenderer.invoke('features:shareFormattedText', data),
  shareMarkdown: data => ipcRenderer.invoke('features:shareMarkdown', data),

  // Features - Search
  searchConversations: query => ipcRenderer.invoke('features:search', query),

  // Features - Providers
  getProviders: () => ipcRenderer.invoke('features:getProviders'),
  setProvider: provider => ipcRenderer.invoke('features:setProvider', provider),
  onProviderStatus: cb => ipcRenderer.on('provider-status', (_, status) => cb(status)),

  // Features - Settings
  getSettings: () => ipcRenderer.invoke('features:getSettings'),
  saveSettings: settings => ipcRenderer.invoke('features:saveSettings', settings),

  // Features - History
  getHistory: () => ipcRenderer.invoke('features:getHistory'),
  clearHistory: () => ipcRenderer.invoke('features:clearHistory'),

  // Features - Autostart
  setAutoStart: enabled => ipcRenderer.invoke('features:setAutoStart', { enabled }),
  getAutoStart: () => ipcRenderer.invoke('features:getAutoStart'),

  // Hotkeys
  getHotkeys: () => ipcRenderer.invoke('hotkeys:get'),
  saveHotkeys: hotkeys => ipcRenderer.invoke('hotkeys:save', hotkeys),
  exportSettings: () => ipcRenderer.invoke('settings:export'),
  importSettings: data => ipcRenderer.invoke('settings:import', data),

  // Clipboard Control
  clipboardSetDebounce: debounceTime => ipcRenderer.invoke('clipboard:setDebounce', debounceTime),
  clipboardSetMinLength: minLength => ipcRenderer.invoke('clipboard:setMinLength', minLength),
  clipboardPause: () => ipcRenderer.invoke('clipboard:pause'),
  clipboardResume: () => ipcRenderer.invoke('clipboard:resume'),
  clipboardStatus: () => ipcRenderer.invoke('clipboard:status'),

  // Advanced Settings
  getAdvancedSettings: () => ipcRenderer.invoke('settings:getAdvanced'),
  saveAdvancedSettings: settings => ipcRenderer.invoke('settings:saveAdvanced', settings),
  getModelOptions: () => ipcRenderer.invoke('settings:getModelOptions'),

  // History - Tags
  addTagToConversation: (conversationId, tag) =>
    ipcRenderer.invoke('history:addTag', { conversationId, tag }),
  removeTagFromConversation: (conversationId, tag) =>
    ipcRenderer.invoke('history:removeTag', { conversationId, tag }),
  getAllTags: () => ipcRenderer.invoke('history:getTags'),

  // History - Categories
  setConversationCategory: (conversationId, category) =>
    ipcRenderer.invoke('history:setCategory', { conversationId, category }),
  getConversationsByCategory: category => ipcRenderer.invoke('history:getByCategory', category),
  getAllCategories: () => ipcRenderer.invoke('history:getCategories'),

  // History - Search & Filter
  getConversationsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke('history:getByDateRange', { startDate, endDate }),
  searchHistory: (query, options) => ipcRenderer.invoke('history:search', { query, options }),
});
