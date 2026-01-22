#!/bin/bash

# 短剧自动下载服务启动脚本

echo "======================================"
echo "短剧自动下载服务"
echo "======================================"
echo ""

# 检查主项目是否在运行
echo "检查主项目服务..."
if curl -s https://www.cxyy.top > /dev/null; then
    echo "✓ 主项目服务正在运行 (https://www.cxyy.top)"
else
    echo "✗ 主项目服务无法访问"
    echo ""
    echo "请确保主项目服务可以访问："
    echo "  https://www.cxyy.top"
    echo ""
    exit 1
fi

echo ""
echo "启动自动下载服务..."
echo ""

# 启动服务
node src/index.js
