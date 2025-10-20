# 用户认证系统实施方案

**创建日期**: 2025-10-13
**项目**: AI 英语口语教练
**版本**: v1.0
**状态**: 📋 方案设计阶段

---

## 📋 目录

- [当前状态分析](#当前状态分析)
- [系统架构设计](#系统架构设计)
- [技术选型](#技术选型)
- [数据库设计](#数据库设计)
- [实施计划](#实施计划)
- [成本估算](#成本估算)
- [待确认问题](#待确认问题)

---

## 当前状态分析

### 1. 删除功能现状 ✅

**好消息**：删除功能已经实现！

**位置**：`components/conversation-sidebar.tsx` (第 146-152 行)

**工作方式**：
- 鼠标 hover 到侧边栏的对话项时，右上角会出现红色垃圾桶图标 🗑️
- 点击后弹出确认对话框："确定要删除这个对话吗？"
- 防止误删：当前活跃会话无法删除
- 智能切换：删除当前会话后自动切到最新会话

**代码实现**：
```typescript
const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
  e.stopPropagation();
  if (isSessionActive && sessionId === sessionManager.currentSessionId) {
    alert("请先停止当前会话，再删除对话");
    return;
  }
  if (confirm("确定要删除这个对话吗？")) {
    sessionManager.deleteSession(sessionId); // 立即从 localStorage 删除
  }
};
```

**UI 设计**：
- 删除按钮默认隐藏（`opacity-0`）
- hover 时显示（`group-hover:opacity-100`）
- 红色图标（`text-destructive`）警示作用

**潜在问题**：
- ❌ 移动端 hover 不可用，用户可能找不到删除按钮
- ❌ 删除后无法恢复（无回收站机制）

### 2. 当前存储机制 📁

#### 历史对话存储

**存储位置**: 浏览器 localStorage

**存储键**: `voice-chat-sessions`

**存储内容**：
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "My name is...",
      "messages": [
        {
          "id": "msg-uuid",
          "role": "user",
          "text": "Hello",
          "isFinal": true
        }
      ],
      "messageCount": 10,
      "voice": "ash",
      "createdAt": "2025-10-13T10:00:00.000Z",
      "updatedAt": "2025-10-13T10:15:00.000Z",
      "isArchived": true,
      "isActive": false,
      "endedAt": "2025-10-13T10:15:00.000Z"
    }
  ],
  "currentSessionId": "uuid",
  "lastSaved": "2025-10-13T10:15:00.000Z"
}
```

**代码位置**: `hooks/use-session-manager.ts`

**特点**：
- ✅ 自动保存（每次状态变化）
- ✅ 数据持久化（关闭浏览器不丢失）
- ✅ 快速读写（本地存储，无网络延迟）
- ❌ **仅限本地**（换设备/浏览器就看不到）
- ❌ **无法共享**（无法跨设备同步）
- ❌ **容量有限**（约 5-10MB，存储大量对话会满）
- ❌ **无备份**（浏览器数据清除后永久丢失）

**代码实现**：
```typescript
const STORAGE_KEY = "voice-chat-sessions";

// 加载数据
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data: SessionsData = JSON.parse(saved);
    setSessions(data.sessions);
    setCurrentSessionId(data.currentSessionId);
  }
}, []);

// 自动保存
useEffect(() => {
  if (!isLoaded) return;
  const data: SessionsData = {
    sessions,
    currentSessionId,
    lastSaved: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}, [sessions, currentSessionId, isLoaded]);
```

#### 日志存储

**存储方式**: **不存储**，仅在内存中

**工作流程**：
1. WebRTC 消息存储在内存 `msgs` 数组（`hooks/use-webrtc.ts`）
2. 用户点击"导出"按钮时动态生成文本文件
3. 下载到本地，服务器和浏览器都不保存

**日志内容**：
- **TXT 格式（简洁版）**：对话转录 + 关键事件，减少 97%
- **FULL 格式（完整版）**：智能过滤的技术日志，减少 75%
- **JSON 格式（原始数据）**：无任何过滤

**代码位置**: `components/message-controls.tsx`

---

## 系统架构设计

### 架构对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Supabase** | 认证开箱即用、自带数据库、免费额度大、实时同步、新加坡节点 | 依赖第三方服务 | ⭐⭐⭐⭐⭐ **强烈推荐** |
| **NextAuth.js + Prisma + PostgreSQL** | 完全自主控制、灵活性高 | 需要配置数据库、运维复杂、成本高 | ⭐⭐⭐ |
| **Firebase Auth + Firestore** | 谷歌服务、文档丰富 | **在中国访问不稳定** | ⭐ 不推荐 |
| **自建 JWT + MySQL** | 最大控制权 | 开发周期长、安全风险高 | ⭐ 不推荐 |

### 推荐方案：Supabase + Next.js

#### 为什么选择 Supabase？

1. ✅ **认证开箱即用**
   - 邮箱密码认证
   - OAuth（Google、GitHub、微信等）
   - 魔法链接（无密码登录）
   - 手机号验证码登录

2. ✅ **自带 PostgreSQL 数据库**
   - 关系型数据库，适合结构化数据
   - 支持复杂查询和联表
   - 自动备份和恢复

3. ✅ **免费额度充足**
   - 50,000 活跃用户/月
   - 500MB 数据库存储
   - 1GB 文件存储
   - 2GB 带宽/月
   - 无限 API 请求

4. ✅ **实时订阅（Realtime）**
   - 可以实现跨设备同步对话
   - 多端登录实时更新
   - WebSocket 长连接

5. ✅ **部署在新加坡**
   - 与您的阿里云服务器在同一区域
   - 延迟低（< 50ms）
   - 访问稳定

6. ✅ **安全的 RLS（Row Level Security）**
   - 数据库级别的权限控制
   - 用户只能访问自己的数据
   - 防止 SQL 注入

7. ✅ **开发体验优秀**
   - TypeScript 支持完善
   - 自动生成 API 类型
   - 丰富的官方文档和示例

#### 技术栈

```
┌─────────────────────────────────────────────────┐
│              用户浏览器                          │
│  ┌──────────────────────────────────────────┐  │
│  │  Next.js 15 + React 19 (前端)            │  │
│  │  - Supabase Auth UI (登录组件)           │  │
│  │  - Supabase Client (数据访问)            │  │
│  │  - WebRTC (实时语音)                     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────────────┐
│       阿里云新加坡服务器 (8.219.239.140)        │
│  ┌──────────────────────────────────────────┐  │
│  │  Next.js API Routes (后端)               │  │
│  │  - Session Token 验证                    │  │
│  │  - OpenAI API 代理                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
       ↓ API Calls                    ↓ WebRTC
┌──────────────────────┐      ┌─────────────────┐
│  Supabase 新加坡     │      │  OpenAI API     │
│  - Auth Service      │      │  - Realtime API │
│  - PostgreSQL DB     │      └─────────────────┘
│  - Realtime Server   │
└──────────────────────┘
```

---

## 技术选型

### 前端依赖

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",
    "@supabase/auth-helpers-nextjs": "^0.9.0"
  }
}
```

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # 仅服务器端使用，不暴露给客户端
```

---

## 数据库设计

### 表结构

#### 1. 用户表（Supabase 自带）

Supabase 提供的 `auth.users` 表包含：
- `id` (UUID) - 用户唯一标识
- `email` - 邮箱
- `created_at` - 注册时间
- `last_sign_in_at` - 最后登录时间
- `user_metadata` - 自定义用户信息（如昵称、头像）

#### 2. 会话表（sessions）

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  voice TEXT NOT NULL DEFAULT 'ash',
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 索引优化
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
```

**字段说明**：
- `id` - 会话唯一标识
- `user_id` - 所属用户（外键）
- `title` - 会话标题（自动生成或用户自定义）
- `voice` - AI 语音类型（ash, ballad, coral 等）
- `message_count` - 消息数量（冗余字段，提高查询性能）
- `is_archived` - 是否归档（已结束的对话）
- `is_active` - 是否为当前活跃会话
- `created_at` - 创建时间
- `updated_at` - 最后更新时间
- `ended_at` - 结束时间（归档时设置）

#### 3. 消息表（messages）

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**字段说明**：
- `id` - 消息唯一标识
- `session_id` - 所属会话（外键，级联删除）
- `role` - 角色类型
  - `user` - 用户说的话
  - `assistant` - AI 回复
  - `system` - 系统消息（如连接建立、错误提示）
- `text` - 消息文本内容
- `audio_url` - 音频文件 URL（可选，未来扩展）
- `created_at` - 创建时间

### 行级安全策略（RLS）

Supabase 的核心安全特性，确保用户只能访问自己的数据。

#### 会话表 RLS

```sql
-- 启用 RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的会话
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的会话
CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的会话
CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的会话
CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);
```

#### 消息表 RLS

```sql
-- 启用 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己会话的消息
CREATE POLICY "Users can view messages from their sessions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- 用户只能向自己的会话添加消息
CREATE POLICY "Users can insert messages to their sessions"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- 用户只能更新自己会话的消息
CREATE POLICY "Users can update messages in their sessions"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- 用户只能删除自己会话的消息
CREATE POLICY "Users can delete messages from their sessions"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );
```

### 数据库函数（可选）

#### 自动更新 updated_at

```sql
-- 创建自动更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 sessions 表添加触发器
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 自动更新消息计数

```sql
-- 创建更新消息计数的函数
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions
    SET message_count = message_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions
    SET message_count = message_count - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 为 messages 表添加触发器
CREATE TRIGGER update_message_count_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();

CREATE TRIGGER update_message_count_on_delete
  AFTER DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();
```

---

## 实施计划

### 阶段 1: Supabase 项目初始化 (30分钟)

#### 1.1 创建 Supabase 项目

1. 访问 https://supabase.com/
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（推荐）
4. 创建新组织（Organization）或使用现有组织
5. 创建新项目（Project）：
   - **Project name**: `realtime-english-teacher`
   - **Database Password**: 生成强密码并保存
   - **Region**: **Southeast Asia (Singapore)** ⚠️ 重要
   - **Pricing Plan**: Free
6. 等待项目初始化（约 2 分钟）

#### 1.2 获取 API Keys

1. 进入项目 Dashboard
2. 点击左侧菜单 "Settings" → "API"
3. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public** key: `eyJxxx...`（客户端使用）
   - **service_role** key: `eyJxxx...`（服务器端使用，保密）

#### 1.3 创建数据库表

1. 点击左侧菜单 "SQL Editor"
2. 点击 "New query"
3. 复制粘贴以下完整 SQL：

```sql
-- ===================================
-- 会话表（sessions）
-- ===================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  voice TEXT NOT NULL DEFAULT 'ash',
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- ===================================
-- 消息表（messages）
-- ===================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ===================================
-- 行级安全策略（RLS）
-- ===================================

-- 会话表 RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 消息表 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their sessions"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their sessions"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ===================================
-- 数据库函数和触发器
-- ===================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 自动更新消息计数
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions
    SET message_count = message_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions
    SET message_count = message_count - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_count_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();

CREATE TRIGGER update_message_count_on_delete
  AFTER DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();
```

4. 点击 "Run" 执行
5. 验证：点击左侧 "Table Editor" 应该看到 `sessions` 和 `messages` 两个表

#### 1.4 配置认证设置

1. 点击左侧菜单 "Authentication" → "Providers"
2. 确认 "Email" 已启用（默认启用）
3. 可选：启用 Google/GitHub OAuth
   - 需要在对应平台创建 OAuth App
   - 获取 Client ID 和 Client Secret

#### 1.5 配置环境变量

在本地项目中添加环境变量：

```bash
# 进入项目目录
cd /home/dministrator/Newproject/realtime-english-teacher-source

# 编辑 .env.local
nano .env.local

# 添加以下内容（保留原有的 OPENAI_API_KEY）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

### 阶段 2: 前端认证集成 (2小时)

#### 2.1 安装依赖

```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared @supabase/auth-helpers-nextjs
```

#### 2.2 创建 Supabase 客户端

**文件**: `lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase/database.types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}
```

**文件**: `lib/supabase/server.ts`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/database.types'

export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}
```

#### 2.3 生成 TypeScript 类型（可选但推荐）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref xxx

# 生成类型
supabase gen types typescript --project-id xxx > lib/supabase/database.types.ts
```

#### 2.4 创建登录/注册页面

**文件**: `app/(auth)/login/page.tsx`

```typescript
'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      }
    })

    // 监听登录状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">AI 英语口语教练</h1>
          <p className="text-muted-foreground mt-2">登录或注册开始练习</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary))',
                },
              },
            },
          }}
          providers={[]} // 或 ['google', 'github']
          localization={{
            variables: {
              sign_in: {
                email_label: '邮箱',
                password_label: '密码',
                button_label: '登录',
                loading_button_label: '登录中...',
                social_provider_text: '使用 {{provider}} 登录',
                link_text: '已有账号？点击登录',
              },
              sign_up: {
                email_label: '邮箱',
                password_label: '密码',
                button_label: '注册',
                loading_button_label: '注册中...',
                social_provider_text: '使用 {{provider}} 注册',
                link_text: '没有账号？点击注册',
              },
              forgotten_password: {
                email_label: '邮箱',
                button_label: '发送重置链接',
                link_text: '忘记密码？',
              },
            },
          }}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
        />
      </div>
    </div>
  )
}
```

#### 2.5 创建认证回调路由

**文件**: `app/auth/callback/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 重定向到首页
  return NextResponse.redirect(requestUrl.origin)
}
```

#### 2.6 添加路由保护（Middleware）

**文件**: `middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 保护主页，未登录重定向到登录页
  if (!session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 已登录用户访问登录页，重定向到首页
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/login'],
}
```

#### 2.7 添加登出功能

**修改**: `components/header.tsx` 或 `components/conversation-sidebar.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="w-full justify-start"
    >
      <LogOut className="h-4 w-4 mr-2" />
      退出登录
    </Button>
  )
}
```

---

### 阶段 3: 迁移存储层 (3小时)

#### 3.1 创建数据访问层（DAL）

**文件**: `lib/supabase/sessions.ts`

```typescript
import { createClient } from '@/lib/supabase/client'
import { Session, Conversation } from '@/lib/conversations'

/**
 * 会话数据访问层
 */
export class SessionsDAL {
  private supabase = createClient()

  /**
   * 获取用户所有会话
   */
  async getSessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 获取会话列表失败:', error)
      throw error
    }

    // 转换为前端格式
    return data.map(this.mapToSession)
  }

  /**
   * 创建新会话
   */
  async createSession(voice: string): Promise<Session> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const now = new Date().toISOString()
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        title: `新对话 - ${this.formatDate(now)}`,
        voice,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ 创建会话失败:', error)
      throw error
    }

    return this.mapToSession(data)
  }

  /**
   * 更新会话
   */
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({
        title: updates.title,
        is_archived: updates.isArchived,
        is_active: updates.isActive,
        ended_at: updates.endedAt,
      })
      .eq('id', sessionId)

    if (error) {
      console.error('❌ 更新会话失败:', error)
      throw error
    }
  }

  /**
   * 删除会话（级联删除消息）
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('❌ 删除会话失败:', error)
      throw error
    }
  }

  /**
   * 获取会话的所有消息
   */
  async getMessages(sessionId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ 获取消息失败:', error)
      throw error
    }

    return data.map(this.mapToMessage)
  }

  /**
   * 添加消息到会话
   */
  async addMessage(sessionId: string, message: Conversation): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: message.role,
        text: message.text,
      })

    if (error) {
      console.error('❌ 添加消息失败:', error)
      throw error
    }
  }

  /**
   * 将数据库记录转换为前端 Session 格式
   */
  private mapToSession(row: any): Session {
    return {
      id: row.id,
      title: row.title,
      messages: [], // 按需懒加载
      messageCount: row.message_count,
      voice: row.voice,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isArchived: row.is_archived,
      isActive: row.is_active,
      endedAt: row.ended_at,
    }
  }

  /**
   * 将数据库记录转换为前端 Conversation 格式
   */
  private mapToMessage(row: any): Conversation {
    return {
      id: row.id,
      role: row.role,
      text: row.text,
      isFinal: true,
    }
  }

  /**
   * 格式化日期
   */
  private formatDate(isoString: string): string {
    const date = new Date(isoString)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}
```

#### 3.2 修改 `use-session-manager.ts`

**策略**: 渐进式迁移，保留 localStorage 作为缓存层

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Session, Conversation } from "@/lib/conversations";
import { SessionsDAL } from "@/lib/supabase/sessions";

const STORAGE_KEY = "voice-chat-sessions-cache";

export function useSessionManager(initialVoice: string = "ash") {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [dal] = useState(() => new SessionsDAL());

  /**
   * 从 Supabase 加载会话（优先）
   * 如果失败，降级到 localStorage
   */
  useEffect(() => {
    async function loadSessions() {
      try {
        // 尝试从 Supabase 加载
        const remoteSessions = await dal.getSessions();
        setSessions(remoteSessions);

        // 找到最后活跃的会话
        const activeSession = remoteSessions.find(s => s.isActive) || remoteSessions[0];
        if (activeSession) {
          setCurrentSessionId(activeSession.id);
          // 加载该会话的消息
          const messages = await dal.getMessages(activeSession.id);
          setSessions(prev => prev.map(s =>
            s.id === activeSession.id ? { ...s, messages } : s
          ));
        }

        // 更新本地缓存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSessions));
        console.log("✅ 从 Supabase 加载会话:", remoteSessions.length, "个");
      } catch (error) {
        console.error("❌ Supabase 加载失败，降级到 localStorage:", error);

        // 降级到 localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setSessions(data);
          const activeSession = data.find((s: Session) => s.isActive) || data[0];
          if (activeSession) {
            setCurrentSessionId(activeSession.id);
          }
        }
      } finally {
        setIsLoaded(true);
      }
    }

    loadSessions();
  }, [dal]);

  /**
   * 创建新会话
   */
  const createSession = useCallback(
    async (voice: string = initialVoice): Promise<Session> => {
      try {
        // 创建远程会话
        const newSession = await dal.createSession(voice);

        // 更新本地状态
        setSessions((prev) => {
          const updated = prev.map((s) => ({
            ...s,
            isActive: false,
            isArchived: s.isActive ? true : s.isArchived,
            endedAt: s.isActive ? new Date().toISOString() : s.endedAt,
          }));
          return [...updated, newSession];
        });
        setCurrentSessionId(newSession.id);

        console.log("✅ 创建新会话:", newSession.id);
        return newSession;
      } catch (error) {
        console.error("❌ 创建会话失败:", error);
        throw error;
      }
    },
    [dal, initialVoice]
  );

  /**
   * 删除会话
   */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        // 删除远程会话
        await dal.deleteSession(sessionId);

        // 更新本地状态
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== sessionId);

          // 如果删除的是当前会话，切换到最新会话
          if (sessionId === currentSessionId && filtered.length > 0) {
            const latest = filtered[filtered.length - 1];
            setCurrentSessionId(latest.id);
          }

          return filtered;
        });

        console.log("✅ 删除会话:", sessionId);
      } catch (error) {
        console.error("❌ 删除会话失败:", error);
        throw error;
      }
    },
    [dal, currentSessionId]
  );

  /**
   * 添加消息到当前会话
   */
  const addMessageToCurrentSession = useCallback(
    async (message: Conversation) => {
      try {
        // 保存到远程
        await dal.addMessage(currentSessionId, message);

        // 更新本地状态
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === currentSessionId) {
              const updatedMessages = [...session.messages, message];
              return {
                ...session,
                messages: updatedMessages,
                messageCount: updatedMessages.length,
                updatedAt: new Date().toISOString(),
              };
            }
            return session;
          })
        );
      } catch (error) {
        console.error("❌ 添加消息失败:", error);
        // 不抛出错误，避免中断用户对话
      }
    },
    [dal, currentSessionId]
  );

  // ... 其他方法类似修改 ...

  return {
    sessions,
    currentSessionId,
    isLoaded,
    getCurrentSession: useCallback(
      () => sessions.find((s) => s.id === currentSessionId) || null,
      [sessions, currentSessionId]
    ),
    createSession,
    selectSession: useCallback((sessionId: string) => {
      setCurrentSessionId(sessionId);
    }, []),
    deleteSession,
    addMessageToCurrentSession,
    // ... 其他方法
  };
}
```

#### 3.3 实现数据迁移工具

**文件**: `components/data-migration.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SessionsDAL } from '@/lib/supabase/sessions'
import { Download, Upload, AlertCircle } from 'lucide-react'

export function DataMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const migrateToCloud = async () => {
    try {
      setIsLoading(true)
      setMessage('正在迁移数据...')

      // 读取本地数据
      const localData = localStorage.getItem('voice-chat-sessions')
      if (!localData) {
        setMessage('❌ 没有找到本地数据')
        return
      }

      const { sessions } = JSON.parse(localData)
      const dal = new SessionsDAL()

      // 上传会话
      for (const session of sessions) {
        const newSession = await dal.createSession(session.voice)

        // 上传消息
        for (const message of session.messages) {
          await dal.addMessage(newSession.id, message)
        }
      }

      setMessage(`✅ 成功迁移 ${sessions.length} 个对话到云端！`)

      // 备份本地数据后清除
      localStorage.setItem('voice-chat-sessions-backup', localData)
      localStorage.removeItem('voice-chat-sessions')
    } catch (error) {
      console.error('迁移失败:', error)
      setMessage('❌ 迁移失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-semibold">数据迁移工具</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        首次使用云端存储？点击下方按钮将您的本地对话历史迁移到云端，以便在多个设备间同步。
      </p>

      <Button
        onClick={migrateToCloud}
        disabled={isLoading}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {isLoading ? '迁移中...' : '迁移本地数据到云端'}
      </Button>

      {message && (
        <p className="text-sm text-center">{message}</p>
      )}
    </div>
  )
}
```

---

### 阶段 4: UI 优化 (1小时)

#### 4.1 改进删除按钮可见性

**修改**: `components/conversation-sidebar.tsx`

```typescript
<button
  onClick={(e) => handleDeleteSession(session.id, e)}
  className={cn(
    "absolute right-2 top-2 p-1 hover:bg-destructive/10 rounded transition-opacity",
    // 桌面端：hover 显示
    "opacity-0 group-hover:opacity-100",
    // 移动端：始终显示
    "md:opacity-0 md:group-hover:opacity-100"
  )}
  title="删除对话"
>
  <Trash2 className="h-3 w-3 text-destructive" />
</button>
```

#### 4.2 添加用户信息显示

**文件**: `components/user-profile.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  if (!user) return null

  return (
    <div className="flex items-center gap-2 p-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {user.email?.[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.email}</p>
      </div>
    </div>
  )
}
```

#### 4.3 添加数据同步状态指示器

```typescript
'use client'

import { Cloud, CloudOff } from 'lucide-react'

export function SyncIndicator({ isSyncing }: { isSyncing: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {isSyncing ? (
        <>
          <Cloud className="h-3 w-3 animate-pulse" />
          <span>同步中...</span>
        </>
      ) : (
        <>
          <Cloud className="h-3 w-3 text-green-500" />
          <span>已同步</span>
        </>
      )}
    </div>
  )
}
```

---

### 阶段 5: 测试和部署 (1小时)

#### 5.1 本地测试清单

- [ ] 用户注册流程
  - [ ] 邮箱格式验证
  - [ ] 密码强度检查
  - [ ] 注册成功后自动登录

- [ ] 用户登录流程
  - [ ] 正确的邮箱密码可以登录
  - [ ] 错误的凭据显示错误提示
  - [ ] 登录后跳转到首页

- [ ] 会话管理
  - [ ] 创建新会话
  - [ ] 查看会话列表
  - [ ] 切换会话
  - [ ] 删除会话
  - [ ] 归档会话

- [ ] 消息同步
  - [ ] 发送消息后立即显示
  - [ ] 刷新页面后消息仍然存在
  - [ ] 跨设备同步（在不同浏览器登录同一账号）

- [ ] 数据迁移
  - [ ] 迁移工具正常工作
  - [ ] 本地数据成功导入云端
  - [ ] 迁移后数据完整

- [ ] 安全性
  - [ ] 未登录无法访问首页
  - [ ] 用户只能看到自己的数据
  - [ ] 登出后无法访问受保护页面

#### 5.2 部署到生产环境

```bash
# 1. 更新服务器环境变量
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140
cd ~/openai-realtime-api-nextjs
nano .env.local

# 添加 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# 2. 本地构建
npm run build

# 3. 同步到服务器（使用部署脚本）
cd deployment
./update-server.sh

# 4. 或手动同步
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next/cache' \
  -e "ssh -i ~/.ssh/openai-proxy-key.pem" \
  ./ root@8.219.239.140:~/openai-realtime-api-nextjs/

# 5. 服务器端重新构建和重启
ssh -i ~/.ssh/openai-proxy-key.pem root@8.219.239.140
cd ~/openai-realtime-api-nextjs
npm run build
pm2 restart realtime-english

# 6. 验证部署
curl -I https://realtime.junyaolexiconcom.com
pm2 logs realtime-english
```

#### 5.3 配置 Supabase 重定向 URL

1. 进入 Supabase Dashboard
2. 点击 "Authentication" → "URL Configuration"
3. 添加生产环境 URL：
   - **Site URL**: `https://realtime.junyaolexiconcom.com`
   - **Redirect URLs**:
     - `https://realtime.junyaolexiconcom.com/auth/callback`
     - `http://localhost:3000/auth/callback`（开发环境）

#### 5.4 监控和日志

```bash
# 查看 PM2 日志
pm2 logs realtime-english

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 监控系统资源
pm2 monit
```

---

## 成本估算

### Supabase 免费版额度

| 资源 | 免费额度 | 预估使用 | 是否够用 |
|------|----------|----------|----------|
| 活跃用户 | 50,000/月 | < 100 | ✅ 完全够用 |
| 数据库存储 | 500MB | < 10MB | ✅ 完全够用 |
| 文件存储 | 1GB | 0 (不存音频) | ✅ 不使用 |
| 带宽 | 2GB/月 | < 100MB | ✅ 完全够用 |
| API 请求 | 无限 | 不限 | ✅ 完全够用 |

**结论**: 个人项目或小型应用完全免费

### 付费版对比（如需扩展）

| 计划 | 价格 | 用户数 | 数据库 | 带宽 |
|------|------|--------|--------|------|
| Free | $0/月 | 50,000 | 500MB | 2GB |
| Pro | $25/月 | 100,000 | 8GB | 50GB |
| Team | $599/月 | 无限 | 50GB | 250GB |

### 总成本

- **开发阶段**: $0
- **生产运行**: $0（免费额度内）
- **阿里云 ECS**: ¥150/月（已有）
- **域名**: $0（已有）
- **SSL 证书**: $0（Let's Encrypt）

**总计**: $0 新增成本

---

## 待确认问题

在开始实施前，需要您确认以下问题：

### 1. 认证方式

**选项 A**: 仅邮箱密码（简单）
- ✅ 实现最快（1小时）
- ✅ 无需第三方配置
- ❌ 用户需要记住密码

**选项 B**: 邮箱密码 + Google OAuth（推荐）
- ✅ 用户体验更好
- ✅ 安全性更高
- ❌ 需要创建 Google OAuth App（30分钟）

**选项 C**: 魔法链接（无密码登录）
- ✅ 最佳用户体验
- ✅ 最高安全性
- ❌ 依赖邮件服务

**您的选择**：_______

---

### 2. 数据迁移策略

**选项 A**: 提供迁移工具，用户主动迁移
- ✅ 用户有控制权
- ✅ 不会意外丢失数据
- ❌ 用户需要手动操作

**选项 B**: 首次登录自动迁移
- ✅ 用户无感知
- ✅ 体验流畅
- ❌ 可能在用户不知情的情况下删除本地数据

**选项 C**: 双向同步（localStorage + Supabase）
- ✅ 最高可靠性
- ✅ 离线也能用
- ❌ 实现复杂，可能有冲突

**您的选择**：_______

---

### 3. 实时同步

**选项 A**: 不启用实时同步
- ✅ 实现简单
- ✅ 性能更好
- ❌ 多设备不同步（需刷新）

**选项 B**: 启用实时同步（推荐）
- ✅ 跨设备实时更新
- ✅ 多端协作
- ❌ 增加复杂度

**您的选择**：_______

---

### 4. UI 改进

**选项 A**: 删除按钮在移动端始终显示
- ✅ 更直观
- ❌ 界面稍显拥挤

**选项 B**: 添加"编辑模式"切换
- ✅ 界面简洁
- ❌ 多一步操作

**选项 C**: 长按触发删除（移动端）
- ✅ 手势交互自然
- ❌ 需要额外实现

**您的选择**：_______

---

### 5. 数据保留政策

**选项 A**: 永久保留所有数据
- ✅ 用户不会丢失数据
- ❌ 数据库可能很大

**选项 B**: 保留最近 30 天的对话
- ✅ 节省存储空间
- ❌ 老数据会丢失

**选项 C**: 用户自主选择归档策略
- ✅ 灵活性高
- ❌ 需要额外 UI

**您的选择**：_______

---

## 下一步行动

请您确认上述问题后，我将立即开始实施。预计完成时间：

- ✅ **阶段 1**: Supabase 初始化 (30分钟)
- ✅ **阶段 2**: 前端认证集成 (2小时)
- ✅ **阶段 3**: 存储层迁移 (3小时)
- ✅ **阶段 4**: UI 优化 (1小时)
- ✅ **阶段 5**: 测试和部署 (1小时)

**总计**: 7.5 小时（约 1 个工作日）

---

## 附录

### A. Supabase 资源链接

- 官网: https://supabase.com/
- 文档: https://supabase.com/docs
- Next.js 集成: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Auth UI: https://supabase.com/docs/guides/auth/auth-helpers/auth-ui

### B. 相关文件清单

**新增文件**：
- `lib/supabase/client.ts` - 客户端 Supabase 实例
- `lib/supabase/server.ts` - 服务器端 Supabase 实例
- `lib/supabase/database.types.ts` - 数据库类型定义
- `lib/supabase/sessions.ts` - 会话数据访问层
- `app/(auth)/login/page.tsx` - 登录/注册页面
- `app/auth/callback/route.ts` - 认证回调路由
- `middleware.ts` - 路由保护中间件
- `components/data-migration.tsx` - 数据迁移工具
- `components/user-profile.tsx` - 用户信息组件
- `components/logout-button.tsx` - 登出按钮

**修改文件**：
- `hooks/use-session-manager.ts` - 存储层迁移
- `components/conversation-sidebar.tsx` - UI 改进

### C. 环境变量模板

```bash
# .env.local

# OpenAI (已有)
OPENAI_API_KEY=sk-xxx

# Supabase (新增)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# 站点配置 (新增)
NEXT_PUBLIC_SITE_URL=https://realtime.junyaolexiconcom.com
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-13
**作者**: AI 英语口语教练开发团队
