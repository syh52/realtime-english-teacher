# 代码修改记录

## 修改目标

让 OpenAI Realtime API Next.js 项目可以在中国大陆无代理访问使用。

## 问题分析

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

## 解决方案

**添加服务器端代理**，让所有 OpenAI API 请求通过服务器转发：

```
浏览器 → 你的服务器 (新加坡) → api.openai.com ✅
```

## 代码修改详情

### 1. 创建服务器端代理 API

**文件**: `/root/openai-realtime-api-nextjs/app/api/realtime/route.ts` (新建)

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

### 2. 修改前端连接逻辑

**文件**: `/root/openai-realtime-api-nextjs/hooks/use-webrtc.ts`

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

### 3. 备份

备份文件已创建: `hooks/use-webrtc.ts.backup`

## 部署步骤

```bash
cd /root/openai-realtime-api-nextjs

# 1. 创建代理 API 目录
mkdir -p app/api/realtime

# 2. 创建代理 API 文件
cat > app/api/realtime/route.ts << 'EOF'
[代理代码内容]
EOF

# 3. 修改前端连接逻辑
sed -i 's|const baseUrl = "https://api.openai.com/v1/realtime";|const baseUrl = "/api/realtime";|g' hooks/use-webrtc.ts

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart realtime-english
```

## 测试结果

✅ **成功**: 在中国大陆关闭代理后可以正常使用

**测试环境**:
- 服务器: 阿里云新加坡 (8.219.239.140)
- 域名: https://realtime.junyaolexiconcom.com
- SSL: Let's Encrypt + Nginx
- CDN: Cloudflare (可选)

**测试内容**:
- ✅ 网站可以访问
- ✅ WebRTC 连接成功
- ✅ 语音对话功能正常
- ✅ 从中国大陆无代理访问

## 架构对比

### 修改前
```
┌─────────┐           ❌ 被墙
│ 浏览器  │ ─────────────────→ api.openai.com
└─────────┘
```

### 修改后
```
┌─────────┐   HTTPS    ┌──────────────┐   HTTPS    ┌─────────────┐
│ 浏览器  │ ────────→  │ 你的服务器   │ ────────→  │ OpenAI API  │
└─────────┘           └──────────────┘           └─────────────┘
            (新加坡)
            通过服务器转发，绕过网络限制
```

## 关键优势

1. **无需用户代理**: 中国大陆用户可以直接访问
2. **API Key 安全**: OpenAI API Key 存储在服务器端，不暴露给浏览器
3. **功能完整**: 所有 WebRTC 实时语音功能正常工作
4. **性能优良**: 服务器在新加坡，延迟可接受
5. **维护简单**: 只修改了 2 个文件，改动最小化

## 文件清单

**修改的文件**:
- `/root/openai-realtime-api-nextjs/hooks/use-webrtc.ts` (1 行修改)

**新增的文件**:
- `/root/openai-realtime-api-nextjs/app/api/realtime/route.ts` (新建)

**备份文件**:
- `/root/openai-realtime-api-nextjs/hooks/use-webrtc.ts.backup`

## 注意事项

1. **环境变量**: 确保 `.env.local` 中配置了 `OPENAI_API_KEY`
2. **HTTPS 必需**: WebRTC 要求 HTTPS 连接（已配置）
3. **服务器位置**: 新加坡服务器对中国大陆和 OpenAI API 都有良好连通性
4. **成本**: 阿里云 ECS 约 150 元/月，SSL 证书免费

## 后续优化建议

1. **添加请求限流**: 防止 API 滥用
2. **添加日志**: 记录 API 使用情况
3. **错误处理**: 更详细的错误提示
4. **监控告警**: 服务可用性监控

---

**修改日期**: 2025-10-08
**修改人**: Claude Code
**测试状态**: ✅ 通过 - 中国大陆可正常使用
