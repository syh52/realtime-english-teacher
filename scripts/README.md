# 测试脚本使用指南

本目录包含用于本地测试的脚本。

## 脚本列表

### `test-api.sh` - API 连接测试

快速验证 OpenAI API 是否可以通过代理正常访问。

**用途**:
- 验证代理配置是否生效
- 测试 `/api/session` 端点
- 确认 OPENAI_API_KEY 是否有效

**使用方法**:

```bash
# 1. 启动开发服务器（在一个终端）
npm run dev

# 2. 在另一个终端运行测试
./scripts/test-api.sh
```

**预期输出**:

```
================================
  OpenAI API 连接测试
================================

1. 检查本地服务器状态...
✓ 本地服务器正在运行

2. 测试 Session API (/api/session)...
   请求: POST http://localhost:3000/api/session

   状态码: 200

✅ 成功! Session API 正常工作

   响应内容:
{
  "client_secret": {
    "value": "eph_...",
    "expires_at": ...
  }
}

================================
  测试通过! 🎉
================================
```

**如果测试失败**:

检查以下几点：

1. **OPENAI_API_KEY 配置**
   ```bash
   cat .env.local | grep OPENAI_API_KEY
   ```

2. **代理服务器状态**
   ```bash
   echo $HTTPS_PROXY
   # 应该显示: http://127.0.0.1:7897 或类似地址

   # 测试代理是否可用
   curl -x $HTTPS_PROXY https://api.openai.com/v1/models
   ```

3. **查看详细日志**
   在运行 `npm run dev` 的终端查看控制台输出，应该会看到：
   ```
   [Session API] Using proxy: http://127.0.0.1:7897
   ```

## 测试流程建议

```
测试 API 层
    ↓
如果成功 → 测试文本输入功能
    ↓
如果成功 → 手动测试语音功能
    ↓
如果成功 → 部署到生产环境
```

### 1. API 层测试（最快）

```bash
./scripts/test-api.sh
```

### 2. 文本输入功能测试

1. 打开浏览器: http://localhost:3000
2. 点击麦克风按钮（等待状态变为 Connected）
3. 点击 "Type" 按钮
4. 输入测试消息: "Hello, can you test if you can hear me?"
5. 发送并等待 AI 回复

### 3. 语音功能测试

1. 确保浏览器有麦克风权限
2. 点击麦克风按钮
3. 说话并观察实时转录
4. 等待 AI 语音回复

## 故障排查

### 问题 1: "本地服务器未运行"

**解决方案**:
```bash
npm run dev
```

### 问题 2: "HTTP 状态码: 500"

**可能原因**:
- OPENAI_API_KEY 未设置
- 代理连接失败
- OpenAI API 配额用尽

**调试步骤**:
1. 查看 `npm run dev` 终端的错误日志
2. 检查 `.env.local` 文件
3. 测试代理连接

### 问题 3: "代理超时"

**解决方案**:
```bash
# 确认代理服务器运行状态
# 对于 Clash
ps aux | grep clash

# 测试代理连接
curl -x http://127.0.0.1:7897 https://www.google.com
```

## 环境变量

确保以下环境变量已设置：

```bash
# .env.local
OPENAI_API_KEY=sk-proj-...
HTTPS_PROXY=http://127.0.0.1:7897  # 可选，中国大陆必需
```

## 注意事项

1. **代理仅在 API 路由层生效**
   - 浏览器端的 WebRTC 连接需要系统级代理
   - 确保系统代理已正确配置

2. **OPENAI_API_KEY 安全**
   - 永远不要提交 `.env.local` 到 Git
   - 生产环境使用环境变量而非文件

3. **测试顺序**
   - 先测试 API 层（最快）
   - 再测试文本输入（中等）
   - 最后测试语音（需要手动）
