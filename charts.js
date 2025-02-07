// Register the plugin at the top of the file
Chart.register(ChartDataLabels);

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
        monthlyData.map(day => [day.date.getDate(), {
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
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(100, 120, 30, 0.9)');
    gradient.addColorStop(1, 'rgba(100, 120, 30, 0.2)');

    if (window.monthChart) {
        window.monthChart.destroy();
    }

    window.monthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.date),
            datasets: [
                {
                    label: 'Daily Customers',
                    data: chartData.map(d => d.visitors),
                    backgroundColor: gradient,
                    borderColor: 'rgba(100, 120, 30, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Passersby',
                    data: chartData.map(d => d.passersby),
                    type: 'line',
                    borderColor: 'rgba(139, 69, 19, 1)',
                    backgroundColor: 'rgba(139, 69, 19, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'Capture Rate',
                    data: chartData.map(d => d.captureRate),
                    type: 'line',
                    borderColor: 'rgba(243, 151, 0, 1)',
                    backgroundColor: 'rgba(243, 151, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y2'
                }
            ]
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
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Customers'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Passersby'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Capture Rate (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM'
                        }
                    }
                }
            }
        }
    });
    addDownloadButtons('monthlyChart');
}

function addDownloadButtons(chartId) {
    const chartContainer = document.getElementById(chartId).parentNode;

    const downloadButtons = document.createElement('div');
    downloadButtons.style.position = 'absolute';
    downloadButtons.style.top = '10px';
    downloadButtons.style.right = '10px';

    const downloadImageButton = document.createElement('button');
    downloadImageButton.innerText = 'Image';
    downloadImageButton.addEventListener('click', () => downloadChartAsImage(chartId));
    downloadButtons.appendChild(downloadImageButton);

    const downloadPdfButton = document.createElement('button');
    downloadPdfButton.innerText = 'PDF';
    downloadPdfButton.addEventListener('click', () => downloadChartAsPdf(chartId));
    downloadButtons.appendChild(downloadPdfButton);

    const downloadExcelButton = document.createElement('button');
    downloadExcelButton.innerText = 'Excel';
    downloadExcelButton.addEventListener('click', () => downloadChartDataAsExcel(chartId));
    downloadButtons.appendChild(downloadExcelButton);

    chartContainer.appendChild(downloadButtons);
}

function downloadChartAsImage(chartId) {
    const chart = Chart.getChart(chartId);
    const image = chart.toBase64Image();
    download(image, 'png');
}

function downloadChartAsPdf(chartId) {
    // Implement PDF download logic here
    alert('PDF download not implemented yet');
}

function downloadChartDataAsExcel(chartId) {
    // Implement Excel download logic here
    alert('Excel download not implemented yet');
}

function download(data, type) {
    const filename = 'chart.' + type;
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.click();
}

// Keep benchmark chart functionality
function createBenchmarkHourlyChart() {
    const ctx = document.getElementById('benchmarkHourlyChart').getContext('2d');
    benchmarkHourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [] // Will be populated dynamically
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Percentage'
                    },
                    // Remove the max property to make it dynamic
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    addDownloadButtons('benchmarkHourlyChart');
}
