import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}


export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function generateSKU(categoryCode: string = 'GEN', brand: string = ''): string {
  const cat = (categoryCode || 'GEN').toUpperCase().slice(0, 3);
  const br = (brand || 'HW').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'IT';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cat}-${br}-${random}`;
}

export function generateBarcode(): string {
  // Generate valid 12-digit UPC or 13-digit EAN-like numeric barcode
  const prefix = '890';
  const mid = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${mid}`;
}
