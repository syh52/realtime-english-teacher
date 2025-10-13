interface Conversation {
    id: string; // Unique ID for react rendering and loggin purposes
    role: string; // "user" or "assistant"
    text: string; // User or assistant message
    timestamp: string; // ISO string for message time
    isFinal: boolean; // Whether the transcription is final
    status?: "speaking" | "processing" | "final"; // Status for real-time conversation states
  }

/**
 * Session 接口：表示一个完整的对话会话
 */
interface Session {
  id: string;                   // UUID
  title: string;                // 会话标题（自动生成或用户编辑）
  createdAt: string;            // ISO 时间戳
  updatedAt: string;            // ISO 时间戳
  endedAt?: string;             // 会话结束时间（归档时设置）
  messages: Conversation[];     // 该会话的所有消息
  voice: string;                // 使用的语音
  messageCount: number;         // 消息总数
  isActive: boolean;            // 是否是当前活跃会话
  isArchived: boolean;          // 是否已归档（只读，不可继续对话）
}

/**
 * 本地存储数据结构
 */
interface SessionsData {
  sessions: Session[];
  currentSessionId: string;
  lastSaved: string;
}

/**
 * 生成会话标题
 * 从前几条消息中提取关键词，或使用时间戳
 */
export function generateSessionTitle(messages: Conversation[]): string {
  if (messages.length === 0) {
    return `新对话 - ${new Date().toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  // 找到第一条用户消息
  const firstUserMessage = messages.find(m => m.role === 'user' && m.text.trim());
  if (firstUserMessage) {
    // 取前30个字符作为标题
    const title = firstUserMessage.text.trim().substring(0, 30);
    return title.length < firstUserMessage.text.length ? `${title}...` : title;
  }

  // 如果只有AI消息，使用时间戳
  return `对话 - ${new Date(messages[0].timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;

  return then.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 创建新会话
 */
export function createNewSession(voice: string = 'ash'): Session {
  // 使用 crypto.randomUUID() 代替 uuid 库
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    id,
    title: generateSessionTitle([]),
    createdAt: now,
    updatedAt: now,
    endedAt: undefined,
    messages: [],
    voice,
    messageCount: 0,
    isActive: true,
    isArchived: false,  // 新会话默认未归档
  };
}

export type { Conversation, Session, SessionsData };
  