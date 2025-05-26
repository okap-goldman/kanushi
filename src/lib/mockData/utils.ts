// モックデータ用のユーティリティ関数

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 検索機能用のモックデータフィルタリング
export const searchInText = (text: string, query: string): boolean => {
  return text.toLowerCase().includes(query.toLowerCase());
};

// ページネーション用のユーティリティ
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const paginate = <T>(
  items: T[],
  params: PaginationParams = {}
): {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
} => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: items.slice(startIndex, endIndex),
    total: items.length,
    page,
    totalPages: Math.ceil(items.length / limit)
  };
};