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

详见：[代码修改详解](#代码修改详解)

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
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140

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
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140
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

项目核心文档:

- **README.md** - 项目概览、快速开始、文档导航
- **DEVELOPMENT-WORKFLOW.md** - 开发工作流指南（必读）
- **CLAUDE.md** (本文档) - 架构和运维详解
- **LESSONS-LEARNED.md** - 经验教训总结（强烈推荐）

历史文档归档: `docs/archive/` (仅供参考)

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

---

## 代码修改详解

### 问题分析

**原始问题**: 项目采用浏览器直连 OpenAI API 的架构

```
浏览器 → api.openai.com (被墙 ❌)
```

**浏览器控制台错误**:
```
POST https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17
net::ERR_CONNECTION_CLOSED
```

在中国大陆，`api.openai.com` 无法直接访问，导致功能完全不可用。

### 解决方案

**添加服务器端代理**，让所有 OpenAI API 请求通过服务器转发：

```
浏览器 → 你的服务器 (新加坡) → api.openai.com ✅
```

### 修改详情

#### 1. 创建服务器端代理 API

**文件**: `app/api/realtime/route.ts` (新建)

```typescript
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const model = searchParams.get('model');
        const voice = searchParams.get('voice');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }

        // 获取请求体（SDP offer）
        const sdpOffer = await request.text();

        // 从请求头获取 Authorization token
        const authHeader = request.headers.get('Authorization');

        console.log('Proxying WebRTC request to OpenAI:', { model, voice });

        // 转发到 OpenAI
        const response = await fetch(
            `https://api.openai.com/v1/realtime?model=${model}&voice=${voice}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader || `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/sdp',
                },
                body: sdpOffer,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API request failed: ${response.status}`);
        }

        // 返回 SDP answer
        const sdpAnswer = await response.text();

        return new Response(sdpAnswer, {
            status: 200,
            headers: {
                'Content-Type': 'application/sdp',
            },
        });
    } catch (error) {
        console.error('Realtime proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to proxy realtime request' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
```

**说明**:
- 这是一个 Next.js API Route
- 接收浏览器的 WebRTC SDP offer
- 转发到 OpenAI API
- 返回 SDP answer 给浏览器
- 服务器端持有 OpenAI API Key，浏览器端不暴露

#### 2. 修改前端连接逻辑

**文件**: `hooks/use-webrtc.ts`

**修改前** (第 440 行):
```typescript
const baseUrl = "https://api.openai.com/v1/realtime";
```

**修改后**:
```typescript
const baseUrl = "/api/realtime";
```

**说明**:
- 浏览器不再直连 `api.openai.com`
- 改为访问相对路径 `/api/realtime`
- Next.js 自动将其路由到我们的服务器端代理 API

### 关键优势

1. **无需用户代理**: 中国大陆用户可以直接访问
2. **API Key 安全**: OpenAI API Key 存储在服务器端，不暴露给浏览器
3. **功能完整**: 所有 WebRTC 实时语音功能正常工作
4. **性能优良**: 服务器在新加坡，延迟可接受
5. **维护简单**: 只修改了 2 个文件，改动最小化

### 文件清单

**修改的文件**:
- `hooks/use-webrtc.ts` (1 行修改)

**新增的文件**:
- `app/api/realtime/route.ts` (新建)

**备份文件**:
- `hooks/use-webrtc.ts.backup`

---

## 附录：DNS 配置指南

### 在 Cloudflare 添加 DNS 记录

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

### 验证 DNS 解析

配置后等待 1-2 分钟，然后运行：

```bash
# 查询 DNS 记录
dig +short realtime.junyaolexiconcom.com

# 应该返回: 8.219.239.140
```

或者使用在线工具: https://dnschecker.org/

### 完成后

DNS 解析正确后，运行 HTTPS 配置脚本：

```bash
cd deployment
chmod +x setup-https.sh
./setup-https.sh
```

### 故障排除

#### DNS 未解析
- 等待 DNS 传播（最多 5 分钟）
- 检查 Cloudflare 中记录是否正确
- 确认代理状态为 "仅 DNS"（灰色云朵）

#### SSL 证书获取失败
- 确认 DNS 已正确解析
- 确认端口 80 和 443 已开放（阿里云安全组）
- 检查 Nginx 配置: `nginx -t`

#### 服务无法访问
- 检查 PM2 状态: `pm2 status`
- 检查 Nginx 日志: `tail -f /var/log/nginx/error.log`
- 检查防火墙: `ufw status`
