# Zero‑Click Research Assistant (Electron + React)

A lightweight, always‑on overlay that helps you summarize, ask questions, and talk to an assistant without copy/paste. It adds a Contextual Scraper to “read your screen” on demand, and a continuous Voice Mode that listens, answers, and keeps listening.


## Features

- Zero‑click overlay
  - Toggle overlay visibility anywhere with a global hotkey.
  - Auto‑resizes to content; draggable and unobtrusive.
- Modes
  - Summarize: paste or copy content; get a concise multi‑bullet summary and smart follow‑ups.
  - Ask: ask questions and receive Markdown answers.
  - Voice: local or cloud speech‑to‑text; continuous listening with threaded follow‑ups.
  - Context: “Read My Screen” to capture the visible screen and produce an OCR‑aware summary + follow‑ups.
- Contextual Scraper
  - Works without copy/paste; captures a single frame of your screen (no persistent storage).
  - Enriches with active window title for context.
  - Uses Gemini to detect content type (article, code, chat, etc.), extract text, summarize, and propose follow‑ups.
- Follow‑ups everywhere
  - Click suggestions to spin off Q&A threads; results appear stacked beneath.
- Privacy‑first
  - No background storage of screenshots or audio; capture is ephemeral and in‑memory.


## Quick Start

Prerequisites
- Node.js 18+ and npm
- Windows/macOS/Linux
- For AI features: a Google API key for Gemini

Install
```
npm install
```

Run (development)
- Recommended two‑terminal workflow:
  1) Terminal A (renderer): `npm run dev` (Vite dev server)
  2) Terminal B (main): `npm start` (Electron)
- The app auto‑detects the Vite server (ports 5173–5175). If not found, it loads the production build.

Build (renderer)
```
npm run build
npm start
```


## .env Configuration

Create a `.env` at project root:

```
# Gemini API key (required for Summarize / Ask / Context, and for cloud STT when enabled)
GOOGLE_API_KEY="your_key_here"

# Optional: run with no cloud uploads
OFFLINE_MODE=0

# Voice Mode: Gemini cloud STT size + retry limits
STT_MAX_AUDIO_MB=6
STT_GEMINI_RETRIES=3
STT_GEMINI_RETRY_DELAY_MS=400

# Optional: whisper.cpp integration (Windows paths shown as examples)
# WHISPER_CPP_BIN=C:/tools/whisper.cpp/main.exe
# WHISPER_CPP_MODEL=C:/tools/whisper.cpp/models/ggml-base.en.bin
# WHISPER_CPP_LANG=en
# WHISPER_CPP_THREADS=4
# WHISPER_CPP_TIMEOUT_MS=180000
# WHISPER_CPP_ARGS=--no-timestamps
```

Notes
- If `OFFLINE_MODE=1`, Ask/Summarize/Context won’t call Gemini.
- Voice Mode supports:
  - Local browser STT (Web Speech API) when available.
  - whisper.cpp (optional) if configured.
  - Cloud STT (Gemini) when Cloud STT is enabled in the UI.


## Global Shortcuts

- Toggle overlay: `Ctrl + Shift + Space`
- Move overlay: `Ctrl/Cmd + ↑/↓/←/→`
- Read My Screen: `Ctrl + Shift + X`
- Quit app: `Ctrl + Shift + Q`


## Modes & UX

### Summarize
- Paste/copy text; the overlay summarizes and suggests follow‑ups.
- Click any follow‑up to spawn a Q&A thread; results stack below.

### Ask
- Type a question and get a Markdown answer.

### Voice (continuous)
- Start/Stop mic to transcribe your speech, generate an answer, and automatically listen again.
- Local, whisper.cpp, or cloud STT (configurable in the UI).
- Auto‑speak can read out answers; listening resumes after TTS ends.
- Each exchange is appended to a conversation history under the controls.

### Context (Read My Screen)
- Click “Context”, then “Read My Screen” (a user gesture is required).
- The assistant captures a single frame and:
  - Detects content type, extracts key text, summarizes, and suggests follow‑ups.
- Click “Re‑scrape” to refresh.

Capture order (for reliability & privacy):
1) Browser capture (`getDisplayMedia`) on user click.
2) Electron `desktopCapturer` stream (no picker) when available.
3) Windows PowerShell fallback (no native deps) when needed.
4) Optional native `robotjs` fallback (if installed for your Electron runtime).

Nothing is saved; frames are processed in memory only.


## Windows Permissions (Screen + Mic)

- Screen capture: Settings → Privacy & security → Screen capture → enable “Let desktop apps capture your screen”.
- Microphone: grant permission on first use.
- If the display picker appears, select your screen once; a single frame is captured and the stream closes immediately.


## Troubleshooting

- “Screen capture not available”
  - Click the “Read My Screen” button (user gesture required).
  - Enable Windows screen capture for desktop apps (see above).
  - If the browser path is blocked, the app automatically tries Electron capture, then PowerShell fallback.
  - If you prefer native, build `robotjs` for your Electron version and restart.

- NotSupportedError (capture)
  - Caused by calling capture without a user gesture or missing permissions.
  - Use the Context button + “Read My Screen” and accept the picker if shown.

- desktopCapturer unavailable
  - Preload gracefully falls back to browser + PowerShell capture; ensure you restarted after updates.

- Voice Mode upload error: `OnSizeReceived failed -2`
  - Happens when cloud STT tried to upload while Cloud STT is off.
  - The app now blocks Gemini STT uploads when Cloud STT is disabled; use local/whisper instead or enable Cloud STT.

- Garbled text (�, ðŸ, â€¦)
  - Caused by prior encoding artifacts. The app now uses plain ASCII labels to avoid corruption.
  - Save files as UTF‑8 (no BOM) to prevent re‑introducing artifacts.


## Privacy

- Context frames and microphone audio are handled in memory.
- Nothing is persisted to disk unless you enable/extend it.
- When a cloud feature is used, the corresponding content is sent to the provider (Gemini) strictly for that request.


## Folder Structure

```
main/           # Electron main process (overlay window, IPC, capture fallbacks)
  preload.js    # Safe bridge: summarize, QA, screen capture helpers
  sensors/      # Clipboard watcher, active window title
renderer/       # React overlay (Vite)
  src/
    App.jsx     # Overlay shell, Summarize/Ask/Context UI
    VoiceMode.jsx # Voice controls, continuous listening, history UI
    assets/
shared/
  summarizer.js # Gemini prompts: summarize, QA, context multimodal
assets/         # Optional binaries/models (e.g., whisper.cpp)
```


## Developer Notes

- Main loads renderer from Vite in development (auto‑detect ports 5173–5175); otherwise loads `renderer/dist`.
- The overlay window is transparent, draggable, always‑on‑top, and auto‑resizes via IPC (`overlay:set-size`).
- Context pipeline reuses the same prompt/response codepath as Summarize/Ask for consistency.
- Voice Mode
  - Local STT (Web Speech) → route text to QA/Summarize/cloud NLP as configured.
  - Cloud STT is guarded by the “Cloud STT” checkbox; when off, audio uploads are blocked.
  - Optional whisper.cpp offloads STT locally via main process.


## Roadmap Ideas

- Region selection (snipping‑tool style) for Context mode.
- Active‑window capture shortcut (no picker) across platforms.
- Auto refresh context every N seconds for dashboards.
- Context memory: recall last screen per app.
- Gemini Vision fusion for charts/visual UIs.


## License

This project is provided as‑is without warranties. See repository license (if any) for details.

