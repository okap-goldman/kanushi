import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendAIChatMessage, getAIChatMessages } from '../lib/chatService'
import type { Message, ChatMessage } from '../lib/chatService'

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<any>(null)

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [chatId])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const data = await getAIChatMessages(chatId)
      const formattedMessages: Message[] = data.map((msg: ChatMessage) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        createdAt: new Date(msg.created_at),
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return sendAIChatMessage(chatId, content)
    },
    onSuccess: (response) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        role: 'user',
        createdAt: new Date(),
      }
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        createdAt: new Date(),
      }
      
      setMessages(prev => [...prev, userMessage, aiMessage])
      setInput('')
    },
  })

  const handleSubmit = useCallback((e?: any) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!input.trim() || sendMessageMutation.isPending) return
    
    sendMessageMutation.mutate(input)
  }, [input, sendMessageMutation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading: isLoading || sendMessageMutation.isPending,
    messagesEndRef,
  }
}