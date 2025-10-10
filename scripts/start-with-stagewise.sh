#!/bin/bash
# 启动开发服务器 + stagewise
# 用法: ./scripts/start-with-stagewise.sh

set -e

PROJECT_DIR="/home/dministrator/Newproject/realtime-english-teacher-source"

echo "🚀 启动 AI English Coach 开发环境 + stagewise"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_DIR"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 检测到依赖未安装，正在安装..."
    npm install
fi

echo ""
echo "📝 开发服务器和 stagewise 将在两个终端窗口中启动"
echo ""
echo "✅ 终端 1: Next.js 开发服务器 (http://localhost:3000)"
echo "✅ 终端 2: stagewise 可视化工具"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动开发服务器（后台）
echo "🔧 启动 Next.js 开发服务器..."
npm run dev &
DEV_SERVER_PID=$!

# 等待开发服务器启动
echo "⏳ 等待开发服务器就绪..."
sleep 5

# 启动 stagewise
echo ""
echo "🎨 启动 stagewise..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx stagewise@latest

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在关闭开发服务器..."
    kill $DEV_SERVER_PID 2>/dev/null || true
    echo "✅ 已关闭"
}

# 捕获退出信号
trap cleanup EXIT INT TERM

# 等待用户中断
wait
