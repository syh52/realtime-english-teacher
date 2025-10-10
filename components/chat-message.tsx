"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/conversations";

interface ChatMessageProps {
  message: Conversation;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isProcessing = message.status === "processing" || message.status === "speaking";

  return (
    <div className={cn("flex gap-4 animate-fade-in", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-[hsl(var(--chat-bubble-user))] text-[hsl(var(--chat-bubble-user-foreground))]"
            : "bg-[hsl(var(--chat-bubble-assistant))] text-[hsl(var(--chat-bubble-assistant-foreground))]"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm",
            isUser
              ? "bg-[hsl(var(--chat-bubble-user))] text-[hsl(var(--chat-bubble-user-foreground))]"
              : "bg-[hsl(var(--chat-bubble-assistant))] text-[hsl(var(--chat-bubble-assistant-foreground))]",
            isProcessing && "animate-pulse-slow"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.text || (isProcessing ? "Listening..." : "")}
          </p>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
