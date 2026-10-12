import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { updateSupabaseConfig } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useNotification } from '../context/NotificationContext';
import {
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RefreshCw,
  Terminal,
  Server,
  UploadCloud,
  Check,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const { isSupabaseConnected, refreshData, resetToDemoSeed, seedSupabaseData, clearAllData } = useInventory();
  const { isDemoMode } = useAuth();
  const { success, error, info } = useNotification();

  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('hw_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('hw_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = updateSupabaseConfig(supabaseUrl, supabaseKey);
    if (res.success) {
      success('Supabase Config Updated', res.message);
      await refreshData();
    } else {
      error('Configuration Error', res.message);
    }

    setIsSaving(false);
  };

  const handleClearConfig = async () => {
    updateSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    info('Supabase Config Cleared', 'Switched back to local storage cache.');
    await refreshData();
  };

  const handleSeedSupabase = async () => {
    setIsSeeding(true);
    const res = await seedSupabaseData();
    setIsSeeding(false);

    if (res.success) {
      success('Database Seeded', res.message);
    } else {
      error('Seeding Error', res.message);
    }
  };

  const schemaSqlSnippet = `-- Run this in your Supabase SQL Editor:
-- 0. ADMIN PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'System Administrator',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    brand TEXT NOT NULL,
    model TEXT,
    description TEXT,
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity_changed INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    updated_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and grant access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_all" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "products_all" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "movements_all" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);`;


  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(schemaSqlSnippet);
    setCopiedSchema(true);
    success('Schema Copied', 'SQL schema copied to clipboard. Ready to paste in Supabase.');
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-white">System & Supabase Database Settings</h2>
        <p className="text-xs text-slate-400">
          Configure real-time PostgreSQL storage, Row Level Security, and component seed catalogs
        </p>
      </div>

      {/* Supabase Connection Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isSupabaseConnected
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-400'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border ${
              isSupabaseConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              <span>{isSupabaseConnected ? 'Live Supabase PostgreSQL Connected' : 'Local Storage Mode'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isSupabaseConnected
                ? 'All hardware catalog products, transactions, and suppliers persist directly to your cloud PostgreSQL database.'
                : 'Operating in local browser persistence mode. Enter your Supabase credentials below to connect your real database.'}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={refreshData}
        >
          Test & Sync
        </Button>
      </div>

      {/* Supabase Credentials Form */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Supabase API Configuration</h3>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <Input
            label="Supabase Project URL"
            placeholder="https://xyzcompany.supabase.co"
            leftIcon={<Globe className="w-4 h-4" />}
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            helperText="Located in your Supabase Project Settings -> API -> Project URL"
          />

          <Input
            label="Supabase Anon / Public Key"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            leftIcon={<Key className="w-4 h-4" />}
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            helperText="Located in Project Settings -> API -> Project API Keys (anon / public). Never expose service-role key."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearConfig}
              disabled={!supabaseUrl && !supabaseKey}
            >
              Clear & Use Local Storage
            </Button>

            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Supabase Connection
            </Button>
          </div>
        </form>
      </div>

      {/* Supabase Schema Setup Guide & 1-Click Seeder */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">PostgreSQL Schema & Seed Tools</h3>
              <p className="text-xs text-slate-400">Run the DDL schema in Supabase SQL editor or seed demo hardware data</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={copiedSchema ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            onClick={copySchemaToClipboard}
          >
            {copiedSchema ? 'Copied!' : 'Copy SQL Schema'}
          </Button>
        </div>

        {/* Code Snippet Preview */}
        <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-cyan-300 max-h-48 overflow-y-auto custom-scrollbar">
          <pre>{schemaSqlSnippet}</pre>
        </div>

        {/* 1-Click Seed to Supabase Button */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-white text-xs">Populate Supabase Database with Demo Hardware</div>
            <p className="text-[11px] text-slate-400">
              Inserts 13 hardware categories, 4 suppliers, and 15 components (CPUs, GPUs, RAM, SSDs) into your Supabase database.
            </p>
          </div>

          <Button
            variant="success"
            size="sm"
            icon={<UploadCloud className="w-4 h-4" />}
            isLoading={isSeeding}
            disabled={!isSupabaseConnected}
            onClick={handleSeedSupabase}
          >
            Seed Supabase Data
          </Button>
        </div>
      </div>

      {/* Danger Zone: Purge All Data */}
      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete All Inventory Data</span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Completely purge all hardware products, stock movement logs, suppliers, and categories from Supabase and local cache.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowClearConfirm(true)}
        >
          Purge All Data
        </Button>
      </div>

      {/* Local Storage Demo Reset */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">Reset Local Demo Hardware Data</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Re-populates local browser storage with default sample hardware items, categories, and distributors.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={resetToDemoSeed}>
          Reload Local Demo
        </Button>
      </div>

      {/* Purge Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={async () => {
          setIsClearing(true);
          await clearAllData();
          setIsClearing(false);
          setShowClearConfirm(false);
        }}
        title="Delete All Inventory Records?"
        message="Are you sure you want to delete all hardware products, stock movements, suppliers, and categories from both Supabase and local cache? This action cannot be reversed."
        confirmText="Yes, Purge Everything"
        isLoading={isClearing}
      />
    </div>
  );
};

