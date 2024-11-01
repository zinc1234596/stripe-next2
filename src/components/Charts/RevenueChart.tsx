import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyStats } from '@/services/stripe';
import moment from 'moment';
import { formatCurrency } from '@/utils/currencySymbols';

interface RevenueChartProps {
  data: DailyStats[];
  currency: string;
  compact?: boolean;
  loading?: boolean;
}

export function RevenueChart({ data, currency, compact = false, loading = false }: RevenueChartProps) {
  const chartData = data.map(day => {
    const revenue = day.revenue[currency] || 0;
    
    return {
      date: day.date,
      revenue: revenue,
      displayDate: moment(day.date).format('DD')
    };
  });

  const calculateTickCount = () => {
    if (compact) {
      return data.length <= 10 ? data.length : 5;
    }
    return data.length <= 31 ? Math.min(10, data.length) : 10;
  };

  const generateTicks = () => {
    const tickCount = calculateTickCount();
    if (data.length <= tickCount) {
      return chartData.map((_, index) => index);
    }
    
    const interval = Math.floor(data.length / (tickCount - 1));
    const ticks = [];
    for (let i = 0; i < data.length; i += interval) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] !== data.length - 1) {
      ticks.push(data.length - 1);
    }
    return ticks;
  };

  if (loading) {
    return (
      <div 
        style={{ width: '100%', height: compact ? 160 : 300 }}
        className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
      >
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-2 text-sm text-gray-500">Loading chart data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: compact ? 160 : 300 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="displayDate"
            stroke="#94A3B8"
            ticks={generateTicks().map(index => chartData[index].displayDate)}
            interval={0}
            tickSize={compact ? 2 : 5}
            tick={{ fontSize: compact ? 10 : 12 }}
            height={20}
          />
          <YAxis 
            stroke="#94A3B8"
            tickSize={compact ? 2 : 5}
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 30 : 40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              fontSize: compact ? '12px' : '14px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#818CF8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 