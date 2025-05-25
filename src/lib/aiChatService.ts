import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  role?: 'user' | 'assistant';
  user_id?: string;
  session_id?: string;
}

export interface SendMessageOptions {
  sessionId?: string;
  model?: 'standard' | 'detailed';
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  timeout?: number;
}

export interface SendMessageResponse {
  message: string | null;
  sessionId: string | null;
  error?: string | null;
  stream?: boolean;
  filtered?: boolean;
}

export interface SearchResults {
  posts: any[];
  events: any[];
  products: any[];
}

export interface Recommendations {
  posts: string[];
  users: string[];
  events: string[];
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  keywords: string[];
}

export interface ContentSummary {
  summary: string;
  duration?: string;
  keyPoints: string[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

class AIChatService {
  // Overload signatures for backward compatibility
  async sendMessage(message: string): Promise<ChatMessage>;
  async sendMessage(message: string, options: SendMessageOptions): Promise<SendMessageResponse>;
  async sendMessage(
    message: string,
    options?: SendMessageOptions
  ): Promise<ChatMessage | SendMessageResponse> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    // Handle timeout if specified
    const invokePromise = supabase.functions.invoke('ai-chat', {
      body: {
        message,
        userId: session.user.id,
        sessionId: options?.sessionId,
        model: options?.model || 'standard',
        stream: options?.stream || false,
      },
    });

    let result;
    if (options?.timeout) {
      result = await Promise.race([
        invokePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), options.timeout)
        ),
      ]);
    } else {
      result = await invokePromise;
    }

    const { data, error } = result;

    if (error) {
      throw new Error(error.message);
    }

    // If options are provided, return the new format
    if (options) {
      return {
        message: data.message || data.response?.content || null,
        sessionId: data.sessionId || null,
        error: data.error || null,
        stream: data.stream,
        filtered: data.filtered,
      };
    }

    // Otherwise return the old format for backward compatibility
    return (
      data.response || {
        id: data.id,
        content: data.message,
        created_at: new Date().toISOString(),
        role: 'assistant',
        user_id: session.user.id,
      }
    );
  }

  // Method for streaming messages
  async streamMessage(message: string, onChunk: (chunk: string) => void): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message,
        userId: session.user.id,
        stream: true,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Handle streaming response
    if (data.stream && data.stream instanceof ReadableStream) {
      const reader = data.stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          onChunk(chunk);
        }
      } finally {
        reader.releaseLock();
      }
    }
  }

  // Method to create a new chat session
  async createSession(): Promise<ChatSession> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Method to delete a chat session
  async deleteSession(sessionId: string): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('ai_chat_sessions').delete().eq('id', sessionId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Overload for backward compatibility
  async getChatHistory(limit?: number): Promise<ChatMessage[]>;
  async getChatHistory(sessionId: string): Promise<ChatMessage[]>;
  async getChatHistory(sessionIdOrLimit?: string | number): Promise<ChatMessage[]> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    let query = supabase.from('ai_chat_messages').select('*');

    // If string is provided, it's a sessionId
    if (typeof sessionIdOrLimit === 'string') {
      query = query.eq('session_id', sessionIdOrLimit).order('created_at', { ascending: false });
    } else {
      // Otherwise it's a limit (or undefined)
      const limit = sessionIdOrLimit || 100;
      query = query.order('created_at', { ascending: false }).limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async searchContent(query: string): Promise<SearchResults> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('ai-search', {
      body: {
        query,
        userId: session.user.id,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.results;
  }

  async getRecommendations(): Promise<Recommendations> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('ai-recommendations', {
      body: {
        userId: session.user.id,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.recommendations;
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('ai-sentiment', {
      body: {
        text,
        userId: session.user.id,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.analysis;
  }

  async generateSummary(
    contentId: string,
    contentType: 'audio' | 'text' = 'audio'
  ): Promise<ContentSummary> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('ai-summary', {
      body: {
        contentId,
        contentType,
        userId: session.user.id,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.summary;
  }

  async clearChatHistory(): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('ai_chat_messages')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const aiChatService = new AIChatService();
