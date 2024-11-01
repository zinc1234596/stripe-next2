import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="text-gray-500">{title}</div>
        <div className="text-gray-600 bg-gray-100 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {trend && (
          <div className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
} 