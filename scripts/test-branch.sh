#!/bin/bash

# 分支测试脚本
# 用法: ./scripts/test-branch.sh <branch-name>

set -e

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
    echo "❌ 错误：请提供分支名称"
    echo "用法: ./scripts/test-branch.sh <branch-name>"
    echo ""
    echo "可用分支："
    git branch -r | grep -v HEAD
    exit 1
fi

echo "=========================================="
echo "  测试分支: $BRANCH_NAME"
echo "=========================================="
echo ""

# 1. 保存当前工作
echo "📋 步骤 1: 保存当前工作..."
CURRENT_BRANCH=$(git branch --show-current)
echo "   当前分支: $CURRENT_BRANCH"

if ! git diff-index --quiet HEAD --; then
    echo "   发现未提交的更改，正在暂存..."
    git stash save "测试 $BRANCH_NAME 前的自动暂存 - $(date)"
    STASHED=true
else
    echo "   工作区干净，无需暂存"
    STASHED=false
fi

# 2. 切换分支
echo ""
echo "📋 步骤 2: 切换到测试分支..."
git fetch
git checkout "$BRANCH_NAME"
git pull

# 3. 安装依赖
echo ""
echo "📋 步骤 3: 检查依赖..."
if git diff "$CURRENT_BRANCH" --name-only | grep -q "package.json"; then
    echo "   package.json 有变化，重新安装依赖..."
    npm install
else
    echo "   package.json 无变化，跳过安装"
fi

# 4. 启动开发服务器
echo ""
echo "=========================================="
echo "  ✅ 准备完成！"
echo "=========================================="
echo ""
echo "🚀 即将启动开发服务器..."
echo "   访问: http://localhost:3000"
echo ""
echo "⚠️  测试完成后："
echo "   1. 按 Ctrl+C 停止服务器"
echo "   2. 运行以下命令切回原分支："
echo "      git checkout $CURRENT_BRANCH"
if [ "$STASHED" = true ]; then
    echo "      git stash pop  # 恢复暂存的工作"
fi
echo ""
read -p "按 Enter 开始，或 Ctrl+C 取消..."

# 启动服务器
npm run dev

# 用户按 Ctrl+C 后执行
echo ""
echo "=========================================="
echo "  测试结束"
echo "=========================================="
echo ""
echo "💡 记得切回原分支："
echo "   git checkout $CURRENT_BRANCH"
if [ "$STASHED" = true ]; then
    echo "   git stash pop"
fi
