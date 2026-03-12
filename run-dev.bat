@echo off
cd /d "%~dp0"

echo Starting development mode...
echo.
echo Note: Run run.bat to build and run the production version.
echo.
echo Starting Vite dev server in background...
start "Vite Dev Server" cmd /k "cd /d "%~dp0renderer" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Electron...
call npx electron .
