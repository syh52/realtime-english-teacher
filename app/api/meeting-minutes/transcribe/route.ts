import { NextRequest, NextResponse } from 'next/server';
import { TranscribeResponse } from '@/types/meeting-minutes';

// Meeting Minutes - Transcribe API Route
// 使用 OpenAI Whisper API 将音频文件转录为文字

export async function POST(request: NextRequest) {
  try {
    // 获取上传的文件
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;
    const language = formData.get('language') as string | null;

    // 验证文件
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 100MB）
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // 验证文件格式
    const allowedFormats = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/webm'];
    if (!allowedFormats.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|m4a|wav|webm)$/i)) {
      return NextResponse.json(
        { error: 'Unsupported audio format. Please use mp3, m4a, wav, or webm' },
        { status: 400 }
      );
    }

    // 验证 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // 准备 FormData 发送给 OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');

    // 如果指定了语言，添加 language 参数
    if (language) {
      whisperFormData.append('language', language);
    }

    // 添加时间戳格式
    whisperFormData.append('response_format', 'verbose_json');

    console.log(`[Transcribe] Starting transcription for file: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`);

    // 调用 OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Transcribe] OpenAI Whisper API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: errorData },
        { status: response.status }
      );
    }

    // 解析转录结果
    const transcriptionData = await response.json();

    console.log(`[Transcribe] Transcription completed. Duration: ${transcriptionData.duration}s`);

    const result: TranscribeResponse = {
      transcript: transcriptionData.text,
      duration: transcriptionData.duration || 0,
      language: transcriptionData.language,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[Transcribe] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 配置 API 路由以支持大文件上传
export const config = {
  api: {
    bodyParser: false, // 禁用默认的 body parser
    responseLimit: false, // 禁用响应大小限制
  },
};
