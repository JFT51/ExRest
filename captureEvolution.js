/**
 * Capture Rate Evolution JavaScript
 * Separate script file to avoid conflicts with other scripts
 */

// Initialize state object
const captureEvolutionState = {
    timeOfDayChart: null,
    customTimeChart: null,
    weeklyChart: null,
    firstDate: null,
    lastDate: null,
    customStartTime: '00:00',
    customEndTime: '23:00',
    showTimeOfDayLabels: false,
    showCustomTimeLabels: false,
    showWeeklyLabels: false,
    includeTimeOfDaySundays: true,
    includeCustomTimeSundays: true,
    // Series visibility state
    seriesVisibility: {
        morning: true,
        noon: true,
        afternoon: true,
        daily: true
    },
    // Days visibility state for each chart
    daysVisibility: {
        timeOfDay: [true, true, true, true, true, true, true], // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        customTime: [true, true, true, true, true, true, true],
        weekly: [true, true, true, true, true, true, true]
    },
    // Restaurant opening hours for each day of the week
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    restaurantHours: [
        { day: 0, name: 'Sunday', open: '08:00', close: '16:00' },
        { day: 1, name: 'Monday', open: '07:00', close: '20:00' },
        { day: 2, name: 'Tuesday', open: '07:00', close: '20:00' },
        { day: 3, name: 'Wednesday', open: '07:00', close: '20:00' },
        { day: 4, name: 'Thursday', open: '07:00', close: '20:00' },
        { day: 5, name: 'Friday', open: '07:00', close: '20:00' },
        { day: 6, name: 'Saturday', open: '08:00', close: '20:00' }
    ]
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to be loaded before initializing
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState &&
            window.dashboardState.hourData &&
            window.dashboardState.hourData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready for capture rate evolution charts');

            // Initialize the tab
            initializeCaptureEvolution();
        }
    }, 100);

    // Add tab change listener to initialize charts when tab is activated
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.target.getAttribute('data-tab') === 'capture-evolution') {
                setTimeout(() => {
                    if (captureEvolutionState.timeOfDayChart === null) {
                        initializeTimeOfDayChart();
                    }
                    if (captureEvolutionState.customTimeChart === null) {
                        initializeCustomTimeChart();
                    }
                    if (captureEvolutionState.weeklyChart === null) {
                        initializeWeeklyChart();
                    }
                }, 100);
            }
        });
    });
});

// Initialize the Capture Rate Evolution tab
function initializeCaptureEvolution() {
    // Find first and last dates with data
    findDateRange();

    // Initialize time selectors for custom time chart
    initializeTimeSelectors();

    // Add event listener for the update button
    document.getElementById('updateCustomTimeChart').addEventListener('click', () => {
        updateCustomTimeChart();
    });

    // Add event listeners for toggle buttons
    initializeToggleButtons();

    // Initialize charts if the tab is active
    if (document.getElementById('capture-evolution').classList.contains('active')) {
        initializeTimeOfDayChart();
        initializeCustomTimeChart();
        initializeWeeklyChart();
    }
}

// Initialize toggle buttons
function initializeToggleButtons() {
    // Time of Day Chart toggle buttons
    const timeOfDayLabelsToggle = document.getElementById('timeOfDayLabelsToggle');

    timeOfDayLabelsToggle.addEventListener('click', () => {
        timeOfDayLabelsToggle.classList.toggle('active');
        captureEvolutionState.showTimeOfDayLabels = timeOfDayLabelsToggle.classList.contains('active');
        updateTimeOfDayChart();
    });

    // Day toggle buttons for Time of Day Chart
    const dayButtons = [
        document.getElementById('toggleSunday'),
        document.getElementById('toggleMonday'),
        document.getElementById('toggleTuesday'),
        document.getElementById('toggleWednesday'),
        document.getElementById('toggleThursday'),
        document.getElementById('toggleFriday'),
        document.getElementById('toggleSaturday')
    ];

    // Add event listeners to day toggle buttons
    dayButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', () => {
                // Toggle active class
                button.classList.toggle('active');

                // Update visibility state
                captureEvolutionState.daysVisibility.timeOfDay[index] = button.classList.contains('active');

                // Update chart
                updateTimeOfDayChart();
            });
        }
    });

    // Series toggle buttons for Time of Day Chart
    const seriesButtons = {
        morning: document.getElementById('toggleMorning'),
        noon: document.getElementById('toggleNoon'),
        afternoon: document.getElementById('toggleAfternoon'),
        daily: document.getElementById('toggleDaily')
    };

    // Initialize series visibility state
    if (!captureEvolutionState.seriesVisibility) {
        captureEvolutionState.seriesVisibility = {
            morning: true,
            noon: true,
            afternoon: true,
            daily: true
        };
    }

    // Add event listeners to series toggle buttons
    Object.keys(seriesButtons).forEach(series => {
        if (seriesButtons[series]) {
            seriesButtons[series].addEventListener('click', () => {
                // Toggle active class
                seriesButtons[series].classList.toggle('active');

                // Update visibility state
                captureEvolutionState.seriesVisibility[series] = seriesButtons[series].classList.contains('active');

                // Update chart
                updateTimeOfDayChartVisibility();
            });
        }
    });

    // Custom Time Chart toggle buttons
    const customTimeLabelsToggle = document.getElementById('customTimeLabelsToggle');

    customTimeLabelsToggle.addEventListener('click', () => {
        customTimeLabelsToggle.classList.toggle('active');
        captureEvolutionState.showCustomTimeLabels = customTimeLabelsToggle.classList.contains('active');
        updateCustomTimeChart();
    });

    // Day toggle buttons for Custom Time Chart
    const customDayButtons = [
        document.getElementById('customToggleSunday'),
        document.getElementById('customToggleMonday'),
        document.getElementById('customToggleTuesday'),
        document.getElementById('customToggleWednesday'),
        document.getElementById('customToggleThursday'),
        document.getElementById('customToggleFriday'),
        document.getElementById('customToggleSaturday')
    ];

    // Add event listeners to custom day toggle buttons
    customDayButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', () => {
                // Toggle active class
                button.classList.toggle('active');

                // Update visibility state
                captureEvolutionState.daysVisibility.customTime[index] = button.classList.contains('active');

                // Update chart
                updateCustomTimeChart();
            });
        }
    });

    // Weekly Chart toggle button
    const weeklyLabelsToggle = document.getElementById('weeklyLabelsToggle');

    weeklyLabelsToggle.addEventListener('click', () => {
        weeklyLabelsToggle.classList.toggle('active');
        captureEvolutionState.showWeeklyLabels = weeklyLabelsToggle.classList.contains('active');
        updateWeeklyChart();
    });

    // Day toggle buttons for Weekly Chart
    const weeklyDayButtons = [
        document.getElementById('weeklyToggleSunday'),
        document.getElementById('weeklyToggleMonday'),
        document.getElementById('weeklyToggleTuesday'),
        document.getElementById('weeklyToggleWednesday'),
        document.getElementById('weeklyToggleThursday'),
        document.getElementById('weeklyToggleFriday'),
        document.getElementById('weeklyToggleSaturday')
    ];

    // Add event listeners to weekly day toggle buttons
    weeklyDayButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', () => {
                // Toggle active class
                button.classList.toggle('active');

                // Update visibility state
                captureEvolutionState.daysVisibility.weekly[index] = button.classList.contains('active');

                // Update chart
                updateWeeklyChart();
            });
        }
    });
}

// Find the first and last dates with data
function findDateRange() {
    if (!window.dashboardState || !window.dashboardState.hourData || window.dashboardState.hourData.length === 0) {
        return;
    }

    // Sort hour data by timestamp
    const sortedData = [...window.dashboardState.hourData].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Get first and last dates
    captureEvolutionState.firstDate = new Date(sortedData[0].timestamp);
    captureEvolutionState.lastDate = new Date(sortedData[sortedData.length - 1].timestamp);

    console.log(`Date range: ${captureEvolutionState.firstDate.toDateString()} to ${captureEvolutionState.lastDate.toDateString()}`);
}

// Initialize time selectors for custom time chart
function initializeTimeSelectors() {
    const startTimeSelect = document.getElementById('customStartTime');
    const endTimeSelect = document.getElementById('customEndTime');

    // Clear existing options
    startTimeSelect.innerHTML = '';
    endTimeSelect.innerHTML = '';

    // Add hour options (00:00 to 23:00)
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = `${hour}:00`;
        option.textContent = `${hour}:00`;

        startTimeSelect.appendChild(option.cloneNode(true));
        endTimeSelect.appendChild(option);
    }

    // Set default values
    startTimeSelect.value = captureEvolutionState.customStartTime;
    endTimeSelect.value = captureEvolutionState.customEndTime;

    // Add event listeners
    startTimeSelect.addEventListener('change', (e) => {
        captureEvolutionState.customStartTime = e.target.value;
    });

    endTimeSelect.addEventListener('change', (e) => {
        captureEvolutionState.customEndTime = e.target.value;
    });
}

// Initialize the Time of Day Chart
function initializeTimeOfDayChart() {
    const ctx = document.getElementById('captureTimeOfDayChart').getContext('2d');

    // Prepare data
    const data = prepareTimeOfDayData();

    // Create chart
    captureEvolutionState.timeOfDayChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Morning (07:00-10:00)',
                    data: data.morning,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true // Connect points across gaps (when Sundays are excluded)
                },
                {
                    label: 'Noon (12:00-14:00)',
                    data: data.noon,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true // Connect points across gaps (when Sundays are excluded)
                },
                {
                    label: 'Afternoon (17:00-20:00)',
                    data: data.afternoon,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true // Connect points across gaps (when Sundays are excluded)
                },
                {
                    label: 'Daily Average (Restaurant Hours)',
                    data: data.daily,
                    borderColor: 'rgba(45, 107, 34, 1)',
                    backgroundColor: 'rgba(45, 107, 34, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true // Connect points across gaps (when Sundays are excluded)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false // Hide the legend since we're using option buttons
                },
                datalabels: {
                    display: function(context) {
                        return captureEvolutionState.showTimeOfDayLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value.toFixed(2) + '%',
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: 4,
                    color: context => context.dataset.borderColor
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM yyyy'
                        }
                    },
                    // Ensure proper handling of gaps when days are excluded
                    distribution: 'series',
                    // Only show ticks for dates that have data
                    ticks: {
                        source: 'data',
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0
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
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                }
            }
        }
    });

    // Add download buttons
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('captureTimeOfDayChart');
    }
}

// Prepare data for Time of Day Chart
function prepareTimeOfDayData() {
    if (!window.dashboardState || !window.dashboardState.hourData || window.dashboardState.hourData.length === 0) {
        return { labels: [], morning: [], noon: [], afternoon: [], daily: [] };
    }

    // Group data by day
    const dayData = {};

    window.dashboardState.hourData.forEach(hour => {
        const date = new Date(hour.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        const hourNum = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Skip days that are not selected
        if (!captureEvolutionState.daysVisibility.timeOfDay[dayOfWeek]) {
            return;
        }

        // Skip hours outside restaurant opening hours
        if (!isWithinOpeningHours(date, hourNum)) {
            return;
        }

        // Initialize day data if not exists and store the day of week for later filtering
        if (!dayData[dateKey]) {
            dayData[dateKey] = {
                date: new Date(dateKey),
                dayOfWeek: dayOfWeek, // Store day of week for filtering
                morning: { visitors: 0, passersby: 0 },
                noon: { visitors: 0, passersby: 0 },
                afternoon: { visitors: 0, passersby: 0 },
                daily: { visitors: 0, passersby: 0 }
            };
        }

        // Add data to appropriate time period
        const visitors = parseInt(hour.visitorsIn || 0);
        const passersby = parseInt(hour.passersby || 0);

        // Add to daily totals (only counting restaurant opening hours)
        dayData[dateKey].daily.visitors += visitors;
        dayData[dateKey].daily.passersby += passersby;

        // Add to specific time period using new time ranges
        // Only count hours that are within the restaurant's opening hours
        if (hourNum >= 7 && hourNum <= 10) {
            // Morning (07:00-10:00)
            dayData[dateKey].morning.visitors += visitors;
            dayData[dateKey].morning.passersby += passersby;
        } else if (hourNum >= 12 && hourNum <= 14) {
            // Noon (12:00-14:00)
            dayData[dateKey].noon.visitors += visitors;
            dayData[dateKey].noon.passersby += passersby;
        } else if (hourNum >= 17 && hourNum <= 20) {
            // Afternoon (17:00-20:00)
            dayData[dateKey].afternoon.visitors += visitors;
            dayData[dateKey].afternoon.passersby += passersby;
        }
    });

    // Calculate capture rates and prepare chart data
    const labels = [];
    const morning = [];
    const noon = [];
    const afternoon = [];
    const daily = [];

    // Sort days by date
    const sortedDays = Object.values(dayData).sort((a, b) => a.date - b.date);

    // Filter days based on selected days of the week
    const filteredDays = sortedDays.filter(day => {
        // Get the day of week (0-6)
        const dayOfWeek = day.dayOfWeek;
        // Check if this day of week is selected
        return captureEvolutionState.daysVisibility.timeOfDay[dayOfWeek];
    });

    console.log(`Time of Day Chart: ${sortedDays.length} total days, ${filteredDays.length} after filtering by selected days`);

    // Process each day and prepare data for the chart
    filteredDays.forEach(day => {
        // Calculate capture rates
        const morningRate = day.morning.passersby > 0 ? (day.morning.visitors / day.morning.passersby) * 100 : 0;
        const noonRate = day.noon.passersby > 0 ? (day.noon.visitors / day.noon.passersby) * 100 : 0;
        const afternoonRate = day.afternoon.passersby > 0 ? (day.afternoon.visitors / day.afternoon.passersby) * 100 : 0;
        const dailyRate = day.daily.passersby > 0 ? (day.daily.visitors / day.daily.passersby) * 100 : 0;

        // Add the date to labels array
        labels.push(day.date);

        // For each time period, use null for zero rates to create gaps in the chart
        // This will make the chart skip days with zero capture rates
        morning.push(morningRate > 0 ? morningRate : null);
        noon.push(noonRate > 0 ? noonRate : null);
        afternoon.push(afternoonRate > 0 ? afternoonRate : null);
        daily.push(dailyRate > 0 ? dailyRate : null);
    });

    console.log('Time of Day Chart data points after zero filtering:', {
        morning: morning.filter(val => val !== null).length,
        noon: noon.filter(val => val !== null).length,
        afternoon: afternoon.filter(val => val !== null).length,
        daily: daily.filter(val => val !== null).length
    });

    return { labels, morning, noon, afternoon, daily };
}

// Initialize the Custom Time Chart
function initializeCustomTimeChart() {
    const ctx = document.getElementById('captureCustomTimeChart').getContext('2d');

    // Prepare data
    const data = prepareCustomTimeData();

    // Create chart
    captureEvolutionState.customTimeChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: `Capture Rate (${captureEvolutionState.customStartTime}-${captureEvolutionState.customEndTime})`,
                    data: data.captureRates,
                    borderColor: 'rgba(45, 107, 34, 1)',
                    backgroundColor: 'rgba(45, 107, 34, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true // Connect points across gaps (when Sundays are excluded)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        return captureEvolutionState.showCustomTimeLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value.toFixed(2) + '%',
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: 4,
                    color: 'rgba(45, 107, 34, 1)'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM yyyy'
                        }
                    },
                    // Ensure proper handling of gaps when days are excluded
                    distribution: 'series',
                    // Only show ticks for dates that have data
                    ticks: {
                        source: 'data',
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0
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
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                }
            }
        }
    });

    // Add download buttons
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('captureCustomTimeChart');
    }
}

// Update the Time of Day Chart
function updateTimeOfDayChart() {
    // Destroy the existing chart if it exists
    if (captureEvolutionState.timeOfDayChart) {
        captureEvolutionState.timeOfDayChart.destroy();
    }

    // Recreate the chart from scratch
    recreateTimeOfDayChart();
}

// Recreate the Time of Day Chart from scratch
function recreateTimeOfDayChart() {
    const ctx = document.getElementById('captureTimeOfDayChart').getContext('2d');

    // Prepare data
    const data = prepareTimeOfDayData();

    console.log('Time of Day Chart data:', {
        labels: data.labels.map(d => d.toISOString().split('T')[0]),
        morningPoints: data.morning.filter(v => v !== null).length,
        noonPoints: data.noon.filter(v => v !== null).length,
        afternoonPoints: data.afternoon.filter(v => v !== null).length,
        dailyPoints: data.daily.filter(v => v !== null).length
    });

    // Create a new chart with the updated data
    captureEvolutionState.timeOfDayChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Morning (07:00-10:00)',
                    data: data.morning,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true,
                    hidden: !captureEvolutionState.seriesVisibility.morning
                },
                {
                    label: 'Noon (12:00-14:00)',
                    data: data.noon,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true,
                    hidden: !captureEvolutionState.seriesVisibility.noon
                },
                {
                    label: 'Afternoon (17:00-20:00)',
                    data: data.afternoon,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true,
                    hidden: !captureEvolutionState.seriesVisibility.afternoon
                },
                {
                    label: 'Daily Average (Restaurant Hours)',
                    data: data.daily,
                    borderColor: 'rgba(45, 107, 34, 1)',
                    backgroundColor: 'rgba(45, 107, 34, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true,
                    hidden: !captureEvolutionState.seriesVisibility.daily
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false // Hide the legend since we're using option buttons
                },
                datalabels: {
                    display: function(context) {
                        return captureEvolutionState.showTimeOfDayLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value.toFixed(2) + '%',
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: 4,
                    color: context => context.dataset.borderColor
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM yyyy'
                        }
                    },
                    distribution: 'series',
                    ticks: {
                        source: 'data', // This is key - only show ticks for data points
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                }
            }
        }
    });

    // Add download buttons if the function exists
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('captureTimeOfDayChart');
    }
}

// Update the visibility of datasets in the Time of Day Chart
function updateTimeOfDayChartVisibility() {
    if (!captureEvolutionState.timeOfDayChart) return;

    // Map series to dataset indices
    const seriesIndices = {
        morning: 0,
        noon: 1,
        afternoon: 2,
        daily: 3
    };

    // Update visibility for each series
    Object.keys(captureEvolutionState.seriesVisibility).forEach(series => {
        const datasetIndex = seriesIndices[series];
        if (datasetIndex !== undefined) {
            const dataset = captureEvolutionState.timeOfDayChart.data.datasets[datasetIndex];
            if (dataset) {
                dataset.hidden = !captureEvolutionState.seriesVisibility[series];
            }
        }
    });

    // Update the chart
    captureEvolutionState.timeOfDayChart.update();
}

// Update the Custom Time Chart
function updateCustomTimeChart() {
    // Get selected time range
    const startTime = document.getElementById('customStartTime').value;
    const endTime = document.getElementById('customEndTime').value;

    // Update state
    captureEvolutionState.customStartTime = startTime;
    captureEvolutionState.customEndTime = endTime;

    // Destroy the existing chart if it exists
    if (captureEvolutionState.customTimeChart) {
        captureEvolutionState.customTimeChart.destroy();
    }

    // Recreate the chart from scratch
    recreateCustomTimeChart(startTime, endTime);
}

// Recreate the Custom Time Chart from scratch
function recreateCustomTimeChart(startTime, endTime) {
    const ctx = document.getElementById('captureCustomTimeChart').getContext('2d');

    // Prepare data
    const data = prepareCustomTimeData();

    console.log('Custom Time Chart data:', {
        labels: data.labels.map(d => d.toISOString().split('T')[0]),
        dataPoints: data.captureRates.filter(v => v !== null).length
    });

    // Create a new chart with the updated data
    captureEvolutionState.customTimeChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: `Capture Rate (${startTime}-${endTime})`,
                    data: data.captureRates,
                    borderColor: 'rgba(45, 107, 34, 1)',
                    backgroundColor: 'rgba(45, 107, 34, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: function(context) {
                        return captureEvolutionState.showCustomTimeLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value.toFixed(2) + '%',
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    padding: 4,
                    color: 'rgba(45, 107, 34, 1)'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'EEE dd MMM yyyy'
                        }
                    },
                    distribution: 'series',
                    ticks: {
                        source: 'data', // This is key - only show ticks for data points
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        },
                        // Prevent overlapping by limiting the number of ticks based on screen size
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 12,
                        // Custom callback to format dates and prevent overlapping
                        callback: function(value, index, values) {
                            // Count how many unique days of the week are selected
                            const selectedDaysCount = Object.values(captureEvolutionState.daysVisibility.customTime).filter(Boolean).length;

                            // If only one day of the week is selected, use a shorter date format
                            if (selectedDaysCount === 1) {
                                return new Date(value).toLocaleDateString('en-US', {
                                    day: '2-digit',
                                    month: 'short'
                                });
                            }

                            // Otherwise use the full format
                            return new Date(value).toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                }
            }
        }
    });

    // Add download buttons if the function exists
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('captureCustomTimeChart');
    }
}

// Update the Weekly Chart
function updateWeeklyChart() {
    if (!captureEvolutionState.weeklyChart) return;

    // Prepare new data
    const data = prepareWeeklyData();

    // Update chart data
    captureEvolutionState.weeklyChart.data.labels = data.labels;
    captureEvolutionState.weeklyChart.data.datasets[0].data = data.captureRates;

    // Update data labels display
    captureEvolutionState.weeklyChart.options.plugins.datalabels.display = function(context) {
        return captureEvolutionState.showWeeklyLabels && context.dataset.data[context.dataIndex] > 0;
    };

    // Update chart
    captureEvolutionState.weeklyChart.update();
}

// Prepare data for Custom Time Chart
function prepareCustomTimeData() {
    if (!window.dashboardState || !window.dashboardState.hourData || window.dashboardState.hourData.length === 0) {
        return { labels: [], captureRates: [] };
    }

    // Parse time range
    const startHour = parseInt(captureEvolutionState.customStartTime.split(':')[0]);
    const endHour = parseInt(captureEvolutionState.customEndTime.split(':')[0]);

    // Group data by day
    const dayData = {};

    window.dashboardState.hourData.forEach(hour => {
        const date = new Date(hour.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        const hourNum = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Skip days that are not selected
        if (!captureEvolutionState.daysVisibility.customTime[dayOfWeek]) {
            return;
        }

        // For the custom time chart, we use the selected time range directly
        // without applying restaurant opening hours restrictions

        // Check if hour is within selected range
        if (hourNum >= startHour && hourNum <= endHour) {
            // Initialize day data if not exists
            if (!dayData[dateKey]) {
                // Create a new date object from the dateKey
                // Use the original date object to ensure the correct day of week
                const dateObj = new Date(date);
                // Reset the time part to midnight to ensure consistent display
                dateObj.setHours(0, 0, 0, 0);

                dayData[dateKey] = {
                    date: dateObj,
                    dayOfWeek: dayOfWeek, // Store day of week for filtering
                    visitors: 0,
                    passersby: 0
                };
            }

            // Add data
            dayData[dateKey].visitors += parseInt(hour.visitorsIn || 0);
            dayData[dateKey].passersby += parseInt(hour.passersby || 0);
        }
    });

    // Calculate capture rates and prepare chart data
    const labels = [];
    const captureRates = [];

    // Sort days by date
    const sortedDays = Object.values(dayData).sort((a, b) => a.date - b.date);

    // Filter days based on selected days of the week
    const filteredDays = sortedDays.filter(day => {
        // Get the day of week (0-6)
        const dayOfWeek = day.dayOfWeek;
        // Check if this day of week is selected
        return captureEvolutionState.daysVisibility.customTime[dayOfWeek];
    });

    console.log(`Custom Time Chart: ${sortedDays.length} total days, ${filteredDays.length} after filtering by selected days`);

    // Process each day and prepare data for the chart
    filteredDays.forEach(day => {
        // Calculate capture rate
        const captureRate = day.passersby > 0 ? (day.visitors / day.passersby) * 100 : 0;

        // Add the date to labels array
        labels.push(day.date);

        // Use null for zero rates to create gaps in the chart
        // This will make the chart skip days with zero capture rates
        captureRates.push(captureRate > 0 ? captureRate : null);
    });

    console.log('Custom Time Chart data points after zero filtering:',
        captureRates.filter(val => val !== null).length, 'out of', captureRates.length);

    return { labels, captureRates };
}

// Initialize the Weekly Chart
function initializeWeeklyChart() {
    const ctx = document.getElementById('captureWeeklyChart').getContext('2d');

    // Prepare data
    const data = prepareWeeklyData();

    // Create chart
    captureEvolutionState.weeklyChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Weekly Average Capture Rate',
                    data: data.captureRates,
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) {
                            return null;
                        }
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(45, 107, 34, 0.3)');
                        gradient.addColorStop(1, 'rgba(45, 107, 34, 0.7)');
                        return gradient;
                    },
                    borderColor: 'rgba(45, 107, 34, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: function(context) {
                        return captureEvolutionState.showWeeklyLabels && context.dataset.data[context.dataIndex] > 0;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value.toFixed(2) + '%',
                    font: {
                        weight: 'bold',
                        size: window.innerWidth < 768 ? 9 : 11
                    },
                    color: 'rgba(45, 107, 34, 1)'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        // Only show ticks for weeks that have data
                        source: 'data',
                        autoSkip: true,
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Capture Rate (%)',
                        font: {
                            size: window.innerWidth < 768 ? 8 : 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        },
                        font: {
                            size: window.innerWidth < 768 ? 8 : 12
                        }
                    }
                }
            }
        }
    });

    // Add download buttons
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('captureWeeklyChart');
    }
}

// Prepare data for Weekly Chart
function prepareWeeklyData() {
    if (!window.dashboardState || !window.dashboardState.dayData || window.dashboardState.dayData.length === 0) {
        return { labels: [], captureRates: [] };
    }

    // Group data by week
    const weekData = {};

    window.dashboardState.dayData.forEach(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Skip days that are not selected
        if (!captureEvolutionState.daysVisibility.weekly[dayOfWeek]) {
            return;
        }

        // Get week number and year
        const weekYear = getWeekYear(date);
        const weekKey = `${weekYear.year}-W${weekYear.week}`;

        if (!weekData[weekKey]) {
            weekData[weekKey] = {
                week: weekYear.week,
                year: weekYear.year,
                label: `Week ${weekYear.week}, ${weekYear.year}`,
                visitors: 0,
                passersby: 0,
                days: 0
            };
        }

        // Add data
        weekData[weekKey].visitors += parseInt(day.visitorsIn || 0);
        weekData[weekKey].passersby += parseInt(day.passersby || 0);
        weekData[weekKey].days++;
    });

    // Calculate capture rates and prepare chart data
    const labels = [];
    const captureRates = [];

    // Sort weeks by year and week number
    const sortedWeeks = Object.values(weekData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
    });

    sortedWeeks.forEach(week => {
        labels.push(week.label);

        // Calculate capture rate
        const captureRate = week.passersby > 0 ? (week.visitors / week.passersby) * 100 : 0;
        captureRates.push(captureRate);
    });

    return { labels, captureRates };
}

// Helper function to get week number and year
function getWeekYear(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
    return { week, year: d.getFullYear() };
}

// Add window resize handler
window.addEventListener('resize', () => {
    // Debounce the resize event
    if (window.captureEvolutionResizeTimeout) {
        clearTimeout(window.captureEvolutionResizeTimeout);
    }

    window.captureEvolutionResizeTimeout = setTimeout(() => {
        // Update font sizes for all charts
        const isPortrait = window.innerWidth < 768;
        const fontSize = isPortrait ? 8 : 12;
        const titleFontSize = isPortrait ? 8 : 16;

        // Update Time of Day Chart
        if (captureEvolutionState.timeOfDayChart) {
            updateChartFontSizes(captureEvolutionState.timeOfDayChart, fontSize, titleFontSize);
        }

        // Update Custom Time Chart
        if (captureEvolutionState.customTimeChart) {
            updateChartFontSizes(captureEvolutionState.customTimeChart, fontSize, titleFontSize);
        }

        // Update Weekly Chart
        if (captureEvolutionState.weeklyChart) {
            updateChartFontSizes(captureEvolutionState.weeklyChart, fontSize, titleFontSize);
        }
    }, 250);
});

// Helper function to update chart font sizes
function updateChartFontSizes(chart, fontSize, titleFontSize) {
    // Update X axis
    if (chart.options.scales.x) {
        if (chart.options.scales.x.title) {
            chart.options.scales.x.title.font.size = titleFontSize;
        }
        if (chart.options.scales.x.ticks) {
            chart.options.scales.x.ticks.font.size = fontSize;
        }
    }

    // Update Y axis
    if (chart.options.scales.y) {
        if (chart.options.scales.y.title) {
            chart.options.scales.y.title.font.size = titleFontSize;
        }
        if (chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.font.size = fontSize;
        }
    }

    // Update legend
    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.font.size = fontSize;
    }

    // Update data labels
    if (chart.options.plugins && chart.options.plugins.datalabels) {
        chart.options.plugins.datalabels.font.size = fontSize;
    }

    // Update the chart
    chart.update();
}

// Helper function to get day name
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

// Helper function to check if an hour is within restaurant opening hours
function isWithinOpeningHours(date, hourNum) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = captureEvolutionState.restaurantHours.find(h => h.day === dayOfWeek);

    if (!hours) {
        console.warn(`No opening hours defined for day ${dayOfWeek}`);
        return false;
    }

    // Parse opening and closing hours
    const openHour = parseInt(hours.open.split(':')[0]);
    const closeHour = parseInt(hours.close.split(':')[0]);

    // Check if the hour is within opening hours
    return hourNum >= openHour && hourNum <= closeHour;
}
