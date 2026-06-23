@echo off
:: ==========================================
:: Local Media Manager - 一键启动脚本 (Windows)
:: ==========================================
title 本地素材管理器 启动器

echo --------------------------------------------------
echo [1/3] 正在检查本地环境...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 你的电脑上还没有安装 Node.js！
    echo 请先去官网下载安装: https://nodejs.org/
    echo 安装完成后，重新双击运行这个文件即可。
    pause
    exit
)

echo [2/3] 正在安装守护程序 (第一次运行比较慢，请耐心等待哦)...
call npm install --no-audit --no-fund

echo [3/3] 正在启动本地素材库 (启动成功后会自动打开网页哦)...
:: 启动后端服务
start "" http://localhost:3000
call npm run dev

pause
