"use client"

import React, { useEffect, useState, useRef } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { useSessionManager } from "@/hooks/use-session-manager"
import { useAudioVolume } from "@/hooks/use-audio-volume"
import { tools } from "@/lib/tools"
import { ChatLayout } from "@/components/chat-layout"
import { useToolsFunctions } from "@/hooks/use-tools"

const App: React.FC = () => {
  // State for voice selection
  const [voice, setVoice] = useState("ash")

  // State for model selection
  const [model, setModel] = useState("gpt-4o-realtime-preview-2024-12-17")

  // Session Manager Hook
  const sessionManager = useSessionManager(voice)

  // WebRTC Audio Session Hook
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
  } = useWebRTCAudioSession(voice, model, tools)

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

  return (
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
  )
}

export default App;