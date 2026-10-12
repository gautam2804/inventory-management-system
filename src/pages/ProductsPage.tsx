import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency, formatDate } from '../lib/utils';
import { exportToCSV } from '../lib/csvExport';
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye,
  ArrowDownLeft,
  ScanBarcode,
  Layers,
  Cpu,
} from 'lucide-react';

interface ProductsPageProps {
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onOpenScanner: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onOpenAddProduct,
  onEditProduct,
  onSelectProduct,
  onAdjustStock,
  onOpenScanner,
}) => {
  const { products, categories, suppliers, deleteProduct } = useInventory();

  // Filters and Search state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Delete state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          search === '' ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.model.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const matchesSupplier = selectedSupplier === 'all' || p.supplier_id === selectedSupplier;

        let matchesStock = true;
        if (stockStatus === 'in_stock') {
          matchesStock = p.quantity > p.min_stock_level;
        } else if (stockStatus === 'low_stock') {
          matchesStock = p.quantity > 0 && p.quantity <= p.min_stock_level;
        } else if (stockStatus === 'out_of_stock') {
          matchesStock = p.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof Product] ?? '';
        let valB: any = b[sortBy as keyof Product] ?? '';

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [products, search, selectedCategory, selectedSupplier, stockStatus, sortBy, sortOrder]);

  // Paginated chunk
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    await deleteProduct(productToDelete.id);
    setIsDeleting(false);
    setProductToDelete(null);
  };

  const handleExportCSV = () => {
    const rows = filteredProducts.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Barcode: p.barcode || 'N/A',
      Category: p.category?.name || categories.find((c) => c.id === p.category_id)?.name || 'N/A',
      Brand: p.brand,
      Model: p.model,
      'Purchase Price (INR)': p.purchase_price,
      'Selling Price (INR)': p.selling_price,
      'Available Quantity': p.quantity,
      'Min Stock Level': p.min_stock_level,
      'Stock Status':
        p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.min_stock_level ? 'Low Stock' : 'In Stock',
      Supplier: p.supplier?.name || suppliers.find((s) => s.id === p.supplier_id)?.name || 'N/A',
      'Inventory Valuation (INR)': (p.purchase_price * p.quantity).toFixed(2),
    }));
    exportToCSV('Hardware_Products_Catalog', rows);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenAddProduct}
          >
            Add Hardware Product
          </Button>

          <Button
            variant="outline"
            icon={<ScanBarcode className="w-4 h-4 text-cyan-400" />}
            onClick={onOpenScanner}
          >
            Quick Barcode Scanner
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="w-4 h-4 text-slate-400" />}
          onClick={handleExportCSV}
        >
          Export CSV ({filteredProducts.length})
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-lg transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name, SKU, barcode, brand, or model..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm rounded-xl border border-slate-300 dark:border-slate-700/80 px-3 py-2.5 focus:outline-none focus:border-cyan-500 shadow-sm dark:shadow-none"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm rounded-xl border border-slate-300 dark:border-slate-700/80 px-3 py-2.5 focus:outline-none focus:border-cyan-500 shadow-sm dark:shadow-none"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">Optimal In Stock</option>
              <option value="low_stock">Low Stock (At or Below Min)</option>
              <option value="out_of_stock">Out of Stock (0 Units)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Supplier:</span>
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 dark:text-slate-400">
            Found <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> hardware products
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
              <tr>
                <th className="py-3.5 px-4">Product Details</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('sku')}
                >
                  <div className="flex items-center gap-1">
                    <span>SKU & Barcode</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Category</th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('purchase_price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost / Retail</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('quantity')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Cpu className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No hardware products match your criteria.</p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('all');
                          setSelectedSupplier('all');
                          setStockStatus('all');
                        }}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const isOutOfStock = p.quantity === 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= p.min_stock_level;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectProduct(p)}
                    >
                      {/* Product Name & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                   (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <Cpu className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.brand} &bull; <span className="font-mono">{p.model}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="font-semibold text-cyan-600 dark:text-cyan-400">{p.sku}</div>
                        {p.barcode && <div className="text-[11px] text-slate-400 dark:text-slate-500">{p.barcode}</div>}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          {cat?.name || 'Hardware'}
                        </span>
                      </td>

                      {/* Cost / Retail */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-cyan-600 dark:text-cyan-400 text-xs">
                          {formatCurrency(p.selling_price)}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          Cost: {formatCurrency(p.purchase_price)}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-base">{p.quantity}</span>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Min: {p.min_stock_level}</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : 'in_stock'
                          }
                          size="sm"
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>

                      {/* Row Action Buttons */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()} // Avoid triggering row click
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Adjust Stock"
                            onClick={() => onAdjustStock(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          <button
                            title="Edit Product"
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            title="Delete Product"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Hardware Product?"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}" (SKU: ${productToDelete?.sku})? This action cannot be reversed.`}
        confirmText="Delete Product"
        isLoading={isDeleting}
      />
    </div>
  );
};
