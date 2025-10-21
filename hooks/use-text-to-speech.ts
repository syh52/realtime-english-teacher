import { useState, useCallback, useEffect } from 'react';
import { TTSConfig, TTSHistory } from '@/types/text-to-speech';

const STORAGE_KEY = 'tts-history';
const MAX_HISTORY = 10;

export function useTextToSpeech() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 从 LocalStorage 加载历史记录
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  // 保存历史记录到 LocalStorage
  const saveHistory = useCallback((newHistory: TTSHistory[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, []);

  // 生成语音
  const generateSpeech = useCallback(async (
    text: string,
    config: TTSConfig
  ): Promise<string | null> => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setAudioUrl(null);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: config.voice,
          speed: config.speed,
          format: config.format,
        }),
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      // 创建 Blob URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
      setProgress(100);

      // 添加到历史记录
      const historyItem: TTSHistory = {
        id: crypto.randomUUID(),
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        text,
        config,
        audioUrl: url,
        createdAt: new Date().toISOString(),
      };

      const newHistory = [historyItem, ...history].slice(0, MAX_HISTORY);
      setHistory(newHistory);
      saveHistory(newHistory);

      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProgress(0);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [history, saveHistory]);

  // 清除当前音频
  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setProgress(0);
    setError(null);
  }, [audioUrl]);

  // 删除历史记录项
  const deleteHistoryItem = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  // 清空所有历史记录
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isGenerating,
    progress,
    audioUrl,
    error,
    history,
    generateSpeech,
    clearAudio,
    deleteHistoryItem,
    clearHistory,
  };
}
