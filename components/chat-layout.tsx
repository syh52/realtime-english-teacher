"use client";

import { useState } from "react";
import { Menu, Send, AudioLines, PhoneOff, Loader2, FileText, Download, Terminal, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ConversationSidebar } from "./conversation-sidebar";
import { MessageControls } from "./message-controls";
import { OrbStatus } from "./orb-status";
import { MessageActions } from "./message-actions";
import { RealAudioWaveform } from "./real-audio-waveform";
import { Message, MessageContent } from "@/components/ui/message";
import { Response } from "@/components/ui/response";
import { Conversation } from "@/lib/conversations";
import { useTranslations } from "@/components/translations-context";
import { Message as MessageType } from "@/types";
import { useSessionManager } from "@/hooks/use-session-manager";
import { ConnectionState } from "@/hooks/use-webrtc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// 导出日志为 JSON 文件
function exportAsJSON(messages: MessageType[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `conversation-log-${timestamp}.json`

  const dataStr = JSON.stringify(messages, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

// 导出日志为纯文本文件（简洁版 - 默认）
function exportAsText(messages: MessageType[], conversation: Conversation[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `conversation-${timestamp}.txt`

  let textContent = `AI 英语教练 - 对话记录\n`
  textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  textContent += `对话轮数: ${conversation.length}\n`
  textContent += `\n${'='.repeat(60)}\n\n`

  // 对话转录
  if (conversation.length > 0) {
    textContent += `📝 对话内容\n\n`
    conversation.forEach((conv, idx) => {
      textContent += `[${idx + 1}] ${conv.role === 'user' ? '👤 你' : '🤖 AI'}: ${conv.text}\n\n`
    })
    textContent += `${'='.repeat(60)}\n\n`
  }

  // 只包含关键技术信息
  const importantTypes = ['error', 'response.function_call_arguments.done', 'conversation.item.created']
  const importantMessages = messages.filter(msg =>
    importantTypes.includes(msg.type) ||
    msg.type.includes('error') ||
    msg.type.includes('tool')
  )

  if (importantMessages.length > 0) {
    textContent += `⚠️ 关键事件 (${importantMessages.length} 条)\n\n`
    importantMessages.forEach((msg, idx) => {
      textContent += `[${idx + 1}] ${msg.type}\n`
      // 只显示关键字段
      if ('error' in msg && msg.error) {
        textContent += `错误: ${JSON.stringify(msg.error, null, 2)}\n`
      }
      textContent += `${'-'.repeat(60)}\n`
    })
  }

  textContent += `\n💡 提示：如需完整技术日志，请点击"导出完整版 (JSON)"\n`

  const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

// 导出完整技术日志（带智能过滤）
function exportFullLog(messages: MessageType[], conversation: Conversation[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `full-log-${timestamp}.txt`

  // 智能过滤：移除冗余的技术消息
  const noisyTypes = [
    'response.audio_transcript.delta',
    'conversation.item.input_audio_transcription.delta',
    'rate_limits.updated',
    'output_audio_buffer.started',
    'output_audio_buffer.stopped',
    'input_audio_buffer.speech_started',
    'input_audio_buffer.speech_stopped',
  ]

  const filteredMessages = messages.filter(msg => !noisyTypes.includes(msg.type))

  let textContent = `AI 英语教练 - 完整技术日志\n`
  textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  textContent += `原始消息数: ${messages.length}  →  过滤后: ${filteredMessages.length} (-${messages.length - filteredMessages.length} 条冗余消息)\n`
  textContent += `对话轮数: ${conversation.length}\n`
  textContent += `\n${'='.repeat(60)}\n\n`

  // 对话转录
  if (conversation.length > 0) {
    textContent += `📝 对话转录\n\n`
    conversation.forEach((conv, idx) => {
      textContent += `[${idx + 1}] ${conv.role === 'user' ? '👤 你' : '🤖 AI'}: ${conv.text}\n`
    })
    textContent += `\n${'='.repeat(60)}\n\n`
  }

  // 完整消息日志
  textContent += `📋 完整消息日志（已过滤冗余消息）\n\n`
  let lastSessionInstructions = ''

  filteredMessages.forEach((msg, idx) => {
    textContent += `消息 #${idx + 1}\n`
    textContent += `类型: ${msg.type}\n`

    if (msg.type.includes('session') && 'session' in msg) {
      const msgWithSession = msg as Record<string, unknown>
      const session = msgWithSession.session as Record<string, unknown> | undefined
      if (session?.instructions) {
        const currentInstructions = session.instructions as string
        if (currentInstructions === lastSessionInstructions) {
          textContent += `内容: {...session 配置与上次相同，已省略...}\n`
        } else {
          lastSessionInstructions = currentInstructions
          textContent += `内容:\n${JSON.stringify(msgWithSession, null, 2)}\n`
        }
      } else {
        textContent += `内容:\n${JSON.stringify(msg, null, 2)}\n`
      }
    } else {
      textContent += `内容:\n${JSON.stringify(msg, null, 2)}\n`
    }
    textContent += `${'-'.repeat(60)}\n\n`
  })

  textContent += `\n💡 提示：\n`
  textContent += `- 已过滤 ${messages.length - filteredMessages.length} 条冗余消息\n`
  textContent += `- ✅ AI instructions 完整保留（未截断）\n`
  textContent += `- 如需完整未过滤的原始数据，请使用 JSON 格式导出\n`

  const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

interface ChatLayoutProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  isSessionActive: boolean;
  connectionState: ConnectionState;
  onToggleSession: () => void;
  conversation: Conversation[];
  status?: string;
  onSendText?: (text: string) => void;
  msgs?: MessageType[];
  sessionManager: ReturnType<typeof useSessionManager>;
  micAnalyser?: AnalyserNode | null;
  getInputVolume: () => number;
  getOutputVolume: () => number;
}

export function ChatLayout({
  voice,
  onVoiceChange,
  model,
  onModelChange,
  isSessionActive,
  connectionState,
  onToggleSession,
  conversation,
  onSendText,
  msgs = [],
  sessionManager,
  micAnalyser,
  getInputVolume,
  getOutputVolume,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const { t } = useTranslations();

  // 去重：确保每个消息 ID 只出现一次（避免 React key 重复警告）
  // 使用 Map 去重，保留最后一个（通常是 isFinal 版本）
  const uniqueConversation = Array.from(
    new Map(conversation.map(msg => [msg.id, msg])).values()
  );

  // 判断是否正在连接
  const isTransitioning = connectionState === "connecting";

  // 发送文本消息
  const handleSendText = () => {
    if (!textInput.trim() || !onSendText) return;
    onSendText(textInput);
    setTextInput("");
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 overflow-hidden",
          "fixed lg:relative z-40 h-full",
          sidebarOpen
            ? "w-[260px] translate-x-0"
            : "w-[260px] -translate-x-full lg:w-0 lg:translate-x-0"
        )}
      >
        <ConversationSidebar
          voice={voice}
          onVoiceChange={onVoiceChange}
          model={model}
          onModelChange={onModelChange}
          isSessionActive={isSessionActive}
          sessionManager={sessionManager}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col bg-background w-full min-w-0">
        {/* 顶栏 */}
        <header className="flex items-center gap-4 px-4 h-16 border-b border-border bg-card flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Orb 状态显示 */}
          <OrbStatus
            connectionState={connectionState}
            isSessionActive={isSessionActive}
            getInputVolume={getInputVolume}
            getOutputVolume={getOutputVolume}
            className="flex-1"
          />

          {/* 日志导出按钮（只在有消息时显示） */}
          {msgs && msgs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="导出日志">
                  <FileText className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportAsText(msgs, uniqueConversation)}>
                  <FileText className="w-4 h-4 mr-2" />
                  导出简洁版 (TXT)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFullLog(msgs, uniqueConversation)}>
                  <Terminal className="w-4 h-4 mr-2" />
                  导出完整版 (FULL)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsJSON(msgs)}>
                  <FileJson className="w-4 h-4 mr-2" />
                  导出 JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Download className="w-4 h-4 mr-2" />
                      查看详细日志
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-full p-4 mx-auto overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>详细日志</DialogTitle>
                    </DialogHeader>
                    <MessageControls conversation={uniqueConversation} msgs={msgs} />
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* 消息列表 */}
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-4 md:py-8 space-y-2">
            {uniqueConversation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-6 md:py-12">
                <p className="text-lg font-medium mb-2">
                  {t('welcome.title') || "开始对话"}
                </p>
                {t('welcome.subtitle') && (
                  <p className="text-sm">
                    {t('welcome.subtitle')}
                  </p>
                )}
              </div>
            ) : (
              uniqueConversation.map((message) => (
                <div key={message.id} className="flex w-full flex-col gap-1">
                  <Message from={message.role}>
                    <MessageContent>
                      <Response className="w-auto [overflow-wrap:anywhere] whitespace-pre-wrap">
                        {message.text}
                      </Response>
                    </MessageContent>
                  </Message>
                  {message.role === "assistant" && (
                    <MessageActions content={message.text} />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 底部工具栏 */}
        <div className="border-t border-border bg-card">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
            {/* 实时波形显示（会话活跃时） */}
            {isSessionActive && micAnalyser && (
              <div className="w-full animate-fade-in">
                <RealAudioWaveform
                  active={isSessionActive}
                  analyser={micAnalyser}
                  height={60}
                  barColor="hsl(var(--primary))"
                  className="rounded-lg border border-border bg-muted/30 p-2"
                />
              </div>
            )}

            {/* 输入栏 + 按钮 */}
            <div className="flex items-center gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="h-10 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isTransitioning}
              />
              <Button
                onClick={handleSendText}
                size="icon"
                variant="ghost"
                className="rounded-full shrink-0"
                disabled={!textInput.trim() || isTransitioning}
              >
                <Send className="size-4" />
                <span className="sr-only">发送消息</span>
              </Button>
              <Button
                onClick={onToggleSession}
                size="icon"
                variant={isSessionActive ? "secondary" : "ghost"}
                className="rounded-full shrink-0"
                disabled={isTransitioning}
              >
                {isTransitioning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isSessionActive ? (
                  <PhoneOff className="size-4" />
                ) : (
                  <AudioLines className="size-4" />
                )}
                <span className="sr-only">
                  {isSessionActive ? "结束通话" : "开始语音对话"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
