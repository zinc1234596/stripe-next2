import { ReactNode } from 'react';

// Add type for valid colors
type CardColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'indigo' | 'gray';

// Add size type
type CardSize = 'small' | 'default' | 'large';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtext?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: CardColor;
  valueClassName?: string;
  size?: CardSize;
}

export function StatCard({ title, value, icon, subtext, trend, color = 'gray', valueClassName, size = 'default' }: StatCardProps) {
  const colorStyles = {
    blue: {
      background: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      icon: 'bg-blue-500/10 text-blue-600',
      text: 'text-blue-600',
    },
    purple: {
      background: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      icon: 'bg-purple-500/10 text-purple-600',
      text: 'text-purple-600',
    },
    pink: {
      background: 'bg-gradient-to-br from-pink-50 to-pink-100/50',
      icon: 'bg-pink-500/10 text-pink-600',
      text: 'text-pink-600',
    },
    orange: {
      background: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
      icon: 'bg-orange-500/10 text-orange-600',
      text: 'text-orange-600',
    },
    green: {
      background: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
      icon: 'bg-emerald-500/10 text-emerald-600',
      text: 'text-emerald-600',
    },
    indigo: {
      background: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
      icon: 'bg-indigo-500/10 text-indigo-600',
      text: 'text-indigo-600',
    },
    gray: {
      background: 'bg-gradient-to-br from-gray-50 to-gray-100/50',
      icon: 'bg-gray-500/10 text-gray-700',
      text: 'text-gray-700',
    },
  };

  const sizeStyles = {
    small: {
      padding: 'p-3',
      title: 'text-xs',
      value: 'text-base',
      iconWrapper: 'p-1.5',
    },
    default: {
      padding: 'p-4',
      title: 'text-xs',
      value: 'text-lg',
      iconWrapper: 'p-2',
    },
    large: {
      padding: 'p-5',
      title: 'text-sm',
      value: 'text-xl',
      iconWrapper: 'p-2.5',
    },
  };

  return (
    <div className={`
      backdrop-blur-lg rounded-lg shadow-sm hover:shadow-md transition-all 
      ${colorStyles[color].background}
      ${sizeStyles[size].padding}
    `}>
      <div className="flex items-center justify-between">
        <div className={`text-gray-500 font-medium ${sizeStyles[size].title}`}>
          {title}
        </div>
        <div className={`rounded-lg ${colorStyles[color].icon} ${sizeStyles[size].iconWrapper}`}>
          {icon}
        </div>
      </div>
      <div className="mt-1.5">
        <div className={`font-bold ${valueClassName || colorStyles[color].text} ${sizeStyles[size].value}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-xs mt-0.5 text-gray-500">
            {subtext}
          </div>
        )}
        {trend && (
          <div className={`text-xs mt-0.5 flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
} 