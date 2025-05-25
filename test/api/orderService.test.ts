import { and, eq, inArray } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { db } from '../../src/lib/db/client';
import { cartItems, carts, orderItems, orders, products } from '../../src/lib/db/schema';
import * as orderService from '../../src/lib/orderService';

// Mock database client
vi.mock('../../src/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
    execute: vi.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order with single product', async () => {
      const userId = 'user123';
      const input = {
        items: [{ productId: 'prod123', quantity: 2 }],
        shippingAddressId: 'addr123',
      };

      const mockProduct = {
        id: 'prod123',
        price: '1000',
        stock: 10,
        sellerUserId: 'seller123',
      };

      const mockOrder = {
        id: 'order123',
        buyerUserId: userId,
        amount: '2000',
        status: 'pending',
        shippingInfo: { addressId: 'addr123' },
        createdAt: new Date(),
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: 'order123',
        productId: 'prod123',
        quantity: 2,
        price: '1000',
      };

      // Mock product fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      });

      // Mock transaction
      (db.transaction as Mock).mockImplementation(async (callback) => {
        const tx = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi
            .fn()
            .mockResolvedValueOnce([mockOrder])
            .mockResolvedValueOnce([mockOrderItem]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        };

        // Set up chain for update
        tx.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValueOnce([{ ...mockProduct, stock: 8 }]),
            }),
          }),
        });

        return callback(tx);
      });

      const result = await orderService.createOrder(userId, input);

      expect(result).toEqual({
        ...mockOrder,
        items: [mockOrderItem],
      });
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should create an order with multiple products', async () => {
      const userId = 'user123';
      const input = {
        items: [
          { productId: 'prod123', quantity: 2 },
          { productId: 'prod456', quantity: 1 },
        ],
        shippingAddressId: 'addr123',
      };

      const mockProducts = [
        {
          id: 'prod123',
          price: '1000',
          stock: 10,
          sellerUserId: 'seller123',
        },
        {
          id: 'prod456',
          price: '2000',
          stock: 5,
          sellerUserId: 'seller456',
        },
      ];

      const mockOrder = {
        id: 'order123',
        buyerUserId: userId,
        amount: '4000', // 1000*2 + 2000*1
        status: 'pending',
        shippingInfo: { addressId: 'addr123' },
        createdAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: 'item123',
          orderId: 'order123',
          productId: 'prod123',
          quantity: 2,
          price: '1000',
        },
        {
          id: 'item456',
          orderId: 'order123',
          productId: 'prod456',
          quantity: 1,
          price: '2000',
        },
      ];

      // Mock product fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockProducts),
      });

      // Mock transaction
      (db.transaction as Mock).mockImplementation(async (callback) => {
        const tx = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi
            .fn()
            .mockResolvedValueOnce([mockOrder])
            .mockResolvedValueOnce(mockOrderItems),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        };

        // Set up chain for update
        let updateCount = 0;
        tx.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => {
                if (updateCount === 0) {
                  updateCount++;
                  return Promise.resolve([{ ...mockProducts[0], stock: 8 }]);
                } else {
                  return Promise.resolve([{ ...mockProducts[1], stock: 4 }]);
                }
              }),
            }),
          }),
        });

        return callback(tx);
      });

      const result = await orderService.createOrder(userId, input);

      expect(result).toEqual({
        ...mockOrder,
        items: mockOrderItems,
      });
    });

    it('should throw error if product not found', async () => {
      const userId = 'user123';
      const input = {
        items: [{ productId: 'nonexistent', quantity: 1 }],
        shippingAddressId: 'addr123',
      };

      // Mock empty product fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(orderService.createOrder(userId, input)).rejects.toThrow('商品が見つかりません');
    });

    it('should throw error if insufficient stock', async () => {
      const userId = 'user123';
      const input = {
        items: [{ productId: 'prod123', quantity: 20 }],
        shippingAddressId: 'addr123',
      };

      const mockProduct = {
        id: 'prod123',
        price: '1000',
        stock: 10,
        sellerUserId: 'seller123',
      };

      // Mock product fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      });

      await expect(orderService.createOrder(userId, input)).rejects.toThrow(
        '在庫が不足しています: prod123'
      );
    });

    it('should clear cart after successful order creation', async () => {
      const userId = 'user123';
      const input = {
        items: [{ productId: 'prod123', quantity: 1 }],
        shippingAddressId: 'addr123',
        clearCart: true,
      };

      const mockProduct = {
        id: 'prod123',
        price: '1000',
        stock: 10,
        sellerUserId: 'seller123',
      };

      const mockOrder = {
        id: 'order123',
        buyerUserId: userId,
        amount: '1000',
        status: 'pending',
        shippingInfo: { addressId: 'addr123' },
        createdAt: new Date(),
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: 'order123',
        productId: 'prod123',
        quantity: 1,
        price: '1000',
      };

      const mockCart = {
        id: 'cart123',
        buyerUserId: userId,
        status: 'active',
      };

      // Mock product fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      });

      // Mock transaction
      (db.transaction as Mock).mockImplementation(async (callback) => {
        const tx = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi
            .fn()
            .mockResolvedValueOnce([mockOrder])
            .mockResolvedValueOnce([mockOrderItem]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
        };

        // Set up chain for update
        tx.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValueOnce([{ ...mockProduct, stock: 9 }]),
            }),
          }),
        });

        // Mock cart fetch
        tx.select.mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValueOnce([mockCart]),
        });

        // Mock cart items deletion
        tx.delete.mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValueOnce([]),
        });

        return callback(tx);
      });

      const result = await orderService.createOrder(userId, input);

      expect(result).toEqual({
        ...mockOrder,
        items: [mockOrderItem],
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status to processing', async () => {
      const orderId = 'order123';
      const userId = 'seller123';
      const newStatus = 'processing';

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'paid',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: userId,
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      // Mock update
      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValueOnce([{ ...mockOrder, status: newStatus, updatedAt: new Date() }]),
      });

      const result = await orderService.updateOrderStatus(orderId, newStatus, userId);

      expect(result.status).toBe(newStatus);
      expect(db.update).toHaveBeenCalledWith(orders);
    });

    it('should update order status to shipped with tracking info', async () => {
      const orderId = 'order123';
      const userId = 'seller123';
      const newStatus = 'shipped';
      const trackingInfo = {
        trackingNumber: 'TRACK123456',
        shippingCarrier: 'Yamato',
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'processing',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: userId,
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      // Mock update
      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockOrder,
            status: newStatus,
            trackingNumber: trackingInfo.trackingNumber,
            updatedAt: new Date(),
          },
        ]),
      });

      const result = await orderService.updateOrderStatus(orderId, newStatus, userId, trackingInfo);

      expect(result.status).toBe(newStatus);
      expect(result.trackingNumber).toBe(trackingInfo.trackingNumber);
    });

    it('should throw error if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'seller123';
      const newStatus = 'processing';

      // Mock empty order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(orderService.updateOrderStatus(orderId, newStatus, userId)).rejects.toThrow(
        '注文が見つかりません'
      );
    });

    it('should throw error if user is not the seller', async () => {
      const orderId = 'order123';
      const userId = 'wronguser';
      const newStatus = 'processing';

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'paid',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: 'seller123', // Different from userId
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      await expect(orderService.updateOrderStatus(orderId, newStatus, userId)).rejects.toThrow(
        'この注文のステータスを更新する権限がありません'
      );
    });

    it('should validate status transition rules', async () => {
      const orderId = 'order123';
      const userId = 'seller123';

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'pending',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: userId,
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      // Try invalid transition from pending to shipped
      await expect(orderService.updateOrderStatus(orderId, 'shipped', userId)).rejects.toThrow(
        '無効なステータス遷移です'
      );
    });
  });

  describe('getOrderById', () => {
    it('should get order details for buyer', async () => {
      const orderId = 'order123';
      const userId = 'buyer123';

      const mockOrderData = {
        orders: {
          id: orderId,
          buyerUserId: userId,
          amount: '2000',
          status: 'paid',
          createdAt: new Date(),
        },
        order_item: {
          id: 'item123',
          orderId: orderId,
          productId: 'prod123',
          quantity: 2,
          price: '1000',
        },
        product: {
          id: 'prod123',
          title: 'Test Product',
          sellerUserId: 'seller123',
        },
      };

      // Mock order fetch with joins
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrderData]),
      });

      const result = await orderService.getOrderById(orderId, userId);

      expect(result).toEqual({
        ...mockOrderData.orders,
        items: [
          {
            ...mockOrderData.order_item,
            product: mockOrderData.product,
          },
        ],
      });
    });

    it('should get order details for seller', async () => {
      const orderId = 'order123';
      const userId = 'seller123';

      const mockOrderData = {
        orders: {
          id: orderId,
          buyerUserId: 'buyer123',
          amount: '2000',
          status: 'paid',
          createdAt: new Date(),
        },
        order_item: {
          id: 'item123',
          orderId: orderId,
          productId: 'prod123',
          quantity: 2,
          price: '1000',
        },
        product: {
          id: 'prod123',
          title: 'Test Product',
          sellerUserId: userId,
        },
      };

      // Mock order fetch with joins
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrderData]),
      });

      const result = await orderService.getOrderById(orderId, userId);

      expect(result).toEqual({
        ...mockOrderData.orders,
        items: [
          {
            ...mockOrderData.order_item,
            product: mockOrderData.product,
          },
        ],
      });
    });

    it('should throw error if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'user123';

      // Mock empty order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(orderService.getOrderById(orderId, userId)).rejects.toThrow(
        '注文が見つかりません'
      );
    });

    it('should throw error if user has no access', async () => {
      const orderId = 'order123';
      const userId = 'wronguser';

      const mockOrderData = {
        orders: {
          id: orderId,
          buyerUserId: 'buyer123',
          amount: '2000',
          status: 'paid',
          createdAt: new Date(),
        },
        order_item: {
          id: 'item123',
          orderId: orderId,
          productId: 'prod123',
          quantity: 2,
          price: '1000',
        },
        product: {
          id: 'prod123',
          title: 'Test Product',
          sellerUserId: 'seller123',
        },
      };

      // Mock order fetch with joins
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrderData]),
      });

      await expect(orderService.getOrderById(orderId, userId)).rejects.toThrow(
        'この注文を表示する権限がありません'
      );
    });
  });

  describe('getOrders', () => {
    it('should get orders for buyer', async () => {
      const userId = 'buyer123';
      const filters = { status: 'paid' as const, limit: 10, offset: 0 };

      const mockOrdersData = [
        {
          orders: {
            id: 'order123',
            buyerUserId: userId,
            amount: '2000',
            status: 'paid',
            createdAt: new Date(),
          },
          order_item: {
            id: 'item123',
            orderId: 'order123',
            productId: 'prod123',
            quantity: 2,
            price: '1000',
          },
          product: {
            id: 'prod123',
            title: 'Test Product',
            sellerUserId: 'seller123',
          },
        },
      ];

      // Mock orders fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValueOnce(mockOrdersData),
      });

      const result = await orderService.getOrders(userId, filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockOrdersData[0].orders,
        items: [
          {
            ...mockOrdersData[0].order_item,
            product: mockOrdersData[0].product,
          },
        ],
      });
    });

    it('should get orders for seller', async () => {
      const userId = 'seller123';
      const filters = { asSeller: true, limit: 10, offset: 0 };

      const mockOrdersData = [
        {
          orders: {
            id: 'order123',
            buyerUserId: 'buyer123',
            amount: '2000',
            status: 'paid',
            createdAt: new Date(),
          },
          order_item: {
            id: 'item123',
            orderId: 'order123',
            productId: 'prod123',
            quantity: 2,
            price: '1000',
          },
          product: {
            id: 'prod123',
            title: 'Test Product',
            sellerUserId: userId,
          },
        },
      ];

      // Mock orders fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValueOnce(mockOrdersData),
      });

      const result = await orderService.getOrders(userId, filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockOrdersData[0].orders,
        items: [
          {
            ...mockOrdersData[0].order_item,
            product: mockOrdersData[0].product,
          },
        ],
      });
    });

    it('should handle multiple items per order', async () => {
      const userId = 'buyer123';
      const filters = { limit: 10, offset: 0 };

      const mockOrdersData = [
        {
          orders: {
            id: 'order123',
            buyerUserId: userId,
            amount: '3000',
            status: 'paid',
            createdAt: new Date(),
          },
          order_item: {
            id: 'item123',
            orderId: 'order123',
            productId: 'prod123',
            quantity: 2,
            price: '1000',
          },
          product: {
            id: 'prod123',
            title: 'Product 1',
            sellerUserId: 'seller123',
          },
        },
        {
          orders: {
            id: 'order123',
            buyerUserId: userId,
            amount: '3000',
            status: 'paid',
            createdAt: new Date(),
          },
          order_item: {
            id: 'item456',
            orderId: 'order123',
            productId: 'prod456',
            quantity: 1,
            price: '1000',
          },
          product: {
            id: 'prod456',
            title: 'Product 2',
            sellerUserId: 'seller456',
          },
        },
      ];

      // Mock orders fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValueOnce(mockOrdersData),
      });

      const result = await orderService.getOrders(userId, filters);

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(2);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order as buyer', async () => {
      const orderId = 'order123';
      const userId = 'buyer123';

      const mockOrder = {
        id: orderId,
        buyerUserId: userId,
        status: 'pending',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
        quantity: 2,
      };

      const mockProduct = {
        id: 'prod123',
        stock: 8,
      };

      // Mock order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrder]),
      });

      // Mock transaction
      (db.transaction as Mock).mockImplementation(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValueOnce([{ ...mockOrder, status: 'cancelled' }]),
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
        };

        // Set up chain for first update (order status)
        let updateCallCount = 0;
        tx.update.mockImplementation(() => {
          updateCallCount++;
          if (updateCallCount === 1) {
            return {
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  returning: vi.fn().mockResolvedValueOnce([{ ...mockOrder, status: 'cancelled' }]),
                }),
              }),
            };
          } else {
            return {
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValueOnce([]),
              }),
            };
          }
        });

        // Mock order items fetch
        let selectCallCount = 0;
        tx.select.mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            // First call for order items
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockResolvedValueOnce([mockOrderItem]),
            };
          } else {
            // Second call for product stock
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockResolvedValueOnce([{ stock: 8 }]),
            };
          }
        });

        return callback(tx);
      });

      const result = await orderService.cancelOrder(orderId, userId);

      expect(result.status).toBe('cancelled');
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should throw error if order is already shipped', async () => {
      const orderId = 'order123';
      const userId = 'buyer123';

      const mockOrder = {
        id: orderId,
        buyerUserId: userId,
        status: 'shipped',
        amount: '1000',
      };

      // Mock order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrder]),
      });

      await expect(orderService.cancelOrder(orderId, userId)).rejects.toThrow(
        '発送済みの注文はキャンセルできません'
      );
    });
  });

  describe('processPayment', () => {
    it('should process payment and update order status', async () => {
      const orderId = 'order123';
      const userId = 'buyer123';
      const paymentData = {
        stripePaymentIntentId: 'pi_test123',
        paymentMethodId: 'pm_test123',
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: userId,
        status: 'pending',
        amount: '1000',
      };

      // Mock order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrder]),
      });

      // Mock update
      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockOrder,
            status: 'paid',
            storesPaymentId: paymentData.stripePaymentIntentId,
            updatedAt: new Date(),
          },
        ]),
      });

      const result = await orderService.processPayment(orderId, userId, paymentData);

      expect(result.status).toBe('paid');
      expect(result.storesPaymentId).toBe(paymentData.stripePaymentIntentId);
    });

    it('should throw error if order is not pending', async () => {
      const orderId = 'order123';
      const userId = 'buyer123';
      const paymentData = {
        stripePaymentIntentId: 'pi_test123',
        paymentMethodId: 'pm_test123',
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: userId,
        status: 'paid',
        amount: '1000',
      };

      // Mock order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockOrder]),
      });

      await expect(orderService.processPayment(orderId, userId, paymentData)).rejects.toThrow(
        'この注文は既に支払い済みです'
      );
    });
  });

  describe('updateShippingInfo', () => {
    it('should update shipping information and status to shipped', async () => {
      const orderId = 'order123';
      const userId = 'seller123';
      const shippingData = {
        carrier: 'ヤマト運輸',
        trackingNumber: 'TRACK123456789',
        shippedAt: new Date(),
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'processing',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: userId,
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      // Mock update
      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockOrder,
            status: 'shipped',
            trackingNumber: shippingData.trackingNumber,
            shippingCarrier: shippingData.carrier,
            shippedAt: shippingData.shippedAt,
            updatedAt: new Date(),
          },
        ]),
      });

      const result = await orderService.updateShippingInfo(orderId, userId, shippingData);

      expect(result.status).toBe('shipped');
      expect(result.trackingNumber).toBe(shippingData.trackingNumber);
      expect(result.shippingCarrier).toBe(shippingData.carrier);
    });

    it('should throw error if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'seller123';
      const shippingData = {
        carrier: 'ヤマト運輸',
        trackingNumber: 'TRACK123456789',
      };

      // Mock empty order fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(orderService.updateShippingInfo(orderId, userId, shippingData)).rejects.toThrow(
        '注文が見つかりません'
      );
    });

    it('should throw error if user is not the seller', async () => {
      const orderId = 'order123';
      const userId = 'wronguser';
      const shippingData = {
        carrier: 'ヤマト運輸',
        trackingNumber: 'TRACK123456789',
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'processing',
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: 'seller123', // Different from userId
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      await expect(orderService.updateShippingInfo(orderId, userId, shippingData)).rejects.toThrow(
        'この注文の配送情報を更新する権限がありません'
      );
    });

    it('should throw error if order status is not valid for shipping', async () => {
      const orderId = 'order123';
      const userId = 'seller123';
      const shippingData = {
        carrier: 'ヤマト運輸',
        trackingNumber: 'TRACK123456789',
      };

      const mockOrder = {
        id: orderId,
        buyerUserId: 'buyer123',
        status: 'pending', // Not valid for shipping
        amount: '1000',
      };

      const mockOrderItem = {
        id: 'item123',
        orderId: orderId,
        productId: 'prod123',
      };

      const mockProduct = {
        id: 'prod123',
        sellerUserId: userId,
      };

      // Mock order with items and product
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            orders: mockOrder,
            order_item: mockOrderItem,
            product: mockProduct,
          },
        ]),
      });

      await expect(orderService.updateShippingInfo(orderId, userId, shippingData)).rejects.toThrow(
        'この注文はまだ発送準備ができていません'
      );
    });
  });

  describe('getSellerDashboard', () => {
    it('should return comprehensive dashboard data for seller', async () => {
      const userId = 'seller123';
      const period = 'month';

      const mockProducts = [{ id: 'prod123' }, { id: 'prod456' }];

      const mockOrderStats = [
        {
          orders: {
            id: 'order1',
            amount: '2000',
            status: 'delivered',
            createdAt: new Date('2023-01-15'),
          },
          order_item: {
            productId: 'prod123',
            quantity: 2,
            price: '1000',
          },
        },
        {
          orders: {
            id: 'order2',
            amount: '3000',
            status: 'shipped',
            createdAt: new Date('2023-01-20'),
          },
          order_item: {
            productId: 'prod456',
            quantity: 1,
            price: '3000',
          },
        },
      ];

      // Mock products fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockProducts),
      });

      // Mock order statistics fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockOrderStats),
      });

      const result = await orderService.getSellerDashboard(userId, period);

      expect(result).toEqual({
        totalRevenue: 5000,
        totalOrders: 2,
        averageOrderValue: 2500,
        revenueChart: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            revenue: expect.any(Number),
          }),
        ]),
        topProducts: expect.arrayContaining([
          expect.objectContaining({
            productId: expect.any(String),
            revenue: expect.any(Number),
            orders: expect.any(Number),
          }),
        ]),
      });
    });

    it('should return empty dashboard for seller with no products', async () => {
      const userId = 'seller123';
      const period = 'month';

      // Mock empty products fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      const result = await orderService.getSellerDashboard(userId, period);

      expect(result).toEqual({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        revenueChart: [],
        topProducts: [],
      });
    });

    it('should handle different time periods (week, month, year)', async () => {
      const userId = 'seller123';
      const period = 'week';

      const mockProducts = [{ id: 'prod123' }];

      // Mock products fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockProducts),
      });

      // Mock order statistics fetch
      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      });

      const result = await orderService.getSellerDashboard(userId, period);

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('averageOrderValue');
      expect(result).toHaveProperty('revenueChart');
      expect(result).toHaveProperty('topProducts');
    });
  });
});
