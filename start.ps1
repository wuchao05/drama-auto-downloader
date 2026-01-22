# PowerShell 启动脚本
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "短剧自动下载服务 - Windows" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] 检查依赖..." -ForegroundColor Yellow

# 检查 pnpm
try {
    $null = pnpm --version
    Write-Host "✓ pnpm 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 pnpm" -ForegroundColor Red
    Write-Host "请先安装 pnpm: npm install -g pnpm" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""
Write-Host "[2/2] 启动服务..." -ForegroundColor Yellow
Write-Host ""

# 启动服务
try {
    pnpm start
} catch {
    Write-Host ""
    Write-Host "服务异常退出" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}
