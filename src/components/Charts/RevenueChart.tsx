import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyStats } from '@/services/stripe';

interface RevenueChartProps {
  data: DailyStats[];
  currency: string;
}

export function RevenueChart({ data, currency }: RevenueChartProps) {
  const chartData = data.map(day => ({
    date: day.date,
    revenue: day.revenue[currency] || 0
  }));

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue ({currency})</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 