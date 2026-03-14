/**
 * Additional Features for Zero-Click Assistant
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { config } = require('./config');

// ============ 1. Save Conversations ============
const VALID_CATEGORIES = ['general', 'work', 'personal', 'research', 'code', 'notes'];

function saveConversation(conversation, summary, tags = [], category = 'general') {
  const dir = getDataDir();
  const filename = `conversation_${Date.now()}.json`;
  const data = {
    summary,
    conversation,
    tags: Array.isArray(tags) ? tags : [],
    category: VALID_CATEGORIES.includes(category) ? category : 'general',
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
  return filename;
}

function getSavedConversations() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.startsWith('conversation_') && f.endsWith('.json'))
    .map(f => ({
      filename: f,
      data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
    }));
}

function getConversationById(conversationId) {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter(f => f.startsWith('conversation_') && f.endsWith('.json'));
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (f.replace('.json', '') === conversationId.replace('.json', '')) {
      return { filename: f, data };
    }
  }
  return null;
}

function updateConversationFile(conversationId, updates) {
  const dir = getDataDir();
  const filePath = path.join(dir, conversationId);
  if (!fs.existsSync(filePath)) return false;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = { ...data, ...updates };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  return true;
}

// ============ 1a. Tag/Label Management ============
function addTagToConversation(conversationId, tag) {
  const conv = getConversationById(conversationId);
  if (!conv) return false;
  const tags = conv.data.tags || [];
  if (!tags.includes(tag)) {
    tags.push(tag);
    return updateConversationFile(conversationId, { tags });
  }
  return true;
}

function removeTagFromConversation(conversationId, tag) {
  const conv = getConversationById(conversationId);
  if (!conv) return false;
  const tags = (conv.data.tags || []).filter(t => t !== tag);
  return updateConversationFile(conversationId, { tags });
}

function getAllTags() {
  const conversations = getSavedConversations();
  const bookmarks = getBookmarks();
  const tagSet = new Set();
  conversations.forEach(c => {
    (c.data.tags || []).forEach(t => tagSet.add(t));
  });
  bookmarks.forEach(b => {
    (b.tags || []).forEach(t => tagSet.add(t));
  });
  return Array.from(tagSet).sort();
}

// ============ 1b. Date Range Filtering ============
function getConversationsByDateRange(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const conversations = getSavedConversations();
  return conversations.filter(c => {
    const savedAt = new Date(c.data.savedAt).getTime();
    return savedAt >= start && savedAt <= end;
  });
}

// ============ 1c. Categories ============
function setConversationCategory(conversationId, category) {
  const validCategory = VALID_CATEGORIES.includes(category) ? category : 'general';
  return updateConversationFile(conversationId, { category: validCategory });
}

function getConversationsByCategory(category) {
  const conversations = getSavedConversations();
  return conversations.filter(c => c.data.category === category);
}

function getAllCategories() {
  return [...VALID_CATEGORIES];
}

// ============ 1d. Enhanced Search ============
function searchConversationsAdvanced(query, options = {}) {
  const { tags, category, startDate, endDate, sortBy, sortOrder } = options;
  let results = [...getSavedConversations(), ...getBookmarks()];

  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(item => {
      const summary = item.data?.summary || item.summary || '';
      const conv = item.data?.conversation || item.conversation || [];
      const qna = Array.isArray(conv)
        ? conv.map(c => (c.question || '') + ' ' + (c.answer || '')).join(' ')
        : '';
      const itemTags = item.data?.tags || item.tags || [];
      const itemCategory = item.data?.category || item.category || '';
      const text = (
        summary +
        ' ' +
        qna +
        ' ' +
        itemTags.join(' ') +
        ' ' +
        itemCategory
      ).toLowerCase();
      return text.includes(lowerQuery);
    });
  }

  if (tags && tags.length > 0) {
    results = results.filter(item => {
      const itemTags = item.data?.tags || item.tags || [];
      return tags.some(tag => itemTags.includes(tag));
    });
  }

  if (category) {
    results = results.filter(item => {
      const itemCategory = item.data?.category || item.category || '';
      return itemCategory === category;
    });
  }

  if (startDate || endDate) {
    results = results.filter(item => {
      const savedAt = new Date(item.data?.savedAt || item.savedAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      return savedAt >= start && savedAt <= end;
    });
  }

  return sortConversations(results, sortBy || 'date', sortOrder || 'desc');
}

// ============ 1e. Sort Options ============
function sortConversations(conversations, sortBy, sortOrder = 'desc') {
  const sorted = [...conversations];
  const asc = sortOrder === 'asc';

  sorted.sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case 'date':
        valA = new Date(a.data?.savedAt || a.savedAt || 0).getTime();
        valB = new Date(b.data?.savedAt || b.savedAt || 0).getTime();
        break;
      case 'name':
        valA = (a.data?.summary || a.summary || '').toLowerCase();
        valB = (b.data?.summary || b.summary || '').toLowerCase();
        break;
      case 'label':
        valA = (a.data?.tags || a.tags || []).join(' ').toLowerCase();
        valB = (b.data?.tags || b.tags || []).join(' ').toLowerCase();
        break;
      default:
        valA = new Date(a.data?.savedAt || a.savedAt || 0).getTime();
        valB = new Date(b.data?.savedAt || b.savedAt || 0).getTime();
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return asc ? valA - valB : valB - valA;
  });

  return sorted;
}

// ============ 2. Language Translation ============
async function translateText(text, targetLang = 'en') {
  // Uses LLM to translate - returns translated text
  return `[Translated to ${targetLang}]: ${text}`;
}

// ============ 3. Quick Actions ============
function copyToClipboard(text) {
  const { clipboard } = require('electron');
  clipboard.writeText(text);
  return true;
}

function clearConversation() {
  return true;
}

// ============ 4. Text Analysis ============
function analyzeText(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chars = text.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Simple sentiment (positive/negative word detection)
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'best',
    'love',
    'helpful',
    'useful',
    'awesome',
  ];
  const negativeWords = [
    'bad',
    'poor',
    'terrible',
    'worst',
    'hate',
    'awful',
    'useless',
    'failed',
    'error',
    'problem',
  ];
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const sentiment =
    positiveCount > negativeCount
      ? 'positive'
      : negativeCount > positiveCount
        ? 'negative'
        : 'neutral';

  return {
    wordCount: words.length,
    charCount: chars,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    sentiment,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
  };
}

// ============ 5. Bookmark Conversations ============
const DEFAULT_FOLDERS = ['General', 'Work', 'Personal', 'Important'];

function getBookmarkFolders() {
  const dir = getDataDir();
  const foldersFile = path.join(dir, 'bookmark_folders.json');
  if (!fs.existsSync(foldersFile)) {
    const defaultFolders = DEFAULT_FOLDERS.map((name, index) => ({
      id: index + 1,
      name,
      createdAt: new Date().toISOString(),
    }));
    fs.writeFileSync(foldersFile, JSON.stringify(defaultFolders, null, 2));
    return defaultFolders;
  }
  return JSON.parse(fs.readFileSync(foldersFile, 'utf8'));
}

function createBookmarkFolder(name) {
  const dir = getDataDir();
  const foldersFile = path.join(dir, 'bookmark_folders.json');
  let folders = getBookmarkFolders();
  const newFolder = {
    id: Date.now(),
    name,
    createdAt: new Date().toISOString(),
  };
  folders.push(newFolder);
  fs.writeFileSync(foldersFile, JSON.stringify(folders, null, 2));
  return newFolder;
}

function deleteBookmarkFolder(folderId) {
  const dir = getDataDir();
  const foldersFile = path.join(dir, 'bookmark_folders.json');
  const bookmarksFile = path.join(dir, 'bookmarks.json');

  if (!fs.existsSync(foldersFile)) return false;
  let folders = JSON.parse(fs.readFileSync(foldersFile, 'utf8'));
  folders = folders.filter(f => f.id !== folderId);
  fs.writeFileSync(foldersFile, JSON.stringify(folders, null, 2));

  if (fs.existsSync(bookmarksFile)) {
    let bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
    bookmarks = bookmarks.map(b => {
      if (b.folderId === folderId) {
        return { ...b, folderId: null, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
  }

  return true;
}

function addBookmarkNote(bookmarkId, note) {
  const dir = getDataDir();
  const bookmarksFile = path.join(dir, 'bookmarks.json');
  if (!fs.existsSync(bookmarksFile)) return false;
  let bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return false;
  bookmark.note = note;
  bookmark.updatedAt = new Date().toISOString();
  fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
  return true;
}

function getBookmarkNote(bookmarkId) {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  return bookmark ? bookmark.note : null;
}

function moveBookmarkToFolder(bookmarkId, folderId) {
  const dir = getDataDir();
  const bookmarksFile = path.join(dir, 'bookmarks.json');
  if (!fs.existsSync(bookmarksFile)) return false;
  let bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return false;
  bookmark.folderId = folderId;
  bookmark.updatedAt = new Date().toISOString();
  fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
  return true;
}

function searchBookmarks(query, options = {}) {
  const { folderId, sortBy, sortOrder } = options;
  let bookmarks = getBookmarks();

  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase();
    bookmarks = bookmarks.filter(b => {
      const label = (b.label || '').toLowerCase();
      const summary = (b.summary || '').toLowerCase();
      const note = (b.note || '').toLowerCase();
      return (
        label.includes(lowerQuery) || summary.includes(lowerQuery) || note.includes(lowerQuery)
      );
    });
  }

  if (folderId) {
    bookmarks = bookmarks.filter(b => b.folderId === folderId);
  }

  return sortBookmarks(bookmarks, sortBy || 'date', sortOrder || 'desc');
}

function sortBookmarks(bookmarks, sortBy, sortOrder = 'desc') {
  const sorted = [...bookmarks];
  const asc = sortOrder === 'asc';

  sorted.sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case 'date':
        valA = new Date(a.savedAt || 0).getTime();
        valB = new Date(b.savedAt || 0).getTime();
        break;
      case 'name':
        valA = (a.summary || '').toLowerCase();
        valB = (b.summary || '').toLowerCase();
        break;
      case 'label':
        valA = (a.label || '').toLowerCase();
        valB = (b.label || '').toLowerCase();
        break;
      default:
        valA = new Date(a.savedAt || 0).getTime();
        valB = new Date(b.savedAt || 0).getTime();
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return asc ? valA - valB : valB - valA;
  });

  return sorted;
}

function bookmarkConversation(conversation, summary, label) {
  const dir = getDataDir();
  const bookmarksFile = path.join(dir, 'bookmarks.json');
  let bookmarks = [];
  if (fs.existsSync(bookmarksFile)) {
    bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
  }
  bookmarks.push({
    id: Date.now(),
    label: label || 'Bookmark',
    summary,
    conversation,
    folderId: null,
    note: null,
    savedAt: new Date().toISOString(),
    updatedAt: null,
  });
  fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
  return bookmarks.length;
}

function getBookmarks() {
  const dir = getDataDir();
  const bookmarksFile = path.join(dir, 'bookmarks.json');
  if (!fs.existsSync(bookmarksFile)) return [];
  return JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
}

function deleteBookmark(id) {
  const dir = getDataDir();
  const bookmarksFile = path.join(dir, 'bookmarks.json');
  if (!fs.existsSync(bookmarksFile)) return false;
  let bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
  bookmarks = bookmarks.filter(b => b.id !== id);
  fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
  return true;
}

// ============ 6. Export Options ============
function exportAsMarkdown(summary, conversation) {
  let md = `# Summary\n\n${summary}\n\n`;
  if (conversation.length > 0) {
    md += `## Conversation\n\n`;
    conversation.forEach((item, idx) => {
      md += `### Q${idx + 1}: ${item.question}\n\n`;
      md += `${item.answer}\n\n`;
    });
  }
  return md;
}

function exportAsText(summary, conversation) {
  let txt = `SUMMARY\n=======\n${summary}\n\n`;
  if (conversation.length > 0) {
    txt += `CONVERSATION\n============\n\n`;
    conversation.forEach((item, idx) => {
      txt += `Q${idx + 1}: ${item.question}\n`;
      txt += `A: ${item.answer}\n\n`;
    });
  }
  return txt;
}

function exportAsJSON(data, options = {}) {
  const { pretty = true } = options;
  const exportData = {
    summary: data.summary || '',
    conversation: data.conversation || [],
    bookmarks: data.bookmarks || [],
    history: data.history || [],
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
}

function exportAsHTML(data, options = {}) {
  const { theme = 'dark', includeStyles = true } = options;
  const isDark = theme === 'dark';

  const styles = includeStyles
    ? `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: ${isDark ? '#1a1a2e' : '#f5f5f5'}; color: ${isDark ? '#eee' : '#333'}; }
      h1, h2, h3 { margin-bottom: 16px; color: ${isDark ? '#4a9eff' : '#0066cc'}; }
      .summary { background: ${isDark ? '#16213e' : '#fff'}; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .conversation-item { background: ${isDark ? '#16213e' : '#fff'}; padding: 16px; margin-bottom: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .question { font-weight: bold; color: ${isDark ? '#4a9eff' : '#0066cc'}; margin-bottom: 8px; }
      .answer { line-height: 1.6; color: ${isDark ? '#ccc' : '#555'}; }
      .meta { font-size: 12px; color: ${isDark ? '#888' : '#999'}; margin-top: 8px; }
      .bookmarks, .history { margin-top: 24px; }
      .tag { display: inline-block; background: ${isDark ? '#4a9eff' : '#0066cc'}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
    </style>`
    : '';

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title>${styles}</head><body>`;

  html += `<h1>Conversation Export</h1>`;

  if (data.summary) {
    html += `<div class="summary"><h2>Summary</h2><p>${escapeHTML(data.summary)}</p></div>`;
  }

  if (data.conversation && data.conversation.length > 0) {
    html += `<div class="conversation"><h2>Conversation</h2>`;
    data.conversation.forEach((item, idx) => {
      html += `<div class="conversation-item"><div class="question">Q${idx + 1}: ${escapeHTML(item.question || '')}</div><div class="answer">${escapeHTML(item.answer || '')}</div></div>`;
    });
    html += `</div>`;
  }

  if (data.bookmarks && data.bookmarks.length > 0) {
    html += `<div class="bookmarks"><h2>Bookmarks</h2>`;
    data.bookmarks.forEach(b => {
      html += `<div class="conversation-item"><div class="question">${escapeHTML(b.label || 'Bookmark')}</div><div class="answer">${escapeHTML(b.summary || '')}</div>${b.tags ? `<div class="meta">${b.tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}</div>`;
    });
    html += `</div>`;
  }

  html += `<div class="meta"><p>Exported on ${new Date().toLocaleString()}</p></div></body></html>`;
  return html;
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shareAsFormattedText(data) {
  let text = '';
  if (data.summary) {
    text += `SUMMARY\n${'='.repeat(40)}\n${data.summary}\n\n`;
  }
  if (data.conversation && data.conversation.length > 0) {
    text += `CONVERSATION\n${'='.repeat(40)}\n\n`;
    data.conversation.forEach((item, idx) => {
      text += `[Q${idx + 1}] ${item.question}\n`;
      text += `=> ${item.answer}\n\n`;
    });
  }
  if (data.bookmarks && data.bookmarks.length > 0) {
    text += `BOOKMARKS\n${'='.repeat(40)}\n`;
    data.bookmarks.forEach(b => {
      text += `* ${b.label}: ${b.summary}\n`;
    });
  }
  return text.trim();
}

function shareAsMarkdown(data) {
  let md = '';
  if (data.summary) {
    md += `## Summary\n\n${data.summary}\n\n`;
  }
  if (data.conversation && data.conversation.length > 0) {
    md += `## Conversation\n\n`;
    data.conversation.forEach((item, idx) => {
      md += `### ${idx + 1}. ${item.question}\n\n${item.answer}\n\n`;
    });
  }
  if (data.bookmarks && data.bookmarks.length > 0) {
    md += `## Bookmarks\n\n`;
    data.bookmarks.forEach(b => {
      md += `- **${b.label}**: ${b.summary}`;
      if (b.tags && b.tags.length > 0) {
        md += ` (${b.tags.join(', ')})`;
      }
      md += `\n`;
    });
    md += `\n`;
  }
  if (data.history && data.history.length > 0) {
    md += `## History\n\n`;
    data.history.forEach(h => {
      md += `- ${h.summary || 'Untitled'}\n`;
    });
  }
  return md.trim();
}

function exportConversationsBulk(conversationIds, format) {
  const results = [];
  const dir = getDataDir();

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs
    .readdirSync(dir)
    .filter(f => f.startsWith('conversation_') && f.endsWith('.json'));

  const filtered =
    conversationIds && conversationIds.length > 0
      ? files.filter(f => conversationIds.includes(f))
      : files;

  filtered.forEach(filename => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf8'));
      const exportData = {
        summary: data.summary,
        conversation: data.conversation,
        bookmarks: [],
        history: [],
      };

      let output;
      switch (format) {
        case 'json':
          output = exportAsJSON(exportData, { pretty: true });
          break;
        case 'html':
          output = exportAsHTML(exportData, { theme: 'dark', includeStyles: true });
          break;
        case 'markdown':
          output = shareAsMarkdown(exportData);
          break;
        case 'text':
        default:
          output = shareAsFormattedText(exportData);
          break;
      }

      results.push({ filename, data: output });
    } catch (e) {
      results.push({ filename, error: e.message });
    }
  });

  return results;
}

// ============ 7. Smart Search ============
function searchConversations(query) {
  const conversations = getSavedConversations();
  const bookmarks = getBookmarks();
  const results = [];

  const searchIn = items => {
    items.forEach(item => {
      const summary = item.data?.summary || item.summary || '';
      const conv = item.data?.conversation || item.conversation || [];
      const qna = conv.map(c => c.question + ' ' + c.answer).join(' ');
      const text = summary + ' ' + qna;

      if (text.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
    });
  };

  searchIn(conversations);
  searchIn(bookmarks);

  return results;
}

// ============ 8. API Provider Management ============
function getAvailableProviders() {
  return {
    ollama: config.ollama.baseUrl ? true : false,
    gemini: config.gemini.apiKey ? true : false,
    mock: config.useMock,
  };
}

// ============ 9. Settings Management ============
let loadedSettings = null;

function loadSettingsOnInit() {
  if (!loadedSettings) {
    loadedSettings = getSettings();
  }
  return loadedSettings;
}

function getSettings() {
  if (loadedSettings) {
    return loadedSettings;
  }
  const dir = getDataDir();
  const settingsFile = path.join(dir, 'settings.json');
  const defaults = getDefaultSettings();
  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return { ...defaults, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
}

function getDefaultSettings() {
  return {
    theme: 'dark',
    language: 'en',
    autoSave: false,
    maxHistory: 100,
    ollamaModel: 'llama3:latest',
    geminiModel: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 1024,
    clipboardDebounce: 1500,
    clipboardMinLength: 40,
    windowOpacity: 1.0,
    alwaysOnTop: true,
    autoStart: false,
  };
}

const SETTINGS_SCHEMA = {
  temperature: { min: 0.0, max: 1.0, type: 'number' },
  maxTokens: { min: 256, max: 4096, type: 'number' },
  clipboardDebounce: { min: 500, max: 5000, type: 'number' },
  clipboardMinLength: { min: 10, max: 500, type: 'number' },
  windowOpacity: { min: 0.3, max: 1.0, type: 'number' },
  alwaysOnTop: { type: 'boolean' },
  autoStart: { type: 'boolean' },
  ollamaModel: { type: 'string' },
  geminiModel: { type: 'string' },
  theme: { type: 'string', values: ['dark', 'light'] },
  language: { type: 'string' },
  autoSave: { type: 'boolean' },
  maxHistory: { type: 'number', min: 10, max: 1000 },
};

function validateSetting(key, value) {
  const schema = SETTINGS_SCHEMA[key];
  if (!schema) return { valid: false, error: `Unknown setting: ${key}` };

  if (schema.type === 'number') {
    if (typeof value !== 'number') return { valid: false, error: `${key} must be a number` };
    if (schema.min !== undefined && value < schema.min) {
      return { valid: false, error: `${key} must be at least ${schema.min}` };
    }
    if (schema.max !== undefined && value > schema.max) {
      return { valid: false, error: `${key} must be at most ${schema.max}` };
    }
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') return { valid: false, error: `${key} must be a boolean` };
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') return { valid: false, error: `${key} must be a string` };
    if (schema.values && !schema.values.includes(value)) {
      return { valid: false, error: `${key} must be one of: ${schema.values.join(', ')}` };
    }
  }
  return { valid: true };
}

function saveSettings(settings) {
  const errors = [];
  for (const [key, value] of Object.entries(settings)) {
    const result = validateSetting(key, value);
    if (!result.valid) {
      errors.push(result.error);
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  const dir = getDataDir();
  const settingsFile = path.join(dir, 'settings.json');
  const current = getSettings();
  const validated = { ...current, ...settings };
  fs.writeFileSync(settingsFile, JSON.stringify(validated, null, 2));
  loadedSettings = validated;
  return true;
}

function getAdvancedSettings() {
  return getSettings();
}

function saveAdvancedSettings(settings) {
  return saveSettings(settings);
}

function getModelOptions() {
  return {
    ollama: [
      'llama3:latest',
      'llama3:8b',
      'llama3:70b',
      'mistral:latest',
      'mistral:7b',
      'phi3:latest',
      'phi3:14b',
      'codellama:latest',
      'codellama:7b',
      'orca-mini:latest',
      'neural-chat:latest',
    ],
    gemini: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ],
  };
}

// ============ 10. History Management ============
function getHistory() {
  return [...getSavedConversations(), ...getBookmarks()];
}

function clearHistory() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) return true;
  fs.readdirSync(dir)
    .filter(f => f.startsWith('conversation_'))
    .forEach(f => fs.unlinkSync(path.join(dir, f)));
  return true;
}

// ============ 11. Mock Data for Testing ============
function getMockData(type) {
  const mockSummaries = [
    {
      summary: `• Zero-click-assistant-sleek is an open-source desktop overlay application.\n• Provides AI-powered summarization using Google Gemini AI or local Ollama.\n• Features include clipboard monitoring and follow-up Q&A.\n• Supports global hotkeys for easy control.\n• Built with Electron for cross-platform support.`,
      followUps: [
        'How do I install this application?',
        'What AI models are supported?',
        'Can I customize the hotkeys?',
      ],
    },
    {
      summary: `• Python is a high-level programming language.\n• Known for its simple syntax and readability.\n• Widely used in web development, data science, and AI.\n• Has extensive library support.\n• Interpreted language with dynamic typing.`,
      followUps: [
        "What are Python's main features?",
        'How does Python compare to JavaScript?',
        'What are some popular Python frameworks?',
      ],
    },
    {
      summary: `• JavaScript is a versatile programming language.\n• Primarily used for web development.\n• Runs in browsers and on servers with Node.js.\n• Supports functional and object-oriented programming.\n• One of the most popular programming languages.`,
      followUps: [
        'What can I build with JavaScript?',
        'How is JavaScript different from Java?',
        'What are JavaScript frameworks?',
      ],
    },
  ];

  const mockAnswers = [
    "Based on the context, here's what I found: The application uses AI to automatically summarize copied text, providing quick insights without user intervention. It monitors the clipboard continuously and processes text when detected.",
    'The zero-click assistant offers several key benefits: 1) Automatic summarization saves time, 2) Follow-up questions enable deeper exploration, 3) Local processing with Ollama keeps data private, 4) Global hotkeys provide seamless control.',
    'This technology represents a significant advancement in productivity tools. By eliminating the need to manually paste and summarize text, users can focus on their core tasks while still gaining valuable insights from their clipboard content.',
  ];

  if (type === 'summary') {
    return mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
  } else if (type === 'answer') {
    return mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
  }
  return mockSummaries[0];
}

// ============ 12. Provider Management ============
let currentProvider = 'ollama'; // default

function setProvider(provider) {
  currentProvider = provider;
  const envFile = path.join(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }

  if (provider === 'mock') {
    envContent = envContent.replace(/USE_MOCK=.*/g, 'USE_MOCK=true');
    if (!envContent.includes('USE_MOCK=')) {
      envContent += '\nUSE_MOCK=true';
    }
  } else {
    envContent = envContent.replace(/USE_MOCK=.*/g, 'USE_MOCK=false');
  }

  fs.writeFileSync(envFile, envContent);
  return currentProvider;
}

function getCurrentProvider() {
  return currentProvider;
}

// Helper
function getDataDir() {
  const userDataPath = app?.getPath?.('userData') || process.cwd();
  const dir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ============ IPC Handlers Registration ============
function registerBookmarkIpcHandlers(ipcMain) {
  ipcMain.handle('bookmarks:createFolder', async (event, name) => {
    return createBookmarkFolder(name);
  });

  ipcMain.handle('bookmarks:getFolders', async () => {
    return getBookmarkFolders();
  });

  ipcMain.handle('bookmarks:moveToFolder', async (event, { bookmarkId, folderId }) => {
    return moveBookmarkToFolder(bookmarkId, folderId);
  });

  ipcMain.handle('bookmarks:deleteFolder', async (event, folderId) => {
    return deleteBookmarkFolder(folderId);
  });

  ipcMain.handle('bookmarks:addNote', async (event, { bookmarkId, note }) => {
    return addBookmarkNote(bookmarkId, note);
  });

  ipcMain.handle('bookmarks:getNote', async (event, bookmarkId) => {
    return getBookmarkNote(bookmarkId);
  });

  ipcMain.handle('bookmarks:search', async (event, { query, options }) => {
    return searchBookmarks(query, options);
  });

  ipcMain.handle('bookmarks:sort', async (event, { bookmarks, sortBy, sortOrder }) => {
    return sortBookmarks(bookmarks, sortBy, sortOrder);
  });
}

module.exports = {
  // 1. Save
  saveConversation,
  getSavedConversations,
  // 1a. Tags
  addTagToConversation,
  removeTagFromConversation,
  getAllTags,
  // 1b. Date Range
  getConversationsByDateRange,
  // 1c. Categories
  setConversationCategory,
  getConversationsByCategory,
  getAllCategories,
  // 1d. Advanced Search
  searchConversationsAdvanced,
  // 1e. Sort
  sortConversations,
  // 2. Translate
  translateText,
  // 3. Quick Actions
  copyToClipboard,
  clearConversation,
  // 4. Analysis
  analyzeText,
  // 5. Bookmarks
  bookmarkConversation,
  getBookmarks,
  deleteBookmark,
  // 5a. Bookmark Folders
  getBookmarkFolders,
  createBookmarkFolder,
  deleteBookmarkFolder,
  moveBookmarkToFolder,
  // 5b. Bookmark Notes
  addBookmarkNote,
  getBookmarkNote,
  // 5c. Bookmark Search & Sort
  searchBookmarks,
  sortBookmarks,
  // 6. Export
  exportAsMarkdown,
  exportAsText,
  exportAsJSON,
  exportAsHTML,
  shareAsFormattedText,
  shareAsMarkdown,
  exportConversationsBulk,
  // 7. Search
  searchConversations,
  // 8. Providers
  getAvailableProviders,
  // 9. Settings
  getSettings,
  saveSettings,
  getAdvancedSettings,
  saveAdvancedSettings,
  getModelOptions,
  getDefaultSettings,
  loadSettingsOnInit,
  // 10. History
  getHistory,
  clearHistory,
  // 11. Mock Data
  getMockData,
  // 12. Provider Management
  setProvider,
  getCurrentProvider,
  // IPC Handlers
  registerBookmarkIpcHandlers,
};
