# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目概述

这是一个基于 **OpenAI Realtime API** 的实时英语口语对话练习应用 (AI English Coach)。

- **在线地址**: https://realtime.junyaolexiconcom.com
- **服务器**: 阿里云新加坡 ECS (8.219.239.140)
- **基础项目**: [cameronking4/openai-realtime-api-nextjs](https://github.com/cameronking4/openai-realtime-api-nextjs)

---

## 技术栈

- **前端**: Next.js 15.1.1 (App Router), React 19, TypeScript 5
- **UI 框架**: Tailwind CSS + 52+ Radix UI 组件
- **实时通信**: WebRTC + OpenAI Realtime API
- **后端**: Next.js API Routes (服务器端代理)
- **部署**: 阿里云 ECS + Nginx + PM2

---

## 核心架构设计

### 1. 服务器端代理架构

**关键创新**: 通过服务器端代理解决中国大陆访问 OpenAI API 的限制

```
浏览器 → Next.js API Routes (新加坡服务器) → api.openai.com
```

**关键代码修改** (仅 2 个文件):
1. 新增: `app/api/realtime/route.ts` - 服务器端 WebRTC 代理
2. 修改: `hooks/use-webrtc.ts:452` - API 端点从 `api.openai.com` 改为 `/api/realtime`

**代理实现要点**:
- 使用 `undici` 库的 `ProxyAgent` 支持 HTTP/HTTPS 代理
- API Key 存储在服务器端 `.env.local` (不暴露给客户端)
- 转发完整的 WebRTC SDP (Session Description Protocol)

### 2. WebRTC 音频会话管理

**核心 Hook**: `hooks/use-webrtc.ts` (20KB, 约 600 行)

主要功能:
- RTCPeerConnection 生命周期管理
- 音频流录制和播放
- 实时文本转录 (临时 + 最终)
- AI 工具函数调用
- 音量可视化

**关键状态**:
```typescript
type ConnectionState = 'idle' | 'connecting' | 'ready' | 'connected';
```

### 3. 会话管理系统

**核心 Hook**: `hooks/use-session-manager.ts` (8.8KB)

**三层防护机制** - 防止对话泄漏:
1. **WebRTC 层**: `stopSession()` 时清空历史消息
2. **同步层**: 检查归档状态，不同步归档对话的消息
3. **应用层**: `startNewSession()` 创建新会话时清空旧数据

**会话生命周期**:
```
创建 → 活跃 → 用户停止 → 归档(只读) → 可查看历史
```

**数据模型** (`lib/conversations.ts`):
```typescript
interface Session {
  id: string;              // UUID
  title: string;           // 自动生成标题
  createdAt: string;       // ISO 8601
  updatedAt: string;
  endedAt?: string;        // 归档时设置
  messages: Conversation[];
  voice: string;
  isActive: boolean;
  isArchived: boolean;     // true = 只读
}

interface Conversation {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  isFinal: boolean;
}
```

**持久化**: localStorage 存储所有会话

### 4. AI 教练指导系统

**配置文件**: `config/coach-instructions.ts` (8.1KB)

包含详细的 AI 行为指导:
- 教练角色定义
- 教学风格和互动方式
- 中英文混合教学策略
- 对话示例和最佳实践

---

## 常用命令

### 本地开发
```bash
npm run dev          # 启动开发服务器 (Turbopack)
npm run build        # 构建生产版本
npm start            # 启动生产服务器 (localhost:3000)
npm run lint         # ESLint 代码检查
```

### 部署到生产环境
```bash
# 一键自动部署 (推荐)
cd deployment
./update-server.sh

# 脚本自动执行:
# 1. rsync 同步代码到服务器
# 2. npm install 安装依赖
# 3. npm run build 构建
# 4. pm2 restart 重启服务
```

### 服务器管理
```bash
# SSH 登录
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140

# 进入项目目录
cd ~/openai-realtime-api-nextjs

# PM2 管理
pm2 status                          # 查看服务状态
pm2 logs realtime-english           # 查看日志 (实时)
pm2 logs realtime-english --lines 100  # 查看最近 100 行
pm2 restart realtime-english        # 重启服务
pm2 stop realtime-english           # 停止服务
pm2 start realtime-english          # 启动服务

# Nginx 管理
sudo systemctl status nginx         # 查看 Nginx 状态
sudo systemctl restart nginx        # 重启 Nginx
sudo nginx -t                       # 测试配置文件

# SSL 证书管理
sudo certbot certificates           # 查看证书状态
sudo certbot renew --dry-run        # 测试续期 (不实际续期)
```

---

## 文件结构和关键路径

### 核心业务逻辑
- `app/page.tsx` - 主应用入口 (集成所有功能)
- `hooks/use-webrtc.ts` - WebRTC 音频会话管理
- `hooks/use-session-manager.ts` - 会话生命周期管理
- `app/api/realtime/route.ts` - OpenAI Realtime 服务器代理

### 数据和配置
- `lib/conversations.ts` - Session/Conversation 数据模型
- `lib/tools.ts` - AI 可调用的工具函数定义
- `config/coach-instructions.ts` - AI 教练核心提示词
- `config/site.ts` - 网站配置

### UI 组件
- `components/ui/` - 52+ Radix UI 基础组件
- `components/chat-layout.tsx` - 主聊天布局
- `components/conversation-sidebar.tsx` - 历史对话侧边栏
- `components/voice-control-panel.tsx` - 语音控制面板
- `components/message-controls.tsx` - 消息操作工具

### 部署和文档
- `deployment/update-server.sh` - 自动部署脚本
- `deployment/deployment-config.json` - 服务器配置
- `DEVELOPMENT-WORKFLOW.md` - 完整的开发工作流指南
- `LESSONS-LEARNED.md` - 9 个已知错误和经验教训

---

## 开发工作流

### 标准流程
```bash
# 1. 本地修改代码
code hooks/use-webrtc.ts

# 2. 本地测试 (可选)
npm run dev
# 访问 http://localhost:3000

# 3. 提交到 Git
git add .
git commit -m "描述修改内容"

# 4. 自动部署
cd deployment
./update-server.sh

# 5. 验证
# 访问 https://realtime.junyaolexiconcom.com
# 检查功能是否正常
```

### 紧急修复流程
```bash
# 1. SSH 登录服务器
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140

# 2. 编辑文件
cd ~/openai-realtime-api-nextjs
nano <文件路径>

# 3. 重新构建和重启
npm run build
pm2 restart realtime-english

# 4. 查看日志确认
pm2 logs realtime-english

# ⚠️ 重要: 修改后立即同步回本地并提交 Git
```

---

## 环境变量配置

### 本地开发 (`.env.local`)
```bash
OPENAI_API_KEY=sk-...           # OpenAI API 密钥
```

### 服务器生产环境
```bash
# 位置: /root/openai-realtime-api-nextjs/.env.local
OPENAI_API_KEY=sk-...           # OpenAI API 密钥

# 可选代理配置 (如需要)
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

**注意**:
- 环境变量文件不在 Git 中 (`.gitignore` 已排除)
- 修改后需要手动同步到服务器
- 修改后必须重启服务: `pm2 restart realtime-english`

---

## 调试和故障排查

### 查看日志
```bash
# 应用日志
pm2 logs realtime-english

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```

### 常见问题

**1. WebRTC 连接失败**
- 检查: `pm2 logs realtime-english` 是否有 OpenAI API 错误
- 检查: `.env.local` 中的 `OPENAI_API_KEY` 是否正确
- 检查: 网络是否能访问 `api.openai.com` (在服务器上测试)

**2. 部署后服务未启动**
```bash
# 查看构建错误
cd ~/openai-realtime-api-nextjs
npm run build

# 手动启动查看错误
npm start

# 检查端口占用
sudo netstat -tulpn | grep 3000
```

**3. 历史对话消息泄漏**
- 检查: `use-session-manager.ts` 的三层防护是否正常
- 检查: localStorage 中的 `isArchived` 状态
- 清空浏览器 localStorage 重新测试

**4. SSL 证书过期**
```bash
# 查看证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 代码规范和最佳实践

### TypeScript
- 严格类型检查 (`strict: true`)
- 所有组件使用 TypeScript
- 使用路径别名: `@/` 指向项目根目录

### React
- 优先使用函数组件和 Hooks
- 使用 `useCallback` 和 `useMemo` 优化性能
- 状态管理: React Hooks + localStorage 持久化

### 样式
- Tailwind CSS utility-first
- 使用 CSS 变量实现主题切换 (深色/浅色模式)
- 响应式设计: mobile-first

### Git 提交规范
```bash
# 格式: <类型>: <简短描述>
# 类型: feat, fix, style, refactor, perf, docs, chore

git commit -m "feat: Add voice speed control"
git commit -m "fix: Resolve WebRTC connection timeout"
git commit -m "style: Update button colors"
```

---

## 性能优化建议

### 前端优化
- Next.js 自动代码分割和懒加载
- WebRTC 音频流使用 Web Workers (未实现,可优化)
- localStorage 数据超过 5MB 时提示用户清理

### 后端优化
- 使用 PM2 cluster 模式 (多进程)
- Nginx 启用 Gzip 压缩
- 启用 Nginx 缓存静态资源

### 网络优化
- 启用 Cloudflare CDN 代理 (可选)
- 使用 HTTP/2 (Nginx 已配置)

---

## 安全注意事项

1. **API Key 管理**
   - ✅ API Key 存储在服务器端 `.env.local`
   - ✅ 不暴露给客户端
   - ✅ 不提交到 Git

2. **SSH 密钥**
   - 私钥路径: `~/.ssh/openai-proxy-key.pem`
   - 权限: `chmod 400`

3. **HTTPS**
   - Let's Encrypt SSL 证书
   - 自动续期 (到期日: 2026-01-05)
   - 强制 HTTPS 重定向

---

## 项目路径映射

| 环境 | 路径 |
|------|------|
| 本地开发 | `/home/dministrator/Newproject/realtime-english-teacher-source` |
| 服务器生产 | `/root/openai-realtime-api-nextjs` |
| SSH 密钥 | `~/.ssh/openai-proxy-key.pem` |
| 部署配置 | `deployment/deployment-config.json` |

---

## 参考文档

### 项目文档 (必读)
1. `README.md` - 项目概览和快速开始
2. `DEVELOPMENT-WORKFLOW.md` - 详细的开发工作流 (新手必读)
3. `LESSONS-LEARNED.md` - 9 个已知错误和避坑指南

### 技术文档
- [Next.js 15 文档](https://nextjs.org/docs)
- [OpenAI Realtime API](https://platform.openai.com/docs/api-reference/realtime)
- [WebRTC 标准](https://webrtc.org/)
- [Radix UI](https://www.radix-ui.com/)

---

## 重要提醒

### ⚠️ 代码来源优先级
1. ✅ **生产服务器代码** (`root@8.219.239.140:~/openai-realtime-api-nextjs`)
2. ❌ **开源仓库** (`github.com/cameronking4/openai-realtime-api-nextjs`)

> 开发时始终基于生产服务器的代码,因为包含已部署的定制化修改

### ⚠️ Git 用户配置
首次使用 Git 前必须配置:
```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### ⚠️ 会话隔离
- 归档对话是只读的,不能继续对话
- 新对话会创建新会话,不会包含历史消息
- 确保三层防护机制正常工作

---

**最后更新**: 2025-10-20
