@echo off
title Electron Desktop Compiler (Chinese Windows Compatibility Mode)
color 0b

echo ==================================================
echo         Windows Desktop App Builder (Electron)
echo ==================================================
echo.

:: 1. Check Node.js
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed on your system!
    echo Please install Node.js from this link:
    echo Link: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo After installing, reopen this script!
    echo.
    pause
    exit
)

echo Node.js is ready.
echo.

:: 2. Install dependencies
echo [2/4] Downloading compiler dependencies (Using High-speed Mirror)...
call npm config set registry https://registry.npmmirror.com >nul 2>&1
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo Trying fallback installer...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)
echo Dependencies ready.
echo.

:: 3. Build Desktop Application
echo [3/4] Building and packaging standalone desktop APP...
echo This will take 30-60 seconds. Please wait and do not close this window!
echo.
call npm run dist:win

if %errorlevel% neq 0 (
    echo.
    echo ERROR during build process. Please confirm if there are files locked by other apps.
    pause
    exit
)

echo.
echo Build success!
echo.

:: 4. Extract built app
echo [4/4] Copying standalone app executable to main directory...
if exist "dist-desktop\*.exe" (
    for %%f in ("dist-desktop\*.exe") do (
        copy "%%f" "LocalMediaManager_Standalone.exe" >nul 2>&1
    )
    echo.
    echo ==================================================
    echo 🎉🎉 CONGRATULATIONS! Desktop app is compiled!
    echo ==================================================
    echo Under your current folder, we created a file named:
    echo      ----^>  LocalMediaManager_Standalone.exe  ^<----
    echo.
    echo Hints:
    echo 1. You can delete all other files and folder or the zip.
    echo 2. Just drag "LocalMediaManager_Standalone.exe" to your Desktop.
    echo 3. Double-click it to start your independent offline app window (like Eagle)!
    echo ==================================================
) else (
    echo ERROR: Cannot find the output binary. Check \"dist-desktop\" folder.
)

echo.
pause

