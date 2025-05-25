# ショップ・EC機能 テスト仕様書

## 概要
本ドキュメントは、ショップ・EC機能のTDD（Test-Driven Development）実装のためのテスト仕様書です。
APIユニットテスト、UIユニットテスト、結合テスト、E2Eテストの4種類のテストケースを定義します。

## テスト環境設定

### 依存関係
```json
{
  "devDependencies": {
    "jest-expo": "~53.0.0",
    "@testing-library/react-native": "^13",
    "@testing-library/jest-native": "^6",
    "react-native-reanimated": "~3.17.0"
  }
}
```

### Jest設定
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-reanimated': 'react-native-reanimated/mock'
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ]
};
```

## 1. APIユニットテスト

### 1.1 商品管理API

#### GET /api/products
```typescript
describe('GET /api/products', () => {
  it('商品一覧を正常に取得できること', async () => {
    const response = await fetch('/api/products');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBe(true);
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('per_page');
  });

  it('カテゴリフィルタが正しく適用されること', async () => {
    const response = await fetch('/api/products?category=AUDIO');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.products.every(p => p.category === 'AUDIO')).toBe(true);
  });

  it('価格範囲フィルタが正しく適用されること', async () => {
    const response = await fetch('/api/products?min_price=1000&max_price=5000');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.products.every(p => p.price >= 1000 && p.price <= 5000)).toBe(true);
  });

  it('ページネーションが正しく動作すること', async () => {
    const response = await fetch('/api/products?page=2&per_page=10');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.per_page).toBe(10);
    expect(data.products.length).toBeLessThanOrEqual(10);
  });
});
```

#### POST /api/products
```typescript
describe('POST /api/products', () => {
  it('物理商品を正常に作成できること', async () => {
    const product = {
      name: 'ヒーリングクリスタル',
      description: 'エネルギー浄化用クリスタル',
      price: 3000,
      category: 'PHYSICAL',
      inventory_count: 10,
      shipping_fee: 500
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(product.name);
    expect(data.category).toBe('PHYSICAL');
  });

  it('オンラインセッション商品を正常に作成できること', async () => {
    const product = {
      name: '個人カウンセリング',
      description: '60分の個人セッション',
      price: 10000,
      category: 'ONLINE_SESSION',
      session_duration: 60,
      available_dates: ['2024-01-15', '2024-01-16']
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    
    expect(response.status).toBe(201);
    expect(data.category).toBe('ONLINE_SESSION');
    expect(data.session_duration).toBe(60);
  });

  it('必須フィールドが不足している場合エラーになること', async () => {
    const invalidProduct = { name: 'テスト商品' };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidProduct)
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('message');
  });
});
```

### 1.2 音声即時出品API

#### POST /api/posts/{postId}/instant-sell
```typescript
describe('POST /api/posts/{postId}/instant-sell', () => {
  it('音声投稿から商品を作成できること', async () => {
    const postId = 'test-post-id';
    const response = await fetch(`/api/posts/${postId}/instant-sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 1500 })
    });
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toHaveProperty('product_id');
    expect(data).toHaveProperty('ai_description');
    expect(data.category).toBe('AUDIO');
    expect(data.price).toBe(1500);
  });

  it('AI商品説明が生成されること', async () => {
    const postId = 'test-post-id';
    const response = await fetch(`/api/posts/${postId}/instant-sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 2000 })
    });
    const data = await response.json();
    
    expect(data.ai_description).toBeTruthy();
    expect(data.ai_description.length).toBeGreaterThan(50);
  });

  it('存在しない投稿IDの場合エラーになること', async () => {
    const response = await fetch('/api/posts/invalid-id/instant-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 1500 })
    });
    
    expect(response.status).toBe(404);
  });
});
```

### 1.3 カート操作API

#### GET /api/cart
```typescript
describe('GET /api/cart', () => {
  it('カートの内容を取得できること', async () => {
    const response = await fetch('/api/cart');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_amount');
    expect(data).toHaveProperty('item_count');
  });

  it('空のカートも正常に取得できること', async () => {
    const response = await fetch('/api/cart');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.total_amount).toBe(0);
    expect(data.item_count).toBe(0);
  });
});
```

#### POST /api/cart/items
```typescript
describe('POST /api/cart/items', () => {
  it('カートに商品を追加できること', async () => {
    const item = {
      product_id: 'test-product-id',
      quantity: 2
    };

    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toHaveProperty('cart_item_id');
    expect(data.quantity).toBe(2);
  });

  it('同じ商品を追加すると数量が増えること', async () => {
    const item = {
      product_id: 'test-product-id',
      quantity: 1
    };

    // 初回追加
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });

    // 2回目追加
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.quantity).toBe(2);
  });

  it('在庫を超える数量は追加できないこと', async () => {
    const item = {
      product_id: 'limited-product-id',
      quantity: 100
    };

    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.code).toBe('INSUFFICIENT_INVENTORY');
  });
});
```

### 1.4 決済API

#### POST /api/checkout
```typescript
describe('POST /api/checkout', () => {
  it('チェックアウトセッションを作成できること', async () => {
    const checkoutData = {
      shipping_address: {
        postal_code: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        address_line1: '千代田1-1',
        phone: '090-1234-5678'
      }
    };

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData)
    });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('checkout_url');
    expect(data).toHaveProperty('session_id');
    expect(data.checkout_url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  it('カートが空の場合エラーになること', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.code).toBe('EMPTY_CART');
  });

  it('配送先が必要な商品で住所がない場合エラーになること', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.code).toBe('SHIPPING_ADDRESS_REQUIRED');
  });
});
```

### 1.5 ギフトAPI

#### POST /api/posts/{postId}/gift
```typescript
describe('POST /api/posts/{postId}/gift', () => {
  it('光ギフトを送信できること', async () => {
    const giftData = {
      amount: 600,
      message: '素敵な投稿ありがとうございます！'
    };

    const response = await fetch('/api/posts/test-post-id/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giftData)
    });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('gift_id');
    expect(data).toHaveProperty('checkout_url');
  });

  it('無効な金額の場合エラーになること', async () => {
    const giftData = { amount: 999 };

    const response = await fetch('/api/posts/test-post-id/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giftData)
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('300, 600, 1200');
  });
});
```

## 2. UIユニットテスト

### 2.1 商品コンポーネント

#### ProductCard.tsx
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '@/components/shop/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'テスト商品',
    description: 'これはテスト商品です',
    price: 1500,
    category: 'PHYSICAL',
    images: ['https://example.com/image.jpg'],
    seller: {
      id: 'seller1',
      username: 'test_seller',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  };

  it('商品情報が正しく表示されること', () => {
    const { getByText, getByTestId } = render(
      <ProductCard product={mockProduct} />
    );
    
    expect(getByText('テスト商品')).toBeTruthy();
    expect(getByText('¥1,500')).toBeTruthy();
    expect(getByText('@test_seller')).toBeTruthy();
  });

  it('カートに追加ボタンが機能すること', () => {
    const onAddToCart = jest.fn();
    const { getByText } = render(
      <ProductCard product={mockProduct} onAddToCart={onAddToCart} />
    );
    
    fireEvent.press(getByText('カートに追加'));
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });

  it('音声商品の場合プレイヤーが表示されること', () => {
    const audioProduct = {
      ...mockProduct,
      category: 'AUDIO',
      audio_url: 'https://example.com/audio.mp3'
    };
    
    const { getByTestId } = render(
      <ProductCard product={audioProduct} />
    );
    
    expect(getByTestId('audio-player')).toBeTruthy();
  });

  it('在庫切れの場合ボタンが無効化されること', () => {
    const soldOutProduct = {
      ...mockProduct,
      inventory_count: 0
    };
    
    const { getByText } = render(
      <ProductCard product={soldOutProduct} />
    );
    
    const button = getByText('在庫切れ');
    expect(button).toBeDisabled();
  });
});
```

#### CartItem.tsx
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import CartItem from '@/components/shop/CartItem';

describe('CartItem', () => {
  const mockItem = {
    id: '1',
    product: {
      id: 'prod1',
      name: 'テスト商品',
      price: 1500,
      images: ['https://example.com/image.jpg']
    },
    quantity: 2
  };

  it('カートアイテムが正しく表示されること', () => {
    const { getByText, getByTestId } = render(
      <CartItem item={mockItem} />
    );
    
    expect(getByText('テスト商品')).toBeTruthy();
    expect(getByText('¥3,000')).toBeTruthy(); // 1500 × 2
    expect(getByTestId('quantity-display').props.children).toBe('2');
  });

  it('数量を増減できること', () => {
    const onUpdateQuantity = jest.fn();
    const { getByTestId } = render(
      <CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />
    );
    
    fireEvent.press(getByTestId('increase-quantity'));
    expect(onUpdateQuantity).toHaveBeenCalledWith(mockItem.id, 3);
    
    fireEvent.press(getByTestId('decrease-quantity'));
    expect(onUpdateQuantity).toHaveBeenCalledWith(mockItem.id, 1);
  });

  it('数量が1の時に減らすと削除確認が表示されること', () => {
    const itemWithOne = { ...mockItem, quantity: 1 };
    const onRemove = jest.fn();
    const { getByTestId, getByText } = render(
      <CartItem item={itemWithOne} onRemove={onRemove} />
    );
    
    fireEvent.press(getByTestId('decrease-quantity'));
    expect(getByText('カートから削除しますか？')).toBeTruthy();
  });

  it('削除ボタンが機能すること', () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      <CartItem item={mockItem} onRemove={onRemove} />
    );
    
    fireEvent.press(getByTestId('remove-item'));
    expect(onRemove).toHaveBeenCalledWith(mockItem.id);
  });
});
```

### 2.2 チェックアウトコンポーネント

#### CheckoutForm.tsx
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckoutForm from '@/components/shop/CheckoutForm';

describe('CheckoutForm', () => {
  const mockCart = {
    items: [
      {
        id: '1',
        product: { id: 'p1', name: '商品1', price: 1000, category: 'PHYSICAL' },
        quantity: 1
      }
    ],
    total_amount: 1500, // 商品 + 送料
    shipping_fee: 500
  };

  it('フォームフィールドが正しく表示されること', () => {
    const { getByPlaceholder } = render(
      <CheckoutForm cart={mockCart} />
    );
    
    expect(getByPlaceholder('郵便番号')).toBeTruthy();
    expect(getByPlaceholder('都道府県')).toBeTruthy();
    expect(getByPlaceholder('市区町村')).toBeTruthy();
    expect(getByPlaceholder('番地・建物名')).toBeTruthy();
    expect(getByPlaceholder('電話番号')).toBeTruthy();
  });

  it('合計金額が正しく表示されること', () => {
    const { getByText } = render(
      <CheckoutForm cart={mockCart} />
    );
    
    expect(getByText('小計: ¥1,000')).toBeTruthy();
    expect(getByText('送料: ¥500')).toBeTruthy();
    expect(getByText('合計: ¥1,500')).toBeTruthy();
  });

  it('バリデーションエラーが表示されること', async () => {
    const { getByText, getByPlaceholder } = render(
      <CheckoutForm cart={mockCart} />
    );
    
    fireEvent.press(getByText('購入手続きへ'));
    
    await waitFor(() => {
      expect(getByText('郵便番号を入力してください')).toBeTruthy();
    });
  });

  it('有効なフォームで送信できること', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholder } = render(
      <CheckoutForm cart={mockCart} onSubmit={onSubmit} />
    );
    
    fireEvent.changeText(getByPlaceholder('郵便番号'), '100-0001');
    fireEvent.changeText(getByPlaceholder('都道府県'), '東京都');
    fireEvent.changeText(getByPlaceholder('市区町村'), '千代田区');
    fireEvent.changeText(getByPlaceholder('番地・建物名'), '千代田1-1');
    fireEvent.changeText(getByPlaceholder('電話番号'), '090-1234-5678');
    
    fireEvent.press(getByText('購入手続きへ'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
```

### 2.3 音声即時出品コンポーネント

#### InstantSellModal.tsx
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InstantSellModal from '@/components/shop/InstantSellModal';

describe('InstantSellModal', () => {
  const mockPost = {
    id: 'post1',
    content: 'テスト音声投稿',
    audio_url: 'https://example.com/audio.mp3',
    duration: 180 // 3分
  };

  it('価格入力フィールドが表示されること', () => {
    const { getByPlaceholder } = render(
      <InstantSellModal post={mockPost} visible={true} />
    );
    
    expect(getByPlaceholder('価格を入力')).toBeTruthy();
  });

  it('推奨価格が表示されること', () => {
    const { getByText } = render(
      <InstantSellModal post={mockPost} visible={true} />
    );
    
    expect(getByText('推奨価格: ¥500〜¥2,000')).toBeTruthy();
  });

  it('AI説明生成中の表示がされること', async () => {
    const onConfirm = jest.fn();
    const { getByText, getByPlaceholder } = render(
      <InstantSellModal 
        post={mockPost} 
        visible={true} 
        onConfirm={onConfirm}
      />
    );
    
    fireEvent.changeText(getByPlaceholder('価格を入力'), '1500');
    fireEvent.press(getByText('出品する'));
    
    expect(getByText('AI説明を生成中...')).toBeTruthy();
  });

  it('キャンセルできること', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <InstantSellModal 
        post={mockPost} 
        visible={true} 
        onCancel={onCancel}
      />
    );
    
    fireEvent.press(getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

## 3. 結合テスト

### 3.1 商品購入フロー
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ShopNavigator from '@/navigation/ShopNavigator';
import { setupServer } from 'msw/native';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/products', (req, res, ctx) => {
    return res(ctx.json({
      products: [
        {
          id: '1',
          name: 'テスト商品',
          price: 1500,
          category: 'PHYSICAL'
        }
      ]
    }));
  }),
  rest.post('/api/cart/items', (req, res, ctx) => {
    return res(ctx.json({ cart_item_id: '1' }));
  }),
  rest.post('/api/checkout', (req, res, ctx) => {
    return res(ctx.json({
      checkout_url: 'https://checkout.stripe.com/test',
      session_id: 'cs_test_123'
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('商品購入フロー結合テスト', () => {
  it('商品一覧から購入完了まで遷移できること', async () => {
    const { getByText, getByPlaceholder } = render(
      <NavigationContainer>
        <ShopNavigator />
      </NavigationContainer>
    );
    
    // 商品一覧が表示される
    await waitFor(() => {
      expect(getByText('テスト商品')).toBeTruthy();
    });
    
    // カートに追加
    fireEvent.press(getByText('カートに追加'));
    
    // カート画面へ遷移
    fireEvent.press(getByTestId('cart-icon'));
    
    await waitFor(() => {
      expect(getByText('カート')).toBeTruthy();
      expect(getByText('テスト商品')).toBeTruthy();
    });
    
    // チェックアウトへ
    fireEvent.press(getByText('購入手続きへ'));
    
    // 配送先入力
    fireEvent.changeText(getByPlaceholder('郵便番号'), '100-0001');
    fireEvent.changeText(getByPlaceholder('都道府県'), '東京都');
    fireEvent.changeText(getByPlaceholder('市区町村'), '千代田区');
    fireEvent.changeText(getByPlaceholder('番地・建物名'), '千代田1-1');
    fireEvent.changeText(getByPlaceholder('電話番号'), '090-1234-5678');
    
    // 決済へ
    fireEvent.press(getByText('決済へ進む'));
    
    // Stripe決済画面への遷移を確認
    await waitFor(() => {
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        'https://checkout.stripe.com/test'
      );
    });
  });
});
```

### 3.2 音声即時出品フロー
```typescript
describe('音声即時出品フロー結合テスト', () => {
  it('音声投稿から商品出品まで完了できること', async () => {
    const { getByText, getByPlaceholder, getByTestId } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
    
    // 音声投稿画面へ
    fireEvent.press(getByTestId('create-post-button'));
    fireEvent.press(getByText('音声'));
    
    // 録音
    fireEvent.press(getByTestId('record-button'));
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒録音
    fireEvent.press(getByTestId('stop-button'));
    
    // 投稿
    fireEvent.changeText(getByPlaceholder('何を話しましたか？'), 'テスト音声');
    fireEvent.press(getByText('投稿'));
    
    // 投稿詳細画面で「販売する」ボタンを押す
    await waitFor(() => {
      expect(getByText('販売する')).toBeTruthy();
    });
    fireEvent.press(getByText('販売する'));
    
    // 価格設定モーダル
    fireEvent.changeText(getByPlaceholder('価格を入力'), '1500');
    fireEvent.press(getByText('出品する'));
    
    // AI説明生成待機
    await waitFor(() => {
      expect(getByText('出品が完了しました')).toBeTruthy();
    }, { timeout: 10000 });
    
    // 商品ページへ遷移
    fireEvent.press(getByText('商品ページを見る'));
    
    // 商品詳細が表示される
    expect(getByText('テスト音声')).toBeTruthy();
    expect(getByText('¥1,500')).toBeTruthy();
    expect(getByTestId('ai-description')).toBeTruthy();
  });
});
```

### 3.3 ギフト送信フロー
```typescript
describe('光ギフト送信フロー結合テスト', () => {
  it('投稿にギフトを送信できること', async () => {
    const { getByText, getByTestId } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
    
    // タイムラインで投稿を表示
    await waitFor(() => {
      expect(getByText('素晴らしい投稿')).toBeTruthy();
    });
    
    // ギフトボタンを押す
    fireEvent.press(getByTestId('gift-button-post1'));
    
    // ギフト金額選択
    fireEvent.press(getByText('¥600'));
    
    // メッセージ入力（オプション）
    fireEvent.changeText(
      getByPlaceholder('メッセージ（任意）'),
      'ありがとうございます！'
    );
    
    // 送信
    fireEvent.press(getByText('ギフトを送る'));
    
    // 決済画面へ遷移
    await waitFor(() => {
      expect(mockLinking.openURL).toHaveBeenCalled();
    });
  });
});
```

## 4. E2Eテスト

### 4.1 商品購入シナリオ
```typescript
// Detoxを使用したE2Eテスト
describe('商品購入E2Eテスト', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.reloadReactNative();
  });

  it('新規ユーザーが商品を購入できること', async () => {
    // ログイン
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // ショップタブへ
    await element(by.id('shop-tab')).tap();
    
    // 商品を探す
    await element(by.id('search-input')).typeText('クリスタル');
    await element(by.id('search-button')).tap();
    
    // 商品詳細へ
    await element(by.text('ヒーリングクリスタル')).tap();
    
    // カートに追加
    await element(by.id('add-to-cart-button')).tap();
    
    // カートへ移動
    await element(by.id('cart-icon')).tap();
    
    // チェックアウト
    await element(by.id('checkout-button')).tap();
    
    // 配送先入力
    await element(by.id('postal-code-input')).typeText('100-0001');
    await element(by.id('prefecture-input')).typeText('東京都');
    await element(by.id('city-input')).typeText('千代田区');
    await element(by.id('address-input')).typeText('千代田1-1');
    await element(by.id('phone-input')).typeText('090-1234-5678');
    
    // 決済へ
    await element(by.id('proceed-to-payment')).tap();
    
    // Stripe決済（WebViewで処理）
    await element(by.id('card-number')).typeText('4242424242424242');
    await element(by.id('card-expiry')).typeText('12/25');
    await element(by.id('card-cvc')).typeText('123');
    await element(by.id('pay-button')).tap();
    
    // 注文完了画面
    await expect(element(by.text('注文が完了しました'))).toBeVisible();
    await expect(element(by.id('order-number'))).toBeVisible();
  });
});
```

### 4.2 出品者シナリオ
```typescript
describe('出品者フローE2Eテスト', () => {
  it('音声を録音して即時出品し、売上を確認できること', async () => {
    // ログイン
    await element(by.id('email-input')).typeText('seller@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // 音声投稿作成
    await element(by.id('create-post-fab')).tap();
    await element(by.text('音声')).tap();
    
    // 録音開始
    await element(by.id('record-button')).tap();
    await waitFor(element(by.id('recording-timer')))
      .toHaveText('0:05')
      .withTimeout(6000);
    
    // 録音停止
    await element(by.id('stop-button')).tap();
    
    // 投稿内容入力
    await element(by.id('post-content-input'))
      .typeText('瞑想ガイダンス音声です');
    await element(by.id('hashtag-input')).typeText('#瞑想');
    
    // 投稿
    await element(by.id('post-button')).tap();
    
    // 投稿完了後、販売ボタンを押す
    await waitFor(element(by.id('sell-button')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('sell-button')).tap();
    
    // 価格設定
    await element(by.id('price-input')).clearText();
    await element(by.id('price-input')).typeText('2000');
    await element(by.id('confirm-sell-button')).tap();
    
    // AI説明生成待機
    await waitFor(element(by.text('出品が完了しました')))
      .toBeVisible()
      .withTimeout(15000);
    
    // プロフィールへ移動
    await element(by.id('profile-tab')).tap();
    
    // 売上ダッシュボード
    await element(by.id('sales-dashboard-button')).tap();
    
    // 商品が表示される
    await expect(element(by.text('瞑想ガイダンス音声です'))).toBeVisible();
    await expect(element(by.text('¥2,000'))).toBeVisible();
    await expect(element(by.text('販売中'))).toBeVisible();
  });
});
```

### 4.3 複数商品購入シナリオ
```typescript
describe('複数商品購入E2Eテスト', () => {
  it('異なるカテゴリの商品をまとめて購入できること', async () => {
    // ログイン済みとする
    
    // 物理商品を追加
    await element(by.id('shop-tab')).tap();
    await element(by.text('ヒーリンググッズ')).tap();
    await element(by.text('クリスタルセット')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('back-button')).tap();
    
    // オンラインセッションを追加
    await element(by.text('セッション')).tap();
    await element(by.text('個人カウンセリング60分')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('back-button')).tap();
    
    // 音声商品を追加
    await element(by.text('音声コンテンツ')).tap();
    await element(by.text('誘導瞑想シリーズ')).tap();
    await element(by.id('add-to-cart-button')).tap();
    
    // カートを確認
    await element(by.id('cart-icon')).tap();
    await expect(element(by.text('クリスタルセット'))).toBeVisible();
    await expect(element(by.text('個人カウンセリング60分'))).toBeVisible();
    await expect(element(by.text('誘導瞑想シリーズ'))).toBeVisible();
    
    // 数量変更
    await element(by.id('quantity-increase-crystal')).tap();
    
    // チェックアウト
    await element(by.id('checkout-button')).tap();
    
    // 配送先（物理商品があるため必須）
    await element(by.id('postal-code-input')).typeText('100-0001');
    await element(by.id('prefecture-input')).typeText('東京都');
    await element(by.id('city-input')).typeText('千代田区');
    await element(by.id('address-input')).typeText('千代田1-1');
    await element(by.id('phone-input')).typeText('090-1234-5678');
    
    // 決済
    await element(by.id('proceed-to-payment')).tap();
    
    // 注文完了
    await waitFor(element(by.text('注文が完了しました')))
      .toBeVisible()
      .withTimeout(30000);
      
    // 注文詳細確認
    await element(by.id('view-order-details')).tap();
    await expect(element(by.text('クリスタルセット × 2'))).toBeVisible();
    await expect(element(by.text('配送予定'))).toBeVisible();
    await expect(element(by.text('セッション予約URL'))).toBeVisible();
    await expect(element(by.text('音声ダウンロード'))).toBeVisible();
  });
});
```

## テスト実行設定

### package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test --configuration ios.sim.debug",
    "test:e2e:build": "detox build --configuration ios.sim.debug"
  }
}
```

### テストカバレッジ目標
- APIユニットテスト: 90%以上
- UIユニットテスト: 80%以上
- 結合テスト: 主要フローの100%
- E2Eテスト: クリティカルパスの100%

## 注意事項

1. **最小限のモック使用**
   - 外部API（Stripe、Gemini）のみモック化
   - データベースアクセスは実際のテストDBを使用
   - UIコンポーネントは実際のレンダリングをテスト

2. **テストデータ管理**
   - 各テストケースで独立したデータを使用
   - テスト後は必ずクリーンアップ
   - シードデータは最小限に

3. **非同期処理**
   - `waitFor`を適切に使用
   - タイムアウト値は環境に応じて調整
   - ネットワークエラーのリトライ処理をテスト

4. **パフォーマンステスト**
   - 大量データでの動作確認
   - メモリリークの検出
   - レンダリング速度の計測

このテスト仕様書に基づいてTDDでの実装を進めることで、品質の高いショップ・EC機能を構築できます。