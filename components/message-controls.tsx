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

// 导出日志为纯文本文件（更易读）
function exportAsText(messages: MessageType[], conversation: Conversation[], filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportFilename = filename || `conversation-log-${timestamp}.txt`

  let textContent = `AI 英语教练 - 对话记录\n`
  textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  textContent += `消息总数: ${messages.length}\n`
  textContent += `对话轮数: ${conversation.length}\n`
  textContent += `\n${'='.repeat(60)}\n\n`

  // 添加对话转录（更易读）
  if (conversation.length > 0) {
    textContent += `📝 对话转录\n\n`
    conversation.forEach((conv, idx) => {
      textContent += `[${idx + 1}] ${conv.role === 'user' ? '👤 你' : '🤖 AI'}: ${conv.text}\n`
    })
    textContent += `\n${'='.repeat(60)}\n\n`
  }

  // 添加完整消息日志（技术细节）
  textContent += `📋 完整消息日志\n\n`
  messages.forEach((msg, idx) => {
    textContent += `消息 #${idx + 1}\n`
    textContent += `类型: ${msg.type}\n`
    textContent += `内容:\n${JSON.stringify(msg, null, 2)}\n`
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
        >
          <FileText className="w-4 h-4 mr-2" />
          导出为文本 (.txt)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsJSON(messages)}
          className="flex-1"
        >
          <FileJson className="w-4 h-4 mr-2" />
          导出为 JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => console.log(messages)}
        >
          <Terminal className="w-4 h-4 mr-2" />
          {t('messageControls.log')}
        </Button>
      </div>
    </div>
  )
}

export function MessageControls({ conversation, msgs }: { conversation: Conversation[], msgs: MessageType[] }) {
  const { t } = useTranslations();
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  if (conversation.length === 0) return null

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
            title="一键导出对话记录为文本文件"
          >
            <Download className="w-4 h-4 mr-1" />
            导出
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