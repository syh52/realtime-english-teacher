# Quick Start - 5 分钟部署指南

## 前置要求检查

```bash
# 1. 检查 aliyun CLI（如未安装）
curl -sL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz | tar xzv
sudo mv aliyun /usr/local/bin/
aliyun version

# 2. 安装 jq
sudo apt-get install -y jq

# 3. 确认配置文件存在
ls /home/dministrator/Newproject/.env.local
```

## 一键部署

```bash
cd /home/dministrator/Newproject/realtime-english-teacher/deployment
./one-click-deploy.sh
```

## 预期输出

```
[INFO] ==========================================
[INFO] Real-time English Teacher 一键部署
[INFO] ==========================================
[INFO] 配置阿里云 CLI...
[INFO] 查找 Ubuntu 22.04 镜像...
[INFO] 使用镜像: ubuntu_22_04_x64_20G_alibase_20240220.vhd
[INFO] 配置安全组...
[INFO] 使用现有安全组: sg-xxxxx
[INFO] 获取交换机...
[INFO] 使用交换机: vsw-xxxxx
[INFO] 创建 ECS 实例...
[INFO] 实例创建成功: i-xxxxx
[INFO] 启动实例...
[INFO] 等待实例运行...
[INFO] 分配公网 IP...
[INFO] 公网 IP: xxx.xxx.xxx.xxx
[INFO] 等待 SSH 服务就绪（约 60 秒）...
[INFO] 部署项目到服务器...
[INFO] ==========================================
[INFO] ✓ 部署完成！
[INFO] ==========================================
[INFO]
[INFO] 访问地址: http://xxx.xxx.xxx.xxx:3000
[INFO] SSH 登录: ssh ubuntu@xxx.xxx.xxx.xxx
[INFO] 密码: RealTime2025!
[INFO]
[INFO] 配置已保存到: deployment-config.json
[INFO]
[INFO] 预估成本: ~150-250 元/月
[INFO] ==========================================
```

## 部署后验证

### 1. 检查服务状态

```bash
# SSH 登录
ssh ubuntu@<公网IP>
# 密码: RealTime2025!

# 检查 PM2 进程
pm2 list

# 查看日志
pm2 logs realtime-english

# 检查端口
sudo netstat -tulpn | grep 3000
```

### 2. 浏览器测试

打开浏览器访问：`http://<公网IP>:3000`

### 3. 语音对话测试

1. 点击"开始对话"按钮
2. 允许浏览器使用麦克风
3. 用英语说话
4. 观察 AI 是否实时回复

## 验证指标

- ✅ 页面可以正常访问
- ✅ WebRTC 连接成功
- ✅ 语音延迟 < 500ms
- ✅ 可以完成 5 分钟连续对话
- ✅ 无明显卡顿或断连

## 故障排查

### 问题 1: 脚本执行失败

```bash
# 检查 aliyun CLI 配置
aliyun configure list

# 手动测试 API
aliyun ecs DescribeRegions
```

### 问题 2: SSH 连接超时

```bash
# 检查实例状态
aliyun ecs DescribeInstances --RegionId ap-southeast-1

# 检查安全组（确保 22 端口开放）
aliyun ecs DescribeSecurityGroupAttribute \
    --SecurityGroupId <sg-id> \
    --RegionId ap-southeast-1
```

### 问题 3: 服务未启动

```bash
# SSH 登录后
cd /home/ubuntu/openai-realtime-api-nextjs

# 手动启动
npm run dev

# 或重启 PM2
pm2 restart all
```

### 问题 4: 无法访问 3000 端口

```bash
# 检查防火墙
sudo ufw status

# 如果启用了，添加规则
sudo ufw allow 3000

# 检查进程
ps aux | grep node
```

## 成本控制

### 方式 1: 停止实例（保留数据）

```bash
aliyun ecs StopInstance --InstanceId <instance-id>

# 重新启动
aliyun ecs StartInstance --InstanceId <instance-id>
```

### 方式 2: 释放实例（删除所有数据）

```bash
# 先停止
aliyun ecs StopInstance --InstanceId <instance-id> --ForceStop true

# 再释放
aliyun ecs DeleteInstance --InstanceId <instance-id> --Force true
```

## 下一步优化

如果验证成功，可以考虑：

1. **配置域名**
   ```bash
   # 购买域名后，添加 A 记录指向公网 IP
   # 使用 Certbot 安装 SSL 证书
   sudo apt-get install certbot
   sudo certbot --nginx -d yourdomain.com
   ```

2. **配置 Nginx 反向代理**
   ```bash
   sudo apt-get install nginx
   # 配置 /etc/nginx/sites-available/realtime-english
   ```

3. **设置自动备份**
   ```bash
   # 使用阿里云快照功能
   aliyun ecs CreateSnapshot --DiskId <disk-id>
   ```

4. **监控和告警**
   ```bash
   # 配置云监控告警（CPU、内存、带宽）
   ```

## 清理资源

如果不再需要，删除所有资源：

```bash
cd /home/dministrator/Newproject/realtime-english-teacher/deployment

# 读取实例 ID
INSTANCE_ID=$(jq -r '.instance_id' deployment-config.json)

# 停止并删除实例
aliyun ecs StopInstance --InstanceId $INSTANCE_ID --ForceStop true
sleep 10
aliyun ecs DeleteInstance --InstanceId $INSTANCE_ID --Force true

echo "资源已清理"
```

## 联系支持

如遇到问题，请检查：
- 产品简报：`product-brief-Real-time English teacher-2025-10-08.md`
- 详细 README：`README.md`
- 阿里云 ECS 控制台：https://ecs.console.aliyun.com
