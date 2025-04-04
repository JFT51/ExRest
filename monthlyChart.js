// Register the plugin if not already registered
if (!Chart.registry.plugins.get('datalabels')) {
    Chart.register(ChartDataLabels);
}

let monthChart = null;

// Object to track which datasets should show labels
let showDataLabels = {
    customers: false,
    passersby: false,
    captureRate: false
};

function createMonthlyChart() {
    const selectedMonth = window.dashboardState.selectedDate.getMonth();
    const selectedYear = window.dashboardState.selectedDate.getFullYear();

    // Get all days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const allDays = Array.from({length: daysInMonth}, (_, i) => {
        return new Date(selectedYear, selectedMonth, i + 1);
    });

    // Filter and map data for current month
    const monthlyData = window.dashboardState.dayData.filter(day => {
        const date = new Date(day.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    // Create data map for easy lookup
    const dataMap = new Map(
        monthlyData.map(day => [new Date(day.date).getDate(), {
            visitors: day.visitorsIn,
            passersby: day.passersby,
            captureRate: parseFloat(day.captureRate)
        }])
    );

    // Prepare data for all days
    const chartData = allDays.map(date => ({
        date: date,
        ...dataMap.get(date.getDate()) || { visitors: 0, passersby: 0, captureRate: 0 }
    }));

    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if (monthChart) {
        monthChart.destroy();
    }

    // Create gradients for the charts
    const createGradient = (colorStart, colorEnd) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    // Create an empty chart first
    monthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.date),
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
                title: {
                    display: true,
                    text: `Daily Statistics - ${window.dashboardState.selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                    font: {
                        family: 'League Spartan',
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: false // Default to false, will be overridden per dataset
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = chartData[tooltipItems[0].dataIndex].date;
                            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                        }
                    }
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
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Customers',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Passersby',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    }
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        },
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 10
                    }
                }
            }
        }
    });

    // Update the chart to ensure chart area is defined
    monthChart.update();
    // Add download buttons using the unified implementation
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('monthlyChart');
    }

    // Create specific gradients for each dataset
    const visitorsGradient = createGradient('rgba(45, 107, 34, 0.9)', 'rgba(45, 107, 34, 0.2)'); // Updated to #2d6b22
    const passersbyGradient = createGradient('rgba(139, 69, 19, 0.4)', 'rgba(139, 69, 19, 0.05)');
    const captureRateGradient = createGradient('rgba(243, 151, 0, 0.4)', 'rgba(243, 151, 0, 0.05)');

    // Create datasets array
    const datasets = [];

    // Add datasets based on checkbox state
    if (document.getElementById('showCustomers').checked) {
        datasets.push({
            label: 'Daily Customers',
            data: chartData.map(d => d.visitors),
            backgroundColor: visitorsGradient,
            borderColor: 'rgba(45, 107, 34, 1)', // Updated to #2d6b22
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showDataLabels.customers && value > 0;
                },
                align: 'top',
                anchor: 'end',
                formatter: (value) => Math.round(value).toLocaleString(),
                font: {
                    weight: 'bold',
                    size: 11
                },
                padding: 6,
                color: 'rgba(45, 107, 34, 1)' // Updated to #2d6b22
            }
        });
    }

    if (document.getElementById('showPassersby').checked) {
        datasets.push({
            label: 'Passersby',
            data: chartData.map(d => d.passersby),
            type: 'line',
            borderColor: 'rgba(139, 69, 19, 1)',
            backgroundColor: passersbyGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showDataLabels.passersby && value > 0;
                },
                align: 'top',
                anchor: 'end',
                formatter: (value) => Math.round(value).toLocaleString(),
                font: {
                    weight: 'bold',
                    size: 11
                },
                padding: 6,
                color: 'rgba(139, 69, 19, 1)'
            }
        });
    }

    if (document.getElementById('showCaptureRate').checked) {
        datasets.push({
            label: 'Capture Rate',
            data: chartData.map(d => d.captureRate),
            type: 'line',
            borderColor: 'rgba(243, 151, 0, 1)',
            backgroundColor: captureRateGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y2',
            datalabels: {
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    return showDataLabels.captureRate && value > 0;
                },
                align: 'top',
                anchor: 'end',
                formatter: (value) => value.toFixed(2) + '%',
                font: {
                    weight: 'bold',
                    size: 11
                },
                padding: 6,
                color: 'rgba(243, 151, 0, 1)'
            }
        });
    }

    // Update the chart with the datasets
    monthChart.data.datasets = datasets;
    monthChart.update();
}

function updateMonthlyChart() {
    createMonthlyChart();
}

// Initialize event listeners for monthly chart dataset selectors
function initializeMonthlyChartControls() {
    // Add event listeners for dataset checkboxes
    document.getElementById('showCustomers').addEventListener('change', createMonthlyChart);
    document.getElementById('showPassersby').addEventListener('change', createMonthlyChart);
    document.getElementById('showCaptureRate').addEventListener('change', createMonthlyChart);

    // Add window resize handler to update font sizes
    window.addEventListener('resize', handleMonthlyChartResize);
}

// Handle window resize for monthly chart
function handleMonthlyChartResize() {
    // Debounce the resize event
    if (window.monthlyChartResizeTimeout) {
        clearTimeout(window.monthlyChartResizeTimeout);
    }

    window.monthlyChartResizeTimeout = setTimeout(() => {
        if (monthChart) {
            // Update font sizes based on window width
            const isPortrait = window.innerWidth < 768;

            // Update X axis
            monthChart.options.scales.x.title.font.size = isPortrait ? 8 : 16;
            monthChart.options.scales.x.ticks.font.size = isPortrait ? 8 : 12;
            monthChart.options.scales.x.ticks.maxTicksLimit = isPortrait ? 6 : 12;

            // Update Y axes
            ['y', 'y1', 'y2'].forEach(axisId => {
                if (monthChart.options.scales[axisId]) {
                    monthChart.options.scales[axisId].title.font.size = isPortrait ? 8 : 16;
                    monthChart.options.scales[axisId].ticks.font.size = isPortrait ? 8 : 12;
                    monthChart.options.scales[axisId].ticks.maxTicksLimit = isPortrait ? 6 : 10;
                }
            });

            // Update the chart
            monthChart.update();
        }
    }, 250);
}

// Add event listeners for toggle-labels buttons
function initializeToggleLabelsButtons() {
    document.querySelectorAll('#monthly .toggle-labels').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');

            // Get the dataset type from the data-dataset attribute
            const datasetType = button.getAttribute('data-dataset');

            // Toggle the showDataLabels flag for this dataset
            if (datasetType === 'customers') {
                showDataLabels.customers = !showDataLabels.customers;
            } else if (datasetType === 'passersby') {
                showDataLabels.passersby = !showDataLabels.passersby;
            } else if (datasetType === 'capture-rate') {
                showDataLabels.captureRate = !showDataLabels.captureRate;
            }

            // Update the chart
            createMonthlyChart();
        });
    });
}

// Call both initialization functions
initializeToggleLabelsButtons();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.dayData &&
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            createMonthlyChart();
            initializeMonthlyChartControls();
        }
    }, 100);
});
