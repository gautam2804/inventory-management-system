import React, { useState } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/layout/Layout';
import { NavItemKey } from './components/layout/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { StockAdjustmentPage } from './pages/StockAdjustmentPage';
import { StockMovementHistoryPage } from './pages/StockMovementHistoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductFormModal } from './components/products/ProductFormModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { StockAdjustmentModal } from './components/stock/StockAdjustmentModal';
import { QuickScannerModal } from './components/layout/QuickScannerModal';
import { Product } from './types';
import { Loader2 } from 'lucide-react';

const MainApplication: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');

  // Modals for page-level interactions
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b12] flex items-center justify-center text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setAddProductOpen(true);
  };

  const handleStockAdjust = (product?: Product) => {
    setStockProduct(product || null);
    setStockModalOpen(true);
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && (
        <DashboardPage
          onOpenAddProduct={() => {
            setProductToEdit(null);
            setAddProductOpen(true);
          }}
          onOpenStockAdjust={handleStockAdjust}
          onOpenScanner={() => setScannerOpen(true)}
          onSelectProduct={(p) => setDetailProduct(p)}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'products' && (
        <ProductsPage
          onOpenAddProduct={() => {
            setProductToEdit(null);
            setAddProductOpen(true);
          }}
          onEditProduct={handleEditProduct}
          onSelectProduct={(p) => setDetailProduct(p)}
          onAdjustStock={(p) => handleStockAdjust(p)}
          onOpenScanner={() => setScannerOpen(true)}
        />
      )}

      {currentTab === 'categories' && (
        <CategoriesPage
          onNavigateToProductsWithCategory={(_catId) => {
            setCurrentTab('products');
          }}
        />
      )}

      {currentTab === 'stock-adjustment' && (
        <StockAdjustmentPage
          onOpenScanner={() => setScannerOpen(true)}
          onNavigateToHistory={() => setCurrentTab('stock-history')}
        />
      )}

      {currentTab === 'stock-history' && (
        <StockMovementHistoryPage onSelectProduct={(p) => setDetailProduct(p)} />
      )}

      {currentTab === 'suppliers' && (
        <SuppliersPage onSelectProduct={(p) => setDetailProduct(p)} />
      )}

      {currentTab === 'reports' && <ReportsPage />}

      {currentTab === 'settings' && <SettingsPage />}

      {/* Global Modals triggered from child pages */}
      <ProductFormModal
        isOpen={addProductOpen}
        onClose={() => {
          setAddProductOpen(false);
          setProductToEdit(null);
        }}
        product={productToEdit}
      />

      <ProductDetailModal
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        onEdit={handleEditProduct}
        onAdjustStock={(p) => handleStockAdjust(p)}
        onDelete={() => setDetailProduct(null)}
      />

      <StockAdjustmentModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        initialProduct={stockProduct}
        initialType="in"
      />

      <QuickScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectProduct={(p) => setDetailProduct(p)}
        onQuickAdjust={(p, type) => {
          setStockProduct(p);
          setStockModalOpen(true);
        }}
      />
    </Layout>
  );
};

export function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <InventoryProvider>
          <MainApplication />
        </InventoryProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
