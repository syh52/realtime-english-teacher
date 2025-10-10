"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { ConversationSidebar } from "./conversation-sidebar";
import { VoiceControlPanel } from "./voice-control-panel";
import { Conversation } from "@/lib/conversations";
import { useTranslations } from "@/components/translations-context";
import { TokenUsageDisplay } from "./token-usage";
import { Message as MessageType } from "@/types";

interface ChatLayoutProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  isSessionActive: boolean;
  onToggleSession: () => void;
  conversation: Conversation[];
  status?: string;
  onSendText?: (text: string) => void;
  msgs?: MessageType[];
}

export function ChatLayout({
  voice,
  onVoiceChange,
  isSessionActive,
  onToggleSession,
  conversation,
  status,
  onSendText,
  msgs = [],
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslations();

  return (
    <div className="flex h-screen w-full overflow-hidden">
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
          isSessionActive={isSessionActive}
        />
      </div>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col bg-background w-full min-w-0">
        {/* 顶栏 */}
        <header className="flex items-center gap-2 px-4 h-14 border-b border-border bg-card flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {t('app.title') || "AI Voice Chat"}
          </h2>

          {/* Token 使用统计 */}
          {msgs.length > 4 && (
            <div className="ml-auto">
              <TokenUsageDisplay messages={msgs} />
            </div>
          )}
        </header>

        {/* 消息列表 */}
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-8 space-y-6">
            {conversation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <p className="text-lg font-medium mb-2">
                  {t('welcome.title') || "Welcome to AI Voice Chat"}
                </p>
                <p className="text-sm">
                  {t('welcome.subtitle') || "Click the microphone to start a conversation"}
                </p>
              </div>
            ) : (
              conversation.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* 底部控制面板 */}
        <VoiceControlPanel
          isSessionActive={isSessionActive}
          onToggleSession={onToggleSession}
          onSendText={onSendText}
          status={status}
        />
      </main>
    </div>
  );
}
