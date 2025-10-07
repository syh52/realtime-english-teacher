import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const model = searchParams.get('model');
        const voice = searchParams.get('voice');
        
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }

        // 获取请求体（SDP offer）
        const sdpOffer = await request.text();
        
        // 从请求头获取 Authorization token
        const authHeader = request.headers.get('Authorization');
        
        console.log('Proxying WebRTC request to OpenAI:', { model, voice });

        // 转发到 OpenAI
        const response = await fetch(
            `https://api.openai.com/v1/realtime?model=${model}&voice=${voice}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader || `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/sdp',
                },
                body: sdpOffer,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API request failed: ${response.status}`);
        }

        // 返回 SDP answer
        const sdpAnswer = await response.text();
        
        return new Response(sdpAnswer, {
            status: 200,
            headers: {
                'Content-Type': 'application/sdp',
            },
        });
    } catch (error) {
        console.error('Realtime proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to proxy realtime request' }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
