import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800/90 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <BrandLogo size="md" variant="full" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-500/20 dark:to-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30 shadow-sm dark:shadow-md font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-cyan-500/20 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
