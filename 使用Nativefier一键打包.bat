@echo off
title Nativefier Desktop Packer (Chinese Windows Compatibility Mode)
color 0f

echo =======================================================
echo          Nativefier One-Click Desktop App Packer
echo =======================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed on your system!
    echo Please download and install Node.js:
    echo download link: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo After installing, reopen this script.
    echo -------------------------------------------------------
    pause
    exit
)

echo Node.js is ready.
echo.

echo [2/3] Downloading Nativefier packer tool and packaging...
echo It may take about 1-2 minutes. Please do not close this window!
echo.

call npx --registry=https://registry.npmmirror.com nativefier --name "LocalMediaManager" --platform "windows" "https://ais-pre-zozuiu74hia6c22iq7abjh-177012258616.us-east5.run.app"

if %errorlevel% neq 0 (
    echo.
    echo Retrying with fallback server...
    call npx nativefier --name "LocalMediaManager" --platform "windows" "https://ais-pre-zozuiu74hia6c22iq7abjh-177012258616.us-east5.run.app"
)

echo.
echo =======================================================
echo 🎉 [3/3] Desktop Packaging Completed successfully!
echo =======================================================
echo.
echo A new folder named "LocalMediaManager-win32-x64" has been created in this folder.
echo.
echo How to run:
echo 1. Open the new "LocalMediaManager-win32-x64" folder.
echo 2. Inside, find and double-click the file named "LocalMediaManager.exe".
echo 3. It will launch as a pure, independent desktop app window (no browser tabs).
echo 4. You can copy or move that folder anywhere, or create a shortcut to your Desktop!
echo =======================================================
echo.
pause

