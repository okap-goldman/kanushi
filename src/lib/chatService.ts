import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from './env';

// OpenRouter configuration 
const DEFAULT_MODEL = 'openai/gpt-4.1';

// Initialize OpenAI with OpenRouter base URL
const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Kanushi Chat'
  },
  dangerouslyAllowBrowser: true // ブラウザでの実行を許可
});

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Send a chat request to OpenRouter
 */
export async function sendChatRequest(
  messages: Message[],
  options: ChatOptions = {}
): Promise<string> {
  try {
    // Prepare system prompt if provided
    const allMessages = [...messages];
    if (options.systemPrompt) {
      allMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    // Send request to OpenRouter
    const response = await openai.chat.completions.create({
      model: options.model || DEFAULT_MODEL,
      messages: allMessages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    });

    // Return the assistant's response
    return response.choices[0]?.message?.content || 'No response from the assistant.';
  } catch (error) {
    console.error('Error in chat request:', error);
    throw new Error('Failed to get response from AI model');
  }
}

/**
 * Get available models from OpenRouter
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Kanushi Chat'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    return data.data.map((model: any) => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}