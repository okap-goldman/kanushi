import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApplePayOrder, createApplePayCartOrder, checkApplePayAvailability } from '../../src/lib/ecService';

// Mock dependencies
vi.mock('../../src/lib/stripeService', () => ({
  stripeService: {
    createApplePaymentIntent: vi.fn(),
    isApplePayAvailable: vi.fn(),
  },
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

describe('EC Service Apple Pay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApplePayOrder', () => {
    it('Apple Pay注文を正常に作成できる', async () => {
      const mockProduct = {
        id: 'product123',
        title: 'テスト商品',
        price: 1000,
        currency: 'JPY',
        stock: 10,
        seller_user_id: 'seller123',
      };

      const mockAddress = {
        id: 'address123',
        user_id: 'user123',
        recipient_name: 'テスト太郎',
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 2000,
        currency: 'jpy',
      };

      const mockOrder = {
        id: 'order123',
        buyer_user_id: 'user123',
        product_id: 'product123',
        quantity: 2,
        amount: 2000,
        status: 'paid',
      };

      // stripeServiceのモック
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.createApplePaymentIntent).mockResolvedValue({
        data: mockPaymentIntent,
        error: null,
      });

      // supabaseのモック
      const { supabase } = await import('../../src/lib/supabase');
      
      // getProductByIdのモック（この関数は実際には別の場所で定義されているので、ここではモックする）
      vi.doMock('../../src/lib/ecService', async (importOriginal) => {
        const original = await importOriginal();
        return {
          ...original,
          getProductById: vi.fn().mockResolvedValue(mockProduct),
        };
      });

      // 配送先住所取得のモック
      vi.mocked(supabase.single).mockResolvedValueOnce({
        data: mockAddress,
        error: null,
      });

      // 注文作成のモック
      vi.mocked(supabase.single).mockResolvedValueOnce({
        data: mockOrder,
        error: null,
      });

      // 在庫更新のモック
      vi.mocked(supabase.eq).mockReturnValue({
        error: null,
      });

      const result = await createApplePayOrder('user123', {
        productId: 'product123',
        quantity: 2,
        shippingAddressId: 'address123',
        applePayResult: { mockPaymentData: 'test' },
      });

      expect(result).toEqual(mockOrder);
      expect(stripeService.createApplePaymentIntent).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'JPY',
        metadata: {
          userId: 'user123',
          type: 'product_purchase',
        },
      });
    });

    it('在庫不足の場合はエラーを投げる', async () => {
      const mockProduct = {
        id: 'product123',
        stock: 1,
        price: 1000,
      };

      // getProductByIdのモック
      vi.doMock('../../src/lib/ecService', async (importOriginal) => {
        const original = await importOriginal();
        return {
          ...original,
          getProductById: vi.fn().mockResolvedValue(mockProduct),
        };
      });

      await expect(
        createApplePayOrder('user123', {
          productId: 'product123',
          quantity: 5, // 在庫以上の数量
          shippingAddressId: 'address123',
          applePayResult: {},
        })
      ).rejects.toThrow('Apple Pay注文の作成に失敗しました');
    });
  });

  describe('createApplePayCartOrder', () => {
    it('カート内商品のApple Pay注文を作成できる', async () => {
      const mockProducts = [
        { id: 'product1', price: 1000, stock: 5, title: '商品1' },
        { id: 'product2', price: 2000, stock: 3, title: '商品2' },
      ];

      const mockAddress = {
        id: 'address123',
        user_id: 'user123',
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 4000, // 1000 * 1 + 2000 * 1.5(切り上げで2)
        currency: 'jpy',
      };

      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.createApplePaymentIntent).mockResolvedValue({
        data: mockPaymentIntent,
        error: null,
      });

      // supabaseのモック設定
      const { supabase } = await import('../../src/lib/supabase');
      vi.mocked(supabase.single).mockResolvedValue({
        data: mockAddress,
        error: null,
      });

      // getProductByIdのモック
      vi.doMock('../../src/lib/ecService', async (importOriginal) => {
        const original = await importOriginal();
        return {
          ...original,
          getProductById: vi.fn()
            .mockResolvedValueOnce(mockProducts[0])
            .mockResolvedValueOnce(mockProducts[1])
            .mockResolvedValueOnce(mockProducts[0])
            .mockResolvedValueOnce(mockProducts[1]),
        };
      });

      const result = await createApplePayCartOrder('user123', {
        items: [
          { productId: 'product1', quantity: 1 },
          { productId: 'product2', quantity: 1 },
        ],
        shippingAddressId: 'address123',
        applePayResult: {},
      });

      expect(Array.isArray(result)).toBe(true);
      expect(stripeService.createApplePaymentIntent).toHaveBeenCalledWith({
        amount: 3000, // 1000 + 2000
        currency: 'JPY',
        metadata: {
          userId: 'user123',
          type: 'product_purchase',
          itemCount: '2',
        },
      });
    });
  });

  describe('checkApplePayAvailability', () => {
    it('Apple Pay可用性チェックを正しく実行する', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);

      const result = await checkApplePayAvailability();

      expect(result).toBe(true);
      expect(stripeService.isApplePayAvailable).toHaveBeenCalled();
    });

    it('Apple Pay利用不可の場合はfalseを返す', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(false);

      const result = await checkApplePayAvailability();

      expect(result).toBe(false);
    });
  });
});