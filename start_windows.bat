@echo off
:: ==========================================
:: Local Media Manager - 一键启动脚本 (Windows)
:: ==========================================
title 本地素材管理器 启动器
color 0b

echo ==================================================
echo         欢迎使用【本地素材管理器】一键启动器
echo ==================================================
echo.

echo [1/3] 正在检查本地 Node.js 运行环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------
    echo ❌【提示】你的电脑上还没有正确安装 Node.js！
    echo.
    echo 这是一个免费的网格运行引擎，点击这里下载安装：
    echo 🚀 推荐下载链接: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo 安装步骤：
    echo 1. 打开上面链接下载文件。
    echo 2. 双击运行下载的安装包，一路点击 "Next" 直接安装到底。
    echo 3. 安装完成后，关闭当前小黑窗口，重新双击这个 start_windows.bat 即可！
    echo --------------------------------------------------
    echo.
    pause
    exit
)

echo.
echo ✅ 环境检查通过！检测到 Node.js 版本:
node -v
echo.

echo [2/3] 正在安装素材数据库库文件 (第一次启动大约需要10-30秒)...
echo 💡 小贴士：为了让你下载更快，我们将自动切换为国内高速下载通道 (淘宝镜像源)
echo.
call npm config set registry https://registry.npmmirror.com >nul 2>&1
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ [警告] 默认下载可能遇到问题，正在尝试备用安装模式...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)

echo.
echo [3/3] 正在准备启动本地素材管理器服务...
echo 🚀 服务正在拉起中，请不要关闭这个黑色背景的窗口哦！
echo.
echo --------------------------------------------------
echo 🎉 启动成功！正在为你自动启动默认浏览器...
echo 💡 如果浏览器页面显示“无法访问”，请不要慌张，这是因为服务在“热身”！
echo 💡 请在浏览器中大约等待 5-10 秒，然后点击键盘上的 F5 键刷新页面即可。
echo --------------------------------------------------
echo.

:: 启动默认浏览器打开本地素材库
start "" http://localhost:3000

:: 运行开发服务器 (不使用 call，避免退出 cmd)
npm run dev

echo.
echo ⚠️ 服务已停止运行。
pause
