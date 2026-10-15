import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'yellow-badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const isYellowBadge = variant === 'yellow-badge';
  const isDark = variant === 'dark';

  const sizeStyles = {
    sm: {
      badge: 'w-9 h-9 p-1.5',
      icon: 'w-6 h-6',
      title: 'text-base font-bold',
      latin: 'text-xs font-semibold',
      subtitle: 'text-[9px]',
    },
    md: {
      badge: 'w-11 h-11 p-2',
      icon: 'w-8 h-8',
      title: 'text-xl font-black',
      latin: 'text-sm font-bold',
      subtitle: 'text-[11px]',
    },
    lg: {
      badge: 'w-14 h-14 p-2.5',
      icon: 'w-10 h-10',
      title: 'text-2xl font-black',
      latin: 'text-base font-bold',
      subtitle: 'text-xs',
    },
    xl: {
      badge: 'w-20 h-20 p-3.5',
      icon: 'w-14 h-14',
      title: 'text-3xl font-black',
      latin: 'text-xl font-bold',
      subtitle: 'text-sm',
    },
  }[size];

  // The official Sahla 3-Tier Stepped Ribbon with Upward Arrow
  const LogoMarkSvg = ({ color = '#FFFFFF' }: { color?: string }) => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Dynamic Curved Arrow launching from top tier */}
      <path
        d="M26 42C23 35 25 24 35 20C40 18 45 19 49 20"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Arrow Head */}
      <path d="M36 12L52 20L40 32" fill={color} />
      {/* Tier 1 (Top Ribbon) */}
      <path d="M25 36H70L63 46H20L25 36Z" fill={color} />
      {/* Tier 2 (Middle Ribbon) */}
      <path d="M32 50H77L70 60H27L32 50Z" fill={color} />
      {/* Tier 3 (Bottom Ribbon) */}
      <path d="M39 64H84L76 74H34L39 64Z" fill={color} />
    </svg>
  );

  if (isYellowBadge) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center p-6 bg-[#F5B800] rounded-3xl text-white select-none shadow-lg shadow-[#F5B800]/20 ${className}`}
      >
        <div className="w-20 h-20 mb-3">
          <LogoMarkSvg color="#FFFFFF" />
        </div>
        <div className="flex items-center gap-2 text-white font-['IBM_Plex_Sans_Arabic',sans-serif]">
          <span className="text-xl font-bold tracking-tight">sahla</span>
          <span className="text-2xl font-black tracking-tight">سهلا</span>
        </div>
        {showSubtitle && (
          <span className="text-xs text-white/90 font-medium mt-1">
            لخدمات الشحن والتوريد المحدودة
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Box: Brand Golden Yellow Background (#F5B800) with Crisp White Mark */}
      <div
        className={`${sizeStyles.badge} rounded-2xl flex items-center justify-center bg-[#F5B800] shadow-sm shadow-[#F5B800]/30 transition-transform hover:scale-105 shrink-0`}
      >
        <LogoMarkSvg color="#FFFFFF" />
      </div>
      {/* Typography: sahla | سهلا */}
      <div className="flex flex-col text-right">
        <div className="flex items-baseline gap-2">
          <span
            className={`tracking-tight leading-none font-['IBM_Plex_Sans_Arabic',sans-serif] ${sizeStyles.title} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            سهلا
          </span>
          <span
            className={`font-semibold tracking-wide font-sans ${sizeStyles.latin} ${
              isDark ? 'text-[#F5B800]' : 'text-[#D99B00]'
            }`}
          >
            sahla
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium tracking-wide mt-0.5 ${sizeStyles.subtitle} ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            للشحن والخدمات اللوجستية
          </span>
        )}
      </div>
    </div>
  );
};
