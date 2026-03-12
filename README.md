# Zero-Click AI Assistant Overlay

A transparent, always-on-top desktop overlay application that monitors your clipboard and provides AI-powered summarization and Q&A capabilities using Google Gemini AI. Optionally supports Ollama for local AI processing.

## Features

- **Transparent Overlay Window** - Floating, always-on-top window that stays visible above other applications
- **Clipboard Monitoring** - Automatically detects and summarizes copied text content
- **Active Window Tracking** - Monitors which application is currently in focus
- **AI Summarization** - Uses Google Gemini AI to summarize copied content with intelligent follow-up questions
- **Q&A Mode** - Ask questions about the current content and receive AI-powered answers
- **Global Hotkeys** - Full keyboard control without leaving your current application

## Prerequisites

- **Node.js** 18.0 or higher
- **Google API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
- (Optional) **Ollama** - For local AI processing ([ollama.ai](https://ollama.ai))

## Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd zero-click-assistant-overlay
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install renderer dependencies:
   ```bash
   cd renderer
   npm install
   cd ..
   ```

4. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Or create it manually with the following content:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```

5. (Optional) If using Ollama for local AI, ensure Ollama is running:
   ```bash
   ollama serve
   ```

## Usage

### Starting the Application

Run the application with Electron:
```bash
npm start
```

Or use the provided batch file:
```bash
run.bat
```

For development mode with hot-reload:
```bash
npm run dev
```

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+O` | Toggle overlay visibility |
| `Ctrl+Alt+R` | Reset overlay position to center |
| `Arrow Keys` | Move overlay window |
| `Ctrl+Alt+X` | Quit application |

### Using the Overlay

1. **Copy any text** - The application automatically detects copied content and displays an AI summary
2. **Ask follow-up questions** - Type questions in the input field to get more details about the summarized content
3. **Q&A Mode** - Switch to Q&A mode to ask general questions or analyze the current clipboard content

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Your Google Gemini API key |
| `OLLAMA_URL` | No | Ollama server URL (default: `http://localhost:11434`) |
| `USE_OLLAMA` | No | Set to `true` to use Ollama instead of Google Gemini |

Example `.env` file:
```
GOOGLE_API_KEY=your_google_api_key_here
OLLAMA_URL=http://localhost:11434
USE_OLLAMA=false
```

## Folder Structure

```
zero-click-assistant-overlay/
├── main/                    # Electron main process
│   ├── main.js             # Main entry point, window management, IPC
│   ├── preload.js          # Preload script for secure IPC
│   └── sensors/            # System sensors (clipboard, active window)
├── renderer/               # React frontend
│   ├── src/               # React components and logic
│   ├── public/            # Static assets
│   ├── index.html         # HTML entry point
│   └── vite.config.js     # Vite configuration
├── shared/                # Shared code between main and renderer
│   └── summarizer.js      # AI summarization logic
├── package.json           # Root dependencies and scripts
└── README.md              # This file
```

## License

MIT License
