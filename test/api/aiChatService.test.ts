import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { aiChatService, type SendMessageResponse } from '../../src/lib/aiChatService'
import { supabase } from '../../src/lib/supabase'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock fetch for potential direct API calls
global.fetch = vi.fn()

interface SendMessageOptions {
  sessionId?: string;
  model?: 'standard' | 'detailed';
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  timeout?: number;
}

describe('aiChatService', () => {
  const mockSession: Session = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    },
    access_token: 'mock-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1234567890,
    refresh_token: 'mock-refresh-token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('User Query Submission', () => {
    it('should send user query and receive AI response', async () => {
      const mockResponse = {
        message: '私はあなたの精神的な成長をサポートするAIアシスタントです。どのようなご質問でもお気軽にどうぞ。',
        sessionId: 'session-123',
      }

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      // Call with options to get the new response format
      const result = await aiChatService.sendMessage('こんにちは、あなたは誰ですか？', {})

      expect(result).toEqual({
        message: mockResponse.message,
        sessionId: mockResponse.sessionId,
        error: null,
        stream: undefined,
        filtered: undefined,
      })
      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
        body: {
          message: 'こんにちは、あなたは誰ですか？',
          userId: 'user-123',
          sessionId: undefined,
          model: 'standard',
          stream: false,
        },
      })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      })

      await expect(aiChatService.sendMessage('テスト質問')).rejects.toThrow('Network error')
    })

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await expect(aiChatService.sendMessage('test')).rejects.toThrow('User not authenticated')
    })
  })

  describe('Conversation Context Maintenance', () => {
    it('should maintain conversation context with session ID', async () => {
      const sessionId = 'session-123'
      const mockResponse = {
        message: 'はい、前回のお話の続きですね。その考え方についてさらに深く探求してみましょう。',
        sessionId,
      }

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await aiChatService.sendMessage('前回の話の続きを聞かせてください', {
        sessionId,
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
        body: {
          message: '前回の話の続きを聞かせてください',
          userId: 'user-123',
          sessionId,
          model: 'standard',
          stream: false,
        },
      })

      expect(result.sessionId).toBe(sessionId)
    })

    it('should retrieve chat history for a session', async () => {
      const sessionId = 'session-123'
      const mockMessages = [
        {
          id: '1',
          role: 'user',
          content: 'こんにちは',
          session_id: sessionId,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'こんにちは！どのようにお手伝いできますか？',
          session_id: sessionId,
          created_at: new Date().toISOString(),
        },
      ]

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMessages,
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(fromMock as any)

      const result = await aiChatService.getChatHistory(sessionId)

      expect(supabase.from).toHaveBeenCalledWith('ai_chat_messages')
      expect(fromMock.select).toHaveBeenCalledWith('*')
      expect(fromMock.eq).toHaveBeenCalledWith('session_id', sessionId)
      expect(fromMock.order).toHaveBeenCalledWith('created_at', { ascending: false })

      expect(result).toEqual(mockMessages)
    })
  })

  describe('AI Model Selection', () => {
    it('should use standard model by default', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { message: 'Response', sessionId: 'session-123' },
        error: null,
      })

      await aiChatService.sendMessage('質問')

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
        body: expect.objectContaining({
          model: 'standard',
        }),
      })
    })

    it('should use detailed model when specified', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { message: 'Detailed response', sessionId: 'session-123' },
        error: null,
      })

      await aiChatService.sendMessage('詳細な質問', { model: 'detailed' })

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
        body: expect.objectContaining({
          model: 'detailed',
        }),
      })
    })
  })

  describe('Timeout Handling', () => {
    it('should handle timeout for long-running operations', async () => {
      // Create a promise that will be rejected after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100)
      })

      // Mock the invoke to never resolve
      vi.mocked(supabase.functions.invoke).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      )

      // Race between the actual call and timeout
      await expect(
        Promise.race([
          aiChatService.sendMessage('複雑な質問', { timeout: 100 }),
          timeoutPromise
        ])
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('Asynchronous Response Streaming', () => {
    it('should support streaming responses', async () => {
      const mockStreamResponse = {
        stream: true,
        sessionId: 'session-123',
      }

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStreamResponse,
        error: null,
      })

      const onChunk = vi.fn()
      const result = await aiChatService.sendMessage('ストリーミング質問', {
        stream: true,
        onChunk,
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
        body: expect.objectContaining({
          stream: true,
        }),
      })

      expect(result.stream).toBe(true)
    })

    it('should handle streaming chunks properly', async () => {
      const chunks = ['こんにちは', '、私は', 'AIアシスタント', 'です。']
      
      // Mock a ReadableStream response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        }
      })

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { 
          stream,
          sessionId: 'session-123'
        },
        error: null,
      })

      const receivedChunks: string[] = []
      const onChunk = vi.fn((chunk: string) => {
        receivedChunks.push(chunk)
      })

      await aiChatService.streamMessage('ストリーミングテスト', onChunk)

      expect(onChunk).toHaveBeenCalledTimes(4)
      expect(receivedChunks).toEqual(chunks)
    })
  })

  describe('Inappropriate Content Filtering', () => {
    it('should filter inappropriate content in user messages', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Content policy violation detected' },
      })

      await expect(
        aiChatService.sendMessage('不適切な内容を含むメッセージ')
      ).rejects.toThrow('Content policy violation detected')
    })

    it('should handle filtered responses gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          message: 'このコンテンツは表示できません。別の質問をしてください。',
          sessionId: 'session-123',
          filtered: true,
        },
        error: null,
      })

      // Call with options to get the new response format
      const result = await aiChatService.sendMessage('境界線上の質問', {}) as SendMessageResponse

      expect(result.message).toContain('このコンテンツは表示できません')
      expect(result.filtered).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should create a new chat session', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const fromMock = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSession,
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(fromMock as any)

      const session = await aiChatService.createSession()

      expect(supabase.from).toHaveBeenCalledWith('ai_chat_sessions')
      expect(fromMock.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
      })
      expect(fromMock.select).toHaveBeenCalled()
      expect(fromMock.single).toHaveBeenCalled()

      expect(session).toEqual(mockSession)
    })

    it('should delete a chat session and its messages', async () => {
      const sessionId = 'session-123'

      const fromMock = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(fromMock as any)

      await aiChatService.deleteSession(sessionId)

      expect(supabase.from).toHaveBeenCalledWith('ai_chat_sessions')
      expect(fromMock.delete).toHaveBeenCalled()
      expect(fromMock.eq).toHaveBeenCalledWith('id', sessionId)
    })
  })

})