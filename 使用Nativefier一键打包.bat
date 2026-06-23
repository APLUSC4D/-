@echo off
:: UTF-8 编码支持，防止 Windows 终端显示中文乱码
chcp 65001 >nul
title Nativefier 一键打包桌面应用
color 0e

echo =======================================================
echo          欢迎使用 Nativefier 智能桌面端打包工具
echo =======================================================
echo.
echo 💡 什么是 Nativefier？
echo    Nativefier 是一个神奇的程序。它可以直接把我们的网页程序打包
echo    成一个独立的电脑软件（.exe 窗口），没有多余的网页地址栏！
echo    
echo 💡 使用此工具的好处：
echo    1. 电脑上完全不需要自己写代码，不需要繁琐的本地数据库配置。
echo    2. 双击后直接就是像 Eagle 一样纯净的独立软件大窗口！
echo.
echo -------------------------------------------------------
echo.

:: 1. 检查 Node.js / npm
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 打包需要本地有 Node.js 运行引擎（检测到您目前还没有安装成功）。
    echo 请先去浏览器打开并安装此引擎：
    echo 🚀 极速下载链接: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo 安装完成后，请重新双击运行这个打包程序！
    echo -------------------------------------------------------
    pause
    exit
)

echo [1/3] 检测到 Node.js 运行环境已就绪。
echo [2/3] 正在通过高速通道准备打包工具，请稍等...
echo.

:: 调用 npx 临时启动 nativefier 进行一键打包 (将我们的线上地址一键包进 exe 里)
call npx --registry=https://registry.npmmirror.com nativefier --name "本地素材管理器" --platform "windows" "https://ais-pre-zozuiu74hia6c22iq7abjh-177012258616.us-east5.run.app"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 打包未完全成功，可能网络有波动，我们正在尝试备用打包模式...
    call npx nativefier --name "本地素材管理器" --platform "windows" "https://ais-pre-zozuiu74hia6c22iq7abjh-177012258616.us-east5.run.app"
)

echo.
echo =======================================================
echo 🎉 [3/3] 打包流程结束！ ⭐⭐⭐⭐⭐
echo =======================================================
echo 📍 您的当前文件夹下会多出一个叫【本地素材管理器-win32-x64】的文件夹！
echo.
echo 💡 怎么使用：
echo 1. 打开刚刚新生成的这个文件夹。
echo 2. 在里面找到并双击 👉 【本地素材管理器.exe】
echo 3. 一个没有任何浏览器边框、独立完好的桌面应用窗口就已经成功运行啦！
echo 4. 您可以将这个文件夹发送给任何人，双击即可直接使用！
echo =======================================================
echo.
pause
