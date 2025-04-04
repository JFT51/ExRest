// Register the plugin if not already registered
if (!Chart.registry.plugins.get('datalabels')) {
    Chart.register(ChartDataLabels);
}

let benchmarkHourlyChart = null;
let benchmarkGradients = {};

// Function to create gradients
function createBenchmarkGradients(ctx, chartArea) {
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
function getLastDateWithData() {
    if (window.dashboardState && window.dashboardState.dayData && window.dashboardState.dayData.length > 0) {
        return new Date(Math.max(
            ...window.dashboardState.dayData.map(d => new Date(d.date))
        ));
    }
    return new Date(); // Default to today if no data
}

// Function to check if a date has hourly data
function hasHourlyData(date) {
    if (!window.dashboardState || !window.dashboardState.hourData) return false;

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    return window.dashboardState.hourData.some(hour => {
        const hourDate = new Date(hour.timestamp);
        hourDate.setHours(0, 0, 0, 0);
        return hourDate.getTime() === compareDate.getTime() &&
               (hour.visitorsIn > 0 || hour.passersby > 0);
    });
}

// Function to find the nearest date with data
function findNearestDateWithData(targetDate) {
    if (!window.dashboardState || !window.dashboardState.dayData || window.dashboardState.dayData.length === 0) {
        return new Date();
    }

    // First check if the target date has data
    if (hasHourlyData(targetDate)) {
        return targetDate;
    }

    // If not, find the nearest date with data
    const allDates = window.dashboardState.dayData
        .map(d => new Date(d.date))
        .filter(date => hasHourlyData(date))
        .sort((a, b) => a - b);

    if (allDates.length === 0) return new Date();

    const targetTime = targetDate.getTime();
    let nearestDate = allDates[0];
    let minDiff = Math.abs(targetTime - nearestDate.getTime());

    for (let i = 1; i < allDates.length; i++) {
        const diff = Math.abs(targetTime - allDates[i].getTime());
        if (diff < minDiff) {
            minDiff = diff;
            nearestDate = allDates[i];
        }
    }

    return nearestDate;
}

function initializeBenchmarkHourlyChart() {
    const ctx = document.getElementById('benchmarkHourlyChart').getContext('2d');

    if (benchmarkHourlyChart) {
        benchmarkHourlyChart.destroy();
    }

    benchmarkHourlyChart = new Chart(ctx, {
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
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: {
                    top: 0,
                    right: 25,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Hourly Analysis',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 5,
                        bottom: 5
                    }
                },
                subtitle: {
                    display: false,
                    text: 'Each metric uses its own optimized scale',
                    font: {
                        size: 12,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 15
                    }
                },
                legend: {
                    display: false // Hide the legend
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        title: function(tooltipItems) {
                            const hour = tooltipItems[0].label;
                            const date = benchmarkHourlyChart?.selectedDate?.toLocaleDateString() || '';
                            return `${hour} - ${date}`;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;

                            if (label) {
                                label += ': ';
                            }

                            if (context.dataset.yAxisID === 'y1') {
                                // Percentage values
                                label += value.toFixed(2) + '%';
                            } else {
                                // Count values
                                label += Math.round(value).toLocaleString();
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: false,  // Default to false, will be overridden per dataset
                    anchor: 'end',
                    align: 'top',
                    formatter: function(value, context) {
                        const datasetLabel = context.dataset.label;
                        if (datasetLabel.includes('Rate') || datasetLabel.includes('Conversion')) {
                            return value.toFixed(2) + '%';
                        }
                        return Math.round(value).toLocaleString();
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
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Visitors/Men/Women',
                        color: 'rgb(45, 107, 34)' // Updated to #2d6b22
                    },
                    suggestedMax: 100,
                    grace: '5%',
                    ticks: {
                        precision: 0,
                        stepSize: 10,
                        callback: function(value) {
                            return Math.round(value).toLocaleString();
                        },
                        color: 'rgb(45, 107, 34)' // Updated to #2d6b22
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
                        text: 'Capture Rate (%)',
                        color: 'rgb(243, 151, 0)'
                    },
                    suggestedMax: 100,
                    grace: '5%',
                    ticks: {
                        precision: 2,
                        stepSize: 10,
                        callback: function(value) {
                            return value + '%';
                        },
                        color: 'rgb(243, 151, 0)'
                    }
                },
                y2: {
                    display: false,
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Passersby',
                        color: 'rgb(139, 69, 19)'
                    },
                    suggestedMax: 100,
                    grace: '5%',
                    ticks: {
                        precision: 0,
                        stepSize: 10,
                        callback: function(value) {
                            return Math.round(value).toLocaleString();
                        },
                        color: 'rgb(139, 69, 19)'
                    }
                },
                y3: {
                    display: false,
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Conversion Rate (%)',
                        color: 'rgb(88, 86, 214)'
                    },
                    suggestedMax: 100,
                    grace: '5%',
                    ticks: {
                        precision: 2,
                        stepSize: 10,
                        callback: function(value) {
                            return value + '%';
                        },
                        color: 'rgb(88, 86, 214)'
                    }
                }
            }
        }
    });
    // Add download buttons using the unified implementation
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('benchmarkHourlyChart');
    }

    // After chart is initialized, update it with empty data
    // This ensures the chart area is defined before creating gradients
    benchmarkHourlyChart.update();

    // Now that the chart is rendered, we can create the gradients
    benchmarkGradients = createBenchmarkGradients(ctx, benchmarkHourlyChart.chartArea);

    // Now update the chart with data and gradients
    const lastDate = getLastDateWithData();
    const lastDateWithHourlyData = findNearestDateWithData(lastDate);
    updateBenchmarkHourlyChart(lastDateWithHourlyData);
}

// Function to calculate appropriate axis ranges based on data
function calculateAxisRanges(datasets) {
    // Initialize min/max values for each axis
    let yMax = 0;   // For visitors, men, women
    let y1Max = 0;  // For capture rate
    let y2Max = 0;  // For passersby
    let y3Max = 0;  // For conversion rate

    // Process each dataset to find appropriate ranges
    datasets.forEach(dataset => {
        // Skip empty datasets
        if (!dataset.data || dataset.data.length === 0) return;

        // Calculate max value for this dataset
        const maxValue = Math.max(...dataset.data.filter(v => !isNaN(v) && v !== null));

        // Update appropriate axis range based on dataset type
        if (dataset.yAxisID === 'y') {
            yMax = Math.max(yMax, maxValue);
        } else if (dataset.yAxisID === 'y1') {
            y1Max = Math.max(y1Max, maxValue);
        } else if (dataset.yAxisID === 'y2') {
            y2Max = Math.max(y2Max, maxValue);
        } else if (dataset.yAxisID === 'y3') {
            y3Max = Math.max(y3Max, maxValue);
        }
    });

    // Add padding to the max values for better visualization
    yMax = Math.ceil(yMax * 1.1);  // Add 10% padding
    y1Max = Math.ceil(y1Max * 1.1); // Add 10% padding
    y2Max = Math.ceil(y2Max * 1.1); // Add 10% padding
    y3Max = Math.ceil(y3Max * 1.1); // Add 10% padding

    // Ensure minimum values for better visualization
    yMax = Math.max(yMax, 10);   // At least 10 for visitors count
    y1Max = Math.max(y1Max, 10); // At least 10% for capture rate
    y2Max = Math.max(y2Max, 10); // At least 10 for passersby count
    y3Max = Math.max(y3Max, 10); // At least 10% for conversion rate

    // Round to nice numbers
    yMax = roundToNiceNumber(yMax);
    y1Max = roundToNiceNumber(y1Max);
    y2Max = roundToNiceNumber(y2Max);
    y3Max = roundToNiceNumber(y3Max);

    return { yMax, y1Max, y2Max, y3Max };
}

// Helper function to round to a nice number for axis limits
function roundToNiceNumber(num) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
    const normalized = num / magnitude;

    if (normalized < 1.5) return 1.5 * magnitude;
    if (normalized < 2) return 2 * magnitude;
    if (normalized < 2.5) return 2.5 * magnitude;
    if (normalized < 5) return 5 * magnitude;
    return 10 * magnitude;
}

function updateBenchmarkHourlyChart(selectedDate, compareDate = null, averageData = null) {
    if (!benchmarkHourlyChart) {
        console.error('Benchmark hourly chart not initialized');
        return;
    }

    // If selectedDate is not provided or invalid, use the last date with data
    if (!selectedDate || isNaN(selectedDate.getTime())) {
        selectedDate = getLastDateWithData();
    }

    // Find the nearest date with actual data
    selectedDate = findNearestDateWithData(selectedDate);

    // Update the date input to reflect the actual date being shown
    const dateInput = document.getElementById('benchmarkDate');
    if (dateInput) {
        dateInput.value = selectedDate.toISOString().split('T')[0];
    }

    // Update chart title to show the selected date with full timestamp
    const formattedDate = formatDate(selectedDate);
    benchmarkHourlyChart.options.plugins.title.text = `Hourly Analysis - ${formattedDate}`;

    // Store the selected date in the chart for tooltip access
    benchmarkHourlyChart.selectedDate = selectedDate;

    const mainData = getHourlyData(selectedDate);
    const comparisonData = averageData ? averageData.hourly : compareDate ? getHourlyData(compareDate) : null;
    const comparisonLabel = '';

    // If the chart area has changed, recreate the gradients
    if (benchmarkHourlyChart.chartArea &&
        (benchmarkGradients.visitors === undefined ||
         benchmarkHourlyChart.chartArea.bottom !== benchmarkGradients._chartArea?.bottom)) {
        benchmarkGradients = createBenchmarkGradients(benchmarkHourlyChart.ctx, benchmarkHourlyChart.chartArea);
        benchmarkGradients._chartArea = {...benchmarkHourlyChart.chartArea};
    }

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

        // Check if data labels should be shown
        const labelToggle = document.querySelector(`#benchmark .toggle-labels[data-dataset="${datasetId}"]`);
        const showLabels = labelToggle?.classList.contains('active') || false;

        // Add main dataset
        datasets.push({
            ...config,
            data: Array.from({length: 24}, (_, i) => {
                const hourData = data.find(d => new Date(d.timestamp).getHours() === i);
                return hourData ? parseFloat(hourData[config.dataKey]) : 0;
            }),
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showLabels && value > 0;
                }
            }
        });

        // Add comparison dataset if available
        if (compareData) {
            // Create a lighter version of the background color for comparison
            let comparisonBgColor;
            const colorMatch = config.borderColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (colorMatch) {
                const [_, r, g, b] = colorMatch.map(Number);
                // Check if we have a gradient for this dataset type
                const datasetType = config.dataKey === 'visitorsIn' ? 'visitors' :
                                   config.dataKey === 'menIn' ? 'men' :
                                   config.dataKey === 'womenIn' ? 'women' :
                                   config.dataKey;

                // Create a lighter gradient or use a fallback
                if (benchmarkGradients[`${datasetType}_comparison`]) {
                    comparisonBgColor = benchmarkGradients[`${datasetType}_comparison`];
                } else if (benchmarkHourlyChart.chartArea) {
                    // Create a new comparison gradient and store it
                    const ctx = benchmarkHourlyChart.ctx;
                    const chartArea = benchmarkHourlyChart.chartArea;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.05)`);
                    benchmarkGradients[`${datasetType}_comparison`] = gradient;
                    comparisonBgColor = gradient;
                } else {
                    comparisonBgColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
                }
            } else {
                comparisonBgColor = 'rgba(200, 200, 200, 0.5)';
            }

            // Determine the dataset type for gradient lookup
            const datasetType = config.dataKey === 'visitorsIn' ? 'visitors' :
                               config.dataKey === 'menIn' ? 'men' :
                               config.dataKey === 'womenIn' ? 'women' :
                               config.dataKey;

            datasets.push({
                ...config,
                label: `${config.label} ${comparisonLabel}`,
                data: Array.from({length: 24}, (_, i) => {
                    const hourData = compareData.find(d => new Date(d.timestamp).getHours() === i);
                    return hourData ? parseFloat(hourData[config.dataKey]) : 0;
                }),
                backgroundColor: benchmarkGradients[`${datasetType}_comparison`] || comparisonBgColor,
                borderColor: 'rgba(150, 150, 150, 0.8)',
                borderDash: [5, 5],
                datalabels: {
                    display: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return showLabels && value > 0;
                    }
                }
            });
        }
    }

    // Dataset configurations
    const datasetConfigs = [
        {
            id: 'benchmarkShowVisitors',
            config: {
                type: 'bar',
                dataKey: 'visitorsIn',
                label: 'Visitors',
                backgroundColor: benchmarkGradients.visitors || 'rgba(45, 107, 34, 0.7)', // Updated to #2d6b22
                borderColor: 'rgb(45, 107, 34)', // Updated to #2d6b22
                borderWidth: 1,
                yAxisID: 'y'
            },
            axisToShow: 'y'
        },
        {
            id: 'benchmarkShowPassersby',
            config: {
                type: 'bar',
                dataKey: 'passersby',
                label: 'Passersby',
                backgroundColor: benchmarkGradients.passersby || 'rgba(139, 69, 19, 0.7)',
                borderColor: 'rgb(139, 69, 19)',
                borderWidth: 1,
                yAxisID: 'y2'
            },
            axisToShow: 'y2'
        },
        {
            id: 'benchmarkShowCaptureRate',
            config: {
                type: 'line',
                dataKey: 'captureRate',
                label: 'Capture Rate',
                backgroundColor: benchmarkGradients.captureRate || 'rgba(243, 151, 0, 0.2)',
                borderColor: 'rgb(243, 151, 0)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                yAxisID: 'y1'
            },
            axisToShow: 'y1'
        },
        {
            id: 'benchmarkShowConversion',
            config: {
                type: 'line',
                dataKey: 'conversion',
                label: 'Conversion',
                backgroundColor: benchmarkGradients.conversion || 'rgba(88, 86, 214, 0.2)',
                borderColor: 'rgb(88, 86, 214)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                yAxisID: 'y3'
            },
            axisToShow: 'y3'
        },
        {
            id: 'benchmarkShowMen',
            config: {
                type: 'bar',
                dataKey: 'menIn',
                label: 'Men',
                backgroundColor: benchmarkGradients.men || 'rgba(0, 122, 255, 0.7)',
                borderColor: 'rgb(0, 122, 255)',
                borderWidth: 1,
                yAxisID: 'y'
            },
            axisToShow: 'y'
        },
        {
            id: 'benchmarkShowWomen',
            config: {
                type: 'bar',
                dataKey: 'womenIn',
                label: 'Women',
                backgroundColor: benchmarkGradients.women || 'rgba(255, 45, 85, 0.7)',
                borderColor: 'rgb(255, 45, 85)',
                borderWidth: 1,
                yAxisID: 'y'
            },
            axisToShow: 'y'
        }
    ];

    // Add datasets based on checkbox state
    datasetConfigs.forEach(({ id, config, axisToShow }) => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            addDataset(config, mainData, comparisonData);
            if (axisToShow === 'y') showY = true;
            if (axisToShow === 'y1') showY1 = true;
            if (axisToShow === 'y2') showY2 = true;
            if (axisToShow === 'y3') showY3 = true;
        }
    });

    // If no datasets are selected, show at least visitors by default
    if (datasets.length === 0) {
        const defaultConfig = datasetConfigs.find(d => d.id === 'benchmarkShowVisitors');
        if (defaultConfig) {
            addDataset(defaultConfig.config, mainData, comparisonData);
            showY = true;

            // Also check the checkbox
            const checkbox = document.getElementById('benchmarkShowVisitors');
            if (checkbox) checkbox.checked = true;
        }
    }

    // Calculate appropriate axis ranges based on the datasets
    const { yMax, y1Max, y2Max, y3Max } = calculateAxisRanges(datasets);

    // Update y-axis configuration based on data
    benchmarkHourlyChart.options.scales.y.display = showY;
    benchmarkHourlyChart.options.scales.y1.display = showY1;
    benchmarkHourlyChart.options.scales.y2.display = showY2;
    benchmarkHourlyChart.options.scales.y3.display = showY3;

    // Set appropriate max values for better visualization
    if (showY) {
        benchmarkHourlyChart.options.scales.y.max = yMax;

        // Adjust step size based on the max value
        const stepSize = Math.max(1, Math.round(yMax / 5));
        benchmarkHourlyChart.options.scales.y.ticks.stepSize = stepSize;

        // Add appropriate grid lines
        benchmarkHourlyChart.options.scales.y.grid.tickLength = 5;
        benchmarkHourlyChart.options.scales.y.grid.display = true;

        // Update axis title to reflect that it's for Visitors/Men/Women
        benchmarkHourlyChart.options.scales.y.title.text = `Visitors/Men/Women`;
    }

    if (showY1) {
        benchmarkHourlyChart.options.scales.y1.max = y1Max;

        // Adjust step size based on the max value
        const stepSize = Math.max(5, Math.round(y1Max / 5));
        benchmarkHourlyChart.options.scales.y1.ticks.stepSize = stepSize;

        // Add appropriate grid lines
        benchmarkHourlyChart.options.scales.y1.grid.tickLength = 5;
        benchmarkHourlyChart.options.scales.y1.grid.display = true;

        // Update axis title to reflect that it's only for Capture Rate
        benchmarkHourlyChart.options.scales.y1.title.text = `Capture Rate (%)`;
    }

    if (showY2) {
        benchmarkHourlyChart.options.scales.y2.max = y2Max;

        // Adjust step size based on the max value
        const stepSize = Math.max(1, Math.round(y2Max / 5));
        benchmarkHourlyChart.options.scales.y2.ticks.stepSize = stepSize;

        // Add appropriate grid lines
        benchmarkHourlyChart.options.scales.y2.grid.tickLength = 5;
        benchmarkHourlyChart.options.scales.y2.grid.display = true;

        // Update axis title to reflect that it's only for Passersby
        benchmarkHourlyChart.options.scales.y2.title.text = `Passersby`;
    }

    if (showY3) {
        benchmarkHourlyChart.options.scales.y3.max = y3Max;

        // Adjust step size based on the max value
        const stepSize = Math.max(5, Math.round(y3Max / 5));
        benchmarkHourlyChart.options.scales.y3.ticks.stepSize = stepSize;

        // Add appropriate grid lines
        benchmarkHourlyChart.options.scales.y3.grid.tickLength = 5;
        benchmarkHourlyChart.options.scales.y3.grid.display = true;

        // Update axis title to reflect that it's only for Conversion Rate
        benchmarkHourlyChart.options.scales.y3.title.text = `Conversion Rate (%)`;
    }

    // Update chart with new datasets and axis configurations
    benchmarkHourlyChart.data.datasets = datasets;
    benchmarkHourlyChart.update();

    // Update capture rate cards
    updateCaptureRateCards(mainData, comparisonData, averageData !== null);
}

// Initialize event listeners for benchmark hourly chart dataset selectors
function initializeBenchmarkHourlyChartControls() {
    // Get DOM elements
    const dateInput = document.getElementById('benchmarkDate');
    const compareInput = document.getElementById('benchmarkCompareDate');
    const benchmarkToggle = document.getElementById('enableBenchmark');
    const averageBenchmarkToggle = document.getElementById('enableAverageBenchmark');

    if (!dateInput || !compareInput || !benchmarkToggle || !averageBenchmarkToggle) {
        console.error('Benchmark controls not found');
        return;
    }

    // Set default date to the last date with data
    const lastDate = getLastDateWithData();
    const lastDateWithHourlyData = findNearestDateWithData(lastDate);
    dateInput.value = lastDateWithHourlyData.toISOString().split('T')[0];

    // Set compare date to the same weekday from the previous week by default
    const prevWeekDate = new Date(lastDateWithHourlyData);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7); // Go back 7 days to get the same weekday
    compareInput.value = prevWeekDate.toISOString().split('T')[0];

    // Initialize custom period selects
    initializeCustomPeriodSelects();

    // Initial chart update is now handled in initializeBenchmarkHourlyChart

    // Add event listeners for dataset checkboxes
    document.querySelectorAll('#benchmark .dataset-selector input[type="checkbox"]')
        .forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedDate = new Date(dateInput.value);
                let compareDate = null;
                let averageData = null;

                if (benchmarkToggle.checked) {
                    compareDate = new Date(compareInput.value);
                } else if (averageBenchmarkToggle.checked) {
                    averageData = calculateAverageData(selectedDate);
                }

                updateBenchmarkHourlyChart(selectedDate, compareDate, averageData);
            });
        });

    // Add data label toggle listeners
    document.querySelectorAll('#benchmark .toggle-labels').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');

            const selectedDate = new Date(dateInput.value);
            let compareDate = null;
            let averageData = null;

            if (benchmarkToggle.checked) {
                compareDate = new Date(compareInput.value);
            } else if (averageBenchmarkToggle.checked) {
                averageData = calculateAverageData(selectedDate);
            }

            updateBenchmarkHourlyChart(selectedDate, compareDate, averageData);
        });
    });

    // Add event listeners for date inputs and comparison toggles
    dateInput.addEventListener('change', () => {
        const selectedDate = new Date(dateInput.value);
        let compareDate = null;
        let averageData = null;

        if (benchmarkToggle.checked) {
            // Set compare date to the same weekday from the previous week
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7); // Go back 7 days to get the same weekday
            compareInput.value = prevWeekDate.toISOString().split('T')[0];
            compareDate = prevWeekDate;
        } else if (averageBenchmarkToggle.checked) {
            averageData = calculateAverageData(selectedDate);
        }

        updateBenchmarkHourlyChart(selectedDate, compareDate, averageData);
    });

    compareInput.addEventListener('change', () => {
        if (benchmarkToggle.checked) {
            const selectedDate = new Date(dateInput.value);
            const compareDate = new Date(compareInput.value);
            updateBenchmarkHourlyChart(selectedDate, compareDate);
        }
    });

    benchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            averageBenchmarkToggle.checked = false;
            compareInput.disabled = false;
            const selectedDate = new Date(dateInput.value);

            // Set compare date to the same weekday from the previous week
            const prevWeekDate = new Date(selectedDate);
            prevWeekDate.setDate(selectedDate.getDate() - 7); // Go back 7 days to get the same weekday
            compareInput.value = prevWeekDate.toISOString().split('T')[0];

            const compareDate = prevWeekDate;
            updateBenchmarkHourlyChart(selectedDate, compareDate);

            // Also update custom period rates
            const mainData = getHourlyData(selectedDate);
            const compareData = getHourlyData(compareDate);
            updateCustomPeriodRate(mainData, compareData, false);
        } else {
            compareInput.disabled = true;
            const selectedDate = new Date(dateInput.value);
            updateBenchmarkHourlyChart(selectedDate);

            // Also update custom period rates
            const mainData = getHourlyData(selectedDate);
            updateCustomPeriodRate(mainData, null, false);
        }
    });

    averageBenchmarkToggle.addEventListener('change', function() {
        if (this.checked) {
            benchmarkToggle.checked = false;
            compareInput.disabled = true;
            const selectedDate = new Date(dateInput.value);
            const averageData = calculateAverageData(selectedDate);
            updateBenchmarkHourlyChart(selectedDate, null, averageData);

            // Also update custom period rates
            const mainData = getHourlyData(selectedDate);
            updateCustomPeriodRate(mainData, averageData.hourly, true);
        } else {
            const selectedDate = new Date(dateInput.value);
            updateBenchmarkHourlyChart(selectedDate);

            // Also update custom period rates
            const mainData = getHourlyData(selectedDate);
            updateCustomPeriodRate(mainData, null, false);
        }
    });
}

// Functions for capture rate cards
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

    // Add comparison data if available
    if (data.compareRate !== null) {
        const diff = data.rate - data.compareRate;
        const diffClass = diff >= 0 ? 'positive' : 'negative';
        const diffText = diff >= 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;

        const compareElement = document.createElement('div');
        compareElement.className = `capture-compare-rate ${diffClass}`;
        compareElement.innerHTML = `
            <span class="compare-value">${parseFloat(data.compareRate).toFixed(2)}%</span>
            <span class="compare-diff">${diffText}</span>
        `;
        card.appendChild(compareElement);
    }
}

function updateCustomPeriodRate(data, comparisonData = null, isAverage = false) {
    const startSelect = document.getElementById('customPeriodStart');
    const endSelect = document.getElementById('customPeriodEnd');

    if (!startSelect || !endSelect) {
        console.warn('Custom period selects not found');
        return;
    }

    const startHour = parseInt(startSelect.value);
    const endHour = parseInt(endSelect.value);

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
    const customPeriodLabel = document.getElementById('customPeriodLabel');
    if (customPeriodLabel) {
        customPeriodLabel.textContent = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
    }
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
    const compareInput = document.getElementById('benchmarkCompareDate');

    if (!startSelect || !endSelect) {
        console.warn('Custom period selects not found');
        return;
    }

    // Clear existing options
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';

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

    // Initial update of custom period
    const selectedDate = new Date(dateInput.value);
    let comparisonData = null;
    let isAverage = false;

    if (benchmarkToggle.checked) {
        comparisonData = getHourlyData(new Date(compareInput.value));
    } else if (averageBenchmarkToggle.checked) {
        const averageData = calculateAverageData(selectedDate);
        comparisonData = averageData.hourly;
        isAverage = true;
    }

    const mainData = getHourlyData(selectedDate);
    updateCustomPeriodRate(mainData, comparisonData, isAverage);

    // Add event listeners
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
            const compareDate = new Date(compareInput.value);
            comparisonData = getHourlyData(compareDate);
        } else if (averageBenchmarkToggle.checked) {
            const averageData = calculateAverageData(new Date(dateInput.value));
            comparisonData = averageData.hourly;
            isAverage = true;
        }

        updateCustomPeriodRate(mainData, comparisonData, isAverage);
    }
}

// Helper function to calculate average of positive numbers
function averagePositive(numbers) {
    const positiveNumbers = numbers.filter(n => n > 0);
    return positiveNumbers.length > 0
        ? Math.round((positiveNumbers.reduce((a, b) => a + b, 0) / positiveNumbers.length) * 100) / 100
        : 0;
}

// Helper function to calculate capture rate average
function calculateCaptureRate(data) {
    const validData = data.filter(d => d.visitorsIn > 0 && d.passersby > 0);
    if (validData.length === 0) return 0;

    const totalVisitors = validData.reduce((sum, d) => sum + parseInt(d.visitorsIn), 0);
    const totalPassersby = validData.reduce((sum, d) => sum + parseInt(d.passersby), 0);
    return totalPassersby > 0 ? ((totalVisitors / totalPassersby) * 100).toFixed(2) : '0.00';
}

// Helper function to format date
function formatDate(date) {
    return date.toISOString().split('T')[0];
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
        .sort((a, b) => new Date(a.timestamp).getHours() - new Date(b.timestamp).getHours());

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

// Function to calculate average data for a given date
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
        dwellTime: parseFloat(day.dwellTime) || 0,
        dataAccuracy: parseFloat(day.dataAccuracy) || 0
    }));

    // Calculate daily average using the existing day data
    const dailyAverage = {
        date: selectedDate,
        visitorsIn: averagePositive(dailyMetrics.map(d => d.visitorsIn)),
        passersby: averagePositive(dailyMetrics.map(d => d.passersby)),
        captureRate: averagePositive(dailyMetrics.map(d => d.captureRate)),
        menIn: averagePositive(dailyMetrics.map(d => d.menIn)),
        womenIn: averagePositive(dailyMetrics.map(d => d.womenIn)),
        dwellTime: averagePositive(dailyMetrics.map(d => d.dwellTime)),
        dataAccuracy: averagePositive(dailyMetrics.map(d => d.dataAccuracy)),
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
                       (parseInt(h.visitorsIn) > 0 || parseInt(h.passersby) > 0);
            });

        return {
            timestamp: new Date(selectedDate).setHours(hour),
            visitorsIn: averagePositive(hourData.map(h => parseInt(h.visitorsIn) || 0)),
            passersby: averagePositive(hourData.map(h => parseInt(h.passersby) || 0)),
            captureRate: calculateCaptureRate(hourData),
            menIn: averagePositive(hourData.map(h => parseInt(h.menIn) || 0)),
            womenIn: averagePositive(hourData.map(h => parseInt(h.womenIn) || 0)),
            groupIn: averagePositive(hourData.map(h => parseInt(h.groupIn) || 0)),
            conversion: averagePositive(hourData.map(h => parseFloat(h.conversion) || 0))
        };
    });

    return {
        hourly: hourlyAverages,
        daily: dailyAverage,
        sampleSize: allSameDayData.length
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0 &&
            window.dashboardState.hourData &&
            window.dashboardState.hourData.length > 0) {
            clearInterval(dataCheckInterval);
            initializeBenchmarkHourlyChart();
            initializeBenchmarkHourlyChartControls();
        }
    }, 100);
});
