/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "just now", "yesterday")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 'yesterday' : `${days}d ago`;
  }
  
  // Format date as MM/DD/YY
  return dateObj.toLocaleDateString(undefined, { 
    month: 'numeric', 
    day: 'numeric',
    year: '2-digit' 
  });
}

/**
 * Utility function to handle platform-specific paths
 */
export function getPlatformPath(path: string): string {
  // In React Native, we don't need to worry about platform-specific paths
  // This is mainly for image URIs and other assets
  return path;
}

/**
 * Debounce function for search inputs and other frequent operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}