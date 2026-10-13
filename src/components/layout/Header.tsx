import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ScanBarcode,
  Plus,
  ArrowLeftRight,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../common/Button';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../types';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onOpenSidebar: () => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onOpenQuickStock: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToStock: (product: Product) => void;
  onNavigateToTab: (tab: NavItemKey) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  onOpenScanner,
  onOpenAddProduct,
  onOpenQuickStock,
  onSelectProduct,
  onNavigateToStock,
  onNavigateToTab,
}) => {
  const { user, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles: Record<NavItemKey, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Dashboard', subtitle: 'Live inventory metrics, stock health & activity' },
    products: { title: 'Hardware Catalog', subtitle: 'Manage computer hardware products, SKUs & pricing' },
    categories: { title: 'Hardware Categories', subtitle: 'Organize components, peripherals & accessories' },
    'stock-adjustment': { title: 'Stock Management', subtitle: 'Inward receipts, outward dispatches & audits' },
    'stock-history': { title: 'Movement History', subtitle: 'Immutable audit logs of all inventory transitions' },
    suppliers: { title: 'Vendor & Supplier Directory', subtitle: 'Distributors, authorized vendors & procurement' },
    reports: { title: 'Reports & Analytics', subtitle: 'Valuation, low-stock reports and CSV exports' },
    settings: { title: 'System & Supabase Settings', subtitle: 'Database connection, schema setup & seed data' },
  };

  const activePage = pageTitles[currentTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden shrink-0">
          <img
            src="/at-tech-logo-teal.jpg"
            alt="At Tech Digital Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-sm border border-cyan-500/30"
          />
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {activePage.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{activePage.subtitle}</p>
        </div>
      </div>

      {/* Right: Actions, Scanner, Alerts, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Barcode Scanner Trigger */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
          title="Open Barcode Scanner (Press Ctrl+K)"
        >
          <ScanBarcode className="w-4 h-4" />
          <span className="text-xs font-medium hidden md:inline">Scan Barcode / SKU</span>
          <kbd className="hidden lg:inline text-[10px] bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-500 dark:text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick Stock Adjustment */}
        <button
          onClick={onOpenQuickStock}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-medium"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Adjust Stock</span>
        </button>

        {/* Quick Add Product */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenAddProduct}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-cyan-500/10"
        >
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Button>

        {/* Low-Stock Notifications Bell */}
        <NotificationsDropdown
          onSelectProduct={onSelectProduct}
          onNavigateToStock={onNavigateToStock}
        />

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm relative group"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        {/* Admin Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {user?.full_name ? user.full_name.charAt(0) : 'A'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.full_name || 'Admin'}
              </div>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Hardware Admin</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-3">
                <img
                  src="/at-tech-logo-teal.jpg"
                  alt="At Tech Digital"
                  className="w-10 h-10 rounded-xl object-cover border border-cyan-500/30 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.full_name || 'Admin User'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@attechdigital.com'}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Hardware Admin</span>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>Theme: {isDark ? 'Dark' : 'Light'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Switch</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
