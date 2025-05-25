import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../src/lib/supabase';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  processPayment,
  getShippingAddresses,
  createShippingAddress,
  getSalesAnalytics,
  // Cart functions
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createCheckoutSession,
  // Gift functions
  sendGiftToPost,
  sendGiftToLiveRoom,
  // Product from post
  createProductFromPost,
  // Dashboard
  getSellerDashboard,
  // Types
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type Order,
  type CreateOrderInput,
  type ShippingAddress,
  type CreateShippingAddressInput,
  type Cart,
  type CartItem,
  type AddToCartInput,
  type UpdateCartItemInput,
  type Gift,
  type SendGiftInput,
  type CreateProductFromPostInput,
  type SellerDashboard,
  type DashboardPeriod,
} from '../../src/lib/ecService';

// Mock Supabase client
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
  uploadFile: vi.fn(),
}));

describe('EC Service', () => {
  const mockUserId = 'test-user-id';
  const mockSession = {
    session: {
      user: { id: mockUserId },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: mockSession, error: null });
  });

  describe('Product Management API', () => {
    describe('getProducts', () => {
      it('should fetch products with default parameters', async () => {
        const mockProducts = [
          {
            id: 'product-1',
            seller_user_id: 'seller-1',
            title: 'Test Product 1',
            description: 'Test description',
            price: 1000,
            currency: 'JPY',
            image_url: 'https://example.com/image1.jpg',
            stock: 10,
            created_at: '2024-01-01T00:00:00Z',
            profiles: {
              id: 'seller-1',
              display_name: 'Test Seller',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        const result = await getProducts();

        expect(supabase.from).toHaveBeenCalledWith('products');
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
        expect(result.products).toHaveLength(1);
        expect(result.products[0].seller).toEqual({
          id: 'seller-1',
          display_name: 'Test Seller',
          profile_image_url: 'https://example.com/avatar.jpg',
        });
      });

      it('should apply filters when provided', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await getProducts({
          seller_id: 'seller-1',
          search: '目醒め',
          min_price: 500,
          max_price: 2000,
        });

        expect(mockQuery.eq).toHaveBeenCalledWith('seller_user_id', 'seller-1');
        expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%目醒め%');
        expect(mockQuery.gte).toHaveBeenCalledWith('price', 500);
        expect(mockQuery.lte).toHaveBeenCalledWith('price', 2000);
      });

      it('should handle pagination', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await getProducts({ page: 3, limit: 10 });

        expect(mockQuery.range).toHaveBeenCalledWith(20, 29); // (3-1)*10 to (3-1)*10+10-1
      });

      it('should throw error when fetch fails', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await expect(getProducts()).rejects.toThrow('商品の取得に失敗しました');
      });
    });

    describe('getProductById', () => {
      it('should fetch a single product by ID', async () => {
        const mockProduct = {
          id: 'product-1',
          seller_user_id: 'seller-1',
          title: 'Test Product',
          description: 'Test description',
          price: 1000,
          currency: 'JPY',
          image_url: 'https://example.com/image.jpg',
          stock: 10,
          created_at: '2024-01-01T00:00:00Z',
          profiles: {
            id: 'seller-1',
            display_name: 'Test Seller',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        const result = await getProductById('product-1');

        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'product-1');
        expect(mockQuery.single).toHaveBeenCalled();
        expect(result.id).toBe('product-1');
        expect(result.seller).toEqual({
          id: 'seller-1',
          display_name: 'Test Seller',
          profile_image_url: 'https://example.com/avatar.jpg',
        });
      });

      it('should throw error when product not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await expect(getProductById('non-existent')).rejects.toThrow('商品の取得に失敗しました');
      });
    });

    describe('createProduct', () => {
      it('should create a new product with image upload', async () => {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const createInput: CreateProductInput = {
          title: 'New Product',
          description: 'New product description',
          price: 1500,
          stock: 5,
          image_file: mockFile,
        };

        const mockUploadResult = {
          url: 'https://example.com/uploaded.jpg',
          error: null,
        };

        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-product-id',
              ...createInput,
              image_url: mockUploadResult.url,
              seller_user_id: mockUserId,
              currency: 'JPY',
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockInsertQuery as any);
        const { uploadFile } = await import('../../src/lib/supabase');
        vi.mocked(uploadFile).mockResolvedValue(mockUploadResult as any);

        const result = await createProduct(createInput);

        expect(uploadFile).toHaveBeenCalledWith(mockFile, 'products');
        expect(mockInsertQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            seller_user_id: mockUserId,
            title: 'New Product',
            description: 'New product description',
            price: 1500,
            stock: 5,
            image_url: mockUploadResult.url,
            currency: 'JPY',
          })
        );
        expect(result.id).toBe('new-product-id');
      });

      it('should throw error when not logged in', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: null, error: null });

        await expect(
          createProduct({
            title: 'Test',
            description: 'Test',
            price: 1000,
            stock: 1,
            image_file: new File([''], 'test.jpg'),
          })
        ).rejects.toThrow('ログインが必要です');
      });

      it('should throw error when no image provided', async () => {
        await expect(
          createProduct({
            title: 'Test',
            description: 'Test',
            price: 1000,
            stock: 1,
          } as CreateProductInput)
        ).rejects.toThrow('商品画像は必須です');
      });
    });
  });

  describe('Cart API', () => {
    describe('getCart', () => {
      it('should fetch active cart with items', async () => {
        const mockCart = {
          id: 'cart-1',
          user_id: mockUserId,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          cart_items: [
            {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 2,
              added_at: '2024-01-01T00:00:00Z',
              product: {
                id: 'product-1',
                title: 'Test Product',
                price: 1000,
                stock: 10,
                image_url: 'https://example.com/image.jpg',
              },
            },
          ],
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCart, error: null }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        const result = await getCart();

        expect(supabase.from).toHaveBeenCalledWith('carts');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
        expect(result.items).toHaveLength(1);
        expect(result.total_amount).toBe(2000); // 1000 * 2
      });

      it('should return empty cart when no active cart exists', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        const result = await getCart();

        expect(result.items).toHaveLength(0);
        expect(result.total_amount).toBe(0);
      });
    });

    describe('addToCart', () => {
      it('should add item to existing cart', async () => {
        const input: AddToCartInput = {
          product_id: 'product-1',
          quantity: 2,
        };

        // Mock cart check
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'cart-1', user_id: mockUserId, status: 'active' },
            error: null,
          }),
        };

        // Mock product check
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10, price: 1000 },
            error: null,
          }),
        };

        // Mock cart item check
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };

        // Mock insert
        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 2,
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockProductQuery as any)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockInsertQuery as any);

        const result = await addToCart(input);

        expect(result.id).toBe('item-1');
        expect(result.quantity).toBe(2);
      });

      it('should create new cart if none exists', async () => {
        const input: AddToCartInput = {
          product_id: 'product-1',
          quantity: 1,
        };

        // Mock no existing cart
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };

        // Mock cart creation
        const mockCreateCartQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-cart-id', user_id: mockUserId, status: 'active' },
            error: null,
          }),
        };

        // Mock product check
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10, price: 1000 },
            error: null,
          }),
        };

        // Mock cart item check
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };

        // Mock cart item insert
        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'new-cart-id',
              product_id: 'product-1',
              quantity: 1,
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockCreateCartQuery as any)
          .mockReturnValueOnce(mockProductQuery as any)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockInsertQuery as any);

        const result = await addToCart(input);

        expect(mockCreateCartQuery.insert).toHaveBeenCalledWith({
          user_id: mockUserId,
          status: 'active',
          created_at: expect.any(String),
        });
        expect(result.cart_id).toBe('new-cart-id');
      });

      it('should update quantity if item already in cart', async () => {
        const input: AddToCartInput = {
          product_id: 'product-1',
          quantity: 3,
        };

        // Mock existing cart
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'cart-1', user_id: mockUserId, status: 'active' },
            error: null,
          }),
        };

        // Mock product check
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10, price: 1000 },
            error: null,
          }),
        };

        // Mock existing cart item
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'item-1', cart_id: 'cart-1', product_id: 'product-1', quantity: 2 },
            error: null,
          }),
        };

        // Mock update
        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 5, // 2 + 3
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockProductQuery as any)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockUpdateQuery as any);

        const result = await addToCart(input);

        expect(mockUpdateQuery.update).toHaveBeenCalledWith({ quantity: 5 });
        expect(result.quantity).toBe(5);
      });

      it('should throw error when stock is insufficient', async () => {
        const input: AddToCartInput = {
          product_id: 'product-1',
          quantity: 15,
        };

        // Mock existing cart
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'cart-1', user_id: mockUserId, status: 'active' },
            error: null,
          }),
        };

        // Mock product with low stock
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10, price: 1000 },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockProductQuery as any);

        await expect(addToCart(input)).rejects.toThrow('在庫が不足しています');
      });
    });

    describe('updateCartItem', () => {
      it('should update cart item quantity', async () => {
        const input: UpdateCartItemInput = {
          item_id: 'item-1',
          quantity: 5,
        };

        // Mock cart item check
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 2,
              cart: { user_id: mockUserId },
            },
            error: null,
          }),
        };

        // Mock product check
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10 },
            error: null,
          }),
        };

        // Mock update
        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 5,
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockProductQuery as any)
          .mockReturnValueOnce(mockUpdateQuery as any);

        const result = await updateCartItem(input);

        expect(mockUpdateQuery.update).toHaveBeenCalledWith({ quantity: 5 });
        expect(result.quantity).toBe(5);
      });

      it('should throw error when item not found', async () => {
        const input: UpdateCartItemInput = {
          item_id: 'non-existent',
          quantity: 1,
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await expect(updateCartItem(input)).rejects.toThrow('カートアイテムが見つかりません');
      });

      it('should throw error when stock is insufficient', async () => {
        const input: UpdateCartItemInput = {
          item_id: 'item-1',
          quantity: 20,
        };

        // Mock cart item
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              product_id: 'product-1',
              quantity: 2,
              cart: { user_id: mockUserId },
            },
            error: null,
          }),
        };

        // Mock product with insufficient stock
        const mockProductQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'product-1', stock: 10 },
            error: null,
          }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockProductQuery as any);

        await expect(updateCartItem(input)).rejects.toThrow('在庫が不足しています');
      });
    });

    describe('removeFromCart', () => {
      it('should remove item from cart', async () => {
        const itemId = 'item-1';

        // Mock cart item check
        const mockCartItemQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'item-1',
              cart_id: 'cart-1',
              cart: { user_id: mockUserId },
            },
            error: null,
          }),
        };

        // Mock delete
        const mockDeleteQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartItemQuery as any)
          .mockReturnValueOnce(mockDeleteQuery as any);

        const result = await removeFromCart(itemId);

        expect(mockDeleteQuery.delete).toHaveBeenCalled();
        expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', itemId);
        expect(result).toBe(true);
      });

      it('should throw error when item not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        await expect(removeFromCart('non-existent')).rejects.toThrow('カートアイテムが見つかりません');
      });
    });

    describe('clearCart', () => {
      it('should clear all items from cart', async () => {
        // Mock active cart
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'cart-1', user_id: mockUserId, status: 'active' },
            error: null,
          }),
        };

        // Mock delete all items
        const mockDeleteQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockDeleteQuery as any);

        const result = await clearCart();

        expect(mockDeleteQuery.delete).toHaveBeenCalled();
        expect(mockDeleteQuery.eq).toHaveBeenCalledWith('cart_id', 'cart-1');
        expect(result).toBe(true);
      });

      it('should return true when no active cart exists', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

        const result = await clearCart();

        expect(result).toBe(true);
      });
    });

    describe('createCheckoutSession', () => {
      it('should create checkout session with shipping info', async () => {
        const shippingAddressId = 'address-1';

        // Mock active cart with items
        const mockCart = {
          id: 'cart-1',
          user_id: mockUserId,
          status: 'active',
          cart_items: [
            {
              id: 'item-1',
              product_id: 'product-1',
              quantity: 2,
              product: {
                id: 'product-1',
                title: 'Test Product',
                price: 1000,
                seller_user_id: 'seller-1',
              },
            },
          ],
        };

        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCart, error: null }),
        };

        // Mock shipping address
        const mockAddressQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'address-1',
              user_id: mockUserId,
              recipient_name: 'Test User',
              postal_code: '100-0001',
              prefecture: '東京都',
              city: '千代田区',
              address_line: '1-1-1',
              phone_number: '090-1234-5678',
            },
            error: null,
          }),
        };

        // Mock order creation
        const mockOrderInsert = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'order-1' },
            error: null,
          }),
        };

        // Mock cart status update
        const mockCartUpdate = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        vi.mocked(supabase.from)
          .mockReturnValueOnce(mockCartQuery as any)
          .mockReturnValueOnce(mockAddressQuery as any)
          .mockReturnValueOnce(mockOrderInsert as any)
          .mockReturnValueOnce(mockCartUpdate as any);

        const result = await createCheckoutSession(shippingAddressId);

        expect(result.payment_url).toContain('stripe.com/checkout');
        expect(result.order_id).toBe('order-1');
        expect(mockCartUpdate.update).toHaveBeenCalledWith({ status: 'checked_out' });
      });

      it('should throw error when cart is empty', async () => {
        const mockCartQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'cart-1',
              user_id: mockUserId,
              status: 'active',
              cart_items: [],
            },
            error: null,
          }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockCartQuery as any);

        await expect(createCheckoutSession('address-1')).rejects.toThrow('カートが空です');
      });
    });
  });
});