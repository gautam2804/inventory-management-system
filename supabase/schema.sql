-- ==============================================================================
-- COMPUTER HARDWARE INVENTORY MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. ADMIN PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'System Administrator',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
CREATE POLICY "Allow all access to profiles"
ON public.profiles FOR ALL
USING (true) WITH CHECK (true);

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'At Tech Digital Admin'),
        COALESCE(new.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    brand TEXT NOT NULL,
    model TEXT,
    description TEXT,
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock_level INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. STOCK MOVEMENTS TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity_changed INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    updated_quantity INTEGER NOT NULL CHECK (updated_quantity >= 0),
    reason TEXT NOT NULL,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INDEXES FOR PERFORMANCE & SCANNER SPEED
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- 6. ATOMIC STOCK TRANSACTION FUNCTION (RPC)
CREATE OR REPLACE FUNCTION process_stock_movement(
    p_product_id UUID,
    p_movement_type TEXT,
    p_quantity INTEGER,
    p_reason TEXT,
    p_notes TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_qty INTEGER;
    v_new_qty INTEGER;
    v_qty_delta INTEGER;
    v_movement_id UUID;
    v_product_record RECORD;
BEGIN
    -- Lock product row for atomic update
    SELECT * INTO v_product_record
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;

    v_current_qty := v_product_record.quantity;

    IF p_movement_type = 'in' THEN
        IF p_quantity <= 0 THEN
            RAISE EXCEPTION 'Stock addition quantity must be positive';
        END IF;
        v_qty_delta := p_quantity;
        v_new_qty := v_current_qty + p_quantity;

    ELSIF p_movement_type = 'out' THEN
        IF p_quantity <= 0 THEN
            RAISE EXCEPTION 'Stock removal quantity must be positive';
        END IF;
        IF v_current_qty < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Requested to remove: %', v_current_qty, p_quantity;
        END IF;
        v_qty_delta := -p_quantity;
        v_new_qty := v_current_qty - p_quantity;

    ELSIF p_movement_type = 'adjustment' THEN
        IF p_quantity < 0 THEN
            RAISE EXCEPTION 'Adjusted stock quantity cannot be negative';
        END IF;
        v_qty_delta := p_quantity - v_current_qty;
        v_new_qty := p_quantity;

    ELSE
        RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
    END IF;

    -- Update product stock
    UPDATE public.products
    SET quantity = v_new_qty,
        updated_at = now()
    WHERE id = p_product_id;

    -- Record movement audit history
    INSERT INTO public.stock_movements (
        product_id,
        movement_type,
        quantity_changed,
        previous_quantity,
        updated_quantity,
        reason,
        notes,
        created_by
    )
    VALUES (
        p_product_id,
        p_movement_type,
        v_qty_delta,
        v_current_qty,
        v_new_qty,
        p_reason,
        p_notes,
        p_created_by
    )
    RETURNING id INTO v_movement_id;

    RETURN jsonb_build_object(
        'success', true,
        'movement_id', v_movement_id,
        'previous_quantity', v_current_qty,
        'updated_quantity', v_new_qty,
        'delta', v_qty_delta
    );
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon (admin client) full access
DROP POLICY IF EXISTS "Allow authenticated users full access to categories" ON public.categories;
CREATE POLICY "Allow authenticated users full access to categories"
ON public.categories FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon users full access to categories" ON public.categories;
CREATE POLICY "Allow anon users full access to categories"
ON public.categories FOR ALL
TO anon
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated users full access to suppliers"
ON public.suppliers FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon users full access to suppliers" ON public.suppliers;
CREATE POLICY "Allow anon users full access to suppliers"
ON public.suppliers FOR ALL
TO anon
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON public.products;
CREATE POLICY "Allow authenticated users full access to products"
ON public.products FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon users full access to products" ON public.products;
CREATE POLICY "Allow anon users full access to products"
ON public.products FOR ALL
TO anon
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to stock_movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated users full access to stock_movements"
ON public.stock_movements FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon users full access to stock_movements" ON public.stock_movements;
CREATE POLICY "Allow anon users full access to stock_movements"
ON public.stock_movements FOR ALL
TO anon
USING (true) WITH CHECK (true);


-- 8. PRODUCT IMAGES STORAGE BUCKET (Run if storage extension exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload Product Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
