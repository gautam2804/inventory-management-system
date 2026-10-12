import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Product } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Edit,
  ArrowLeftRight,
  Trash2,
  Copy,
  Layers,
  Truck,
  IndianRupee,
  PackageCheck,
  Cpu,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onAdjustStock,
  onDelete,
}) => {
  const { info } = useNotification();
  if (!product) return null;

  const margin = product.selling_price - product.purchase_price;
  const marginPercent =
    product.purchase_price > 0 ? ((margin / product.purchase_price) * 100).toFixed(1) : '0';
  const totalValuation = product.purchase_price * product.quantity;
  const totalPotentialRevenue = product.selling_price * product.quantity;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    info('Copied!', `${label} "${text}" copied to clipboard.`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`${product.brand} • ${product.model}`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onDelete(product);
            }}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
              onClick={() => {
                onClose();
                onAdjustStock(product);
              }}
            >
              Adjust Stock
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              Edit Details
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Image or Hardware Icon */}
          <div className="w-full sm:w-44 h-44 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm dark:shadow-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=80';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Cpu className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                <span className="text-xs font-mono">No Image Available</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge
                variant={
                  product.quantity === 0
                    ? 'out_of_stock'
                    : product.quantity <= product.min_stock_level
                    ? 'low_stock'
                    : 'in_stock'
                }
              >
                {product.quantity === 0
                  ? 'Out of Stock'
                  : product.quantity <= product.min_stock_level
                  ? 'Low Stock'
                  : 'In Stock'}
              </Badge>
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => copyToClipboard(product.sku, 'SKU')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 text-xs font-mono font-semibold hover:bg-cyan-200 dark:hover:bg-cyan-900/60 transition-colors cursor-pointer"
                title="Click to copy SKU"
              >
                <span>SKU: {product.sku}</span>
                <Copy className="w-3 h-3" />
              </button>

              {product.barcode && (
                <button
                  onClick={() => copyToClipboard(product.barcode!, 'Barcode')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-mono hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Click to copy Barcode"
                >
                  <span>UPC: {product.barcode}</span>
                  <Copy className="w-3 h-3" />
                </button>
              )}

              <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
                <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                {product.category?.name || 'Hardware'}
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {product.description || 'No extended specifications entered for this hardware product.'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Manufacturer / Brand:</span>
                <span className="font-semibold text-slate-900 dark:text-white ml-1.5">{product.brand}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Model / Part #:</span>
                <span className="font-semibold text-slate-900 dark:text-white ml-1.5 font-mono">{product.model}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Min Stock Warning:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 ml-1.5">{product.min_stock_level} units</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Record Created:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1.5">{formatDate(product.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financials & Stock Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Available Stock</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>{product.quantity}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">units</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Purchase Cost</span>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(product.purchase_price)}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Selling Price</span>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(product.selling_price)}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gross Margin</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(margin)}{' '}
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-500">({marginPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Inventory Valuation Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Capital Tied (Cost x Qty)</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatCurrency(totalValuation)}</div>
            </div>
            <IndianRupee className="w-7 h-7 text-indigo-500/50 dark:text-indigo-400/50" />
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Potential Gross Revenue (Price x Qty)</div>
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">{formatCurrency(totalPotentialRevenue)}</div>
            </div>
            <PackageCheck className="w-7 h-7 text-cyan-500/50 dark:text-cyan-400/50" />
          </div>
        </div>

        {/* Associated Supplier Card */}
        {product.supplier && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Distributor / Supplier</span>
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{product.supplier.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div>
                <span className="text-slate-600 dark:text-slate-500 font-medium">Contact:</span> {product.supplier.contact_person}
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-500 font-medium">Phone:</span> {product.supplier.phone || '-'}
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-500 font-medium">Email:</span> {product.supplier.email || '-'}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
