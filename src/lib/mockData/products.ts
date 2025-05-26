import { mockUsers } from './users';

export interface MockProduct {
  id: string;
  seller_id: string;
  seller?: typeof mockUsers[0];
  name: string;
  description: string;
  category: 'crystal' | 'book' | 'music' | 'course' | 'session' | 'other';
  price: number;
  currency: string;
  stock_quantity: number;
  images: string[];
  is_digital: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface MockOrder {
  id: string;
  user_id: string;
  items: MockOrderItem[];
  total_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  created_at: string;
}

export interface MockOrderItem {
  product_id: string;
  product?: MockProduct;
  quantity: number;
  price: number;
}

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    seller_id: '3',
    seller: mockUsers[2],
    name: 'アメジストクラスター（浄化用）',
    description: 'ブラジル産の高品質アメジストクラスター。\n強力な浄化作用があり、瞑想時の集中力を高めます。\n\nサイズ：約10cm × 8cm\n重さ：約300g',
    category: 'crystal',
    price: 15000,
    currency: 'JPY',
    stock_quantity: 5,
    images: [
      'https://picsum.photos/seed/product1-1/400/400',
      'https://picsum.photos/seed/product1-2/400/400'
    ],
    is_digital: false,
    rating: 4.8,
    reviews_count: 23,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    seller_id: '1',
    seller: mockUsers[0],
    name: '目醒めの瞑想音声コース（8週間）',
    description: '毎週新しい瞑想音声が配信される8週間のプログラム。\n\n【内容】\n・週1回の瞑想音声（各60分）\n・PDFテキスト\n・専用コミュニティへの参加権\n・個別質問への回答',
    category: 'course',
    price: 29800,
    currency: 'JPY',
    stock_quantity: 999,
    images: [
      'https://picsum.photos/seed/product2/400/400'
    ],
    is_digital: true,
    rating: 4.9,
    reviews_count: 156,
    created_at: '2024-01-05T08:00:00Z'
  },
  {
    id: '3',
    seller_id: '4',
    seller: mockUsers[3],
    name: '2024年版 あなたの星読みレポート',
    description: 'あなたの出生図を元に、2024年の運勢を詳しく解説。\n\n【内容】\n・年間の総合運\n・月別の詳細な運勢\n・恋愛・仕事・健康運\n・ラッキーアイテム＆カラー\n\n※購入後、生年月日・出生時刻・出生地をお知らせください',
    category: 'session',
    price: 12000,
    currency: 'JPY',
    stock_quantity: 50,
    images: [
      'https://picsum.photos/seed/product3/400/400'
    ],
    is_digital: true,
    rating: 4.7,
    reviews_count: 89,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    seller_id: '2',
    seller: mockUsers[1],
    name: '瞑想用BGM音源集（10曲）',
    description: '深い瞑想状態に導く特別な周波数を使用した音源集。\n\n【収録曲】\n1. 朝の目醒め（432Hz）\n2. チャクラ調整（全7曲）\n3. 深い眠りへ（528Hz）\n4. 宇宙との繋がり',
    category: 'music',
    price: 5800,
    currency: 'JPY',
    stock_quantity: 999,
    images: [
      'https://picsum.photos/seed/product4/400/400'
    ],
    is_digital: true,
    rating: 4.6,
    reviews_count: 234,
    created_at: '2023-12-20T12:00:00Z'
  }
];

export const mockOrders: MockOrder[] = [
  {
    id: '1',
    user_id: '1',
    items: [
      {
        product_id: '1',
        product: mockProducts[0],
        quantity: 1,
        price: 15000
      }
    ],
    total_amount: 15000,
    currency: 'JPY',
    status: 'delivered',
    payment_method: 'credit_card',
    created_at: '2024-01-15T14:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    items: [
      {
        product_id: '2',
        product: mockProducts[1],
        quantity: 1,
        price: 29800
      },
      {
        product_id: '4',
        product: mockProducts[3],
        quantity: 1,
        price: 5800
      }
    ],
    total_amount: 35600,
    currency: 'JPY',
    status: 'processing',
    payment_method: 'credit_card',
    created_at: '2024-01-20T10:30:00Z'
  }
];

export const getMockProduct = (productId: string): MockProduct | undefined => {
  return mockProducts.find(product => product.id === productId);
};

export const getMockUserOrders = (userId: string): MockOrder[] => {
  return mockOrders.filter(order => order.user_id === userId);
};