import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { DailyDataTable } from './DailyDataTable';
import { HourlyChart } from './HourlyChart';
import { TimePeriodCaptureChart } from './TimePeriodCaptureChart';
import { VisitorData, WeatherInfo } from '../types/restaurant';
import { useDailyData } from '../hooks/useDailyData';
import { formatDisplayDate, formatApiDate } from '../utils/dateFormat';
import { fetchWeatherData, getCachedWeatherData } from '../services/weatherService';
import { useEffect as useEffectLayout } from 'react';

interface DayAnalysisProps {
  data: VisitorData[];
  loading: boolean;
  error: string | null;
}

type BenchmarkType = 'none' | 'date' | 'average';

export function DayAnalysis({ data, loading, error }: DayAnalysisProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [benchmarkDate, setBenchmarkDate] = useState<Date | null>(null);
  const [benchmarkType, setBenchmarkType] = useState<BenchmarkType>('none');
  const [weatherData, setWeatherData] = useState<Map<string, WeatherInfo>>(new Map());
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const dailyData = useDailyData(data);

  // Add scroll event listener
  useEffectLayout(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate weekday averages when primary date changes
  const weekdayAverages = useMemo(() => {
    if (!selectedDate) return null;

    const selectedDay = selectedDate.getDay();
    const sameWeekdayData = data.filter(entry => {
      const entryDate = new Date(entry.timestamp.split(' ')[0].split('/').reverse().join('-'));
      return entryDate.getDay() === selectedDay;
    });

    // Group by hour
    const hourlyAverages = new Map<string, {
      enteringVisitors: number;
      leavingVisitors: number;
      enteringMen: number;
      leavingMen: number;
      enteringWomen: number;
      leavingWomen: number;
      enteringGroups: number;
      leavingGroups: number;
      passersby: number;
      count: number;
    }>();

    sameWeekdayData.forEach(entry => {
      const hour = entry.timestamp.split(' ')[1];
      const current = hourlyAverages.get(hour) || {
        enteringVisitors: 0,
        leavingVisitors: 0,
        enteringMen: 0,
        leavingMen: 0,
        enteringWomen: 0,
        leavingWomen: 0,
        enteringGroups: 0,
        leavingGroups: 0,
        passersby: 0,
        count: 0
      };

      hourlyAverages.set(hour, {
        enteringVisitors: current.enteringVisitors + entry.enteringVisitors,
        leavingVisitors: current.leavingVisitors + entry.leavingVisitors,
        enteringMen: current.enteringMen + entry.enteringMen,
        leavingMen: current.leavingMen + entry.leavingMen,
        enteringWomen: current.enteringWomen + entry.enteringWomen,
        leavingWomen: current.leavingWomen + entry.leavingWomen,
        enteringGroups: current.enteringGroups + entry.enteringGroups,
        leavingGroups: current.leavingGroups + entry.leavingGroups,
        passersby: current.passersby + entry.passersby,
        count: current.count + 1
      });
    });

    // Calculate averages
    const averages: VisitorData[] = Array.from(hourlyAverages.entries()).map(([hour, totals]) => ({
      timestamp: `${formatDisplayDate(selectedDate)} ${hour}`,
      enteringVisitors: Math.round(totals.enteringVisitors / totals.count),
      leavingVisitors: Math.round(totals.leavingVisitors / totals.count),
      enteringMen: Math.round(totals.enteringMen / totals.count),
      leavingMen: Math.round(totals.leavingMen / totals.count),
      enteringWomen: Math.round(totals.enteringWomen / totals.count),
      leavingWomen: Math.round(totals.leavingWomen / totals.count),
      enteringGroups: Math.round(totals.enteringGroups / totals.count),
      leavingGroups: Math.round(totals.leavingGroups / totals.count),
      passersby: Math.round(totals.passersby / totals.count)
    }));

    return averages;
  }, [selectedDate, data]);

  // Set default date to the first available date
  useEffect(() => {
    if (dailyData.length > 0 && !selectedDate) {
      setSelectedDate(dailyData[0].date);
    }
  }, [dailyData]);

  // Fetch weather data when dates change
  useEffect(() => {
    const getWeatherData = async () => {
      if (!selectedDate) return;

      const datesToFetch = [selectedDate];
      if (benchmarkType === 'date' && benchmarkDate) {
        datesToFetch.push(benchmarkDate);
      }

      setWeatherLoading(true);
      setWeatherError(null);

      try {
        const newWeatherData = new Map<string, WeatherData>();

        for (const date of datesToFetch) {
          // First try to get from cache
          const cachedWeather = getCachedWeatherData(date);
          if (cachedWeather) {
            newWeatherData.set(formatApiDate(date), cachedWeather);
            continue;
          }

          const { weatherMap, status, message } = await fetchWeatherData(date, date);
          
          if (status === 'error') {
            throw new Error(message);
          }

          weatherMap.forEach((value, key) => {
            newWeatherData.set(key, value);
          });
        }

        setWeatherData(newWeatherData);
      } catch (err) {
        setWeatherError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    getWeatherData();
  }, [selectedDate, benchmarkDate, benchmarkType]);

  // Get available dates for the date picker
  const availableDates = dailyData.map(day => day.date);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-center gap-2 text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  const getSelectedDayData = (date: Date | null, useAverages: boolean = false) => {
    if (!date) return [];

    if (useAverages && weekdayAverages) {
      return [{
        date,
        enteringVisitors: weekdayAverages.reduce((sum, entry) => sum + entry.enteringVisitors, 0),
        leavingVisitors: weekdayAverages.reduce((sum, entry) => sum + entry.leavingVisitors, 0),
        enteringMen: weekdayAverages.reduce((sum, entry) => sum + entry.enteringMen, 0),
        leavingMen: weekdayAverages.reduce((sum, entry) => sum + entry.leavingMen, 0),
        enteringWomen: weekdayAverages.reduce((sum, entry) => sum + entry.enteringWomen, 0),
        leavingWomen: weekdayAverages.reduce((sum, entry) => sum + entry.leavingWomen, 0),
        enteringGroups: weekdayAverages.reduce((sum, entry) => sum + entry.enteringGroups, 0),
        leavingGroups: weekdayAverages.reduce((sum, entry) => sum + entry.leavingGroups, 0),
        passersby: weekdayAverages.reduce((sum, entry) => sum + entry.passersby, 0),
        weather: weatherData.get(formatApiDate(date))
      }];
    }

    return dailyData
      .filter(day => formatDisplayDate(day.date) === formatDisplayDate(date))
      .map(day => ({
        ...day,
        weather: weatherData.get(formatApiDate(day.date))
      }));
  };

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDayName = selectedDate ? weekdays[selectedDate.getDay()] : '';

  return (
    <div className="flex flex-col pt-[200px]">
      {/* Fixed header */}
      <div 
        className={`fixed top-16 left-0 right-0 z-10 transition-all duration-200 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-sm shadow-md' 
            : 'bg-white'
        }`}
      >
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* Primary date selection */}
              <div className="flex items-center gap-4">
                <label htmlFor="date-select" className="font-medium text-gray-700 whitespace-nowrap">
                  Primary Date:
                </label>
                <DatePicker
                  id="date-select"
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    if (benchmarkType === 'date') {
                      setBenchmarkDate(null);
                    }
                  }}
                  includeDates={availableDates}
                  dateFormat="d/MM/yyyy"
                  placeholderText="Select a date"
                  className="px-3 py-2 border rounded-md"
                />
              </div>

              {/* Benchmark options */}
              <div className="flex items-center gap-6">
                {/* Benchmark date option */}
                <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={benchmarkType === 'date'}
                    onChange={(e) => {
                      setBenchmarkType(e.target.checked ? 'date' : 'none');
                      setBenchmarkDate(null);
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="font-medium text-gray-700">Benchmark Date</span>
                </label>

                {/* Weekday average option */}
                {selectedDate && (
                  <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={benchmarkType === 'average'}
                      onChange={(e) => {
                        setBenchmarkType(e.target.checked ? 'average' : 'none');
                        setBenchmarkDate(null);
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="font-medium text-gray-700">
                      {`${selectedDayName} Averages`}
                    </span>
                  </label>
                )}
              </div>

              {/* Benchmark date selection */}
              {benchmarkType === 'date' && (
                <div className="flex items-center gap-4">
                  <DatePicker
                    id="benchmark-date-select"
                    selected={benchmarkDate}
                    onChange={(date) => setBenchmarkDate(date)}
                    includeDates={availableDates}
                    dateFormat="d/MM/yyyy"
                    placeholderText="Select benchmark date"
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
              )}
            </div>

            {weatherError && (
              <div className="bg-red-50 p-4 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{weatherError}</span>
              </div>
            )}

            {selectedDate && dailyData.length > 0 && (
              <div className="w-full">
                <DailyDataTable 
                  data={[
                    ...getSelectedDayData(selectedDate),
                    ...(benchmarkType === 'date' && benchmarkDate ? getSelectedDayData(benchmarkDate) : []),
                    ...(benchmarkType === 'average' ? getSelectedDayData(selectedDate, true) : [])
                  ]}
                  rawData={benchmarkType === 'average' ? weekdayAverages || [] : data}
                  isBenchmarking={benchmarkType !== 'none'}
                  isWeekdayAverage={benchmarkType === 'average'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      {selectedDate ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hourly Traffic Overview
              </h3>
              <HourlyChart 
                data={data} 
                date={selectedDate}
                benchmarkDate={benchmarkType === 'date' ? benchmarkDate : undefined}
                benchmarkData={benchmarkType === 'average' ? weekdayAverages : undefined}
              />
            </div>
          </div>

          {/* New Time Period Capture Chart */}
          <TimePeriodCaptureChart
            data={data}
            date={selectedDate}
            benchmarkDate={benchmarkType === 'date' ? benchmarkDate : undefined}
            benchmarkData={benchmarkType === 'average' ? weekdayAverages : undefined}
          />
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Select a date to view the analysis
        </div>
      )}

      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="text-xs text-gray-500 space-y-1">
          <p>* Capture Rate is calculated using data from business hours only: Mon-Fri 7:00-20:00, Sat 8:00-20:00, Sun 8:00-16:00</p>
          <p>** Conversion shows the percentage of entering visitors who came in groups (capped at 100%)</p>
          <p>*** Dwell Time shows how long visitors typically stay, calculated from average live visitors and total daily visitors (multiplied by 10)</p>
          <p>**** Data Accuracy shows how well in/out counts match (100% = perfect match, lower values indicate discrepancy)</p>
          {benchmarkType !== 'none' && (
            <p className="mt-2">
              When comparing data: <span className="text-green-600">Green</span> indicates higher value and <span className="text-orange-500">orange</span> indicates lower value in benchmarking comparison
            </p>
          )}
        </div>
      </div>
    </div>
  );
}