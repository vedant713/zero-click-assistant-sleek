@echo off
cd /d "%~dp0"

echo Building renderer...
call npm run build:renderer
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Starting Zero-Click Assistant...
call npm start
