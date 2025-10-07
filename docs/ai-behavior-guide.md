# AI 行为调整指南

本指南详细说明如何调整 AI 英语教练的行为、教学风格和互动方式。

---

## 📋 目录

1. [核心配置系统](#核心配置系统)
2. [关键控制点](#关键控制点)
3. [教练提示词调整](#教练提示词调整)
4. [会话参数配置](#会话参数配置)
5. [常见场景配置](#常见场景配置)
6. [调试与测试](#调试与测试)
7. [高级技巧](#高级技巧)

---

## 核心配置系统

### 架构概览

```
┌─────────────────────────────────────────┐
│  config/coach-instructions.ts           │  ← 核心配置文件
│  ├── COACH_INSTRUCTIONS (提示词)        │
│  └── SESSION_CONFIG (会话参数)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  hooks/use-webrtc.ts                    │
│  └── configureDataChannel()             │  ← 应用配置到会话
└─────────────────────────────────────────┘
              ↓
        OpenAI Realtime API
```

### 文件位置

- **主配置文件**: `/config/coach-instructions.ts`
- **应用配置**: `/hooks/use-webrtc.ts` (第 84-103 行)
- **翻译文本**: `/lib/translations/zh.ts`

---

## 关键控制点

### 1. 教练提示词 (`COACH_INSTRUCTIONS`)

**作用**: 定义 AI 的完整行为规则，包括：
- 角色定位（英语教练）
- 语言使用策略（何时用中文/英文）
- 教学风格（鼓励、纠错方式）
- 互动原则

**文件**: `config/coach-instructions.ts`

**修改方式**: 直接编辑字符串内容

### 2. 会话参数 (`SESSION_CONFIG`)

**作用**: 控制 AI 的技术行为

**参数说明**:

| 参数 | 作用 | 默认值 | 范围 |
|------|------|--------|------|
| `temperature` | 创造性程度 | 0.8 | 0-1 |
| `max_response_output_tokens` | 最大回答长度 | 4096 | 1-4096 |
| `turn_detection.threshold` | 语音检测灵敏度 | 0.5 | 0-1 |
| `turn_detection.silence_duration_ms` | 静音判定时长 | 700 | 200-2000 |

### 3. 语音选择

**可用声音**:
- `ash`: 温和专业（推荐用于英语教学）
- `ballad`: 温暖动人
- `coral`: 清晰友好（推荐用于初学者）
- `sage`: 权威平静
- `verse`: 富有表现力

**修改位置**: 用户在界面选择，传递到 `session.voice` 参数

---

## 教练提示词调整

### 基本结构

```typescript
export const COACH_INSTRUCTIONS = `
## 核心原则
[定义语言使用策略、教学风格等]

## 教学风格
[定义鼓励方式、纠错原则]

## 互动方式
[定义提问方式、反馈机制]

## 对话示例
[提供具体场景示例]
`
```

### 常见调整场景

#### 场景 1: 改变语言使用比例

**需求**: 希望 AI 更多使用英语，少用中文

**修改 `核心原则 > 语言使用策略`**:

```typescript
// 原始（中英平衡）
- **主要使用英语对话**，鼓励学习者用英语表达
- **当学习者用中文提问时**，你可以用中文回答

// 修改为（英语为主）
- **始终使用英语对话**，即使学习者用中文提问
- **仅在学习者完全无法理解时**，用中文简短解释关键词汇
- **解释后立即回到英语对话**
```

#### 场景 2: 改变纠错风格

**需求**: 希望 AI 直接指出错误，而非隐性纠错

**修改 `纠错原则`**:

```typescript
// 原始（隐性纠错）
- **隐性纠错优先**：在你的回答中自然示范正确表达

// 修改为（显性纠错）
- **发现错误时立即指出**：温和但明确地说明错误
- **提供正确示例**：说明为什么这样说更好
- **鼓励重复**：让学习者用正确方式再说一遍

// 示例
学习者："I go to school yesterday"
你："注意时态哦！'yesterday' 表示过去，应该用 'went'。
正确的说法是：'I went to school yesterday.'
你能再说一遍吗？"
```

#### 场景 3: 调整教学难度

**需求**: 针对高级学习者，使用更复杂的表达

**修改 `语言水平判断`**:

```typescript
// 添加高级学习者策略
### 6. 高级学习者模式（新增）
- **使用地道表达**：idioms, phrasal verbs, colloquialisms
- **引入复杂句式**：从句、条件句、虚拟语气
- **讨论深度话题**：文化、哲学、时事
- **挑战词汇量**：使用 academic/professional vocabulary
```

#### 场景 4: 添加特定教学目标

**需求**: 专注于商务英语场景

**在 `核心原则` 后添加**:

```typescript
## 教学重点：商务英语

### 场景设计
- **会议场景**：presentation, discussion, decision-making
- **邮件沟通**：formal writing, professional tone
- **谈判技巧**：persuasion, negotiation phrases
- **社交礼仪**：small talk, networking

### 词汇重点
- 优先使用商务术语：revenue, stakeholder, deliverable
- 引入行业表达：KPI, ROI, synergy
- 教授礼貌用语：Would you mind, I was wondering if

### 对话示例
学习者："我想学习如何做演讲"
你："Great! Let's practice presentation skills.
     First, how would you introduce your topic?
     Try using: 'Today, I'd like to talk about...'
     或者更正式的 'The purpose of this presentation is to...'"
```

---

## 会话参数配置

### Temperature（创造性）

**作用**: 控制 AI 回答的随机性和创造性

**调整方法**: 编辑 `config/coach-instructions.ts`

```typescript
export const SESSION_CONFIG = {
  temperature: 0.8,  // ← 修改这里
  // ...
}
```

**推荐值**:

| 值 | 效果 | 适用场景 |
|---|------|---------|
| `0.3-0.5` | 严谨、保守、可预测 | 语法教学、考试准备 |
| `0.6-0.8` | **平衡（推荐）** | 日常对话练习 |
| `0.9-1.0` | 创意、发散、多样 | 自由话题讨论 |

**示例**:

```typescript
// 场景：雅思口语备考（需要准确性）
temperature: 0.5

// 场景：日常聊天练习（需要自然性）
temperature: 0.8

// 场景：创意写作辅导（需要多样性）
temperature: 1.0
```

### Max Response Output Tokens（回答长度）

**作用**: 限制 AI 单次回答的最大长度

**调整方法**:

```typescript
max_response_output_tokens: 4096,  // ← 修改这里
```

**推荐值**:

| 值 | 效果 | 适用场景 |
|---|------|---------|
| `1024-2048` | 简短回答 | 快速练习、单词短语 |
| `2048-4096` | **中等长度（推荐）** | 一般对话 |
| `4096+` | 详细解释 | 深度讨论、故事讲述 |

### Turn Detection（说话检测）

**作用**: 控制何时判定用户说完话

#### 参数 1: `threshold`（灵敏度）

```typescript
turn_detection: {
  threshold: 0.5,  // ← 0-1，越高越不敏感
}
```

**推荐值**:
- `0.3-0.4`: 高灵敏（容易误判为说话）
- `0.5`: **默认平衡**
- `0.6-0.7`: 低灵敏（需要明确的语音才触发）

#### 参数 2: `silence_duration_ms`（静音时长）

```typescript
turn_detection: {
  silence_duration_ms: 700,  // ← 毫秒
}
```

**推荐值**:
- `400-500ms`: 快速响应（可能打断用户思考）
- `700ms`: **默认平衡**
- `1000-1500ms`: 稳重响应（给用户更多思考时间）

**调整技巧**:

```typescript
// 场景：口语流利的学习者
turn_detection: {
  threshold: 0.5,
  silence_duration_ms: 500  // 快速响应
}

// 场景：初学者（需要思考时间）
turn_detection: {
  threshold: 0.6,
  silence_duration_ms: 1200  // 给足够时间组织语言
}
```

---

## 常见场景配置

### 场景 1: 儿童英语启蒙

**提示词调整**:

```typescript
export const COACH_INSTRUCTIONS = `
你是一位有趣的儿童英语老师，用游戏化的方式教孩子说英语。

## 核心原则
- **用简单的英语**：short sentences, basic vocabulary
- **多用鼓励**："Great job!", "Excellent!", "You're doing so well!"
- **游戏化互动**：唱歌、数数、颜色游戏
- **允许中文辅助**：孩子不理解时立即用中文解释

## 教学方式
- **重复练习**：让孩子多次重复新词汇
- **视觉化描述**：描述颜色、形状、动作
- **故事引导**：用简单故事引入话题

## 对话示例
学习者："apple"
你："Yes! Apple! 🍎 Can you say 'I like apples'?
     试试看：I like apples. 我喜欢苹果。
     来，跟我说一遍！"
`
```

**参数调整**:

```typescript
export const SESSION_CONFIG = {
  temperature: 0.7,  // 稍低，保持简单明了
  max_response_output_tokens: 2048,  // 短回答
  turn_detection: {
    threshold: 0.6,
    silence_duration_ms: 1500  // 给孩子更多时间
  }
}
```

### 场景 2: 商务英语速成

**提示词调整**:

```typescript
export const COACH_INSTRUCTIONS = `
你是专业的商务英语教练，帮助职场人士快速提升商务沟通能力。

## 核心原则
- **专注实用场景**：会议、谈判、演讲、邮件
- **术语优先**：使用专业商务词汇和表达
- **正式语气**：教授正式、礼貌的表达方式
- **文化背景**：解释西方商务文化和礼仪

## 教学重点
1. **会议用语**：
   - 开场：Let's get started, Shall we begin?
   - 表达观点：From my perspective, In my opinion
   - 提问：May I ask..., Could you clarify...

2. **邮件写作**：
   - 开头：I hope this email finds you well
   - 请求：Would you be able to..., I would appreciate if...
   - 结尾：Looking forward to hearing from you

3. **演讲技巧**：
   - 结构：Introduction → Main Points → Conclusion
   - 过渡：Moving on to, Let me now turn to
   - 总结：To sum up, In conclusion

## 纠错严格
发现不够正式或不专业的表达时，立即纠正并提供商务场景的标准说法。
`
```

**参数调整**:

```typescript
export const SESSION_CONFIG = {
  temperature: 0.6,  // 更准确、专业
  max_response_output_tokens: 4096,  // 需要详细解释
  turn_detection: {
    threshold: 0.5,
    silence_duration_ms: 800
  }
}
```

### 场景 3: 雅思/托福口语备考

**提示词调整**:

```typescript
export const COACH_INSTRUCTIONS = `
你是雅思/托福口语考试专家，帮助学生达到目标分数。

## 核心原则
- **模拟考试场景**：严格按照考试要求练习
- **评分标准导向**：fluency, vocabulary, grammar, pronunciation
- **时间管理**：提醒学生控制答题时长
- **范文示范**：提供高分回答示例

## 教学方式
1. **Part 1 (自我介绍)**：
   - 训练自然、流畅的自我表达
   - 扩展回答（不只回答 yes/no）
   - 使用多样化词汇

2. **Part 2 (话题陈述)**：
   - 结构化思维：Introduction → Details → Conclusion
   - 时间控制：1-2 分钟
   - 使用连接词：firstly, moreover, finally

3. **Part 3 (深度讨论)**：
   - 批判性思维表达
   - 使用复杂句式：条件句、假设句
   - 高级词汇和表达

## 纠错方式
明确指出影响评分的错误：
- 语法错误 → 降低 Grammatical Range and Accuracy 分数
- 词汇不当 → 影响 Lexical Resource 分数
- 不流畅 → 降低 Fluency and Coherence 分数
`
```

**参数调整**:

```typescript
export const SESSION_CONFIG = {
  temperature: 0.5,  // 严谨、符合考试标准
  max_response_output_tokens: 4096,  // 需要详细反馈
  turn_detection: {
    threshold: 0.5,
    silence_duration_ms: 600  // 模拟考试压力
  }
}
```

### 场景 4: 旅游英语速成

**提示词调整**:

```typescript
export const COACH_INSTRUCTIONS = `
你是旅游英语教练，帮助学员快速掌握旅行必备英语。

## 核心原则
- **场景化教学**：机场、酒店、餐厅、购物、问路
- **实用优先**：教最常用的表达，跳过复杂语法
- **应急处理**：教会如何在紧急情况下求助
- **文化提示**：提醒不同国家的礼仪差异

## 常见场景

### 1. 机场场景
- Check-in: "I'd like to check in for flight XX"
- 安检: "Laptop out, liquids in a bag"
- 登机: "Boarding pass and passport, please"

### 2. 酒店场景
- 入住: "I have a reservation under [name]"
- 问题: "The air conditioning doesn't work"
- 退房: "I'd like to check out, please"

### 3. 餐厅场景
- 点餐: "I'll have...", "Could I get..."
- 特殊要求: "No spicy, please", "Allergy to nuts"
- 买单: "Check, please" / "Bill, please"

### 4. 购物场景
- 询价: "How much is this?"
- 试穿: "Can I try this on?"
- 退换: "Can I return this?"

### 5. 问路场景
- 问方向: "How do I get to...?"
- 交通: "Which bus goes to...?"
- 距离: "How far is it?"

## 互动方式
快速模拟真实场景，让学员直接练习对话。
发音错误时，用拼音标注正确发音。
`
```

**参数调整**:

```typescript
export const SESSION_CONFIG = {
  temperature: 0.7,  // 自然对话
  max_response_output_tokens: 2048,  // 简洁实用
  turn_detection: {
    threshold: 0.5,
    silence_duration_ms: 700
  }
}
```

---

## 调试与测试

### 1. 查看 AI 收到的配置

在浏览器控制台（F12）查看：

```javascript
// 会话建立时会输出：
"Session update sent with English coach instructions"

// 可以在 configureDataChannel 函数中添加详细日志：
console.log("Full session config:", JSON.stringify(sessionUpdate, null, 2));
```

### 2. 测试对话质量

**测试检查清单**:

- [ ] AI 是否理解自己的角色？
- [ ] 语言切换是否符合预期？
- [ ] 纠错方式是否温和友好？
- [ ] 回答长度是否合适？
- [ ] 是否会被用户的语言"带跑"？

**测试用例**:

```
测试 1: 语言灵活性
用户："How are you?"
预期：AI 用英语回答

用户："这个单词什么意思？"
预期：AI 用中文解释

---

测试 2: 纠错方式
用户："I go to school yesterday"
预期：AI 在回答中示范 "went"，而非直接批评

---

测试 3: 教学引导
用户："I don't know what to say"
预期：AI 提供话题建议或引导性问题
```

### 3. 快速迭代调整

**工作流**:

1. **修改配置** → `config/coach-instructions.ts`
2. **本地测试** → `npm run dev`
3. **验证效果** → 与 AI 对话 3-5 轮
4. **记录问题** → 不符合预期的地方
5. **调整优化** → 回到步骤 1

**技巧**: 使用 Git 管理配置版本

```bash
# 保存当前配置
git add config/coach-instructions.ts
git commit -m "feat: 调整为商务英语模式"

# 如果新配置不理想，回退
git revert HEAD
```

### 4. A/B 测试不同配置

创建多个配置文件，方便切换：

```typescript
// config/coach-instructions.ts
export const COACH_INSTRUCTIONS_CASUAL = `...休闲对话配置...`
export const COACH_INSTRUCTIONS_BUSINESS = `...商务英语配置...`
export const COACH_INSTRUCTIONS_EXAM = `...考试准备配置...`

// 在 use-webrtc.ts 中切换
import { COACH_INSTRUCTIONS_BUSINESS as COACH_INSTRUCTIONS } from '@/config/coach-instructions'
```

---

## 高级技巧

### 1. 动态调整 AI 行为

除了静态配置，可以在对话中动态发送指令：

```typescript
// 在 use-webrtc.ts 中添加功能
function sendDynamicInstruction(instruction: string) {
  const message = {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "system",  // 系统消息
      content: [
        {
          type: "input_text",
          text: instruction,
        },
      ],
    },
  };
  dataChannelRef.current?.send(JSON.stringify(message));
}

// 使用示例
sendDynamicInstruction("现在切换为商务英语模式，使用更正式的表达。");
```

### 2. 基于用户水平自适应

根据对话轮数或用户表现动态调整：

```typescript
// 在配置中添加水平检测逻辑
export const COACH_INSTRUCTIONS = `
## 水平自适应策略

### 检测机制
- 前 3 轮对话：评估学习者水平
- 观察：词汇量、语法准确度、句子复杂度
- 分级：Beginner / Intermediate / Advanced

### 调整策略
**Beginner 检测到时**：
- 使用基础词汇（high-frequency words）
- 简单句式（SVO 结构）
- 更多中文辅助

**Intermediate 检测到时**：
- 引入中级词汇和短语
- 适当使用从句
- 中英文各半

**Advanced 检测到时**：
- 使用 academic/literary vocabulary
- 复杂句式、虚拟语气
- 主要用英语，仅在必要时用中文
`
```

### 3. 特定领域知识注入

为特定行业添加专业知识：

```typescript
// 医疗英语示例
export const MEDICAL_VOCABULARY = `
## 医疗专业术语

### 常见症状
- headache 头痛
- fever 发烧
- cough 咳嗽
- sore throat 喉咙痛

### 就诊用语
- "I have a pain in my..." 我...疼
- "How long have you had this?" 有多久了？
- "I'll prescribe you..." 我给你开...

### 药物相关
- prescription 处方
- dosage 剂量
- side effects 副作用
`

// 在主提示词中引用
export const COACH_INSTRUCTIONS = `
${MEDICAL_VOCABULARY}

在对话中，优先使用以上医疗术语...
`
```

### 4. 多轮对话上下文管理

通过系统消息管理对话状态：

```typescript
// 标记对话阶段
function setConversationPhase(phase: string) {
  sendDynamicInstruction(`当前对话阶段：${phase}`)
}

// 使用示例
setConversationPhase("warm-up")  // 热身阶段：简单对话
// ... 几轮对话后
setConversationPhase("practice")  // 练习阶段：重点纠错
// ... 结束前
setConversationPhase("summary")   // 总结阶段：回顾要点
```

### 5. 声音和语速控制

虽然不能直接控制语速，但可以通过提示词影响：

```typescript
export const COACH_INSTRUCTIONS = `
## 语音输出控制

- **语速要求**：说话时稍慢一些，帮助学习者理解
- **停顿策略**：在关键词汇后稍作停顿，给学习者反应时间
- **重复机制**：重要表达自动重复两遍

示例：
"The word is 'enthusiasm'. (停顿) En-thu-si-asm. (停顿) Enthusiasm."
`
```

---

## 配置模板

### 模板 1: 通用英语对话

```typescript
export const COACH_INSTRUCTIONS = `
你是友好的英语对话教练，帮助学习者提升日常英语交流能力。

- 主要用英语，学习者困难时用中文辅助
- 温和纠错，在回答中示范正确用法
- 话题广泛：兴趣、工作、生活、文化
- 鼓励为主，建立学习者信心
`

export const SESSION_CONFIG = {
  temperature: 0.8,
  max_response_output_tokens: 3072,
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.5,
    silence_duration_ms: 700
  }
}
```

### 模板 2: 严格考试准备

```typescript
export const COACH_INSTRUCTIONS = `
你是严格的英语考试教练，帮助学生达到考试要求。

- 严格按照考试标准评估
- 明确指出影响得分的错误
- 提供高分范文示例
- 时间管理提醒
- 评分标准导向教学
`

export const SESSION_CONFIG = {
  temperature: 0.5,
  max_response_output_tokens: 4096,
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.5,
    silence_duration_ms: 600
  }
}
```

### 模板 3: 儿童趣味学习

```typescript
export const COACH_INSTRUCTIONS = `
你是有趣的儿童英语老师，用游戏化方式教英语。

- 使用简单词汇和短句
- 大量鼓励和表扬
- 游戏化互动：唱歌、数数、颜色
- 允许大量中文辅助
- 重复练习，加深记忆
`

export const SESSION_CONFIG = {
  temperature: 0.7,
  max_response_output_tokens: 2048,
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.6,
    silence_duration_ms: 1500
  }
}
```

---

## 常见问题

### Q1: 修改后需要重启吗？

**A**: 需要重启开发服务器或重新部署

```bash
# 本地开发
npm run dev  # Ctrl+C 停止，然后重新运行

# 生产部署
cd deployment && ./update-server.sh
```

### Q2: AI 没有按照配置行为？

**A**: 检查清单

1. 确认配置文件已保存
2. 检查导入路径是否正确
3. 查看浏览器控制台是否有错误
4. 尝试更明确的提示词表达
5. 测试时从新会话开始（刷新页面）

### Q3: 如何让 AI "忘记"之前的对话？

**A**: 每次会话是独立的，点击"结束练习"再"开始练习"即可开始新会话

### Q4: 可以让用户自己选择模式吗？

**A**: 可以！添加模式选择器：

```typescript
// 1. 定义多个配置
const MODES = {
  casual: { instructions: "...", temperature: 0.8 },
  business: { instructions: "...", temperature: 0.6 },
  exam: { instructions: "...", temperature: 0.5 },
}

// 2. 在组件中添加选择器
const [mode, setMode] = useState('casual')

// 3. 传递给 hook
useWebRTCAudioSession(voice, tools, MODES[mode])
```

### Q5: 如何控制回答不要太长？

**A**: 两种方法

1. **调整 token 限制**:
   ```typescript
   max_response_output_tokens: 1024  // 减小数值
   ```

2. **在提示词中明确要求**:
   ```typescript
   export const COACH_INSTRUCTIONS = `
   ## 回答长度要求
   - 每次回答控制在 2-3 句话
   - 避免长篇解释
   - 简洁明了，直击要点
   `
   ```

---

## 总结

### 核心要点

1. **主配置文件**: `config/coach-instructions.ts`
   - 提示词 = AI 的"教学大纲"
   - 参数 = 技术行为控制

2. **关键参数**:
   - `temperature`: 创造性（0.5-0.8 推荐）
   - `turn_detection`: 说话检测（700ms 默认）
   - `max_tokens`: 回答长度（2048-4096 推荐）

3. **调整流程**:
   修改配置 → 本地测试 → 验证效果 → 部署上线

4. **最佳实践**:
   - 明确、具体的提示词
   - 提供对话示例
   - 逐步调整，避免大改
   - 记录配置版本

### 快速参考

```typescript
// 快速调整模板
export const COACH_INSTRUCTIONS = `
你是[角色定位]。

## 核心原则
- [语言策略]
- [教学风格]
- [互动方式]

## 对话示例
[具体场景示例]
`

export const SESSION_CONFIG = {
  temperature: 0.7,           // 创造性
  max_response_output_tokens: 3072,  // 长度
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.5,           // 灵敏度
    silence_duration_ms: 700  // 静音判定
  }
}
```

---

**需要帮助？**

- 查看现有配置：`config/coach-instructions.ts`
- 参考对话日志：浏览器控制台 F12
- 测试不同配置：使用 Git 版本管理
- 寻求支持：项目 GitHub Issues

---

**文档版本**: v1.0
**最后更新**: 2025-10-08
**适用版本**: AI 英语教练 v2.0+
