#!/bin/bash

# 自动更新阿里云服务器上的代码
# 用途: 本地修改后,一键同步到云端并重启服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 读取部署配置
CONFIG_FILE="$(dirname "$0")/deployment-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}错误: 找不到部署配置文件 $CONFIG_FILE${NC}"
    echo "请先运行 one-click-deploy.sh 完成初始部署"
    exit 1
fi

# 从配置文件读取信息
SERVER_IP=$(jq -r '.publicIp' "$CONFIG_FILE")
SSH_KEY="$HOME/.ssh/openai-proxy-key.pem"
REMOTE_USER="root"
REMOTE_DIR="/root/openai-realtime-api-nextjs"
LOCAL_PROJECT_DIR="/home/dministrator/Newproject/realtime-english-teacher-source"

echo -e "${GREEN}=== 开始更新云端代码 ===${NC}"
echo "服务器: $SERVER_IP"
echo "目标目录: $REMOTE_DIR"
echo ""

# 1. 检查 SSH 密钥
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}错误: 找不到 SSH 密钥 $SSH_KEY${NC}"
    exit 1
fi

# 2. 检查本地是否有未提交的修改
echo -e "${YELLOW}步骤 1/5: 检查本地代码状态${NC}"
cd "$LOCAL_PROJECT_DIR"

if git rev-parse --git-dir > /dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}警告: 有未提交的修改${NC}"
        git status --short
        echo ""
        read -p "是否继续部署? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 0
        fi
    fi

    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "当前提交: $CURRENT_COMMIT"
else
    echo -e "${YELLOW}提示: 项目未使用 Git,建议先执行 git init${NC}"
    CURRENT_COMMIT="no-git"
fi

# 3. 同步代码到服务器(排除不必要的文件)
echo ""
echo -e "${YELLOW}步骤 2/5: 同步代码到服务器${NC}"

# 创建临时排除列表
EXCLUDE_FILE=$(mktemp)
cat > "$EXCLUDE_FILE" << 'EOF'
.git/
node_modules/
.next/
deployment/
product-brief-*.md
*.md
.env.local
*.pem
*.key
deployment-config.json
EOF

# 只同步关键文件
rsync -avz --progress \
    --exclude-from="$EXCLUDE_FILE" \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_PROJECT_DIR/" \
    "$REMOTE_USER@$SERVER_IP:$REMOTE_DIR/"

rm "$EXCLUDE_FILE"

# 4. 在服务器上执行更新操作
echo ""
echo -e "${YELLOW}步骤 3/5: 在服务器上重新构建${NC}"

ssh -i "$SSH_KEY" "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
cd ~/openai-realtime-api-nextjs

# 安装可能的新依赖
echo "检查依赖..."
npm install

# 重新构建
echo "构建项目..."
npm run build

# 检查 PM2 是否运行
if pm2 list | grep -q "realtime-english"; then
    echo "PM2 进程已存在,准备重启..."
else
    echo "PM2 进程不存在,将首次启动..."
fi
ENDSSH

# 5. 重启服务
echo ""
echo -e "${YELLOW}步骤 4/5: 重启服务${NC}"

ssh -i "$SSH_KEY" "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
cd ~/openai-realtime-api-nextjs

# 重启或启动 PM2
if pm2 list | grep -q "realtime-english"; then
    pm2 restart realtime-english
    pm2 save
else
    pm2 start npm --name "realtime-english" -- start
    pm2 save
    pm2 startup
fi

# 等待服务启动
sleep 3

# 显示状态
pm2 list
pm2 logs realtime-english --lines 10 --nostream
ENDSSH

# 6. 验证部署
echo ""
echo -e "${YELLOW}步骤 5/5: 验证部署${NC}"
echo "等待服务稳定..."
sleep 2

# 测试 HTTPS 访问
DOMAIN=$(jq -r '.domain' "$CONFIG_FILE")
if [ "$DOMAIN" != "null" ]; then
    echo "测试访问: https://$DOMAIN"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✅ HTTPS 访问正常 (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS 访问异常 (HTTP $HTTP_CODE)${NC}"
    fi
fi

# 记录部署信息
DEPLOY_LOG="$LOCAL_PROJECT_DIR/deployment/deploy-history.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署成功 - Commit: $CURRENT_COMMIT" >> "$DEPLOY_LOG"

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo "访问地址: https://$DOMAIN"
echo "查看日志: ssh -i $SSH_KEY $REMOTE_USER@$SERVER_IP 'pm2 logs realtime-english'"
echo ""
echo "部署历史已记录到: $DEPLOY_LOG"
