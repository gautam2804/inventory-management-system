import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types';

interface NotificationsDropdownProps {
  onSelectProduct: (product: Product) => void;
  onNavigateToStock: (product: Product) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onSelectProduct,
  onNavigateToStock,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lowStockProducts, outOfStockProducts } = useInventory();

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-sm"
        aria-label="Stock Alerts"
      >
        <Bell className="w-5 h-5" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {totalAlerts}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Inventory Alerts</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-medium">
                {totalAlerts} items
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Reorder Required</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {totalAlerts === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                All inventory levels are optimal! No low stock alerts.
              </div>
            ) : (
              <>
                {/* Out of Stock Section */}
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{product.name}</div>
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            OUT OF STOCK (0 units) &bull; SKU: {product.sku}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNavigateToStock(product);
                        }}
                        className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center shrink-0 cursor-pointer"
                      >
                        Restock <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Low Stock Section */}
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{product.name}</div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            {product.quantity} units left (Min: {product.min_stock_level}) &bull; {product.brand}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNavigateToStock(product);
                        }}
                        className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center shrink-0 cursor-pointer"
                      >
                        Restock <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
