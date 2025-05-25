import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchBar as AISearchBar } from '../../src/components/search/SearchBar'

describe('SearchBar Component', () => {
  const mockOnSearch = vi.fn()
  const mockOnClear = vi.fn()
  const mockOnFocus = vi.fn()
  const mockOnBlur = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render search input field and icon', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      expect(getByPlaceholderText('検索...')).toBeTruthy()
      expect(getByTestId('search-icon')).toBeTruthy()
    })

    it('should render with custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} placeholder="ユーザーを検索" />
      )

      expect(getByPlaceholderText('ユーザーを検索')).toBeTruthy()
    })

    it('should render with initial value', () => {
      const { getByDisplayValue } = render(
        <AISearchBar onSearch={mockOnSearch} initialValue="初期値" />
      )

      expect(getByDisplayValue('初期値')).toBeTruthy()
    })
  })

  describe('Search Input', () => {
    it('should update value on text input', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, '瞑想')

      expect(input.props.value).toBe('瞑想')
    })

    it('should maintain controlled input state', () => {
      const { getByPlaceholderText, rerender } = render(
        <AISearchBar onSearch={mockOnSearch} value="" />
      )

      const input = getByPlaceholderText('検索...')
      
      // Try to change text - should not update since it's controlled
      fireEvent.changeText(input, '瞑想')
      expect(input.props.value).toBe('')

      // Update through props
      rerender(<AISearchBar onSearch={mockOnSearch} value="瞑想" />)
      expect(input.props.value).toBe('瞑想')
    })
  })

  describe('Search Execution', () => {
    it('should call onSearch when Enter key is pressed', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, 'テストキーワード')
      fireEvent(input, 'submitEditing')

      expect(mockOnSearch).toHaveBeenCalledWith('テストキーワード')
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })

    it('should call onSearch when search button is pressed', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      const searchButton = getByTestId('search-button')
      
      fireEvent.changeText(input, '検索ワード')
      fireEvent.press(searchButton)

      expect(mockOnSearch).toHaveBeenCalledWith('検索ワード')
    })

    it('should not call onSearch with empty keyword', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent(input, 'submitEditing')

      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('should trim whitespace before search', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, '  スペース付き  ')
      fireEvent(input, 'submitEditing')

      expect(mockOnSearch).toHaveBeenCalledWith('スペース付き')
    })
  })

  describe('Clear Functionality', () => {
    it('should show clear button when text is entered', () => {
      const { getByPlaceholderText, queryByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      
      // No clear button initially
      expect(queryByTestId('clear-button')).toBeNull()

      // Clear button appears after text input
      fireEvent.changeText(input, 'テキスト')
      expect(queryByTestId('clear-button')).toBeTruthy()
    })

    it('should clear input when clear button is pressed', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} onClear={mockOnClear} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, 'クリアテスト')
      
      const clearButton = getByTestId('clear-button')
      fireEvent.press(clearButton)

      expect(input.props.value).toBe('')
      expect(mockOnClear).toHaveBeenCalled()
    })

    it('should hide clear button after clearing', () => {
      const { getByPlaceholderText, getByTestId, queryByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, 'テスト')
      
      const clearButton = getByTestId('clear-button')
      fireEvent.press(clearButton)

      expect(queryByTestId('clear-button')).toBeNull()
    })
  })

  describe('Focus/Blur States', () => {
    it('should apply focused styles on focus', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} onFocus={mockOnFocus} />
      )

      const input = getByPlaceholderText('検索...')
      const container = getByTestId('search-container')
      
      fireEvent(input, 'focus')

      expect(mockOnFocus).toHaveBeenCalled()
      expect(container.props.style).toMatchObject({
        borderColor: expect.any(String),
      })
    })

    it('should apply blur styles on blur', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} onBlur={mockOnBlur} />
      )

      const input = getByPlaceholderText('検索...')
      const container = getByTestId('search-container')
      
      fireEvent(input, 'focus')
      fireEvent(input, 'blur')

      expect(mockOnBlur).toHaveBeenCalled()
      expect(container.props.style).toMatchObject({
        borderColor: expect.any(String),
      })
    })

    it('should maintain focus state visually', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      const container = getByTestId('search-container')
      
      // Get initial border color
      const initialStyle = container.props.style
      
      // Focus should change style
      fireEvent(input, 'focus')
      const focusedStyle = container.props.style
      
      expect(focusedStyle).not.toEqual(initialStyle)
    })
  })

  describe('Auto Suggestions', () => {
    it('should show suggestions while typing', async () => {
      const mockSuggestions = ['瞑想', '瞑想音楽', '瞑想アプリ']
      const mockOnGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions)

      const { getByPlaceholderText, getByText } = render(
        <AISearchBar 
          onSearch={mockOnSearch} 
          enableSuggestions
          onGetSuggestions={mockOnGetSuggestions}
        />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, '瞑')

      await waitFor(() => {
        expect(mockOnGetSuggestions).toHaveBeenCalledWith('瞑')
      })

      await waitFor(() => {
        mockSuggestions.forEach(suggestion => {
          expect(getByText(suggestion)).toBeTruthy()
        })
      })
    })

    it('should select suggestion on tap', async () => {
      const mockSuggestions = ['瞑想']
      const mockOnGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions)

      const { getByPlaceholderText, getByText } = render(
        <AISearchBar 
          onSearch={mockOnSearch} 
          enableSuggestions
          onGetSuggestions={mockOnGetSuggestions}
        />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, '瞑')

      await waitFor(() => {
        const suggestion = getByText('瞑想')
        fireEvent.press(suggestion)
      })

      expect(input.props.value).toBe('瞑想')
      expect(mockOnSearch).toHaveBeenCalledWith('瞑想')
    })

    it('should hide suggestions after selection', async () => {
      const mockSuggestions = ['瞑想']
      const mockOnGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions)

      const { getByPlaceholderText, getByText, queryByText } = render(
        <AISearchBar 
          onSearch={mockOnSearch} 
          enableSuggestions
          onGetSuggestions={mockOnGetSuggestions}
        />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, '瞑')

      await waitFor(() => {
        const suggestion = getByText('瞑想')
        fireEvent.press(suggestion)
      })

      expect(queryByText('瞑想')).toBeNull()
    })

    it('should debounce suggestion requests', async () => {
      const mockOnGetSuggestions = vi.fn().mockResolvedValue([])

      const { getByPlaceholderText } = render(
        <AISearchBar 
          onSearch={mockOnSearch} 
          enableSuggestions
          onGetSuggestions={mockOnGetSuggestions}
          debounceDelay={300}
        />
      )

      const input = getByPlaceholderText('検索...')
      
      // Type quickly
      fireEvent.changeText(input, '瞑')
      fireEvent.changeText(input, '瞑想')
      fireEvent.changeText(input, '瞑想音')

      // Should not be called immediately
      expect(mockOnGetSuggestions).not.toHaveBeenCalled()

      // Wait for debounce
      await waitFor(() => {
        expect(mockOnGetSuggestions).toHaveBeenCalledTimes(1)
        expect(mockOnGetSuggestions).toHaveBeenCalledWith('瞑想音')
      }, { timeout: 400 })
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while searching', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AISearchBar onSearch={mockOnSearch} isLoading />
      )

      expect(getByTestId('search-loading')).toBeTruthy()
      
      const input = getByPlaceholderText('検索...')
      expect(input.props.editable).toBe(false)
    })

    it('should disable input while loading', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} isLoading />
      )

      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, 'テスト')
      fireEvent(input, 'submitEditing')

      expect(mockOnSearch).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText, getByTestId, getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      // Check input has accessibility label
      expect(getByLabelText('検索入力')).toBeTruthy()
      
      // Show clear button first
      const input = getByPlaceholderText('検索...')
      fireEvent.changeText(input, 'test')
      
      const clearButton = getByTestId('clear-button')
      const searchButton = getByTestId('search-button')
      
      expect(clearButton.props.accessibilityLabel).toBe('クリア')
      expect(searchButton.props.accessibilityLabel).toBe('検索')
    })

    it('should announce state changes', () => {
      const { getByPlaceholderText } = render(
        <AISearchBar onSearch={mockOnSearch} />
      )

      const input = getByPlaceholderText('検索...')
      
      fireEvent(input, 'focus')
      expect(input.props.accessibilityState).toMatchObject({
        selected: true,
      })

      fireEvent(input, 'blur')
      expect(input.props.accessibilityState).toMatchObject({
        selected: false,
      })
    })
  })
})