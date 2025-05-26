import { v4 as uuidv4 } from 'uuid';
import { supabase, uploadFile } from './supabase';

// Types for EC domain
export interface Product {
  id: string;
  seller_user_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  stock: number;
  created_at: string;
  updated_at?: string;
  seller?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  currency?: string;
  image_file?: any; // Changed from File to any for React Native compatibility
  stock: number;
}

export interface UpdateProductInput {
  id: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  image_file?: any; // Changed from File to any for React Native compatibility
  image_url?: string;
  stock?: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'refunded';

export interface Order {
  id: string;
  buyer_user_id: string;
  product_id: string;
  quantity: number;
  amount: number;
  stripe_payment_id?: string;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
  shipped_at?: string;
  refunded_at?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  product?: Product;
  buyer?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface CreateOrderInput {
  product_id: string;
  quantity: number;
  shipping_address_id: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  phone_number: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateShippingAddressInput {
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  phone_number: string;
  is_default?: boolean;
}

export interface PaymentHistory {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  transaction_id: string;
  created_at: string;
  refunded_at?: string;
}

export interface SellerDashboard {
  period: string;
  total_revenue: number;
  total_orders: number;
  total_products_sold: number;
  average_order_value: number;
  revenue_chart: { date: string; revenue: number }[];
  top_products: {
    id: string;
    title: string;
    quantity: number;
    revenue: number;
  }[];
  gift_revenue: number;
  recent_orders: Order[];
}

export interface ProductFilter {
  seller_id?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Product Management Functions
export const createProduct = async (
  userId: string,
  input: CreateProductInput
): Promise<Product> => {
  try {
    // Upload image if provided
    let imageUrl = '';
    if (input.image_file) {
      const { url } = await uploadFile(input.image_file, 'products');
      imageUrl = url;
    }

    const productData = {
      seller_user_id: userId,
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency || 'JPY',
      image_url: imageUrl,
      stock: input.stock,
    };

    const { data, error } = await supabase.from('products').insert(productData).select().single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('商品の登録に失敗しました');
  }
};

export const getProducts = async (
  filters: ProductFilter = {}
): Promise<ApiResponse<Product[]>> => {
  try {
    const {
      seller_id,
      search,
      min_price,
      max_price,
      page = 1,
      limit = 20,
    } = filters;

    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:seller_user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters if specified
    if (seller_id) {
      query = query.eq('seller_user_id', seller_id);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (min_price !== undefined) {
      query = query.gte('price', min_price);
    }

    if (max_price !== undefined) {
      query = query.lte('price', max_price);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format the response
    const products = data.map((product) => ({
      ...product,
      seller: product.profiles
        ? {
            id: product.profiles.id,
            display_name: product.profiles.display_name,
            profile_image_url: product.profiles.avatar_url,
          }
        : undefined,
      profiles: undefined, // Remove the nested profiles to clean up response
    }));

    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: '商品の取得に失敗しました' };
  }
};

export const getProductById = async (id: string): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles:seller_user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('商品が見つかりません');
    }

    // Format the response
    const product: Product = {
      ...data,
      seller: data.profiles
        ? {
            id: data.profiles.id,
            display_name: data.profiles.display_name,
            profile_image_url: data.profiles.avatar_url,
          }
        : undefined,
    };

    // Remove the nested profiles to clean up response
    delete (product as any).profiles;

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('商品の取得に失敗しました');
  }
};

export const updateProduct = async (
  userId: string,
  input: UpdateProductInput
): Promise<Product> => {
  try {
    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('seller_user_id, image_url')
      .eq('id', input.id)
      .single();

    if (!existingProduct || existingProduct.seller_user_id !== userId) {
      throw new Error('この商品を更新する権限がありません');
    }

    // Upload new image if provided
    let imageUrl = input.image_url || existingProduct.image_url;
    if (input.image_file) {
      const { url } = await uploadFile(input.image_file, 'products');
      imageUrl = url;
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (input.stock !== undefined) updateData.stock = input.stock;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('商品の更新に失敗しました');
  }
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
  try {
    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('seller_user_id')
      .eq('id', productId)
      .single();

    if (!existingProduct || existingProduct.seller_user_id !== userId) {
      throw new Error('この商品を削除する権限がありません');
    }

    // Check if there are pending orders
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', productId)
      .in('status', ['pending', 'paid']);

    if (pendingOrders && pendingOrders.length > 0) {
      throw new Error('処理中の注文があるため、商品を削除できません');
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('商品の削除に失敗しました');
  }
};

// Order Management Functions
export const createOrder = async (
  userId: string,
  input: CreateOrderInput
): Promise<Order> => {
  try {
    // Get product details
    const product = await getProductById(input.product_id);

    if (product.stock < input.quantity) {
      throw new Error('在庫が不足しています');
    }

    // Verify shipping address belongs to user
    const { data: address } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('id', input.shipping_address_id)
      .eq('user_id', userId)
      .single();

    if (!address) {
      throw new Error('配送先住所が見つかりません');
    }

    // Create order
    const orderData = {
      buyer_user_id: userId,
      product_id: input.product_id,
      quantity: input.quantity,
      amount: product.price * input.quantity,
      status: 'pending' as OrderStatus,
    };

    const { data, error } = await supabase.from('orders').insert(orderData).select().single();

    if (error) {
      throw error;
    }

    // Update product stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock - input.quantity })
      .eq('id', input.product_id);

    if (stockError) {
      // Rollback order creation if stock update fails
      await supabase.from('orders').delete().eq('id', data.id);
      throw stockError;
    }

    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('注文の作成に失敗しました');
  }
};

export const getOrders = async (
  userId: string,
  filters: {
    as_seller?: boolean;
    status?: OrderStatus | 'all';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ orders: Order[]; next_page: number | null }> => {
  try {
    const { as_seller = false, status = 'all', page = 1, limit = 20 } = filters;

    const offset = (page - 1) * limit;

    let query;

    if (as_seller) {
      // Get seller's products first
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_user_id', userId);

      if (!products || products.length === 0) {
        return { orders: [], next_page: null };
      }

      const productIds = products.map((p) => p.id);

      query = supabase
        .from('orders')
        .select(`
          *,
          product:product_id (
            *,
            profiles:seller_user_id (
              id,
              display_name,
              avatar_url
            )
          ),
          buyer:buyer_user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .in('product_id', productIds);
    } else {
      query = supabase
        .from('orders')
        .select(`
          *,
          product:product_id (
            *,
            profiles:seller_user_id (
              id,
              display_name,
              avatar_url
            )
          ),
          buyer:buyer_user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('buyer_user_id', userId);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format the response
    const orders = data.map((order) => {
      const formattedOrder: Order = {
        ...order,
        product: order.product
          ? {
              ...order.product,
              seller: order.product.profiles
                ? {
                    id: order.product.profiles.id,
                    display_name: order.product.profiles.display_name,
                    profile_image_url: order.product.profiles.avatar_url,
                  }
                : undefined,
            }
          : undefined,
        buyer: order.buyer
          ? {
              id: order.buyer.id,
              display_name: order.buyer.display_name,
              profile_image_url: order.buyer.avatar_url,
            }
          : undefined,
      };

      // Clean up nested data
      if (formattedOrder.product) {
        delete (formattedOrder.product as any).profiles;
      }

      return formattedOrder;
    });

    // Check if there's a next page
    let countQuery = supabase.from('orders').select('*', { count: 'exact', head: true });

    if (as_seller) {
      if (productIds && productIds.length > 0) {
        countQuery = countQuery.in(
          'product_id',
          productIds.map((p) => p.id)
        );
      }
    } else {
      countQuery = countQuery.eq('buyer_user_id', userId);
    }

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    const next_page = offset + limit < (count || 0) ? page + 1 : null;

    return { orders, next_page };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('注文の取得に失敗しました');
  }
};

export const getOrderById = async (id: string): Promise<Order> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (
          *,
          profiles:seller_user_id (
            id,
            display_name,
            avatar_url
          )
        ),
        buyer:buyer_user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('注文が見つかりません');
    }

    // Verify access permission
    const isOwnerOrSeller =
      data.buyer_user_id === userId ||
      (data.product && data.product.seller_user_id === userId);

    if (!isOwnerOrSeller) {
      throw new Error('この注文を表示する権限がありません');
    }

    // Format the response
    const order: Order = {
      ...data,
      product: data.product
        ? {
            ...data.product,
            seller: data.product.profiles
              ? {
                  id: data.product.profiles.id,
                  display_name: data.product.profiles.display_name,
                  profile_image_url: data.product.profiles.avatar_url,
                }
              : undefined,
          }
        : undefined,
      buyer: data.buyer
        ? {
            id: data.buyer.id,
            display_name: data.buyer.display_name,
            profile_image_url: data.buyer.avatar_url,
          }
        : undefined,
    };

    // Clean up nested data
    if (order.product) {
      delete (order.product as any).profiles;
    }

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('注文の取得に失敗しました');
  }
};

export const updateOrderStatus = async (
  userId: string,
  orderId: string,
  status: OrderStatus,
  trackingInfo?: {
    tracking_number: string;
    shipping_carrier: string;
  }
): Promise<Order> => {
  try {
    // Get order details
    const order = await getOrderById(orderId);

    // Verify seller
    if (!order.product || order.product.seller_user_id !== userId) {
      throw new Error('この注文を更新する権限がありません');
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['paid', 'refunded'],
      paid: ['shipped', 'refunded'],
      shipped: ['refunded'],
      refunded: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new Error('無効なステータス変更です');
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
      if (trackingInfo) {
        updateData.tracking_number = trackingInfo.tracking_number;
        updateData.shipping_carrier = trackingInfo.shipping_carrier;
      }
    } else if (status === 'refunded') {
      updateData.refunded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If refunded, restore product stock
    if (status === 'refunded' && order.product) {
      await supabase
        .from('products')
        .update({ stock: order.product.stock + order.quantity })
        .eq('id', order.product_id);
    }

    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('注文ステータスの更新に失敗しました');
  }
};

export const cancelOrder = async (userId: string, orderId: string): Promise<void> => {
  try {
    // Get order details
    const order = await getOrderById(orderId);

    // Verify buyer
    if (order.buyer_user_id !== userId) {
      throw new Error('この注文をキャンセルする権限がありません');
    }

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      throw new Error('キャンセルできるのは支払い前の注文のみです');
    }

    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      throw error;
    }

    // Restore product stock
    if (order.product) {
      await supabase
        .from('products')
        .update({ stock: order.product.stock + order.quantity })
        .eq('id', order.product_id);
    }
  } catch (error) {
    console.error('Error canceling order:', error);
    throw new Error('注文のキャンセルに失敗しました');
  }
};

// Shipping Address Management
export const createShippingAddress = async (
  userId: string,
  input: CreateShippingAddressInput
): Promise<ShippingAddress> => {
  try {
    // If this should be default, unset other defaults
    if (input.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const addressData = {
      user_id: userId,
      ...input,
    };

    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating shipping address:', error);
    throw new Error('配送先住所の登録に失敗しました');
  }
};

export const getShippingAddresses = async (userId: string): Promise<ShippingAddress[]> => {
  try {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    throw new Error('配送先住所の取得に失敗しました');
  }
};

export const updateShippingAddress = async (
  userId: string,
  addressId: string,
  input: Partial<CreateShippingAddressInput>
): Promise<ShippingAddress> => {
  try {
    // Verify ownership
    const { data: existingAddress } = await supabase
      .from('shipping_addresses')
      .select('user_id')
      .eq('id', addressId)
      .single();

    if (!existingAddress || existingAddress.user_id !== userId) {
      throw new Error('この住所を更新する権限がありません');
    }

    // If this should be default, unset other defaults
    if (input.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', addressId);
    }

    const updateData = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('shipping_addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating shipping address:', error);
    throw new Error('配送先住所の更新に失敗しました');
  }
};

export const deleteShippingAddress = async (
  userId: string,
  addressId: string
): Promise<void> => {
  try {
    // Verify ownership
    const { data: existingAddress } = await supabase
      .from('shipping_addresses')
      .select('user_id')
      .eq('id', addressId)
      .single();

    if (!existingAddress || existingAddress.user_id !== userId) {
      throw new Error('この住所を削除する権限がありません');
    }

    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting shipping address:', error);
    throw new Error('配送先住所の削除に失敗しました');
  }
};

// Payment History
export const getPaymentHistory = async (
  userId: string,
  filters: {
    as_seller?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ payments: PaymentHistory[]; next_page: number | null }> => {
  try {
    const { as_seller = false, page = 1, limit = 20 } = filters;

    const offset = (page - 1) * limit;

    let query;

    if (as_seller) {
      // Get seller's order IDs
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('seller_user_id', userId);

      if (!orders || orders.length === 0) {
        return { payments: [], next_page: null };
      }

      const orderIds = orders.map((o) => o.id);

      query = supabase
        .from('payment_history')
        .select('*')
        .in('order_id', orderIds);
    } else {
      // Get buyer's order IDs
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_user_id', userId);

      if (!orders || orders.length === 0) {
        return { payments: [], next_page: null };
      }

      const orderIds = orders.map((o) => o.id);

      query = supabase
        .from('payment_history')
        .select('*')
        .in('order_id', orderIds);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const payments = data || [];

    // Check if there's a next page
    const { count } = await supabase
      .from('payment_history')
      .select('*', { count: 'exact', head: true });

    const next_page = offset + limit < (count || 0) ? page + 1 : null;

    return { payments, next_page };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new Error('支払い履歴の取得に失敗しました');
  }
};

// Seller Dashboard
export const getSellerDashboard = async (
  userId: string,
  period: string = '30days'
): Promise<SellerDashboard> => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get seller's products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_user_id', userId);

    if (!products || products.length === 0) {
      return {
        period,
        total_revenue: 0,
        total_orders: 0,
        total_products_sold: 0,
        average_order_value: 0,
        revenue_chart: [],
        top_products: [],
        gift_revenue: 0,
        recent_orders: [],
      };
    }

    const productIds = products.map((p) => p.id);

    // Get orders for the period
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (
          id,
          title
        )
      `)
      .in('product_id', productIds)
      .in('status', ['paid', 'shipped'])
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Get gifts for the period
    const { data: gifts } = await supabase
      .from('gifts')
      .select('*')
      .eq('recipient_user_id', userId)
      .gte('created_at', startDate.toISOString());

    // Calculate metrics
    const totalRevenue = (orders || []).reduce((sum, order) => sum + order.amount, 0);
    const giftRevenue = (gifts || []).reduce(
      (sum, gift) => sum + gift.amount * (1 - gift.platform_fee_rate),
      0
    );
    const totalOrders = (orders || []).length;
    const totalProductsSold = (orders || []).reduce((sum, order) => sum + order.quantity, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by product for top products
    const productMap = new Map<
      string,
      { id: string; title: string; quantity: number; revenue: number }
    >();
    (orders || []).forEach((order) => {
      const existing = productMap.get(order.product_id);
      if (existing) {
        existing.quantity += order.quantity;
        existing.revenue += order.amount;
      } else {
        productMap.set(order.product_id, {
          id: order.product_id,
          title: order.product.title,
          quantity: order.quantity,
          revenue: order.amount,
        });
      }
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Generate revenue chart data
    const revenueChart: { date: string; revenue: number }[] = [];
    // Simplified - just show total for now
    // In production, would group by date

    return {
      period,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      total_products_sold: totalProductsSold,
      average_order_value: averageOrderValue,
      revenue_chart: revenueChart,
      top_products: topProducts,
      gift_revenue: giftRevenue,
      recent_orders: (orders || []).slice(0, 10),
    };
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    throw new Error('ダッシュボードデータの取得に失敗しました');
  }
};

// Export as ecService object
export const ecService = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  createShippingAddress,
  getShippingAddresses,
  updateShippingAddress,
  deleteShippingAddress,
  getPaymentHistory,
  getSellerDashboard,
};