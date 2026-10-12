import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types';
import { ScanBarcode, ArrowDownLeft, ArrowUpRight, Eye } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdjust: (product: Product, type: 'in' | 'out' | 'adjustment') => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onQuickAdjust,
}) => {
  const { products } = useInventory();
  const [query, setQuery] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setMatchedProduct(null);
      setFeedback(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSearch = (searchVal: string) => {
    const term = searchVal.trim().toLowerCase();
    if (!term) {
      setMatchedProduct(null);
      setFeedback(null);
      return;
    }

    // Match exact or startsWith barcode or SKU first
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === term) ||
        p.sku.toLowerCase() === term ||
        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        p.sku.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
    );

    if (found) {
      setMatchedProduct(found);
      setFeedback('Hardware product identified!');
    } else {
      setMatchedProduct(null);
      setFeedback('No product found with this barcode or SKU.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
  };

  const simulateScan = (barcodeSample: string) => {
    setQuery(barcodeSample);
    handleSearch(barcodeSample);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hardware Barcode & SKU Scanner"
      subtitle="Compatible with physical USB barcode scanners and keyboard entry"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 dark:text-slate-400">Scanner transmits keystrokes + Enter</span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Input Bar */}
        <div className="relative">
          <div className="absolute left-3.5 top-3.5 text-cyan-600 dark:text-cyan-400">
            <ScanBarcode className="w-5 h-5 animate-pulse" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode with scanner device or type SKU..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base font-mono rounded-xl border-2 border-cyan-500/50 pl-11 pr-24 py-3 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
          />
          <button
            type="button"
            onClick={() => handleSearch(query)}
            className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Lookup
          </button>
        </div>

        {/* Demo Scanner Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Test barcode buttons:</span>
          {products.slice(0, 3).map((p) => (
            p.barcode && (
              <button
                key={p.id}
                type="button"
                onClick={() => simulateScan(p.barcode!)}
                className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Scan: {p.barcode}
              </button>
            )
          ))}
        </div>

        {/* Match Result Display */}
        {matchedProduct ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/40">
                    SKU: {matchedProduct.sku}
                  </span>
                  {matchedProduct.barcode && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      UPC: {matchedProduct.barcode}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{matchedProduct.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{matchedProduct.brand} &bull; {matchedProduct.model}</p>
              </div>

              <Badge
                variant={
                  matchedProduct.quantity === 0
                    ? 'out_of_stock'
                    : matchedProduct.quantity <= matchedProduct.min_stock_level
                    ? 'low_stock'
                    : 'in_stock'
                }
              >
                {matchedProduct.quantity === 0
                  ? 'Out of Stock'
                  : matchedProduct.quantity <= matchedProduct.min_stock_level
                  ? 'Low Stock'
                  : 'In Stock'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Available</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{matchedProduct.quantity} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Retail Price</span>
                <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(matchedProduct.selling_price)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Cost Price</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(matchedProduct.purchase_price)}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <Button
                size="sm"
                variant="outline"
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => {
                  onSelectProduct(matchedProduct);
                  onClose();
                }}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="success"
                icon={<ArrowDownLeft className="w-3.5 h-3.5" />}
                onClick={() => {
                  onQuickAdjust(matchedProduct, 'in');
                  onClose();
                }}
              >
                + Restock In
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                disabled={matchedProduct.quantity <= 0}
                onClick={() => {
                  onQuickAdjust(matchedProduct, 'out');
                  onClose();
                }}
              >
                - Remove Stock
              </Button>
            </div>
          </div>
        ) : query ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            {feedback || 'Searching for product barcode...'}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
