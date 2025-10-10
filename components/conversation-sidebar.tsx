"use client";

import { MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoiceSelector } from "@/components/voice-select";
import { useTranslations } from "@/components/translations-context";

interface ConversationSidebarProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  isSessionActive: boolean;
}

export function ConversationSidebar({
  voice,
  onVoiceChange,
  isSessionActive,
}: ConversationSidebarProps) {
  const { t } = useTranslations();

  // 模拟对话历史(未来可以扩展为多会话)
  const conversations = [
    { id: "1", title: t('sidebar.currentSession') || "Current Session", timestamp: "Now" },
  ];

  return (
    <aside className="flex flex-col border-r border-sidebar-border bg-sidebar h-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">
          {t('sidebar.conversations') || "Conversations"}
        </h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors group",
                isSessionActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className={cn(
                  "h-4 w-4 mt-0.5",
                  isSessionActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{conv.timestamp}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border space-y-3">
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
