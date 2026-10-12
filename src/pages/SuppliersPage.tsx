import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Supplier, Product } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SupplierFormModal } from '../components/suppliers/SupplierFormModal';
import { SupplierDetailModal } from '../components/suppliers/SupplierDetailModal';
import { exportToCSV } from '../lib/csvExport';
import {
  Truck,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Cpu,
} from 'lucide-react';

interface SuppliersPageProps {
  onSelectProduct: (product: Product) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ onSelectProduct }) => {
  const { suppliers, products, deleteSupplier } = useInventory();
  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    await deleteSupplier(supplierToDelete.id);
    setIsDeleting(false);
    setSupplierToDelete(null);
  };

  const handleExportCSV = () => {
    const rows = filteredSuppliers.map((s) => ({
      'Supplier Name': s.name,
      'Contact Person': s.contact_person,
      'Phone': s.phone,
      'Email': s.email,
      'Business Address': s.address,
      'Associated Products Count': products.filter((p) => p.supplier_id === s.id).length,
      'Notes': s.notes || '',
    }));
    exportToCSV('Suppliers_Directory', rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Suppliers & Hardware Distributors</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage relationships with chip distributors, component manufacturers, and peripherals vendors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
            onClick={handleExportCSV}
          >
            Export Directory CSV
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSupplierToEdit(null);
              setFormModalOpen(true);
            }}
          >
            Register Supplier
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Search suppliers by company, contact, or email..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => {
          const suppliedList = products.filter((p) => p.supplier_id === supplier.id);
          const totalSuppliedUnits = suppliedList.reduce((acc, p) => acc + p.quantity, 0);

          return (
            <div
              key={supplier.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-500/20 dark:to-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setDetailModalOpen(true);
                        }}
                        className="font-bold text-slate-900 dark:text-white text-base group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors cursor-pointer line-clamp-1"
                      >
                        {supplier.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attn: {supplier.contact_person}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSupplierToEdit(supplier);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(supplier)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{supplier.address}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Associated Products */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setDetailModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{suppliedList.length} Hardware Products</span>
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {totalSuppliedUnits} stocked
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        supplier={supplierToEdit}
      />

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        supplier={selectedSupplier}
        onEdit={(s) => {
          setSupplierToEdit(s);
          setFormModalOpen(true);
        }}
        onDelete={(s) => setSupplierToDelete(s)}
        onSelectProduct={onSelectProduct}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Supplier?"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? You will only be allowed to delete this supplier if it has 0 associated products.`}
        confirmText="Delete Supplier"
        isLoading={isDeleting}
      />
    </div>
  );
};
