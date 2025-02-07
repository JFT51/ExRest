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
            initializeDailyBenchmark();
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
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

let benchmarkChart = null;

function initializeBenchmarkChart() {
    const ctx = document.getElementById('benchmarkHourlyChart').getContext('2d');
    
    if (benchmarkChart) {
        benchmarkChart.destroy();
    }
    
    benchmarkChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false // Hide legend
                },
                datalabels: {
                    display: false,  // Default to false, will be overridden per dataset
                    anchor: 'end',
                    align: 'top',
                    formatter: function(value, context) {
                        const datasetLabel = context.dataset.label;
                        if (datasetLabel.includes('Rate') || datasetLabel.includes('Conversion')) {
                            return value + '%';
                        }
                        return value.toLocaleString();
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    padding: 6
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour'
                    }
                },
                y: {
                    display: false,
                    title: {
                        display: true,
                        text: 'Visitors/Gender Count'
                    }
                },
                y1: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Passersby Count'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y3: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Conversion %'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function initializeBenchmark() {
    const dateInput = document.getElementById('benchmarkDate');
    const compareInput = document.getElementById('benchmarkCompareDate');
    const benchmarkToggle = document.getElementById('enableBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableAverageBenchmark');
    
    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Benchmark controls not found');
        return;
    }

    // Initialize chart first
    initializeBenchmarkChart();
    
    if (window.dashboardState.dayData.length > 0) {
        const lastDate = new Date(Math.max(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
        const firstDate = new Date(Math.min(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
        
        // Set initial dates - current date and one week before
        dateInput.min = firstDate.toISOString().split('T')[0];
        dateInput.max = lastDate.toISOString().split('T')[0];
        dateInput.value = lastDate.toISOString().split('T')[0];
        
        compareInput.min = firstDate.toISOString().split('T')[0];
        compareInput.max = lastDate.toISOString().split('T')[0];
        
        // Set compare date to one week before
        const prevWeekDate = new Date(lastDate);
        prevWeekDate.setDate(lastDate.getDate() - 7);
        compareInput.value = prevWeekDate.toISOString().split('T')[0];
        
        // Initial updates
        updateBenchmarkTable(lastDate);
        updateBenchmarkChart(lastDate);
    }

    // Event listeners
    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = new Date(dateInput.value);
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateBenchmarkTable(selectedDate, prevWeekDate);
            updateBenchmarkChart(selectedDate, prevWeekDate);
            const mainData = getHourlyData(selectedDate);
            const compareData = getHourlyData(prevWeekDate);
            updateCustomPeriodRate(mainData, compareData, false);
        } else {
            compareInput.disabled = true;
            updateBenchmarkTable(new Date(dateInput.value));
            updateBenchmarkChart(new Date(dateInput.value));
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
            updateBenchmarkChart(selectedDate, null, averageData);
            const mainData = getHourlyData(selectedDate);
            updateCustomPeriodRate(mainData, averageData.hourly, true);
        } else {
            updateBenchmarkTable(new Date(dateInput.value));
            updateBenchmarkChart(new Date(dateInput.value));
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
            updateBenchmarkChart(selectedDate, prevWeekDate);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageData(selectedDate);
            updateBenchmarkTable(selectedDate, null, averageData);
            updateBenchmarkChart(selectedDate, null, averageData);
        } else {
            updateBenchmarkTable(selectedDate);
            updateBenchmarkChart(selectedDate);
        }
    });

    compareInput.addEventListener('change', (e) => {
        if (benchmarkToggle.checked) {
            const selectedDate = new Date(dateInput.value);
            const compareDate = new Date(e.target.value);
            updateBenchmarkTable(selectedDate, compareDate);
            updateBenchmarkChart(selectedDate, compareDate);
        }
    });

    // Dataset toggle listeners
    document.querySelectorAll('.dataset-selector input[type="checkbox"]')
        .forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedDate = new Date(dateInput.value);
                const compareDate = benchmarkToggle.checked ? new Date(compareInput.value) : null;
                updateBenchmarkChart(selectedDate, compareDate);
            });
        });

    // Add this at the end of the function
    initializeCustomPeriodSelects();

    // Add data label toggle listeners
    document.querySelectorAll('.toggle-labels').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');
            updateBenchmarkChart(
                new Date(dateInput.value),
                benchmarkToggle.checked ? new Date(compareInput.value) : null
            );
        });
    });
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
        visitorsIn: day.visitorsIn,
        captureRate: parseFloat(day.captureRate) || 0,
        menIn: day.menIn,
        womenIn: day.womenIn,
        dwellTime: parseFloat(day.dwellTime) || 0,  // Use the stored dwell time
        dataAccuracy: parseFloat(day.dataAccuracy) || 0  // Use the stored data accuracy
    }));

    // Calculate daily average using the existing day data
    const dailyAverage = {
        date: selectedDate,
        visitorsIn: averagePositive(dailyMetrics.map(d => d.visitorsIn)),
        captureRate: averagePositive(dailyMetrics.map(d => d.captureRate)),
        menIn: averagePositive(dailyMetrics.map(d => d.menIn)),
        womenIn: averagePositive(dailyMetrics.map(d => d.womenIn)),
        dwellTime: averagePositive(dailyMetrics.map(d => d.dwellTime)), // Average the stored dwell times
        dataAccuracy: averagePositive(dailyMetrics.map(d => d.dataAccuracy)), // Average the stored accuracies
        sampleSize: allSameDayData.length,
        rawData: dailyMetrics.map(d => ({
            date: formatDate(new Date(d.date)),
            visitorsIn: d.visitorsIn,
            captureRate: d.captureRate.toFixed(1),
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
    
    const totalVisitors = validData.reduce((sum, d) => sum + d.visitorsIn, 0);
    const totalPassersby = validData.reduce((sum, d) => sum + d.passersby, 0);
    return totalPassersby > 0 ? ((totalVisitors / totalPassersby) * 100).toFixed(2) : '0.00';
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
        tbody.innerHTML = '<tr><td colspan="7">No data available for selected date</td></tr>';
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
                captureRate: [parseFloat(dayData.captureRate), parseFloat(compareDayData.captureRate)],
                dwellTime: [parseFloat(dayData.dwellTime), parseFloat(compareDayData.dwellTime)],
                dataAccuracy: [parseFloat(dayData.dataAccuracy), parseFloat(compareDayData.dataAccuracy)]
            };
        }
    } else if (averageData) {
        comparisonMetrics = {
            visitorsIn: [dayData.visitorsIn, averageData.daily.visitorsIn],
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
    const menPercentage = totalVisitors > 0 ? (dayData.menIn / totalVisitors * 100).toFixed(1) : 0;
    const womenPercentage = totalVisitors > 0 ? (dayData.womenIn / totalVisitors * 100).toFixed(1) : 0;

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
            <td ${createTooltip('Visitors', d => d.visitorsIn.toLocaleString())}${comparisonMetrics ? getCellColor(dayData.visitorsIn, comparisonMetrics.visitorsIn) : ''}>
                ${Math.round(dayData.visitorsIn).toLocaleString()}
            </td>
            <td ${createTooltip('Capture Rate', d => d.captureRate + '%')}${comparisonMetrics ? getCellColor(parseFloat(dayData.captureRate), comparisonMetrics.captureRate) : ''}>
                ${dayData.captureRate}%
            </td>
            <td ${createTooltip('Gender Distribution', d => `${(d.menIn/(d.menIn+d.womenIn)*100).toFixed(1)}% M / ${(d.womenIn/(d.menIn+d.womenIn)*100).toFixed(1)}% F`)}>
                ${menPercentage}% M / ${womenPercentage}% F
            </td>
            <td ${createTooltip('Dwell Time', d => d.dwellTime + ' min')}${comparisonMetrics ? getCellColor(parseFloat(dayData.dwellTime), comparisonMetrics.dwellTime) : ''}>
                ${dayData.dwellTime} min
            </td>
            <td ${createTooltip('Data Accuracy', d => d.dataAccuracy + '%')}${comparisonMetrics ? getCellColor(parseFloat(dayData.dataAccuracy), comparisonMetrics.dataAccuracy) : ''}>
                ${dayData.dataAccuracy}%
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

function updateBenchmarkChart(selectedDate, compareDate = null, averageData = null) {
    if (!benchmarkChart) {
        console.error('Chart not initialized');
        return;
    }

    const mainData = getHourlyData(selectedDate);
    const comparisonData = averageData ? averageData.hourly : compareDate ? getHourlyData(compareDate) : null;
    const comparisonLabel = averageData ? '(Average)' : '(Comparison)';

    const datasets = [];
    let showY = false;
    let showY1 = false;
    let showY2 = false;
    let showY3 = false;

    // Helper function to add datasets with comparison
    function addDataset(config, data, compareData = null) {
        const datasetId = {
            visitorsIn: 'visitors',
            passersby: 'passersby',
            captureRate: 'capture-rate',
            conversion: 'conversion',
            menIn: 'men',
            womenIn: 'women'
        }[config.dataKey];

        const showLabels = document.querySelector(`.toggle-labels[data-dataset="${datasetId}"]`)?.classList.contains('active');
        
        // Main dataset configuration
        const mainDataset = {
            ...config,
            data: data.map(h => h[config.dataKey]),
            label: `${config.label}`,
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showLabels && value > 0;
                },
                align: config.type === 'bar' ? 'top' : 'bottom',
                formatter: (value) => {
                    if (config.dataKey === 'captureRate' || config.dataKey === 'conversion') {
                        return value + '%';
                    }
                    return Math.round(value).toLocaleString();
                },
                color: config.borderColor,
                font: {
                    weight: 'bold',
                    size: 11
                },
                padding: 6
            }
        };
        datasets.push(mainDataset);

        // Add comparison dataset if needed
        if (compareData) {
            const comparisonDataset = {
                ...config,
                data: compareData.map(h => h[config.dataKey]),
                label: `${config.label} ${comparisonLabel}`,
                borderColor: config.borderColor.replace('rgb', 'rgba').replace(')', ', 0.5)'),
                backgroundColor: config.backgroundColor instanceof CanvasGradient 
                    ? config.backgroundColor 
                    : config.backgroundColor.replace('rgba(', '').replace(')', '').split(',')
                        .map((v, i) => i === 3 ? ' 0.25)' : v)
                        .join(','),
                yAxisID: config.yAxisID,
                datalabels: {
                    ...mainDataset.datalabels,
                    display: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return showLabels && value > 0;
                    },
                    color: config.borderColor.replace('rgb', 'rgba').replace(')', ', 0.5)')
                }
            };
            datasets.push(comparisonDataset);
        }
    }

    // Visitors dataset (bar)
    if (document.getElementById('benchmarkShowVisitors').checked) {
        const config = {
            type: 'bar',
            dataKey: 'visitorsIn',
            label: 'Visitors',
            backgroundColor: 'rgba(133, 149, 39, 0.7)',
            borderColor: 'rgb(133, 149, 39)',
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, mainData, comparisonData);
        showY = true;
    }

    // Passersby dataset (line)
    if (document.getElementById('benchmarkShowPassersby').checked) {
        const ctx = benchmarkChart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, benchmarkChart.height);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.4)');
        gradient.addColorStop(1, 'rgba(139, 69, 19, 0.1)');

        const config = {
            type: 'line',
            dataKey: 'passersby',
            label: 'Passersby',
            borderColor: 'rgb(139, 69, 19)',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            yAxisID: 'y2'
        };
        addDataset(config, mainData, comparisonData);
        showY2 = true;
    }

    // Capture Rate dataset (line)
    if (document.getElementById('benchmarkShowCaptureRate').checked) {
        const config = {
            type: 'line',
            dataKey: 'captureRate',
            label: 'Capture Rate',
            borderColor: 'rgb(243, 151, 0)',
            backgroundColor: 'rgba(243, 151, 0, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            yAxisID: 'y1'
        };
        addDataset(config, mainData, comparisonData);
        showY1 = true;
    }

    // Conversion dataset (line)
    if (document.getElementById('benchmarkShowConversion').checked) {
        const config = {
            type: 'line',
            dataKey: 'conversion',
            label: 'Conversion',
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            yAxisID: 'y3'
        };
        addDataset(config, mainData, comparisonData);
        showY3 = true;
    }

    // Men dataset (bar)
    if (document.getElementById('benchmarkShowMen').checked) {
        const config = {
            type: 'bar',
            dataKey: 'menIn',
            label: 'Men',
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, mainData, comparisonData);
        showY = true;
    }

    // Women dataset (bar)
    if (document.getElementById('benchmarkShowWomen').checked) {
        const config = {
            type: 'bar',
            dataKey: 'womenIn',
            label: 'Women',
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, mainData, comparisonData);
        showY = true;
    }

    // Update chart configuration
    benchmarkChart.options.scales.y.display = showY;
    benchmarkChart.options.scales.y1.display = showY1;
    benchmarkChart.options.scales.y2.display = showY2;
    benchmarkChart.options.scales.y3.display = showY3;

    // Update chart with new datasets
    benchmarkChart.data.datasets = datasets;
    benchmarkChart.update();

    // Add this at the end of the function
    const comparisonHourlyData = comparisonData || null;
    const isAverage = averageData !== null;
    updateCaptureRateCards(mainData, comparisonHourlyData, isAverage);
}

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
            captureRate: '0.00',
            menIn: 0,
            womenIn: 0,
            groupIn: 0,
            conversion: '0.00'
        };
    }).map(hourData => ({
        ...hourData,
        // Calculate conversion rate as percentage of groups relative to visitors
        conversion: hourData.visitorsIn > 0 
            ? ((hourData.groupIn / hourData.visitorsIn) * 100).toFixed(2) 
            : '0.00',
        captureRate: hourData.passersby > 0 
            ? ((hourData.visitorsIn / hourData.passersby) * 100).toFixed(2) 
            : '0.00'
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
        const difference = (data.rate - data.compareRate).toFixed(2);
        const isPositive = difference > 0;
        
        // Add comparison rate value with 2 decimals
        const compareHtml = `
            <div class="capture-compare-rate">
                ${parseFloat(data.compareRate).toFixed(2)}%
                <span class="compare-label">${data.isAverage ? '(Average)' : '(Compare)'}</span>
            </div>
        `;
        rateElement.insertAdjacentHTML('afterend', compareHtml);
        
        // Add difference indicator
        const benchmarkHtml = `
            <div class="capture-benchmark ${isPositive ? 'positive' : 'negative'}">
                <span class="difference-icon">${isPositive ? '▲' : '▼'}</span>
                <span class="difference-value">${Math.abs(difference)}%</span>
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

    const totalVisitors = periodData.reduce((sum, h) => sum + h.visitorsIn, 0);
    const totalPassersby = periodData.reduce((sum, h) => sum + h.passersby, 0);

    return totalPassersby > 0 ? (totalVisitors / totalPassersby) * 100 : 0;
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

function initializeDailyBenchmark() {
    const dateInput = document.getElementById('dailyBenchmarkDate');
    const compareInput = document.getElementById('dailyBenchmarkCompareDate');
    const benchmarkToggle = document.getElementById('enableDailyBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableDailyAverageBenchmark');
    
    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Daily benchmark controls not found');
        return;
    }

    // Initialize chart
    initializeDailyBenchmarkChart();
    
    if (window.dashboardState.dayData.length > 0) {
        const lastDate = new Date(Math.max(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
        
        // Set the date to the start of the week
        const weekStart = getStartOfWeek(lastDate);
        dateInput.value = weekStart.toISOString().split('T')[0];
        
        // Set compare date to previous week
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        compareInput.value = prevWeekStart.toISOString().split('T')[0];
        
        // Initial updates
        updateDailyBenchmarkData(weekStart);
    }

    // Add event listeners
    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7);
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            updateDailyBenchmarkData(selectedDate, prevWeekDate);
        } else {
            compareInput.disabled = true;
            updateDailyBenchmarkData(new Date(dateInput.value));
        }
    });

    // Similar event listeners for other controls
    // ...existing event listener patterns...

    // Initialize weekday selection for custom period
    initializeWeekdaySelection();
}

function initializeWeekdaySelection() {
    // Implementation for initializeWeekdaySelection
}

function initializeDailyBenchmarkChart() {
    const ctx = document.getElementById('dailyBenchmarkChart').getContext('2d');

    if (window.dailyBenchmarkChart && typeof window.dailyBenchmarkChart.destroy === 'function') {
        window.dailyBenchmarkChart.destroy();
    }

    window.dailyBenchmarkChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            // ... similar options to hourly benchmark chart ...
        }
    });
}

function updateDailyBenchmarkData(selectedDate, compareDate = null, averageData = null) {
    const weekData = getWeekData(selectedDate);
    if (!weekData) {
        console.error('No data available for selected week');
        return;
    }

    updateDailyBenchmarkTable(weekData, compareDate ? getWeekData(compareDate) : null, averageData);
    updateDailyBenchmarkChart(weekData, compareDate ? getWeekData(compareDate) : null, averageData);
    updateWeeklyPeriodCards(weekData, compareDate ? getWeekData(compareDate) : null, averageData);
}

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
            captureRate: ((totals.visitorsIn / totals.passersby) * 100).toFixed(1),
            dwellTime: (totals.dwellTimeSum / weekData.length).toFixed(1),
            accuracy: (totals.accuracySum / weekData.length).toFixed(1)
        },
        genderSplit: {
            men: ((totals.menIn / (totals.menIn + totals.womenIn)) * 100).toFixed(1),
            women: ((totals.womenIn / (totals.menIn + totals.womenIn)) * 100).toFixed(1)
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
        impact: (((impact.avgVisitors - baselineAvg) / baselineAvg) * 100).toFixed(1),
        days: impact.days
    }));
}

function updateDailyBenchmarkTable(weekData, compareData = null, averageData = null) {
    const tbody = document.getElementById('dailyBenchmarkTableBody');
    if (!tbody) return;

    let html = createWeekDataRow(weekData, false, compareData || averageData);
    
    if (compareData) {
        html += createWeekDataRow(compareData, false, weekData);
    } else if (averageData) {
        html += createWeekDataRow(averageData, true, weekData);
    }

    tbody.innerHTML = html;
}

function createWeekDataRow(data, isAverage, comparison) {
    const weatherImpactText = data.weatherImpact
        .map(w => `${w.weather}: ${w.impact}% (${w.days} days)`)
        .join('\n');

    const diff = comparison ? {
        visitors: ((data.totals.visitorsIn - comparison.totals.visitorsIn) / comparison.totals.visitorsIn * 100).toFixed(1),
        captureRate: (parseFloat(data.dailyAverage.captureRate) - parseFloat(comparison.dailyAverage.captureRate)).toFixed(1)
    } : null;

    return `
        <tr>
            <td>${isAverage ? 'Average Week' : `Week ${data.weekNumber}`}<br>
                <small>${formatDate(data.startDate)} - ${formatDate(data.endDate)}</small>
            </td>
            <td>${data.totals.visitorsIn.toLocaleString()}
                ${diff ? `<small class="diff ${diff.visitors > 0 ? 'positive' : 'negative'}">${diff.visitors}%</small>` : ''}
            </td>
            <td>${data.dailyAverage.visitors.toLocaleString()}</td>
            <td>${data.dailyAverage.captureRate}%
                ${diff ? `<small class="diff ${diff.captureRate > 0 ? 'positive' : 'negative'}">${diff.captureRate}%</small>` : ''}
            </td>
            <td>${data.genderSplit.men}% M / ${data.genderSplit.women}% F</td>
            <td>${data.dailyAverage.dwellTime} min</td>
            <td>${data.dailyAverage.accuracy}%</td>
            <td class="weather-impact" title="${weatherImpactText}">
                ${data.weatherImpact.length} weather patterns
            </td>
        </tr>
    `;
}

function updateDailyBenchmarkChart(weekData, compareData = null, averageData = null) {
    if (!window.dailyBenchmarkChart) return;

    const datasets = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Main week data
    datasets.push({
        label: `Week ${weekData.weekNumber}`,
        data: days.map((_, i) => {
            const day = weekData.days.find(d => new Date(d.date).getDay() === (i + 1) % 7);
            return day ? day.visitorsIn : 0;
        }),
        backgroundColor: 'rgba(133, 149, 39, 0.7)',
        borderColor: 'rgb(133, 149, 39)',
        borderWidth: 1,
        datalabels: {
            display: true,
            align: 'top',
            formatter: value => value.toLocaleString()
        }
    });

    // Comparison data
    if (compareData || averageData) {
        const compData = compareData || averageData;
        datasets.push({
            label: averageData ? 'Average Week' : `Week ${compData.weekNumber}`,
            data: days.map((_, i) => {
                const day = compData.days.find(d => new Date(d.date).getDay() === (i + 1) % 7);
                return day ? day.visitorsIn : 0;
            }),
            backgroundColor: 'rgba(133, 149, 39, 0.3)',
            borderColor: 'rgb(133, 149, 39)',
            borderWidth: 1,
            borderDash: [5, 5],
            datalabels: {
                display: true,
                align: 'bottom',
                formatter: value => value.toLocaleString()
            }
        });
    }

    window.dailyBenchmarkChart.data.datasets = datasets;
    window.dailyBenchmarkChart.update();
}

function updateWeeklyPeriodCards(weekData, compareData = null, averageData = null) {
    // Update period cards with weekly aggregates
    const periods = {
        startWeek: { days: [1, 2], label: 'Monday-Tuesday' },
        midWeek: { days: [3, 4], label: 'Wednesday-Thursday' },
        weekend: { days: [5, 6, 0], label: 'Friday-Sunday' }
    };

    Object.entries(periods).forEach(([key, period]) => {
        const mainRate = calculateWeeklyPeriodRate(weekData, period.days);
        const compareRate = compareData ? 
            calculateWeeklyPeriodRate(compareData, period.days) :
            averageData ? calculateWeeklyPeriodRate(averageData, period.days) : null;

        updateCaptureCard(`${key}`, {
            rate: mainRate,
            compareRate: compareRate,
            period: {
                label: period.label,
                icon: getWeekdayIcon(key)
            },
            isAverage: !!averageData
        });
    });
}

function calculateWeeklyPeriodRate(weekData, dayNumbers) {
    const periodData = weekData.days.filter(day => 
        dayNumbers.includes(new Date(day.date).getDay())
    );

    const totals = periodData.reduce((acc, day) => ({
        visitorsIn: acc.visitorsIn + day.visitorsIn,
        passersby: acc.passersby + day.passersby
    }), { visitorsIn: 0, passersby: 0 });

    return totals.passersby > 0 ? 
        (totals.visitorsIn / totals.passersby) * 100 : 0;
}

function getWeekdayIcon(period) {
    const icons = {
        startWeek: 'calendar-day',
        midWeek: 'calendar-week',
        weekend: 'calendar-check'
    };
    return `<i class="fas fa-${icons[period]}"></i>`;
}
