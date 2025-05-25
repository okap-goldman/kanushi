import * as Linking from 'expo-linking';
import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from './env';

// OpenRouter configuration
const DEFAULT_MODEL = 'openai/gpt-4.1';

// Initialize OpenAI with OpenRouter base URL
const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': Linking.createURL('/'),
    'X-Title': 'Kanushi Chat',
  },
  // React Native環境では dangerouslyAllowBrowser は不要
});

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
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
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': Linking.createURL('/'),
        'X-Title': 'Kanushi Chat',
      },
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

/**
 * Store for chat messages (in-memory for now)
 */
const chatStore = new Map<string, ChatMessage[]>();

/**
 * Send a chat message and get AI response
 */
export async function sendAIChatMessage(
  chatId: string,
  content: string
): Promise<{ content: string }> {
  try {
    // Get existing messages for context
    const existingMessages = chatStore.get(chatId) || [];

    // Convert to Message format for the API
    const messages: Message[] = existingMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Add the new user message
    messages.push({ role: 'user', content });

    // Get AI response
    const response = await sendChatRequest(messages);

    // Store messages
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: response,
      role: 'assistant',
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...existingMessages, userMessage, aiMessage];
    chatStore.set(chatId, updatedMessages);

    return { content: response };
  } catch (error) {
    console.error('Error sending AI chat message:', error);
    throw error;
  }
}

/**
 * Get chat messages for a specific chat
 */
export async function getAIChatMessages(chatId: string): Promise<ChatMessage[]> {
  return chatStore.get(chatId) || [];
}
