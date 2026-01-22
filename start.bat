@echo off
chcp 65001 >nul
echo ====================================
echo 短剧自动下载服务 - Windows
echo ====================================
echo.

echo [1/2] 检查依赖...
call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 pnpm
    echo 请先安装 pnpm: npm install -g pnpm
    pause
    exit /b 1
)

echo [2/2] 启动服务...
echo.
call pnpm start

if errorlevel 1 (
    echo.
    echo 服务异常退出
    pause
    exit /b 1
)
