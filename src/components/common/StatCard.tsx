import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: {
    label: string;
    positive?: boolean;
    warning?: boolean;
  };
  color?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon,
  trend,
  color = 'indigo',
  onClick,
}) => {
  const colorSchemes = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-500/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      glow: 'group-hover:shadow-indigo-500/10',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-500/10',
      border: 'hover:border-cyan-300 dark:hover:border-cyan-500/40',
      text: 'text-cyan-600 dark:text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/10',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'hover:border-amber-300 dark:hover:border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'group-hover:shadow-amber-500/10',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      border: 'hover:border-rose-300 dark:hover:border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'group-hover:shadow-rose-500/10',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'hover:border-purple-300 dark:hover:border-purple-500/40',
      text: 'text-purple-600 dark:text-purple-400',
      glow: 'group-hover:shadow-purple-500/10',
    },
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5.5 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-lg',
        scheme.border,
        scheme.glow,
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
          {subValue && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subValue}</p>}
        </div>

        <div className={cn('p-3 rounded-xl border border-slate-100 dark:border-white/5 transition-transform duration-300 group-hover:scale-110 shadow-inner', scheme.bg, scheme.text)}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
              trend.warning
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                : trend.positive
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
            )}
          >
            {trend.label}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">vs threshold / target</span>
        </div>
      )}
    </motion.div>
  );
};
