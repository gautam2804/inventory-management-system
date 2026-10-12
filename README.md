# At Tech Digital — Computer Hardware Inventory Management System

A high-performance, professional Computer Hardware Inventory Management System built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL & Authentication**. Designed specifically for computer hardware distributors, retail system builders, and IT parts administrators.

---

## Key Highlights

- **Executive Telemetry & Dashboard**: Live analytics with Recharts displaying total catalog units, inventory valuation at cost basis, retail potential, gross margins, category-wise hardware distribution, and instant low-stock alerts.
- **Hardware Catalog Management**: Full CRUD operations for desktop processors, motherboards, DDR4/DDR5 RAM, NVMe/SATA SSDs, enterprise HDDs, GPUs, modular PSUs, cases, monitors, peripherals, and networking gear.
- **Automatic SKU & Barcode Engine**:
  - Auto-generates unique SKUs based on hardware classification (e.g., `GPU-NV-8832`, `CPU-AMD-4910`).
  - Native support for physical USB barcode scanners emitting standard keyboard keystrokes + `Enter`.
  - Global lookup hotkey (`Ctrl + K`).
- **Atomic Stock Management & Movement History**:
  - Inward receipts (`in` / restock), outward dispatches (`out` / customer sales / RMA), and physical cycle count audits (`adjustment`).
  - Strict prevention of negative inventory levels.
  - Immutable audit trail recording previous quantity, updated quantity, delta, timestamp, reason, and notes.
- **Supplier & Distributor Directory**:
  - Track authorized vendors, account managers, emails, addresses, and terms.
  - Foreign key safety: prevents accidental deletion of suppliers with active hardware dependencies.
- **Auditing & CSV Export**:
  - Comprehensive valuation, low-stock reorder, category breakdown, and transaction log reports with 1-click CSV export.
- **Dual Supabase & Offline Cache Architecture**:
  - Works out of the box with zero setup in Local Storage mode preloaded with authentic computer hardware parts (RTX 4080 Super, Ryzen 7 7800X3D, Core i9-14900K, 990 Pro SSD).
  - Seamlessly connects to live Supabase PostgreSQL via `.env` or in-app Settings UI.
  - Includes a 1-click **Seed Supabase Tables** feature to populate a fresh database in seconds!

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19 + TypeScript** | Type-safe, component-driven UI architecture |
| **Vite** | Blazing-fast development and optimized production builds |
| **Tailwind CSS v4** | Hardware-themed modern glassmorphism styling |
| **Supabase** | Cloud PostgreSQL database, Row Level Security (RLS), and Auth |
| **Framer Motion** | Polished micro-interactions and modal transitions |
| **Lucide React** | Clean hardware and administrative icons |
| **Recharts** | Interactive stock distribution and health charts |
| **React Hook Form + Zod** | Robust form validation schemas with instant feedback |

---

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Development Server
Start the local Vite development server:
```bash
npm run dev
```

### 3. Production Build
Compile optimized production bundles:
```bash
npm run build
```

---

## Supabase Database Setup

1. Create a free project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/schema.sql` (also available via the **Copy SQL Schema** button in the app's Settings page).
4. Run the query. It automatically creates:
   - `categories` table with unique code constraints
   - `suppliers` table with contact specifications
   - `products` table with checks preventing negative quantity or prices
   - `stock_movements` table for immutable audit logs
   - `process_stock_movement` atomic PostgreSQL function (RPC)
   - Row Level Security (RLS) policies for authenticated admins
   - High-performance indexes on SKU, Barcode, and category relations
5. Copy your **Project URL** and **Anon Key** from `Project Settings -> API`.
6. Add them to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   *(Alternatively, paste them directly into the application's **Settings & Supabase** page!)*
7. Click **Seed Supabase Data** in the Settings tab to immediately populate your database with default hardware components!

---

## Barcode Scanner Guide

This system is 100% compatible with off-the-shelf USB and wireless barcode scanners (Honeywell, Zebra, Netum, Eyoyo, etc.):
- Press `Ctrl + K` anywhere in the dashboard to open the **Barcode & SKU Scanner** dialog.
- The input field auto-focuses.
- Scan any hardware box barcode: the scanner inputs characters and hits `Enter`.
- The matching hardware item appears instantly with stock level, pricing, and 1-click restock or dispatch actions.

---

## Deployment

The application is static-build ready and can be hosted on free tiers of:
- **Vercel** (`npm run build` -> output directory `dist`)
- **Netlify** (`npm run build` -> publish directory `dist`)
- **Cloudflare Pages** (`npm run build` -> output directory `dist`)
- **GitHub Pages**
