import moment from "moment-timezone";
import { CalendarIcon, GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DateTimeSelectorProps {
  timezone: string;
  selectedYear: number;
  selectedMonth: number;
  onTimezoneChange: (timezone: string) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  loading: boolean;
  onFetch: () => void;
}

export function DateTimeSelector({
  timezone,
  selectedYear,
  selectedMonth,
  onTimezoneChange,
  onYearChange,
  onMonthChange,
  loading,
  onFetch
}: DateTimeSelectorProps) {
  const now = moment().tz(timezone);
  const years = Array.from({ length: 11 }, (_, i) => now.year() - 5 + i);
  const months = moment.months();
  const commonTimezones = [
    "Asia/Shanghai",
    "Asia/Tokyo",
    "America/New_York",
    "Europe/London",
    "UTC"
  ];

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Timezone Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={timezone}
                onChange={(e) => onTimezoneChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Selector */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Selector */}
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-7">
          <button
            onClick={onFetch}
            disabled={loading}
            className={`
              flex items-center justify-center
              w-10 h-10
              rounded-full
              transition-all duration-200
              ${loading 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200'
              }
            `}
            title="Refresh Data"
          >
            <ArrowPathIcon 
              className={`h-5 w-5 ${loading 
                ? 'text-gray-400 animate-spin' 
                : 'text-indigo-600'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 