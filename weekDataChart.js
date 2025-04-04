// Register the plugin if not already registered
if (!Chart.registry.plugins.get('datalabels')) {
    Chart.register(ChartDataLabels);
}

let weekDataChart = null;
let weekDataGradients = {};

// Object to track which datasets should show labels
let showWeekDataLabels = {
    visitors: false,
    passersby: false,
    captureRate: false,
    conversion: false,
    men: false,
    women: false
};

// Function to create gradients
function createWeekDataGradients(ctx, chartArea) {
    // Create gradients only if chart area is defined
    const createGradient = (colorStart, colorEnd) => {
        if (!chartArea) return colorStart; // Fallback to solid color if chart area not ready

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    // Create main gradients
    const gradients = {
        visitors: createGradient('rgba(45, 107, 34, 0.9)', 'rgba(45, 107, 34, 0.2)'), // Updated to #2d6b22
        passersby: createGradient('rgba(139, 69, 19, 0.9)', 'rgba(139, 69, 19, 0.2)'),
        captureRate: createGradient('rgba(243, 151, 0, 0.4)', 'rgba(243, 151, 0, 0.05)'),
        conversion: createGradient('rgba(88, 86, 214, 0.4)', 'rgba(88, 86, 214, 0.05)'),
        men: createGradient('rgba(0, 122, 255, 0.9)', 'rgba(0, 122, 255, 0.2)'),
        women: createGradient('rgba(255, 45, 85, 0.9)', 'rgba(255, 45, 85, 0.2)')
    };

    // Create comparison gradients
    gradients.visitors_comparison = createGradient('rgba(45, 107, 34, 0.3)', 'rgba(45, 107, 34, 0.05)'); // Updated to #2d6b22
    gradients.passersby_comparison = createGradient('rgba(139, 69, 19, 0.3)', 'rgba(139, 69, 19, 0.05)');
    gradients.captureRate_comparison = createGradient('rgba(243, 151, 0, 0.2)', 'rgba(243, 151, 0, 0.02)');
    gradients.conversion_comparison = createGradient('rgba(88, 86, 214, 0.2)', 'rgba(88, 86, 214, 0.02)');
    gradients.men_comparison = createGradient('rgba(0, 122, 255, 0.3)', 'rgba(0, 122, 255, 0.05)');
    gradients.women_comparison = createGradient('rgba(255, 45, 85, 0.3)', 'rgba(255, 45, 85, 0.05)');

    return gradients;
}

// Function to get the last date with data
function getLastWeekWithData() {
    if (window.dashboardState && window.dashboardState.dayData && window.dashboardState.dayData.length > 0) {
        const lastDate = new Date(Math.max(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
        return getStartOfWeek(lastDate);
    }
    return getStartOfWeek(new Date()); // Default to current week if no data
}

// Function to get the start of the week (Monday) for a given date
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
}

// Initialize the chart
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready, initializing week data chart');
            initializeWeekDataChart();
            initializeWeekDataChartControls();
            initializeToggleLabelsButtons();
        }
    }, 100);
});

function initializeWeekDataChart() {
    const ctx = document.getElementById('weekDataChart').getContext('2d');

    if (weekDataChart) {
        weekDataChart.destroy();
    }

    weekDataChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Will be populated with actual dates
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
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y1') {
                                label += context.parsed.y.toFixed(2) + '%';
                            } else {
                                label += Math.round(context.parsed.y).toLocaleString();
                            }
                            return label;
                        }
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM yyyy' // Format: Thu 01 Apr 2025
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        },
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 12
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Visitors/Men/Women',
                        color: 'rgb(45, 107, 34)', // Updated to #2d6b22
                        font: {
                            weight: 'bold'
                        }
                    },
                    // Auto-scaling will be handled in updateWeekDataChart
                    grace: '10%',
                    ticks: {
                        precision: 0,
                        callback: function(value) {
                            return Math.round(value).toLocaleString();
                        },
                        color: 'rgb(45, 107, 34)', // Updated to #2d6b22
                        font: {
                            weight: 'bold'
                        }
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
                    display: false,
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Other Metrics',
                        color: 'rgb(139, 69, 19)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    // Auto-scaling will be handled in updateWeekDataChart
                    grace: '10%',
                    ticks: {
                        precision: 2,
                        callback: function(value) {
                            return value + '%';
                        },
                        color: 'rgb(139, 69, 19)',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });

    // Add download buttons using the unified implementation
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('weekDataChart');
    }

    // After chart is initialized, update it with empty data
    // This ensures the chart area is defined before creating gradients
    weekDataChart.update();

    // Now we can update with actual data once the chart area is defined
    if (window.dashboardState && window.dashboardState.dayData && window.dashboardState.dayData.length > 0) {
        // Get the most recent week
        const lastWeekStart = getLastWeekWithData();

        // Update the chart
        updateWeekDataChart(lastWeekStart);
    }
}

function initializeWeekDataChartControls() {
    // Add event listeners for date inputs and benchmark toggles
    const dateInput = document.getElementById('weekDataDate');
    const compareInput = document.getElementById('weekDataCompareDate');
    const benchmarkToggle = document.getElementById('enableWeekDataBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableWeekDataAverageBenchmark');

    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Week data chart controls not found');
        return;
    }

    // Set initial date to the most recent week
    const lastWeekStart = getLastWeekWithData();
    dateInput.value = lastWeekStart.toISOString().split('T')[0];

    // Set compare date to previous week
    const prevWeekStart = new Date(lastWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    compareInput.value = prevWeekStart.toISOString().split('T')[0];

    // Update chart when date changes
    dateInput.addEventListener('change', (e) => {
        const selectedDate = getStartOfWeek(new Date(e.target.value));

        if (benchmarkToggle.checked) {
            const compareDate = getStartOfWeek(new Date(compareInput.value));
            updateWeekDataChart(selectedDate, compareDate);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageWeekData(selectedDate);
            updateWeekDataChart(selectedDate, null, averageData);
        } else {
            updateWeekDataChart(selectedDate);
        }
    });

    // Update chart when compare date changes
    compareInput.addEventListener('change', (e) => {
        if (benchmarkToggle.checked) {
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const compareDate = getStartOfWeek(new Date(e.target.value));
            updateWeekDataChart(selectedDate, compareDate);
        }
    });

    // Update chart when benchmark toggle changes
    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const compareDate = getStartOfWeek(new Date(compareInput.value));
            updateWeekDataChart(selectedDate, compareDate);
        } else {
            compareInput.disabled = true;
            updateWeekDataChart(getStartOfWeek(new Date(dateInput.value)));
        }
    });

    // Update chart when average benchmark toggle changes
    averageBenchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            benchmarkToggle.checked = false;
            compareInput.disabled = true;
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            const averageData = calculateAverageWeekData(selectedDate);
            updateWeekDataChart(selectedDate, null, averageData);
        } else {
            updateWeekDataChart(getStartOfWeek(new Date(dateInput.value)));
        }
    });

    // Add dataset toggle listeners
    document.querySelectorAll('#week-data input[type="checkbox"][id^="weekDataShow"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedDate = getStartOfWeek(new Date(dateInput.value));
            let compareDate = null;
            let averageData = null;

            if (benchmarkToggle.checked) {
                compareDate = getStartOfWeek(new Date(compareInput.value));
            } else if (averageBenchmarkToggle.checked) {
                averageData = calculateAverageWeekData(selectedDate);
            }

            updateWeekDataChart(selectedDate, compareDate, averageData);
        });
    });

    // Add window resize handler to update font sizes
    window.addEventListener('resize', handleWeekDataChartResize);
}

// Handle window resize for week data chart
function handleWeekDataChartResize() {
    // Debounce the resize event
    if (window.weekDataChartResizeTimeout) {
        clearTimeout(window.weekDataChartResizeTimeout);
    }

    window.weekDataChartResizeTimeout = setTimeout(() => {
        if (weekDataChart) {
            // Update font sizes based on window width
            const isPortrait = window.innerWidth < 768;

            // Update X axis
            if (weekDataChart.options.scales.x.title && weekDataChart.options.scales.x.title.font) {
                weekDataChart.options.scales.x.title.font.size = isPortrait ? 8 : 16;
            }

            if (weekDataChart.options.scales.x.ticks && weekDataChart.options.scales.x.ticks.font) {
                weekDataChart.options.scales.x.ticks.font.size = isPortrait ? 8 : 12;
                weekDataChart.options.scales.x.ticks.maxTicksLimit = isPortrait ? 6 : 12;
            }

            // Update Y axes
            ['y', 'y1'].forEach(axisId => {
                if (weekDataChart.options.scales[axisId]) {
                    // Update font sizes for title
                    if (weekDataChart.options.scales[axisId].title && weekDataChart.options.scales[axisId].title.font) {
                        weekDataChart.options.scales[axisId].title.font.size = isPortrait ? 8 : 14;
                    }

                    // Update font sizes for ticks
                    if (weekDataChart.options.scales[axisId].ticks && weekDataChart.options.scales[axisId].ticks.font) {
                        weekDataChart.options.scales[axisId].ticks.font.size = isPortrait ? 8 : 12;
                    }
                }
            });

            // Update the chart
            weekDataChart.update();
        }
    }, 250);
}

// Add data label toggle listeners
function initializeToggleLabelsButtons() {
    document.querySelectorAll('#week-data .toggle-labels').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');

            // Get the dataset type from the data-dataset attribute
            const datasetType = button.getAttribute('data-dataset');

            // Toggle the showWeekDataLabels flag for this dataset
            if (datasetType === 'visitors') {
                showWeekDataLabels.visitors = !showWeekDataLabels.visitors;
            } else if (datasetType === 'passersby') {
                showWeekDataLabels.passersby = !showWeekDataLabels.passersby;
            } else if (datasetType === 'capture-rate') {
                showWeekDataLabels.captureRate = !showWeekDataLabels.captureRate;
            } else if (datasetType === 'conversion') {
                showWeekDataLabels.conversion = !showWeekDataLabels.conversion;
            } else if (datasetType === 'men') {
                showWeekDataLabels.men = !showWeekDataLabels.men;
            } else if (datasetType === 'women') {
                showWeekDataLabels.women = !showWeekDataLabels.women;
            }

            const selectedDate = getStartOfWeek(new Date(document.getElementById('weekDataDate').value));
            let compareDate = null;
            let averageData = null;

            const benchmarkToggle = document.getElementById('enableWeekDataBenchmark');
            const averageBenchmarkToggle = document.getElementById('enableWeekDataAverageBenchmark');
            const compareInput = document.getElementById('weekDataCompareDate');

            if (benchmarkToggle.checked) {
                compareDate = getStartOfWeek(new Date(compareInput.value));
            } else if (averageBenchmarkToggle.checked) {
                averageData = calculateAverageWeekData(selectedDate);
            }

            updateWeekDataChart(selectedDate, compareDate, averageData);
        });
    });
}

function updateWeekDataChart(weekStart, compareWeekStart = null, averageData = null) {
    if (!weekDataChart) {
        console.error('Week data chart not initialized');
        return;
    }

    // Get the week data
    const weekData = getWeekData(weekStart);
    if (!weekData || !weekData.days || weekData.days.length === 0) {
        console.error('No data available for selected week');
        weekDataChart.data.datasets = [];
        weekDataChart.update();
        return;
    }

    // Get comparison data
    let comparisonData = null;
    let comparisonLabel = '';

    if (compareWeekStart && !averageData) {
        comparisonData = getWeekData(compareWeekStart);
        comparisonLabel = `Week ${getWeekNumber(compareWeekStart)}`;
    } else if (averageData) {
        comparisonData = averageData;
        comparisonLabel = 'Average';
    }

    // Create gradients
    const chartArea = weekDataChart.chartArea;
    const ctx = weekDataChart.ctx;
    weekDataGradients = createWeekDataGradients(ctx, chartArea);

    // Generate dates for the week
    const weekDates = [];
    const currentDate = new Date(weekData.startDate);
    for (let i = 0; i < 7; i++) {
        weekDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update chart labels with actual dates
    weekDataChart.data.labels = weekDates;

    // Prepare datasets
    const datasets = [];
    let showY = false;
    let showY1 = false;

    // Helper function to add a dataset
    function addDataset(config, data, compareData = null) {
        const datasetId = config.dataKey.replace(/([A-Z])/g, '-$1').toLowerCase();

        // Get the dataset type for label lookup
        const datasetType = datasetId.replace('-', '');

        // Check if data labels should be shown
        const showLabels = showWeekDataLabels[datasetType] || false;

        // Prepare data array for each day of the week
        const dayData = Array(7).fill(0);

        // Fill in the data for each day
        data.days.forEach(day => {
            const date = new Date(day.date);
            // Find the index by comparing dates (ignoring time)
            const dayIndex = weekDates.findIndex(weekDate =>
                weekDate.getFullYear() === date.getFullYear() &&
                weekDate.getMonth() === date.getMonth() &&
                weekDate.getDate() === date.getDate()
            );

            if (dayIndex !== -1) {
                dayData[dayIndex] = parseFloat(day[config.dataKey]) || 0;
            }
        });

        // Add main dataset
        datasets.push({
            ...config,
            data: dayData,
            dataKey: config.dataKey, // Ensure dataKey is included for Y-axis scaling
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showLabels && value > 0;
                },
                align: 'top',
                anchor: 'end',
                formatter: (value) => {
                    if (config.dataKey === 'captureRate' || config.dataKey === 'conversion') {
                        return value.toFixed(2) + '%';
                    }
                    return Math.round(value).toLocaleString();
                },
                font: {
                    weight: 'bold',
                    size: 11
                },
                padding: 6,
                color: config.borderColor
            }
        });

        // Add comparison dataset if available
        if (compareData) {
            // Prepare comparison data array
            const compareDataArray = Array(7).fill(0);

            if (compareData.days) {
                // For direct week comparison
                compareData.days.forEach(day => {
                    const date = new Date(day.date);
                    // Find the index by comparing dates (ignoring time)
                    const dayIndex = weekDates.findIndex(weekDate =>
                        weekDate.getFullYear() === date.getFullYear() &&
                        weekDate.getMonth() === date.getMonth() &&
                        weekDate.getDate() === date.getDate()
                    );

                    if (dayIndex !== -1) {
                        compareDataArray[dayIndex] = parseFloat(day[config.dataKey]) || 0;
                    }
                });
            } else {
                // For average data
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                weekDates.forEach((date, index) => {
                    const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
                    if (compareData[dayName]) {
                        compareDataArray[index] = parseFloat(compareData[dayName][config.dataKey]) || 0;
                    }
                });
            }

            // Create comparison background color
            const comparisonBgColor = weekDataGradients[`${datasetType}_comparison`] || 'rgba(150, 150, 150, 0.2)';

            datasets.push({
                ...config,
                label: `${config.label} ${comparisonLabel}`,
                data: compareDataArray,
                dataKey: config.dataKey, // Ensure dataKey is included for Y-axis scaling
                backgroundColor: comparisonBgColor,
                borderColor: 'rgba(150, 150, 150, 0.8)',
                borderDash: [5, 5],
                datalabels: {
                    display: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return showLabels && value > 0;
                    },
                    align: 'bottom',
                    anchor: 'end',
                    formatter: (value) => {
                        if (config.dataKey === 'captureRate' || config.dataKey === 'conversion') {
                            return value.toFixed(2) + '%';
                        }
                        return Math.round(value).toLocaleString();
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    padding: 6,
                    color: 'rgba(150, 150, 150, 0.8)'
                }
            });
        }
    }

    // Visitors dataset (bar)
    if (document.getElementById('weekDataShowVisitors')?.checked) {
        const config = {
            type: 'bar',
            dataKey: 'visitorsIn',
            label: 'Visitors',
            backgroundColor: weekDataGradients.visitors,
            borderColor: 'rgb(45, 107, 34)', // Updated to #2d6b22
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, weekData, comparisonData);
        showY = true;
    }

    // Passersby dataset (bar)
    if (document.getElementById('weekDataShowPassersby')?.checked) {
        const config = {
            type: 'bar',
            dataKey: 'passersby',
            label: 'Passersby',
            backgroundColor: weekDataGradients.passersby,
            borderColor: 'rgb(139, 69, 19)',
            borderWidth: 1,
            yAxisID: 'y1'
        };
        addDataset(config, weekData, comparisonData);
        showY1 = true;
    }

    // Capture rate dataset (line)
    if (document.getElementById('weekDataShowCaptureRate')?.checked) {
        const config = {
            type: 'line',
            dataKey: 'captureRate',
            label: 'Capture Rate',
            backgroundColor: weekDataGradients.captureRate,
            borderColor: 'rgb(243, 151, 0)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        };
        addDataset(config, weekData, comparisonData);
        showY1 = true;
    }

    // Conversion dataset (line)
    if (document.getElementById('weekDataShowConversion')?.checked) {
        const config = {
            type: 'line',
            dataKey: 'conversion',
            label: 'Conversion',
            backgroundColor: weekDataGradients.conversion,
            borderColor: 'rgb(88, 86, 214)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        };
        addDataset(config, weekData, comparisonData);
        showY1 = true;
    }

    // Men dataset (bar)
    if (document.getElementById('weekDataShowMen')?.checked) {
        const config = {
            type: 'bar',
            dataKey: 'menIn',
            label: 'Men',
            backgroundColor: weekDataGradients.men,
            borderColor: 'rgb(0, 114, 189)',
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, weekData, comparisonData);
        showY = true;
    }

    // Women dataset (bar)
    if (document.getElementById('weekDataShowWomen')?.checked) {
        const config = {
            type: 'bar',
            dataKey: 'womenIn',
            label: 'Women',
            backgroundColor: weekDataGradients.women,
            borderColor: 'rgb(227, 86, 178)',
            borderWidth: 1,
            yAxisID: 'y'
        };
        addDataset(config, weekData, comparisonData);
        showY = true;
    }

    // Calculate max values for better Y-axis scaling
    let maxVisitors = 0;
    let maxPassersby = 0;
    let maxCaptureRate = 0;
    let maxConversion = 0;

    datasets.forEach(dataset => {
        if (dataset.yAxisID === 'y') {
            // Find max value for visitors axis
            const max = Math.max(...dataset.data.filter(val => val !== null && val !== undefined));
            if (max > maxVisitors) maxVisitors = max;
        } else if (dataset.yAxisID === 'y1') {
            if (dataset.dataKey === 'passersby') {
                // Find max value for passersby
                const max = Math.max(...dataset.data.filter(val => val !== null && val !== undefined));
                if (max > maxPassersby) maxPassersby = max;
            } else if (dataset.dataKey === 'captureRate') {
                // Find max value for capture rate
                const max = Math.max(...dataset.data.filter(val => val !== null && val !== undefined));
                if (max > maxCaptureRate) maxCaptureRate = max;
            } else if (dataset.dataKey === 'conversion') {
                // Find max value for conversion
                const max = Math.max(...dataset.data.filter(val => val !== null && val !== undefined));
                if (max > maxConversion) maxConversion = max;
            }
        }
    });

    // Set Y-axis max values for better visualization
    if (showY) {
        // For visitors axis, round up to nearest 100 or 1000 depending on magnitude
        if (maxVisitors > 0) {
            const roundTo = maxVisitors > 1000 ? 1000 : 100;
            weekDataChart.options.scales.y.max = Math.ceil(maxVisitors / roundTo) * roundTo;

            // Set appropriate step size
            const stepSize = maxVisitors > 1000 ? 200 : (maxVisitors > 500 ? 100 : 50);
            weekDataChart.options.scales.y.ticks.stepSize = stepSize;
        }
    }

    if (showY1) {
        // For percentage axis (capture rate and conversion)
        const maxPercentage = Math.max(maxCaptureRate, maxConversion);
        if (maxPercentage > 0) {
            // Round up to nearest 5% or 10% depending on magnitude
            const roundTo = maxPercentage > 50 ? 10 : 5;
            weekDataChart.options.scales.y1.max = Math.ceil(maxPercentage / roundTo) * roundTo;

            // Set appropriate step size
            const stepSize = maxPercentage > 50 ? 10 : (maxPercentage > 20 ? 5 : 2);
            weekDataChart.options.scales.y1.ticks.stepSize = stepSize;
        }

        // If passersby is shown and significantly larger than visitors, use a separate axis
        if (maxPassersby > 0 && maxPassersby > maxVisitors * 2) {
            // TODO: Consider adding a separate Y-axis for passersby if needed
        }
    }

    // Update chart
    weekDataChart.data.datasets = datasets;
    weekDataChart.options.scales.y.display = showY;
    weekDataChart.options.scales.y1.display = showY1;
    weekDataChart.update();
}

// This function has been replaced by the unified implementation in download-buttons.js

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

// Helper function to get the week number
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Helper function to calculate average week data
function calculateAverageWeekData(selectedDate) {
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
                date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + index),
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
