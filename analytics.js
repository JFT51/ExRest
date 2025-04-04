/**
 * Custom Analytics Page JavaScript
 * Independent file to avoid conflicts with other pages
 */

// Initialize chart variable
let analyticsChart = null;

// Initialize state object
const analyticsState = {
    period: 'days',
    startHour: '00:00',
    endHour: '23:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    selectedKPIs: ['visitorsIn'],
    showDataLabels: true,
    chartData: null
};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize hour selectors
    initializeHourSelectors();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize data labels toggle
    initializeDataLabelsToggle();
    
    // Wait for data to be loaded
    waitForData();
});

// Function to wait for dashboard data to be loaded
function waitForData() {
    const dataCheckInterval = setInterval(() => {
        if (window.dashboardState && 
            window.dashboardState.dayData && 
            window.dashboardState.dayData.length > 0) {
            clearInterval(dataCheckInterval);
            console.log('Data ready for analytics');
        }
    }, 100);
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
    startHourSelect.value = analyticsState.startHour;
    endHourSelect.value = analyticsState.endHour;
}

// Initialize event listeners
function initializeEventListeners() {
    // Period radio buttons
    document.querySelectorAll('input[name="period"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            analyticsState.period = e.target.value;
        });
    });
    
    // Hour range selectors
    document.getElementById('startHour').addEventListener('change', (e) => {
        analyticsState.startHour = e.target.value;
    });
    
    document.getElementById('endHour').addEventListener('change', (e) => {
        analyticsState.endHour = e.target.value;
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
    analyticsState.days = Array.from(document.querySelectorAll('input[name="day"]:checked'))
        .map(checkbox => checkbox.value);
}

// Update selected KPIs in state
function updateSelectedKPIs() {
    analyticsState.selectedKPIs = Array.from(document.querySelectorAll('input[name="kpi"]:checked'))
        .map(checkbox => checkbox.value);
}

// Initialize data labels toggle
function initializeDataLabelsToggle() {
    const toggle = document.getElementById('dataLabelsToggle');
    const status = document.getElementById('dataLabelsStatus');
    
    toggle.addEventListener('change', () => {
        analyticsState.showDataLabels = toggle.checked;
        status.textContent = toggle.checked ? 'Show Data Labels' : 'Hide Data Labels';
    });
}

// Generate chart based on selected options
function generateChart() {
    // Check if at least one KPI is selected
    if (analyticsState.selectedKPIs.length === 0) {
        alert('Please select at least one KPI to display');
        return;
    }
    
    // Prepare data based on selected period
    prepareChartData();
    
    // Create or update chart
    createChart();
    
    // Show chart container and hide no-data message
    document.querySelector('.chart-container').style.display = 'block';
    document.querySelector('.no-data-message').style.display = 'none';
    
    // Add download buttons
    if (typeof addDownloadButtons === 'function') {
        addDownloadButtons('analyticsChart');
    }
}

// Prepare chart data based on selected options
function prepareChartData() {
    let data = [];
    let labels = [];
    
    switch (analyticsState.period) {
        case 'hours':
            data = prepareHourlyData();
            break;
        case 'days':
            data = prepareDailyData();
            break;
        case 'weeks':
            data = prepareWeeklyData();
            break;
        case 'months':
            data = prepareMonthlyData();
            break;
    }
    
    analyticsState.chartData = data;
}

// Prepare hourly data
function prepareHourlyData() {
    if (!window.dashboardState || !window.dashboardState.hourData) return [];
    
    // Filter by selected days and hour range
    const filteredData = window.dashboardState.hourData.filter(hour => {
        const date = new Date(hour.timestamp);
        const dayName = getDayName(date.getDay()).toLowerCase();
        const hourStr = date.getHours().toString().padStart(2, '0') + ':00';
        
        return analyticsState.days.includes(dayName) && 
               hourStr >= analyticsState.startHour && 
               hourStr <= analyticsState.endHour;
    });
    
    // Sort by timestamp
    return filteredData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Prepare daily data
function prepareDailyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) return [];
    
    // Filter by selected days
    const filteredData = window.dashboardState.dayData.filter(day => {
        const date = new Date(day.date);
        const dayName = getDayName(date.getDay()).toLowerCase();
        
        return analyticsState.days.includes(dayName);
    });
    
    // Sort by date
    return filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Prepare weekly data
function prepareWeeklyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) return [];
    
    // Group data by week
    const weekData = {};
    
    window.dashboardState.dayData.forEach(day => {
        const date = new Date(day.date);
        const dayName = getDayName(date.getDay()).toLowerCase();
        
        // Skip if day not selected
        if (!analyticsState.days.includes(dayName)) return;
        
        // Get week number and year
        const weekYear = getWeekYear(date);
        const weekKey = `${weekYear.year}-W${weekYear.week}`;
        
        if (!weekData[weekKey]) {
            weekData[weekKey] = {
                weekNumber: weekYear.week,
                year: weekYear.year,
                startDate: getStartOfWeek(date),
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
        
        // Add data to week
        weekData[weekKey].visitorsIn += parseInt(day.visitorsIn || 0);
        weekData[weekKey].passersby += parseInt(day.passersby || 0);
        weekData[weekKey].visitorsOut += parseInt(day.visitorsOut || 0);
        weekData[weekKey].menIn += parseInt(day.menIn || 0);
        weekData[weekKey].menOut += parseInt(day.menOut || 0);
        weekData[weekKey].womenIn += parseInt(day.womenIn || 0);
        weekData[weekKey].womenOut += parseInt(day.womenOut || 0);
        weekData[weekKey].groupIn += parseInt(day.groupIn || 0);
        weekData[weekKey].groupOut += parseInt(day.groupOut || 0);
        weekData[weekKey].dwellTimeSum += parseFloat(day.dwellTime || 0);
        weekData[weekKey].weatherSum += parseFloat(day.weather || 0);
        weekData[weekKey].count++;
    });
    
    // Calculate averages and percentages
    Object.values(weekData).forEach(week => {
        week.captureRate = week.passersby > 0 ? (week.visitorsIn / week.passersby) * 100 : 0;
        week.conversionRate = week.visitorsIn > 0 ? (week.groupIn / week.visitorsIn) * 100 : 0;
        week.dwellTime = week.count > 0 ? week.dwellTimeSum / week.count : 0;
        week.weather = week.count > 0 ? week.weatherSum / week.count : 0;
    });
    
    // Convert to array and sort by date
    return Object.values(weekData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
    });
}

// Prepare monthly data
function prepareMonthlyData() {
    if (!window.dashboardState || !window.dashboardState.dayData) return [];
    
    // Group data by month
    const monthData = {};
    
    window.dashboardState.dayData.forEach(day => {
        const date = new Date(day.date);
        const dayName = getDayName(date.getDay()).toLowerCase();
        
        // Skip if day not selected
        if (!analyticsState.days.includes(dayName)) return;
        
        // Get month and year
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthData[monthKey]) {
            monthData[monthKey] = {
                month: date.getMonth(),
                year: date.getFullYear(),
                date: new Date(date.getFullYear(), date.getMonth(), 1),
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
        
        // Add data to month
        monthData[monthKey].visitorsIn += parseInt(day.visitorsIn || 0);
        monthData[monthKey].passersby += parseInt(day.passersby || 0);
        monthData[monthKey].visitorsOut += parseInt(day.visitorsOut || 0);
        monthData[monthKey].menIn += parseInt(day.menIn || 0);
        monthData[monthKey].menOut += parseInt(day.menOut || 0);
        monthData[monthKey].womenIn += parseInt(day.womenIn || 0);
        monthData[monthKey].womenOut += parseInt(day.womenOut || 0);
        monthData[monthKey].groupIn += parseInt(day.groupIn || 0);
        monthData[monthKey].groupOut += parseInt(day.groupOut || 0);
        monthData[monthKey].dwellTimeSum += parseFloat(day.dwellTime || 0);
        monthData[monthKey].weatherSum += parseFloat(day.weather || 0);
        monthData[monthKey].count++;
    });
    
    // Calculate averages and percentages
    Object.values(monthData).forEach(month => {
        month.captureRate = month.passersby > 0 ? (month.visitorsIn / month.passersby) * 100 : 0;
        month.conversionRate = month.visitorsIn > 0 ? (month.groupIn / month.visitorsIn) * 100 : 0;
        month.dwellTime = month.count > 0 ? month.dwellTimeSum / month.count : 0;
        month.weather = month.count > 0 ? month.weatherSum / month.count : 0;
    });
    
    // Convert to array and sort by date
    return Object.values(monthData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });
}

// Create or update the chart
function createChart() {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (analyticsChart) {
        analyticsChart.destroy();
    }
    
    // Prepare datasets
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
    
    barKPIs.forEach(kpi => {
        if (analyticsState.selectedKPIs.includes(kpi)) {
            barDatasets.push({
                label: getKPILabel(kpi),
                data: analyticsState.chartData.map(item => item[kpi] || 0),
                backgroundColor: colors[kpi].bg,
                borderColor: colors[kpi].border,
                borderWidth: 1,
                borderRadius: 4,
                yAxisID: 'y',
                type: 'bar',
                datalabels: {
                    display: analyticsState.showDataLabels,
                    align: 'top',
                    anchor: 'end',
                    formatter: value => value > 0 ? Math.round(value).toLocaleString() : '',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    padding: 6,
                    color: colors[kpi].border
                }
            });
        }
    });
    
    // Line datasets (capture rate, conversion rate, etc.)
    const lineKPIs = ['captureRate', 'conversionRate', 'dwellTime', 'weather'];
    
    lineKPIs.forEach(kpi => {
        if (analyticsState.selectedKPIs.includes(kpi)) {
            lineDatasets.push({
                label: getKPILabel(kpi),
                data: analyticsState.chartData.map(item => item[kpi] || 0),
                backgroundColor: colors[kpi].bg,
                borderColor: colors[kpi].border,
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                yAxisID: kpi === 'dwellTime' ? 'y2' : (kpi === 'weather' ? 'y3' : 'y1'),
                type: 'line',
                datalabels: {
                    display: analyticsState.showDataLabels,
                    align: 'top',
                    anchor: 'end',
                    formatter: value => {
                        if (value <= 0) return '';
                        if (kpi === 'captureRate' || kpi === 'conversionRate') {
                            return value.toFixed(2) + '%';
                        }
                        return Math.round(value).toLocaleString();
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    padding: 6,
                    color: colors[kpi].border
                }
            });
        }
    });
    
    // Combine datasets
    datasets.push(...barDatasets, ...lineDatasets);
    
    // Prepare labels based on period
    const labels = analyticsState.chartData.map(item => {
        switch (analyticsState.period) {
            case 'hours':
                return new Date(item.timestamp);
            case 'days':
                return new Date(item.date);
            case 'weeks':
                return `Week ${item.weekNumber} ${item.year}`;
            case 'months':
                return new Date(item.date);
            default:
                return '';
        }
    });
    
    // Create chart
    analyticsChart = new Chart(ctx, {
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
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            
                            const value = context.parsed.y;
                            if (context.dataset.yAxisID === 'y1') {
                                label += value.toFixed(2) + '%';
                            } else {
                                label += Math.round(value).toLocaleString();
                            }
                            
                            return label;
                        }
                    }
                },
                title: {
                    display: true,
                    text: getChartTitle(),
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                x: {
                    type: analyticsState.period === 'weeks' ? 'category' : 'time',
                    time: {
                        unit: getTimeUnit(),
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'EEE dd MMM yyyy',
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: getXAxisTitle()
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Count',
                        color: 'rgb(45, 107, 34)'
                    },
                    ticks: {
                        precision: 0,
                        callback: function(value) {
                            return Math.round(value).toLocaleString();
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage (%)',
                        color: 'rgb(243, 151, 0)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y1')
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Dwell Time (seconds)',
                        color: 'rgb(175, 82, 222)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y2')
                },
                y3: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Weather',
                        color: 'rgb(90, 200, 250)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0
                    },
                    display: lineDatasets.some(d => d.yAxisID === 'y3')
                }
            }
        }
    });
}

// Helper function to get day name from day index
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

// Helper function to get week number and year
function getWeekYear(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
    return { week, year: d.getFullYear() };
}

// Helper function to get start of week (Monday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
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

// Helper function to get chart title
function getChartTitle() {
    const periodText = analyticsState.period.charAt(0).toUpperCase() + analyticsState.period.slice(1);
    const hourRangeText = `${analyticsState.startHour} - ${analyticsState.endHour}`;
    
    return `${periodText} Analysis (${hourRangeText})`;
}

// Helper function to get X-axis title
function getXAxisTitle() {
    switch (analyticsState.period) {
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
    switch (analyticsState.period) {
        case 'hours':
            return 'hour';
        case 'days':
            return 'day';
        case 'months':
            return 'month';
        default:
            return 'day';
    }
}
