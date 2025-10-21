# 技术术语和概念详解

> **难度**：🟢 简单（零基础友好）
>
> **用途**：查询不理解的术语
>
> **使用方式**：Ctrl+F 搜索关键词

---

## 📖 使用说明

遇到不懂的技术术语时：
1. 在本页面按 `Ctrl+F`（Windows）或 `Cmd+F`（Mac）
2. 输入术语关键词
3. 阅读详细解释和示例

---

## 🔤 术语索引（按字母排序）

### A

#### API (Application Programming Interface)

**中文**：应用程序编程接口

**是什么**：
- 软件之间交互的规则和方式
- 像"服务员"，帮你和后厨（服务器）沟通

**示例**：
```typescript
// 调用 OpenAI API
fetch('https://api.openai.com/v1/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
})
```

**项目中的应用**：
- OpenAI Realtime API - 实时语音对话
- Next.js API Routes - 服务器端接口

---

#### API Key

**中文**：API 密钥

**是什么**：
- 访问 API 的"门禁卡"
- 证明你有权限使用服务

**示例**：
```
OPENAI_API_KEY=sk-proj-abc123...
```

**为什么重要**：
- 🔒 保密：不能泄露（像银行密码）
- 💰 计费：用多少扣多少钱
- 🚫 限流：防止滥用

**项目中的处理**：
- 存在服务器端 `.env.local`
- 不暴露给前端
- 不提交到 Git

---

#### Async/Await

**中文**：异步等待

**是什么**：
- JavaScript 处理异步操作的语法
- 让异步代码看起来像同步代码

**对比**：
```typescript
// ❌ 老方法（回调地狱）
getData(function(result) {
  processData(result, function(processed) {
    saveData(processed, function(saved) {
      console.log('Done!');
    });
  });
});

// ✅ 新方法（async/await）
async function doWork() {
  const result = await getData();
  const processed = await processData(result);
  const saved = await saveData(processed);
  console.log('Done!');
}
```

**关键字**：
- `async`：标记函数为异步
- `await`：等待 Promise 完成

---

### B

#### Bundle / Bundler

**中文**：打包 / 打包器

**是什么**：
- 将多个文件合并成少数几个文件的工具
- 优化代码体积和加载速度

**为什么需要**：
```
开发时（很多文件）：
├── utils.ts
├── components.tsx
├── hooks.ts
└── ... (100+ 文件)

打包后（少数文件）：
├── app.js (所有 JS 代码)
└── styles.css (所有 CSS)
```

**常见打包器**：
- Webpack（传统）
- Turbopack（Next.js 15 新默认）
- Vite（快速）

---

### C

#### CDN (Content Delivery Network)

**中文**：内容分发网络

**是什么**：
- 全球分布的服务器网络
- 把静态文件缓存到离用户最近的服务器

**类比**：
- 网站在美国，中国用户访问很慢
- CDN 在中国部署服务器，缓存网站内容
- 中国用户访问中国服务器，很快

---

#### Component

**中文**：组件

**是什么**：
- React 中的 UI 构建块
- 可复用的独立 UI 单元

**示例**：
```tsx
// 按钮组件
function Button({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

// 使用组件
<Button onClick={handleClick}>点击我</Button>
```

**项目中的组件**：
- `<ChatLayout />` - 聊天布局
- `<VoiceControlPanel />` - 语音控制
- `<Button />` - 按钮

---

#### CORS (Cross-Origin Resource Sharing)

**中文**：跨域资源共享

**是什么**：
- 浏览器的安全机制
- 限制网页访问不同域名的资源

**问题示例**：
```
你的网站：https://example.com
想访问：https://api.openai.com
浏览器：❌ 跨域！禁止访问！
```

**解决方案**：
1. 服务器设置 CORS 头
2. 使用服务器代理（本项目方案）

---

#### CSS (Cascading Style Sheets)

**中文**：层叠样式表

**是什么**：
- 网页样式语言
- 控制颜色、布局、字体等

**示例**：
```css
.button {
  color: blue;
  padding: 10px;
  border-radius: 5px;
}
```

**项目中使用**：
- Tailwind CSS（实用优先）
- CSS Modules（模块化）

---

### D

#### DOM (Document Object Model)

**中文**：文档对象模型

**是什么**：
- HTML 文档的编程接口
- 将网页表示为节点树

**示例**：
```html
<div id="app">
  <h1>Hello</h1>
  <p>World</p>
</div>
```

转换为 DOM 树：
```
Document
  └── div#app
      ├── h1 (Hello)
      └── p (World)
```

**JavaScript 操作 DOM**：
```javascript
document.getElementById('app');
document.querySelector('.button');
```

---

### E

#### Environment Variable

**中文**：环境变量

**是什么**：
- 配置信息存储方式
- 不同环境（开发/生产）可以有不同值

**示例**：
```bash
# .env.local 文件
OPENAI_API_KEY=sk-proj-abc123
NODE_ENV=development
```

**使用**：
```typescript
const apiKey = process.env.OPENAI_API_KEY;
```

**为什么需要**：
- 🔒 隐藏敏感信息
- 🔄 不同环境不同配置
- ✅ 不提交到 Git

---

#### ESLint

**中文**：JavaScript 代码检查工具

**是什么**：
- 检查代码规范和错误的工具
- 统一团队代码风格

**示例**：
```typescript
// ❌ ESLint 报错
var x = 1;  // 不要用 var，用 const/let

// ✅ 正确
const x = 1;
```

---

### G

#### Git

**中文**：版本控制系统

**是什么**：
- 记录代码修改历史的工具
- 团队协作必备

**基本操作**：
```bash
git add .           # 添加修改
git commit -m "..."  # 提交修改
git push            # 推送到远程
git pull            # 拉取最新代码
```

---

### H

#### Hook (React Hook)

**中文**：钩子

**是什么**：
- React 函数组件中使用状态和副作用的方式
- 以 `use` 开头的特殊函数

**常用 Hooks**：
```typescript
// 状态管理
const [count, setCount] = useState(0);

// 副作用
useEffect(() => {
  console.log('组件加载');
}, []);

// 引用
const ref = useRef(null);

// 自定义 Hook
const { connect, disconnect } = useWebRTC();
```

**项目中的 Hooks**：
- `useState` - 状态管理
- `useEffect` - 副作用处理
- `use-webrtc.ts` - 自定义 WebRTC Hook
- `use-session-manager.ts` - 会话管理 Hook

---

#### HTML (HyperText Markup Language)

**中文**：超文本标记语言

**是什么**：
- 网页结构语言
- 定义网页内容

**示例**：
```html
<div>
  <h1>标题</h1>
  <p>段落</p>
  <button>按钮</button>
</div>
```

---

#### HTTP/HTTPS

**HTTP**：超文本传输协议
**HTTPS**：安全的 HTTP（加密）

**是什么**：
- 浏览器和服务器通信的协议

**区别**：
```
HTTP:  http://example.com  (❌ 不安全，明文传输)
HTTPS: https://example.com (✅ 安全，加密传输)
```

**项目使用**：
- 生产环境：HTTPS（Let's Encrypt 证书）
- 开发环境：HTTP

---

### J

#### JavaScript (JS)

**中文**：JavaScript 编程语言

**是什么**：
- 网页编程语言
- 可以在浏览器和服务器运行

**示例**：
```javascript
// 变量
const name = 'Alice';

// 函数
function greet() {
  console.log('Hello!');
}

// 对象
const user = {
  name: 'Alice',
  age: 30
};
```

---

#### JSON (JavaScript Object Notation)

**中文**：JavaScript 对象表示法

**是什么**：
- 数据交换格式
- 易读易写

**示例**：
```json
{
  "name": "Alice",
  "age": 30,
  "hobbies": ["reading", "coding"]
}
```

**用途**：
- API 数据传输
- 配置文件
- LocalStorage 存储

---

#### JSX (JavaScript XML)

**是什么**：
- React 的语法扩展
- 在 JavaScript 中写 HTML

**示例**：
```tsx
// JSX
const element = <h1>Hello, {name}!</h1>;

// 编译后的 JavaScript
const element = React.createElement('h1', null, `Hello, ${name}!`);
```

**项目中的使用**：
```tsx
return (
  <div className="container">
    <h1>{title}</h1>
    <Button onClick={handleClick}>点击</Button>
  </div>
);
```

---

### L

#### LocalStorage

**中文**：本地存储

**是什么**：
- 浏览器提供的存储 API
- 数据永久保存（除非手动删除）

**示例**：
```typescript
// 保存
localStorage.setItem('key', 'value');

// 读取
const value = localStorage.getItem('key');

// 删除
localStorage.removeItem('key');

// 清空
localStorage.clear();
```

**项目中的使用**：
```typescript
// 保存会话数据
localStorage.setItem('realtime-english-sessions', JSON.stringify(sessions));

// 读取会话数据
const data = JSON.parse(localStorage.getItem('realtime-english-sessions'));
```

**限制**：
- 容量：通常 5-10MB
- 类型：只能存字符串
- 作用域：同一域名

---

### M

#### Markdown

**中文**：轻量级标记语言

**是什么**：
- 纯文本格式的标记语言
- 易读易写

**示例**：
```markdown
# 一级标题
## 二级标题

**粗体** *斜体*

- 列表项 1
- 列表项 2

[链接](https://example.com)
```

---

### N

#### npm (Node Package Manager)

**中文**：Node 包管理器

**是什么**：
- JavaScript 包管理工具
- 安装和管理项目依赖

**常用命令**：
```bash
npm install        # 安装依赖
npm install <pkg>  # 安装包
npm run dev        # 运行脚本
npm run build      # 构建项目
```

---

#### Next.js

**是什么**：
- React 框架
- 提供服务器端渲染、路由、API 等功能

**特点**：
- ✅ 文件系统路由
- ✅ 服务器端渲染（SSR）
- ✅ API Routes
- ✅ 自动代码分割

**项目使用版本**：15.1.1（最新）

---

### P

#### Props (Properties)

**中文**：属性

**是什么**：
- 父组件传给子组件的数据
- 只读，不能修改

**示例**：
```tsx
// 父组件
<Button color="blue" onClick={handleClick}>
  点击我
</Button>

// 子组件接收 props
function Button({ color, onClick, children }) {
  return (
    <button style={{ color }} onClick={onClick}>
      {children}
    </button>
  );
}
```

---

#### Promise

**中文**：承诺对象

**是什么**：
- 异步操作的占位符
- 表示未来的值

**状态**：
- Pending（进行中）
- Fulfilled（已成功）
- Rejected（已失败）

**示例**：
```typescript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功！');
  }, 1000);
});

// 使用 Promise
promise
  .then(result => console.log(result))
  .catch(error => console.error(error));

// 使用 async/await
const result = await promise;
```

---

### R

#### React

**是什么**：
- JavaScript UI 库
- 用于构建用户界面

**核心概念**：
- 组件化
- 虚拟 DOM
- 单向数据流

**示例**：
```tsx
function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

---

#### REST API

**中文**：表述性状态传递 API

**是什么**：
- 一种 API 设计风格
- 使用 HTTP 方法（GET/POST/PUT/DELETE）

**示例**：
```
GET    /api/sessions     # 获取所有会话
GET    /api/sessions/1   # 获取单个会话
POST   /api/sessions     # 创建会话
PUT    /api/sessions/1   # 更新会话
DELETE /api/sessions/1   # 删除会话
```

---

### S

#### SDP (Session Description Protocol)

**中文**：会话描述协议

**是什么**：
- WebRTC 用于描述多媒体会话的格式
- 包含音视频编码、网络信息等

**流程**：
```
1. 前端创建 SDP Offer（提议）
2. 发送给服务器
3. 服务器返回 SDP Answer（应答）
4. 前端接受 Answer
5. WebRTC 连接建立
```

**项目中的使用**：
- `app/api/realtime/route.ts` - 转发 SDP

---

#### State

**中文**：状态

**是什么**：
- 组件的内部数据
- 状态改变会触发重新渲染

**示例**：
```tsx
// 声明状态
const [count, setCount] = useState(0);

// 更新状态
setCount(count + 1);

// 状态更新后，组件重新渲染
```

**状态类型**：
- 本地状态（组件内）
- 全局状态（跨组件）

---

#### SSR (Server-Side Rendering)

**中文**：服务器端渲染

**是什么**：
- 在服务器生成 HTML
- 发送完整 HTML 给浏览器

**对比**：
```
CSR (客户端渲染)：
1. 浏览器下载 JS
2. JS 执行
3. 生成 HTML
4. 显示页面
⏱️ 慢，SEO 差

SSR (服务器端渲染)：
1. 服务器生成 HTML
2. 浏览器显示 HTML
3. JS 加载后接管
⏱️ 快，SEO 好
```

---

### T

#### Tailwind CSS

**是什么**：
- 实用优先的 CSS 框架
- 使用类名直接写样式

**示例**：
```tsx
// 传统 CSS
<div className="container">
  <style>{`.container { padding: 1rem; background: blue; }`}</style>
</div>

// Tailwind CSS
<div className="p-4 bg-blue-500">
</div>
```

**优点**：
- ✅ 快速开发
- ✅ 样式一致
- ✅ 体积小（未使用的类会被删除）

---

#### TypeScript

**是什么**：
- JavaScript 的超集
- 添加了类型系统

**对比**：
```typescript
// JavaScript（无类型检查）
function add(a, b) {
  return a + b;
}
add('hello', 'world'); // ✅ 没有错误提示

// TypeScript（有类型检查）
function add(a: number, b: number): number {
  return a + b;
}
add('hello', 'world'); // ❌ 类型错误！
```

**优点**：
- ✅ 编译时发现错误
- ✅ IDE 智能提示
- ✅ 代码更易维护

---

### U

#### UUID (Universally Unique Identifier)

**中文**：通用唯一识别码

**是什么**：
- 128 位的唯一标识符
- 几乎不可能重复

**格式**：
```
550e8400-e29b-41d4-a716-446655440000
```

**生成**：
```typescript
const id = crypto.randomUUID();
```

**用途**：
- Session ID
- Message ID
- 任何需要唯一标识的场景

---

### W

#### Web Audio API

**是什么**：
- 浏览器音频处理 API
- 可以分析、合成、处理音频

**示例**：
```typescript
// 创建音频上下文
const audioContext = new AudioContext();

// 分析音频
const analyser = audioContext.createAnalyser();

// 获取音量数据
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);
```

**项目中的使用**：
- `use-audio-volume.ts` - 计算音量
- 实时波形显示

---

#### WebRTC (Web Real-Time Communication)

**中文**：网页实时通信

**是什么**：
- 浏览器实时音视频通信技术
- 点对点传输，低延迟

**核心组件**：
```typescript
// 1. 创建连接
const pc = new RTCPeerConnection();

// 2. 添加音频流
pc.addTrack(audioTrack);

// 3. 创建 Offer
const offer = await pc.createOffer();

// 4. 设置本地描述
await pc.setLocalDescription(offer);

// 5. 发送 Offer 给对方
// 6. 收到 Answer 后设置远程描述
await pc.setRemoteDescription(answer);
```

**项目中的使用**：
- `hooks/use-webrtc.ts` - WebRTC 核心逻辑
- `app/api/realtime/route.ts` - 服务器端代理

---

#### WebSocket

**是什么**：
- 全双工通信协议
- 浏览器和服务器保持长连接

**对比**：
```
HTTP:
客户端: 你好 → 服务器
服务器: 你好 → 客户端
（连接关闭）

WebSocket:
客户端 ←→ 服务器
（连接保持，双向通信）
```

---

### 其他

#### Callback (回调函数)

**中文**：回调函数

**是什么**：
- 作为参数传递的函数
- 稍后被调用

**示例**：
```typescript
// 定义回调
function greet(name, callback) {
  console.log(`Hello, ${name}!`);
  callback();
}

// 使用回调
greet('Alice', () => {
  console.log('Callback executed!');
});
```

---

#### Dependency (依赖)

**中文**：依赖包

**是什么**：
- 项目使用的第三方库
- 在 `package.json` 中声明

**类型**：
- dependencies - 生产依赖
- devDependencies - 开发依赖

---

#### Interface (接口)

**中文**：接口

**是什么**：
- TypeScript 中定义对象结构的方式

**示例**：
```typescript
interface User {
  name: string;
  age: number;
  email?: string; // 可选属性
}

const user: User = {
  name: 'Alice',
  age: 30
};
```

---

#### Module (模块)

**中文**：模块

**是什么**：
- 独立的代码文件
- 可以导入导出

**示例**：
```typescript
// utils.ts (导出)
export function add(a, b) {
  return a + b;
}

// app.ts (导入)
import { add } from './utils';
```

---

#### Polyfill

**是什么**：
- 为旧浏览器提供新特性的代码

**示例**：
```typescript
// Array.includes 的 polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function(item) {
    return this.indexOf(item) !== -1;
  };
}
```

---

## 📚 学习建议

### 基础概念优先

1. HTML / CSS / JavaScript
2. JSON
3. HTTP/HTTPS
4. API

### 进阶概念

5. React
6. TypeScript
7. Next.js
8. WebRTC

### 逐步深入

- 遇到不懂的术语，查阅本表
- 理解基础概念后再学习进阶
- 边学边实践

---

## ⏭️ 下一步

查阅完术语后，建议：

1. 返回你正在阅读的文档
2. 继续学习代码逻辑
3. 遇到新术语再回来查阅

---

**术语表是你的好帮手，随时查阅！** 📖
