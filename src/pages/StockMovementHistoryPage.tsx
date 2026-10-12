import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockMovementType, Product } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { formatDate } from '../lib/utils';
import { exportToCSV } from '../lib/csvExport';
import {
  Download,
  Search,
  History,
} from 'lucide-react';

interface StockMovementHistoryPageProps {
  onSelectProduct?: (product: Product) => void;
}

export const StockMovementHistoryPage: React.FC<StockMovementHistoryPageProps> = ({
  onSelectProduct,
}) => {
  const { stockMovements, products } = useInventory();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<StockMovementType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter movements
  const filteredMovements = stockMovements.filter((mov) => {
    const prod = products.find((p) => p.id === mov.product_id) || mov.product;
    const matchesType = selectedType === 'all' || mov.movement_type === selectedType;

    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (prod && prod.name.toLowerCase().includes(term)) ||
      (prod && prod.sku.toLowerCase().includes(term)) ||
      mov.reason.toLowerCase().includes(term) ||
      (mov.notes && mov.notes.toLowerCase().includes(term));

    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMovements.length / pageSize) || 1;
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = () => {
    const rows = filteredMovements.map((m) => {
      const prod = products.find((p) => p.id === m.product_id) || m.product;
      return {
        'Timestamp': formatDate(m.created_at),
        'Product Name': prod?.name || 'N/A',
        'SKU': prod?.sku || 'N/A',
        'Movement Type': m.movement_type.toUpperCase(),
        'Quantity Delta': m.quantity_changed,
        'Previous Balance': m.previous_quantity,
        'Updated Balance': m.updated_quantity,
        'Reason': m.reason,
        'Notes': m.notes || '',
        'Operator': m.created_by || 'Admin',
      };
    });
    exportToCSV('Stock_Movement_Audit_History', rows);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stock Movement Audit History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable transaction log of every component arrival, dispatch, and physical count audit
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          onClick={handleExportCSV}
        >
          Export Audit Log CSV ({filteredMovements.length})
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm dark:shadow-lg transition-colors duration-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search movement, SKU, or reason..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedType('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'all'
                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Movements ({stockMovements.length})
          </button>

          <button
            onClick={() => {
              setSelectedType('in');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'in'
                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            Stock In (+)
          </button>

          <button
            onClick={() => {
              setSelectedType('out');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'out'
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            Stock Out (-)
          </button>

          <button
            onClick={() => {
              setSelectedType('adjustment');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'adjustment'
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            Audits
          </button>
        </div>
      </div>

      {/* Movement Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Product & SKU</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-right">Delta Qty</th>
                <th className="py-3.5 px-4 text-center">Stock Transition</th>
                <th className="py-3.5 px-4">Reason & Notes</th>
                <th className="py-3.5 px-4 text-right">Operator</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No stock movements found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((mov) => {
                  const prod = products.find((p) => p.id === mov.product_id) || mov.product;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {formatDate(mov.created_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className="font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
                          onClick={() => prod && onSelectProduct && onSelectProduct(prod)}
                        >
                          {prod?.name || 'Hardware Component'}
                        </div>
                        <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                          SKU: {prod?.sku || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={mov.movement_type} size="sm">
                          {mov.movement_type === 'in'
                            ? 'Stock In'
                            : mov.movement_type === 'out'
                            ? 'Stock Out'
                            : 'Audit Count'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            mov.quantity_changed > 0
                              ? 'text-cyan-600 dark:text-cyan-400'
                              : mov.quantity_changed < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }
                        >
                          {mov.quantity_changed > 0 ? `+${mov.quantity_changed}` : mov.quantity_changed}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-slate-500 dark:text-slate-400">{mov.previous_quantity}</span>
                        <span className="text-slate-400 dark:text-slate-600 mx-1.5">&rarr;</span>
                        <span className="text-slate-900 dark:text-white font-bold">{mov.updated_quantity}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{mov.reason}</div>
                        {mov.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{mov.notes}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-500 dark:text-slate-400">
                        {mov.created_by || 'Admin'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMovements.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
