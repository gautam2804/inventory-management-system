import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Product, StockMovementType } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react';

const movementSchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  movement_type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(2, 'Please specify the reason for this movement'),
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  initialType?: StockMovementType;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  initialType = 'in',
}) => {
  const { products, recordStockMovement } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: '',
      movement_type: 'in',
      quantity: 1,
      reason: 'Standard Stock Delivery',
      notes: '',
    },
  });

  const movementType = watch('movement_type');
  const watchedProductId = watch('product_id');
  const enteredQty = watch('quantity') || 0;

  const currentProduct = products.find((p) => p.id === (watchedProductId || selectedProductId));

  useEffect(() => {
    if (isOpen) {
      const prodId = initialProduct ? initialProduct.id : products[0]?.id || '';
      setSelectedProductId(prodId);
      reset({
        product_id: prodId,
        movement_type: initialType,
        quantity: initialType === 'adjustment' && initialProduct ? initialProduct.quantity : 1,
        reason:
          initialType === 'in'
            ? 'Supplier Shipment Intake'
            : initialType === 'out'
            ? 'Customer Order Fulfillment'
            : 'Physical Inventory Reconciliation Audit',
        notes: '',
      });
    }
  }, [isOpen, initialProduct, initialType, products, reset]);

  // Calculate projected new quantity
  const currentStock = currentProduct ? currentProduct.quantity : 0;
  let projectedStock = currentStock;

  if (movementType === 'in') {
    projectedStock = currentStock + (Number(enteredQty) || 0);
  } else if (movementType === 'out') {
    projectedStock = currentStock - (Number(enteredQty) || 0);
  } else if (movementType === 'adjustment') {
    projectedStock = Number(enteredQty) || 0;
  }

  const isRemovalOverLimit = movementType === 'out' && (Number(enteredQty) || 0) > currentStock;

  const onSubmit = async (data: MovementFormData) => {
    if (isRemovalOverLimit) {
      return;
    }

    const res = await recordStockMovement({
      product_id: data.product_id,
      movement_type: data.movement_type,
      quantity: Number(data.quantity),
      reason: data.reason,
      notes: data.notes || '',
    });

    if (res.success) {
      onClose();
    }
  };

  const presetReasons: Record<StockMovementType, string[]> = {
    in: [
      'Supplier Shipment Intake',
      'Stock Restock / Replenishment',
      'Customer Warranty Return (Working)',
      'Inter-warehouse Transfer In',
    ],
    out: [
      'Customer Order Fulfillment',
      'Internal System Integration / Rig Build',
      'Damaged / Defective Component Scrapped',
      'Return to Vendor (RTV)',
    ],
    adjustment: [
      'Physical Inventory Reconciliation Audit',
      'Cycle Count Discrepancy Correction',
      'Damaged Box Unit Unaccounted',
      'Admin Count Correction',
    ],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hardware Stock Adjustment"
      subtitle="Record stock additions, outward dispatches, or audit corrections"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Movement Type Radio Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Movement Type <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setValue('movement_type', 'in');
                setValue('reason', presetReasons.in[0]);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                movementType === 'in'
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mb-1 text-cyan-400" />
              <span className="text-xs font-semibold">Stock In (+)</span>
              <span className="text-[10px] text-slate-400">Receive / Restock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('movement_type', 'out');
                setValue('reason', presetReasons.out[0]);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                movementType === 'out'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mb-1 text-rose-400" />
              <span className="text-xs font-semibold">Stock Out (-)</span>
              <span className="text-[10px] text-slate-400">Dispatched / Sold</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('movement_type', 'adjustment');
                setValue('reason', presetReasons.adjustment[0]);
                if (currentProduct) setValue('quantity', currentProduct.quantity);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                movementType === 'adjustment'
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <RefreshCw className="w-5 h-5 mb-1 text-indigo-400" />
              <span className="text-xs font-semibold">Audit Count</span>
              <span className="text-[10px] text-slate-400">Set exact stock</span>
            </button>
          </div>
        </div>

        {/* Product Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Select Hardware Product <span className="text-rose-400">*</span>
          </label>
          <select
            className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl border border-slate-700 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
            {...register('product_id', {
              onChange: (e) => setSelectedProductId(e.target.value),
            })}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — SKU: {p.sku} (Available: {p.quantity})
              </option>
            ))}
          </select>
          {errors.product_id && <p className="text-xs text-rose-400">{errors.product_id.message}</p>}
        </div>

        {/* Real-time Stock Math Card */}
        {currentProduct && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Stock</span>
              <span className="text-lg font-bold text-slate-200">{currentStock} units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {movementType === 'adjustment' ? 'Target Count' : 'Delta Qty'}
              </span>
              <span
                className={`text-lg font-bold ${
                  movementType === 'in'
                    ? 'text-cyan-400'
                    : movementType === 'out'
                    ? 'text-rose-400'
                    : 'text-indigo-400'
                }`}
              >
                {movementType === 'in' ? `+${enteredQty}` : movementType === 'out' ? `-${enteredQty}` : enteredQty}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">New Quantity</span>
              <span
                className={`text-lg font-bold ${
                  projectedStock < 0
                    ? 'text-rose-500'
                    : projectedStock <= currentProduct.min_stock_level
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {projectedStock} units
              </span>
            </div>
          </div>
        )}

        {isRemovalOverLimit && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cannot remove {enteredQty} units. Maximum stock available to dispatch is {currentStock}.</span>
          </div>
        )}

        {/* Quantity Input */}
        <Input
          label={
            movementType === 'adjustment'
              ? 'New Absolute Quantity Count'
              : movementType === 'in'
              ? 'Quantity to Add (+)'
              : 'Quantity to Remove (-)'
          }
          type="number"
          placeholder="Enter quantity..."
          required
          min={movementType === 'adjustment' ? 0 : 1}
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        {/* Reason Presets & Custom Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Movement Reason <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {presetReasons[movementType].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue('reason', preset, { shouldValidate: true })}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
          <Input
            placeholder="Specify reason..."
            error={errors.reason?.message}
            {...register('reason')}
          />
        </div>

        {/* Reference / Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Reference / PO / Invoice / Notes (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-slate-700 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 custom-scrollbar"
            placeholder="e.g. Purchase Order #PO-9912 or Customer RMA ticket..."
            {...register('notes')}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={movementType === 'in' ? 'primary' : movementType === 'out' ? 'danger' : 'secondary'}
            isLoading={isSubmitting}
            disabled={isRemovalOverLimit}
          >
            {movementType === 'in'
              ? 'Confirm Stock Receipt'
              : movementType === 'out'
              ? 'Confirm Stock Removal'
              : 'Save Inventory Audit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
