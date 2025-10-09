#!/bin/bash

# API 测试脚本 - 用于验证 OpenAI API 连接是否正常

echo "================================"
echo "  OpenAI API 连接测试"
echo "================================"
echo ""

# 检查服务器是否运行
echo "1. 检查本地服务器状态..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ 错误: 本地服务器未运行"
    echo "   请先运行: npm run dev"
    exit 1
fi
echo "✓ 本地服务器正在运行"
echo ""

# 测试 Session API
echo "2. 测试 Session API (/api/session)..."
echo "   请求: POST http://localhost:3000/api/session"
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/session)

# 提取 HTTP 状态码
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "   状态码: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ 成功! Session API 正常工作"
    echo ""
    echo "   响应内容:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    echo "================================"
    echo "  测试通过! 🎉"
    echo "================================"
    echo ""
    echo "下一步:"
    echo "  1. 打开浏览器访问 http://localhost:3000"
    echo "  2. 点击麦克风按钮建立连接"
    echo "  3. 使用 'Type' 按钮发送文本消息进行测试"
    exit 0
else
    echo "❌ 失败! HTTP 状态码: $http_code"
    echo ""
    echo "   错误响应:"
    echo "$body"
    echo ""
    echo "================================"
    echo "  故障排查"
    echo "================================"
    echo ""
    echo "可能的原因:"
    echo "  1. OPENAI_API_KEY 未设置或无效"
    echo "     检查 .env.local 文件"
    echo ""
    echo "  2. 代理配置问题"
    echo "     当前代理: \$HTTPS_PROXY = $HTTPS_PROXY"
    echo "     确认代理服务器正在运行"
    echo ""
    echo "  3. OpenAI API 访问受限"
    echo "     检查控制台日志查看详细错误"
    echo ""
    echo "查看详细日志:"
    echo "  在运行 npm run dev 的终端窗口查看输出"
    exit 1
fi
