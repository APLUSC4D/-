@echo off
title Local Media Manager Desktop Client
color 0b

echo ==================================================
echo   Starting Local Media Manager Desktop Application
echo ==================================================
echo.

echo [1/3] Checking Node.js environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed on your system!
    echo Node.js is required to run this application locally.
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo After installation is complete, close this window and double-click this file again.
    echo --------------------------------------------------
    pause
    exit
)

echo node.js is ready:
node -v
echo.

echo [2/3] Installing program dependencies (This might take 10-30 seconds)...
echo Setting high-speed registry mirror...
call npm config set registry https://registry.npmmirror.com >nul 2>&1
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo System trying fallback installation method...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)

echo.
echo [3/3] Launching Independent Desktop Window...
echo Please do not close this black terminal window!
echo It serves as the background engine for your media database.
echo.
echo Launching...

:: Run desktop application
call npm run desktop

echo.
echo Service stopped.
pause
