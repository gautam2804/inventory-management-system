import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Category } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { Layers, Plus, Search, Edit, Trash2, Cpu, AlertTriangle } from 'lucide-react';

interface CategoriesPageProps {
  onNavigateToProductsWithCategory: (categoryId: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onNavigateToProductsWithCategory,
}) => {
  const { categories, products, deleteCategory } = useInventory();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    await deleteCategory(categoryToDelete.id);
    setIsDeleting(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Hardware Classification</h2>
          <p className="text-xs text-slate-400">
            Define categories, SKU prefixes, and component groupings
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setCategoryToEdit(null);
            setModalOpen(true);
          }}
        >
          Create Category
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Filter categories or code..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Categories Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => {
          const associatedCount = products.filter((p) => p.category_id === category.id).length;
          const totalUnits = products
            .filter((p) => p.category_id === category.id)
            .reduce((acc, p) => acc + p.quantity, 0);

          return (
            <div
              key={category.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs font-mono">
                      {category.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                        {category.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">Prefix: {category.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCategoryToEdit(category);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(category)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                  {category.description || 'No specific description provided for this classification.'}
                </p>
              </div>

              {/* Category Footer Stats */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToProductsWithCategory(category.id)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{associatedCount} Products</span>
                </button>

                <span className="text-xs text-slate-400 font-mono">
                  {totalUnits} stocked units
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={categoryToEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? You will only be permitted to delete categories with 0 associated products.`}
        confirmText="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
};
