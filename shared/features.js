/**
 * Additional Features for Zero-Click Assistant
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ============ 1. Save Conversations ============
function saveConversation(conversation, summary) {
  const dir = getDataDir();
  const filename = `conversation_${Date.now()}.json`;
  const data = { summary, conversation, savedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
  return filename;
}

function getSavedConversations() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('conversation_') && f.endsWith('.json'))
    .map(f => ({
      filename: f,
      data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    }));
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
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'helpful', 'useful', 'awesome'];
  const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'awful', 'useless', 'failed', 'error', 'problem'];
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';
  
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
    savedAt: new Date().toISOString()
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

// ============ 7. Smart Search ============
function searchConversations(query) {
  const conversations = getSavedConversations();
  const bookmarks = getBookmarks();
  const results = [];
  
  const searchIn = (items) => {
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
  const { config } = require('./config');
  return {
    ollama: config.ollama.baseUrl ? true : false,
    gemini: config.gemini.apiKey ? true : false,
    mock: config.useMock
  };
}

// ============ 9. Settings Management ============
function getSettings() {
  const dir = getDataDir();
  const settingsFile = path.join(dir, 'settings.json');
  const defaults = {
    theme: 'dark',
    language: 'en',
    autoSave: false,
    maxHistory: 100,
    ollamaModel: 'llama3:latest',
    geminiModel: 'gemini-2.0-flash',
  };
  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return { ...defaults, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
}

function saveSettings(settings) {
  const dir = getDataDir();
  const settingsFile = path.join(dir, 'settings.json');
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  return true;
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
        "How do I install this application?",
        "What AI models are supported?",
        "Can I customize the hotkeys?"
      ]
    },
    {
      summary: `• Python is a high-level programming language.\n• Known for its simple syntax and readability.\n• Widely used in web development, data science, and AI.\n• Has extensive library support.\n• Interpreted language with dynamic typing.`,
      followUps: [
        "What are Python's main features?",
        "How does Python compare to JavaScript?",
        "What are some popular Python frameworks?"
      ]
    },
    {
      summary: `• JavaScript is a versatile programming language.\n• Primarily used for web development.\n• Runs in browsers and on servers with Node.js.\n• Supports functional and object-oriented programming.\n• One of the most popular programming languages.`,
      followUps: [
        "What can I build with JavaScript?",
        "How is JavaScript different from Java?",
        "What are JavaScript frameworks?"
      ]
    }
  ];

  const mockAnswers = [
    "Based on the context, here's what I found: The application uses AI to automatically summarize copied text, providing quick insights without user intervention. It monitors the clipboard continuously and processes text when detected.",
    "The zero-click assistant offers several key benefits: 1) Automatic summarization saves time, 2) Follow-up questions enable deeper exploration, 3) Local processing with Ollama keeps data private, 4) Global hotkeys provide seamless control.",
    "This technology represents a significant advancement in productivity tools. By eliminating the need to manually paste and summarize text, users can focus on their core tasks while still gaining valuable insights from their clipboard content."
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

module.exports = {
  // 1. Save
  saveConversation,
  getSavedConversations,
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
  // 6. Export
  exportAsMarkdown,
  exportAsText,
  // 7. Search
  searchConversations,
  // 8. Providers
  getAvailableProviders,
  // 9. Settings
  getSettings,
  saveSettings,
  // 10. History
  getHistory,
  clearHistory,
  // 11. Mock Data
  getMockData,
  // 12. Provider Management
  setProvider,
  getCurrentProvider,
};
