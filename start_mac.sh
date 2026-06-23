#!/bin/bash
# ==========================================
# Local Media Manager - 一键启动脚本 (Mac)
# ==========================================

# 获取脚本所在根目录
cd "$(dirname "$0")"

clear
echo "--------------------------------------------------"
echo "[1/3] 正在检查本地环境..."

if ! command -v node &> /dev/null
then
    echo "[错误] 你的电脑上还没有安装 Node.js！"
    echo "请先去官网下载安装: https://nodejs.org/"
    echo "安装完成后，重新运行此程序即可。"
    exit 1
fi

echo "[2/3] 正在安装库文件 (第一次运行大约需要1-2分钟)..."
npm install --no-audit --no-fund

echo "[3/3] 正在为您打开本地素材库..."
open "http://localhost:3000"

# 启动服务器
npm run dev
