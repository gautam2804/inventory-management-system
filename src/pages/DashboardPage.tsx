import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { Product } from '../types';
import {
  Cpu,
  Layers,
  AlertTriangle,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Truck,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  ScanBarcode,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  onOpenAddProduct: () => void;
  onOpenStockAdjust: (product?: Product) => void;
  onOpenScanner: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToTab: (tab: any) => void;
}

const CHART_COLORS = ['#06b6d4', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddProduct,
  onOpenStockAdjust,
  onOpenScanner,
  onSelectProduct,
  onNavigateToTab,
}) => {
  const { metrics, products, categories, stockMovements, lowStockProducts, outOfStockProducts } = useInventory();

  // Prepare Category Distribution Chart Data
  const categoryChartData = categories
    .map((cat) => {
      const prods = products.filter((p) => p.category_id === cat.id);
      const units = prods.reduce((acc, p) => acc + p.quantity, 0);
      const valuation = prods.reduce((acc, p) => acc + p.purchase_price * p.quantity, 0);
      return {
        name: cat.code || cat.name,
        fullName: cat.name,
        units,
        valuation,
        count: prods.length,
      };
    })
    .filter((d) => d.count > 0)
    .sort((a, b) => b.units - a.units);

  // Prepare Stock Status Pie Data
  const inStockCount = products.filter((p) => p.quantity > p.min_stock_level).length;
  const statusPieData = [
    { name: 'Optimal Stock', value: inStockCount, color: '#10b981' },
    { name: 'Low Stock Alert', value: metrics.lowStockCount, color: '#f59e0b' },
    { name: 'Out of Stock', value: metrics.outOfStockCount, color: '#f43f5e' },
  ].filter((d) => d.value > 0);

  const potentialProfit = metrics.potentialRevenue - metrics.totalInventoryValuation;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/70 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-800 dark:text-cyan-400 text-xs font-semibold mb-2">
              <img
                src="/at-tech-logo-cyan-transparent.png"
                alt="Logo"
                className="w-3.5 h-3.5 object-contain"
              />
              <span>At Tech Digital &bull; Hardware Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Inventory Management Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Track real-time stock levels, inventory valuations, vendor supplies, and reorder alerts across all computer hardware categories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<ScanBarcode className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
              onClick={onOpenScanner}
            >
              Scan Barcode
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
              onClick={() => onOpenStockAdjust()}
            >
              Adjust Stock
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={onOpenAddProduct}
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Ambient subtle glow background */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={metrics.totalProducts}
          subValue={`${metrics.totalCategories} active categories`}
          icon={<Cpu className="w-6 h-6" />}
          color="cyan"
          onClick={() => onNavigateToTab('products')}
        />

        <StatCard
          title="Total Stock Units"
          value={metrics.totalStockUnits.toLocaleString()}
          subValue="Available physical components"
          icon={<Layers className="w-6 h-6" />}
          color="indigo"
          onClick={() => onNavigateToTab('products')}
        />

        <StatCard
          title="Low Stock Alert"
          value={metrics.lowStockCount}
          subValue="Units at or below threshold"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="amber"
          trend={{
            label: metrics.lowStockCount > 0 ? 'Action Needed' : 'Healthy',
            warning: metrics.lowStockCount > 0,
            positive: metrics.lowStockCount === 0,
          }}
          onClick={() => onNavigateToTab('products')}
        />

        <StatCard
          title="Out of Stock"
          value={metrics.outOfStockCount}
          subValue="Zero inventory remaining"
          icon={<AlertCircle className="w-6 h-6" />}
          color="rose"
          trend={{
            label: metrics.outOfStockCount > 0 ? 'Critical' : 'None',
            warning: metrics.outOfStockCount > 0,
            positive: metrics.outOfStockCount === 0,
          }}
          onClick={() => onNavigateToTab('products')}
        />

        <StatCard
          title="Total Inventory Valuation"
          value={formatCurrency(metrics.totalInventoryValuation)}
          subValue="Calculated at purchase cost"
          icon={<IndianRupee className="w-6 h-6" />}
          color="emerald"
          onClick={() => onNavigateToTab('reports')}
        />

        <StatCard
          title="Potential Retail Value"
          value={formatCurrency(metrics.potentialRevenue)}
          subValue={`Projected gross profit: ${formatCurrency(potentialProfit)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
          onClick={() => onNavigateToTab('reports')}
        />

        <StatCard
          title="Active Suppliers"
          value={metrics.totalSuppliers}
          subValue="Component vendors & distributors"
          icon={<Truck className="w-6 h-6" />}
          color="cyan"
          onClick={() => onNavigateToTab('suppliers')}
        />

        <StatCard
          title="Stock Movements"
          value={stockMovements.length}
          subValue="Logged historical transactions"
          icon={<RefreshCw className="w-6 h-6" />}
          color="indigo"
          onClick={() => onNavigateToTab('stock-history')}
        />
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Stock Distribution (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Stock Distribution by Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total units stocked across hardware classifications</p>
            </div>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              View Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 shadow-xl text-xs text-slate-900 dark:text-white">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">{data.fullName}</p>
                          <p className="text-cyan-600 dark:text-cyan-400 font-semibold">{data.units} available units</p>
                          <p className="text-slate-500 dark:text-slate-400">{data.count} distinct products</p>
                          <p className="text-emerald-600 dark:text-emerald-400 mt-1">Valuation: {formatCurrency(data.valuation)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="units" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Ratio Donut Chart (1 Col) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Stock Health Ratio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory balance versus minimum thresholds</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-xl text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">{data.name}: </span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{data.value} items</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalProducts}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catalog SKUs</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low-Stock Action Board & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Priority Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Low & Out-of-Stock Alerts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Items requiring immediate procurement</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
              {lowStockProducts.length + outOfStockProducts.length} items
            </span>
          </div>

          {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60">
              No low stock alerts! All items have adequate stock reserves.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div
                      onClick={() => onSelectProduct(product)}
                      className="text-xs font-semibold text-slate-900 dark:text-white truncate hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
                    >
                      {product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>SKU: {product.sku}</span>
                      <span>&bull;</span>
                      <span className={product.quantity === 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                        {product.quantity} left
                      </span>
                      <span>(Min: {product.min_stock_level})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="success"
                      icon={<ArrowDownLeft className="w-3 h-3" />}
                      onClick={() => onOpenStockAdjust(product)}
                    >
                      Restock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movements Stream */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Stock Movements</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live transaction stream and quantity changes</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('stock-history')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stockMovements.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
              {stockMovements.slice(0, 6).map((mov) => {
                const prod = products.find((p) => p.id === mov.product_id) || mov.product;
                return (
                  <div
                    key={mov.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          mov.movement_type === 'in'
                            ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20'
                            : mov.movement_type === 'out'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                            : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                        }`}
                      >
                        {mov.movement_type === 'in' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : mov.movement_type === 'out' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{prod?.name || 'Hardware Component'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mov.reason} {mov.notes ? `(${mov.notes})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{formatDate(mov.created_at)}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-bold text-sm ${
                          mov.movement_type === 'in'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : mov.movement_type === 'out'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {mov.quantity_changed > 0 ? `+${mov.quantity_changed}` : mov.quantity_changed}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {mov.previous_quantity} &rarr; {mov.updated_quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
