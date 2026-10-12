import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Product } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { generateSKU, generateBarcode } from '../../lib/utils';
import { Sparkles, ScanBarcode } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU is required and must be unique'),
  barcode: z.string().optional(),
  category_id: z.string().min(1, 'Please select a hardware category'),
  brand: z.string().min(1, 'Brand is required (e.g. AMD, Intel, NVIDIA, ASUS)'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
  purchase_price: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  selling_price: z.coerce.number().min(0, 'Selling price cannot be negative'),
  quantity: z.coerce.number().int().min(0, 'Initial quantity cannot be negative'),
  min_stock_level: z.coerce.number().int().min(0, 'Minimum stock level cannot be negative'),
  supplier_id: z.string().optional().nullable(),
  image_url: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // If editing
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { categories, suppliers, addProduct, updateProduct } = useInventory();
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand: '',
      model: '',
      description: '',
      purchase_price: 0,
      selling_price: 0,
      quantity: 1,
      min_stock_level: 5,
      supplier_id: '',
      image_url: '',
    },
  });

  const selectedCategory = watch('category_id');
  const selectedBrand = watch('brand');

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        category_id: product.category_id,
        brand: product.brand,
        model: product.model,
        description: product.description || '',
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        min_stock_level: product.min_stock_level,
        supplier_id: product.supplier_id || '',
        image_url: product.image_url || '',
      });
    } else {
      reset({
        name: '',
        sku: generateSKU('GEN', 'HW'),
        barcode: generateBarcode(),
        category_id: categories[0]?.id || '',
        brand: '',
        model: '',
        description: '',
        purchase_price: 0,
        selling_price: 0,
        quantity: 10,
        min_stock_level: 5,
        supplier_id: suppliers[0]?.id || '',
        image_url: '',
      });
    }
  }, [product, isOpen, reset, categories, suppliers]);

  const handleAutoGenerateSKU = () => {
    const cat = categories.find((c) => c.id === selectedCategory);
    const newSku = generateSKU(cat?.code || 'HW', selectedBrand || 'PRD');
    setValue('sku', newSku, { shouldValidate: true });
  };

  const handleGenerateBarcode = () => {
    setValue('barcode', generateBarcode(), { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload = {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode || undefined,
      category_id: data.category_id,
      brand: data.brand,
      model: data.model,
      description: data.description || '',
      purchase_price: Number(data.purchase_price),
      selling_price: Number(data.selling_price),
      quantity: Number(data.quantity),
      min_stock_level: Number(data.min_stock_level),
      supplier_id: data.supplier_id ? data.supplier_id : null,
      image_url: data.image_url || undefined,
    };

    if (isEditing && product) {
      const res = await updateProduct(product.id, payload);
      if (res.success) onClose();
    } else {
      const res = await addProduct(payload);
      if (res.success) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Hardware Product' : 'Add New Hardware Product'}
      subtitle={isEditing ? `Modifying SKU: ${product?.sku}` : 'Enter hardware specifications, pricing and initial stock'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. NVIDIA GeForce RTX 4090 24GB"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              className="w-full bg-slate-900/90 text-slate-100 text-sm rounded-xl border border-slate-700/80 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              {...register('category_id')}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-rose-400">{errors.category_id.message}</p>}
          </div>

          <Input
            label="Brand / Manufacturer"
            placeholder="e.g. AMD, Intel, Corsair, ASUS, Samsung"
            required
            error={errors.brand?.message}
            {...register('brand')}
          />

          <Input
            label="Model / Part Number"
            placeholder="e.g. 100-100000910WOF or MZ-V9P2T0B"
            required
            error={errors.model?.message}
            {...register('model')}
          />
        </div>

        {/* SKU & Barcode Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Unique SKU <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateSKU}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>
            <Input
              placeholder="e.g. GPU-NV-4090"
              error={errors.sku?.message}
              {...register('sku')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Barcode / UPC Code
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <ScanBarcode className="w-3 h-3" /> Gen Barcode
              </button>
            </div>
            <Input
              placeholder="e.g. 890123456789"
              error={errors.barcode?.message}
              {...register('barcode')}
            />
          </div>
        </div>

        {/* Financial & Stock Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input
            label="Purchase Cost (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            error={errors.purchase_price?.message}
            {...register('purchase_price')}
          />

          <Input
            label="Selling Price (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            error={errors.selling_price?.message}
            {...register('selling_price')}
          />

          <Input
            label="Current Quantity"
            type="number"
            placeholder="0"
            required
            disabled={isEditing}
            helperText={isEditing ? 'Use Stock Adjustment tab' : undefined}
            error={errors.quantity?.message}
            {...register('quantity')}
          />

          <Input
            label="Min Stock Alert Threshold"
            type="number"
            placeholder="5"
            required
            error={errors.min_stock_level?.message}
            {...register('min_stock_level')}
          />
        </div>

        {/* Supplier & Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Associated Supplier</label>
            <select
              className="w-full bg-slate-900/90 text-slate-100 text-sm rounded-xl border border-slate-700/80 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              {...register('supplier_id')}
            >
              <option value="">No Supplier Assigned</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contact_person})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Product Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            error={errors.image_url?.message}
            {...register('image_url')}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Technical Specifications & Notes</label>
          <textarea
            rows={3}
            className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-slate-700/80 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 custom-scrollbar"
            placeholder="Detailed specs (clock speed, VRAM, wattage, warranty, socket compatibility)..."
            {...register('description')}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
