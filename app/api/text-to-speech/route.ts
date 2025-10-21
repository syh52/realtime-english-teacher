import { NextRequest, NextResponse } from 'next/server';

// Text-to-Speech API Route
// 使用 OpenAI TTS API 将文本转换为语音

export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed, format } = await request.json();

    // 验证输入
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text must be less than 4096 characters' },
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

    // 准备请求参数
    const ttsVoice = voice || 'alloy';
    const ttsSpeed = speed || 1.0;
    const ttsFormat = format || 'mp3';

    // 调用 OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // 使用标准质量模型
        voice: ttsVoice,
        input: text,
        speed: ttsSpeed,
        response_format: ttsFormat,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI TTS API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate speech', details: errorData },
        { status: response.status }
      );
    }

    // 获取音频数据
    const audioBuffer = await response.arrayBuffer();

    // 返回音频文件
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': `audio/${ttsFormat}`,
        'Content-Disposition': `attachment; filename="speech-${Date.now()}.${ttsFormat}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
