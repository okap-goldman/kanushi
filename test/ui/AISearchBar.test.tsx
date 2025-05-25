import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { AISearchBar } from '../../src/components/search/AISearchBar'
import { aiChatService } from '../../src/lib/aiChatService'
import { vi } from 'vitest'

vi.mock('../../src/lib/aiChatService', () => ({
  aiChatService: {
    searchContent: vi.fn(),
  },
}))

vi.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}))

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('AISearchBar', () => {
  const mockOnSearchResults = vi.fn()
  const mockOnAIChatPress = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input and AI chat button', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    expect(getByPlaceholderText('検索...（AIに聞く）')).toBeTruthy()
    expect(getByTestId('ai-chat-button')).toBeTruthy()
  })

  it('should trigger search when text is entered and submitted', async () => {
    const mockResults = {
      posts: [{ id: 'post-1', content: 'Test post' }],
      events: [],
      products: [],
    }

    vi.mocked(aiChatService.searchContent).mockResolvedValue(mockResults)

    const { getByPlaceholderText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '瞑想')
    fireEvent.press(searchInput)

    await waitFor(() => {
      expect(aiChatService.searchContent).toHaveBeenCalledWith('瞑想')
      expect(mockOnSearchResults).toHaveBeenCalledWith(mockResults)
    })
  })

  it('should show loading state during search', async () => {
    vi.mocked(aiChatService.searchContent).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    const { getByPlaceholderText, getByTestId } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '瞑想')
    fireEvent.press(searchInput)

    expect(getByTestId('search-loading')).toBeTruthy()
  })

  it('should handle empty search query', async () => {
    const { getByPlaceholderText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '')
    fireEvent.press(searchInput)

    await waitFor(() => {
      expect(aiChatService.searchContent).not.toHaveBeenCalled()
    })
  })

  it('should clear search input when clear button is pressed', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '瞑想')
    
    const clearButton = getByTestId('clear-search-button')
    fireEvent.press(clearButton)

    expect((searchInput as any).props.value).toBe('')
  })

  it('should handle search errors gracefully', async () => {
    const mockError = new Error('Search failed')
    vi.mocked(aiChatService.searchContent).mockRejectedValue(mockError)

    const mockToast = vi.fn()
    vi.mock('../../src/hooks/use-toast', () => ({
      useToast: () => ({ toast: mockToast }),
    }))

    const { getByPlaceholderText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '瞑想')
    fireEvent.press(searchInput)

    await waitFor(() => {
      expect(aiChatService.searchContent).toHaveBeenCalled()
    })
  })

  it('should trigger AI chat when AI button is pressed', () => {
    const { getByTestId } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
      />
    )

    const aiChatButton = getByTestId('ai-chat-button')
    fireEvent.press(aiChatButton)

    expect(mockOnAIChatPress).toHaveBeenCalled()
  })

  it('should debounce search input', async () => {
    vi.useFakeTimers()
    
    const mockResults = {
      posts: [],
      events: [],
      products: [],
    }

    vi.mocked(aiChatService.searchContent).mockResolvedValue(mockResults)

    const { getByPlaceholderText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
        debounceDelay={500}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    
    fireEvent.changeText(searchInput, '瞑')
    fireEvent.changeText(searchInput, '瞑想')
    fireEvent.changeText(searchInput, '瞑想会')

    expect(aiChatService.searchContent).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)

    await waitFor(() => {
      expect(aiChatService.searchContent).toHaveBeenCalledTimes(1)
      expect(aiChatService.searchContent).toHaveBeenCalledWith('瞑想会')
    })

    vi.useRealTimers()
  })

  it('should show search suggestions', async () => {
    const mockSuggestions = ['瞑想', '瞑想音楽', '瞑想ガイド']

    const { getByPlaceholderText, getByText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
        suggestions={mockSuggestions}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    fireEvent.focus(searchInput)

    mockSuggestions.forEach(suggestion => {
      expect(getByText(suggestion)).toBeTruthy()
    })
  })

  it('should use selected suggestion for search', async () => {
    const mockSuggestions = ['瞑想', '瞑想音楽', '瞑想ガイド']
    const mockResults = {
      posts: [],
      events: [],
      products: [],
    }

    vi.mocked(aiChatService.searchContent).mockResolvedValue(mockResults)

    const { getByPlaceholderText, getByText } = render(
      <AISearchBar 
        onSearchResults={mockOnSearchResults}
        onAIChatPress={mockOnAIChatPress}
        suggestions={mockSuggestions}
      />
    )

    const searchInput = getByPlaceholderText('検索...（AIに聞く）')
    fireEvent.focus(searchInput)

    const suggestion = getByText('瞑想音楽')
    fireEvent.press(suggestion)

    await waitFor(() => {
      expect((searchInput as any).props.value).toBe('瞑想音楽')
      expect(aiChatService.searchContent).toHaveBeenCalledWith('瞑想音楽')
    })
  })
})