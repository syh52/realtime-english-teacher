#!/bin/bash

# 合并所有功能到 main 分支的一键脚本

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  合并分支到 main 的自动化脚本"
echo "=========================================="
echo ""

# 1. 检查当前状态
echo "📊 检查当前分支状态..."
git status

echo ""
read -p "⚠️  确认工作区干净后按 Enter 继续，或 Ctrl+C 取消..."
echo ""

# 2. 切换到最新分支
echo "🔄 切换到最新分支..."
git checkout claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u
git pull

# 3. 创建 main 分支
echo ""
echo "✨ 创建 main 分支..."
if git show-ref --verify --quiet refs/heads/main; then
    echo "⚠️  main 分支已存在，将使用现有分支"
    git checkout main
    git merge claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u
else
    git checkout -b main
    echo "✅ main 分支创建成功"
fi

# 4. 推送到远程
echo ""
echo "🚀 推送 main 分支到远程..."
git push -u origin main

echo ""
echo "✅ main 分支推送成功！"
echo ""

# 5. 询问是否删除旧分支
echo "=========================================="
echo "  是否删除旧分支？"
echo "=========================================="
echo ""
echo "旧分支列表："
echo "  1. claude/data-analysis-011CUKK3ECBJx5zr8qHzq2F7"
echo "  2. claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u"
echo ""
read -p "删除本地旧分支? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  删除本地旧分支..."
    git branch -d claude/data-analysis-011CUKK3ECBJx5zr8qHzq2F7 || echo "⚠️  分支已删除或不存在"
    git branch -d claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u || echo "⚠️  分支已删除或不存在"
    echo "✅ 本地旧分支已删除"
fi

echo ""
read -p "删除远程旧分支? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  删除远程旧分支..."
    git push origin --delete claude/data-analysis-011CUKK3ECBJx5zr8qHzq2F7 || echo "⚠️  远程分支已删除或不存在"
    git push origin --delete claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u || echo "⚠️  远程分支已删除或不存在"
    echo "✅ 远程旧分支已删除"
fi

# 6. 显示最终状态
echo ""
echo "=========================================="
echo "  ✅ 完成！当前分支状态："
echo "=========================================="
echo ""
git branch -a
echo ""
echo "📝 接下来的步骤："
echo "1. 在 GitHub 上设置 main 为默认分支"
echo "   访问: https://github.com/syh52/realtime-english-teacher/settings/branches"
echo "2. 部署到生产环境: cd deployment && ./update-server.sh"
echo ""
echo "🎉 所有操作完成！"
