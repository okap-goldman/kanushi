import { useState, useCallback } from 'react';
import { sendChatRequest, Message, ChatOptions } from '@/lib/chatService';

interface UseChatOptions extends ChatOptions {
  onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Send a message to the AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Add the user message to the chat
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Send request to the AI
      const response = await sendChatRequest(
        [...messages, userMessage], 
        options
      );
      
      // Add the AI response to the chat
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      return assistantMessage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);

  // Reset the chat
  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    resetChat
  };
}