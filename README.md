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

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+O` | Toggle overlay visibility |
| `Ctrl+Alt+R` | Reset overlay to center |
| `Arrow Keys` | Move overlay position |
| `Ctrl+Alt+X` | Quit application |

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_google_api_key_here
OLLAMA_URL=http://localhost:11434
USE_OLLAMA=false
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Required | Your Google Gemini API key |
| `OLLAMA_URL` | localhost:11434 | Ollama server URL (optional) |
| `USE_OLLAMA` | false | Use Ollama instead of Gemini |

## 📁 Project Structure

```
zero-click-assistant-overlay/
├── main/                    # Electron main process
│   ├── main.js             # Window management & IPC
│   ├── preload.js          # Secure bridge between processes
│   └── sensors/            # System sensors
├── renderer/               # React frontend (Vite)
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── vite.config.js     # Vite configuration
├── shared/                # Shared utilities
│   ├── summarizer.js      # AI summarization
│   ├── config.js          # Configuration
│   ├── features.js        # Feature flags
│   └── logger.js          # Logging utility
├── tests/                 # Unit tests
├── data/                  # User data (conversations, settings)
└── package.json           # Root package.json
```

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **Vite** - Build tool
- **Google Gemini AI** - AI summarization

## 📝 License

MIT License - Feel free to use and modify!

---

Made with ❤️ using Electron + React
