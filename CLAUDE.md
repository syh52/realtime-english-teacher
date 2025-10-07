# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 OpenAI Realtime API 的部署和代理项目,用于验证实时语音对话在中国大陆的技术可行性。项目已成功部署到阿里云新加坡,通过服务器端代理解决了中国大陆访问 OpenAI API 的网络限制问题。

**访问地址**: https://realtime.junyaolexiconcom.com
**服务器**: 阿里云新加坡 (8.219.239.140)
**状态**: ✅ 运行中

## 核心架构

### 关键设计决策

**问题**: 原始项目 `cameronking4/openai-realtime-api-nextjs` 采用浏览器直连 OpenAI API,在中国大陆被墙无法使用。

**解决方案**: 添加服务器端代理层
```
浏览器 → 新加坡服务器 → api.openai.com
```

### 代码修改

项目只修改了 2 个文件即实现了完整功能:

1. **新增**: `app/api/realtime/route.ts` (服务器端代理)
   - 接收浏览器 WebRTC SDP offer
   - 转发到 OpenAI Realtime API
   - 返回 SDP answer 给浏览器
   - 服务器端持有 `OPENAI_API_KEY`,不暴露给浏览器

2. **修改**: `hooks/use-webrtc.ts` (第 440 行)
   ```typescript
   // 修改前: const baseUrl = "https://api.openai.com/v1/realtime";
   // 修改后: const baseUrl = "/api/realtime";
   ```

## 部署命令

### 自动化部署

```bash
# 一键部署到阿里云新加坡
cd deployment
./one-click-deploy.sh

# 单独配置 HTTPS (已部署后执行)
./setup-https.sh
```

### 服务器端操作

```bash
# SSH 登录
ssh -i ~/.ssh/openai-proxy-key.pem ubuntu@8.219.239.140

# 查看服务状态
pm2 status
pm2 logs realtime-english

# 重启服务
pm2 restart realtime-english

# 重新构建部署
cd ~/openai-realtime-api-nextjs
npm run build
pm2 restart realtime-english
```

### 管理 ECS 实例

```bash
# 查看实例状态
aliyun ecs DescribeInstances --RegionId ap-southeast-1

# 停止实例 (保留数据,停止计费)
aliyun ecs StopInstance --InstanceId i-t4nfgpam8ylkz9jpu6l8

# 启动实例
aliyun ecs StartInstance --InstanceId i-t4nfgpam8ylkz9jpu6l8

# 删除实例 (永久删除)
aliyun ecs DeleteInstance --InstanceId i-t4nfgpam8ylkz9jpu6l8 --Force true
```

## 环境变量

项目依赖以下环境变量 (存储在 `/home/dministrator/Newproject/.env.local`):

```bash
OPENAI_API_KEY=sk-...                    # OpenAI API 密钥
ALIYUN_ACCESS_KEY_ID=...                 # 阿里云访问密钥
ALIYUN_ACCESS_KEY_SECRET=...             # 阿里云访问密钥
```

服务器端 `.env.local` 文件:
```bash
OPENAI_API_KEY=sk-...                    # 必须配置
```

## 技术栈

- **前端**: Next.js 15.1.1, React 19, WebRTC
- **后端**: Next.js API Routes (服务器端代理)
- **部署**: 阿里云 ECS (ap-southeast-1, ecs.t6-c1m2.large)
- **Web 服务器**: Nginx 1.18.0
- **进程管理**: PM2
- **SSL**: Let's Encrypt (自动续期,到期日 2026-01-05)
- **DNS**: Cloudflare

## WebRTC 必需条件

1. **HTTPS**: 浏览器 `getUserMedia` 只在 HTTPS 或 localhost 可用
2. **域名**: 需要域名才能申请 SSL 证书
3. **防火墙**: 确保端口 80, 443, 3000 开放
4. **CORS**: Next.js API Routes 自动处理

## 关键文件说明

```
realtime-english-teacher/
├── README.md                    # 项目说明和部署指南
├── QUICK-START.md              # 5分钟快速部署指南
├── PROJECT-SUMMARY.md          # 项目总结和成果
├── POST-MORTEM.md              # 复盘报告,包含经验教训
├── CODE-MODIFICATIONS.md       # 代码修改详细说明
├── DNS-SETUP.md                # DNS 和域名配置
├── DEPLOYMENT-SUCCESS.md       # 部署成功记录
├── CHINA-ACCESS-SOLUTIONS.md   # 中国访问方案分析
├── deployment/
│   ├── one-click-deploy.sh       # 一键部署脚本 (推荐)
│   ├── setup-https.sh            # HTTPS 配置脚本
│   ├── setup-aliyun-cli.sh       # 阿里云 CLI 配置
│   ├── deploy-to-aliyun.sh       # 基础部署脚本
│   └── deployment-config.json    # 部署信息 (服务器 IP、域名等)
└── product-brief-*.md           # 产品简报
```

## 常见问题排查

### 浏览器连接失败

```bash
# 1. 检查浏览器控制台错误
# 查看是否有 CORS、SSL 或 WebRTC 错误

# 2. 检查服务器日志
ssh -i ~/.ssh/openai-proxy-key.pem ubuntu@8.219.239.140
pm2 logs realtime-english

# 3. 验证 API Key
cat ~/openai-realtime-api-nextjs/.env.local
```

### SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试 Nginx 配置
sudo nginx -t
sudo systemctl reload nginx
```

### 性能优化

```bash
# 查看 PM2 监控
pm2 monit

# 查看系统资源
top
df -h
free -m
```

## 成本信息

- **ECS 实例**: ¥150/月 (ecs.t6-c1m2.large, 按量付费)
- **SSL 证书**: ¥0 (Let's Encrypt 免费)
- **域名**: ¥0 (已有)
- **总计**: ¥150/月

## 项目特点

1. **最小化修改**: 只修改 2 个文件即可实现完整功能
2. **安全**: API Key 存储在服务器端,不暴露给浏览器
3. **中国友好**: 通过服务器代理解决网络限制,无需用户使用代理
4. **自动化**: 一键部署脚本完成所有配置
5. **文档完善**: 详细的部署、修改和复盘文档

## 参考文档

项目包含完整的技术文档:

- **部署相关**: README.md, QUICK-START.md, DEPLOYMENT-SUCCESS.md
- **技术方案**: CODE-MODIFICATIONS.md, CHINA-ACCESS-SOLUTIONS.md
- **经验总结**: POST-MORTEM.md (强烈推荐阅读,包含可推广的方法论)
- **配置指南**: DNS-SETUP.md

## 注意事项

1. **代理设置**: 根据全局 CLAUDE.md,Docker 命令需清除代理环境变量
2. **SSH 认证**: 使用 SSH key 而非密码 (`~/.ssh/openai-proxy-key.pem`)
3. **环境文件**: 确保 `.env.local` 配置正确的 `OPENAI_API_KEY`
4. **证书续期**: Let's Encrypt 证书 90 天有效期,Certbot 已配置自动续期
5. **防火墙**: 阿里云安全组需开放端口 80, 443, 3000

## 开发原则 (从复盘中提取)

1. **规模匹配**: 个人验证项目使用最简方案,不要过度设计
2. **架构优先**: 部署前必须分析架构,特别是外部 API 调用
3. **根因分析**: 看浏览器控制台错误,至少问 3 个"为什么"
4. **最小改动**: 能改 1 行就不改 10 行
5. **快速验证**: 先做 MVP,验证成功再优化
6. **成本敏感**: 优先选"够用"的方案,不是"最好"的方案
