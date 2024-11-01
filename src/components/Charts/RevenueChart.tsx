import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyStats } from '@/services/stripe';
import moment from 'moment';

interface RevenueChartProps {
  data: DailyStats[];
  currency: string;
  compact?: boolean;
}

export function RevenueChart({ data, currency, compact = false }: RevenueChartProps) {
  const chartData = data.map(day => ({
    date: day.date,
    revenue: day.revenue[currency] || 0,
    displayDate: moment(day.date).format('DD')
  }));

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

  return (
    <div style={{ width: '100%', height: compact ? 160 : 300 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="displayDate"
            stroke="#6B7280"
            ticks={generateTicks().map(index => chartData[index].displayDate)}
            interval={0}
            tickSize={compact ? 2 : 5}
            tick={{ fontSize: compact ? 10 : 12 }}
            height={20}
          />
          <YAxis 
            stroke="#6B7280"
            tickSize={compact ? 2 : 5}
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 30 : 40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: compact ? '12px' : '14px',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
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
  );
} 