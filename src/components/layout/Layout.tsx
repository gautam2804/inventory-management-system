import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { Header } from './Header';
import { QuickScannerModal } from './QuickScannerModal';
import { ProductFormModal } from '../products/ProductFormModal';
import { ProductDetailModal } from '../products/ProductDetailModal';
import { StockAdjustmentModal } from '../stock/StockAdjustmentModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Product, StockMovementType } from '../../types';
import { useInventory } from '../../context/InventoryContext';

interface LayoutProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { deleteProduct } = useInventory();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockAdjustType, setStockAdjustType] = useState<StockMovementType>('in');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global Keyboard Shortcut: Ctrl+K or / to open Barcode Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setScannerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setProductFormOpen(true);
  };

  const handleOpenStockAdjust = (product?: Product, type: StockMovementType = 'in') => {
    setStockAdjustProduct(product || null);
    setStockAdjustType(type);
    setStockAdjustOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    await deleteProduct(productToDelete.id);
    setIsDeleting(false);
    setProductToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenQuickStock={() => handleOpenStockAdjust()}
          onSelectProduct={(p) => setSelectedProductForDetail(p)}
          onNavigateToStock={(p) => handleOpenStockAdjust(p, 'in')}
          onNavigateToTab={onSelectTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Barcode & SKU Scanner Modal */}
      <QuickScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectProduct={(p) => setSelectedProductForDetail(p)}
        onQuickAdjust={(p, type) => handleOpenStockAdjust(p, type)}
      />

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        product={productToEdit}
      />

      {/* Product Detail Inspector Modal */}
      <ProductDetailModal
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        onEdit={(p) => handleEditProduct(p)}
        onAdjustStock={(p) => handleOpenStockAdjust(p, 'in')}
        onDelete={(p) => setProductToDelete(p)}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={stockAdjustOpen}
        onClose={() => setStockAdjustOpen(false)}
        initialProduct={stockAdjustProduct}
        initialType={stockAdjustType}
      />

      {/* Product Delete Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Hardware Product?"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}" (SKU: ${productToDelete?.sku})? This action cannot be reversed.`}
        confirmText="Delete Product"
        isLoading={isDeleting}
      />
    </div>
  );
};
