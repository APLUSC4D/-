@echo off
title Local Media Manager Background Server Launcher
color 0b

echo ==================================================
echo         Local Media Manager Server Launcher
echo ==================================================
echo.

echo [1/3] Checking Node.js environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------
    echo ERROR: Node.js is not installed on your system!
    echo.
    echo Please download and install Node.js:
    echo 👉 Download Link: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo After installing, reopen this script!
    echo --------------------------------------------------
    echo.
    pause
    exit
)

echo Node.js is ready.
node -v
echo.

echo [2/3] Installing/verifying local media assets libraries...
call npm config set registry https://registry.npmmirror.com >nul 2>&1
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo Retrying with fallback server...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)

echo.
echo [3/3] Starting Local Media Manager engine...
echo.
echo Please do not close this black terminal window!
echo It serves as the local database server for your files.
echo --------------------------------------------------
echo Launching default web browser to: http://localhost:3000
echo --------------------------------------------------
echo.

:: Launch default browser
start "" http://localhost:3000

:: Start the server process (do not use "call" so command shell stays active)
npm run dev

echo.
echo Service stopped.
pause

