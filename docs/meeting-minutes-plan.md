# 会议纪要功能 - 技术方案和实施计划

## 📌 功能概述

### 核心功能
基于音频文件自动生成结构化的会议纪要，包括：
- 音频文件上传（支持多种格式）
- 自动语音转文字（使用 OpenAI Whisper API）
- AI 智能生成会议纪要（使用 GPT-4）
- 导出为 Markdown/PDF
- 历史记录管理

### 用户场景
1. 用户上传会议录音文件
2. 系统自动转录为文字
3. AI 分析并生成结构化纪要
4. 用户可查看、编辑、导出纪要
5. 保存到本地历史记录

---

## 🎯 技术方案

### 方案 A：使用 OpenAI Whisper API + GPT-4（推荐）⭐

#### 优点
- ✅ 与现有项目技术栈一致（已使用 OpenAI）
- ✅ Whisper 转录准确率高（支持中英文）
- ✅ GPT-4 生成质量优秀
- ✅ 同一个 API Key
- ✅ 实现简单

#### 成本
- Whisper API: $0.006 / 分钟
- GPT-4: $0.03 / 1K tokens (输入)
- 示例：30 分钟会议 ≈ $0.18（Whisper）+ $0.15（GPT-4）≈ $0.33

#### 技术实现
```
音频文件 → Whisper API → 文字转录 → GPT-4 → 结构化纪要
```

---

## 📊 数据结构设计

### TypeScript 类型定义

```typescript
// 会议记录
interface Meeting {
  id: string;                    // UUID
  title: string;                 // 会议标题
  audioFile: {
    name: string;
    size: number;
    duration?: number;
    format: string;
  };
  transcript: string;            // 完整转录文本
  summary: MeetingSummary;       // 会议纪要
  createdAt: string;
  status: 'uploading' | 'transcribing' | 'generating' | 'completed' | 'error';
}

// 会议纪要
interface MeetingSummary {
  overview: string;              // 会议概述
  keyPoints: string[];           // 关键要点
  decisions: string[];           // 决策事项
  actionItems: ActionItem[];     // 行动项
  participants?: string[];       // 参会人员
  nextSteps?: string[];         // 后续步骤
}

// 行动项
interface ActionItem {
  task: string;                  // 任务描述
  assignee?: string;             // 负责人
  deadline?: string;             // 截止日期
  priority?: 'high' | 'medium' | 'low';
}

// 处理进度
interface ProcessingProgress {
  stage: 'upload' | 'transcribe' | 'summarize' | 'complete';
  progress: number;              // 0-100
  message: string;
  error?: string;
}
```

---

## 🏗️ 系统架构

### 前端架构

```
app/meeting-minutes/page.tsx (主页面)
  ├── FileUpload (文件上传组件)
  ├── ProgressIndicator (进度显示)
  ├── TranscriptView (转录文本查看)
  ├── SummaryView (纪要查看/编辑)
  ├── ExportOptions (导出选项)
  └── HistoryList (历史记录)
```

### 后端架构

```
app/api/meeting-minutes/
  ├── transcribe/route.ts        # Whisper API 转录
  ├── summarize/route.ts         # GPT-4 生成纪要
  └── export/route.ts            # 导出功能
```

### 数据流

```
1. 用户上传音频
   ↓
2. 前端：验证文件（格式、大小）
   ↓
3. 后端 /transcribe：Whisper 转录
   ↓ (实时进度更新)
4. 前端：显示转录文本
   ↓
5. 后端 /summarize：GPT-4 生成纪要
   ↓ (实时进度更新)
6. 前端：显示结构化纪要
   ↓
7. 用户：查看、编辑、导出
   ↓
8. LocalStorage：保存历史
```

---

## 🎨 UI/UX 设计

### 页面布局

```
┌─────────────────────────────────────────────┐
│  Header: 会议纪要生成器                      │
├─────────────────────────────────────────────┤
│                                              │
│  📁 上传区域                                 │
│  ┌────────────────────────────────────────┐ │
│  │  [拖拽上传] 或 [点击选择文件]          │ │
│  │  支持：mp3, m4a, wav, webm (最大100MB) │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  📊 处理进度                                 │
│  ┌────────────────────────────────────────┐ │
│  │  ████████████░░░░ 60%                   │ │
│  │  正在生成会议纪要...                    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  📝 转录文本 [标签页]                        │
│  ┌────────────────────────────────────────┐ │
│  │  [转录文本内容...]                      │ │
│  │  [可编辑]                               │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  📋 会议纪要 [标签页]                        │
│  ┌────────────────────────────────────────┐ │
│  │  会议概述：...                          │ │
│  │  关键要点：                             │ │
│  │    • 要点 1                             │ │
│  │    • 要点 2                             │ │
│  │  决策事项：...                          │ │
│  │  行动项：                               │ │
│  │    ☐ 任务 1 [@负责人] [截止日期]       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [⬇️ 导出 Markdown] [📄 导出 PDF]           │
│                                              │
│  📚 历史记录                                 │
│  • 产品会议 - 2025-10-21 [查看]            │
│  • 技术评审 - 2025-10-20 [查看]            │
│                                              │
└─────────────────────────────────────────────┘
```

### 用户体验设计

1. **上传体验**
   - 拖拽上传支持
   - 文件格式和大小验证
   - 上传进度显示

2. **处理进度**
   - 分阶段显示（转录 → 生成纪要）
   - 实时进度百分比
   - 预估剩余时间

3. **结果展示**
   - 标签页切换（转录/纪要）
   - 可编辑的纪要
   - 一键复制/导出

4. **历史管理**
   - 按时间排序
   - 搜索功能
   - 删除/重新生成

---

## 🔧 技术实现细节

### 1. 文件上传处理

```typescript
// 前端验证
const ALLOWED_FORMATS = ['mp3', 'm4a', 'wav', 'webm', 'mp4'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function validateAudioFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_FORMATS.includes(ext!) && file.size <= MAX_FILE_SIZE;
}

// 使用 FormData 上传
const formData = new FormData();
formData.append('audio', file);
```

### 2. Whisper API 转录

```typescript
// app/api/meeting-minutes/transcribe/route.ts
import OpenAI from 'openai';

export async function POST(request: Request) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'zh', // 或 'en'，或不指定自动检测
    response_format: 'verbose_json', // 包含时间戳
  });

  return Response.json({
    transcript: transcription.text,
    duration: transcription.duration,
  });
}
```

### 3. GPT-4 生成纪要

```typescript
// app/api/meeting-minutes/summarize/route.ts
const prompt = `
请根据以下会议转录内容，生成结构化的会议纪要：

转录文本：
${transcript}

请以 JSON 格式返回，包含以下字段：
- overview: 会议概述（2-3 句话）
- keyPoints: 关键要点列表
- decisions: 决策事项列表
- actionItems: 行动项列表（包含任务描述、负责人、截止日期）
- participants: 参会人员列表（如果能识别）
- nextSteps: 后续步骤

请确保内容准确、简洁、结构化。
`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '你是一个专业的会议记录助手。' },
    { role: 'user', content: prompt }
  ],
  response_format: { type: 'json_object' },
});
```

### 4. 进度更新（实时反馈）

使用 Server-Sent Events (SSE) 或轮询：

```typescript
// 方案 A: SSE（推荐）
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // 发送进度更新
  async function sendProgress(stage: string, progress: number) {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ stage, progress })}\n\n`)
    );
  }

  // 处理流程
  (async () => {
    await sendProgress('transcribing', 0);
    // ... 转录
    await sendProgress('transcribing', 50);
    // ... 完成
    await sendProgress('summarizing', 50);
    // ... 生成纪要
    await sendProgress('complete', 100);
    await writer.close();
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### 5. 导出功能

```typescript
// Markdown 导出
function exportToMarkdown(meeting: Meeting): string {
  return `
# ${meeting.title}

**日期**: ${new Date(meeting.createdAt).toLocaleString()}

## 会议概述

${meeting.summary.overview}

## 关键要点

${meeting.summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 决策事项

${meeting.summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

## 行动项

${meeting.summary.actionItems.map(item => `
- [ ] ${item.task}
  - 负责人: ${item.assignee || '待分配'}
  - 截止日期: ${item.deadline || '待定'}
`).join('\n')}

---

## 完整转录

${meeting.transcript}
  `;
}

// 触发下载
function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 💰 成本估算

### OpenAI API 成本

| 服务 | 定价 | 示例 |
|------|------|------|
| Whisper | $0.006 / 分钟 | 30 分钟 = $0.18 |
| GPT-4o | $0.0025 / 1K tokens (输入) | 5K tokens = $0.0125 |
| GPT-4o | $0.01 / 1K tokens (输出) | 1K tokens = $0.01 |

**总成本示例**（30 分钟会议）：
- Whisper 转录：$0.18
- GPT-4 生成纪要：$0.03
- **合计**：约 $0.21 / 次

---

## 🎯 MVP 功能范围

### 必须包含（MVP）
1. ✅ 音频文件上传（拖拽 + 点击）
2. ✅ 文件格式验证（mp3, m4a, wav）
3. ✅ Whisper 转录
4. ✅ GPT-4 生成结构化纪要
5. ✅ 进度显示
6. ✅ 转录文本查看
7. ✅ 纪要查看
8. ✅ Markdown 导出
9. ✅ LocalStorage 历史记录
10. ✅ 基础错误处理

### 暂不包含（后续版本）
- ❌ PDF 导出
- ❌ 音频播放器
- ❌ 实时转录（边录边转）
- ❌ 多语言切换
- ❌ 云端存储同步
- ❌ 分享功能
- ❌ 协作编辑

---

## 📁 文件结构

```
app/
├── meeting-minutes/
│   └── page.tsx                    # 主页面

app/api/meeting-minutes/
├── transcribe/
│   └── route.ts                    # Whisper 转录 API
├── summarize/
│   └── route.ts                    # GPT-4 生成纪要 API
└── export/
    └── route.ts                    # 导出 API（可选）

hooks/
└── use-meeting-minutes.ts          # 自定义 Hook

types/
└── meeting-minutes.ts              # TypeScript 类型定义

components/meeting-minutes/
├── FileUploader.tsx                # 文件上传组件
├── ProgressIndicator.tsx           # 进度指示器
├── TranscriptView.tsx              # 转录查看
├── SummaryView.tsx                 # 纪要查看
└── HistoryList.tsx                 # 历史列表
```

---

## ⏱️ 开发时间估算

| 阶段 | 任务 | 时间 |
|------|------|------|
| 1 | 类型定义和数据结构 | 1h |
| 2 | 后端 API（Whisper + GPT-4） | 4-6h |
| 3 | 文件上传组件 | 2-3h |
| 4 | 自定义 Hook | 2-3h |
| 5 | 主页面和 UI 组件 | 6-8h |
| 6 | 进度显示和错误处理 | 2-3h |
| 7 | 导出功能 | 2h |
| 8 | 历史记录管理 | 2h |
| 9 | 样式优化和测试 | 2-3h |
| **总计** | | **23-31 小时** |

**建议**：分 2-3 天完成，每天 6-8 小时。

---

## 🚀 实施步骤

### 第 1 步：创建类型定义（1h）
- `types/meeting-minutes.ts`

### 第 2 步：实现后端 API（4-6h）
- Whisper 转录 API
- GPT-4 纪要生成 API

### 第 3 步：创建自定义 Hook（2-3h）
- `hooks/use-meeting-minutes.ts`

### 第 4 步：实现前端页面（6-8h）
- 文件上传组件
- 进度显示
- 结果展示

### 第 5 步：添加导出功能（2h）
- Markdown 导出

### 第 6 步：历史记录管理（2h）
- LocalStorage 存储
- 历史列表

### 第 7 步：测试和优化（2-3h）
- 端到端测试
- 错误处理
- 性能优化

---

## ✅ 验收标准

### 功能测试
- [ ] 上传 mp3 文件成功
- [ ] 转录准确率 > 90%
- [ ] 纪要结构完整
- [ ] 导出 Markdown 格式正确
- [ ] 历史记录保存正常

### 性能测试
- [ ] 30 分钟音频 < 2 分钟处理完成
- [ ] 文件上传 < 10 秒（100MB）
- [ ] UI 响应流畅

### 用户体验
- [ ] 进度反馈清晰
- [ ] 错误提示友好
- [ ] 移动端适配

---

## 🔒 安全考虑

1. **文件大小限制**：100MB
2. **文件格式验证**：只允许音频格式
3. **API Key 保护**：服务器端存储
4. **文件临时存储**：处理完立即删除
5. **用户数据**：只存储在本地浏览器

---

## 📝 后续优化方向

1. **PDF 导出**：使用 jsPDF 或 puppeteer
2. **音频播放器**：与转录文本同步
3. **实时转录**：WebSocket 流式处理
4. **多语言**：自动检测或用户选择
5. **云端同步**：用户账号系统
6. **协作功能**：多人编辑纪要
7. **模板系统**：不同会议类型的模板

---

## 🎉 总结

这是一个**实用性强**、**技术成熟**的功能：

✅ **技术栈一致**：使用现有的 OpenAI API
✅ **成本可控**：约 $0.21 / 30 分钟会议
✅ **用户价值高**：大幅提高会议效率
✅ **实现难度适中**：MVP 约 23-31 小时

---

**准备好开始实施了吗？** 🚀
