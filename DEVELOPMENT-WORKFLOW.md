# 开发工作流指南

本文档说明如何在已部署的项目基础上继续开发和更新代码。

## 工作流概览

```
本地开发 → Git 提交 → 自动部署到云端 → 验证上线
```

## 第一次设置(仅需一次)

### 0. 配置 Git 用户信息(首次使用 Git)

如果你是第一次使用 Git,需要先配置用户信息:

```bash
# 配置全局用户名和邮箱
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"

# 验证配置
git config --global --list
```

⚠️ **重要**: 如果跳过这一步,在执行 `git commit` 时会报错: `fatal: empty ident name not allowed`

### 1. 初始化 Git 仓库

```bash
cd /home/dministrator/Newproject/realtime-english-teacher-source

# 初始化 Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit: Working deployment"
```

### 2. (可选)关联 GitHub/Gitee 远程仓库

```bash
# 在 GitHub 或 Gitee 创建一个空仓库,然后:
git remote add origin <你的仓库地址>
git branch -M main
git push -u origin main
```

**优势**:
- 代码云端备份
- 多设备同步
- 团队协作
- 版本历史追溯

## 日常开发流程

### 方式一:本地修改 + 自动部署(推荐)

```bash
# 1. 修改代码
# 在本地编辑器修改文件,比如:
# - hooks/use-webrtc.ts
# - app/api/realtime/route.ts
# - 任何其他文件

# 2. (推荐)提交到 Git
git add .
git commit -m "描述你的修改"

# 3. 一键部署到云端
cd deployment
./update-server.sh

# 脚本会自动:
# - 同步代码到服务器
# - 安装新依赖(如果有)
# - 重新构建项目
# - 重启 PM2 服务
# - 验证部署结果
```

**适用场景**:
- ✅ 功能开发
- ✅ Bug 修复
- ✅ 样式调整
- ✅ 配置修改

### 方式二:直接在服务器修改(仅紧急修复)

```bash
# 1. SSH 登录服务器
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140

# 2. 编辑文件
cd ~/openai-realtime-api-nextjs
nano <要修改的文件>

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart realtime-english

# 5. 查看日志确认
pm2 logs realtime-english

# ⚠️ 重要:修改后立即同步回本地!
# 在本地执行:
rsync -avz -e "ssh -i ~/.ssh/openai-proxy-key.pem" \
  root@8.219.239.140:~/openai-realtime-api-nextjs/ \
  /home/dministrator/Newproject/realtime-english-teacher-source/

# 然后提交到 Git
git add .
git commit -m "Emergency fix: <描述修改>"
```

**适用场景**:
- ⚠️ 紧急线上问题
- ⚠️ 快速验证想法

**风险**:
- ❌ 容易忘记同步回本地
- ❌ 代码可能丢失
- ❌ 与本地版本冲突

### 方式三:完全重新部署

```bash
# 适用于大规模重构或服务器迁移
cd deployment
./one-click-deploy.sh
```

**适用场景**:
- 服务器故障需要重建
- 迁移到新服务器
- 项目架构大调整

## 常见开发场景

### 场景 1: 修改 UI 样式

```bash
# 1. 本地修改
code hooks/use-webrtc.ts  # 或你的编辑器

# 2. 本地测试(可选)
npm run dev
# 打开 http://localhost:3000 测试

# 3. 提交并部署
git add hooks/use-webrtc.ts
git commit -m "Update UI styles"
cd deployment && ./update-server.sh
```

### 场景 2: 添加新功能

```bash
# 1. 创建新文件或修改现有文件
# 例如: 添加新的 API 端点
mkdir -p app/api/my-feature
nano app/api/my-feature/route.ts

# 2. 本地测试
npm install  # 如果添加了新依赖
npm run dev

# 3. 提交
git add app/api/my-feature/
git commit -m "Add new feature: my-feature API"

# 4. 部署
cd deployment && ./update-server.sh
```

### 场景 3: 更新依赖

```bash
# 1. 本地更新
npm install <新包名>
# 或
npm update <包名>

# 2. 提交 package.json 和 package-lock.json
git add package*.json
git commit -m "Update dependencies: <包名>"

# 3. 部署(脚本会自动执行 npm install)
cd deployment && ./update-server.sh
```

### 场景 4: 修改环境变量

```bash
# ⚠️ 环境变量不在 Git 中,需要手动同步

# 1. 本地修改
nano .env.local

# 2. 同步到服务器
scp -i ~/.ssh/openai-proxy-key.pem \
  .env.local \
  root@8.219.239.140:~/openai-realtime-api-nextjs/.env.local

# 3. 重启服务
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 \
  "cd ~/openai-realtime-api-nextjs && pm2 restart realtime-english"
```

## 部署后验证

每次部署后应该检查:

```bash
# 1. 检查服务状态
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "pm2 status"

# 2. 查看最近日志
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "pm2 logs realtime-english --lines 50"

# 3. 浏览器访问
# 打开 https://realtime.junyaolexiconcom.com
# 测试核心功能

# 4. 查看部署历史
cat deployment/deploy-history.log
```

## Git 最佳实践

### 提交信息规范

```bash
# 格式: <类型>: <简短描述>

# 类型:
# - feat: 新功能
# - fix: Bug 修复
# - style: 样式调整
# - refactor: 重构
# - perf: 性能优化
# - docs: 文档更新
# - chore: 构建/工具配置

# 示例:
git commit -m "feat: Add voice speed control"
git commit -m "fix: Resolve WebRTC connection timeout"
git commit -m "style: Update button colors"
git commit -m "docs: Add API documentation"
```

### 分支管理(团队协作时)

```bash
# 主分支保持稳定
main (production)

# 开发新功能时创建分支
git checkout -b feature/voice-speed-control
# 开发...
git add .
git commit -m "feat: Add voice speed control"

# 合并回主分支
git checkout main
git merge feature/voice-speed-control

# 部署
cd deployment && ./update-server.sh
```

## 故障排查

### 部署失败

```bash
# 1. 检查网络连接
ping 8.219.239.140

# 2. 检查 SSH 密钥
ls -l ~/.ssh/openai-proxy-key.pem

# 3. 手动登录服务器检查
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140

# 4. 查看服务器日志
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "pm2 logs realtime-english"
```

### 服务启动失败

```bash
# SSH 登录后:
cd ~/openai-realtime-api-nextjs

# 检查构建输出
npm run build

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 手动启动查看错误
npm start
```

### 代码冲突

```bash
# 如果本地和服务器都有修改,导致冲突

# 方案 1: 保留服务器版本
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 \
  "cd ~/openai-realtime-api-nextjs && tar czf ~/backup-$(date +%Y%m%d-%H%M%S).tar.gz ."

rsync -avz -e "ssh -i ~/.ssh/openai-proxy-key.pem" \
  root@8.219.239.140:~/openai-realtime-api-nextjs/ \
  ./temp-server-code/

# 手动合并文件
# 然后重新部署

# 方案 2: 保留本地版本
cd deployment && ./update-server.sh  # 强制覆盖
```

## 回滚到上一个版本

```bash
# 如果新部署有问题,快速回滚

# 1. Git 回滚到上一次提交
git log --oneline  # 查看提交历史
git revert <commit-hash>  # 或 git reset --hard <commit-hash>

# 2. 重新部署
cd deployment && ./update-server.sh

# 3. 或者在服务器上回滚(如果有 Git)
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 << 'EOF'
cd ~/openai-realtime-api-nextjs
git log --oneline
git reset --hard <previous-commit>
npm run build
pm2 restart realtime-english
EOF
```

## 监控和维护

### 定期检查

```bash
# 每周执行一次

# 1. 查看服务运行时间
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "pm2 list"

# 2. 检查磁盘空间
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "df -h"

# 3. 检查内存使用
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "free -m"

# 4. 查看 SSL 证书到期时间
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 "sudo certbot certificates"
```

### 日志管理

```bash
# PM2 日志会不断增长,定期清理

ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 << 'EOF'
# 清空日志
pm2 flush

# 或设置日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
EOF
```

## 性能优化建议

### 生产环境优化

```bash
# 1. 启用 Gzip 压缩 (Nginx 已配置)

# 2. 使用 PM2 集群模式
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140 << 'EOF'
pm2 delete realtime-english
pm2 start npm --name "realtime-english" -i max -- start
pm2 save
EOF

# 3. 启用 Next.js 缓存
# 在 next.config.js 中配置:
# swcMinify: true
# compress: true
```

## 总结

### 推荐工作流

```
1. 本地开发 → 2. Git 提交 → 3. 自动部署 → 4. 验证测试
       ↑                                         |
       └─────────── 发现问题,修复 ←──────────────┘
```

### 关键命令速查

| 操作 | 命令 |
|------|------|
| 本地开发测试 | `npm run dev` |
| Git 提交 | `git add . && git commit -m "message"` |
| 自动部署 | `cd deployment && ./update-server.sh` |
| SSH 登录 | `ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140` |
| 查看日志 | `ssh ... "pm2 logs realtime-english"` |
| 重启服务 | `ssh ... "pm2 restart realtime-english"` |

### 文件位置

- **本地项目**: `/home/dministrator/Newproject/realtime-english-teacher-source`
- **服务器代码**: `/root/openai-realtime-api-nextjs`
- **SSH 密钥**: `~/.ssh/openai-proxy-key.pem`
- **部署配置**: `deployment/deployment-config.json`
- **部署历史**: `deployment/deploy-history.log`

---

**最后提醒**: 永远保持本地代码为主,服务器只是部署目标。每次修改后都要提交到 Git!
