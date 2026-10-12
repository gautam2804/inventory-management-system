import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { exportToCSV } from '../lib/csvExport';
import {
  BarChart3,
  Download,
  Search,
  IndianRupee,
  AlertTriangle,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

type ReportTab = 'valuation' | 'reorder' | 'category' | 'movements';

export const ReportsPage: React.FC = () => {
  const { products, categories, stockMovements, metrics, lowStockProducts, outOfStockProducts } = useInventory();

  const [activeTab, setActiveTab] = useState<ReportTab>('valuation');
  const [search, setSearch] = useState('');

  // 1. Valuation Report Data
  const valuationData = useMemo(() => {
    return products
      .filter((p) => search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      .map((p) => {
        const costValuation = p.purchase_price * p.quantity;
        const retailValuation = p.selling_price * p.quantity;
        const potentialProfit = retailValuation - costValuation;
        const marginPct = p.purchase_price > 0 ? ((p.selling_price - p.purchase_price) / p.purchase_price * 100).toFixed(1) : '0';
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand,
          quantity: p.quantity,
          purchase_price: p.purchase_price,
          selling_price: p.selling_price,
          costValuation,
          retailValuation,
          potentialProfit,
          marginPct,
        };
      })
      .sort((a, b) => b.costValuation - a.costValuation);
  }, [products, search]);

  // 2. Reorder Report Data (Low Stock + Out of Stock)
  const reorderData = useMemo(() => {
    return [...outOfStockProducts, ...lowStockProducts]
      .filter((p) => search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      .map((p) => {
        const unitsDeficit = Math.max(0, p.min_stock_level - p.quantity);
        const reorderCost = unitsDeficit * p.purchase_price;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || 'Hardware',
          quantity: p.quantity,
          min_stock_level: p.min_stock_level,
          unitsDeficit: unitsDeficit === 0 ? p.min_stock_level : unitsDeficit,
          purchase_price: p.purchase_price,
          estimatedReorderCost: (unitsDeficit === 0 ? p.min_stock_level : unitsDeficit) * p.purchase_price,
          isOut: p.quantity === 0,
        };
      });
  }, [lowStockProducts, outOfStockProducts, search]);

  // 3. Category Breakdown Data
  const categoryReportData = useMemo(() => {
    return categories.map((cat) => {
      const prods = products.filter((p) => p.category_id === cat.id);
      const totalUnits = prods.reduce((acc, p) => acc + p.quantity, 0);
      const totalCost = prods.reduce((acc, p) => acc + p.purchase_price * p.quantity, 0);
      const totalRetail = prods.reduce((acc, p) => acc + p.selling_price * p.quantity, 0);
      return {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        skuCount: prods.length,
        totalUnits,
        totalCost,
        totalRetail,
        potentialMargin: totalRetail - totalCost,
      };
    });
  }, [categories, products]);

  // 4. Movements Analysis Data
  const movementReportData = useMemo(() => {
    return stockMovements
      .filter((m) => search === '' || m.reason.toLowerCase().includes(search.toLowerCase()) || (m.product?.name && m.product.name.toLowerCase().includes(search.toLowerCase())))
      .map((m) => {
        const prod = products.find((p) => p.id === m.product_id) || m.product;
        return {
          id: m.id,
          date: formatDate(m.created_at),
          product: prod?.name || 'Component',
          sku: prod?.sku || 'N/A',
          type: m.movement_type,
          delta: m.quantity_changed,
          from: m.previous_quantity,
          to: m.updated_quantity,
          reason: m.reason,
          notes: m.notes || '-',
          operator: m.created_by || 'Admin',
        };
      });
  }, [stockMovements, products, search]);

  // Export handlers
  const handleExportValuation = () => {
    const rows = valuationData.map((d) => ({
      Product: d.name,
      SKU: d.sku,
      Brand: d.brand,
      'Units in Stock': d.quantity,
      'Unit Cost Price (INR)': d.purchase_price,
      'Unit Retail Price (INR)': d.selling_price,
      'Total Cost Valuation (INR)': d.costValuation.toFixed(2),
      'Potential Retail Valuation (INR)': d.retailValuation.toFixed(2),
      'Projected Profit (INR)': d.potentialProfit.toFixed(2),
      'Margin %': `${d.marginPct}%`,
    }));
    exportToCSV('Inventory_Valuation_Report', rows);
  };

  const handleExportReorder = () => {
    const rows = reorderData.map((d) => ({
      Product: d.name,
      SKU: d.sku,
      Category: d.category,
      'Current Stock': d.quantity,
      'Min Stock Level': d.min_stock_level,
      'Recommended Reorder Units': d.unitsDeficit,
      'Unit Cost (INR)': d.purchase_price,
      'Est. Replenishment Cost (INR)': d.estimatedReorderCost.toFixed(2),
      Status: d.isOut ? 'Out of Stock' : 'Low Stock',
    }));
    exportToCSV('Reorder_Replenishment_Report', rows);
  };

  const handleExportCategory = () => {
    const rows = categoryReportData.map((d) => ({
      Category: d.name,
      Code: d.code,
      'SKU Count': d.skuCount,
      'Physical Units': d.totalUnits,
      'Total Cost Basis (INR)': d.totalCost.toFixed(2),
      'Total Retail Value (INR)': d.totalRetail.toFixed(2),
      'Projected Margin (INR)': d.potentialMargin.toFixed(2),
    }));
    exportToCSV('Category_Inventory_Breakdown', rows);
  };

  const handleExportMovements = () => {
    const rows = movementReportData.map((d) => ({
      Date: d.date,
      Product: d.product,
      SKU: d.sku,
      'Movement Type': d.type,
      'Delta Qty': d.delta,
      'Previous Qty': d.from,
      'New Qty': d.to,
      Reason: d.reason,
      Notes: d.notes,
      Operator: d.operator,
    }));
    exportToCSV('Stock_Movements_Audit_Report', rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Intelligence & Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable audits for financial accounting, procurement reordering, and turnover analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'valuation' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              onClick={handleExportValuation}
            >
              Export Valuation CSV
            </Button>
          )}
          {activeTab === 'reorder' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              onClick={handleExportReorder}
            >
              Export Reorder List CSV
            </Button>
          )}
          {activeTab === 'category' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              onClick={handleExportCategory}
            >
              Export Category CSV
            </Button>
          )}
          {activeTab === 'movements' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              onClick={handleExportMovements}
            >
              Export Movement CSV
            </Button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'valuation'
              ? 'bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-500/20 dark:to-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          }`}
        >
          <IndianRupee className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Inventory Valuation</span>
        </button>

        <button
          onClick={() => setActiveTab('reorder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'reorder'
              ? 'bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-500/20 dark:to-rose-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Low-Stock & Reorder ({reorderData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('category')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'category'
              ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-500/20 dark:to-blue-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Category Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Movements & Turnovers</span>
        </button>
      </div>

      {/* Search Bar for tabular views */}
      <div className="max-w-md">
        <Input
          placeholder="Search within this report..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 1. Valuation Report Content */}
      {activeTab === 'valuation' && (
        <div className="space-y-4">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Total Cost Valuation</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(metrics.totalInventoryValuation)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Potential Retail Value</span>
              <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{formatCurrency(metrics.potentialRevenue)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Gross Margin Potential</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(metrics.potentialRevenue - metrics.totalInventoryValuation)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">Product & SKU</th>
                    <th className="py-3.5 px-4 text-center">In Stock</th>
                    <th className="py-3.5 px-4 text-right">Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Unit Retail</th>
                    <th className="py-3.5 px-4 text-right">Margin %</th>
                    <th className="py-3.5 px-4 text-right">Total Cost Basis</th>
                    <th className="py-3.5 px-4 text-right">Total Retail Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {valuationData.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{d.name}</div>
                        <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">{d.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{d.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(d.purchase_price)}</td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-600 dark:text-cyan-400">{formatCurrency(d.selling_price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{d.marginPct}%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(d.costValuation)}</td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(d.retailValuation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Reorder Report Content */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Replenishment Inventory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total items below safety stock: {reorderData.length}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Estimated Restock Budget</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(reorderData.reduce((acc, d) => acc + d.estimatedReorderCost, 0))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Available Units</th>
                    <th className="py-3.5 px-4 text-center">Min Threshold</th>
                    <th className="py-3.5 px-4 text-center">Recommended Order</th>
                    <th className="py-3.5 px-4 text-right">Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Estimated Order Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {reorderData.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{d.name}</div>
                        <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">SKU: {d.sku} &bull; {d.category}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={d.isOut ? 'out_of_stock' : 'low_stock'} size="sm">
                          {d.isOut ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{d.quantity}</td>
                      <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">{d.min_stock_level}</td>
                      <td className="py-3 px-4 text-center font-bold text-cyan-600 dark:text-cyan-400">+{d.unitsDeficit} units</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(d.purchase_price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(d.estimatedReorderCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Category Breakdown Content */}
      {activeTab === 'category' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4 text-center">Prefix Code</th>
                  <th className="py-3.5 px-4 text-center">Catalog SKUs</th>
                  <th className="py-3.5 px-4 text-center">Stocked Units</th>
                  <th className="py-3.5 px-4 text-right">Total Cost Basis</th>
                  <th className="py-3.5 px-4 text-right">Potential Retail Value</th>
                  <th className="py-3.5 px-4 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {categoryReportData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{d.name}</td>
                    <td className="py-3 px-4 text-center font-mono text-cyan-600 dark:text-cyan-400">{d.code}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{d.skuCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{d.totalUnits}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">{formatCurrency(d.totalCost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(d.totalRetail)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(d.potentialMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Movements Analysis Content */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Component & SKU</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-right">Quantity Changed</th>
                  <th className="py-3.5 px-4 text-center">Transition</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {movementReportData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{d.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {d.product}
                      <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">{d.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={d.type} size="sm">
                        {d.type === 'in' ? 'Stock In' : d.type === 'out' ? 'Stock Out' : 'Audit'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {d.from} &rarr; {d.to}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-300">{d.reason}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-500">{d.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
