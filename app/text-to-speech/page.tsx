"use client"

import React, { useState } from 'react';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { TTSConfig, VoiceType } from '@/types/text-to-speech';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Volume2, Download, Trash2, Play, AlertCircle } from 'lucide-react';

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [config, setConfig] = useState<TTSConfig>({
    voice: 'alloy',
    speed: 1.0,
    format: 'mp3',
  });

  const {
    isGenerating,
    progress,
    audioUrl,
    error,
    history,
    generateSpeech,
    clearAudio,
    deleteHistoryItem,
  } = useTextToSpeech();

  const handleGenerate = async () => {
    if (!text.trim()) return;
    await generateSpeech(text, config);
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.substring(0, 20)}-${Date.now()}.${config.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const estimateCost = (charCount: number) => {
    const costPerMillion = 15; // $15/1M characters for tts-1
    return (charCount / 1000000 * costPerMillion).toFixed(4);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-2">
            <Volume2 className="h-8 w-8" />
            文字转语音工具
          </h1>
          <p className="text-muted-foreground">
            将文本转换为高质量语音，支持下载保存
          </p>
        </div>

        {/* Main Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>输入文本</CardTitle>
            <CardDescription>
              输入您想要转换为语音的文本（最多 4096 个字符）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入要转换的文本..."
              className="min-h-[200px] resize-y"
              maxLength={4096}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>字符数: {text.length} / 4096</span>
              <span>预估成本: ${estimateCost(text.length)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>配置选项</CardTitle>
            <CardDescription>
              选择语音类型和语速
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">语音</label>
                <Select
                  value={config.voice}
                  onValueChange={(value: VoiceType) =>
                    setConfig({ ...config, voice: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy（中性）</SelectItem>
                    <SelectItem value="echo">Echo（男性）</SelectItem>
                    <SelectItem value="shimmer">Shimmer（女性）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">语速</label>
                <Select
                  value={config.speed.toString()}
                  onValueChange={(value) =>
                    setConfig({ ...config, speed: parseFloat(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x（很慢）</SelectItem>
                    <SelectItem value="0.75">0.75x（慢）</SelectItem>
                    <SelectItem value="1.0">1.0x（正常）</SelectItem>
                    <SelectItem value="1.25">1.25x（稍快）</SelectItem>
                    <SelectItem value="1.5">1.5x（快）</SelectItem>
                    <SelectItem value="2.0">2.0x（很快）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !text.trim() || text.length > 4096}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>生成中... {progress}%</>
          ) : (
            <>
              <Volume2 className="mr-2 h-5 w-5" />
              生成语音
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              正在生成语音... {progress}%
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Audio Preview and Download */}
        {audioUrl && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                生成成功
              </CardTitle>
              <CardDescription>
                预览播放或下载音频文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio
                src={audioUrl}
                controls
                className="w-full"
                controlsList="nodownload"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(audioUrl, text.substring(0, 50))}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载音频
                </Button>
                <Button
                  onClick={clearAudio}
                  variant="outline"
                >
                  清除
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>历史记录</CardTitle>
                <CardDescription>
                  最近生成的语音文件（最多保存 10 条）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('zh-CN')} · {item.config.voice} · {item.config.speed}x
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {item.audioUrl && (
                          <Button
                            onClick={() => handleDownload(item.audioUrl!, item.title)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteHistoryItem(item.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Usage Tips */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">使用提示</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 支持中英文混合文本转换</p>
            <p>• 生成的音频文件为 MP3 格式，可在手机上播放</p>
            <p>• 建议单次转换不超过 2000 字符以获得最佳效果</p>
            <p>• 历史记录保存在本地浏览器，清除缓存后会丢失</p>
            <p>• 成本估算基于 OpenAI TTS-1 标准模型（$15/百万字符）</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
