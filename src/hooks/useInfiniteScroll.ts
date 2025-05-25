import { useCallback, useRef, useState } from 'react';

interface UseInfiniteScrollProps<T> {
  fetchData: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  initialData?: T[];
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  hasNextPage: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 10,
  initialData = [],
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentPage = useRef(0);
  const isInitialized = useRef(false);

  const loadData = useCallback(
    async (page: number, isRefresh = false) => {
      try {
        setError(null);

        if (page === 0) {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        } else {
          setLoadingMore(true);
        }

        const newData = await fetchData(page, pageSize);

        if (page === 0) {
          // First page or refresh
          setData(newData);
          currentPage.current = 0;
        } else {
          // Subsequent pages
          setData((prevData) => [...prevData, ...newData]);
        }

        // Check if we have more data
        setHasNextPage(newData.length === pageSize);
        currentPage.current = page;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchData, pageSize]
  );

  const loadMore = useCallback(() => {
    // Prevent multiple simultaneous requests
    if (loadingMore || !hasNextPage || loading) {
      return;
    }

    const nextPage = currentPage.current + 1;
    loadData(nextPage);
  }, [loadData, loadingMore, hasNextPage, loading]);

  const refresh = useCallback(async () => {
    if (refreshing || loading) {
      return;
    }

    setHasNextPage(true);
    await loadData(0, true);
  }, [loadData, refreshing, loading]);

  // Initial load
  if (!isInitialized.current) {
    isInitialized.current = true;
    loadData(0);
  }

  return {
    data,
    loading,
    loadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    refreshing,
  };
}
