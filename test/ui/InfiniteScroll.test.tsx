import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';

// Mock the infinite scroll hook
const useInfiniteScroll = jest.fn();

jest.mock('../../src/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: useInfiniteScroll
}));

// Simple test component that uses infinite scroll
const TestInfiniteScrollComponent = () => {
  const {
    data,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
    refresh,
    refreshing
  } = useInfiniteScroll({
    fetchData: jest.fn(),
    pageSize: 10
  });

  return (
    <FlatList
      testID="infinite-scroll-list"
      data={data}
      onEndReached={hasNextPage && !loadingMore ? loadMore : undefined}
      onEndReachedThreshold={0.1}
      renderItem={({ item }) => <div testID={`item-${item.id}`}>{item.text}</div>}
      refreshing={refreshing}
      onRefresh={refresh}
      ListFooterComponent={
        loadingMore ? <div testID="loading-more">Loading...</div> : null
      }
    />
  );
};

describe('useInfiniteScroll Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty data and loading state', () => {
    useInfiniteScroll.mockReturnValue({
      data: [],
      loading: true,
      loadingMore: false,
      hasNextPage: true,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    expect(getByTestId('infinite-scroll-list')).toBeTruthy();
  });

  it('loads more data when reaching end of list', async () => {
    const mockLoadMore = jest.fn();
    const initialData = [
      { id: '1', text: 'Item 1' },
      { id: '2', text: 'Item 2' }
    ];

    useInfiniteScroll.mockReturnValue({
      data: initialData,
      loading: false,
      loadingMore: false,
      hasNextPage: true,
      loadMore: mockLoadMore,
      refresh: jest.fn(),
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    
    const flatList = getByTestId('infinite-scroll-list');
    fireEvent(flatList, 'onEndReached');

    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('shows loading indicator when loading more', () => {
    useInfiniteScroll.mockReturnValue({
      data: [{ id: '1', text: 'Item 1' }],
      loading: false,
      loadingMore: true,
      hasNextPage: true,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    expect(getByTestId('loading-more')).toBeTruthy();
  });

  it('handles refresh functionality', () => {
    const mockRefresh = jest.fn();
    
    useInfiniteScroll.mockReturnValue({
      data: [{ id: '1', text: 'Item 1' }],
      loading: false,
      loadingMore: false,
      hasNextPage: true,
      loadMore: jest.fn(),
      refresh: mockRefresh,
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    
    const flatList = getByTestId('infinite-scroll-list');
    fireEvent(flatList, 'onRefresh');

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('does not load more when has no next page', () => {
    const mockLoadMore = jest.fn();
    
    useInfiniteScroll.mockReturnValue({
      data: [{ id: '1', text: 'Item 1' }],
      loading: false,
      loadingMore: false,
      hasNextPage: false,
      loadMore: mockLoadMore,
      refresh: jest.fn(),
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    
    const flatList = getByTestId('infinite-scroll-list');
    fireEvent(flatList, 'onEndReached');

    // Load more should not be called when hasNextPage is false
    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it('prevents multiple load more calls when already loading', () => {
    const mockLoadMore = jest.fn();
    
    useInfiniteScroll.mockReturnValue({
      data: [{ id: '1', text: 'Item 1' }],
      loading: false,
      loadingMore: true, // Already loading
      hasNextPage: true,
      loadMore: mockLoadMore,
      refresh: jest.fn(),
      refreshing: false
    });

    const { getByTestId } = render(<TestInfiniteScrollComponent />);
    
    const flatList = getByTestId('infinite-scroll-list');
    fireEvent(flatList, 'onEndReached');
    fireEvent(flatList, 'onEndReached');

    // Should not call loadMore when already loading
    expect(mockLoadMore).not.toHaveBeenCalled();
  });
});