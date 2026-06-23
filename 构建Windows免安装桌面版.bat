@echo off
:: UTF-8 编码支持，防止 Windows 终端显示中文乱码
chcp 65001 >nul
:: ==================================================
:: 本地素材管理器 - 桌面端软件打包工具 (Windows)
:: ==================================================
title 桌面端软件（双击即用）打包生成器
color 0f

echo ==================================================
echo         正在为您生成专属的 Windows 桌面版软件 🚀
echo ==================================================
echo.
echo 💡 为什么需要打包？
echo    打包后，我们将把代码、网页引擎和运行环境融为一体，
echo    生成一个绿色的「.exe」文件。
echo    之后，您就不需要再开这个黑色程序，也不需要装任何引擎，
echo    双击那个新生成的 .exe 就能一秒在电脑上完美运行了！
echo --------------------------------------------------
echo.

:: 1. 检查 Node.js
echo [1/4] 正在检查打包环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌【错误】您的电脑尚未安装 Node.js（打包所需引擎）。
    echo 请先用浏览器打开下面链接，安装一下此引擎（安装只需30秒）：
    echo 👉 官方快速下载: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    echo 💡 安装方法：
    echo 1. 双击下载的文件，一直点 "Next" 直到安装结束。
    echo 2. 安装完成后，关闭这个黑色窗口，重新双击这个文件即可！
    echo.
    pause
    exit
)

echo ✅ 环境正确！开始第二步...
echo.

:: 2. 加快源设置并下载库
echo [2/4] 正在拉取打包库文件（正在切换淘宝国内高速通道，需10-30秒）...
call npm config set registry https://registry.npmmirror.com >nul 2>&1
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 正在使用备用下载通道...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)
echo ✅ 库依赖拉取完毕！
echo.

:: 3. 打包
echo [3/4] 正在为您编译打包为单体免安装 .exe 程序...
echo 💡 此步骤可能需要 30 到 60 秒，请耐心等待本窗口，切勿关闭哦！
echo.
call npm run dist:win

if %errorlevel% neq 0 (
    echo.
    echo ❌ [失败] 打包过程中发生了错误。可能是软件被其他窗口占用。
    echo 请确认没有其他程序打开着，然后重试。
    pause
    exit
)

echo.
echo ✅ [成功] 打包核心已完成！
echo.

:: 4. 输出并整理
echo [4/4] 正在为您提炼纯净版桌面端可运行程序...
if exist "dist-desktop\*.exe" (
    :: 拷贝 exe 文件到当前根目录并重命名，方便用户一眼看到
    for %%f in ("dist-desktop\*.exe") do (
        copy "%%f" "本地素材管理器_双击即用版.exe" >nul 2>&1
    )
    echo.
    echo ==================================================
    echo 🎉🎉 恭喜！！！桌面端软件编译完成！ ⭐⭐⭐⭐⭐
    echo ==================================================
    echo 📍 我们已在您当前的文件夹下生成了：
    echo    👉 【本地素材管理器_双击即用版.exe】 👈
    echo.
    echo 💡 使用提示：
    echo 1. 您现在可以把其他所有多余的文件删掉，甚至把这个压缩包删掉。
    echo 2. 只需要把这个单独的「本地素材管理器_双击即用版.exe」拖入您的电脑桌面。
    echo 3. 每次想要使用时，像打开微信QQ电脑软件一样，直接双击它即可！
    echo.
    echo 🌟 本地离线完美运行，没有任何繁琐窗口啦！
    echo ==================================================
) else (
    echo [警告] 未能帮您自动剪切到根目录，请进入 dist-desktop 文件夹下查看生成的安装程序。
)

echo.
pause
