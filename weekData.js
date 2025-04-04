// Week Data functionality
Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing week data
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready, initializing week data');

            initializeWeekData();
        }
    }, 100);
});

function initializeWeekData() {
    const dateInput = document.getElementById('weekDataDate');
    const compareInput = document.getElementById('weekDataCompareDate');
    const benchmarkToggle = document.getElementById('enableWeekDataBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableWeekDataAverageBenchmark');

    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Week Data controls not found');
        return;
    }

    // Note: Chart initialization is handled by weekDataChart.js

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

        // Set the date to the start of the most recent week
        const lastWeekStart = getStartOfWeek(lastDate);
        dateInput.value = lastWeekStart.toISOString().split('T')[0];

        // Set compare date to previous week
        const prevWeekStart = new Date(lastWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        compareInput.value = prevWeekStart.toISOString().split('T')[0];

        // Initial table update
        updateWeekDataTable(lastWeekStart);
    }

    // Event listeners for table updates
    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateWeekDataTable(selectedDate, prevWeekDate);
            updateWeekPeriodRates(selectedDate, prevWeekDate, false);
        } else {
            compareInput.disabled = true;
            updateWeekDataTable(getStartOfWeek(new Date(dateInput.value)));
            updateWeekPeriodRates(getStartOfWeek(new Date(dateInput.value)));
        }
    });

    averageBenchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            benchmarkToggle.checked = false;
            compareInput.disabled = true;
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const averageData = calculateAverageWeekData(selectedDate);
            updateWeekDataTable(selectedDate, null, averageData);
            updateWeekPeriodRates(selectedDate, null, true, averageData);
        } else {
            updateWeekDataTable(getStartOfWeek(new Date(dateInput.value)));
            updateWeekPeriodRates(getStartOfWeek(new Date(dateInput.value)));
        }
    });

    dateInput.addEventListener('change', (e) => {
        const selectedDate = getStartOfWeek(new Date(e.target.value));
        if (benchmarkToggle.checked) {
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateWeekDataTable(selectedDate, prevWeekDate);
            updateWeekPeriodRates(selectedDate, prevWeekDate, false);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageWeekData(selectedDate);
            updateWeekDataTable(selectedDate, null, averageData);
            updateWeekPeriodRates(selectedDate, null, true, averageData);
        } else {
            updateWeekDataTable(selectedDate);
            updateWeekPeriodRates(selectedDate);
        }
    });

    compareInput.addEventListener('change', (e) => {
        if (benchmarkToggle.checked) {
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const compareDate = getStartOfWeek(new Date(e.target.value));
            updateWeekDataTable(selectedDate, compareDate);
            updateWeekPeriodRates(selectedDate, compareDate, false);
        }
    });

    // Initialize weekday selection for custom period
    initializeWeekdaySelection();
}

function initializeWeekdaySelection() {
    const weekdayCheckboxes = document.querySelectorAll('#week-data .weekday-checkbox');
    const dateInput = document.getElementById('weekDataDate');
    const benchmarkToggle = document.getElementById('enableWeekDataBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableWeekDataAverageBenchmark');

    // Set initial values (all days selected)
    weekdayCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateCustomDaysLabel();

    // Handle responsive day names
    handleResponsiveDayNames();
    window.addEventListener('resize', handleResponsiveDayNames);

    // Add event listeners
    weekdayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCustomDaysLabel();
            updateCustomDaysRate();
        });
    });

    // Function to handle responsive day names
    function handleResponsiveDayNames() {
        const daySpans = document.querySelectorAll('#week-data .weekday-group span');
        const useShortNames = window.innerWidth < 768;

        daySpans.forEach(span => {
            if (useShortNames) {
                span.textContent = span.getAttribute('data-short');
            } else {
                span.textContent = span.getAttribute('data-full');
            }
        });
    }

    function updateCustomDaysLabel() {
        const selectedDays = Array.from(weekdayCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => {
                const dayNum = parseInt(cb.value);
                const useShortNames = window.innerWidth < 768;
                const dayNames = useShortNames ?
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] :
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return dayNames[dayNum];
            });

        const customDaysLabel = document.getElementById('customDaysLabel');
        if (customDaysLabel) {
            if (selectedDays.length > 3) {
                customDaysLabel.textContent = `${selectedDays.length} days selected`;
            } else {
                customDaysLabel.textContent = selectedDays.length > 0 ? selectedDays.join(', ') : 'Select days';
            }
        }
    }

    function updateCustomDaysRate() {
        const selectedDate = getStartOfWeek(new Date(dateInput.value));
        const selectedDays = Array.from(weekdayCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));

        let compareDate = null;
        let isAverage = false;
        let averageData = null;

        if (benchmarkToggle.checked) {
            compareDate = getStartOfWeek(new Date(document.getElementById('weekDataCompareDate').value));
        } else if (averageBenchmarkToggle.checked) {
            averageData = calculateAverageWeekData(selectedDate);
            isAverage = true;
        }

        updateCustomDaysPeriodRate(selectedDate, compareDate, isAverage, averageData, selectedDays);
    }
}

function updateWeekDataTable(weekStart, compareWeekStart = null, averageData = null) {
    const tbody = document.getElementById('weekDataTableBody');

    if (!tbody) {
        console.error('Week Data table body not found');
        return;
    }

    // Get week data
    const weekData = getWeekData(weekStart);
    if (!weekData || !weekData.days || weekData.days.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No data available for selected week</td></tr>';
        return;
    }

    let html = '';
    let comparisonData = null;

    // Prepare comparison data
    if (compareWeekStart && !averageData) {
        comparisonData = getWeekData(compareWeekStart);
    } else if (averageData) {
        comparisonData = {
            weekNumber: 'Average',
            totals: {
                visitorsIn: Object.values(averageData).reduce((sum, day) => sum + (day.visitorsIn || 0), 0) * 7 / Object.values(averageData).length,
                passersby: Object.values(averageData).reduce((sum, day) => sum + (day.passersby || 0), 0) * 7 / Object.values(averageData).length
            },
            dailyAverage: {
                visitors: Object.values(averageData).reduce((sum, day) => sum + (day.visitorsIn || 0), 0) / Object.values(averageData).length,
                captureRate: Object.values(averageData).reduce((sum, day) => sum + parseFloat(day.captureRate || 0), 0) / Object.values(averageData).length,
                dwellTime: Object.values(averageData).reduce((sum, day) => sum + parseFloat(day.dwellTime || 0), 0) / Object.values(averageData).length,
                accuracy: Object.values(averageData).reduce((sum, day) => sum + parseFloat(day.dataAccuracy || 0), 0) / Object.values(averageData).length
            },
            genderSplit: {
                men: Object.values(averageData).reduce((sum, day) => sum + (day.menIn || 0), 0) / Object.values(averageData).reduce((sum, day) => sum + ((day.menIn || 0) + (day.womenIn || 0)), 0) * 100,
                women: Object.values(averageData).reduce((sum, day) => sum + (day.womenIn || 0), 0) / Object.values(averageData).reduce((sum, day) => sum + ((day.menIn || 0) + (day.womenIn || 0)), 0) * 100
            }
        };
    }

    // Add row for the week data
    html += createWeekRow(weekData, comparisonData);

    // Add comparison row if available
    if (comparisonData && !averageData) {
        html += createWeekRow(comparisonData, weekData, true);
    } else if (comparisonData && averageData) {
        html += createWeekRow(comparisonData, weekData, true, true);
    }

    tbody.innerHTML = html;
}

function createWeekRow(weekData, comparisonData = null, isComparison = false, isAverage = false) {
    // Helper function to determine cell color
    const getCellColor = (value, compareValue) => {
        if (!compareValue) return '';
        if (value > compareValue) return ' style="color: #2ecc71;"'; // Green for better
        if (value < compareValue) return ' style="color: #e67e22;"'; // Orange for worse
        return '';
    };

    // Calculate differences for comparison
    const diff = comparisonData && !isComparison ? {
        visitors: comparisonData.totals.visitorsIn > 0 ?
            parseFloat(((weekData.totals.visitorsIn - comparisonData.totals.visitorsIn) / comparisonData.totals.visitorsIn * 100).toFixed(2)) : 0,
        dailyAvg: comparisonData.dailyAverage.visitors > 0 ?
            parseFloat(((weekData.dailyAverage.visitors - comparisonData.dailyAverage.visitors) / comparisonData.dailyAverage.visitors * 100).toFixed(2)) : 0,
        passersby: comparisonData.totals.passersby > 0 ?
            parseFloat(((weekData.totals.passersby - comparisonData.totals.passersby) / comparisonData.totals.passersby * 100).toFixed(2)) : 0,
        captureRate: parseFloat((weekData.dailyAverage.captureRate - comparisonData.dailyAverage.captureRate).toFixed(2)),
        dwellTime: parseFloat((weekData.dailyAverage.dwellTime - comparisonData.dailyAverage.dwellTime).toFixed(2)),
        accuracy: parseFloat((weekData.dailyAverage.accuracy - comparisonData.dailyAverage.accuracy).toFixed(2))
    } : null;

    // Format the week number and date range
    // Get the year from the start date
    const year = weekData.startDate ? weekData.startDate.getFullYear() : new Date().getFullYear();

    // Create the week label with year
    const weekLabel = isAverage ? `Average Week ${year}` :
                     (typeof weekData.weekNumber === 'string' ? `${weekData.weekNumber} ${year}` :
                     `Week ${String(weekData.weekNumber).padStart(2, '0')} ${year}`);
    const dateRange = weekData.startDate && weekData.endDate ?
                     `${formatDate(weekData.startDate)} - ${formatDate(weekData.endDate)}` : '';

    return `
        <tr class="${isComparison ? 'comparison-row' : ''}">
            <td>${weekLabel}<br>
                <small>${dateRange}</small>
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.totals.visitorsIn, comparisonData.totals.visitorsIn) : ''}>
                ${Math.round(weekData.totals.visitorsIn).toLocaleString()}
                ${diff ? `<small class="diff ${diff.visitors > 0 ? 'positive' : 'negative'}">${diff.visitors.toFixed(2)}%</small>` : ''}
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.dailyAverage.visitors, comparisonData.dailyAverage.visitors) : ''}>
                ${Math.round(weekData.dailyAverage.visitors).toLocaleString()}
                ${diff ? `<small class="diff ${diff.dailyAvg > 0 ? 'positive' : 'negative'}">${diff.dailyAvg.toFixed(2)}%</small>` : ''}
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.totals.passersby, comparisonData.totals.passersby) : ''}>
                ${Math.round(weekData.totals.passersby).toLocaleString()}
                ${diff ? `<small class="diff ${diff.passersby > 0 ? 'positive' : 'negative'}">${diff.passersby.toFixed(2)}%</small>` : ''}
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.dailyAverage.captureRate, comparisonData.dailyAverage.captureRate) : ''}>
                ${weekData.dailyAverage.captureRate.toFixed(2)}%
                ${diff ? `<small class="diff ${diff.captureRate > 0 ? 'positive' : 'negative'}">${diff.captureRate.toFixed(2)}%</small>` : ''}
            </td>
            <td>
                ${weekData.genderSplit.men.toFixed(2)}% M / ${weekData.genderSplit.women.toFixed(2)}% F
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.dailyAverage.dwellTime, comparisonData.dailyAverage.dwellTime) : ''}>
                ${Math.round(weekData.dailyAverage.dwellTime)} min
                ${diff ? `<small class="diff ${diff.dwellTime > 0 ? 'positive' : 'negative'}">${diff.dwellTime.toFixed(2)}%</small>` : ''}
            </td>
            <td${!isComparison && comparisonData ? getCellColor(weekData.dailyAverage.accuracy, comparisonData.dailyAverage.accuracy) : ''}>
                ${weekData.dailyAverage.accuracy.toFixed(2)}%
                ${diff ? `<small class="diff ${diff.accuracy > 0 ? 'positive' : 'negative'}">${diff.accuracy.toFixed(2)}%</small>` : ''}
            </td>
        </tr>
    `;
}

function updateWeekPeriodRates(weekStart, compareWeekStart = null, isAverage = false, averageData = null) {
    console.log('updateWeekPeriodRates called with:', {
        weekStart: formatDate(weekStart),
        compareWeekStart: compareWeekStart ? formatDate(compareWeekStart) : null,
        isAverage: isAverage
    });

    // Get week data from the table
    const weekData = getWeekData(weekStart);
    if (!weekData) {
        console.error('No week data available for', formatDate(weekStart));
        return;
    }

    console.log('Week data for capture rate cards:', weekData);

    // Get comparison data if needed
    let compareData = null;
    if (compareWeekStart && !isAverage) {
        compareData = getWeekData(compareWeekStart);
        if (!compareData) {
            console.warn('No comparison data available for', formatDate(compareWeekStart));
        }
    } else if (isAverage && averageData) {
        compareData = averageData;
    }

    // Full week card has been removed from the UI

    // Calculate weekdays and weekend rates
    if (weekData.days && weekData.days.length > 0) {
        // Calculate weekdays rate (Monday-Friday)
        const weekdaysDays = weekData.days.filter(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        });

        let weekdaysVisitors = 0;
        let weekdaysPassersby = 0;
        weekdaysDays.forEach(day => {
            weekdaysVisitors += parseInt(day.visitorsIn || 0);
            weekdaysPassersby += parseInt(day.passersby || 0);
        });

        const weekdaysRate = weekdaysPassersby > 0 ?
            parseFloat(((weekdaysVisitors / weekdaysPassersby) * 100).toFixed(2)) : 0;

        // Calculate weekend rate (Saturday-Sunday)
        const weekendDays = weekData.days.filter(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        });

        let weekendVisitors = 0;
        let weekendPassersby = 0;
        weekendDays.forEach(day => {
            weekendVisitors += parseInt(day.visitorsIn || 0);
            weekendPassersby += parseInt(day.passersby || 0);
        });

        const weekendRate = weekendPassersby > 0 ?
            parseFloat(((weekendVisitors / weekendPassersby) * 100).toFixed(2)) : 0;

        // Calculate comparison rates if needed
        let weekdaysCompareRate = null;
        let weekendCompareRate = null;

        if (compareData) {
            if (compareData.days) {
                // For direct week comparison
                const compWeekdaysDays = compareData.days.filter(day => {
                    const date = new Date(day.date);
                    const dayOfWeek = date.getDay();
                    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
                });

                let compWeekdaysVisitors = 0;
                let compWeekdaysPassersby = 0;
                compWeekdaysDays.forEach(day => {
                    compWeekdaysVisitors += parseInt(day.visitorsIn || 0);
                    compWeekdaysPassersby += parseInt(day.passersby || 0);
                });

                weekdaysCompareRate = compWeekdaysPassersby > 0 ?
                    parseFloat(((compWeekdaysVisitors / compWeekdaysPassersby) * 100).toFixed(2)) : 0;

                const compWeekendDays = compareData.days.filter(day => {
                    const date = new Date(day.date);
                    const dayOfWeek = date.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
                });

                let compWeekendVisitors = 0;
                let compWeekendPassersby = 0;
                compWeekendDays.forEach(day => {
                    compWeekendVisitors += parseInt(day.visitorsIn || 0);
                    compWeekendPassersby += parseInt(day.passersby || 0);
                });

                weekendCompareRate = compWeekendPassersby > 0 ?
                    parseFloat(((compWeekendVisitors / compWeekendPassersby) * 100).toFixed(2)) : 0;
            } else if (compareData.monday) {
                // For average data
                const weekdayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                const weekendNames = ['saturday', 'sunday'];

                let weekdaysTotalRate = 0;
                let weekdaysCount = 0;
                weekdayNames.forEach(day => {
                    if (compareData[day] && compareData[day].captureRate) {
                        weekdaysTotalRate += parseFloat(compareData[day].captureRate);
                        weekdaysCount++;
                    }
                });
                weekdaysCompareRate = weekdaysCount > 0 ? weekdaysTotalRate / weekdaysCount : null;

                let weekendTotalRate = 0;
                let weekendCount = 0;
                weekendNames.forEach(day => {
                    if (compareData[day] && compareData[day].captureRate) {
                        weekendTotalRate += parseFloat(compareData[day].captureRate);
                        weekendCount++;
                    }
                });
                weekendCompareRate = weekendCount > 0 ? weekendTotalRate / weekendCount : null;
            }
        }

        // Update the weekdays card
        updateCaptureCard('weekdays', {
            rate: weekdaysRate,
            compareRate: weekdaysCompareRate,
            period: {
                label: 'Weekdays',
                icon: getPeriodIcon('weekdays')
            },
            isAverage: isAverage
        });

        // Update the weekend card
        updateCaptureCard('weekend', {
            rate: weekendRate,
            compareRate: weekendCompareRate,
            period: {
                label: 'Weekend',
                icon: getPeriodIcon('weekend')
            },
            isAverage: isAverage
        });
    }

    // Update custom days period
    updateCustomDaysPeriodRate(weekStart, compareWeekStart, isAverage, averageData);
}

function calculatePeriodCaptureRate(days, dayNumbers) {
    // If dayNumbers is null, use all days provided
    let periodDays = days;

    // Otherwise filter by day of week
    if (dayNumbers) {
        periodDays = days.filter(day => {
            const date = new Date(day.date);
            return dayNumbers.includes(date.getDay());
        });
    }

    if (!periodDays || periodDays.length === 0) {
        return 0;
    }

    const totals = periodDays.reduce((acc, day) => ({
        visitorsIn: acc.visitorsIn + parseInt(day.visitorsIn || 0),
        passersby: acc.passersby + parseInt(day.passersby || 0)
    }), { visitorsIn: 0, passersby: 0 });

    return totals.passersby > 0 ?
        parseFloat(((totals.visitorsIn / totals.passersby) * 100).toFixed(2)) : 0;
}

function updateCustomDaysPeriodRate(weekStart, compareWeekStart = null, isAverage = false, averageData = null, selectedDays = null) {
    console.log('updateCustomDaysPeriodRate called');

    // If no days are explicitly provided, get them from checkboxes
    if (!selectedDays) {
        const weekdayCheckboxes = document.querySelectorAll('#week-data .weekday-checkbox');
        selectedDays = Array.from(weekdayCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
    }

    console.log('Selected days for custom period:', selectedDays);

    if (selectedDays.length === 0) {
        updateCaptureCard('customDays', {
            rate: 0,
            compareRate: null,
            period: {
                label: 'Custom',
                icon: '<i class="fas fa-cog"></i>'
            },
            isAverage: false
        });
        return;
    }

    // Get week data from the table
    const weekData = getWeekData(weekStart);
    if (!weekData) {
        console.error('No week data available for custom days');
        return;
    }

    if (!weekData.days || weekData.days.length === 0) {
        console.error('No days data available in week data for custom days');
        return;
    }

    // Filter days based on selected days
    const customDays = weekData.days.filter(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        return selectedDays.includes(dayOfWeek);
    });

    console.log(`Found ${customDays.length} days matching selected days`);

    if (customDays.length === 0) {
        updateCaptureCard('customDays', {
            rate: 0,
            compareRate: null,
            period: {
                label: 'Custom',
                icon: '<i class="fas fa-cog"></i>'
            },
            isAverage: false
        });
        return;
    }

    // Calculate custom days rate
    let customVisitors = 0;
    let customPassersby = 0;
    customDays.forEach(day => {
        customVisitors += parseInt(day.visitorsIn || 0);
        customPassersby += parseInt(day.passersby || 0);
    });

    const customRate = customPassersby > 0 ?
        parseFloat(((customVisitors / customPassersby) * 100).toFixed(2)) : 0;

    // Get comparison data if needed
    let compareRate = null;
    if (compareWeekStart && !isAverage) {
        const compareData = getWeekData(compareWeekStart);
        if (compareData && compareData.days) {
            // Filter comparison days based on selected days
            const compCustomDays = compareData.days.filter(day => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();
                return selectedDays.includes(dayOfWeek);
            });

            if (compCustomDays.length > 0) {
                let compCustomVisitors = 0;
                let compCustomPassersby = 0;
                compCustomDays.forEach(day => {
                    compCustomVisitors += parseInt(day.visitorsIn || 0);
                    compCustomPassersby += parseInt(day.passersby || 0);
                });

                compareRate = compCustomPassersby > 0 ?
                    parseFloat(((compCustomVisitors / compCustomPassersby) * 100).toFixed(2)) : 0;
            }
        }
    } else if (isAverage && averageData) {
        // For average data
        let totalVisitors = 0;
        let totalPassersby = 0;
        let daysCount = 0;

        selectedDays.forEach(dayNum => {
            const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayNum];
            if (averageData[dayName]) {
                totalVisitors += parseInt(averageData[dayName].visitorsIn || 0);
                totalPassersby += parseInt(averageData[dayName].passersby || 0);
                daysCount++;
            }
        });

        compareRate = totalPassersby > 0 ?
            parseFloat(((totalVisitors / totalPassersby) * 100).toFixed(2)) : 0;
    }

    updateCaptureCard('customDays', {
        rate: customRate,
        compareRate: compareRate,
        period: {
            label: 'Custom',
            icon: '<i class="fas fa-cog"></i>'
        },
        isAverage: isAverage
    });
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
}

function getPeriodIcon(period) {
    const icons = {
        weekdays: '<i class="fas fa-calendar-day"></i>',
        weekend: '<i class="fas fa-calendar-week"></i>',
        fullWeek: '<i class="fas fa-calendar-alt"></i>',
        customDays: '<i class="fas fa-cog"></i>'
    };
    return icons[period] || '<i class="fas fa-calendar"></i>';
}

function calculateAverageWeekData(selectedDate) {
    // Get the day of week for the selected date
    const dayOfWeek = selectedDate.getDay();

    // Create an object to store average data for each day of the week
    const weekdayAverages = {};
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Calculate averages for each day of the week
    days.forEach((day, index) => {
        // Get all data for this day of the week
        const dayData = window.dashboardState.dayData.filter(d => {
            const date = new Date(d.date);
            return date.getDay() === index && Object.values(d).some(v => v > 0);
        });

        if (dayData.length > 0) {
            // Calculate averages
            const totals = dayData.reduce((acc, d) => ({
                visitorsIn: acc.visitorsIn + parseInt(d.visitorsIn || 0),
                passersby: acc.passersby + parseInt(d.passersby || 0),
                menIn: acc.menIn + parseInt(d.menIn || 0),
                womenIn: acc.womenIn + parseInt(d.womenIn || 0),
                dwellTime: acc.dwellTime + parseFloat(d.dwellTime || 0),
                dataAccuracy: acc.dataAccuracy + parseFloat(d.dataAccuracy || 0),
                captureRate: acc.captureRate + parseFloat(d.captureRate || 0)
            }), {
                visitorsIn: 0, passersby: 0, menIn: 0, womenIn: 0,
                dwellTime: 0, dataAccuracy: 0, captureRate: 0
            });

            weekdayAverages[day] = {
                date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - dayOfWeek + index),
                visitorsIn: Math.round(totals.visitorsIn / dayData.length),
                passersby: Math.round(totals.passersby / dayData.length),
                menIn: Math.round(totals.menIn / dayData.length),
                womenIn: Math.round(totals.womenIn / dayData.length),
                dwellTime: (totals.dwellTime / dayData.length).toFixed(2),
                dataAccuracy: (totals.dataAccuracy / dayData.length).toFixed(2),
                captureRate: (totals.captureRate / dayData.length).toFixed(2),
                sampleSize: dayData.length
            };
        }
    });

    return weekdayAverages;
}

// Helper function to get the start of the week (Monday) for a given date
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
}

// Helper function to get the week number
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Helper function to format a date
function formatDate(date) {
    if (!date) return 'Invalid Date';

    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    // Format as "DD/MM/YYYY"
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
}

// Helper function to get week data
function getWeekData(date) {
    const weekStart = getStartOfWeek(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekData = window.dashboardState.dayData
        .filter(day => {
            const dayDate = new Date(day.date);
            return dayDate >= weekStart && dayDate <= weekEnd;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (weekData.length === 0) return null;

    const totals = weekData.reduce((acc, day) => ({
        visitorsIn: acc.visitorsIn + parseInt(day.visitorsIn || 0),
        passersby: acc.passersby + parseInt(day.passersby || 0),
        menIn: acc.menIn + parseInt(day.menIn || 0),
        womenIn: acc.womenIn + parseInt(day.womenIn || 0),
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
        }
    };
}
