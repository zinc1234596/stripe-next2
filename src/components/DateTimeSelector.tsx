import moment from "moment-timezone";

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
    <div className="flex items-center space-x-4 flex-wrap gap-2">
      <select
        value={timezone}
        onChange={(e) => onTimezoneChange(e.target.value)}
        className="p-2 border rounded"
      >
        {commonTimezones.map((tz) => (
          <option key={tz} value={tz}>{tz}</option>
        ))}
      </select>

      <select
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="p-2 border rounded"
      >
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className="p-2 border rounded"
      >
        {months.map((month, index) => (
          <option key={month} value={index}>{month}</option>
        ))}
      </select>

      <button
        onClick={onFetch}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Loading..." : "Fetch Revenue"}
      </button>
    </div>
  );
} 