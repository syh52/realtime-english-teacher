#!/bin/bash

# HTTPS 配置脚本 - 为 OpenAI Realtime API 项目配置 SSL 证书
# 使用域名: realtime.junyaolexiconcom.com
# 服务器: 阿里云新加坡 8.219.239.140

set -e

DOMAIN="realtime.junyaolexiconcom.com"
EMAIL="your-email@example.com"  # 请替换为你的邮箱
SERVER_IP="8.219.239.140"
SSH_KEY="/home/dministrator/.ssh/openai-proxy-key.pem"

echo "===== 配置 HTTPS (Let's Encrypt + Nginx) ====="
echo "域名: $DOMAIN"
echo "服务器: $SERVER_IP"
echo ""

# 检查 DNS 解析
echo "检查 DNS 解析..."
RESOLVED_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -1)
if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo "⚠️  警告: DNS 未正确解析"
    echo "   当前解析: $RESOLVED_IP"
    echo "   期望 IP: $SERVER_IP"
    echo ""
    echo "请先在 Cloudflare 添加 A 记录:"
    echo "   类型: A"
    echo "   名称: realtime"
    echo "   内容: $SERVER_IP"
    echo "   代理状态: 仅 DNS (关闭橙色云朵)"
    echo "   TTL: Auto"
    echo ""
    read -p "完成 DNS 配置后按回车继续..."
fi

echo ""
echo "===== 在服务器上安装和配置 Nginx + SSL ====="

ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP << 'ENDSSH'
set -e

DOMAIN="realtime.junyaolexiconcom.com"
EMAIL="admin@junyaolexiconcom.com"

echo "1. 更新系统并安装 Nginx..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo ""
echo "2. 配置 Nginx 反向代理..."
cat > /etc/nginx/sites-available/realtime << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name realtime.junyaolexiconcom.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/realtime /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "3. 获取 Let's Encrypt SSL 证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo ""
echo "4. 配置自动续期..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "✅ HTTPS 配置完成！"
echo "访问地址: https://$DOMAIN"

ENDSSH

echo ""
echo "===== 配置完成 ====="
echo "HTTPS 地址: https://$DOMAIN"
echo ""
echo "测试访问:"
echo "  curl -I https://$DOMAIN"
echo ""
