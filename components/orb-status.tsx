"use client"

import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { cn } from "@/lib/utils"
import { ConnectionState } from "@/hooks/use-webrtc"

interface OrbStatusProps {
  connectionState: ConnectionState
  isSessionActive: boolean
  getInputVolume: () => number
  getOutputVolume: () => number
  className?: string
}

/**
 * Orb 状态组件 - 封装 Orb 动画 + 连接状态显示
 *
 * 显示内容：
 * - Orb 3D 动画球（音量可视化）
 * - 连接状态文本（已连接、连接中、离线）
 * - 状态指示灯
 */
export function OrbStatus({
  connectionState,
  isSessionActive,
  getInputVolume,
  getOutputVolume,
  className,
}: OrbStatusProps) {
  // 获取状态文本
  const getStatusText = () => {
    if (connectionState === "connecting") {
      return "连接中"
    }
    if (connectionState === "error") {
      return "连接失败"
    }
    if (isSessionActive && connectionState === "ready") {
      return "已连接"
    }
    return "离线"
  }

  // 获取状态颜色
  const getStatusColor = () => {
    if (connectionState === "connecting") {
      return "text-blue-500"
    }
    if (connectionState === "error") {
      return "text-destructive"
    }
    if (isSessionActive && connectionState === "ready") {
      return "text-green-600"
    }
    return "text-muted-foreground"
  }

  // 获取指示灯样式
  const getIndicatorClass = () => {
    if (isSessionActive && connectionState === "connected") {
      return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
    }
    if (connectionState === "connecting") {
      return "animate-pulse bg-white/40"
    }
    return ""
  }

  // 决定是否使用闪烁文字效果
  const isTransitioning = connectionState === "connecting"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Orb 动画球 */}
      <div className="ring-border relative size-10 overflow-hidden rounded-full ring-1">
        <Orb
          className="h-full w-full"
          volumeMode="manual"
          getInputVolume={getInputVolume}
          getOutputVolume={getOutputVolume}
        />
      </div>

      {/* 状态信息 */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm leading-none font-medium">AI Voice Chat</p>
        <div className="flex items-center gap-2">
          {isTransitioning ? (
            <ShimmeringText text={getStatusText()} className="text-xs capitalize" />
          ) : (
            <p className={cn("text-xs", getStatusColor())}>{getStatusText()}</p>
          )}
        </div>
      </div>

      {/* 状态指示灯 */}
      <div
        className={cn(
          "flex h-2 w-2 rounded-full transition-all duration-300 ml-auto",
          getIndicatorClass()
        )}
      />
    </div>
  )
}
