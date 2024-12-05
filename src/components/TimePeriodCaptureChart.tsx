import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';
import { Clock, Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { VisitorData } from '../types/restaurant';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface TimePeriodCaptureChartProps {
  data: VisitorData[];
  date: Date;
  benchmarkDate?: Date | null;
  benchmarkData?: VisitorData[] | null;
}

interface TimeRange {
  start: string;
  end: string;
}

interface Period {
  id: string;
  name: string;
  range: TimeRange;
  color: string;
}

const FIXED_PERIODS: Period[] = [
  { 
    id: 'morning',
    name: 'Morning', 
    range: { start: '07:00', end: '10:00' }, 
    color: 'rgb(34, 197, 94)' // green-500
  },
  { 
    id: 'noon',
    name: 'Noon', 
    range: { start: '12:00', end: '14:00' }, 
    color: 'rgb(249, 115, 22)' // orange-500
  },
  { 
    id: 'afternoon',
    name: 'Afternoon', 
    range: { start: '16:00', end: '20:00' }, 
    color: 'rgb(59, 130, 246)' // blue-500
  },
];

export function TimePeriodCaptureChart({ 
  data, 
  date, 
  benchmarkDate,
  benchmarkData 
}: TimePeriodCaptureChartProps) {
  const [customRange, setCustomRange] = useState<{ start: number; end: number }>({ start: 11, end: 15 });
  const [activePeriods, setActivePeriods] = useState<Set<string>>(
    new Set([...FIXED_PERIODS.map(p => p.id), 'custom'])
  );

  const customPeriod: Period = {
    id: 'custom',
    name: 'Custom Period',
    range: {
      start: `${String(customRange.start).padStart(2, '0')}:00`,
      end: `${String(customRange.end).padStart(2, '0')}:00`
    },
    color: 'rgb(236, 72, 153)' // pink-500
  };

  const togglePeriod = (periodId: string) => {
    setActivePeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  };

  const calculateCaptureRate = (data: VisitorData[], dateStr: string, range: TimeRange) => {
    const periodData = data.filter(entry => {
      if (!entry.timestamp.startsWith(dateStr)) return false;
      const time = entry.timestamp.split(' ')[1];
      return time >= range.start && time < range.end;
    });

    const totals = periodData.reduce(
      (acc, curr) => ({
        entering: acc.entering + curr.enteringVisitors,
        passersby: acc.passersby + curr.passersby,
      }),
      { entering: 0, passersby: 0 }
    );

    return {
      rate: totals.passersby > 0 ? (totals.entering / totals.passersby) * 100 : 0,
      visitors: totals.entering,
      passersby: totals.passersby,
    };
  };

  const getCaptureRates = (targetDate: Date, sourceData: VisitorData[]) => {
    const dateStr = targetDate.toLocaleDateString('en-GB');
    const allPeriods = [...FIXED_PERIODS, customPeriod];
    
    return allPeriods
      .filter(period => activePeriods.has(period.id))
      .map(period => {
        const stats = calculateCaptureRate(sourceData, dateStr, period.range);
        return {
          name: period.name,
          value: stats.rate,
          visitors: stats.visitors,
          passersby: stats.passersby,
          color: period.color,
          timeRange: `${period.range.start} - ${period.range.end}`
        };
      });
  };

  const chartData = useMemo(() => {
    const primaryRates = getCaptureRates(date, data);
    const benchmarkRates = benchmarkDate && !benchmarkData
      ? getCaptureRates(benchmarkDate, data)
      : benchmarkData
      ? getCaptureRates(date, benchmarkData)
      : null;

    return {
      primaryRates,
      benchmarkRates,
      chartData: {
        labels: primaryRates.map(rate => rate.name),
        datasets: [
          {
            data: primaryRates.map(rate => rate.value),
            backgroundColor: primaryRates.map(rate => rate.color),
            borderWidth: 2,
            borderColor: '#fff',
          },
          ...(benchmarkRates ? [{
            data: benchmarkRates.map(rate => rate.value),
            backgroundColor: benchmarkRates.map(rate => `${rate.color}80`),
            borderWidth: 2,
            borderColor: '#fff',
            radius: '70%',
          }] : [])
        ]
      }
    };
  }, [data, date, benchmarkDate, benchmarkData, activePeriods, customRange]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const datasetIndex = context.datasetIndex;
            const prefix = datasetIndex === 1 ? '(Benchmark) ' : '';
            return `${prefix}${label}: ${value.toFixed(1)}%`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value: number) => `${value.toFixed(1)}%`,
        textStroke: {
          color: 'rgba(0, 0, 0, 0.5)',
          width: 3
        },
        display: (context: any) => context.dataset.data[context.dataIndex] > 0
      }
    },
    cutout: benchmarkDate || benchmarkData ? '40%' : '0%',
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          Time Period Capture Rate
        </h3>
      </div>

      {/* Time Period Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {chartData.primaryRates.map((period, index) => {
          const benchmark = chartData.benchmarkRates?.[index];
          const comparison = benchmark ? period.value - benchmark.value : null;
          
          return (
            <div
              key={period.name}
              className="bg-white rounded-lg border p-4 relative overflow-hidden"
              style={{ borderColor: period.color }}
            >
              {/* Period indicator line */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: period.color }}
              />
              
              <div className="mb-2">
                <h4 className="font-semibold text-gray-900">{period.name}</h4>
                <p className="text-sm text-gray-500">{period.timeRange}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capture Rate:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {period.value.toFixed(1)}%
                    </span>
                    {comparison !== null && (
                      <div className={`flex items-center ${
                        comparison > 0 ? 'text-green-600' :
                        comparison < 0 ? 'text-red-600' :
                        'text-gray-400'
                      }`}>
                        {comparison > 0 ? <ArrowUp className="w-4 h-4" /> :
                         comparison < 0 ? <ArrowDown className="w-4 h-4" /> :
                         <Minus className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Visitors:</span>
                  <span className="font-medium text-gray-900">{period.visitors}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Passersby:</span>
                  <span className="font-medium text-gray-900">{period.passersby}</span>
                </div>

                {benchmark && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Benchmark:</span>
                      <span className="font-medium text-gray-900">
                        {benchmark.value.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Panel: Time Periods */}
        <div className="w-full lg:w-72 space-y-6">
          {/* Fixed Periods */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Fixed Time Periods</h4>
            <div className="space-y-2">
              {FIXED_PERIODS.map(period => (
                <button
                  key={period.id}
                  onClick={() => togglePeriod(period.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-md transition-all ${
                    activePeriods.has(period.id)
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/50'
                  }`}
                  style={{
                    borderLeft: `4px solid ${period.color}`
                  }}
                >
                  <div>
                    <div className="font-medium text-gray-900">{period.name}</div>
                    <div className="text-sm text-gray-500">
                      {period.range.start} - {period.range.end}
                    </div>
                  </div>
                  {activePeriods.has(period.id) && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Period */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Custom Period</h4>
              <button
                onClick={() => togglePeriod('custom')}
                className={`p-1.5 rounded-md transition-colors ${
                  activePeriods.has('custom')
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-400 hover:text-gray-600'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600">Start Time</label>
                  <span className="text-sm font-medium text-gray-900">
                    {customPeriod.range.start}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({
                    ...prev,
                    start: Math.min(Number(e.target.value), customRange.end - 1)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600">End Time</label>
                  <span className="text-sm font-medium text-gray-900">
                    {customPeriod.range.end}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({
                    ...prev,
                    end: Math.max(Number(e.target.value), customRange.start + 1)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Pie Chart */}
        <div className="flex-1 min-h-[400px] flex items-center justify-center p-4">
          {chartData.chartData.datasets[0].data.length > 0 ? (
            <Chart type="pie" data={chartData.chartData} options={options} />
          ) : (
            <div className="text-center text-gray-500">
              Please select at least one time period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}