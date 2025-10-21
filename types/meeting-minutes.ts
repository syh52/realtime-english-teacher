// Meeting Minutes 功能的类型定义

/**
 * 会议音频文件格式
 * 支持的格式：mp3, m4a, wav, webm
 */
export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'webm';

/**
 * 任务优先级
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 会议处理状态
 */
export type ProcessingStatus =
  | 'uploading'      // 正在上传音频文件
  | 'transcribing'   // 正在转录音频为文字
  | 'generating'     // 正在生成会议纪要
  | 'completed'      // 处理完成
  | 'error';         // 发生错误

/**
 * 处理进度阶段
 */
export type ProcessingStage =
  | 'upload'         // 上传阶段
  | 'transcribe'     // 转录阶段
  | 'summarize'      // 生成摘要阶段
  | 'complete';      // 完成阶段

/**
 * 音频文件信息
 */
export interface AudioFileInfo {
  name: string;           // 文件名
  size: number;           // 文件大小（字节）
  duration?: number;      // 音频时长（秒）
  format: AudioFormat;    // 音频格式
}

/**
 * 行动项（待办事项）
 */
export interface ActionItem {
  task: string;                    // 任务描述
  assignee?: string;               // 负责人
  deadline?: string;               // 截止日期（ISO 8601格式）
  priority?: Priority;             // 优先级
  completed?: boolean;             // 是否完成
}

/**
 * 会议摘要内容
 */
export interface MeetingSummary {
  overview: string;                // 会议概述（整体总结）
  keyPoints: string[];             // 关键要点
  decisions: string[];             // 决策事项
  actionItems: ActionItem[];       // 行动项
  participants?: string[];         // 参会人员
  nextSteps?: string[];            // 后续步骤
}

/**
 * 会议记录
 */
export interface Meeting {
  id: string;                      // 唯一标识符
  title: string;                   // 会议标题
  audioFile: AudioFileInfo;        // 音频文件信息
  transcript: string;              // 完整转录文本
  summary: MeetingSummary;         // 会议摘要
  createdAt: string;               // 创建时间（ISO 8601格式）
  updatedAt?: string;              // 更新时间（ISO 8601格式）
  status: ProcessingStatus;        // 处理状态
}

/**
 * 处理进度信息
 */
export interface ProcessingProgress {
  stage: ProcessingStage;          // 当前阶段
  progress: number;                // 进度百分比（0-100）
  message: string;                 // 进度描述信息
  error?: string;                  // 错误信息（如果有）
  estimatedTimeRemaining?: number; // 预计剩余时间（秒）
}

/**
 * API 请求：转录音频
 */
export interface TranscribeRequest {
  audioFile: File;                 // 音频文件
  language?: string;               // 语言代码（可选，如 'zh', 'en'）
}

/**
 * API 响应：转录结果
 */
export interface TranscribeResponse {
  transcript: string;              // 转录文本
  duration: number;                // 音频时长（秒）
  language?: string;               // 检测到的语言
}

/**
 * API 请求：生成会议摘要
 */
export interface GenerateSummaryRequest {
  transcript: string;              // 转录文本
  title?: string;                  // 会议标题（可选）
  customPrompt?: string;           // 自定义提示词（可选）
}

/**
 * API 响应：会议摘要
 */
export interface GenerateSummaryResponse {
  summary: MeetingSummary;         // 生成的会议摘要
}

/**
 * Markdown 导出配置
 */
export interface MarkdownExportConfig {
  includeTranscript: boolean;      // 是否包含完整转录文本
  includeTimestamp: boolean;       // 是否包含时间戳
  includeActionItems: boolean;     // 是否包含行动项
}
