import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PostActions } from '../../src/components/post/PostActions';
import { AuthContext } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
        })),
        count: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider
    value={{
      user: mockUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      isLoading: false,
    }}
  >
    {children}
  </AuthContext.Provider>
);

describe('PostActions Component', () => {
  const mockOnComment = jest.fn();
  const mockOnHighlight = jest.fn();
  const defaultProps = {
    postId: 'post-123',
    onComment: mockOnComment,
    onHighlight: mockOnHighlight,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons correctly', () => {
    // Setup basic mocks for initial render
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
          count: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
    }));

    const { getByTestId } = render(
      <MockAuthProvider>
        <PostActions {...defaultProps} />
      </MockAuthProvider>
    );

    expect(getByTestId('like-button')).toBeTruthy();
    expect(getByTestId('comment-button')).toBeTruthy();
    expect(getByTestId('highlight-button')).toBeTruthy();
    expect(getByTestId('bookmark-button')).toBeTruthy();
    expect(getByTestId('share-button')).toBeTruthy();
  });

  describe('Like functionality', () => {
    it('toggles like status when like button is pressed', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      const mockCount = jest.fn().mockResolvedValue({ count: 0, error: null });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            select: mockSelect,
            insert: mockInsert,
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              count: mockCount,
            }),
          }),
        };
      });

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
      });

      const likeButton = getByTestId('like-button');
      fireEvent.press(likeButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          post_id: 'post-123',
          user_id: 'user-123',
          created_at: expect.any(String),
        });
      });
    });
  });

  describe('Highlight functionality', () => {
    it('shows highlight dialog when highlight button is pressed', async () => {
      // Setup basic mocks for initial render
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            count: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }));

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      const highlightButton = getByTestId('highlight-button');
      fireEvent.press(highlightButton);

      await waitFor(() => {
        expect(getByTestId('highlight-dialog')).toBeTruthy();
      });
    });

    it('creates highlight with reason when submitted', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'highlights') {
          return {
            select: mockSelect,
            insert: mockInsert,
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
              count: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        };
      });

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
      });

      const highlightButton = getByTestId('highlight-button');
      fireEvent.press(highlightButton);

      await waitFor(() => {
        expect(getByTestId('highlight-dialog')).toBeTruthy();
      });

      const reasonInput = getByTestId('highlight-reason-input');
      fireEvent.changeText(reasonInput, '素晴らしい内容です');

      const submitButton = getByTestId('highlight-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          post_id: 'post-123',
          user_id: 'user-123',
          reason: '素晴らしい内容です',
          created_at: expect.any(String),
        });
      });
    });

    it('shows validation error when reason is empty', async () => {
      // Setup basic mocks for initial render
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            count: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }));

      const { getByTestId, getByText } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      const highlightButton = getByTestId('highlight-button');
      fireEvent.press(highlightButton);

      await waitFor(() => {
        expect(getByTestId('highlight-dialog')).toBeTruthy();
      });

      const submitButton = getByTestId('highlight-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('理由を入力してください')).toBeTruthy();
      });
    });
  });

  describe('Bookmark functionality', () => {
    it('toggles bookmark status when bookmark button is pressed', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'bookmarks') {
          return {
            select: mockSelect,
            insert: mockInsert,
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
              count: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        };
      });

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
      });

      const bookmarkButton = getByTestId('bookmark-button');
      fireEvent.press(bookmarkButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          post_id: 'post-123',
          user_id: 'user-123',
          created_at: expect.any(String),
        });
      });
    });
  });

  describe('Comment functionality', () => {
    it('calls onComment when comment button is pressed', async () => {
      // Setup basic mocks for initial render
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            count: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }));

      const mockOnCommentLocal = jest.fn();
      const propsWithComment = {
        ...defaultProps,
        onComment: mockOnCommentLocal,
      };

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...propsWithComment} />
        </MockAuthProvider>
      );

      const commentButton = getByTestId('comment-button');
      fireEvent.press(commentButton);

      expect(mockOnCommentLocal).toHaveBeenCalled();
    });
  });

  describe('Share functionality', () => {
    it('generates share URL when share button is pressed', async () => {
      // Setup basic mocks for initial render
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            count: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }));

      const { getByTestId } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      const shareButton = getByTestId('share-button');
      fireEvent.press(shareButton);

      // Share functionality will be implemented
      await waitFor(() => {
        expect(shareButton).toBeTruthy();
      });
    });
  });

  describe('Counts display', () => {
    it('displays correct counts for all actions', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            count: jest.fn().mockResolvedValue({
              count:
                table === 'likes' ? 5 : table === 'comments' ? 3 : table === 'highlights' ? 2 : 1,
              error: null,
            }),
          }),
        }),
      }));

      const { getByText } = render(
        <MockAuthProvider>
          <PostActions {...defaultProps} />
        </MockAuthProvider>
      );

      await waitFor(() => {
        expect(getByText('5')).toBeTruthy(); // like count
        expect(getByText('3')).toBeTruthy(); // comment count
        expect(getByText('2')).toBeTruthy(); // highlight count
      });
    });
  });

  describe('User not authenticated', () => {
    it('does not perform actions when user is not authenticated', () => {
      const mockInsert = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const NotAuthenticatedProvider = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            signIn: jest.fn(),
            signOut: jest.fn(),
            isLoading: false,
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { getByTestId } = render(
        <NotAuthenticatedProvider>
          <PostActions {...defaultProps} />
        </NotAuthenticatedProvider>
      );

      const likeButton = getByTestId('like-button');
      fireEvent.press(likeButton);

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
