"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface MessageActionsProps {
  content: string
  className?: string
}

/**
 * 消息操作按钮组件
 *
 * 提供消息相关的操作：
 * - 复制消息内容
 * - （未来可扩展：编辑、删除、重新生成等）
 */
export function MessageActions({ content, className }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground relative size-9 p-1.5"
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              <span className="sr-only">{copied ? "已复制!" : "复制"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "已复制!" : "复制"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
