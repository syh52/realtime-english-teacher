'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useMeetingMinutes } from '@/hooks/use-meeting-minutes';
import { Meeting, ActionItem } from '@/types/meeting-minutes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  FileAudio,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Download,
  Edit2,
  Save,
  X,
  AlertCircle,
  Loader2,
  FileText,
  Users,
  ListTodo,
  Target,
  ArrowRight,
} from 'lucide-react';

export default function MeetingMinutesPage() {
  const {
    meetings,
    currentMeeting,
    isProcessing,
    progress,
    error,
    processMeeting,
    updateMeetingTitle,
    toggleActionItem,
    deleteMeeting,
    clearAllMeetings,
    reset,
  } = useMeetingMinutes();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择的会议详情
  const selectedMeeting = selectedMeetingId
    ? meetings.find(m => m.id === selectedMeetingId)
    : currentMeeting;

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCustomTitle('');
    }
  };

  // 处理上传和处理
  const handleProcess = async () => {
    if (!selectedFile) return;

    await processMeeting(selectedFile, customTitle || undefined);
    setSelectedFile(null);
    setCustomTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '未知';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 导出为 Markdown
  const exportToMarkdown = (meeting: Meeting) => {
    let markdown = `# ${meeting.title}\n\n`;
    markdown += `**创建时间**: ${new Date(meeting.createdAt).toLocaleString('zh-CN')}\n`;
    markdown += `**音频文件**: ${meeting.audioFile.name}\n`;
    if (meeting.audioFile.duration) {
      markdown += `**时长**: ${formatDuration(meeting.audioFile.duration)}\n`;
    }
    markdown += `\n---\n\n`;

    // 会议概述
    markdown += `## 会议概述\n\n${meeting.summary.overview}\n\n`;

    // 关键要点
    if (meeting.summary.keyPoints.length > 0) {
      markdown += `## 关键要点\n\n`;
      meeting.summary.keyPoints.forEach((point, i) => {
        markdown += `${i + 1}. ${point}\n`;
      });
      markdown += `\n`;
    }

    // 决策事项
    if (meeting.summary.decisions.length > 0) {
      markdown += `## 决策事项\n\n`;
      meeting.summary.decisions.forEach((decision, i) => {
        markdown += `${i + 1}. ${decision}\n`;
      });
      markdown += `\n`;
    }

    // 行动项
    if (meeting.summary.actionItems.length > 0) {
      markdown += `## 行动项\n\n`;
      meeting.summary.actionItems.forEach((item, i) => {
        const status = item.completed ? '[x]' : '[ ]';
        const priority = item.priority ? `[${item.priority.toUpperCase()}]` : '';
        const assignee = item.assignee ? `@${item.assignee}` : '';
        const deadline = item.deadline ? `(截止: ${item.deadline})` : '';
        markdown += `${i + 1}. ${status} ${priority} ${item.task} ${assignee} ${deadline}\n`;
      });
      markdown += `\n`;
    }

    // 参会人员
    if (meeting.summary.participants && meeting.summary.participants.length > 0) {
      markdown += `## 参会人员\n\n`;
      meeting.summary.participants.forEach(participant => {
        markdown += `- ${participant}\n`;
      });
      markdown += `\n`;
    }

    // 后续步骤
    if (meeting.summary.nextSteps && meeting.summary.nextSteps.length > 0) {
      markdown += `## 后续步骤\n\n`;
      meeting.summary.nextSteps.forEach((step, i) => {
        markdown += `${i + 1}. ${step}\n`;
      });
      markdown += `\n`;
    }

    // 完整转录
    markdown += `## 完整转录\n\n${meeting.transcript}\n`;

    // 下载
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 优先级徽章颜色
  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">会议纪要生成器</h1>
        <p className="text-muted-foreground">
          上传会议录音，自动生成结构化的会议纪要
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：上传区域和历史记录 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 上传区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                上传音频
              </CardTitle>
              <CardDescription>
                支持 mp3, m4a, wav, webm 格式，最大 100MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audio-file">选择音频文件</Label>
                <Input
                  ref={fileInputRef}
                  id="audio-file"
                  type="file"
                  accept=".mp3,.m4a,.wav,.webm,audio/*"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="mt-2"
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <FileAudio className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="meeting-title" className="text-xs">
                      会议标题（可选）
                    </Label>
                    <Input
                      id="meeting-title"
                      type="text"
                      placeholder="例如：产品规划会议"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      disabled={isProcessing}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        开始处理
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* 处理进度 */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{progress.message}</span>
                    <span className="font-medium">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} />
                </div>
              )}

              {/* 错误信息 */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 历史记录列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  历史记录
                </CardTitle>
                {meetings.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要清空所有历史记录吗？')) {
                        clearAllMeetings();
                        setSelectedMeetingId(null);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无历史记录
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => setSelectedMeetingId(meeting.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMeetingId === meeting.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium truncate flex-1">
                          {meeting.title}
                        </p>
                        <Badge
                          variant={
                            meeting.status === 'completed'
                              ? 'default'
                              : meeting.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {meeting.status === 'completed'
                            ? '已完成'
                            : meeting.status === 'error'
                            ? '失败'
                            : '处理中'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：会议详情 */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {editingTitleId === selectedMeeting.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMeetingTitle(selectedMeeting.id, editingTitleValue);
                            setEditingTitleId(null);
                          }}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTitleId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="flex items-center gap-2">
                        {selectedMeeting.title}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTitleId(selectedMeeting.id);
                            setEditingTitleValue(selectedMeeting.title);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    )}
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-4 text-xs">
                        <span>文件: {selectedMeeting.audioFile.name}</span>
                        {selectedMeeting.audioFile.duration && (
                          <span>时长: {formatDuration(selectedMeeting.audioFile.duration)}</span>
                        )}
                      </div>
                      <div className="text-xs">
                        创建于: {new Date(selectedMeeting.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportToMarkdown(selectedMeeting)}
                      disabled={selectedMeeting.status !== 'completed'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('确定要删除这条会议记录吗？')) {
                          deleteMeeting(selectedMeeting.id);
                          setSelectedMeetingId(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 会议概述 */}
                {selectedMeeting.summary.overview && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      会议概述
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMeeting.summary.overview}
                    </p>
                  </div>
                )}

                <Separator />

                {/* 关键要点 */}
                {selectedMeeting.summary.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      关键要点
                    </h3>
                    <ul className="space-y-2">
                      {selectedMeeting.summary.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="font-medium text-primary">{index + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 决策事项 */}
                {selectedMeeting.summary.decisions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      决策事项
                    </h3>
                    <ul className="space-y-2">
                      {selectedMeeting.summary.decisions.map((decision, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 行动项 */}
                {selectedMeeting.summary.actionItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ListTodo className="w-5 h-5" />
                      行动项
                    </h3>
                    <div className="space-y-3">
                      {selectedMeeting.summary.actionItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleActionItem(selectedMeeting.id, index)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.task}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {item.priority && (
                                <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                                  {item.priority}
                                </Badge>
                              )}
                              {item.assignee && (
                                <span className="text-muted-foreground">@{item.assignee}</span>
                              )}
                              {item.deadline && (
                                <span className="text-muted-foreground">截止: {item.deadline}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 参会人员 */}
                {selectedMeeting.summary.participants && selectedMeeting.summary.participants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      参会人员
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeeting.summary.participants.map((participant, index) => (
                        <Badge key={index} variant="secondary">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 后续步骤 */}
                {selectedMeeting.summary.nextSteps && selectedMeeting.summary.nextSteps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5" />
                      后续步骤
                    </h3>
                    <ul className="space-y-2">
                      {selectedMeeting.summary.nextSteps.map((step, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* 完整转录 */}
                {selectedMeeting.transcript && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">完整转录</h3>
                    <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedMeeting.transcript}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">选择或上传会议录音</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  上传音频文件或从左侧历史记录中选择一条会议记录查看详情
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
