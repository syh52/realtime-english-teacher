"use client"

import React, { useEffect, useState } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { ChatLayout } from "@/components/chat-layout"
import { useToolsFunctions } from "@/hooks/use-tools"

const App: React.FC = () => {
  // State for voice selection
  const [voice, setVoice] = useState("ash")

  // WebRTC Audio Session Hook
  const {
    status,
    isSessionActive,
    registerFunction,
    handleStartStopClick,
    msgs,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession(voice, tools)

  // Get all tools functions
  const toolsFunctions = useToolsFunctions();

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

  return (
    <ChatLayout
      voice={voice}
      onVoiceChange={setVoice}
      isSessionActive={isSessionActive}
      onToggleSession={handleStartStopClick}
      conversation={conversation}
      status={status}
      onSendText={sendTextMessage}
      msgs={msgs}
    />
  )
}

export default App;