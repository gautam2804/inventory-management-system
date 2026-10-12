import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Supplier, Product } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../lib/utils';
import { Phone, Mail, MapPin, Edit, Trash2, Cpu, AlertTriangle } from 'lucide-react';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onSelectProduct: (product: Product) => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onEdit,
  onDelete,
  onSelectProduct,
}) => {
  const { products } = useInventory();
  if (!supplier) return null;

  const suppliedProducts = products.filter((p) => p.supplier_id === supplier.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier.name}
      subtitle={`Contact: ${supplier.contact_person}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onDelete(supplier);
            }}
          >
            Delete Supplier
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onEdit(supplier);
            }}
          >
            Edit Supplier
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Contact Info Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{supplier.phone}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <a href={`mailto:${supplier.email}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                {supplier.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 pt-1">
            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>{supplier.address}</span>
          </div>

          {supplier.notes && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-300 block mb-0.5">Notes & Terms:</span>
              {supplier.notes}
            </div>
          )}
        </div>

        {/* Associated Products Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Supplied Products ({suppliedProducts.length})</h4>
            </div>
            {suppliedProducts.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total Units:{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {suppliedProducts.reduce((acc, p) => acc + p.quantity, 0)}
                </span>
              </span>
            )}
          </div>

          {suppliedProducts.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              No products are currently linked to this supplier.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {suppliedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-sm dark:shadow-none"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      SKU: {prod.sku} &bull; Cost: {formatCurrency(prod.purchase_price)}
                    </div>
                  </div>

                  <Badge
                    variant={
                      prod.quantity === 0
                        ? 'out_of_stock'
                        : prod.quantity <= prod.min_stock_level
                        ? 'low_stock'
                        : 'in_stock'
                    }
                  >
                    {prod.quantity} units
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {suppliedProducts.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                To delete this supplier, you must first reassign or remove its {suppliedProducts.length} associated product(s).
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
