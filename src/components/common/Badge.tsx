import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'in' | 'out' | 'adjustment' | 'cyan' | 'purple' | 'slate';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  className,
  size = 'md',
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    in_stock: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    low_stock: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse',
    out_of_stock: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20',
    in: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20',
    out: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20',
    adjustment: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };

  const icons = {
    in_stock: <CheckCircle2 className="w-3 h-3 mr-1" />,
    low_stock: <AlertTriangle className="w-3 h-3 mr-1" />,
    out_of_stock: <AlertCircle className="w-3 h-3 mr-1" />,
    in: <ArrowDownLeft className="w-3 h-3 mr-1" />,
    out: <ArrowUpRight className="w-3 h-3 mr-1" />,
    adjustment: <RefreshCw className="w-3 h-3 mr-1" />,
    cyan: null,
    purple: null,
    slate: null,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full shrink-0 select-none tracking-wide',
        variantStyles[variant],
        sizeStyles,
        className
      )}
    >
      {icons[variant]}
      {children}
    </span>
  );
};
