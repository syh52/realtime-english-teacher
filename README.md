# Real-time English Teacher

基于 OpenAI Realtime API 的实时英语口语对话练习项目 - 部署到阿里云新加坡

## 项目概述

这是一个技术可行性验证项目，测试将 [openai-realtime-api-nextjs](https://github.com/cameronking4/openai-realtime-api-nextjs) 开源项目部署到阿里云新加坡服务器，让中国大陆用户能够正常使用实时语音对话功能。

## 快速开始

### 前置要求

1. **阿里云 CLI**
   ```bash
   # Ubuntu/Debian
   curl -sL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz | tar xzv
   sudo mv aliyun /usr/local/bin/

   # 验证安装
   aliyun version
   ```

2. **依赖工具**
   ```bash
   # jq (JSON 处理)
   sudo apt-get install -y jq

   # git
   sudo apt-get install -y git
   ```

3. **配置信息**
   - 阿里云 Access Key（已在 `/home/dministrator/Newproject/.env.local`）
   - OpenAI API Key（已配置）

### 一键部署

```bash
# Step 1: 配置阿里云 CLI
cd /home/dministrator/Newproject/realtime-english-teacher/deployment
chmod +x setup-aliyun-cli.sh
./setup-aliyun-cli.sh

# Step 2: 运行自动化部署
chmod +x deploy-to-aliyun.sh
./deploy-to-aliyun.sh
```

### 部署后操作

部署完成后，脚本会输出：
- ECS 实例 ID
- 公网 IP 地址
- SSH 登录命令

然后需要手动：

1. **SSH 登录服务器**
   ```bash
   ssh ubuntu@<公网IP>
   # 密码: YourPassword123!
   ```

2. **配置并启动项目**
   ```bash
   cd /home/ubuntu/openai-realtime-api-nextjs

   # 编辑 .env.local，填入 OpenAI API Key
   nano .env.local

   # 安装依赖并启动
   npm install
   npm run dev
   ```

3. **访问测试**
   ```
   http://<公网IP>:3000
   ```

## 项目结构

```
realtime-english-teacher/
├── README.md                              # 本文件
├── product-brief-Real-time English teacher-2025-10-08.md  # 产品简报
└── deployment/
    ├── setup-aliyun-cli.sh               # 配置阿里云 CLI
    ├── deploy-to-aliyun.sh               # 主部署脚本
    └── deployment-config.json            # 部署后生成的配置文件
```

## 技术栈

- **前端**: Next.js + WebRTC
- **后端**: Node.js + OpenAI Realtime API
- **部署**: 阿里云 ECS (新加坡)
- **自动化**: Bash + Aliyun CLI

## 验证指标

- [ ] ECS 实例创建成功
- [ ] 从中国大陆可以访问
- [ ] WebRTC 连接延迟 < 500ms
- [ ] 可以完成 5 分钟连续对话
- [ ] 成本在预算范围内 (< 500 元)

## 预估成本

- **服务器**: 100-200 元/月 (ecs.t6-c1m1.large, 按量付费)
- **OpenAI API**: 50-100 元 (测试阶段)
- **总计**: 200-350 元

## 故障排查

### 无法连接到 ECS

```bash
# 检查实例状态
aliyun ecs DescribeInstances --RegionId ap-southeast-1

# 检查安全组规则
aliyun ecs DescribeSecurityGroupAttribute --SecurityGroupId <sg-id> --RegionId ap-southeast-1
```

### 无法启动项目

```bash
# 检查 Node.js 版本
node --version  # 应该是 v20.x

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 查看日志
npm run dev
```

## 下一步计划

如果验证成功，可以考虑：
1. 配置域名和 SSL 证书
2. 使用 PM2 进行进程管理
3. 添加 Nginx 反向代理
4. 实现自动化 CI/CD

## 参考文档

- [阿里云 CLI 文档](https://help.aliyun.com/zh/cli/)
- [OpenAI Realtime API 文档](https://platform.openai.com/docs/api-reference/realtime)
- [原开源项目](https://github.com/cameronking4/openai-realtime-api-nextjs)
