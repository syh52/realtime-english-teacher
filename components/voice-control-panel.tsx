"use client";

import { Mic, Square, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/translations-context";
import { TextInput } from "@/components/text-input";
import { useState } from "react";
import { ConnectionState } from "@/hooks/use-webrtc";
import { SimpleWaveform } from "@/components/simple-waveform";

interface VoiceControlPanelProps {
  isSessionActive: boolean;
  connectionState: ConnectionState;
  onToggleSession: () => void;
  onSendText?: (text: string) => void;
  status?: string;
}

export function VoiceControlPanel({
  isSessionActive,
  connectionState,
  onToggleSession,
  onSendText,
  status,
}: VoiceControlPanelProps) {
  const { t } = useTranslations();
  const [showTextInput, setShowTextInput] = useState(false);

  // 根据连接状态决定按钮是否禁用
  // viewing 模式不禁用按钮，因为点击会创建新对话
  const isButtonDisabled = connectionState === 'connecting';

  // 获取按钮图标
  const getButtonIcon = () => {
    if (connectionState === 'connecting') {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (isSessionActive) {
      return <Square className="h-5 w-5 fill-current" />;
    }
    return <Mic className="h-5 w-5" />;
  };

  // 获取状态显示文本
  const getStatusText = () => {
    if (connectionState === 'connecting') {
      return status || "正在建立连接...";
    }
    if (connectionState === 'error') {
      return status || "连接失败";
    }
    if (isSessionActive) {
      return status || t('broadcast.listening') || "正在聆听...";
    }
    // viewing 模式不显示提示
    return "";
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (connectionState === 'connecting') {
      return "text-blue-500";
    }
    if (connectionState === 'error') {
      return "text-destructive";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
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

        {/* 实时波形显示 */}
        {isSessionActive && (
          <div className="mb-4 w-full max-w-md mx-auto animate-fade-in">
            <SimpleWaveform
              active={isSessionActive}
              height={80}
              barColor="hsl(var(--primary))"
              className="rounded-lg border border-border bg-muted/30 p-2"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {/* 状态指示器 */}
          {(connectionState !== 'idle' || isSessionActive) && (
            <div className="flex items-center gap-2 text-sm animate-fade-in">
              {/* 动画指示器 */}
              {(connectionState === 'connecting' || isSessionActive) && (
                <div className="flex gap-1">
                  <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow" />
                  <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow [animation-delay:0.2s]" />
                  <div className="h-3 w-1 bg-primary rounded-full animate-pulse-slow [animation-delay:0.4s]" />
                </div>
              )}
              <span className={cn(getStatusColor())}>{getStatusText()}</span>
            </div>
          )}

          {/* 麦克风按钮 */}
          <Button
            size="lg"
            onClick={onToggleSession}
            disabled={isButtonDisabled}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
              isSessionActive
                ? "bg-destructive hover:bg-destructive/90 scale-110"
                : "bg-primary hover:bg-primary/90",
              isButtonDisabled && "opacity-70 cursor-not-allowed"
            )}
          >
            {getButtonIcon()}
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
        </div>
      </div>
    </div>
  );
}
