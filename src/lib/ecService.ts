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
  transaction_id: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'refunded';
  payment_date: string;
}

// Cart types
export interface Cart {
  id: string;
  user_id: string;
  status: 'active' | 'checked_out' | 'abandoned';
  created_at: string;
  updated_at?: string;
  items: CartItem[];
  total_amount: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  product?: Product;
}

export interface AddToCartInput {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  item_id: string;
  quantity: number;
}

// Gift types
export interface Gift {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  target_type: 'post' | 'live_room';
  target_id: string;
  amount: number;
  message?: string;
  platform_fee_rate: number;
  created_at: string;
}

export interface SendGiftInput {
  target_id: string;
  amount: 300 | 600 | 1200;
  message?: string;
}

// Product from post
export interface CreateProductFromPostInput {
  post_id: string;
  price: number;
  generate_ai_description?: boolean;
}

// Dashboard types
export type DashboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface SellerDashboard {
  period: DashboardPeriod;
  total_revenue: number;
  total_orders: number;
  total_products_sold: number;
  average_order_value: number;
  revenue_chart: { date: string; revenue: number }[];
  top_products: { id: string; title: string; quantity: number; revenue: number }[];
  gift_revenue: number;
  recent_orders: Order[];
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
    const { limit = 20, page = 1, seller_id, search, min_price, max_price } = options;

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

    // Check if there's a next page
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });

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
      description:
        input.description !== undefined ? input.description : existingProduct.description,
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
    const { error } = await supabase.from('products').delete().eq('id', id);

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

    const { limit = 20, page = 1, status = 'all', as_seller = false } = options;

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
    let productIds: any[] | null = null;

    if (as_seller) {
      // As a seller, get orders for products sold by the user
      // First get the product IDs for this seller
      const { data } = await supabase.from('products').select('id').eq('seller_user_id', userId);

      productIds = data;

      if (productIds && productIds.length > 0) {
        query = query.in(
          'product_id',
          productIds.map((p: any) => p.id)
        );
      } else {
        // No products, return empty result
        return { orders: [], next_page: null };
      }
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
    const orders = data.map((order) => {
      const formattedOrder: Order = {
        ...order,
        product: order.product
          ? {
              ...order.product,
              seller: order.product.seller
                ? {
                    id: order.product.seller.id,
                    display_name: order.product.seller.display_name,
                    profile_image_url: order.product.seller.avatar_url,
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

      // Remove nested properties to clean up response
      if (order.product) {
        delete (formattedOrder.product as any).seller_user_id;
        delete (formattedOrder.product as any).seller;
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
      product: data.product
        ? {
            ...data.product,
            seller: data.product.seller
              ? {
                  id: data.product.seller.id,
                  display_name: data.product.seller.display_name,
                  profile_image_url: data.product.seller.avatar_url,
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

export const createShippingAddress = async (
  input: CreateShippingAddressInput
): Promise<ShippingAddress> => {
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
    await supabase.from('payment_history').insert({
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

    // First get the product IDs for this seller
    const { data: productIds } = await supabase
      .from('products')
      .select('id')
      .eq('seller_user_id', userId);

    if (!productIds || productIds.length === 0) {
      // No products, return empty analytics
      return {
        total_revenue: 0,
        total_orders: 0,
        total_sales: 0,
        products_sold: [],
      };
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
      .in(
        'product_id',
        productIds.map((p) => p.id)
      )
      .in('status', ['paid', 'shipped']);

    if (ordersError) {
      throw ordersError;
    }

    // Calculate analytics
    const total_orders = orders.length;
    const total_revenue = orders.reduce((sum, order) => sum + order.amount, 0);

    // Group by product
    const productMap = new Map<
      string,
      { id: string; title: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
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

// Cart Services
export const getCart = async (): Promise<Cart> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get active cart with items
    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          *,
          product:product_id (
            id,
            title,
            price,
            stock,
            image_url,
            seller_user_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active cart found
        return {
          id: '',
          user_id: userId,
          status: 'active',
          created_at: '',
          items: [],
          total_amount: 0,
        };
      }
      throw error;
    }

    // Calculate total amount
    const items = data.cart_items || [];
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    return {
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: items.map((item: any) => ({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        added_at: item.added_at,
        product: item.product,
      })),
      total_amount: totalAmount,
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw new Error('カートの取得に失敗しました');
  }
};

export const addToCart = async (input: AddToCartInput): Promise<CartItem> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get or create active cart
    let cartId: string;
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!existingCart) {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      cartId = newCart.id;
    } else {
      cartId = existingCart.id;
    }

    // Check product availability
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, price')
      .eq('id', input.product_id)
      .single();

    if (productError || !product) {
      throw new Error('商品が見つかりません');
    }

    if (product.stock < input.quantity) {
      throw new Error('在庫が不足しています');
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', input.product_id)
      .single();

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + input.quantity;

      if (product.stock < newQuantity) {
        throw new Error('在庫が不足しています');
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return updatedItem;
    } else {
      // Add new item to cart
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: input.product_id,
          quantity: input.quantity,
          added_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return newItem;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error instanceof Error && error.message.includes('在庫')
      ? error
      : new Error('カートへの追加に失敗しました');
  }
};

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItem> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get cart item with cart info
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        *,
        cart:cart_id (
          user_id
        )
      `)
      .eq('id', input.item_id)
      .single();

    if (itemError || !cartItem) {
      throw new Error('カートアイテムが見つかりません');
    }

    // Verify ownership
    if (cartItem.cart.user_id !== userId) {
      throw new Error('このカートアイテムを更新する権限がありません');
    }

    // Check product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', cartItem.product_id)
      .single();

    if (productError || !product) {
      throw new Error('商品が見つかりません');
    }

    if (product.stock < input.quantity) {
      throw new Error('在庫が不足しています');
    }

    // Update quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: input.quantity })
      .eq('id', input.item_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedItem;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error instanceof Error && error.message.includes('在庫')
      ? error
      : new Error('カートアイテムの更新に失敗しました');
  }
};

export const removeFromCart = async (itemId: string): Promise<boolean> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get cart item with cart info
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        *,
        cart:cart_id (
          user_id
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !cartItem) {
      throw new Error('カートアイテムが見つかりません');
    }

    // Verify ownership
    if (cartItem.cart.user_id !== userId) {
      throw new Error('このカートアイテムを削除する権限がありません');
    }

    // Delete item
    const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);

    if (deleteError) {
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw new Error('カートアイテムの削除に失敗しました');
  }
};

export const clearCart = async (): Promise<boolean> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get active cart
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!cart) {
      // No active cart
      return true;
    }

    // Delete all items from cart
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw new Error('カートのクリアに失敗しました');
  }
};

export const createCheckoutSession = async (
  shippingAddressId: string
): Promise<{ payment_url: string; order_id: string }> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get active cart with items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          *,
          product:product_id (
            id,
            title,
            price,
            seller_user_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      throw new Error('アクティブなカートが見つかりません');
    }

    if (!cart.cart_items || cart.cart_items.length === 0) {
      throw new Error('カートが空です');
    }

    // Verify shipping address
    const { data: shippingAddress, error: addressError } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('id', shippingAddressId)
      .eq('user_id', userId)
      .single();

    if (addressError || !shippingAddress) {
      throw new Error('配送先住所が見つかりません');
    }

    // Calculate total amount
    const totalAmount = cart.cart_items.reduce((sum: number, item: any) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_user_id: userId,
        product_id: cart.cart_items[0].product_id, // Simplified for single product
        quantity: cart.cart_items[0].quantity,
        amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Update cart status
    await supabase.from('carts').update({ status: 'checked_out' }).eq('id', cart.id);

    // Generate Stripe checkout URL (simulated)
    const checkoutUrl = `https://checkout.stripe.com/c/pay/cs_test_${order.id}#${btoa(
      JSON.stringify({
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      })
    )}`;

    return {
      payment_url: checkoutUrl,
      order_id: order.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('チェックアウトセッションの作成に失敗しました');
  }
};

// Gift Services
export const sendGiftToPost = async (postId: string, input: SendGiftInput): Promise<Gift> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get post and recipient info
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('投稿が見つかりません');
    }

    // Create gift record
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        sender_user_id: userId,
        recipient_user_id: post.user_id,
        target_type: 'post',
        target_id: postId,
        amount: input.amount,
        message: input.message,
        platform_fee_rate: 0.08, // 8% platform fee
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (giftError) {
      throw giftError;
    }

    // TODO: Process payment through Stripe

    return gift;
  } catch (error) {
    console.error('Error sending gift to post:', error);
    throw new Error('ギフトの送信に失敗しました');
  }
};

export const sendGiftToLiveRoom = async (
  liveRoomId: string,
  input: SendGiftInput
): Promise<Gift> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get live room and host info
    const { data: liveRoom, error: roomError } = await supabase
      .from('live_rooms')
      .select('id, host_user_id')
      .eq('id', liveRoomId)
      .single();

    if (roomError || !liveRoom) {
      throw new Error('ライブルームが見つかりません');
    }

    // Create gift record
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        sender_user_id: userId,
        recipient_user_id: liveRoom.host_user_id,
        target_type: 'live_room',
        target_id: liveRoomId,
        amount: input.amount,
        message: input.message,
        platform_fee_rate: 0.08, // 8% platform fee
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (giftError) {
      throw giftError;
    }

    // TODO: Process payment through Stripe

    return gift;
  } catch (error) {
    console.error('Error sending gift to live room:', error);
    throw new Error('ギフトの送信に失敗しました');
  }
};

// Product from Post
export const createProductFromPost = async (
  input: CreateProductFromPostInput
): Promise<Product> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Get post details
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', input.post_id)
      .eq('user_id', userId)
      .single();

    if (postError || !post) {
      throw new Error('投稿が見つからないか、出品権限がありません');
    }

    // Generate AI description if requested
    let description = post.content || '';
    if (input.generate_ai_description) {
      // TODO: Integrate with Gemini API to generate description
      description = `【AI生成説明文】\n${post.content}\n\n推奨視聴者: スピリチュアルに興味がある方、自己成長を求める方`;
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_user_id: userId,
        title: post.content ? post.content.substring(0, 50) + '...' : '音声コンテンツ',
        description: description,
        price: input.price,
        currency: 'JPY',
        image_url: post.thumbnail_url || 'https://example.com/default-audio.jpg',
        stock: 9999, // Digital product
        source_post_id: input.post_id,
        product_type: 'digital',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (productError) {
      throw productError;
    }

    return product;
  } catch (error) {
    console.error('Error creating product from post:', error);
    throw new Error('音声投稿からの商品作成に失敗しました');
  }
};

// Dashboard
export const getSellerDashboard = async (
  period: DashboardPeriod = 'monthly'
): Promise<SellerDashboard> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error('ログインが必要です');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 28));
        break;
      case 'monthly':
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
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
