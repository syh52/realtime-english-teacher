"use client"

import React, { useEffect, useState, useRef } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { useSessionManager } from "@/hooks/use-session-manager"
import { useAudioVolume } from "@/hooks/use-audio-volume"
import { useScenarioMode } from "@/hooks/use-scenario-mode"
import { tools } from "@/lib/tools"
import { ChatLayout } from "@/components/chat-layout"
import { ScenarioSelector } from "@/components/scenario-selector"
import { useToolsFunctions } from "@/hooks/use-tools"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { startScenarioTraining } from "@/lib/scenario-tracker"

const App: React.FC = () => {
  // State for voice selection
  const [voice, setVoice] = useState("alloy")

  // State for model selection
  const [model, setModel] = useState("gpt-4o-realtime-preview-2024-12-17")

  // Session Manager Hook
  const sessionManager = useSessionManager(voice)

  // Scenario Mode Hook
  const scenarioMode = useScenarioMode()

  // WebRTC Audio Session Hook (传入场景动态提示词)
  const {
    status,
    isSessionActive,
    connectionState,
    registerFunction,
    handleStartStopClick,
    msgs,
    conversation,
    sendTextMessage,
    clearConversation,
    micAnalyser
  } = useWebRTCAudioSession(
    voice,
    model,
    tools,
    scenarioMode.currentInstructions || undefined  // 传入场景提示词
  )

  // Get all tools functions
  const toolsFunctions = useToolsFunctions();

  // Audio volume hook for Orb visualization
  const { getInputVolume, getOutputVolume } = useAudioVolume(micAnalyser);

  // Track processed message IDs to avoid duplicates
  const processedMessageIds = useRef(new Set<string>())

  // Sync WebRTC conversation to current session
  useEffect(() => {
    if (!sessionManager.isLoaded) return

    const currentSession = sessionManager.getCurrentSession()
    // 如果当前会话已归档,不同步消息(防止旧消息泄漏到新会话)
    if (currentSession?.isArchived) return

    // 添加新消息到当前会话
    conversation.forEach((message) => {
      // 只处理 final 状态的消息，避免添加临时消息
      if (message.isFinal && !processedMessageIds.current.has(message.id)) {
        sessionManager.addMessageToCurrentSession(message)
        processedMessageIds.current.add(message.id)
      }
    })
  }, [conversation, sessionManager])

  // Clear processed IDs when session changes
  useEffect(() => {
    processedMessageIds.current.clear()
  }, [sessionManager.currentSessionId])

  useEffect(() => {
    // Register all functions by iterating over the object
    Object.entries(toolsFunctions).forEach(([name, func]) => {
      const functionNames: Record<string, string> = {
        timeFunction: 'getCurrentTime',
        backgroundFunction: 'changeBackgroundColor',
        partyFunction: 'partyMode',
        launchWebsite: 'launchWebsite',
        copyToClipboard: 'copyToClipboard',
        scrapeWebsite: 'scrapeWebsite'
      };

      registerFunction(functionNames[name], func);
    });
  }, [registerFunction, toolsFunctions])

  // 获取当前会话用于显示
  const currentSession = sessionManager.getCurrentSession()
  const displayConversation = currentSession?.messages || conversation

  /**
   * 处理对话开始/停止的包装函数
   */
  const handleToggleSession = () => {
    if (isSessionActive) {
      // 停止对话 → 归档当前会话
      handleStartStopClick() // 停止 WebRTC
      sessionManager.archiveCurrentSession()
      console.log("✅ 对话已停止并归档")

      // 如果在场景模式，退出场景模式返回选择界面
      if (scenarioMode.isScenarioMode) {
        scenarioMode.exitScenarioMode()
      }
    } else {
      // 开始对话
      const current = sessionManager.getCurrentSession()

      if (!current || current.isArchived) {
        // 如果没有活跃会话，或当前会话已归档 → 创建新会话
        clearConversation() // 🔑 清空 WebRTC 旧对话，防止旧消息泄漏
        processedMessageIds.current.clear() // 清空已处理的消息 ID
        sessionManager.createSession(voice)
        console.log("✅ 创建新会话并开始对话")
      } else {
        // 当前会话未归档 → 继续当前会话
        console.log("✅ 继续当前会话")
      }

      // 开始 WebRTC
      handleStartStopClick()
    }
  }

  /**
   * 选择场景并开始训练
   */
  const handleSelectScenario = (scenarioId: string) => {
    // 记录场景训练开始
    startScenarioTraining(scenarioId)

    // 进入场景模式
    scenarioMode.startScenario(scenarioId)

    console.log(`✅ 开始场景训练: ${scenarioId}`)
  }

  /**
   * 开始自由对话模式（非场景模式）
   */
  const handleStartFreeMode = () => {
    // 退出场景模式（使用默认提示词）
    scenarioMode.exitScenarioMode()
    console.log("✅ 开始自由对话模式")
  }

  // 渲染逻辑：
  // 1. 如果在场景模式且已选择场景 → 显示聊天界面 + 返回按钮
  // 2. 否则 → 显示场景选择器
  if (scenarioMode.isScenarioMode && scenarioMode.selectedScenario) {
    return (
      <div className="relative w-full h-screen">
        {/* 返回按钮（左上角） */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 z-50"
          onClick={() => {
            if (isSessionActive) {
              // 如果正在对话，先停止
              handleToggleSession()
            } else {
              // 直接返回场景选择
              scenarioMode.exitScenarioMode()
            }
          }}
          disabled={isSessionActive}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isSessionActive ? '请先结束对话' : '返回场景选择'}
        </Button>

        {/* 场景标题指示器 */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
            <div className="text-sm font-medium">
              📍 {scenarioMode.selectedScenario.title.zh}
            </div>
            <div className="text-xs text-muted-foreground">
              {scenarioMode.selectedScenario.title.en}
            </div>
          </div>
        </div>

        {/* 聊天界面 */}
        <ChatLayout
          voice={voice}
          onVoiceChange={setVoice}
          model={model}
          onModelChange={setModel}
          isSessionActive={isSessionActive}
          connectionState={connectionState}
          onToggleSession={handleToggleSession}
          conversation={displayConversation}
          status={status}
          onSendText={sendTextMessage}
          msgs={msgs}
          sessionManager={sessionManager}
          micAnalyser={micAnalyser}
          getInputVolume={getInputVolume}
          getOutputVolume={getOutputVolume}
        />
      </div>
    )
  }

  // 默认显示场景选择器
  return (
    <ScenarioSelector
      onSelectScenario={handleSelectScenario}
      onStartFreeMode={handleStartFreeMode}
    />
  )
}

export default App;
