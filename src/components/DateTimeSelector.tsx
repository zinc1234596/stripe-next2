import moment from "moment-timezone";
import { CalendarIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="pl-10 block w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          >
            {commonTimezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="pl-10 block w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="pl-10 block w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onFetch}
          disabled={loading}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            "Fetch Analytics"
          )}
        </button>
      </div>
    </div>
  );
} 