import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'purple' | 'pink' | 'orange';
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
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
  };

  return (
    <div className={`backdrop-blur-lg rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${colorStyles[color].background}`}>
      <div className="flex items-center justify-between">
        <div className="text-gray-600 font-medium">{title}</div>
        <div className={`p-3 rounded-xl ${colorStyles[color].icon}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {trend && (
          <div className={`text-sm mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
} 