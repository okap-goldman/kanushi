import { supabase, uploadFile } from './supabase';
import { v4 as uuidv4 } from 'uuid';

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
  image_file?: File;
  stock: number;
}

export interface UpdateProductInput {
  id: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  image_file?: File;
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
  transaction_id: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'refunded';
  payment_date: string;
}

// Product Services
export const getProducts = async (
  options: {
    limit?: number;
    page?: number;
    seller_id?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  } = {}
): Promise<{ products: Product[]; next_page: number | null }> => {
  try {
    const {
      limit = 20,
      page = 1,
      seller_id,
      search,
      min_price,
      max_price,
    } = options;

    const offset = (page - 1) * limit;

    // Start building the query
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
    const products = data.map(product => ({
      ...product,
      seller: product.profiles ? {
        id: product.profiles.id,
        display_name: product.profiles.display_name,
        profile_image_url: product.profiles.avatar_url,
      } : undefined,
      profiles: undefined, // Remove the nested profiles to clean up response
    }));

    // Check if there's a next page
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const next_page = offset + limit < (count || 0) ? page + 1 : null;

    return { products, next_page };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('商品の取得に失敗しました');
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
      seller: data.profiles ? {
        id: data.profiles.id,
        display_name: data.profiles.display_name,
        profile_image_url: data.profiles.avatar_url,
      } : undefined,
    };

    // Remove the nested profiles to clean up response
    delete (product as any).profiles;

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('商品の取得に失敗しました');
  }
};

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Upload image if provided
    let imageUrl = '';
    if (input.image_file) {
      const uploadResult = await uploadFile(input.image_file, 'products');
      if (uploadResult.error || !uploadResult.url) {
        throw new Error('画像のアップロードに失敗しました');
      }
      imageUrl = uploadResult.url;
    } else {
      throw new Error('商品画像は必須です');
    }

    // Create product in database
    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_user_id: userId,
        title: input.title,
        description: input.description,
        price: input.price,
        currency: input.currency || 'JPY',
        image_url: imageUrl,
        stock: input.stock,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('商品の作成に失敗しました');
  }
};

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Check if the product exists and belongs to the current user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', input.id)
      .eq('seller_user_id', userId)
      .single();

    if (fetchError || !existingProduct) {
      throw new Error('商品が見つからないか、編集権限がありません');
    }

    // Upload new image if provided
    let imageUrl = input.image_url || existingProduct.image_url;
    if (input.image_file) {
      const uploadResult = await uploadFile(input.image_file, 'products');
      if (uploadResult.error || !uploadResult.url) {
        throw new Error('画像のアップロードに失敗しました');
      }
      imageUrl = uploadResult.url;
    }

    // Update the product
    const updateData: Partial<Product> = {
      title: input.title !== undefined ? input.title : existingProduct.title,
      description: input.description !== undefined ? input.description : existingProduct.description,
      price: input.price !== undefined ? input.price : existingProduct.price,
      currency: input.currency || existingProduct.currency,
      image_url: imageUrl,
      stock: input.stock !== undefined ? input.stock : existingProduct.stock,
      updated_at: new Date().toISOString(),
    };

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

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Check if the product exists and belongs to the current user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('seller_user_id', userId)
      .single();

    if (fetchError || !existingProduct) {
      throw new Error('商品が見つからないか、削除権限がありません');
    }

    // Check if the product has any orders
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (countError) {
      throw countError;
    }

    if (count && count > 0) {
      throw new Error('この商品には注文が存在するため削除できません');
    }

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('商品の削除に失敗しました');
  }
};

// Order Services
export const getOrders = async (
  options: {
    limit?: number;
    page?: number;
    status?: OrderStatus | 'all';
    as_seller?: boolean;
  } = {}
): Promise<{ orders: Order[]; next_page: number | null }> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    const {
      limit = 20,
      page = 1,
      status = 'all',
      as_seller = false,
    } = options;

    const offset = (page - 1) * limit;

    // Start building the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        product:product_id (
          *,
          seller:seller_user_id (
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user role (buyer or seller)
    if (as_seller) {
      // As a seller, get orders for products sold by the user
      query = query.in('product_id', function(subquery) {
        return subquery
          .from('products')
          .select('id')
          .eq('seller_user_id', userId);
      });
    } else {
      // As a buyer, get orders made by the user
      query = query.eq('buyer_user_id', userId);
    }

    // Add status filter if specified
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format the response
    const orders = data.map(order => {
      const formattedOrder: Order = {
        ...order,
        product: order.product ? {
          ...order.product,
          seller: order.product.seller ? {
            id: order.product.seller.id,
            display_name: order.product.seller.display_name,
            profile_image_url: order.product.seller.avatar_url,
          } : undefined,
        } : undefined,
        buyer: order.buyer ? {
          id: order.buyer.id,
          display_name: order.buyer.display_name,
          profile_image_url: order.buyer.avatar_url,
        } : undefined,
      };

      // Remove nested properties to clean up response
      if (order.product) {
        delete (formattedOrder.product as any).seller_user_id;
        delete (formattedOrder.product as any).seller;
      }
      
      return formattedOrder;
    });

    // Check if there's a next page
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
      
    if (as_seller) {
      countQuery = countQuery.in('product_id', function(subquery) {
        return subquery
          .from('products')
          .select('id')
          .eq('seller_user_id', userId);
      });
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
          seller:seller_user_id (
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

    // Format the response
    const order: Order = {
      ...data,
      product: data.product ? {
        ...data.product,
        seller: data.product.seller ? {
          id: data.product.seller.id,
          display_name: data.product.seller.display_name,
          profile_image_url: data.product.seller.avatar_url,
        } : undefined,
      } : undefined,
      buyer: data.buyer ? {
        id: data.buyer.id,
        display_name: data.buyer.display_name,
        profile_image_url: data.buyer.avatar_url,
      } : undefined,
    };

    // Remove nested properties to clean up response
    if (data.product) {
      delete (order.product as any).seller_user_id;
      delete (order.product as any).seller;
    }

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('注文の取得に失敗しました');
  }
};

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get product details to check stock and calculate amount
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', input.product_id)
      .single();

    if (productError || !product) {
      throw new Error('商品が見つかりません');
    }

    // Check stock availability
    if (product.stock < input.quantity) {
      throw new Error('在庫が不足しています');
    }

    // Calculate total amount
    const amount = product.price * input.quantity;

    // Create order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        buyer_user_id: userId,
        product_id: input.product_id,
        quantity: input.quantity,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('注文の作成に失敗しました');
  }
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  options?: {
    tracking_number?: string;
    shipping_carrier?: string;
  }
): Promise<Order> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // First check if the user has permission to update this order
    // Only the seller can update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (
          seller_user_id
        )
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      throw new Error('注文が見つかりません');
    }

    // Check if current user is the seller
    if (order.product.seller_user_id !== userId) {
      throw new Error('この注文のステータスを更新する権限がありません');
    }

    // Update the order status
    const updateData: any = {
      status,
    };

    // Add tracking info if provided
    if (options) {
      if (options.tracking_number) updateData.tracking_number = options.tracking_number;
      if (options.shipping_carrier) updateData.shipping_carrier = options.shipping_carrier;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('注文ステータスの更新に失敗しました');
  }
};

// Shipping Address Services
export const getShippingAddresses = async (): Promise<ShippingAddress[]> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    throw new Error('配送先住所の取得に失敗しました');
  }
};

export const createShippingAddress = async (input: CreateShippingAddressInput): Promise<ShippingAddress> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // If setting as default, first clear other default addresses
    if (input.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    // Create shipping address
    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert({
        user_id: userId,
        recipient_name: input.recipient_name,
        postal_code: input.postal_code,
        prefecture: input.prefecture,
        city: input.city,
        address_line: input.address_line,
        phone_number: input.phone_number,
        is_default: input.is_default || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating shipping address:', error);
    throw new Error('配送先住所の作成に失敗しました');
  }
};

// Payment Processing (placeholder - would normally integrate with Stripe)
export const processPayment = async (
  orderId: string
): Promise<{ success: boolean; payment_url?: string }> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('buyer_user_id', userId)
      .single();

    if (orderError || !order) {
      throw new Error('注文が見つからないか、支払い権限がありません');
    }

    if (order.status !== 'pending') {
      throw new Error('この注文は既に処理されています');
    }

    // Simulate payment processing
    // In a real app, this would create a Stripe payment intent and return checkout URL
    const paymentId = `sim_pay_${uuidv4()}`;
    
    // Update order with payment ID
    const { error } = await supabase
      .from('orders')
      .update({
        stripe_payment_id: paymentId,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    // Create payment history record
    await supabase
      .from('payment_history')
      .insert({
        order_id: orderId,
        payment_method: 'stripe',
        transaction_id: paymentId,
        amount: order.amount,
        status: 'succeeded',
        payment_date: new Date().toISOString(),
      });

    return {
      success: true,
      payment_url: `https://example.com/checkout/confirm?payment_id=${paymentId}`,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('決済処理に失敗しました');
  }
};

// Sales Analytics
export const getSalesAnalytics = async (): Promise<{
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  products_sold: { id: string; title: string; quantity: number; revenue: number }[];
}> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get orders for products sold by the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (
          id,
          title
        )
      `)
      .in('product_id', function(subquery) {
        return subquery
          .from('products')
          .select('id')
          .eq('seller_user_id', userId);
      })
      .in('status', ['paid', 'shipped']);

    if (ordersError) {
      throw ordersError;
    }

    // Calculate analytics
    const total_orders = orders.length;
    const total_revenue = orders.reduce((sum, order) => sum + order.amount, 0);

    // Group by product
    const productMap = new Map<string, { id: string; title: string; quantity: number; revenue: number }>();
    
    orders.forEach(order => {
      const productId = order.product_id;
      const existingProduct = productMap.get(productId);
      
      if (existingProduct) {
        existingProduct.quantity += order.quantity;
        existingProduct.revenue += order.amount;
      } else {
        productMap.set(productId, {
          id: productId,
          title: order.product.title,
          quantity: order.quantity,
          revenue: order.amount,
        });
      }
    });

    return {
      total_sales: orders.reduce((sum, order) => sum + order.quantity, 0),
      total_orders,
      total_revenue,
      products_sold: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw new Error('売上分析の取得に失敗しました');
  }
};