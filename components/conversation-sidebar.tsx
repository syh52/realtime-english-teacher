"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoiceSelector } from "@/components/voice-select";
import { ModelSelector } from "@/components/model-select";
import { useTranslations } from "@/components/translations-context";
import { useSessionManager } from "@/hooks/use-session-manager";
import { formatRelativeTime } from "@/lib/conversations";

interface ConversationSidebarProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  isSessionActive: boolean;
  sessionManager: ReturnType<typeof useSessionManager>;
  onCloseSidebar?: () => void;
}

export function ConversationSidebar({
  voice,
  onVoiceChange,
  model,
  onModelChange,
  isSessionActive,
  sessionManager,
  onCloseSidebar,
}: ConversationSidebarProps) {
  const { t } = useTranslations();

  // 按最后更新时间倒序排列会话
  const sortedSessions = [...sessionManager.sessions].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleCreateNewSession = () => {
    if (isSessionActive) {
      alert("请先停止当前会话，再创建新对话");
      return;
    }
    sessionManager.createSession(voice);
    onCloseSidebar?.();
  };

  const handleSelectSession = (sessionId: string) => {
    if (isSessionActive) {
      alert("请先停止当前会话，再查看历史对话");
      return;
    }
    if (sessionId !== sessionManager.currentSessionId) {
      sessionManager.selectSession(sessionId);
      onCloseSidebar?.();
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSessionActive && sessionId === sessionManager.currentSessionId) {
      alert("请先停止当前会话，再删除对话");
      return;
    }
    if (confirm("确定要删除这个对话吗？")) {
      sessionManager.deleteSession(sessionId);
    }
  };

  return (
    <aside className="flex flex-col border-r border-sidebar-border bg-sidebar h-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">
          {t('sidebar.conversations') || "Conversations"}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCreateNewSession}
          disabled={isSessionActive}
          title="新建对话"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 px-2 overflow-y-auto">
        <div className="space-y-1 py-2">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              暂无对话历史
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isActive = session.id === sessionManager.currentSessionId;
              const preview = session.messages
                .filter(m => m.text.trim())
                .slice(-1)[0]?.text.substring(0, 50) || "空对话";

              return (
                <div
                  key={session.id}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleSelectSession(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectSession(session.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          isActive
                            ? "text-sidebar-accent-foreground"
                            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {preview}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(session.updatedAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {session.messageCount} 条
                          </span>
                          {session.isArchived && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              已归档
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                      title="删除对话"
                    >
                      <Trash2 className="h-3 w-3" />
                      删除
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="space-y-2">
          <ModelSelector
            value={model}
            onValueChange={onModelChange}
            disabled={isSessionActive}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-sidebar-foreground">
            {t('voiceSelect.label') || "Voice"}
          </label>
          <VoiceSelector
            value={voice}
            onValueChange={onVoiceChange}
            disabled={isSessionActive}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-sidebar-foreground">
            {t('theme.label') || "Theme"}
          </span>
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}
