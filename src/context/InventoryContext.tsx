import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Category, Supplier, StockMovement, DashboardMetrics, StockMovementInput } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_CATEGORIES, SEED_SUPPLIERS, SEED_PRODUCTS } from '../lib/seedData';
import { useNotification } from './NotificationContext';

interface InventoryContextType {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  loading: boolean;
  isSupabaseConnected: boolean;
  metrics: DashboardMetrics;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  // Product Operations
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; data?: Product; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Stock Movements
  recordStockMovement: (input: StockMovementInput) => Promise<{ success: boolean; error?: string }>;
  // Categories Operations
  addCategory: (cat: Omit<Category, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Suppliers Operations
  addSupplier: (sup: Omit<Supplier, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<{ success: boolean; error?: string }>;
  deleteSupplier: (id: string) => Promise<{ success: boolean; error?: string }>;
  // System actions
  refreshData: () => Promise<void>;
  resetToDemoSeed: () => void;
  clearAllData: () => Promise<{ success: boolean; message: string }>;
  seedSupabaseData: () => Promise<{ success: boolean; message: string }>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useNotification();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured());

  // Initialize Local Storage fallbacks
  const initLocalData = useCallback(() => {
    let storedCategories: Category[] = [];
    let storedSuppliers: Supplier[] = [];
    let storedProducts: Product[] = [];
    let storedMovements: StockMovement[] = [];

    const localCat = localStorage.getItem('hw_categories');
    if (localCat) {
      try { storedCategories = JSON.parse(localCat); } catch { storedCategories = SEED_CATEGORIES; }
    } else {
      storedCategories = SEED_CATEGORIES;
      localStorage.setItem('hw_categories', JSON.stringify(storedCategories));
    }

    const localSup = localStorage.getItem('hw_suppliers');
    if (localSup) {
      try { storedSuppliers = JSON.parse(localSup); } catch { storedSuppliers = SEED_SUPPLIERS; }
    } else {
      storedSuppliers = SEED_SUPPLIERS;
      localStorage.setItem('hw_suppliers', JSON.stringify(storedSuppliers));
    }

    const localProd = localStorage.getItem('hw_products');
    if (localProd) {
      try { storedProducts = JSON.parse(localProd); } catch { storedProducts = SEED_PRODUCTS; }
    } else {
      storedProducts = SEED_PRODUCTS;
      localStorage.setItem('hw_products', JSON.stringify(storedProducts));
    }

    const localMov = localStorage.getItem('hw_stock_movements');
    if (localMov) {
      try { storedMovements = JSON.parse(localMov); } catch { storedMovements = []; }
    } else {
      // Seed some initial movements for realistic dashboard chart
      storedMovements = [
        {
          id: 'mov-1',
          product_id: 'prod-1',
          movement_type: 'in',
          quantity_changed: 10,
          previous_quantity: 4,
          updated_quantity: 14,
          reason: 'Initial Distributor Shipment',
          notes: 'PO-2026-9041',
          created_by: 'Admin',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 'mov-2',
          product_id: 'prod-4',
          movement_type: 'out',
          quantity_changed: -4,
          previous_quantity: 4,
          updated_quantity: 0,
          reason: 'Walk-in Retail Customer Sale',
          notes: 'Invoice #8472',
          created_by: 'Admin',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 'mov-3',
          product_id: 'prod-2',
          movement_type: 'out',
          quantity_changed: -3,
          previous_quantity: 6,
          updated_quantity: 3,
          reason: 'Client Custom Rig Assembly',
          notes: 'Build Order #3319',
          created_by: 'Admin',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ];
      localStorage.setItem('hw_stock_movements', JSON.stringify(storedMovements));
    }

    setCategories(storedCategories);
    setSuppliers(storedSuppliers);
    setProducts(storedProducts);
    setStockMovements(storedMovements);
  }, []);

  // Fetch Data from Supabase
  const fetchDataFromSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setLoading(true);

      const [catRes, supRes, prodRes, movRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('products').select('*, category:categories(*), supplier:suppliers(*)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*, product:products(*)').order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (supRes.error) throw supRes.error;
      if (prodRes.error) throw prodRes.error;
      if (movRes.error) throw movRes.error;

      setCategories(catRes.data || []);
      setSuppliers(supRes.data || []);
      setProducts(prodRes.data || []);
      setStockMovements(movRes.data || []);
    } catch (err: any) {
      console.warn('Supabase fetch failed, falling back to local dataset:', err);
      toastWarning('Supabase Tables Not Ready', 'Could not query Supabase tables. Using local cache. You can run the schema script in Settings.');
      initLocalData();
    } finally {
      setLoading(false);
    }
  }, [initLocalData, toastWarning]);

  const refreshData = useCallback(async () => {
    const connected = isSupabaseConfigured();
    setIsSupabaseConnected(connected);
    if (connected) {
      await fetchDataFromSupabase();
    } else {
      setLoading(true);
      initLocalData();
      setLoading(false);
    }
  }, [fetchDataFromSupabase, initLocalData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const totalProducts = products.length;
    const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level).length;
    const outOfStockCount = products.filter((p) => p.quantity === 0).length;
    const totalInventoryValuation = products.reduce((acc, p) => acc + (p.purchase_price * p.quantity), 0);
    const potentialRevenue = products.reduce((acc, p) => acc + (p.selling_price * p.quantity), 0);
    const totalSuppliers = suppliers.length;
    const totalCategories = categories.length;

    return {
      totalProducts,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      totalInventoryValuation,
      potentialRevenue,
      totalSuppliers,
      totalCategories,
    };
  }, [products, suppliers.length, categories.length]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity === 0);
  }, [products]);

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    // SKU check
    if (products.some((p) => p.sku.toLowerCase() === productData.sku.toLowerCase())) {
      const err = `A product with SKU "${productData.sku}" already exists.`;
      toastError('SKU Collision', err);
      return { success: false, error: err };
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select('*, category:categories(*), supplier:suppliers(*)')
          .single();

        if (error) throw error;

        // If product was added with initial quantity > 0, log an initial stock entry
        if (data && data.quantity > 0) {
          await supabase.from('stock_movements').insert([
            {
              product_id: data.id,
              movement_type: 'in',
              quantity_changed: data.quantity,
              previous_quantity: 0,
              updated_quantity: data.quantity,
              reason: 'Initial Inventory Entry',
              notes: 'Added during product creation',
              created_by: 'Admin',
            },
          ]);
        }

        toastSuccess('Product Created', `${data.name} was added to inventory.`);
        await refreshData();
        return { success: true, data };
      } catch (err: any) {
        toastError('Failed to Create Product', err.message);
        return { success: false, error: err.message };
      }
    } else {
      // Local storage
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: categories.find((c) => c.id === productData.category_id),
        supplier: suppliers.find((s) => s.id === productData.supplier_id),
      };

      const updated = [newProduct, ...products];
      setProducts(updated);
      localStorage.setItem('hw_products', JSON.stringify(updated));

      if (newProduct.quantity > 0) {
        const initialMovement: StockMovement = {
          id: `mov-${Date.now()}`,
          product_id: newProduct.id,
          movement_type: 'in',
          quantity_changed: newProduct.quantity,
          previous_quantity: 0,
          updated_quantity: newProduct.quantity,
          reason: 'Initial Inventory Entry',
          notes: 'Added during product creation',
          created_by: 'Admin',
          created_at: new Date().toISOString(),
        };
        const updatedMovements = [initialMovement, ...stockMovements];
        setStockMovements(updatedMovements);
        localStorage.setItem('hw_stock_movements', JSON.stringify(updatedMovements));
      }

      toastSuccess('Product Added', `${newProduct.name} saved locally.`);
      return { success: true, data: newProduct };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // Check SKU collision if SKU changed
    if (updates.sku && products.some((p) => p.id !== id && p.sku.toLowerCase() === updates.sku?.toLowerCase())) {
      const err = `Another product already has SKU "${updates.sku}".`;
      toastError('Duplicate SKU', err);
      return { success: false, error: err };
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('products').update({
          ...updates,
          updated_at: new Date().toISOString(),
        }).eq('id', id);

        if (error) throw error;
        toastSuccess('Product Updated', 'Changes saved successfully.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Update Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = products.map((p) => {
        if (p.id === id) {
          const cat = updates.category_id ? categories.find((c) => c.id === updates.category_id) : p.category;
          const sup = updates.supplier_id ? suppliers.find((s) => s.id === updates.supplier_id) : p.supplier;
          return { ...p, ...updates, category: cat, supplier: sup, updated_at: new Date().toISOString() };
        }
        return p;
      });
      setProducts(updated);
      localStorage.setItem('hw_products', JSON.stringify(updated));
      toastSuccess('Product Updated', 'Changes saved locally.');
      return { success: true };
    }
  };

  const deleteProduct = async (id: string) => {
    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        toastSuccess('Product Deleted', 'Product removed from system.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Delete Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem('hw_products', JSON.stringify(updated));
      toastSuccess('Product Deleted', 'Product removed from inventory.');
      return { success: true };
    }
  };

  // Stock Movement Action
  const recordStockMovement = async (input: StockMovementInput) => {
    const targetProduct = products.find((p) => p.id === input.product_id);
    if (!targetProduct) {
      toastError('Product Not Found', 'Could not locate the product for this movement.');
      return { success: false, error: 'Product not found' };
    }

    const currentQty = targetProduct.quantity;
    let newQty = currentQty;
    let qtyDelta = 0;

    if (input.movement_type === 'in') {
      if (input.quantity <= 0) {
        toastError('Invalid Quantity', 'Stock addition quantity must be greater than zero.');
        return { success: false, error: 'Quantity must be positive' };
      }
      qtyDelta = input.quantity;
      newQty = currentQty + input.quantity;
    } else if (input.movement_type === 'out') {
      if (input.quantity <= 0) {
        toastError('Invalid Quantity', 'Stock removal quantity must be greater than zero.');
        return { success: false, error: 'Quantity must be positive' };
      }
      if (currentQty < input.quantity) {
        toastError('Insufficient Stock', `Cannot remove ${input.quantity} units. Only ${currentQty} units currently in stock.`);
        return { success: false, error: 'Insufficient stock' };
      }
      qtyDelta = -input.quantity;
      newQty = currentQty - input.quantity;
    } else if (input.movement_type === 'adjustment') {
      if (input.quantity < 0) {
        toastError('Negative Stock Prohibited', 'Adjusted stock quantity cannot be negative.');
        return { success: false, error: 'Stock cannot be negative' };
      }
      qtyDelta = input.quantity - currentQty;
      newQty = input.quantity;
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        // Try calling atomic RPC procedure first
        const { error: rpcError } = await supabase.rpc('process_stock_movement', {
          p_product_id: input.product_id,
          p_movement_type: input.movement_type,
          p_quantity: input.quantity,
          p_reason: input.reason,
          p_notes: input.notes || null,
          p_created_by: 'Admin',
        });

        if (rpcError) {
          // If RPC not configured yet in Supabase, fallback to direct update + insert
          const { error: updateErr } = await supabase
            .from('products')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', input.product_id);

          if (updateErr) throw updateErr;

          const { error: insertErr } = await supabase.from('stock_movements').insert([
            {
              product_id: input.product_id,
              movement_type: input.movement_type,
              quantity_changed: qtyDelta,
              previous_quantity: currentQty,
              updated_quantity: newQty,
              reason: input.reason,
              notes: input.notes || '',
              created_by: 'Admin',
            },
          ]);

          if (insertErr) throw insertErr;
        }

        toastSuccess('Stock Updated', `New quantity for ${targetProduct.name}: ${newQty} units`);
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Stock Movement Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      // Local state update
      const updatedProducts = products.map((p) => (p.id === input.product_id ? { ...p, quantity: newQty } : p));
      setProducts(updatedProducts);
      localStorage.setItem('hw_products', JSON.stringify(updatedProducts));

      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        product_id: input.product_id,
        product: targetProduct,
        movement_type: input.movement_type,
        quantity_changed: qtyDelta,
        previous_quantity: currentQty,
        updated_quantity: newQty,
        reason: input.reason,
        notes: input.notes || '',
        created_by: 'Admin',
        created_at: new Date().toISOString(),
      };

      const updatedMovements = [newMovement, ...stockMovements];
      setStockMovements(updatedMovements);
      localStorage.setItem('hw_stock_movements', JSON.stringify(updatedMovements));

      toastSuccess('Stock Updated', `Adjusted ${targetProduct.name} to ${newQty} units.`);
      return { success: true };
    }
  };

  // Category Actions
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    if (categories.some((c) => c.code.toLowerCase() === catData.code.toLowerCase())) {
      toastError('Duplicate Code', 'A category with this code already exists.');
      return { success: false, error: 'Category code must be unique' };
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('categories').insert([catData]);
        if (error) throw error;
        toastSuccess('Category Created', `${catData.name} was added.`);
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Failed to Create Category', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const newCat: Category = {
        ...catData,
        id: `cat-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem('hw_categories', JSON.stringify(updated));
      toastSuccess('Category Added', `${newCat.name} saved.`);
      return { success: true };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('categories').update(updates).eq('id', id);
        if (error) throw error;
        toastSuccess('Category Updated', 'Changes saved.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Update Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setCategories(updated);
      localStorage.setItem('hw_categories', JSON.stringify(updated));
      toastSuccess('Category Updated', 'Saved.');
      return { success: true };
    }
  };

  const deleteCategory = async (id: string) => {
    // Check if products exist for category
    const associatedCount = products.filter((p) => p.category_id === id).length;
    if (associatedCount > 0) {
      const msg = `Cannot delete category: ${associatedCount} product(s) are currently categorized under it. Reassign them first.`;
      toastError('Category In Use', msg);
      return { success: false, error: msg };
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        toastSuccess('Category Deleted', 'Category removed successfully.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Delete Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      localStorage.setItem('hw_categories', JSON.stringify(updated));
      toastSuccess('Category Deleted', 'Category removed.');
      return { success: true };
    }
  };

  // Supplier Actions
  const addSupplier = async (supData: Omit<Supplier, 'id'>) => {
    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('suppliers').insert([supData]);
        if (error) throw error;
        toastSuccess('Supplier Added', `${supData.name} registered.`);
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Failed to Add Supplier', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const newSup: Supplier = {
        ...supData,
        id: `sup-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const updated = [...suppliers, newSup];
      setSuppliers(updated);
      localStorage.setItem('hw_suppliers', JSON.stringify(updated));
      toastSuccess('Supplier Added', `${newSup.name} saved.`);
      return { success: true };
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
        if (error) throw error;
        toastSuccess('Supplier Updated', 'Changes saved.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Update Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setSuppliers(updated);
      localStorage.setItem('hw_suppliers', JSON.stringify(updated));
      toastSuccess('Supplier Updated', 'Saved.');
      return { success: true };
    }
  };

  const deleteSupplier = async (id: string) => {
    const associatedCount = products.filter((p) => p.supplier_id === id).length;
    if (associatedCount > 0) {
      const msg = `Cannot delete supplier: ${associatedCount} product(s) are supplied by this vendor. Please reassign or remove product associations first.`;
      toastError('Supplier Has Associated Products', msg);
      return { success: false, error: msg };
    }

    const supabase = getSupabase();
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        toastSuccess('Supplier Removed', 'Supplier deleted successfully.');
        await refreshData();
        return { success: true };
      } catch (err: any) {
        toastError('Delete Failed', err.message);
        return { success: false, error: err.message };
      }
    } else {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('hw_suppliers', JSON.stringify(updated));
      toastSuccess('Supplier Removed', 'Supplier removed.');
      return { success: true };
    }
  };

  // Reset to default demo hardware dataset
  const resetToDemoSeed = () => {
    localStorage.setItem('hw_categories', JSON.stringify(SEED_CATEGORIES));
    localStorage.setItem('hw_suppliers', JSON.stringify(SEED_SUPPLIERS));
    localStorage.setItem('hw_products', JSON.stringify(SEED_PRODUCTS));
    localStorage.removeItem('hw_stock_movements');
    initLocalData();
    toastSuccess('Demo Data Reloaded', 'Default computer hardware inventory restored.');
  };

  // Delete all data completely from Supabase and local cache
  const clearAllData = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      if (supabase && isSupabaseConnected) {
        await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      localStorage.setItem('hw_categories', JSON.stringify([]));
      localStorage.setItem('hw_suppliers', JSON.stringify([]));
      localStorage.setItem('hw_products', JSON.stringify([]));
      localStorage.setItem('hw_stock_movements', JSON.stringify([]));

      setCategories([]);
      setSuppliers([]);
      setProducts([]);
      setStockMovements([]);

      toastSuccess('All Data Cleared', 'All inventory, products, suppliers, and categories have been deleted.');
      return { success: true, message: 'All data deleted successfully.' };
    } catch (err: any) {
      toastError('Clear Failed', err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Seed data directly into Supabase tables
  const seedSupabaseData = async (): Promise<{ success: boolean; message: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured yet. Please enter your Supabase URL & Key.' };
    }

    try {
      setLoading(true);

      // 1. Categories: Fetch existing first
      const { data: existingCats } = await supabase.from('categories').select('id, code, name');
      const existingCatCodes = new Set((existingCats || []).map((c: any) => c.code));

      const catsToInsert = SEED_CATEGORIES.filter((c) => !existingCatCodes.has(c.code)).map(({ id, ...c }) => c);
      if (catsToInsert.length > 0) {
        await supabase.from('categories').insert(catsToInsert);
      }

      const { data: dbCategories, error: fetchCatErr } = await supabase.from('categories').select('id, code');
      if (fetchCatErr) throw fetchCatErr;
      const catMap = new Map((dbCategories || []).map((c: any) => [c.code, c.id]));

      // 2. Suppliers: Fetch existing first
      const { data: existingSups } = await supabase.from('suppliers').select('id, name');
      const existingSupNames = new Set((existingSups || []).map((s: any) => s.name));

      const supsToInsert = SEED_SUPPLIERS.filter((s) => !existingSupNames.has(s.name)).map(({ id, ...s }) => s);
      if (supsToInsert.length > 0) {
        await supabase.from('suppliers').insert(supsToInsert);
      }

      const { data: dbSuppliers, error: fetchSupErr } = await supabase.from('suppliers').select('id, name');
      if (fetchSupErr) throw fetchSupErr;
      const supMap = new Map((dbSuppliers || []).map((s: any) => [s.name, s.id]));

      // 3. Products: Fetch existing by SKU
      const { data: existingProds } = await supabase.from('products').select('id, sku');
      const existingSkus = new Set((existingProds || []).map((p: any) => p.sku));

      const mappedProducts = SEED_PRODUCTS.filter((p) => !existingSkus.has(p.sku))
        .map((p) => {
          const origCat = SEED_CATEGORIES.find((c) => c.id === p.category_id);
          const origSup = SEED_SUPPLIERS.find((s) => s.id === p.supplier_id);
          const dbCatId = origCat ? catMap.get(origCat.code) : null;
          const dbSupId = origSup ? supMap.get(origSup.name) : null;

          return {
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            category_id: dbCatId,
            supplier_id: dbSupId,
            brand: p.brand,
            model: p.model,
            description: p.description,
            purchase_price: p.purchase_price,
            selling_price: p.selling_price,
            quantity: p.quantity,
            min_stock_level: p.min_stock_level,
            image_url: p.image_url,
          };
        })
        .filter((p) => p.category_id);

      if (mappedProducts.length > 0) {
        const { data: insertedProds, error: prodErr } = await supabase.from('products').insert(mappedProducts).select('id, quantity');
        if (prodErr) throw new Error(`Product seed failed: ${prodErr.message}`);

        // Insert initial movement logs
        const movements = (insertedProds || [])
          .filter((p: any) => p.quantity > 0)
          .map((p: any) => ({
            product_id: p.id,
            movement_type: 'in',
            quantity_changed: p.quantity,
            previous_quantity: 0,
            updated_quantity: p.quantity,
            reason: 'Initial Warehouse Intake',
            notes: 'At Tech Digital System Seeding',
            created_by: 'Admin',
          }));

        if (movements.length > 0) {
          await supabase.from('stock_movements').insert(movements);
        }
      }

      await refreshData();
      return { success: true, message: 'Successfully seeded categories, suppliers, and hardware products to At Tech Digital inventory!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Seeding failed' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        suppliers,
        stockMovements,
        loading,
        isSupabaseConnected,
        metrics,
        lowStockProducts,
        outOfStockProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        recordStockMovement,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        refreshData,
        resetToDemoSeed,
        clearAllData,
        seedSupabaseData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
