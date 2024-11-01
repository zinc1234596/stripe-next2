import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DailyStats } from '@/services/stripe';
import moment from 'moment';
import { formatCurrency } from '@/utils/currencySymbols';
import { useState } from 'react';

interface RevenueChartProps {
  data: DailyStats[];
  currency: string;
  compact?: boolean;
  loading?: boolean;
}

export function RevenueChart({ data, currency, compact = false, loading = false }: RevenueChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    revenue: true,
    orderCount: false,
    cumulativeRevenue: false,
    cumulativeOrders: false
  });

  const chartData = data.map((day) => ({
    date: day.date,
    revenue: day.revenue[currency] || 0,
    orderCount: day.orderCount,
    cumulativeRevenue: 0,
    cumulativeOrders: 0,
    displayDate: moment(day.date).format('DD')
  }));

  chartData.forEach((day, index) => {
    day.cumulativeRevenue = day.revenue;
    day.cumulativeOrders = day.orderCount;
    if (index > 0) {
      day.cumulativeRevenue += chartData[index - 1].cumulativeRevenue;
      day.cumulativeOrders += chartData[index - 1].cumulativeOrders;
    }
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

  const toggleLine = (dataKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
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
    <div className="flex flex-col w-full">
      {/* 图表控制按钮 */}
      <div className="flex gap-4 mb-4 px-4">
        <button
          onClick={() => toggleLine('revenue')}
          className={`px-3 py-1 rounded-full text-sm ${
            visibleLines.revenue 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          每日收入
        </button>
        <button
          onClick={() => toggleLine('orderCount')}
          className={`px-3 py-1 rounded-full text-sm ${
            visibleLines.orderCount 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          每日订单
        </button>
        <button
          onClick={() => toggleLine('cumulativeRevenue')}
          className={`px-3 py-1 rounded-full text-sm ${
            visibleLines.cumulativeRevenue 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          累计收入
        </button>
        <button
          onClick={() => toggleLine('cumulativeOrders')}
          className={`px-3 py-1 rounded-full text-sm ${
            visibleLines.cumulativeOrders 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          累计订单
        </button>
      </div>

      <div style={{ width: '100%', height: compact ? 160 : 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCumulativeOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
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
              yAxisId="left"
              stroke="#94A3B8"
              tickSize={compact ? 2 : 5}
              tick={{ fontSize: compact ? 10 : 12 }}
              width={compact ? 30 : 40}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
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
              formatter={(value: number, name: string) => {
                switch (name) {
                  case 'revenue':
                    return [formatCurrency(value, currency), '每日收入'];
                  case 'orderCount':
                    return [value, '每日订单'];
                  case 'cumulativeRevenue':
                    return [formatCurrency(value, currency), '累计收入'];
                  case 'cumulativeOrders':
                    return [value, '累计订单'];
                  default:
                    return [value, name];
                }
              }}
              labelFormatter={(label) => {
                const dataPoint = chartData.find(item => item.displayDate === label);
                return dataPoint ? moment(dataPoint.date).format('YYYY-MM-DD') : '';
              }}
            />
            {visibleLines.revenue && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#818CF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="revenue"
              />
            )}
            {visibleLines.orderCount && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="orderCount"
                stroke="#34D399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrders)"
                name="orderCount"
              />
            )}
            {visibleLines.cumulativeRevenue && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeRevenue"
                stroke="#A855F7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                name="cumulativeRevenue"
              />
            )}
            {visibleLines.cumulativeOrders && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeOrders"
                stroke="#60A5FA"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulativeOrders)"
                name="cumulativeOrders"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 