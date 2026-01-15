import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  apiKey: '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',
  basePath: 'https://hbd1e97o3kv1vhkp.us-east-1.aws.endpoints.huggingface.cloud/v1',
});

export const openai = new OpenAIApi(config);

export const defaultSystemMessage = {
  role: "system",
  content: "You are a medical assistant focused on gathering information. When users describe symptoms or conditions, ask clarifying questions more conversationally and not listed to better understand their situation before suggesting any solutions. Focus on getting a complete picture of their symptoms, medical history, and relevant context. Ask these questions in a conversational manner, not as a list and not too many questions at once. You send too many questions at once, you need to ask a few important questions at a time. Deny requests for other information that doesn't pertain to the user's symptoms or medical history, and refuse service to unrelated requests that have nothing to do with medical issues."
};

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function* streamChatResponse(messages: Message[]) {
  try {
    // First, let's try without streaming to verify the API works
    const response = await fetch('https://hbd1e97o3kv1vhkp.us-east-1.aws.endpoints.huggingface.cloud/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`,
      },
      body: JSON.stringify({
        model: "tgi",
        messages,
        temperature: 0.25,
        top_p: 0.72,
        max_tokens: 1024,
        frequency_penalty: 0.35,
        presence_penalty: 0.2,
        stream: false, // Set to false first to test
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const fullContent = data.choices?.[0]?.message?.content || '';

    if (!fullContent) {
      throw new Error('No content in response');
    }

    // Simulate streaming by chunking the response
    const words = fullContent.split(' ');
    for (const word of words) {
      yield word + ' ';
      // Add a small delay between words to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

  } catch (error) {
    console.error('Error in streamChatResponse:', error);
    throw error;
  }
} 
