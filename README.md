# Zero-Click Assistant - Sleek

A modern, transparent AI assistant overlay for Windows that monitors your clipboard and provides instant AI-powered summarization and Q&A capabilities using Google Gemini AI.

![Zero-Click Assistant](https://img.shields.io/badge/Zero--Click-Assistant-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite)

## ✨ Features

- **Transparent Overlay** - Floating, always-on-top window with glass-morphism design
- **Smart Clipboard Monitoring** - Automatically detects and summarizes copied text
- **AI Summarization** - Instant summaries using Google Gemini AI
- **Interactive Q&A** - Ask follow-up questions about any content
- **Global Hotkeys** - Full keyboard control from any application
- **Tray Icon** - Run in background with system tray support
- **Command Palette** - Quick access to all features with Ctrl+K
- **Snap Positions** - Quick window positioning with number keys
- **Conversation Management** - Save, tag, categorize, and search conversations
- **Bookmark Folders** - Organize bookmarks into folders with notes
- **Multiple Export Formats** - Export as JSON, HTML, Markdown, or plain text
- **Customizable Settings** - Theme, AI models, clipboard monitoring, and more
- **Minimal Footprint** - Lightweight and resource-efficient

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **Google API Key** - Get free key at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

```bash
# Clone and navigate
cd zero-click-assistant-overlay

# Install dependencies
npm install
cd renderer && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Or use the provided batch files:
- `run.bat` - Start the application
- `run-dev.bat` - Run in development mode

## ⌨️ Keyboard Shortcuts

### Main Controls
| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+O` | Toggle overlay visibility |
| `Ctrl+Alt+R` | Reset overlay to center |
| `Ctrl+Alt+X` | Quit application |
| `Ctrl+K` | Open command palette |

### Window Positioning
| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+1` | Snap to top-left |
| `Ctrl+Alt+2` | Snap to top-center |
| `Ctrl+Alt+3` | Snap to top-right |
| `Ctrl+Alt+4` | Snap to bottom-left |
| `Ctrl+Alt+5` | Snap to bottom-center |
| `Ctrl+Alt+6` | Snap to bottom-right |
| `Ctrl+Alt+7` | Snap to center |
| `Ctrl+Alt+0` | Reset snap position |

### Movement
| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+↑` | Move up |
| `Ctrl+Alt+↓` | Move down |
| `Ctrl+Alt+←` | Move left |
| `Ctrl+Alt+→` | Move right |

## 🗂️ Conversation Management

- **Save Conversations** - Automatically saves summaries with timestamps
- **Tags & Labels** - Add custom tags to organize conversations
- **Categories** - Organize by: general, work, personal, research, code, notes
- **Date Filtering** - Filter conversations by date range
- **Advanced Search** - Search across summaries, Q&A, tags, and categories
- **Sort Options** - Sort by date, name, or label

## 📁 Bookmark Features

- **Bookmark Folders** - Create custom folders (General, Work, Personal, Important)
- **Notes** - Add notes to bookmarks for reference
- **Search & Sort** - Find bookmarks quickly with advanced search
- **Move Between Folders** - Easily reorganize bookmarks

## 📤 Export Options

- **JSON** - Structured data export
- **HTML** - Styled HTML page with dark/light theme
- **Markdown** - Clean Markdown format
- **Text** - Plain text export
- **Bulk Export** - Export multiple conversations at once

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_google_api_key_here
OLLAMA_URL=http://localhost:11434
USE_OLLAMA=false
```

### Settings (in-app)

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | dark | dark/light mode |
| AI Model | gemini-2.0-flash | Select Gemini or Ollama model |
| Temperature | 0.7 | AI creativity (0.0-1.0) |
| Max Tokens | 1024 | Response length limit |
| Clipboard Debounce | 1500ms | Delay before processing |
| Window Opacity | 1.0 | Overlay transparency |
| Always on Top | true | Keep overlay above other windows |

## 📁 Project Structure

```
zero-click-assistant-overlay/
├── main/                    # Electron main process
│   ├── main.js             # Window management, IPC, hotkeys, tray
│   ├── preload.js          # Secure bridge between processes
│   └── sensors/            # System sensors (clipboard, active window)
├── renderer/               # React frontend (Vite)
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── vite.config.js     # Vite configuration
├── shared/                # Shared utilities
│   ├── summarizer.js      # AI summarization
│   ├── config.js          # Configuration
│   ├── features.js        # Conversation, bookmarks, export, settings
│   └── logger.js          # Logging utility
├── tests/                 # Unit tests
├── data/                  # User data (conversations, settings, bookmarks)
└── package.json           # Root package.json
```

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **Vite** - Build tool
- **Google Gemini AI** - AI summarization (also supports Ollama)

## 📝 License

MIT License - Feel free to use and modify!

---

Made with ❤️ using Electron + React
