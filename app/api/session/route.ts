import { NextResponse } from 'next/server';
import { ProxyAgent } from 'undici';

export async function POST() {
    try {
        if (!process.env.OPENAI_API_KEY){
            throw new Error(`OPENAI_API_KEY is not set`);
        }

        // Configure proxy if available
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

        if (proxyUrl) {
            console.log('[Session API] Using proxy:', proxyUrl);
        }

        // Use native fetch with proxy through dispatcher (undici style)
        const fetchOptions: RequestInit & { dispatcher?: ProxyAgent } = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "alloy",
                modalities: ["audio", "text"],
                instructions:"Start conversation with the user by saying 'Hello, how can I help you today?' Use the available tools when relevant. After executing a tool, you will need to respond (create a subsequent conversation item) to the user sharing the function result or error. If you do not respond with additional message with function result, user will not know you successfully executed the tool. Speak and respond in the language of the user.",
                tool_choice: "auto",
            }),
        };

        // Add proxy dispatcher with increased timeout for undici (Next.js 15)
        if (proxyUrl) {
            fetchOptions.dispatcher = new ProxyAgent({
                uri: proxyUrl,
                // Increase timeout to 30 seconds to handle slow proxy responses
                connect: { timeout: 30000 },
            });
        }

        const response = await fetch("https://api.openai.com/v1/realtime/sessions", fetchOptions);

        if (!response.ok) {
            throw new Error(`API request failed with status ${JSON.stringify(response)}`);
        }

        const data = await response.json();

        // Return the JSON response to the client
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching session data:", error);

        // Provide more specific error messages
        let errorMessage = "Failed to fetch session data";
        if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage = "Connection timeout - please check your network or proxy settings";
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = "Connection refused - proxy server may not be running";
            } else {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}