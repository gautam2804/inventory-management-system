import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  ArrowLeftRight,
  History,
  Truck,
  BarChart3,
  Settings,
  Database,
  X,
  Server,
  Zap
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export type NavItemKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'stock-adjustment'
  | 'stock-history'
  | 'suppliers'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { isSupabaseConnected, metrics } = useInventory();

  const navItems: { key: NavItemKey; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: 'products', label: 'Products', icon: <Cpu className="w-5 h-5" />, badge: metrics.totalProducts },
    { key: 'categories', label: 'Categories', icon: <Layers className="w-5 h-5" />, badge: metrics.totalCategories },
    { key: 'stock-adjustment', label: 'Stock Management', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { key: 'stock-history', label: 'Movement History', icon: <History className="w-5 h-5" /> },
    { key: 'suppliers', label: 'Suppliers', icon: <Truck className="w-5 h-5" />, badge: metrics.totalSuppliers },
    { key: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    // { key: 'settings', label: 'Settings & Supabase', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-slate-900/95 border-r border-slate-800/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>AT TECH</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">DIGITAL</span>
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Inventory Management</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Backend Connection Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white">Database</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isSupabaseConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isSupabaseConnected ? 'Supabase Live' : 'Local Storage'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isSupabaseConnected
                ? 'Connected to PostgreSQL with Row Level Security.'
                : 'Offline persistence active. Connect Supabase in Settings.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
