-- Create product table
CREATE TABLE IF NOT EXISTS product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical', 'service')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'JPY',
    image_url TEXT,
    preview_url TEXT,
    preview_duration INTEGER,
    stock INTEGER CHECK (stock >= 0),
    source_post_id UUID REFERENCES post(id) ON DELETE SET NULL,
    ai_description JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cart_item table
CREATE TABLE IF NOT EXISTS cart_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Create order table (using quoted name as ORDER is reserved)
CREATE TABLE IF NOT EXISTS "order" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    stores_payment_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    shipping_info JSONB,
    tracking_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_item table
CREATE TABLE IF NOT EXISTS order_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);

-- Create indexes
CREATE INDEX idx_product_seller_user_id ON product(seller_user_id);
CREATE INDEX idx_product_product_type ON product(product_type);
CREATE INDEX idx_product_price ON product(price);
CREATE INDEX idx_product_created_at ON product(created_at DESC);
CREATE INDEX idx_product_source_post_id ON product(source_post_id);

CREATE INDEX idx_cart_buyer_user_id ON cart(buyer_user_id);
CREATE INDEX idx_cart_status ON cart(status);
CREATE INDEX idx_cart_updated_at ON cart(updated_at DESC);

CREATE INDEX idx_cart_item_cart_id ON cart_item(cart_id);
CREATE INDEX idx_cart_item_product_id ON cart_item(product_id);

CREATE INDEX idx_order_buyer_user_id ON "order"(buyer_user_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_created_at ON "order"(created_at DESC);

CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_product_id ON order_item(product_id);

-- Create update triggers
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "order"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product
CREATE POLICY "Products are viewable by everyone" ON product
    FOR SELECT USING (true);

CREATE POLICY "Users can create own products" ON product
    FOR INSERT WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Sellers can update own products" ON product
    FOR UPDATE USING (auth.uid() = seller_user_id);

CREATE POLICY "Sellers can delete own products" ON product
    FOR DELETE USING (auth.uid() = seller_user_id);

-- RLS Policies for cart
CREATE POLICY "Users can view own cart" ON cart
    FOR SELECT USING (auth.uid() = buyer_user_id);

CREATE POLICY "Users can create own cart" ON cart
    FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Users can update own cart" ON cart
    FOR UPDATE USING (auth.uid() = buyer_user_id);

-- RLS Policies for cart_item
CREATE POLICY "Users can view items in own cart" ON cart_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cart 
            WHERE cart.id = cart_item.cart_id 
            AND cart.buyer_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add items to own cart" ON cart_item
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cart 
            WHERE cart.id = cart_item.cart_id 
            AND cart.buyer_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in own cart" ON cart_item
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cart 
            WHERE cart.id = cart_item.cart_id 
            AND cart.buyer_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove items from own cart" ON cart_item
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cart 
            WHERE cart.id = cart_item.cart_id 
            AND cart.buyer_user_id = auth.uid()
        )
    );

-- RLS Policies for order
CREATE POLICY "Users can view own orders" ON "order"
    FOR SELECT USING (auth.uid() = buyer_user_id);

CREATE POLICY "Sellers can view orders containing their products" ON "order"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_item
            JOIN product ON order_item.product_id = product.id
            WHERE order_item.order_id = "order".id
            AND product.seller_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own orders" ON "order"
    FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Users can update own orders" ON "order"
    FOR UPDATE USING (auth.uid() = buyer_user_id);

-- RLS Policies for order_item
CREATE POLICY "Users can view items in own orders" ON order_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "order" 
            WHERE "order".id = order_item.order_id 
            AND "order".buyer_user_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can view order items of their products" ON order_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product 
            WHERE product.id = order_item.product_id 
            AND product.seller_user_id = auth.uid()
        )
    );