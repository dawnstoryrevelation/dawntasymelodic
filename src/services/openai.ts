import OpenAI from 'openai';
import type { Message } from '../stores/chat';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from the server
});

export async function callOpenAI(prompt: string, previousMessages: Message[]): Promise<string> {
  try {
    // Format previous messages for OpenAI
    const formattedMessages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the new user message
    formattedMessages.push({
      role: 'user',
      content: prompt
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the model you specified
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return "I'm sorry, there was an error processing your request. Please try again later.";
  }
}
