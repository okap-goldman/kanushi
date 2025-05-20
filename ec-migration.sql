-- EC Domain Migration
-- Creates tables for products, orders, shipping addresses, and payment history

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_user_id UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_id VARCHAR(100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  tracking_number VARCHAR(100),
  shipping_carrier VARCHAR(100)
);

-- Shipping Address Table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  recipient_name VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  prefecture VARCHAR(20) NOT NULL,
  city VARCHAR(50) NOT NULL,
  address_line VARCHAR(200) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Add constraint to ensure only one default address per user
ALTER TABLE shipping_addresses
  ADD CONSTRAINT unique_default_address_per_user
  UNIQUE (user_id, is_default) 
  DEFERRABLE INITIALLY DEFERRED;

-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe',
  transaction_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint to ensure only one payment history per order
ALTER TABLE payment_history
  ADD CONSTRAINT unique_order_payment
  UNIQUE (order_id);

-- Create indexes for performance optimization
CREATE INDEX idx_products_seller_user_id ON products(seller_user_id);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_price ON products(price);

CREATE INDEX idx_orders_buyer_user_id ON orders(buyer_user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_is_default ON shipping_addresses(user_id, is_default);

CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_payment_date ON payment_history(payment_date);

-- Create Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Product policies
-- Everyone can view products
CREATE POLICY product_select_policy ON products
  FOR SELECT USING (true);

-- Only the seller can insert, update, delete their products
CREATE POLICY product_insert_policy ON products
  FOR INSERT WITH CHECK (seller_user_id = auth.uid());
  
CREATE POLICY product_update_policy ON products
  FOR UPDATE USING (seller_user_id = auth.uid());
  
CREATE POLICY product_delete_policy ON products
  FOR DELETE USING (seller_user_id = auth.uid());

-- Order policies
-- Buyer can see their own orders
CREATE POLICY order_select_buyer_policy ON orders
  FOR SELECT USING (buyer_user_id = auth.uid());

-- Seller can see orders for their products
CREATE POLICY order_select_seller_policy ON orders
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM products WHERE seller_user_id = auth.uid()
    )
  );

-- Only authenticated users can create orders for themselves
CREATE POLICY order_insert_policy ON orders
  FOR INSERT WITH CHECK (buyer_user_id = auth.uid());

-- Seller can update order status (for shipping, etc.)
CREATE POLICY order_update_seller_policy ON orders
  FOR UPDATE USING (
    product_id IN (
      SELECT id FROM products WHERE seller_user_id = auth.uid()
    )
  );

-- Shipping address policies
-- Users can only see, modify their own shipping addresses
CREATE POLICY shipping_address_select_policy ON shipping_addresses
  FOR SELECT USING (user_id = auth.uid());
  
CREATE POLICY shipping_address_insert_policy ON shipping_addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
CREATE POLICY shipping_address_update_policy ON shipping_addresses
  FOR UPDATE USING (user_id = auth.uid());
  
CREATE POLICY shipping_address_delete_policy ON shipping_addresses
  FOR DELETE USING (user_id = auth.uid());

-- Payment history policies
-- Buyer can see payment history for their orders
CREATE POLICY payment_select_buyer_policy ON payment_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE buyer_user_id = auth.uid()
    )
  );

-- Seller can see payment history for their product orders
CREATE POLICY payment_select_seller_policy ON payment_history
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE p.seller_user_id = auth.uid()
    )
  );

-- Triggers for product stock management

-- Function to reduce stock when order is placed
CREATE OR REPLACE FUNCTION reduce_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce the stock of the product
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reduce stock when order is created
CREATE TRIGGER order_reduce_stock
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION reduce_product_stock();

-- Function to restore stock when order is refunded
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only restore stock if the status was changed to refunded
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    -- Restore the stock of the product
    UPDATE products
    SET stock = stock + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to restore stock when order is refunded
CREATE TRIGGER order_restore_stock
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'refunded' AND OLD.status != 'refunded')
EXECUTE FUNCTION restore_product_stock();

-- Function to update order timestamps based on status changes
CREATE OR REPLACE FUNCTION update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the appropriate timestamp based on the new status
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.paid_at = now();
  ELSIF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = now();
  ELSIF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    NEW.refunded_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps when order status changes
CREATE TRIGGER order_status_timestamps
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION update_order_timestamps();