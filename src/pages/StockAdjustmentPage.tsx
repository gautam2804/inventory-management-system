import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, StockMovementType } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  ScanBarcode,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Cpu,
} from 'lucide-react';

interface StockAdjustmentPageProps {
  onOpenScanner: () => void;
  onNavigateToHistory: () => void;
}

export const StockAdjustmentPage: React.FC<StockAdjustmentPageProps> = ({
  onOpenScanner,
  onNavigateToHistory,
}) => {
  const { products, recordStockMovement, stockMovements } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<StockMovementType>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Supplier Delivery Restock');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const filteredSelectableProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const currentStock = selectedProduct ? selectedProduct.quantity : 0;
  let targetStock = currentStock;

  if (movementType === 'in') {
    targetStock = currentStock + (Number(quantity) || 0);
  } else if (movementType === 'out') {
    targetStock = currentStock - (Number(quantity) || 0);
  } else if (movementType === 'adjustment') {
    targetStock = Number(quantity) || 0;
  }

  const isInvalidRemoval = movementType === 'out' && (Number(quantity) || 0) > currentStock;

  const handleApplyMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isInvalidRemoval) return;

    setIsSubmitting(true);
    const res = await recordStockMovement({
      product_id: selectedProduct.id,
      movement_type: movementType,
      quantity: Number(quantity),
      reason,
      notes,
    });
    setIsSubmitting(false);

    if (res.success) {
      setNotes('');
      setQuantity(1);
    }
  };

  const presetReasons: Record<StockMovementType, string[]> = {
    in: [
      'Supplier Delivery Restock',
      'Return to Inventory (Customer RMA)',
      'Wholesale Stock Intake',
      'Inter-Branch Inventory Transfer In',
    ],
    out: [
      'Customer Retail / Invoice Order Fulfillment',
      'Damaged / Defective Stock Scrapped',
      'Return to Vendor / RMA Dispatch',
      'Internal Demo & Testing Rig Consumption',
    ],
    adjustment: [
      'Annual Physical Inventory Audit Reconciliation',
      'Bi-weekly Cycle Count Correction',
      'Barcode Packaging Discrepancy Rectified',
      'Admin Count Correction',
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Stock Adjustment Workbench</h2>
          <p className="text-xs text-slate-400">
            Record inward goods receipts, outward customer dispatches, or cycle count audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ScanBarcode className="w-4 h-4 text-cyan-400" />}
            onClick={onOpenScanner}
          >
            Scan Barcode
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<History className="w-4 h-4 text-indigo-400" />}
            onClick={onNavigateToHistory}
          >
            Audit History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          {/* Movement Type Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Action Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMovementType('in');
                  setReason(presetReasons.in[0]);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  movementType === 'in'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5 mb-1.5 text-cyan-400" />
                <span className="text-xs font-bold">Stock In (+)</span>
                <span className="text-[10px] text-slate-400">Receive / Restock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementType('out');
                  setReason(presetReasons.out[0]);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  movementType === 'out'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 mb-1.5 text-rose-400" />
                <span className="text-xs font-bold">Stock Out (-)</span>
                <span className="text-[10px] text-slate-400">Dispatch / Sale</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementType('adjustment');
                  setReason(presetReasons.adjustment[0]);
                  if (selectedProduct) setQuantity(selectedProduct.quantity);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  movementType === 'adjustment'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-5 h-5 mb-1.5 text-indigo-400" />
                <span className="text-xs font-bold">Audit Correction</span>
                <span className="text-[10px] text-slate-400">Set exact stock</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleApplyMovement} className="space-y-4">
            {/* Product Selector with Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Hardware Product <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p && movementType === 'adjustment') setQuantity(p.quantity);
                }}
                className="w-full bg-slate-950 text-slate-100 text-sm rounded-xl border border-slate-700 px-3.5 py-3 focus:outline-none focus:border-cyan-500"
              >
                {filteredSelectableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — SKU: {p.sku} (Current Stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <Input
                label={
                  movementType === 'adjustment'
                    ? 'Target Physical Inventory Count'
                    : movementType === 'in'
                    ? 'Units to Add to Stock (+)'
                    : 'Units to Remove from Stock (-)'
                }
                type="number"
                min={movementType === 'adjustment' ? 0 : 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            {/* Real-time Math Alert */}
            {isInvalidRemoval && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient stock! You cannot dispatch {quantity} units because only {currentStock} are available in inventory.
                </span>
              </div>
            )}

            {/* Reason Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Reason for Stock Update</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presetReasons[movementType].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      reason === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter or select reason..."
                required
              />
            </div>

            {/* Notes / Reference Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Reference / Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter Purchase Order number, RMA ID, or dispatch slip..."
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-slate-700 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 custom-scrollbar"
              />
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant={movementType === 'in' ? 'primary' : movementType === 'out' ? 'danger' : 'secondary'}
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isInvalidRemoval || !selectedProduct}
              >
                {movementType === 'in'
                  ? `Confirm Inward Receipt (+${quantity} Units)`
                  : movementType === 'out'
                  ? `Confirm Outward Dispatch (-${quantity} Units)`
                  : `Save Inventory Audit (${targetStock} Total Units)`}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Info Box & Calculations (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Product Live Card */}
          {selectedProduct && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    SKU: {selectedProduct.sku}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5 line-clamp-2">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedProduct.brand} &bull; {selectedProduct.model}
                  </p>
                </div>

                <Badge
                  variant={
                    selectedProduct.quantity === 0
                      ? 'out_of_stock'
                      : selectedProduct.quantity <= selectedProduct.min_stock_level
                      ? 'low_stock'
                      : 'in_stock'
                  }
                >
                  {selectedProduct.quantity === 0
                    ? 'Out of Stock'
                    : selectedProduct.quantity <= selectedProduct.min_stock_level
                    ? 'Low Stock'
                    : 'In Stock'}
                </Badge>
              </div>

              {/* Math Projection Box */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Stock Projection Calculator
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current</span>
                    <span className="text-lg font-bold text-white">{currentStock}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Delta</span>
                    <span
                      className={`text-lg font-bold ${
                        movementType === 'in'
                          ? 'text-cyan-400'
                          : movementType === 'out'
                          ? 'text-rose-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {movementType === 'in' ? `+${quantity}` : movementType === 'out' ? `-${quantity}` : `${targetStock - currentStock >= 0 ? '+' : ''}${targetStock - currentStock}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">New Level</span>
                    <span
                      className={`text-lg font-bold ${
                        targetStock < 0
                          ? 'text-rose-400'
                          : targetStock <= selectedProduct.min_stock_level
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {targetStock}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs flex justify-between text-slate-400">
                  <span>Unit Cost Basis:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(selectedProduct.purchase_price)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>New Total Valuation:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(selectedProduct.purchase_price * Math.max(0, targetStock))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Recent Activity list */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest Movement Stream
            </h4>
            <div className="space-y-2">
              {stockMovements.slice(0, 3).map((mov) => {
                const prod = products.find((p) => p.id === mov.product_id) || mov.product;
                return (
                  <div
                    key={mov.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-white truncate">{prod?.name || 'Component'}</div>
                      <div className="text-[10px] text-slate-400">{mov.reason}</div>
                    </div>
                    <div
                      className={`font-mono font-bold shrink-0 ${
                        mov.movement_type === 'in'
                          ? 'text-cyan-400'
                          : mov.movement_type === 'out'
                          ? 'text-rose-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {mov.quantity_changed > 0 ? `+${mov.quantity_changed}` : mov.quantity_changed}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
