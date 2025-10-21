import { NextRequest, NextResponse } from 'next/server';
import { GenerateSummaryResponse, MeetingSummary } from '@/types/meeting-minutes';

// Meeting Minutes - Generate Summary API Route
// 使用 GPT-4 基于转录文本生成结构化会议纪要

const SYSTEM_PROMPT = `你是一个专业的会议记录助手。你的任务是基于会议的转录文本，生成结构化的会议纪要。

请按照以下格式生成会议纪要：

1. **会议概述 (overview)**: 用1-2段话总结会议的主要内容和目的
2. **关键要点 (keyPoints)**: 列出会议中讨论的主要话题和重要信息（3-8个要点）
3. **决策事项 (decisions)**: 列出会议中做出的所有决定和结论
4. **行动项 (actionItems)**: 列出需要执行的任务，每个任务包括：
   - task: 任务描述
   - assignee: 负责人（如果提到）
   - deadline: 截止日期（如果提到）
   - priority: 优先级（high/medium/low，根据会议内容判断）
5. **参会人员 (participants)**: 列出所有参会人员（如果转录中提到）
6. **后续步骤 (nextSteps)**: 列出会议后需要采取的行动和计划

注意：
- 如果某些信息在转录中没有提到，可以省略对应字段
- 保持客观和准确，不要添加转录中没有的信息
- 使用清晰简洁的语言
- 对于行动项，如果没有明确的负责人或截止日期，可以留空

请以 JSON 格式返回结果。`;

const USER_PROMPT_TEMPLATE = `请基于以下会议转录内容生成结构化的会议纪要：

会议标题：{title}

转录内容：
{transcript}

请返回 JSON 格式的会议纪要。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, title, customPrompt } = body;

    // 验证输入
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    if (transcript.length < 50) {
      return NextResponse.json(
        { error: 'Transcript is too short. Please provide a longer transcript.' },
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

    // 准备提示词
    const meetingTitle = title || '未命名会议';
    const userPrompt = customPrompt || USER_PROMPT_TEMPLATE
      .replace('{title}', meetingTitle)
      .replace('{transcript}', transcript);

    console.log(`[GenerateSummary] Generating summary for: ${meetingTitle}`);
    console.log(`[GenerateSummary] Transcript length: ${transcript.length} characters`);

    // 调用 GPT-4 API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // 较低的温度以获得更一致的结果
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GenerateSummary] OpenAI GPT-4 API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate summary', details: errorData },
        { status: response.status }
      );
    }

    const completionData = await response.json();
    const summaryText = completionData.choices[0]?.message?.content;

    if (!summaryText) {
      throw new Error('No summary generated from GPT-4');
    }

    // 解析 JSON 响应
    let parsedSummary: MeetingSummary;
    try {
      parsedSummary = JSON.parse(summaryText);
    } catch (parseError) {
      console.error('[GenerateSummary] Failed to parse GPT-4 response:', summaryText);
      throw new Error('Failed to parse summary JSON');
    }

    // 验证和规范化数据
    const summary: MeetingSummary = {
      overview: parsedSummary.overview || '',
      keyPoints: Array.isArray(parsedSummary.keyPoints) ? parsedSummary.keyPoints : [],
      decisions: Array.isArray(parsedSummary.decisions) ? parsedSummary.decisions : [],
      actionItems: Array.isArray(parsedSummary.actionItems) ? parsedSummary.actionItems.map(item => ({
        task: item.task || '',
        assignee: item.assignee,
        deadline: item.deadline,
        priority: item.priority || 'medium',
        completed: false,
      })) : [],
      participants: Array.isArray(parsedSummary.participants) ? parsedSummary.participants : undefined,
      nextSteps: Array.isArray(parsedSummary.nextSteps) ? parsedSummary.nextSteps : undefined,
    };

    console.log(`[GenerateSummary] Summary generated successfully`);
    console.log(`[GenerateSummary] Key points: ${summary.keyPoints.length}, Decisions: ${summary.decisions.length}, Action items: ${summary.actionItems.length}`);

    const result: GenerateSummaryResponse = {
      summary,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[GenerateSummary] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
