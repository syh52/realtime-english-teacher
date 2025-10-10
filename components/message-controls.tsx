import { Button } from "@/components/ui/button"
import Transcriber from "@/components/ui/transcriber"
import { Conversation } from "@/lib/conversations"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Message as MessageType } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Terminal, Download, FileJson, FileText } from "lucide-react"
import { useTranslations } from "@/components/translations-context"

// 导出日志为 JSON 文件
function exportAsJSON(messages: MessageType[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `conversation-log-${timestamp}.json`

  const dataStr = JSON.stringify(messages, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

// 导出日志为纯文本文件（简洁版 - 默认）
function exportAsText(messages: MessageType[], conversation: Conversation[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `conversation-${timestamp}.txt`

  let textContent = `AI 英语教练 - 对话记录\n`
  textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  textContent += `对话轮数: ${conversation.length}\n`
  textContent += `\n${'='.repeat(60)}\n\n`

  // 对话转录
  if (conversation.length > 0) {
    textContent += `📝 对话内容\n\n`
    conversation.forEach((conv, idx) => {
      textContent += `[${idx + 1}] ${conv.role === 'user' ? '👤 你' : '🤖 AI'}: ${conv.text}\n\n`
    })
    textContent += `${'='.repeat(60)}\n\n`
  }

  // 只包含关键技术信息
  const importantTypes = ['error', 'response.function_call_arguments.done', 'conversation.item.created']
  const importantMessages = messages.filter(msg =>
    importantTypes.includes(msg.type) ||
    msg.type.includes('error') ||
    msg.type.includes('tool')
  )

  if (importantMessages.length > 0) {
    textContent += `⚠️ 关键事件 (${importantMessages.length} 条)\n\n`
    importantMessages.forEach((msg, idx) => {
      textContent += `[${idx + 1}] ${msg.type}\n`
      // 只显示关键字段
      if ('error' in msg && msg.error) {
        textContent += `错误: ${JSON.stringify(msg.error, null, 2)}\n`
      }
      textContent += `${'-'.repeat(60)}\n`
    })
  }

  textContent += `\n💡 提示：如需完整技术日志，请点击"导出完整版 (JSON)"\n`

  const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

// 导出完整技术日志（带智能过滤）
function exportFullLog(messages: MessageType[], conversation: Conversation[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `full-log-${timestamp}.txt`

  let textContent = `AI 英语教练 - 完整技术日志\n`
  textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  textContent += `消息总数: ${messages.length}\n`
  textContent += `对话轮数: ${conversation.length}\n`
  textContent += `\n${'='.repeat(60)}\n\n`

  // 对话转录
  if (conversation.length > 0) {
    textContent += `📝 对话转录\n\n`
    conversation.forEach((conv, idx) => {
      textContent += `[${idx + 1}] ${conv.role === 'user' ? '👤 你' : '🤖 AI'}: ${conv.text}\n`
    })
    textContent += `\n${'='.repeat(60)}\n\n`
  }

  // 完整消息日志（过滤重复的 session 配置）
  textContent += `📋 完整消息日志\n\n`
  let lastSessionInstructions = ''

  messages.forEach((msg, idx) => {
    textContent += `消息 #${idx + 1}\n`
    textContent += `类型: ${msg.type}\n`

    // 如果是 session 相关消息，过滤掉重复的 instructions
    if (msg.type.includes('session') && 'session' in msg) {
      const msgWithSession = msg as Record<string, unknown>
      const session = msgWithSession.session as Record<string, unknown> | undefined
      if (session?.instructions) {
        const currentInstructions = session.instructions as string
        if (currentInstructions === lastSessionInstructions) {
          textContent += `内容: {...session 配置与上次相同，已省略...}\n`
        } else {
          lastSessionInstructions = currentInstructions
          // 截断过长的 instructions
          const msgCopy = { ...msgWithSession }
          const sessionCopy = msgCopy.session as Record<string, unknown> | undefined
          if (sessionCopy?.instructions && typeof sessionCopy.instructions === 'string' && sessionCopy.instructions.length > 500) {
            sessionCopy.instructions = sessionCopy.instructions.slice(0, 500) + '\n...(已截断，共 ' + currentInstructions.length + ' 字符)'
          }
          textContent += `内容:\n${JSON.stringify(msgCopy, null, 2)}\n`
        }
      } else {
        textContent += `内容:\n${JSON.stringify(msg, null, 2)}\n`
      }
    } else {
      textContent += `内容:\n${JSON.stringify(msg, null, 2)}\n`
    }
    textContent += `${'-'.repeat(60)}\n\n`
  })

  const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename
  link.click()

  URL.revokeObjectURL(url)
}

function FilterControls({
  typeFilter,
  setTypeFilter,
  searchQuery,
  setSearchQuery,
  messageTypes,
  messages,
  conversation,
}: {
  typeFilter: string
  setTypeFilter: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  messageTypes: string[]
  messages: MessageType[]
  conversation: Conversation[]
}) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {messageTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder={t('messageControls.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsText(messages, conversation)}
          className="flex-1"
          title="TXT"
        >
          <FileText className="w-4 h-4 mr-2" />
          TXT
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportFullLog(messages, conversation)}
          className="flex-1"
          title="FULL"
        >
          <Terminal className="w-4 h-4 mr-2" />
          FULL
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsJSON(messages)}
          title="JSON"
        >
          <FileJson className="w-4 h-4 mr-2" />
          JSON
        </Button>
      </div>
    </div>
  )
}

export function MessageControls({ conversation, msgs }: { conversation: Conversation[], msgs: MessageType[] }) {
  const { t } = useTranslations();
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 只要有消息（msgs）就显示，即使没有对话内容也可以查看系统日志
  // if (conversation.length === 0) return null  // 已移除

  // Get unique message types
  const messageTypes = ["all", ...new Set(msgs.map(msg => msg.type))]

  // Filter messages based on type and search query
  const filteredMsgs = msgs.filter(msg => {
    const matchesType = typeFilter === "all" || msg.type === typeFilter
    const matchesSearch = searchQuery === "" || 
      JSON.stringify(msg).toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-2">
        <h3 className="text-sm font-medium">{t('messageControls.logs')}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAsText(msgs, conversation)}
            title="EXPORT"
          >
            <Download className="w-4 h-4 mr-1" />
            EXPORT
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t('messageControls.view')}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-full p-4 mx-auto overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('messageControls.logs')}</DialogTitle>
            </DialogHeader>
            <FilterControls
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              messageTypes={messageTypes}
              messages={filteredMsgs}
              conversation={conversation}
            />
            <div className="mt-4">
              <ScrollArea className="h-[80vh]">
              <Table className="max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('messageControls.type')}</TableHead>
                    <TableHead>{t('messageControls.content')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMsgs.map((msg, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{msg.type}</TableCell>
                      <TableCell className="font-mono text-sm whitespace-pre-wrap break-words max-w-full]">
                        {JSON.stringify(msg, null, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Transcriber conversation={conversation.slice(-1)} />
    </div>
  )
} 