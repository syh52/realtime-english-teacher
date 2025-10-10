"use client";

import { Mic, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/translations-context";
import { TextInput } from "@/components/text-input";
import { useState } from "react";

interface VoiceControlPanelProps {
  isSessionActive: boolean;
  onToggleSession: () => void;
  onSendText?: (text: string) => void;
  status?: string;
}

export function VoiceControlPanel({
  isSessionActive,
  onToggleSession,
  onSendText,
  status,
}: VoiceControlPanelProps) {
  const { t } = useTranslations();
  const [showTextInput, setShowTextInput] = useState(false);

  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 文本输入区域 */}
        {isSessionActive && showTextInput && (
          <div className="mb-4">
            <TextInput
              onSubmit={(text) => {
                onSendText?.(text);
                setShowTextInput(false);
              }}
              disabled={!isSessionActive}
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {/* 录音状态指示器 */}
          {isSessionActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <div className="flex gap-1">
                <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow" />
                <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow [animation-delay:0.2s]" />
                <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow [animation-delay:0.4s]" />
              </div>
              <span>{status || t('broadcast.listening') || "Listening..."}</span>
            </div>
          )}

          {/* 麦克风按钮 */}
          <Button
            size="lg"
            onClick={onToggleSession}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
              isSessionActive
                ? "bg-destructive hover:bg-destructive/90 scale-110"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSessionActive ? (
              <Square className="h-5 w-5 fill-current" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {/* 文本输入按钮 */}
          {isSessionActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTextInput(!showTextInput)}
              className="h-10 w-10 animate-fade-in"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}

          {/* 状态文本 */}
          {!isSessionActive && (
            <div className="text-sm text-muted-foreground animate-fade-in">
              {t('broadcast.clickToStart') || "Click to start speaking"}
            </div>
          )}
        </div>

        {/* 提示文本 */}
        {!isSessionActive && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {t('broadcast.hint') || "Press the microphone to start a conversation"}
          </p>
        )}
      </div>
    </div>
  );
}
