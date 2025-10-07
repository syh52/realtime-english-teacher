# DNS 配置指南

## 在 Cloudflare 添加 DNS 记录

1. **登录 Cloudflare**: https://dash.cloudflare.com/
2. **选择域名**: `junyaolexiconcom.com`
3. **进入 DNS 设置**: 点击左侧菜单 "DNS" → "Records"
4. **添加 A 记录**:

```
类型:     A
名称:     realtime
内容:     8.219.239.140
代理状态: 仅 DNS (灰色云朵，关闭代理)
TTL:      Auto
```

⚠️ **重要**: 必须选择 "仅 DNS"（灰色云朵），不要使用 Cloudflare 代理（橙色云朵），否则 Let's Encrypt 证书验证会失败。

5. **点击 "保存"**

## 验证 DNS 解析

配置后等待 1-2 分钟，然后运行：

```bash
# 查询 DNS 记录
dig +short realtime.junyaolexiconcom.com

# 应该返回: 8.219.239.140
```

或者使用在线工具: https://dnschecker.org/

## 完成后

DNS 解析正确后，运行 HTTPS 配置脚本：

```bash
cd /home/dministrator/Newproject/realtime-english-teacher/deployment
chmod +x setup-https.sh
./setup-https.sh
```

## 最终访问地址

- **HTTPS**: https://realtime.junyaolexiconcom.com
- **WebSocket**: wss://realtime.junyaolexiconcom.com

## 故障排除

### DNS 未解析
- 等待 DNS 传播（最多 5 分钟）
- 检查 Cloudflare 中记录是否正确
- 确认代理状态为 "仅 DNS"（灰色云朵）

### SSL 证书获取失败
- 确认 DNS 已正确解析
- 确认端口 80 和 443 已开放（阿里云安全组）
- 检查 Nginx 配置: `nginx -t`

### 服务无法访问
- 检查 PM2 状态: `pm2 status`
- 检查 Nginx 日志: `tail -f /var/log/nginx/error.log`
- 检查防火墙: `ufw status`
