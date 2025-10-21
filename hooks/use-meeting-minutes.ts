import { useState, useCallback, useEffect } from 'react';
import {
  Meeting,
  ProcessingProgress,
  TranscribeResponse,
  GenerateSummaryResponse,
  AudioFileInfo,
  MeetingSummary,
  ProcessingStatus,
} from '@/types/meeting-minutes';

const STORAGE_KEY = 'meeting-minutes-history';
const MAX_HISTORY = 20;

// 获取音频文件的时长（需要在浏览器中创建音频元素）
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      resolve(Math.floor(audio.duration));
    };

    audio.onerror = () => {
      window.URL.revokeObjectURL(audio.src);
      resolve(0); // 如果无法获取时长，返回 0
    };

    audio.src = window.URL.createObjectURL(file);
  });
}

export function useMeetingMinutes() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'upload',
    progress: 0,
    message: '准备中...',
  });
  const [error, setError] = useState<string | null>(null);

  // 从 LocalStorage 加载历史记录
  useEffect(() => {
    try {
      const savedMeetings = localStorage.getItem(STORAGE_KEY);
      if (savedMeetings) {
        setMeetings(JSON.parse(savedMeetings));
      }
    } catch (err) {
      console.error('Failed to load meeting history:', err);
    }
  }, []);

  // 保存历史记录到 LocalStorage
  const saveMeetings = useCallback((newMeetings: Meeting[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMeetings));
    } catch (err) {
      console.error('Failed to save meeting history:', err);
    }
  }, []);

  // 更新进度
  const updateProgress = useCallback((
    stage: ProcessingProgress['stage'],
    progressValue: number,
    message: string,
    errorMsg?: string
  ) => {
    setProgress({
      stage,
      progress: progressValue,
      message,
      error: errorMsg,
    });
  }, []);

  // 处理音频文件并生成会议纪要
  const processMeeting = useCallback(async (
    file: File,
    title?: string
  ): Promise<Meeting | null> => {
    setIsProcessing(true);
    setError(null);
    setCurrentMeeting(null);

    try {
      // 第一步：上传和验证文件
      updateProgress('upload', 10, '正在验证文件...');

      // 获取音频时长
      const duration = await getAudioDuration(file);

      // 创建音频文件信息
      const audioFileInfo: AudioFileInfo = {
        name: file.name,
        size: file.size,
        duration: duration > 0 ? duration : undefined,
        format: file.name.split('.').pop()?.toLowerCase() as AudioFileInfo['format'],
      };

      // 创建会议记录对象
      const meeting: Meeting = {
        id: crypto.randomUUID(),
        title: title || `会议记录 - ${new Date().toLocaleString('zh-CN')}`,
        audioFile: audioFileInfo,
        transcript: '',
        summary: {
          overview: '',
          keyPoints: [],
          decisions: [],
          actionItems: [],
        },
        createdAt: new Date().toISOString(),
        status: 'uploading',
      };

      setCurrentMeeting(meeting);

      // 第二步：转录音频
      updateProgress('transcribe', 20, '正在上传音频文件...');

      const transcribeFormData = new FormData();
      transcribeFormData.append('audioFile', file);

      updateProgress('transcribe', 30, '正在转录音频（这可能需要几分钟）...');

      const transcribeResponse = await fetch('/api/meeting-minutes/transcribe', {
        method: 'POST',
        body: transcribeFormData,
      });

      if (!transcribeResponse.ok) {
        let errorMessage = '转录失败';
        try {
          const contentType = transcribeResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await transcribeResponse.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const textError = await transcribeResponse.text();
            console.error('[MeetingMinutes] Transcribe API returned non-JSON error:', textError.substring(0, 200));
            errorMessage = `转录服务器错误 (${transcribeResponse.status})`;
          }
        } catch (e) {
          console.error('[MeetingMinutes] Failed to parse transcribe error response:', e);
        }
        throw new Error(errorMessage);
      }

      const transcribeResult: TranscribeResponse = await transcribeResponse.json();

      updateProgress('transcribe', 60, '转录完成！正在准备生成摘要...');

      // 更新会议记录
      meeting.transcript = transcribeResult.transcript;
      meeting.status = 'transcribing';
      if (transcribeResult.duration && !meeting.audioFile.duration) {
        meeting.audioFile.duration = transcribeResult.duration;
      }
      setCurrentMeeting({ ...meeting });

      // 第三步：生成会议摘要
      updateProgress('summarize', 65, '正在生成会议纪要...');

      const summaryResponse = await fetch('/api/meeting-minutes/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcribeResult.transcript,
          title: meeting.title,
        }),
      });

      if (!summaryResponse.ok) {
        let errorMessage = '生成摘要失败';
        try {
          const contentType = summaryResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await summaryResponse.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const textError = await summaryResponse.text();
            console.error('[MeetingMinutes] API returned non-JSON error:', textError.substring(0, 200));
            errorMessage = `服务器错误 (${summaryResponse.status})`;
          }
        } catch (e) {
          console.error('[MeetingMinutes] Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const summaryResult: GenerateSummaryResponse = await summaryResponse.json();

      updateProgress('summarize', 90, '正在保存会议纪要...');

      // 更新会议记录
      meeting.summary = summaryResult.summary;
      meeting.status = 'completed';
      meeting.updatedAt = new Date().toISOString();

      // 第四步：保存到历史记录
      const newMeetings = [meeting, ...meetings].slice(0, MAX_HISTORY);
      setMeetings(newMeetings);
      saveMeetings(newMeetings);
      setCurrentMeeting({ ...meeting });

      updateProgress('complete', 100, '会议纪要生成完成！');

      return meeting;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理失败，请重试';
      setError(errorMessage);
      updateProgress('upload', 0, '处理失败', errorMessage);

      // 如果有部分完成的会议记录，更新状态为错误
      if (currentMeeting) {
        const failedMeeting: Meeting = {
          ...currentMeeting,
          status: 'error',
          updatedAt: new Date().toISOString(),
        };
        setCurrentMeeting(failedMeeting);
      }

      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [meetings, saveMeetings, updateProgress, currentMeeting]);

  // 获取会议详情
  const getMeeting = useCallback((id: string): Meeting | undefined => {
    return meetings.find(m => m.id === id);
  }, [meetings]);

  // 更新会议标题
  const updateMeetingTitle = useCallback((id: string, newTitle: string) => {
    const updatedMeetings = meetings.map(m =>
      m.id === id
        ? { ...m, title: newTitle, updatedAt: new Date().toISOString() }
        : m
    );
    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    if (currentMeeting?.id === id) {
      setCurrentMeeting({ ...currentMeeting, title: newTitle });
    }
  }, [meetings, currentMeeting, saveMeetings]);

  // 更新行动项的完成状态
  const toggleActionItem = useCallback((meetingId: string, actionItemIndex: number) => {
    const updatedMeetings = meetings.map(m => {
      if (m.id === meetingId && m.summary.actionItems[actionItemIndex]) {
        const updatedActionItems = [...m.summary.actionItems];
        updatedActionItems[actionItemIndex] = {
          ...updatedActionItems[actionItemIndex],
          completed: !updatedActionItems[actionItemIndex].completed,
        };

        return {
          ...m,
          summary: {
            ...m.summary,
            actionItems: updatedActionItems,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    if (currentMeeting?.id === meetingId) {
      const updatedMeeting = updatedMeetings.find(m => m.id === meetingId);
      if (updatedMeeting) {
        setCurrentMeeting(updatedMeeting);
      }
    }
  }, [meetings, currentMeeting, saveMeetings]);

  // 删除会议记录
  const deleteMeeting = useCallback((id: string) => {
    const updatedMeetings = meetings.filter(m => m.id !== id);
    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    if (currentMeeting?.id === id) {
      setCurrentMeeting(null);
    }
  }, [meetings, currentMeeting, saveMeetings]);

  // 清空所有历史记录
  const clearAllMeetings = useCallback(() => {
    setMeetings([]);
    setCurrentMeeting(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 重置当前状态
  const reset = useCallback(() => {
    setCurrentMeeting(null);
    setIsProcessing(false);
    setError(null);
    setProgress({
      stage: 'upload',
      progress: 0,
      message: '准备中...',
    });
  }, []);

  return {
    // 状态
    meetings,
    currentMeeting,
    isProcessing,
    progress,
    error,

    // 操作
    processMeeting,
    getMeeting,
    updateMeetingTitle,
    toggleActionItem,
    deleteMeeting,
    clearAllMeetings,
    reset,
  };
}
