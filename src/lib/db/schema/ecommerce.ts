import { pgTable, uuid, text, timestamp, decimal, integer, jsonb, unique, index, check } from 'drizzle-orm/pg-core';
import { productTypeEnum, cartStatusEnum, orderStatusEnum } from './enums';
import { profiles } from './profile';
import { posts } from './post';

// Product table
export const products = pgTable('product', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerUserId: uuid('seller_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  productType: productTypeEnum('product_type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('JPY'),
  imageUrl: text('image_url'),
  previewUrl: text('preview_url'),
  previewDuration: integer('preview_duration'),
  stock: integer('stock'),
  sourcePostId: uuid('source_post_id').references(() => posts.id, { onDelete: 'set null' }),
  aiDescription: jsonb('ai_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  sellerUserIdIdx: index('idx_product_seller_user_id').on(table.sellerUserId),
  productTypeIdx: index('idx_product_product_type').on(table.productType),
  priceIdx: index('idx_product_price').on(table.price),
  createdAtIdx: index('idx_product_created_at').on(table.createdAt.desc()),
  sourcePostIdIdx: index('idx_product_source_post_id').on(table.sourcePostId),
  priceCheck: check('price_check', 'price >= 0'),
  stockCheck: check('stock_check', 'stock >= 0')
}));

// Cart table
export const carts = pgTable('cart', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerUserId: uuid('buyer_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: cartStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  buyerUserIdIdx: index('idx_cart_buyer_user_id').on(table.buyerUserId),
  statusIdx: index('idx_cart_status').on(table.status),
  updatedAtIdx: index('idx_cart_updated_at').on(table.updatedAt.desc())
}));

// Cart item table
export const cartItems = pgTable('cart_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  cartIdIdx: index('idx_cart_item_cart_id').on(table.cartId),
  productIdIdx: index('idx_cart_item_product_id').on(table.productId),
  uniqueCartProduct: unique().on(table.cartId, table.productId),
  quantityCheck: check('quantity_check', 'quantity > 0')
}));

// Order table
export const orders = pgTable('order', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerUserId: uuid('buyer_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  storesPaymentId: text('stores_payment_id'),
  status: orderStatusEnum('status').notNull(),
  shippingInfo: jsonb('shipping_info'),
  trackingNumber: text('tracking_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  buyerUserIdIdx: index('idx_order_buyer_user_id').on(table.buyerUserId),
  statusIdx: index('idx_order_status').on(table.status),
  createdAtIdx: index('idx_order_created_at').on(table.createdAt.desc()),
  amountCheck: check('amount_check', 'amount >= 0')
}));

// Order item table
export const orderItems = pgTable('order_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull()
}, (table) => ({
  orderIdIdx: index('idx_order_item_order_id').on(table.orderId),
  productIdIdx: index('idx_order_item_product_id').on(table.productId),
  quantityCheck: check('quantity_check', 'quantity > 0'),
  priceCheck: check('price_check', 'price >= 0')
}));