// Add at the top of the file
Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();

    // Wait for data to be loaded before initializing benchmark
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready, initializing benchmark');

            initializeBenchmark();
        }
    }, 100);

    // Add scroll listener for date picker transparency
    const datepickerSticky = document.querySelector('.date-picker-sticky');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            datepickerSticky.classList.add('scrolled');
        } else {
            datepickerSticky.classList.remove('scrolled');
        }
    });
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            console.log('Switching to tab:', tabId);

            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Tab switching code for daily-benchmark removed
        });
    });
}

// Note: Chart initialization is now handled by benchmarkHourlyChart.js

function initializeBenchmark() {
    const dateInput = document.getElementById('benchmarkDate');
    const compareInput = document.getElementById('benchmarkCompareDate');
    const benchmarkToggle = document.getElementById('enableBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableAverageBenchmark');

    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Benchmark controls not found');
        return;
    }

    // Note: Chart initialization is now handled by benchmarkHourlyChart.js

    if (window.dashboardState.dayData.length > 0) {
        const lastDate = new Date(Math.max(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
        const firstDate = new Date(Math.min(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));

        // Set min/max date constraints
        dateInput.min = firstDate.toISOString().split('T')[0];
        dateInput.max = lastDate.toISOString().split('T')[0];

        compareInput.min = firstDate.toISOString().split('T')[0];
        compareInput.max = lastDate.toISOString().split('T')[0];

        // Initial table update only - chart is handled by benchmarkHourlyChart.js
        updateBenchmarkTable(lastDate);
    }

    // Event listeners for table updates only - chart updates are handled by benchmarkHourlyChart.js
    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = new Date(dateInput.value);
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateBenchmarkTable(selectedDate, prevWeekDate);
            const mainData = getHourlyData(selectedDate);
            const compareData = getHourlyData(prevWeekDate);
            updateCustomPeriodRate(mainData, compareData, false);
        } else {
            compareInput.disabled = true;
            updateBenchmarkTable(new Date(dateInput.value));
            const mainData = getHourlyData(new Date(dateInput.value));
            updateCustomPeriodRate(mainData);
        }
    });

    averageBenchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            benchmarkToggle.checked = false;
            compareInput.disabled = true;
            const selectedDate = new Date(dateInput.value);
            const averageData = calculateAverageData(selectedDate);
            updateBenchmarkTable(selectedDate, null, averageData);
            const mainData = getHourlyData(selectedDate);
            updateCustomPeriodRate(mainData, averageData.hourly, true);
        } else {
            updateBenchmarkTable(new Date(dateInput.value));
            const mainData = getHourlyData(new Date(dateInput.value));
            updateCustomPeriodRate(mainData);
        }
    });

    dateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (benchmarkToggle.checked) {
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateBenchmarkTable(selectedDate, prevWeekDate);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageData(selectedDate);
            updateBenchmarkTable(selectedDate, null, averageData);
        } else {
            updateBenchmarkTable(selectedDate);
        }
    });

    compareInput.addEventListener('change', (e) => {
        if (benchmarkToggle.checked) {
            const selectedDate = new Date(dateInput.value);
            const compareDate = new Date(e.target.value);
            updateBenchmarkTable(selectedDate, compareDate);
        }
    });

    // Initialize custom period selects for the benchmark table
    initializeCustomPeriodSelects();
}

function calculateAverageData(selectedDate) {
    const dayOfWeek = selectedDate.getDay();
    const allSameDayData = window.dashboardState.dayData.filter(day => {
        const date = new Date(day.date);
        return date.getDay() === dayOfWeek && Object.values(day).some(v => v > 0);
    });

    // Calculate daily metrics using the stored day data directly
    const dailyMetrics = allSameDayData.map(day => ({
        date: day.date,
        visitorsIn: parseInt(day.visitorsIn) || 0,
        passersby: parseInt(day.passersby) || 0,
        captureRate: parseFloat(day.captureRate) || 0,
        menIn: parseInt(day.menIn) || 0,
        womenIn: parseInt(day.womenIn) || 0,
        dwellTime: parseFloat(day.dwellTime) || 0,  // Use the stored dwell time
        dataAccuracy: parseFloat(day.dataAccuracy) || 0  // Use the stored data accuracy
    }));

    // Calculate daily average using the existing day data
    const dailyAverage = {
        date: selectedDate,
        visitorsIn: averagePositive(dailyMetrics.map(d => d.visitorsIn)),
        passersby: averagePositive(dailyMetrics.map(d => d.passersby)),
        captureRate: averagePositive(dailyMetrics.map(d => d.captureRate)),
        menIn: averagePositive(dailyMetrics.map(d => d.menIn)),
        womenIn: averagePositive(dailyMetrics.map(d => d.womenIn)),
        dwellTime: averagePositive(dailyMetrics.map(d => d.dwellTime)), // Average the stored dwell times
        dataAccuracy: averagePositive(dailyMetrics.map(d => d.dataAccuracy)), // Average the stored accuracies
        sampleSize: allSameDayData.length,
        rawData: dailyMetrics.map(d => ({
            date: formatDate(new Date(d.date)),
            visitorsIn: d.visitorsIn,
            passersby: d.passersby,
            captureRate: d.captureRate.toFixed(2),
            menIn: d.menIn,
            womenIn: d.womenIn,
            dwellTime: d.dwellTime,
            dataAccuracy: d.dataAccuracy
        }))
    };

    // Calculate hourly averages
    const hourlyAverages = Array.from({length: 24}, (_, hour) => {
        const hourData = window.dashboardState.hourData
            .filter(h => {
                const hDate = new Date(h.timestamp);
                return hDate.getDay() === dayOfWeek &&
                       hDate.getHours() === hour &&
                       (h.visitorsIn > 0 || h.passersby > 0);
            });

        return {
            timestamp: new Date(selectedDate).setHours(hour),
            visitorsIn: averagePositive(hourData.map(h => h.visitorsIn)),
            passersby: averagePositive(hourData.map(h => h.passersby)),
            captureRate: calculateCaptureRate(hourData),
            menIn: averagePositive(hourData.map(h => h.menIn)),
            womenIn: averagePositive(hourData.map(h => h.womenIn)),
            groupIn: averagePositive(hourData.map(h => h.groupIn))
        };
    });

    return {
        hourly: hourlyAverages,
        daily: dailyAverage,
        sampleSize: allSameDayData.length
    };
}

// Helper function to calculate capture rate average
function calculateCaptureRate(data) {
    const validData = data.filter(d => d.visitorsIn > 0 && d.passersby > 0);
    if (validData.length === 0) return 0;

    const totalVisitors = validData.reduce((sum, d) => sum + parseInt(d.visitorsIn), 0);
    const totalPassersby = validData.reduce((sum, d) => sum + parseInt(d.passersby), 0);
    return totalPassersby > 0 ? parseFloat(((totalVisitors / totalPassersby) * 100).toFixed(2)) : 0;
}

function averagePositive(numbers) {
    const positiveNumbers = numbers.filter(n => n > 0);
    return positiveNumbers.length > 0
        ? Math.round((positiveNumbers.reduce((a, b) => a + b, 0) / positiveNumbers.length) * 100) / 100
        : 0;
}

function updateBenchmarkTable(selectedDate, compareDate = null, averageData = null) {
    const tbody = document.getElementById('benchmarkTableBody');

    if (!tbody) {
        console.error('Benchmark table body not found');
        return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];
    const dayData = getDayData(formattedDate);

    if (!dayData) {
        tbody.innerHTML = '<tr><td colspan="8">No data available for selected date</td></tr>';
        return;
    }

    let html = '';
    let comparisonMetrics = null;

    // Prepare comparison metrics for both direct comparison and averages
    if (compareDate && !averageData) {
        const compareFormattedDate = compareDate.toISOString().split('T')[0];
        const compareDayData = getDayData(compareFormattedDate);
        if (compareDayData) {
            comparisonMetrics = {
                visitorsIn: [dayData.visitorsIn, compareDayData.visitorsIn],
                passersby: [dayData.passersby, compareDayData.passersby],
                captureRate: [parseFloat(dayData.captureRate), parseFloat(compareDayData.captureRate)],
                dwellTime: [parseFloat(dayData.dwellTime), parseFloat(compareDayData.dwellTime)],
                dataAccuracy: [parseFloat(dayData.dataAccuracy), parseFloat(compareDayData.dataAccuracy)]
            };
        }
    } else if (averageData) {
        comparisonMetrics = {
            visitorsIn: [dayData.visitorsIn, averageData.daily.visitorsIn],
            passersby: [dayData.passersby, averageData.daily.passersby],
            captureRate: [parseFloat(dayData.captureRate), parseFloat(averageData.daily.captureRate)],
            dwellTime: [parseFloat(dayData.dwellTime), parseFloat(averageData.daily.dwellTime)],
            dataAccuracy: [parseFloat(dayData.dataAccuracy), parseFloat(averageData.daily.dataAccuracy)]
        };
    }

    // Add main date row
    html += createTableRow(dayData, selectedDate, false, comparisonMetrics, 0);

    // Add comparison row if enabled
    if (averageData) {
        html += createTableRow(averageData.daily, selectedDate, true, comparisonMetrics, 1);
    } else if (compareDate) {
        const compareFormattedDate = compareDate.toISOString().split('T')[0];
        const compareDayData = getDayData(compareFormattedDate);
        if (compareDayData) {
            html += createTableRow(compareDayData, compareDate, false, comparisonMetrics, 1);
        }
    }

    tbody.innerHTML = html;
}

// Add this new helper function
function formatBenchmarkDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function createTableRow(dayData, date, isAverage = false, comparisonMetrics = null, rowIndex = 0) {
    const totalVisitors = dayData.menIn + dayData.womenIn;
    const menPercentage = totalVisitors > 0 ? parseFloat((dayData.menIn / totalVisitors * 100).toFixed(2)) : 0;
    const womenPercentage = totalVisitors > 0 ? parseFloat((dayData.womenIn / totalVisitors * 100).toFixed(2)) : 0;

    const weatherInfo = [
        dayData.weather || '',
        dayData.temperature ? `${dayData.temperature}°C` : '',
        dayData.precipitation ? `${dayData.precipitation}mm` : '',
        dayData.windspeed ? `${dayData.windspeed}km/h` : ''
    ].filter(Boolean).join(' ') || 'No weather data';

    const averageInfo = isAverage && dayData.sampleSize
        ? `Average of ${dayData.sampleSize} ${date.toLocaleString('en-us', {weekday: 'long'})}s`
        : '';

    // Helper function to determine cell color
    const getCellColor = (value, metricArray) => {
        if (!metricArray) return '';
        const max = Math.max(...metricArray);
        const min = Math.min(...metricArray);
        if (value === max && max !== min) return ' style="color: #2ecc71;"';
        if (value === min && max !== min) return ' style="color: #e67e22;"';
        return '';
    };

    // Create tooltip content if this is an average row
    const createTooltip = (label, values) => {
        if (!isAverage || !dayData.rawData) return '';
        const tooltipContent = dayData.rawData.map(d =>
            `${d.date}: ${values(d)}`
        ).join('\n');
        return `title="${label}:\n${tooltipContent}" class="tooltip-trigger"`;
    };

    return `
        <tr>
            <td>${isAverage ? averageInfo : formatBenchmarkDate(date)}</td>
            <td ${createTooltip('Visitors', d => Math.round(d.visitorsIn).toLocaleString())}${comparisonMetrics ? getCellColor(dayData.visitorsIn, comparisonMetrics.visitorsIn) : ''}>
                ${Math.round(dayData.visitorsIn).toLocaleString()}
            </td>
            <td ${createTooltip('Passersby', d => Math.round(d.passersby).toLocaleString())}${comparisonMetrics ? getCellColor(dayData.passersby, comparisonMetrics?.passersby) : ''}>
                ${Math.round(dayData.passersby).toLocaleString()}
            </td>
            <td ${createTooltip('Capture Rate', d => parseFloat(d.captureRate).toFixed(2) + '%')}${comparisonMetrics ? getCellColor(parseFloat(dayData.captureRate), comparisonMetrics.captureRate) : ''}>
                ${parseFloat(dayData.captureRate).toFixed(2)}%
            </td>
            <td ${createTooltip('Gender Distribution', d => `${parseFloat((d.menIn/(d.menIn+d.womenIn)*100)).toFixed(2)}% M / ${parseFloat((d.womenIn/(d.menIn+d.womenIn)*100)).toFixed(2)}% F`)}>
                ${parseFloat(menPercentage).toFixed(2)}% M / ${parseFloat(womenPercentage).toFixed(2)}% F
            </td>
            <td ${createTooltip('Dwell Time', d => Math.round(d.dwellTime) + ' min')}${comparisonMetrics ? getCellColor(parseFloat(dayData.dwellTime), comparisonMetrics.dwellTime) : ''}>
                ${Math.round(parseFloat(dayData.dwellTime))} min
            </td>
            <td ${createTooltip('Data Accuracy', d => parseFloat(d.dataAccuracy).toFixed(2) + '%')}${comparisonMetrics ? getCellColor(parseFloat(dayData.dataAccuracy), comparisonMetrics.dataAccuracy) : ''}>
                ${parseFloat(dayData.dataAccuracy).toFixed(2)}%
            </td>
            <td class="weather-info">${isAverage ? 'N/A' : weatherInfo}</td>
        </tr>
    `;
}

function getDayData(formattedDate) {
    return window.dashboardState.dayData.find(day => {
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        return dayDate === formattedDate;
    });
}

// Note: Chart update is now handled by benchmarkHourlyChart.js

// Helper function to get hourly data for a specific date
function getHourlyData(date) {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const hourlyData = window.dashboardState.hourData
        .filter(hour => {
            const hourDate = new Date(hour.timestamp);
            hourDate.setHours(0, 0, 0, 0);
            return hourDate.getTime() === compareDate.getTime();
        })
        .sort((a, b) => a.timestamp.getHours() - b.timestamp.getHours());

    // Create 24-hour array with zeros for missing hours
    return Array.from({length: 24}, (_, hour) => {
        const hourData = hourlyData.find(d => new Date(d.timestamp).getHours() === hour);
        return hourData || {
            timestamp: new Date(date).setHours(hour),
            visitorsIn: 0,
            passersby: 0,
            captureRate: 0,
            menIn: 0,
            womenIn: 0,
            groupIn: 0,
            conversion: 0
        };
    }).map(hourData => ({
        ...hourData,
        // Calculate conversion rate as percentage of groups relative to visitors
        conversion: hourData.visitorsIn > 0
            ? parseFloat(((hourData.groupIn / hourData.visitorsIn) * 100).toFixed(2))
            : 0,
        captureRate: hourData.passersby > 0
            ? parseFloat(((hourData.visitorsIn / hourData.passersby) * 100).toFixed(2))
            : 0
    }));
}

function updateCaptureRateCards(data, comparisonData = null, isAverage = false) {
    const periods = {
        morning: { start: 7, end: 11, label: 'Morning', icon: '🌅' },
        noon: { start: 12, end: 14, label: 'Noon', icon: '☀️' },
        afternoon: { start: 17, end: 20, label: 'Afternoon', icon: '🌇' },
        custom: { label: 'Custom', icon: '⚙️' }
    };

    Object.entries(periods).forEach(([key, period]) => {
        if (key === 'custom') return; // Handle custom period separately

        const mainRate = calculatePeriodCaptureRate(data, period.start, period.end);
        const compareRate = comparisonData ?
            calculatePeriodCaptureRate(comparisonData, period.start, period.end) : null;

        updateCaptureCard(key, {
            rate: mainRate,
            compareRate: compareRate,
            period: period,
            isAverage: isAverage
        });
    });

    // Update custom period
    updateCustomPeriodRate(data, comparisonData, isAverage);
}

function updateCaptureCard(cardId, data) {
    const rateElement = document.getElementById(`${cardId}CaptureRate`);
    if (!rateElement) {
        console.warn(`Element with id ${cardId}CaptureRate not found`);
        return;
    }

    const card = rateElement.parentElement;
    const benchmarkElement = card.querySelector('.capture-benchmark');

    // Remove existing elements if any
    if (benchmarkElement) benchmarkElement.remove();
    const oldCompareElement = card.querySelector('.capture-compare-rate');
    if (oldCompareElement) oldCompareElement.remove();

    // Update main rate with 2 decimals
    rateElement.textContent = parseFloat(data.rate).toFixed(2) + '%';

    // Add benchmark comparison if available
    if (data.compareRate !== null) {
        const difference = parseFloat((data.rate - data.compareRate).toFixed(2));
        const isPositive = difference > 0;

        // Add comparison rate value with 2 decimals
        const compareHtml = `
            <div class="capture-compare-rate">
                ${parseFloat(data.compareRate).toFixed(2)}%
            </div>
        `;
        rateElement.insertAdjacentHTML('afterend', compareHtml);

        // Add difference indicator
        const benchmarkHtml = `
            <div class="capture-benchmark ${isPositive ? 'positive' : 'negative'}">
                <span class="difference-icon">${isPositive ? '▲' : '▼'}</span>
                <span class="difference-value">${Math.abs(difference).toFixed(2)}%</span>
            </div>
        `;
        card.insertAdjacentHTML('beforeend', benchmarkHtml);
    }

    // Update period icon and time range
    const headerElement = card.querySelector('h3');
    headerElement.innerHTML = `${data.period.icon} ${data.period.label}`;
}

function updateCustomPeriodRate(data, comparisonData = null, isAverage = false) {
    const startHour = parseInt(document.getElementById('customPeriodStart').value);
    const endHour = parseInt(document.getElementById('customPeriodEnd').value);

    const mainRate = calculatePeriodCaptureRate(data, startHour, endHour);
    const compareRate = comparisonData ?
        calculatePeriodCaptureRate(comparisonData, startHour, endHour) : null;

    updateCaptureCard('custom', {
        rate: mainRate,
        compareRate: compareRate,
        period: {
            label: 'Custom',
            icon: '⚙️',
            start: startHour,
            end: endHour
        },
        isAverage: isAverage
    });

    // Update period label with proper time formatting
    document.getElementById('customPeriodLabel').textContent =
        `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
}

function calculatePeriodCaptureRate(data, startHour, endHour) {
    const periodData = data.filter(h => {
        const hour = new Date(h.timestamp).getHours();
        return hour >= startHour && hour <= endHour;
    });

    const totalVisitors = periodData.reduce((sum, h) => sum + parseInt(h.visitorsIn), 0);
    const totalPassersby = periodData.reduce((sum, h) => sum + parseInt(h.passersby), 0);

    return totalPassersby > 0 ? parseFloat(((totalVisitors / totalPassersby) * 100).toFixed(2)) : 0;
}

function initializeCustomPeriodSelects() {
    const startSelect = document.getElementById('customPeriodStart');
    const endSelect = document.getElementById('customPeriodEnd');
    const dateInput = document.getElementById('benchmarkDate');
    const benchmarkToggle = document.getElementById('enableBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableAverageBenchmark');

    // Populate selects with hours
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        startSelect.add(new Option(`${hour}:00`, i));
        endSelect.add(new Option(`${hour}:00`, i));
    }

    // Set initial values
    startSelect.value = 8;
    endSelect.value = 20;
    updateEndSelectOptions(startSelect.value);

    startSelect.addEventListener('change', function() {
        updateEndSelectOptions(this.value);
        updatePeriodRates();
    });

    endSelect.addEventListener('change', updatePeriodRates);

    function updateEndSelectOptions(startValue) {
        const startHour = parseInt(startValue);

        Array.from(endSelect.options).forEach(option => {
            const hourValue = parseInt(option.value);
            option.disabled = hourValue <= startHour;
        });

        if (parseInt(endSelect.value) <= startHour) {
            endSelect.value = startHour + 1;
        }
    }

    function updatePeriodRates() {
        const mainData = getHourlyData(new Date(dateInput.value));
        let comparisonData = null;
        let isAverage = false;

        if (benchmarkToggle.checked) {
            const compareDate = new Date(document.getElementById('benchmarkCompareDate').value);
            comparisonData = getHourlyData(compareDate);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageData(new Date(dateInput.value));
            comparisonData = averageData.hourly;
            isAverage = true;
        }

        updateCustomPeriodRate(mainData, comparisonData, isAverage);
    }
}

// Daily benchmark related functions removed

function getWeekData(date) {
    const weekStart = getStartOfWeek(date);
    const weekEnd = getEndOfWeek(date);

    const weekData = window.dashboardState.dayData
        .filter(day => {
            const dayDate = new Date(day.date);
            return dayDate >= weekStart && dayDate <= weekEnd;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (weekData.length === 0) return null;

    const totals = weekData.reduce((acc, day) => ({
        visitorsIn: acc.visitorsIn + day.visitorsIn,
        passersby: acc.passersby + day.passersby,
        menIn: acc.menIn + day.menIn,
        womenIn: acc.womenIn + day.womenIn,
        dwellTimeSum: acc.dwellTimeSum + (parseFloat(day.dwellTime) || 0),
        accuracySum: acc.accuracySum + (parseFloat(day.dataAccuracy) || 0)
    }), { visitorsIn: 0, passersby: 0, menIn: 0, womenIn: 0, dwellTimeSum: 0, accuracySum: 0 });

    return {
        weekNumber: getWeekNumber(weekStart),
        startDate: weekStart,
        endDate: weekEnd,
        days: weekData,
        totals,
        dailyAverage: {
            visitors: Math.round(totals.visitorsIn / weekData.length),
            captureRate: parseFloat(((totals.visitorsIn / totals.passersby) * 100).toFixed(2)),
            dwellTime: Math.round(totals.dwellTimeSum / weekData.length),
            accuracy: parseFloat((totals.accuracySum / weekData.length).toFixed(2))
        },
        genderSplit: {
            men: parseFloat(((totals.menIn / (totals.menIn + totals.womenIn)) * 100).toFixed(2)),
            women: parseFloat(((totals.womenIn / (totals.menIn + totals.womenIn)) * 100).toFixed(2))
        },
        weatherImpact: calculateWeatherImpact(weekData)
    };
}

function calculateWeatherImpact(weekData) {
    const weatherGroups = weekData.reduce((acc, day) => {
        if (!acc[day.weather]) {
            acc[day.weather] = { days: 0, totalVisitors: 0 };
        }
        acc[day.weather].days++;
        acc[day.weather].totalVisitors += day.visitorsIn;
        return acc;
    }, {});

    const impacts = Object.entries(weatherGroups).map(([weather, stats]) => ({
        weather,
        avgVisitors: stats.totalVisitors / stats.days,
        days: stats.days
    }));

    const baselineAvg = impacts.reduce((sum, impact) => sum + impact.avgVisitors, 0) / impacts.length;

    return impacts.map(impact => ({
        weather: impact.weather,
        impact: parseFloat((((impact.avgVisitors - baselineAvg) / baselineAvg) * 100).toFixed(2)),
        days: impact.days
    }));
}

// Daily benchmark table functions removed

// Daily benchmark chart function removed

// Weekly period cards functions removed
