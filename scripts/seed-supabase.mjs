import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yeqkpajepkuszedoyrlu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E4agJ4eIsNhwLD3jPM3ucg_yAanqqb3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEED_CATEGORIES = [
  { name: 'Processors (CPUs)', code: 'CPU', description: 'Desktop and server processors from Intel and AMD' },
  { name: 'Graphics Cards (GPUs)', code: 'GPU', description: 'Dedicated discrete graphics cards from NVIDIA, AMD & Intel' },
  { name: 'Motherboards', code: 'MOB', description: 'ATX, Micro-ATX, and Mini-ITX motherboards' },
  { name: 'RAM (Memory)', code: 'RAM', description: 'DDR4 and DDR5 desktop and laptop memory kits' },
  { name: 'Solid State Drives (SSDs)', code: 'SSD', description: 'NVMe M.2 and SATA III high-speed storage' },
  { name: 'Hard Disk Drives (HDDs)', code: 'HDD', description: 'High-capacity 3.5-inch and 2.5-inch mechanical storage' },
  { name: 'Power Supplies (PSUs)', code: 'PSU', description: 'Modular, semi-modular 80-Plus certified power supplies' },
  { name: 'Cabinets & Cases', code: 'CAS', description: 'Mid-tower, full-tower, and compact PC enclosures' },
  { name: 'Monitors', code: 'MON', description: 'High-refresh rate gaming and color-accurate office monitors' },
  { name: 'Keyboards', code: 'KEY', description: 'Mechanical, optical, and wireless desktop keyboards' },
  { name: 'Mice', code: 'MOU', description: 'Ergonomic, lightweight gaming and productivity mice' },
  { name: 'Networking Devices', code: 'NET', description: 'Wi-Fi 6/7 routers, network cards, and gigabit switches' },
  { name: 'Accessories & Cables', code: 'ACC', description: 'Thermal paste, cable extensions, adapters, and fans' },
];

const SEED_SUPPLIERS = [
  {
    name: 'Apex Silicon Distributors',
    contact_person: 'Marcus Vance',
    phone: '+1 (555) 234-5678',
    email: 'marcus.v@apexsilicon.com',
    address: '402 Technology Parkway, San Jose, CA 95134',
    notes: 'Primary distributor for AMD, Intel, and NVIDIA authorized chips.'
  },
  {
    name: 'Global Component Logistics',
    contact_person: 'Elena Rostova',
    phone: '+1 (555) 876-5432',
    email: 'elena@globalcomplogistics.net',
    address: '1200 Terminal Way, Dallas, TX 75261',
    notes: 'Specializes in memory kits, SSDs, and storage systems.'
  },
  {
    name: 'Pacific Hardware Syndicate',
    contact_person: 'David Chen',
    phone: '+1 (555) 456-7890',
    email: 'dchen@pacifichardware.org',
    address: '88 Harbor Blvd, Seattle, WA 98104',
    notes: 'Peripherals, cooling solutions, cases, and power supplies.'
  },
  {
    name: 'Quantum Network Supply',
    contact_person: 'Sarah Jenkins',
    phone: '+1 (555) 987-1234',
    email: 'sjenkins@quantumnetwork.io',
    address: '500 Innovation Way, Austin, TX 78701',
    notes: 'Enterprise routers, Wi-Fi 7 access points, and structured cabling.'
  }
];

async function seed() {
  console.log('Seeding At Tech Digital Supabase Database...');

  // 1. Categories: Fetch existing first
  const { data: existingCats } = await supabase.from('categories').select('id, code, name');
  const existingCatCodes = new Set((existingCats || []).map(c => c.code));

  const catsToInsert = SEED_CATEGORIES.filter(c => !existingCatCodes.has(c.code));
  if (catsToInsert.length > 0) {
    const { error: catErr } = await supabase.from('categories').insert(catsToInsert);
    if (catErr) console.warn('Category insert note:', catErr.message);
  }

  const { data: allCats } = await supabase.from('categories').select('id, code, name');
  console.log('Active categories count:', allCats?.length || 0);
  const catMap = Object.fromEntries((allCats || []).map(c => [c.code, c.id]));

  // 2. Suppliers: Fetch existing first
  const { data: existingSups } = await supabase.from('suppliers').select('id, name');
  const existingSupNames = new Set((existingSups || []).map(s => s.name));

  const supsToInsert = SEED_SUPPLIERS.filter(s => !existingSupNames.has(s.name));
  if (supsToInsert.length > 0) {
    const { error: supErr } = await supabase.from('suppliers').insert(supsToInsert);
    if (supErr) console.warn('Supplier insert note:', supErr.message);
  }

  const { data: allSups } = await supabase.from('suppliers').select('id, name');
  console.log('Active suppliers count:', allSups?.length || 0);
  const supMap = Object.fromEntries((allSups || []).map(s => [s.name, s.id]));

  // 3. Products
  const products = [
    {
      name: 'AMD Ryzen 7 7800X3D Processor',
      sku: 'CPU-AMD-7800',
      barcode: '890123456701',
      category_id: catMap['CPU'],
      brand: 'AMD',
      model: '100-100000910WOF',
      description: '8-Core, 16-Thread Desktop Processor with 3D V-Cache Technology, up to 5.0 GHz boost.',
      purchase_price: 349.99,
      selling_price: 449.99,
      quantity: 14,
      min_stock_level: 5,
      supplier_id: supMap['Apex Silicon Distributors'],
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Intel Core i9-14900K Processor',
      sku: 'CPU-INT-1490',
      barcode: '890123456702',
      category_id: catMap['CPU'],
      brand: 'Intel',
      model: 'BX8071514900K',
      description: '24 Cores (8P + 16E) up to 6.0 GHz Turbo, LGA1700 unlocked desktop processor.',
      purchase_price: 450.00,
      selling_price: 549.99,
      quantity: 3,
      min_stock_level: 5,
      supplier_id: supMap['Apex Silicon Distributors'],
      image_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'ASUS ROG Strix GeForce RTX 4080 Super 16GB',
      sku: 'GPU-ASU-4080',
      barcode: '890123456703',
      category_id: catMap['GPU'],
      brand: 'ASUS',
      model: 'ROG-STRIX-RTX4080S-O16G',
      description: 'Ada Lovelace architecture, DLSS 3, 16GB GDDR6X, Axial-tech fans, RGB aura sync.',
      purchase_price: 899.99,
      selling_price: 1149.99,
      quantity: 6,
      min_stock_level: 4,
      supplier_id: supMap['Apex Silicon Distributors'],
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'MSI Gaming GeForce RTX 4060 Ti 8GB',
      sku: 'GPU-MSI-4060',
      barcode: '890123456704',
      category_id: catMap['GPU'],
      brand: 'MSI',
      model: 'G4060TIVX8C',
      description: 'Compact dual-fan design, 8GB GDDR6, ray tracing and DLSS 3 support.',
      purchase_price: 310.00,
      selling_price: 399.99,
      quantity: 0,
      min_stock_level: 4,
      supplier_id: supMap['Apex Silicon Distributors'],
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz',
      sku: 'RAM-COR-6000',
      barcode: '890123456705',
      category_id: catMap['RAM'],
      brand: 'Corsair',
      model: 'CMH32GX5M2B6000C30',
      description: 'Optimized for Intel and AMD expo, CL30 latency, ten-zone RGB illumination.',
      purchase_price: 95.00,
      selling_price: 139.99,
      quantity: 28,
      min_stock_level: 8,
      supplier_id: supMap['Global Component Logistics'],
      image_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'G.Skill Ripjaws S5 Series 32GB DDR5 5600MHz',
      sku: 'RAM-GSK-5600',
      barcode: '890123456706',
      category_id: catMap['RAM'],
      brand: 'G.Skill',
      model: 'F5-5600J3636C16GX2-RS5K',
      description: 'Low-profile matte black heatspreader, dual-channel DDR5 kit.',
      purchase_price: 78.00,
      selling_price: 109.99,
      quantity: 2,
      min_stock_level: 6,
      supplier_id: supMap['Global Component Logistics'],
      image_url: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Samsung 990 PRO NVMe M.2 SSD 2TB',
      sku: 'SSD-SAM-9902',
      barcode: '890123456707',
      category_id: catMap['SSD'],
      brand: 'Samsung',
      model: 'MZ-V9P2T0B/AM',
      description: 'PCIe Gen 4.0 x4, up to 7,450 MB/s read and 6,900 MB/s write speed, V-NAND TLC.',
      purchase_price: 125.00,
      selling_price: 179.99,
      quantity: 19,
      min_stock_level: 5,
      supplier_id: supMap['Global Component Logistics'],
      image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Seagate IronWolf Pro 8TB NAS Hard Drive',
      sku: 'HDD-SEA-IW08',
      barcode: '890123456709',
      category_id: catMap['HDD'],
      brand: 'Seagate',
      model: 'ST8000NE001',
      description: '7200 RPM, 256MB Cache, SATA 6Gb/s 3.5-Inch Enterprise Internal Drive.',
      purchase_price: 155.00,
      selling_price: 219.99,
      quantity: 11,
      min_stock_level: 3,
      supplier_id: supMap['Global Component Logistics'],
      image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'ASUS ROG Maximus Z790 Dark Hero Motherboard',
      sku: 'MOB-ASU-Z790',
      barcode: '890123456710',
      category_id: catMap['MOB'],
      brand: 'ASUS',
      model: 'ROG MAXIMUS Z790 DARK HERO',
      description: 'Intel LGA 1700, 20+1+2 power stages, DDR5, Wi-Fi 7, Dual Thunderbolt 4 ports.',
      purchase_price: 490.00,
      selling_price: 649.99,
      quantity: 5,
      min_stock_level: 3,
      supplier_id: supMap['Apex Silicon Distributors'],
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Corsair RM850x 850W 80 Plus Gold Modular PSU',
      sku: 'PSU-COR-850X',
      barcode: '890123456711',
      category_id: catMap['PSU'],
      brand: 'Corsair',
      model: 'CP-9020200-NA',
      description: 'Fully modular power supply with magnetic levitation fan, Japanese 105°C capacitors.',
      purchase_price: 99.00,
      selling_price: 149.99,
      quantity: 15,
      min_stock_level: 5,
      supplier_id: supMap['Pacific Hardware Syndicate'],
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'LG UltraGear 27GR95QE-B 27" OLED 240Hz Gaming Monitor',
      sku: 'MON-LGE-27OL',
      barcode: '890123456713',
      category_id: catMap['MON'],
      brand: 'LG',
      model: '27GR95QE-B',
      description: 'QHD (2560 x 1440) OLED panel, 0.03ms response time, HDR10, G-SYNC compatible.',
      purchase_price: 580.00,
      selling_price: 799.99,
      quantity: 4,
      min_stock_level: 2,
      supplier_id: supMap['Pacific Hardware Syndicate'],
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Logitech G PRO X Superlight 2 Wireless Gaming Mouse',
      sku: 'MOU-LOG-PRX2',
      barcode: '890123456714',
      category_id: catMap['MOU'],
      brand: 'Logitech',
      model: '910-006628',
      description: 'HERO 2 sensor with 32,000 DPI, 60g ultralight, LIGHTFORCE hybrid optical switches.',
      purchase_price: 105.00,
      selling_price: 159.99,
      quantity: 22,
      min_stock_level: 6,
      supplier_id: supMap['Pacific Hardware Syndicate'],
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'TP-Link Archer BE800 BE19000 Tri-Band Wi-Fi 7 Router',
      sku: 'NET-TPL-BE80',
      barcode: '890123456715',
      category_id: catMap['NET'],
      brand: 'TP-Link',
      model: 'Archer BE800',
      description: '19 Gbps Tri-Band Wi-Fi 7, two 10G ports, four 2.5G ports, LED screen display.',
      purchase_price: 360.00,
      selling_price: 499.99,
      quantity: 0,
      min_stock_level: 3,
      supplier_id: supMap['Quantum Network Supply'],
      image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80',
    }
  ].filter(p => p.category_id);

  // Check existing products by SKU
  const { data: existingProds } = await supabase.from('products').select('id, sku');
  const existingSkus = new Set((existingProds || []).map(p => p.sku));

  const prodsToInsert = products.filter(p => !existingSkus.has(p.sku));
  if (prodsToInsert.length > 0) {
    const { data: insertedProds, error: prodErr } = await supabase
      .from('products')
      .insert(prodsToInsert)
      .select('id, name, quantity');

    if (prodErr) {
      console.error('Error inserting products:', prodErr);
      return;
    }
    console.log('Inserted products count:', insertedProds.length);

    // Initial stock movement logs
    const movements = (insertedProds || [])
      .filter(p => p.quantity > 0)
      .map(p => ({
        product_id: p.id,
        movement_type: 'in',
        quantity_changed: p.quantity,
        previous_quantity: 0,
        updated_quantity: p.quantity,
        reason: 'Initial Warehouse Intake',
        notes: 'At Tech Digital System Seeding',
        created_by: 'Admin',
      }));

    if (movements.length > 0) {
      await supabase.from('stock_movements').insert(movements);
      console.log('Initial stock movement history logged:', movements.length);
    }
  }

  const { data: totalProducts } = await supabase.from('products').select('id');
  console.log('Total live products in Supabase:', totalProducts?.length || 0);
  console.log('SUCCESS! At Tech Digital Inventory Management System is fully populated.');
}

seed().catch(console.error);
