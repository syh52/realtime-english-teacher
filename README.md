# AI English Coach

基于 OpenAI Realtime API 的实时英语口语对话练习项目

**🌐 访问地址**: https://realtime.junyaolexiconcom.com
**📍 服务器**: 阿里云新加坡 (8.219.239.140)
**✅ 状态**: 运行中

---

## 📖 项目概述

AI English Coach 是一个实时英语口语练习应用，通过 AI 实时语音对话帮助用户提升英语流利度。

### 核心特性

- ✅ **实时语音对话**: 基于 OpenAI Realtime API 和 WebRTC
- ✅ **服务器端代理**: 解决中国大陆访问限制
- ✅ **多语言支持**: 英语、中文界面切换
- ✅ **HTTPS 安全**: Let's Encrypt SSL 证书
- ✅ **响应式设计**: 支持移动端和桌面端

### 技术栈

- **前端**: Next.js 15.1.1, React 19, WebRTC, Tailwind CSS
- **后端**: Next.js API Routes (服务器端代理)
- **部署**: 阿里云 ECS (ap-southeast-1, ecs.t6-c1m2.large)
- **Web 服务器**: Nginx 1.18.0
- **进程管理**: PM2
- **SSL**: Let's Encrypt (自动续期)
- **DNS**: Cloudflare

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆代码（如果还没有）
cd /home/dministrator/Newproject/realtime-english-teacher-source

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加 OPENAI_API_KEY

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

### 部署到生产环境

```bash
# 一键部署（本地修改后）
cd deployment
./update-server.sh
```

详细的开发工作流请参考：[DEVELOPMENT-WORKFLOW.md](./DEVELOPMENT-WORKFLOW.md)

---

## 🌏 中国大陆访问

### 当前方案：服务器端代理

本项目通过**服务器端代理**解决中国大陆访问 OpenAI API 的限制：

```
浏览器 → 新加坡服务器 → api.openai.com ✅
```

**优势**：
- ✅ 用户无需使用代理
- ✅ API Key 安全存储在服务器端
- ✅ 统一的访问控制和监控

### 网络优化

如遇到访问缓慢，可以启用 Cloudflare 代理：

1. 登录 Cloudflare Dashboard
2. 找到 DNS 记录 `realtime.junyaolexiconcom.com`
3. 将代理状态从"仅 DNS"（灰色云朵）切换为"已代理"（橙色云朵）

**效果**：通过 Cloudflare 全球 CDN 加速，提升中国大陆访问速度

---

## 📚 文档导航

### 新手上路
1. **README.md**（本文档）- 项目概览和快速开始
2. **[DEVELOPMENT-WORKFLOW.md](./DEVELOPMENT-WORKFLOW.md)** - 开发工作流指南
   - 首次设置（Git 配置、SSH 密钥）
   - 日常开发（本地修改 + 自动部署）
   - 常见场景示例

### 深入理解
3. **[CLAUDE.md](./CLAUDE.md)** - 架构和运维详解
   - 核心设计决策
   - 服务器端操作
   - 常见问题排查

4. **[LESSONS-LEARNED.md](./LESSONS-LEARNED.md)** - 经验教训总结
   - 9 个已知错误/弯路
   - 6 条可推广原则
   - 避免重复踩坑

### 历史归档
5. **[docs/archive/](./docs/archive/)** - 项目初次部署的历史记录（仅供参考）

---

## 🏗️ 项目架构

### 核心设计

本项目基于开源项目 [cameronking4/openai-realtime-api-nextjs](https://github.com/cameronking4/openai-realtime-api-nextjs)，通过**最小修改**实现了中国大陆访问支持：

**原始架构**（中国大陆不可用）：
```
浏览器 → api.openai.com (被墙 ❌)
```

**修改后架构**：
```
浏览器 → 服务器 API Routes → api.openai.com ✅
```

### 代码修改

只修改了 **2 个文件**：

1. **新增**: `app/api/realtime/route.ts` - 服务器端代理
2. **修改**: `hooks/use-webrtc.ts:440` - 修改 API 端点

详见：[CLAUDE.md - 代码修改详解](./CLAUDE.md#代码修改详解)

---

## 🛠️ 常用命令

| 操作 | 命令 |
|------|------|
| 本地开发 | `npm run dev` |
| 构建生产版本 | `npm run build` |
| 部署到生产 | `cd deployment && ./update-server.sh` |
| SSH 登录服务器 | `ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140` |
| 查看服务状态 | `pm2 status` |
| 查看服务日志 | `pm2 logs realtime-english` |
| 重启服务 | `pm2 restart realtime-english` |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

开发流程：
1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交修改：`git commit -m 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📝 许可证

本项目基于 MIT 许可证开源。

---

## 🔗 相关链接

- **在线演示**: https://realtime.junyaolexiconcom.com
- **原始项目**: https://github.com/cameronking4/openai-realtime-api-nextjs
- **OpenAI Realtime API**: https://platform.openai.com/docs/api-reference/realtime

---

**最后更新**: 2025-10-08
