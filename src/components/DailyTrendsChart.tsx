import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';
import { Check } from 'lucide-react';
import { VisitorData } from '../types/restaurant';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DailyTrendsChartProps {
  data: {
    date: Date;
    enteringVisitors: number;
    passersby: number;
    dwellTime: number;
  }[];
  rawData: VisitorData[];
}

interface MetricOption {
  id: string;
  label: string;
  color: string;
  type: 'bar' | 'line';
  yAxisID: string;
}

const METRICS: MetricOption[] = [
  { id: 'visitors', label: 'Visitors', color: 'rgb(47, 118, 34)', type: 'bar', yAxisID: 'yVisitors' },
  { id: 'passersby', label: 'Passersby', color: 'rgb(243, 151, 0)', type: 'line', yAxisID: 'yPassersby' },
  { id: 'captureRate', label: 'Capture Rate', color: 'rgb(59, 130, 246)', type: 'line', yAxisID: 'yPercentage' },
  { id: 'dwellTime', label: 'Dwell Time', color: 'rgb(190, 24, 93)', type: 'line', yAxisID: 'yTime' }
];

const DEFAULT_METRICS = ['visitors', 'captureRate'];

export function DailyTrendsChart({ data, rawData }: DailyTrendsChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS);

  // Get the last selected non-visitor metric for the right y-axis
  const activeRightAxis = useMemo(() => {
    const nonVisitorMetrics = selectedMetrics.filter(m => m !== 'visitors');
    return nonVisitorMetrics[nonVisitorMetrics.length - 1];
  }, [selectedMetrics]);

  const chartData = useMemo(() => {
    const dates = data.map(day => {
      const date = day.date;
      const dayName = format(date, 'EEE dd MMM');
      return { label: dayName, dayOfWeek: date.getDay() };
    });
    
    const datasets = METRICS
      .filter(metric => selectedMetrics.includes(metric.id))
      .map(metric => {
        const values = data.map(day => {
          switch (metric.id) {
            case 'visitors':
              return day.enteringVisitors;
            case 'passersby':
              return day.passersby;
            case 'captureRate':
              return day.passersby > 0 
                ? (day.enteringVisitors / day.passersby) * 100 
                : 0;
            case 'dwellTime':
              return day.dwellTime;
            default:
              return 0;
          }
        });

        return {
          type: metric.type,
          label: metric.label,
          data: values,
          backgroundColor: metric.color,
          borderColor: metric.type === 'line' ? metric.color : undefined,
          borderWidth: metric.type === 'line' ? 2 : 0,
          yAxisID: metric.yAxisID,
          tension: 0.3,
          pointRadius: metric.type === 'line' ? 4 : 0,
          pointHoverRadius: metric.type === 'line' ? 6 : 0,
          pointBackgroundColor: metric.color,
          hoverBackgroundColor: metric.color,
          order: metric.type === 'bar' ? 1 : 0,
          datalabels: {
            display: metric.type === 'bar',
            color: 'rgb(17, 24, 39)',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: {
              weight: '600',
              size: 12
            },
            formatter: (value: number) => value.toLocaleString()
          }
        };
      });

    return { labels: dates.map(d => d.label), dayOfWeek: dates.map(d => d.dayOfWeek), datasets };
  }, [data, selectedMetrics]);

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            weight: '700'
          },
          color: (context: any) => {
            const dayOfWeek = chartData.dayOfWeek[context.index];
            if (dayOfWeek === 6) return 'rgb(47, 118, 34)'; // Saturday in green
            if (dayOfWeek === 0) return 'rgb(243, 151, 0)'; // Sunday in orange
            return 'rgb(17, 24, 39)'; // Weekdays in black
          }
        }
      },
      yVisitors: {
        type: 'linear' as const,
        display: selectedMetrics.includes('visitors'),
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Visitors',
          font: {
            weight: '700'
          }
        },
        ticks: {
          font: {
            weight: '700'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)'
        }
      },
      yPassersby: {
        type: 'linear' as const,
        display: activeRightAxis === 'passersby',
        position: 'right' as const,
        beginAtZero: true,
        max: Math.max(...data.map(d => d.passersby)) * 1.1,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Number of Passersby',
          font: {
            weight: '700'
          }
        }
      },
      yPercentage: {
        type: 'linear' as const,
        display: activeRightAxis === 'captureRate',
        position: 'right' as const,
        beginAtZero: true,
        max: Math.ceil(Math.max(...data.map(d => 
          d.passersby > 0 ? (d.enteringVisitors / d.passersby) * 100 : 0
        )) * 1.1),
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Capture Rate (%)',
          font: {
            weight: '700'
          }
        },
        ticks: {
          callback: (value: number) => `${value}%`
        }
      },
      yTime: {
        type: 'linear' as const,
        display: activeRightAxis === 'dwellTime',
        position: 'right' as const,
        beginAtZero: true,
        max: Math.max(...data.map(d => d.dwellTime)) * 1.1,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Dwell Time (minutes)',
          font: {
            weight: '700'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
              if (label.includes('Rate')) {
                label += context.parsed.y.toFixed(1) + '%';
              } else if (label.includes('Time')) {
                label += Math.round(context.parsed.y) + ' min';
              } else {
                label += Math.round(context.parsed.y);
              }
            }
            return label;
          }
        }
      },
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Last Month Summary',
        font: {
          size: 24, // Increased from 20 to 24
          weight: '700'
        },
        color: 'rgb(17, 24, 39)',
        padding: {
          bottom: 20
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex flex-wrap justify-center gap-3">
          {METRICS.map(metric => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetrics(prev => 
                prev.includes(metric.id)
                  ? prev.filter(id => id !== metric.id)
                  : [...prev, metric.id]
              )}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2.5
                transition-all duration-200 border-2
                ${selectedMetrics.includes(metric.id)
                  ? 'bg-white shadow-sm'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }
              `}
              style={{
                borderColor: selectedMetrics.includes(metric.id) 
                  ? metric.color 
                  : 'transparent'
              }}
            >
              <div 
                className="w-4 h-4 flex items-center justify-center rounded-sm"
                style={{ backgroundColor: metric.color }}
              >
                {selectedMetrics.includes(metric.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="font-medium text-gray-700">
                {metric.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
}