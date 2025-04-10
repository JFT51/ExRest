/**
 * Custom Analytics Tab JavaScript
 * Separate script file to avoid conflicts with other scripts
 */

// Initialize chart variable
let customAnalyticsChart = null;

// Initialize state object
const customAnalyticsState = {
    period: 'days',
    startHour: '00:00',
    endHour: '23:00',
    startDate: null,
    endDate: null,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    selectedKPIs: ['visitorsIn'],
    showDataLabels: true,
    chartData: [] // Initialize as empty array instead of null
};

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing analytics
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready for custom analytics');

            // Initialize analytics components
            initializeCustomAnalytics();

            // Add window resize event listener for responsive behavior
            window.addEventListener('resize', handleWindowResize);
        }
    }, 100);
});

// Handle window resize events for responsive behavior
function handleWindowResize() {
    // Debounce the resize event to prevent excessive redraws
    if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
    }

    window.resizeTimeout = setTimeout(() => {
        // If chart exists and we're on the custom analytics tab, update it
        if (customAnalyticsChart && document.getElementById('custom-analytics').classList.contains('active')) {
            customAnalyticsChart.resize();
            customAnalyticsChart.update();
        }
    }, 250);
}

// Initialize all custom analytics components
function initializeCustomAnalytics() {
    // Set default date range (last 30 days)
    initializeDateRange();

    // Initialize hour selectors
    initializeHourSelectors();

    // Initialize event listeners
    initializeEventListeners();

    // Initialize data labels toggle
    initializeDataLabelsToggle();
}

// Initialize date range selectors
function initializeDateRange() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    customAnalyticsState.startDate = thirtyDaysAgo;
    customAnalyticsState.endDate = today;
}

// Initialize hour selectors
function initializeHourSelectors() {
    const startHourSelect = document.getElementById('startHour');
    const endHourSelect = document.getElementById('endHour');

    // Clear existing options
    startHourSelect.innerHTML = '';
    endHourSelect.innerHTML = '';

    // Add hour options (00:00 to 23:00)
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = `${hour}:00`;
        option.textContent = `${hour}:00`;

        startHourSelect.appendChild(option.cloneNode(true));
        endHourSelect.appendChild(option);
    }

    // Set default values
    startHourSelect.value = customAnalyticsState.startHour;
    endHourSelect.value = customAnalyticsState.endHour;
}

// Initialize event listeners
function initializeEventListeners() {
    // Date range selectors
    document.getElementById('startDate').addEventListener('change', (e) => {
        customAnalyticsState.startDate = new Date(e.target.value);
    });

    document.getElementById('endDate').addEventListener('change', (e) => {
        customAnalyticsState.endDate = new Date(e.target.value);
    });

    // Period radio buttons
    document.querySelectorAll('input[name="period"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            customAnalyticsState.period = e.target.value;
        });
    });

    // Hour range selectors
    document.getElementById('startHour').addEventListener('change', (e) => {
        customAnalyticsState.startHour = e.target.value;
    });

    document.getElementById('endHour').addEventListener('change', (e) => {
        customAnalyticsState.endHour = e.target.value;
    });

    // Day checkboxes
    document.querySelectorAll('input[name="day"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedDays);
    });

    // Select/Deselect all days buttons
    document.getElementById('selectAllDays').addEventListener('click', () => {
        document.querySelectorAll('input[name="day"]').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedDays();
    });

    document.getElementById('deselectAllDays').addEventListener('click', () => {
        document.querySelectorAll('input[name="day"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedDays();
    });

    // KPI checkboxes
    document.querySelectorAll('input[name="kpi"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedKPIs);
    });

    // Select/Deselect all KPIs buttons
    document.getElementById('selectAllKPIs').addEventListener('click', () => {
        document.querySelectorAll('input[name="kpi"]').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedKPIs();
    });

    document.getElementById('deselectAllKPIs').addEventListener('click', () => {
        document.querySelectorAll('input[name="kpi"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedKPIs();
    });

    // Generate chart button
    document.getElementById('generateChart').addEventListener('click', generateChart);
}

// Update selected days in state
function updateSelectedDays() {
    customAnalyticsState.days = Array.from(document.querySelectorAll('input[name="day"]:checked'))
        .map(checkbox => checkbox.value);
}

// Update selected KPIs in state
function updateSelectedKPIs() {
    customAnalyticsState.selectedKPIs = Array.from(document.querySelectorAll('input[name="kpi"]:checked'))
        .map(checkbox => checkbox.value);
}

// Initialize data labels toggle
function initializeDataLabelsToggle() {
    const toggle = document.getElementById('dataLabelsToggle');
    const status = document.getElementById('dataLabelsStatus');

    toggle.addEventListener('change', () => {
        customAnalyticsState.showDataLabels = toggle.checked;
        status.textContent = toggle.checked ? 'Show Data Labels' : 'Hide Data Labels';
    });
}

// Show loading indicator
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('analyticsLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    // Hide chart container and no-data message
    document.querySelector('#custom-analytics .chart-container').style.display = 'none';
    document.querySelector('#custom-analytics .no-data-message').style.display = 'none';
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('analyticsLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Update progress text
function updateProgressText(text) {
    const progressText = document.querySelector('#analyticsLoadingIndicator .progress-text');
    if (progressText) {
        progressText.textContent = text;
    }
}

// Generate chart based on selected options
function generateChart() {
    // Check if at least one KPI is selected
    if (customAnalyticsState.selectedKPIs.length === 0) {
        alert('Please select at least one KPI to display');
        return;
    }

    // Show loading indicator
    showLoadingIndicator();

    // Use setTimeout to allow the loading indicator to render
    setTimeout(() => {
        try {
            // Update progress text
            updateProgressText('Preparing data based on selected period...');

            // Prepare data based on selected period
            prepareChartData();

            // Update progress text
            updateProgressText('Creating chart visualization...');

            // Create or update chart
            createChart();

            // Show chart container and hide no-data message
            document.querySelector('#custom-analytics .chart-container').style.display = 'block';
            document.querySelector('#custom-analytics .no-data-message').style.display = 'none';

            // Add download buttons
            if (typeof addDownloadButtons === 'function') {
                addDownloadButtons('analyticsChart');
            }

            // Hide loading indicator
            hideLoadingIndicator();
        } catch (error) {
            console.error('Error generating chart:', error);
            hideLoadingIndicator();
            alert('An error occurred while generating the chart. Please try again.');
        }
    }, 100);
}

// Prepare chart data based on selected options
function prepareChartData() {
    let data = [];

    try {
        switch (customAnalyticsState.period) {
            case 'hours':
                updateProgressText('Processing hourly data...');
                data = prepareHourlyData();
                break;
            case 'days':
                updateProgressText('Processing daily data...');
                data = prepareDailyData();
                break;
            case 'weeks':
                updateProgressText('Processing weekly data...');
                data = prepareWeeklyData();
                break;
            case 'months':
                updateProgressText('Processing monthly data...');
                data = prepareMonthlyData();
                break;
        }

        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.warn('Data preparation did not return an array. Using empty array instead.');
            data = [];
        }
    } catch (error) {
        console.error('Error preparing chart data:', error);
        data = [];
    }

    updateProgressText('Finalizing data preparation...');
    customAnalyticsState.chartData = data;
}

// Prepare hourly data
function prepareHourlyData() {
    if (!window.dashboardState || !window.dashboardState.hourData) {
        console.warn('No hour data available for hourly chart');
        return [];
    }

    console.log('Preparing hourly data...');
    console.log('Date range:', customAnalyticsState.startDate, 'to', customAnalyticsState.endDate);
    console.log('Hour range:', customAnalyticsState.startHour, 'to', customAnalyticsState.endHour);
    console.log('Selected days:', customAnalyticsState.days);
    console.log('Total hour data points:', window.dashboardState.hourData.length);

    // Ensure date range is valid
    if (!customAnalyticsState.startDate || !customAnalyticsState.endDate) {
        console.warn('Invalid date range for hourly chart');
        return [];
    }

    try {
        // Filter by date range, selected days and hour range
        const filteredData = window.dashboardState.hourData.filter(hour => {
            try {
                // Skip if hour data is invalid
                if (!hour.timestamp) {
                    return false;
                }

                // Ensure timestamp is a Date object
                const date = hour.timestamp instanceof Date ?
                    hour.timestamp : new Date(hour.timestamp);

                // Skip if date is invalid
                if (isNaN(date.getTime())) {
                    console.warn('Invalid timestamp in hour data:', hour.timestamp);
                    return false;
                }

                const dayName = getDayName(date.getDay()).toLowerCase();
                const hourStr = date.getHours().toString().padStart(2, '0') + ':00';

                // Check if the hour is within the selected range
                return date >= customAnalyticsState.startDate &&
                       date <= customAnalyticsState.endDate &&
                       customAnalyticsState.days.includes(dayName) &&
                       hourStr >= customAnalyticsState.startHour &&
                       hourStr <= customAnalyticsState.endHour;
            } catch (error) {
                console.error('Error filtering hour data:', error, hour);
                return false;
            }
        });

        console.log('Filtered hour data points:', filteredData.length);

        // Sort by timestamp
        const result = filteredData.sort((a, b) => {
            try {
                const dateA = a.timestamp instanceof Date ?
                    a.timestamp : new Date(a.timestamp);
                const dateB = b.timestamp instanceof Date ?
                    b.timestamp : new Date(b.timestamp);

                return dateA - dateB;
            } catch (error) {
                console.error('Error sorting hour data:', error);
                return 0;
            }
        });

        if (result.length > 0) {
            console.log('Sample hour data:', result[0]);
        }

        return result;
    } catch (error) {
        console.error('Critical error in prepareHourlyData:', error);
        return [];
    }
}

// Prepare daily data
function prepareDailyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) {
        console.warn('No day data available for daily chart');
        return [];
    }

    console.log('Preparing daily data...');
    console.log('Date range:', customAnalyticsState.startDate, 'to', customAnalyticsState.endDate);
    console.log('Selected days:', customAnalyticsState.days);
    console.log('Total day data points:', window.dashboardState.dayData.length);

    // Ensure date range is valid
    if (!customAnalyticsState.startDate || !customAnalyticsState.endDate) {
        console.warn('Invalid date range for daily chart');
        return [];
    }

    try {
        // Filter by date range and selected days
        const filteredData = window.dashboardState.dayData.filter(day => {
            try {
                // Skip if day data is invalid
                if (!day.date) {
                    return false;
                }

                // Ensure date is a Date object
                const date = day.date instanceof Date ?
                    day.date : new Date(day.date);

                // Skip if date is invalid
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date in day data:', day.date);
                    return false;
                }

                const dayName = getDayName(date.getDay()).toLowerCase();

                // Check if the day is within the selected range
                return date >= customAnalyticsState.startDate &&
                       date <= customAnalyticsState.endDate &&
                       customAnalyticsState.days.includes(dayName);
            } catch (error) {
                console.error('Error filtering day data:', error, day);
                return false;
            }
        });

        console.log('Filtered day data points:', filteredData.length);

        // Sort by date
        const result = filteredData.sort((a, b) => {
            try {
                const dateA = a.date instanceof Date ?
                    a.date : new Date(a.date);
                const dateB = b.date instanceof Date ?
                    b.date : new Date(b.date);

                return dateA - dateB;
            } catch (error) {
                console.error('Error sorting day data:', error);
                return 0;
            }
        });

        if (result.length > 0) {
            console.log('Sample day data:', result[0]);
        }

        return result;
    } catch (error) {
        console.error('Critical error in prepareDailyData:', error);
        return [];
    }
}

// Prepare weekly data
function prepareWeeklyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) {
        console.warn('No day data available for weekly chart');
        return [];
    }

    console.log('Preparing weekly data...');
    console.log('Date range:', customAnalyticsState.startDate, 'to', customAnalyticsState.endDate);
    console.log('Selected days:', customAnalyticsState.days);
    console.log('Total day data points:', window.dashboardState.dayData.length);

    // Ensure date range is valid
    if (!customAnalyticsState.startDate || !customAnalyticsState.endDate) {
        console.warn('Invalid date range for weekly chart');
        return [];
    }

    try {
        // Group data by week
        const weekData = {};

        // Create a map of all weeks in the date range
        // Clone dates to avoid modifying the original state
        let currentDate = new Date(customAnalyticsState.startDate);
        const endDate = new Date(customAnalyticsState.endDate);

        // Ensure dates are valid
        if (isNaN(currentDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid date range for weekly chart');
            return [];
        }

        // Pre-populate weeks to ensure we have entries even for weeks with no data
        while (currentDate <= endDate) {
            try {
                const weekYear = getWeekYear(currentDate);
                const weekKey = `${weekYear.year}-W${weekYear.week}`;

                if (!weekData[weekKey]) {
                    const startOfWeek = getStartOfWeek(currentDate);
                    weekData[weekKey] = {
                        weekNumber: weekYear.week,
                        year: weekYear.year,
                        startDate: startOfWeek,
                        count: 0,
                        visitorsIn: 0,
                        passersby: 0,
                        visitorsOut: 0,
                        menIn: 0,
                        menOut: 0,
                        womenIn: 0,
                        womenOut: 0,
                        groupIn: 0,
                        groupOut: 0,
                        dwellTimeSum: 0,
                        weatherSum: 0
                    };
                }

                // Move to next week
                const nextDate = new Date(currentDate);
                nextDate.setDate(nextDate.getDate() + 7);

                // Check for infinite loop (in case of date calculation errors)
                if (nextDate <= currentDate) {
                    console.error('Date calculation error in prepareWeeklyData');
                    break;
                }

                currentDate = nextDate;
            } catch (weekError) {
                console.error('Error processing week:', weekError);
                // Move to next week even if there's an error
                currentDate.setDate(currentDate.getDate() + 7);
            }
        }

        console.log('Pre-populated week keys:', Object.keys(weekData));

        // Now add actual data to the weeks
        window.dashboardState.dayData.forEach(day => {
            try {
                // Skip if day data is invalid
                if (!day.date) return;

                const date = new Date(day.date);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date in day data:', day.date);
                    return;
                }

                const dayName = getDayName(date.getDay()).toLowerCase();

                // Skip if outside date range or day not selected
                if (date < customAnalyticsState.startDate ||
                    date > customAnalyticsState.endDate ||
                    !customAnalyticsState.days.includes(dayName)) {
                    return;
                }

                // Get week number and year
                const weekYear = getWeekYear(date);
                console.log(`Processing day ${day.date}, calculated week: ${weekYear.week}, year: ${weekYear.year}`);
                const weekKey = `${weekYear.year}-W${weekYear.week}`;

                // This should always exist due to pre-population, but check just in case
                if (!weekData[weekKey]) {
                    const startOfWeek = getStartOfWeek(date);
                    weekData[weekKey] = {
                        weekNumber: weekYear.week,
                        year: weekYear.year,
                        startDate: startOfWeek,
                        count: 0,
                        visitorsIn: 0,
                        passersby: 0,
                        visitorsOut: 0,
                        menIn: 0,
                        menOut: 0,
                        womenIn: 0,
                        womenOut: 0,
                        groupIn: 0,
                        groupOut: 0,
                        dwellTimeSum: 0,
                        weatherSum: 0
                    };
                }

                // Safely parse numeric values
                const safeParseInt = (value) => {
                    const parsed = parseInt(value);
                    return isNaN(parsed) ? 0 : parsed;
                };

                const safeParseFloat = (value) => {
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? 0 : parsed;
                };

                // Add data to week
                weekData[weekKey].visitorsIn += safeParseInt(day.visitorsIn);
                weekData[weekKey].passersby += safeParseInt(day.passersby);
                weekData[weekKey].visitorsOut += safeParseInt(day.visitorsOut);
                weekData[weekKey].menIn += safeParseInt(day.menIn);
                weekData[weekKey].menOut += safeParseInt(day.menOut);
                weekData[weekKey].womenIn += safeParseInt(day.womenIn);
                weekData[weekKey].womenOut += safeParseInt(day.womenOut);
                weekData[weekKey].groupIn += safeParseInt(day.groupIn);
                weekData[weekKey].groupOut += safeParseInt(day.groupOut);
                weekData[weekKey].dwellTimeSum += safeParseFloat(day.dwellTime);
                weekData[weekKey].weatherSum += safeParseFloat(day.weather);
                weekData[weekKey].count++;
            } catch (dayError) {
                console.error('Error processing day data:', dayError, day);
            }
        });

        // Calculate averages and percentages
        Object.values(weekData).forEach(week => {
            try {
                week.captureRate = week.passersby > 0 ? (week.visitorsIn / week.passersby) * 100 : 0;
                week.conversionRate = week.visitorsIn > 0 ? (week.groupIn / week.visitorsIn) * 100 : 0;
                week.dwellTime = week.count > 0 ? week.dwellTimeSum / week.count : 0;
                week.weather = week.count > 0 ? week.weatherSum / week.count : 0;
            } catch (calcError) {
                console.error('Error calculating week metrics:', calcError, week);
                // Set default values if calculation fails
                week.captureRate = 0;
                week.conversionRate = 0;
                week.dwellTime = 0;
                week.weather = 0;
            }
        });

        // Convert to array and sort by date
        const result = Object.values(weekData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.weekNumber - b.weekNumber;
        });

        console.log('Weekly data result:', result);
        console.log('Number of weeks found:', result.length);

        // Enhanced debugging for week data
        if (result.length > 0) {
            console.log('Sample week data:', result[0]);

            // Log all week data for debugging
            console.log('All week data:');
            result.forEach((week, index) => {
                console.log(`Week ${index + 1}:`, {
                    weekNumber: week.weekNumber,
                    year: week.year,
                    visitorsIn: week.visitorsIn,
                    passersby: week.passersby,
                    // Add other important properties as needed
                });
            });

            // Check if any week has data
            const hasData = result.some(week => week.visitorsIn > 0 || week.passersby > 0);
            console.log('Has any week with data:', hasData);
        }

        return result;
    } catch (error) {
        console.error('Critical error in prepareWeeklyData:', error);
        return [];
    }
}

// Prepare monthly data
function prepareMonthlyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) {
        console.warn('No day data available for monthly chart');
        return [];
    }

    console.log('Preparing monthly data...');
    console.log('Date range:', customAnalyticsState.startDate, 'to', customAnalyticsState.endDate);
    console.log('Selected days:', customAnalyticsState.days);

    // Ensure date range is valid
    if (!customAnalyticsState.startDate || !customAnalyticsState.endDate) {
        console.warn('Invalid date range for monthly chart');
        return [];
    }

    try {
        // Group data by month
        const monthData = {};

        // Pre-populate months to ensure we have entries even for months with no data
        let currentDate = new Date(customAnalyticsState.startDate);
        const endDate = new Date(customAnalyticsState.endDate);

        // Ensure dates are valid
        if (isNaN(currentDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid date range for monthly chart');
            return [];
        }

        // Set to first day of month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Pre-populate months
        while (currentDate <= endDate) {
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const monthKey = `${year}-${month + 1}`;

                if (!monthData[monthKey]) {
                    monthData[monthKey] = {
                        month: month,
                        year: year,
                        date: new Date(year, month, 1),
                        count: 0,
                        visitorsIn: 0,
                        passersby: 0,
                        visitorsOut: 0,
                        menIn: 0,
                        menOut: 0,
                        womenIn: 0,
                        womenOut: 0,
                        groupIn: 0,
                        groupOut: 0,
                        dwellTimeSum: 0,
                        weatherSum: 0
                    };
                }

                // Move to next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            } catch (monthError) {
                console.error('Error processing month:', monthError);
                // Move to next month even if there's an error
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        console.log('Pre-populated month keys:', Object.keys(monthData));

        // Now add actual data to the months
        window.dashboardState.dayData.forEach(day => {
            try {
                // Skip if day data is invalid
                if (!day.date) return;

                const date = new Date(day.date);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date in day data:', day.date);
                    return;
                }

                const dayName = getDayName(date.getDay()).toLowerCase();

                // Skip if outside date range or day not selected
                if (date < customAnalyticsState.startDate ||
                    date > customAnalyticsState.endDate ||
                    !customAnalyticsState.days.includes(dayName)) return;

                // Get month and year
                const year = date.getFullYear();
                const month = date.getMonth();
                const monthKey = `${year}-${month + 1}`;

                // This should always exist due to pre-population, but check just in case
                if (!monthData[monthKey]) {
                    monthData[monthKey] = {
                        month: month,
                        year: year,
                        date: new Date(year, month, 1),
                        count: 0,
                        visitorsIn: 0,
                        passersby: 0,
                        visitorsOut: 0,
                        menIn: 0,
                        menOut: 0,
                        womenIn: 0,
                        womenOut: 0,
                        groupIn: 0,
                        groupOut: 0,
                        dwellTimeSum: 0,
                        weatherSum: 0
                    };
                }

                // Safely parse numeric values
                const safeParseInt = (value) => {
                    const parsed = parseInt(value);
                    return isNaN(parsed) ? 0 : parsed;
                };

                const safeParseFloat = (value) => {
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? 0 : parsed;
                };

                // Add data to month
                monthData[monthKey].visitorsIn += safeParseInt(day.visitorsIn);
                monthData[monthKey].passersby += safeParseInt(day.passersby);
                monthData[monthKey].visitorsOut += safeParseInt(day.visitorsOut);
                monthData[monthKey].menIn += safeParseInt(day.menIn);
                monthData[monthKey].menOut += safeParseInt(day.menOut);
                monthData[monthKey].womenIn += safeParseInt(day.womenIn);
                monthData[monthKey].womenOut += safeParseInt(day.womenOut);
                monthData[monthKey].groupIn += safeParseInt(day.groupIn);
                monthData[monthKey].groupOut += safeParseInt(day.groupOut);
                monthData[monthKey].dwellTimeSum += safeParseFloat(day.dwellTime);
                monthData[monthKey].weatherSum += safeParseFloat(day.weather);
                monthData[monthKey].count++;
            } catch (dayError) {
                console.error('Error processing day data for month:', dayError, day);
            }
        });

        // Calculate averages and percentages
        Object.values(monthData).forEach(month => {
            try {
                month.captureRate = month.passersby > 0 ? (month.visitorsIn / month.passersby) * 100 : 0;
                month.conversionRate = month.visitorsIn > 0 ? (month.groupIn / month.visitorsIn) * 100 : 0;
                month.dwellTime = month.count > 0 ? month.dwellTimeSum / month.count : 0;
                month.weather = month.count > 0 ? month.weatherSum / month.count : 0;
            } catch (calcError) {
                console.error('Error calculating month metrics:', calcError, month);
                // Set default values if calculation fails
                month.captureRate = 0;
                month.conversionRate = 0;
                month.dwellTime = 0;
                month.weather = 0;
            }
        });

        // Convert to array and sort by date
        const result = Object.values(monthData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        console.log('Monthly data result:', result);
        console.log('Number of months found:', result.length);
        if (result.length > 0) {
            console.log('Sample month data:', result[0]);
        }

        return result;
    } catch (error) {
        console.error('Critical error in prepareMonthlyData:', error);
        return [];
    }
}

// Create or update the chart
function createChart() {
    updateProgressText('Preparing chart canvas...');

    // Properly destroy existing chart if it exists
    if (customAnalyticsChart) {
        try {
            customAnalyticsChart.destroy();
        } catch (error) {
            console.warn('Error destroying existing chart:', error);
        }
        customAnalyticsChart = null;
    }

    // Clear any Chart.js cached instances for this canvas
    const chartInstance = Chart.getChart('analyticsChart');
    if (chartInstance) {
        try {
            chartInstance.destroy();
        } catch (error) {
            console.warn('Error destroying cached chart instance:', error);
        }
    }

    // Get a fresh context from the canvas
    const canvas = document.getElementById('analyticsChart');
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset canvas dimensions to force a complete redraw
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    // Prepare datasets
    updateProgressText('Preparing chart datasets...');
    const datasets = [];
    const barDatasets = [];
    const lineDatasets = [];

    // Define colors for each KPI
    const colors = {
        visitorsIn: { bg: 'rgba(45, 107, 34, 0.7)', border: 'rgb(45, 107, 34)' },
        passersby: { bg: 'rgba(139, 69, 19, 0.7)', border: 'rgb(139, 69, 19)' },
        visitorsOut: { bg: 'rgba(70, 130, 60, 0.7)', border: 'rgb(70, 130, 60)' },
        menIn: { bg: 'rgba(0, 122, 255, 0.7)', border: 'rgb(0, 122, 255)' },
        menOut: { bg: 'rgba(30, 144, 255, 0.7)', border: 'rgb(30, 144, 255)' },
        womenIn: { bg: 'rgba(255, 45, 85, 0.7)', border: 'rgb(255, 45, 85)' },
        womenOut: { bg: 'rgba(255, 105, 180, 0.7)', border: 'rgb(255, 105, 180)' },
        groupIn: { bg: 'rgba(88, 86, 214, 0.7)', border: 'rgb(88, 86, 214)' },
        groupOut: { bg: 'rgba(118, 116, 244, 0.7)', border: 'rgb(118, 116, 244)' },
        captureRate: { bg: 'rgba(243, 151, 0, 0.5)', border: 'rgb(243, 151, 0)' },
        conversionRate: { bg: 'rgba(52, 199, 89, 0.5)', border: 'rgb(52, 199, 89)' },
        dwellTime: { bg: 'rgba(175, 82, 222, 0.5)', border: 'rgb(175, 82, 222)' },
        weather: { bg: 'rgba(90, 200, 250, 0.5)', border: 'rgb(90, 200, 250)' }
    };

    // Bar datasets (visitors, passersby, etc.)
    const barKPIs = ['visitorsIn', 'passersby', 'visitorsOut', 'menIn', 'menOut', 'womenIn', 'womenOut', 'groupIn', 'groupOut'];

    try {
        barKPIs.forEach(kpi => {
            if (customAnalyticsState.selectedKPIs.includes(kpi)) {
                // Ensure chartData is an array before mapping
                if (!Array.isArray(customAnalyticsState.chartData)) {
                    console.warn('chartData is not an array in createChart. Resetting to empty array.');
                    customAnalyticsState.chartData = [];
                }

                // Add debugging for chart data
                if (customAnalyticsState.period === 'weeks') {
                    console.log(`Creating dataset for KPI: ${kpi}`);
                    console.log('Chart data length:', customAnalyticsState.chartData.length);
                }

                barDatasets.push({
                    label: getKPILabel(kpi),
                    data: customAnalyticsState.chartData.map((item, index) => {
                        // Ensure item is an object before accessing properties
                        if (item && typeof item === 'object') {
                            const value = item[kpi] || 0;
                            // Add debugging for week period
                            if (customAnalyticsState.period === 'weeks') {
                                console.log(`Data point for ${kpi} at index ${index}:`, value);
                            }
                            return value;
                        }
                        return 0;
                    }),
                    backgroundColor: colors[kpi].bg,
                    borderColor: colors[kpi].border,
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y',
                    type: 'bar',
                datalabels: {
                    display: function(context) {
                        // Hide data labels on small screens regardless of user preference
                        if (window.innerWidth < 576) return false;
                        // Otherwise respect user preference but hide zero values
                        return customAnalyticsState.showDataLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) {
                        // Check if value is a valid number
                        if (value === null || value === undefined || isNaN(value) || value <= 0) {
                            return '';
                        }
                        // Ensure value is treated as a number
                        const numValue = Number(value);
                        return Math.round(numValue).toLocaleString();
                    },
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: window.innerWidth < 768 ? 3 : 6,
                    color: colors[kpi].border
                }
            });
        }
    });
    } catch (error) {
        console.error('Error creating bar datasets:', error);
        // Continue with empty datasets rather than failing completely
    }

    // Line datasets (capture rate, conversion rate, etc.)
    const lineKPIs = ['captureRate', 'conversionRate', 'dwellTime', 'weather'];

    try {
        lineKPIs.forEach(kpi => {
            if (customAnalyticsState.selectedKPIs.includes(kpi)) {
                // Ensure chartData is an array before mapping
                if (!Array.isArray(customAnalyticsState.chartData)) {
                    console.warn('chartData is not an array in createChart. Resetting to empty array.');
                    customAnalyticsState.chartData = [];
                }

                lineDatasets.push({
                    label: getKPILabel(kpi),
                    data: customAnalyticsState.chartData.map(item => {
                        // Ensure item is an object before accessing properties
                        if (item && typeof item === 'object') {
                            return item[kpi] || 0;
                        }
                        return 0;
                    }),
                    backgroundColor: colors[kpi].bg,
                    borderColor: colors[kpi].border,
                    borderWidth: 2,
                    fill: false,
                tension: 0.2,
                yAxisID: kpi === 'dwellTime' ? 'y2' : (kpi === 'weather' ? 'y3' : 'y1'),
                type: 'line',
                datalabels: {
                    display: function(context) {
                        // Hide data labels on small screens regardless of user preference
                        if (window.innerWidth < 576) return false;
                        // Otherwise respect user preference but hide zero values
                        return customAnalyticsState.showDataLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) {
                        // Check if value is a valid number
                        if (value === null || value === undefined || isNaN(value) || value <= 0) {
                            return '';
                        }
                        // Ensure value is treated as a number
                        const numValue = Number(value);
                        if (kpi === 'captureRate' || kpi === 'conversionRate') {
                            return numValue.toFixed(2) + '%';
                        }
                        return Math.round(numValue).toLocaleString();
                    },
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: window.innerWidth < 768 ? 3 : 6,
                    color: colors[kpi].border
                }
            });
        }
    });
    } catch (error) {
        console.error('Error creating line datasets:', error);
        // Continue with empty datasets rather than failing completely
    }

    // Combine datasets
    datasets.push(...barDatasets, ...lineDatasets);

    // Prepare labels based on period
    let labels = [];
    try {
        // Ensure chartData is an array before mapping
        if (!Array.isArray(customAnalyticsState.chartData)) {
            console.warn('chartData is not an array when preparing labels. Resetting to empty array.');
            customAnalyticsState.chartData = [];
        }

        // For debugging
        console.log('Chart data period:', customAnalyticsState.period);
        console.log('Chart data length:', customAnalyticsState.chartData.length);
        if (customAnalyticsState.chartData.length > 0) {
            console.log('First item sample:', JSON.stringify(customAnalyticsState.chartData[0]));
        }

        labels = customAnalyticsState.chartData.map((item, index) => {
            try {
                // Ensure item is an object before accessing properties
                if (!item || typeof item !== 'object') {
                    console.warn(`Invalid chart data item at index ${index}`);
                    return '';
                }

                switch (customAnalyticsState.period) {
                    case 'hours':
                        if (!item.timestamp) {
                            console.warn(`Missing timestamp in hour data at index ${index}`);
                            return `Hour ${index + 1}`;
                        }

                        const hourDate = item.timestamp instanceof Date ?
                            item.timestamp : new Date(item.timestamp);

                        if (isNaN(hourDate.getTime())) {
                            console.warn(`Invalid timestamp in hour data at index ${index}: ${item.timestamp}`);
                            return `Hour ${index + 1}`;
                        }

                        return hourDate;

                    case 'days':
                        if (!item.date) {
                            console.warn(`Missing date in day data at index ${index}`);
                            return `Day ${index + 1}`;
                        }

                        const dayDate = item.date instanceof Date ?
                            item.date : new Date(item.date);

                        if (isNaN(dayDate.getTime())) {
                            console.warn(`Invalid date in day data at index ${index}: ${item.date}`);
                            return `Day ${index + 1}`;
                        }

                        return dayDate;

                    case 'weeks':
                        // Format week label properly
                        if (item.weekNumber === undefined || item.year === undefined) {
                            console.warn(`Missing week number or year in week data at index ${index}`);
                            return `Week ${index + 1}`;
                        }

                        // Log the week data for debugging
                        console.log(`Week data at index ${index}:`, item);

                        // Format as "Week X YYYY" for better readability
                        return `Week ${item.weekNumber} ${item.year}`;

                    case 'months':
                        // For months, use a proper date object if available, otherwise create a month string
                        if (item.date) {
                            const monthDate = item.date instanceof Date ?
                                item.date : new Date(item.date);

                            if (isNaN(monthDate.getTime())) {
                                console.warn(`Invalid date in month data at index ${index}: ${item.date}`);
                                return `Month ${index + 1}`;
                            }

                            return monthDate;
                        } else if (item.month !== undefined && item.year !== undefined) {
                            // Create a string representation for the month
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthIndex = typeof item.month === 'number' ? item.month : parseInt(item.month);

                            if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
                                console.warn(`Invalid month index in month data at index ${index}: ${item.month}`);
                                return `Month ${index + 1}`;
                            }

                            return `${monthNames[monthIndex]} ${item.year}`;
                        }

                        console.warn(`Missing month data at index ${index}`);
                        return `Month ${index + 1}`;

                    default:
                        console.warn(`Unknown period type: ${customAnalyticsState.period}`);
                        return `Item ${index + 1}`;
                }
            } catch (itemError) {
                console.error(`Error processing chart label at index ${index}:`, itemError, item);
                return `Item ${index + 1}`;
            }
        });

        // For debugging
        console.log('Generated labels:', labels);
    } catch (error) {
        console.error('Error preparing chart labels:', error);
        labels = [];
    }

    // Create chart with gradient effects for a more beautiful user experience
    updateProgressText('Rendering chart with beautiful gradients...');
    try {
        customAnalyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            // Responsive configuration
            onResize: function(chart, size) {
                // Adjust font sizes based on screen width
                const fontSize = size.width < 768 ? (size.width < 576 ? 10 : 12) : 14;
                chart.options.scales.x.ticks.font.size = fontSize;
                chart.options.scales.y.ticks.font.size = fontSize;

                // Adjust padding and rotation for small screens
                if (size.width < 576) {
                    chart.options.scales.x.ticks.maxRotation = 90;
                    chart.options.layout.padding = 5;
                } else {
                    chart.options.scales.x.ticks.maxRotation = 45;
                    chart.options.layout.padding = 10;
                }
            },
            layout: {
                padding: 10
            },
            plugins: {
                legend: {
                    display: false, // Remove legends as per user preference
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }

                            const value = context.parsed.y;
                            // Check if value is a valid number
                            if (value === null || value === undefined || isNaN(value)) {
                                label += '';
                            } else {
                                // Ensure value is treated as a number
                                const numValue = Number(value);
                                if (context.dataset.yAxisID === 'y1') {
                                    label += numValue.toFixed(2) + '%';
                                } else {
                                    label += Math.round(numValue).toLocaleString();
                                }
                            }

                            return label;
                        }
                    }
                },
                title: {
                    display: false, // Don't show titles as per user preference
                }
            },
            scales: {
                x: {
                    // Use category type for weeks, time type for other periods
                    type: customAnalyticsState.period === 'weeks' ? 'category' : 'time',
                    // Time configuration for non-week periods
                    time: {
                        unit: getTimeUnit(),
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'ddd dd MMM yyyy',
                            month: 'MMM yyyy'
                        },
                        // Only apply time parsing for non-week periods
                        parser: function(value) {
                            if (customAnalyticsState.period === 'weeks') {
                                return null; // Don't parse for weeks
                            }
                            return value;
                        }
                    },
                    // Special handling for all period types
                    afterTickToLabelConversion: function(context) {
                        if (customAnalyticsState.period === 'weeks') {
                            // For weeks, ensure we use the original string labels
                            context.ticks.forEach((tick, index) => {
                                if (index < labels.length) {
                                    tick.label = labels[index];
                                }
                            });
                        }
                    },
                    title: {
                        display: true,
                        text: getXAxisTitle(),
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 14
                        },
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 768 ? 8 : 12
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Visitors',
                        color: 'rgb(45, 107, 34)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        precision: 0,
                        callback: function(value) {
                            // Check if value is a valid number
                            if (value === null || value === undefined || isNaN(value)) {
                                return '';
                            }
                            // Ensure value is treated as a number
                            const numValue = Number(value);
                            return Math.round(numValue).toLocaleString();
                        },
                        font: {
                            size: 14
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    },
                    // Adapt to available space
                    adapters: {
                        tick: {
                            format: function(value) {
                                // For small screens, abbreviate large numbers
                                if (window.innerWidth < 576 && value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'k';
                                }
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage (%)',
                        color: 'rgb(243, 151, 0)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            // Check if value is a valid number
                            if (value === null || value === undefined || isNaN(value)) {
                                return '';
                            }
                            // Ensure value is treated as a number
                            const numValue = Number(value);
                            return numValue.toFixed(2) + '%';
                        },
                        font: {
                            size: 14
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y1')
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Dwell Time (seconds)',
                        color: 'rgb(175, 82, 222)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0,
                        font: {
                            size: 14
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y2')
                },
                y3: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Weather',
                        color: 'rgb(90, 200, 250)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0,
                        font: {
                            size: 14
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y3')
                }
            }
        }
    });

    // Apply gradient effects to bar datasets for a more beautiful user experience
    customAnalyticsChart.data.datasets.forEach((dataset, index) => {
        if (dataset.type === 'bar') {
            const ctx = customAnalyticsChart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);

            // Create gradient effect
            const color = dataset.backgroundColor;
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color.replace('0.7', '0.3'));

            dataset.backgroundColor = gradient;
        }
    });

    // Update the chart
    customAnalyticsChart.update();
    } catch (error) {
        console.error('Error creating chart:', error);
        // Reset chart variable to null to ensure we don't have a partially initialized chart
        customAnalyticsChart = null;
        // Show error message to user
        hideLoadingIndicator();
        throw error; // Re-throw to be caught by the main try-catch in generateChart
    }
}

// Helper function to get day name from day index
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

// Helper function to get week number and year
function getWeekYear(date) {
    // Ensure we have a valid date object
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        console.error('Invalid date in getWeekYear:', date);
        return { week: 1, year: new Date().getFullYear() };
    }

    // Use a simpler and more reliable method for ISO week calculation
    // Based on https://weeknumber.com/how-to/javascript

    // Copy date to avoid modifying the original
    const target = new Date(d.valueOf());

    // ISO week starts on Monday
    const dayNr = (d.getDay() + 6) % 7;

    // Set target to the Thursday of the current week
    target.setDate(target.getDate() - dayNr + 3);

    // Get first Thursday of the year
    const firstThursday = new Date(target.getFullYear(), 0, 1);
    if (firstThursday.getDay() !== 4) {
        firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay()) + 7) % 7);
    }

    // Calculate week number: Number of weeks between target and first Thursday
    const weekNum = 1 + Math.ceil((target - firstThursday) / 604800000);

    // Determine the year of the ISO week
    let yearOfWeek = target.getFullYear();

    // Log for debugging
    console.log(`getWeekYear for ${d.toISOString()}: week ${weekNum}, year ${yearOfWeek}`);

    return { week: weekNum, year: yearOfWeek };
}

// Helper function to get the ISO week number
function getWeekNumber(date) {
    // This function is now a wrapper around getWeekYear for consistency
    return getWeekYear(date).week;
}

// Helper function to get start of week (Monday)
function getStartOfWeek(date) {
    // Ensure we have a valid date object
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        console.error('Invalid date in getStartOfWeek:', date);
        return new Date(); // Return current date as fallback
    }

    // Clone the date to avoid modifying the original
    const result = new Date(d);

    // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    const day = result.getDay();

    // Calculate the difference to Monday
    // If today is Sunday (0), we need to go back 6 days
    // If today is Monday (1), we need to go back 0 days
    // If today is Tuesday (2), we need to go back 1 day, etc.
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);

    // Set the date to Monday
    result.setDate(diff);

    // Reset time to start of day
    result.setHours(0, 0, 0, 0);

    return result;
}

// Helper function to get KPI label
function getKPILabel(kpi) {
    const labels = {
        visitorsIn: 'Visitors',
        passersby: 'Passersby',
        visitorsOut: 'Visitors Leaving',
        menIn: 'Men Entering',
        menOut: 'Men Leaving',
        womenIn: 'Women Entering',
        womenOut: 'Women Leaving',
        groupIn: 'Group Entering',
        groupOut: 'Group Leaving',
        captureRate: 'Capture Rate',
        conversionRate: 'Conversion Rate',
        dwellTime: 'Dwell Time',
        weather: 'Weather'
    };

    return labels[kpi] || kpi;
}

// Helper function to get X-axis title
function getXAxisTitle() {
    switch (customAnalyticsState.period) {
        case 'hours':
            return 'Hour';
        case 'days':
            return 'Date';
        case 'weeks':
            return 'Week';
        case 'months':
            return 'Month';
        default:
            return '';
    }
}

// Helper function to get time unit for X-axis
function getTimeUnit() {
    switch (customAnalyticsState.period) {
        case 'hours':
            return 'hour';
        case 'days':
            return 'day';
        case 'weeks':
            return 'week'; // Add specific case for weeks
        case 'months':
            return 'month';
        default:
            return 'day';
    }
}
