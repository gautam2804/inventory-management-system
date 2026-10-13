import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'icon' | 'full';
  showSubtitle?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { container: 'w-7 h-7', img: 'w-6 h-6', text: 'text-xs', sub: 'text-[9px]' },
  sm: { container: 'w-9 h-9', img: 'w-7 h-7', text: 'text-sm', sub: 'text-[10px]' },
  md: { container: 'w-11 h-11', img: 'w-9 h-9', text: 'text-base', sub: 'text-[11px]' },
  lg: { container: 'w-16 h-16', img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
  xl: { container: 'w-20 h-20', img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'badge',
  showSubtitle = true,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sizes = sizeMap[size];

  // In badge mode: display rich emblem with glowing backdrop
  // In icon mode: adapt dynamically using transparent versions
  const logoImage = isDark
    ? '/at-tech-logo-white-transparent.png'
    : '/at-tech-logo-dark-transparent.png';

  const badgeElem = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-blue-600 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/35 transition-all duration-300 ${sizes.container} ${className}`}
    >
      <div className="w-full h-full rounded-[14px] bg-[#0c5366] dark:bg-[#072430] flex items-center justify-center overflow-hidden p-1">
        <img
          src="/at-tech-logo-teal.jpg"
          alt="At Tech Digital Logo"
          className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </div>
  );

  const transparentIconElem = (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizes.container} ${className}`}>
      <img
        src={logoImage}
        alt="At Tech Digital Logo"
        className={`${sizes.img} object-contain transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );

  if (variant === 'icon') {
    return transparentIconElem;
  }

  if (variant === 'badge') {
    return badgeElem;
  }

  // variant === 'full': Logo + Brand Text
  return (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      {badgeElem}
      <div className="flex flex-col text-left">
        <div className={`font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 ${sizes.text}`}>
          <span>AT TECH</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 font-extrabold">
            DIGITAL
          </span>
        </div>
        {showSubtitle && (
          <div className={`font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 ${sizes.sub}`}>
            Inventory Management
          </div>
        )}
      </div>
    </div>
  );
};
