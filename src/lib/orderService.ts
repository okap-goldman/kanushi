import { db } from './db/client';
import { orders, orderItems, products, carts, cartItems } from './db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

// Types
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddressId: string;
  clearCart?: boolean;
}

export interface UpdateStatusInput {
  trackingNumber?: string;
  shippingCarrier?: string;
}

export interface PaymentData {
  stripePaymentIntentId: string;
  paymentMethodId: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  asSeller?: boolean;
  limit?: number;
  offset?: number;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// Create a new order
export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<any> {
  // Validate products and check stock
  const productIds = input.items.map(item => item.productId);
  const productRecords = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  if (productRecords.length !== productIds.length) {
    throw new Error('商品が見つかりません');
  }

  // Create a map for quick lookup
  const productMap = new Map(productRecords.map(p => [p.id, p]));

  // Check stock availability
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`商品が見つかりません: ${item.productId}`);
    }
    if (product.stock && product.stock < item.quantity) {
      throw new Error(`在庫が不足しています: ${item.productId}`);
    }
  }

  // Calculate total amount
  const totalAmount = input.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + parseFloat(product.price) * item.quantity;
  }, 0);

  // Create order in transaction
  return await db.transaction(async (tx) => {
    // Create order
    const [order] = await tx
      .insert(orders)
      .values({
        buyerUserId: userId,
        amount: totalAmount.toString(),
        status: 'pending',
        shippingInfo: { addressId: input.shippingAddressId },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create order items
    const orderItemsData = input.items.map(item => {
      const product = productMap.get(item.productId)!;
      return {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const createdItems = await tx
      .insert(orderItems)
      .values(orderItemsData)
      .returning();

    // Update product stock
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock) {
        await tx
          .update(products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(products.id, item.productId))
          .returning();
      }
    }

    // Clear cart if requested
    if (input.clearCart) {
      const [activeCart] = await tx
        .select()
        .from(carts)
        .where(
          and(
            eq(carts.buyerUserId, userId),
            eq(carts.status, 'active')
          )
        );

      if (activeCart) {
        await tx
          .delete(cartItems)
          .where(eq(cartItems.cartId, activeCart.id));
      }
    }

    return {
      ...order,
      items: createdItems,
    };
  });
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  userId: string,
  trackingInfo?: UpdateStatusInput
): Promise<any> {
  // Get order with items and products to verify ownership
  const orderData = await db
    .select()
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orders.id, orderId));

  if (!orderData.length) {
    throw new Error('注文が見つかりません');
  }

  const order = orderData[0].orders;
  const orderProducts = orderData
    .filter(row => row.product)
    .map(row => row.product!);

  // Check if user is seller of any product in the order
  const isSeller = orderProducts.some(p => p.sellerUserId === userId);
  
  if (!isSeller) {
    throw new Error('この注文のステータスを更新する権限がありません');
  }

  // Validate status transition
  const currentStatus = order.status as OrderStatus;
  const validTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!validTransitions.includes(newStatus)) {
    throw new Error('無効なステータス遷移です');
  }

  // Update order status
  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (trackingInfo?.trackingNumber) {
    updateData.trackingNumber = trackingInfo.trackingNumber;
  }

  const [updatedOrder] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId))
    .returning();

  return updatedOrder;
}

// Get order by ID
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<any> {
  const orderData = await db
    .select()
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orders.id, orderId));

  if (!orderData.length) {
    throw new Error('注文が見つかりません');
  }

  const order = orderData[0].orders;
  const items = orderData
    .filter(row => row.order_item)
    .map(row => ({
      ...row.order_item!,
      product: row.product,
    }));

  // Check if user has access (buyer or seller)
  const isBuyer = order.buyerUserId === userId;
  const isSeller = items.some(item => item.product?.sellerUserId === userId);

  if (!isBuyer && !isSeller) {
    throw new Error('この注文を表示する権限がありません');
  }

  return {
    ...order,
    items,
  };
}

// Get orders list
export async function getOrders(
  userId: string,
  filters: OrderFilters = {}
): Promise<any[]> {
  const { 
    status, 
    asSeller = false, 
    limit = 20, 
    offset = 0 
  } = filters;

  let query = db
    .select()
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id));

  // Build where conditions
  const conditions: any[] = [];

  if (asSeller) {
    // For sellers, filter by products they own
    conditions.push(eq(products.sellerUserId, userId));
  } else {
    // For buyers, filter by their orders
    conditions.push(eq(orders.buyerUserId, userId));
  }

  if (status) {
    conditions.push(eq(orders.status, status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const orderData = await query
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Group by order ID
  const ordersMap = new Map<string, any>();
  
  for (const row of orderData) {
    const orderId = row.orders!.id;
    
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        ...row.orders,
        items: [],
      });
    }

    if (row.order_item) {
      ordersMap.get(orderId)!.items.push({
        ...row.order_item,
        product: row.product,
      });
    }
  }

  return Array.from(ordersMap.values());
}

// Cancel order
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<any> {
  // Get order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error('注文が見つかりません');
  }

  // Check if user is the buyer
  if (order.buyerUserId !== userId) {
    throw new Error('この注文をキャンセルする権限がありません');
  }

  // Check if order can be cancelled
  const nonCancellableStatuses: OrderStatus[] = ['shipped', 'delivered'];
  if (nonCancellableStatuses.includes(order.status as OrderStatus)) {
    throw new Error('発送済みの注文はキャンセルできません');
  }

  // Cancel order and restore stock
  return await db.transaction(async (tx) => {
    // Update order status
    const [cancelledOrder] = await tx
      .update(orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Get order items
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Restore product stock
    for (const item of items) {
      // First get current stock
      const [product] = await tx
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, item.productId));
      
      if (product && product.stock !== null) {
        await tx
          .update(products)
          .set({
            stock: product.stock + item.quantity,
          })
          .where(eq(products.id, item.productId));
      }
    }

    return cancelledOrder;
  });
}

// Process payment
export async function processPayment(
  orderId: string,
  userId: string,
  paymentData: PaymentData
): Promise<any> {
  // Get order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error('注文が見つかりません');
  }

  // Check if user is the buyer
  if (order.buyerUserId !== userId) {
    throw new Error('この注文の支払いを行う権限がありません');
  }

  // Check if order is pending
  if (order.status !== 'pending') {
    throw new Error('この注文は既に支払い済みです');
  }

  // Update order with payment info
  const [paidOrder] = await db
    .update(orders)
    .set({
      status: 'paid',
      storesPaymentId: paymentData.stripePaymentIntentId,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  // TODO: Create notification for seller

  return paidOrder;
}

// Get order statistics for seller
export async function getSellerOrderStats(userId: string): Promise<{
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
}> {
  // Get all products for this seller
  const sellerProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sellerUserId, userId));

  if (sellerProducts.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      processingOrders: 0,
    };
  }

  const productIds = sellerProducts.map(p => p.id);

  // Get order statistics
  const orderStats = await db
    .select()
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(
      and(
        inArray(orderItems.productId, productIds),
        inArray(orders.status, ['paid', 'processing', 'shipped', 'delivered'])
      )
    );

  let totalRevenue = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  const uniqueOrders = new Set<string>();

  for (const row of orderStats) {
    uniqueOrders.add(row.orders.id);
    
    if (row.orders.status === 'paid') {
      pendingOrders++;
    } else if (row.orders.status === 'processing') {
      processingOrders++;
    }

    // Calculate revenue for this seller's products only
    if (productIds.includes(row.order_item.productId)) {
      totalRevenue += parseFloat(row.order_item.price) * row.order_item.quantity;
    }
  }

  return {
    totalOrders: uniqueOrders.size,
    totalRevenue,
    pendingOrders,
    processingOrders,
  };
}

// Export all functions as a service object for easier testing
export const orderService = {
  createOrder,
  updateOrderStatus,
  getOrderById,
  getOrders,
  cancelOrder,
  processPayment,
  getSellerOrderStats,
};