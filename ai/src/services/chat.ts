import { getCompletion } from './api';

// Message interface
interface Message {
  role: string;
  content: string;
}

// Response interface
interface ChatResponse {
  statusCode: number;
  body: {
    message: string;
    usage?: any;
    error?: string;
  };
}

/**
 * Send chat message using our secure server-side function
 * @param messages Array of message objects with role and content
 * @returns Response object with status and message content
 */
export async function sendChatMessage(messages: Message[]): Promise<ChatResponse> {
  try {
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request. Messages array is required.');
    }

    // Get the last user message as the prompt
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    if (!lastUserMessage) {
      throw new Error('No user message found in the conversation.');
    }
    
    // Previous messages for context (excluding the last user message)
    const conversationHistory = messages.slice(0, -1);
    
    // Call our server-side function instead of OpenAI directly!
    const response = await getCompletion({
      prompt: lastUserMessage.content,
      conversationHistory: conversationHistory,
      systemPrompt: "You are a helpful assistant.",
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    });

    return {
      statusCode: 200,
      body: {
        message: response.choices[0].message.content,
        usage: response.usage
      }
    };
  } catch (error: any) {
    console.error('Error calling API:', error);
    return {
      statusCode: 500,
      body: {
        error: 'Error processing your request',
        message: error.message
      }
    };
  }
}