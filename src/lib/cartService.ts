import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  quantity: number;
  stock: number;
  sellerId: string;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

const CART_STORAGE_KEY = 'kanushi_cart';

class CartService {
  private cart: Cart = {
    items: [],
    totalAmount: 0,
    totalItems: 0,
  };

  async loadCart(): Promise<Cart> {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        this.cart = JSON.parse(cartData);
      }
      this.updateTotals();
      return this.cart;
    } catch (error) {
      console.error('Failed to load cart:', error);
      return this.cart;
    }
  }

  async saveCart(): Promise<void> {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }

  async addToCart(item: Omit<CartItem, 'id'>): Promise<Cart> {
    const existingItem = this.cart.items.find(
      (cartItem) => cartItem.productId === item.productId
    );

    if (existingItem) {
      // 在庫チェック
      if (existingItem.quantity + item.quantity > existingItem.stock) {
        throw new Error('在庫数を超えています');
      }
      existingItem.quantity += item.quantity;
    } else {
      // 在庫チェック
      if (item.quantity > item.stock) {
        throw new Error('在庫数を超えています');
      }
      this.cart.items.push({
        id: uuidv4(),
        ...item,
      });
    }

    this.updateTotals();
    await this.saveCart();
    return this.cart;
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const item = this.cart.items.find((item) => item.id === itemId);
    if (!item) {
      throw new Error('カートアイテムが見つかりません');
    }

    if (quantity <= 0) {
      return this.removeFromCart(itemId);
    }

    if (quantity > item.stock) {
      throw new Error('在庫数を超えています');
    }

    item.quantity = quantity;
    this.updateTotals();
    await this.saveCart();
    return this.cart;
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    this.cart.items = this.cart.items.filter((item) => item.id !== itemId);
    this.updateTotals();
    await this.saveCart();
    return this.cart;
  }

  async clearCart(): Promise<Cart> {
    this.cart.items = [];
    this.updateTotals();
    await this.saveCart();
    return this.cart;
  }

  getCart(): Cart {
    return this.cart;
  }

  private updateTotals(): void {
    this.cart.totalItems = this.cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    this.cart.totalAmount = this.cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // グループ化されたカート（出品者別）
  getGroupedCart(): { [sellerId: string]: { sellerName?: string; items: CartItem[] } } {
    const grouped: { [sellerId: string]: { sellerName?: string; items: CartItem[] } } = {};
    
    this.cart.items.forEach((item) => {
      if (!grouped[item.sellerId]) {
        grouped[item.sellerId] = {
          items: [],
        };
      }
      grouped[item.sellerId].items.push(item);
    });

    return grouped;
  }
}

export const cartService = new CartService();