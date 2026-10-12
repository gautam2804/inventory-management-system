export type StockMovementType = 'in' | 'out' | 'adjustment';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id: string;
  category?: Category;
  brand: string;
  model: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock_level: number;
  supplier_id?: string | null;
  supplier?: Supplier;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  movement_type: StockMovementType;
  quantity_changed: number;
  previous_quantity: number;
  updated_quantity: number;
  reason: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValuation: number;
  potentialRevenue: number;
  totalSuppliers: number;
  totalCategories: number;
}

export interface StockMovementInput {
  product_id: string;
  movement_type: StockMovementType;
  quantity: number; // Positive quantity delta or target count
  reason: string;
  notes?: string;
}

export interface FilterOptions {
  search: string;
  categoryId?: string;
  supplierId?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  full_name?: string;
}
