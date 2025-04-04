let hourData = [];
let dayData = [];
let selectedDate = new Date();

const sampleData = {
    '2024-01-15': {
        hourly: Array.from({length: 24}, (_, i) => ({
            hour: i,
            visitors: Math.floor(Math.random() * 100),
            passersby: Math.floor(Math.random() * 200),
            captureRate: Math.random() * 0.5,
            conversion: Math.random() * 0.3,
            gender: {
                men: Math.random() * 0.6,
                women: Math.random() * 0.4
            }
        })),
        weather: 'Sunny',
        dataAccuracy: 0.95
    }
};

const fetchDayData = (date) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate API call
            resolve(sampleData[date] || generateRandomDayData(date));
        }, 500);
    });
};

const generateRandomDayData = (date) => {
    return {
        hourly: Array.from({length: 24}, (_, i) => ({
            hour: i,
            visitors: Math.floor(Math.random() * 100),
            passersby: Math.floor(Math.random() * 200),
            captureRate: Math.random() * 0.5,
            conversion: Math.random() * 0.3,
            gender: {
                men: Math.random() * 0.6,
                women: Math.random() * 0.4
            }
        })),
        weather: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        dataAccuracy: 0.8 + Math.random() * 0.2
    };
};

async function fetchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/JFT51/ExRest/refs/heads/main/ikxeold.csv');
        const text = await response.text();

        const rows = text.split('\n')
            .map(row => row.trim())
            .filter(row => row.length > 0)
            .map(row => row.split(','));

        const headers = rows[1];
        const data = rows.slice(1).filter(row => row.length === headers.length);

        processHourData(data);
        processDayData();
        await fetchWeatherData(window.dashboardState.dayData);

        if (window.dashboardState.dayData.length > 0) {
            window.dashboardState.selectedDate = new Date(Math.max(
                ...window.dashboardState.dayData.map(d => new Date(d.date))
            ));
        }

        initializeMonthSelector();
        displayHourData();
        displayDayData();
        updateMonthlyKPIs();
        createMonthlyChart();
        updateTickers();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchWeatherData(dayData) {
    const startDate = dayData[0].date;
    const endDate = dayData[dayData.length - 1].date;
    const lat = 50.8503;
    const lon = 4.3517;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&daily=temperature_2m_mean,precipitation_sum,windspeed_10m_max,weathercode`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        dayData.forEach((day, index) => {
            day.weather = getWeatherEmoji(data.daily.weathercode[index]);
            day.temperature = data.daily.temperature_2m_mean[index];
            day.precipitation = data.daily.precipitation_sum[index];
            day.windspeed = data.daily.windspeed_10m_max[index];
        });
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function processHourData(rawData) {
    window.dashboardState.hourData = rawData
        .map(row => {
            const timestamp = parseDate(row[0]);
            if (!timestamp) return null;

            const visitorsIn = parseInt(row[1]) || 0;
            const visitorsOut = parseInt(row[2]) || 0;
            const passersby = parseInt(row[9]) || 0;

            // Adjust gender counts to match total visitors
            let rawMenIn = parseInt(row[3]) || 0;
            let rawWomenIn = parseInt(row[5]) || 0;
            let rawMenOut = parseInt(row[4]) || 0;
            let rawWomenOut = parseInt(row[6]) || 0;

            // Adjust incoming gender counts
            const totalRawIn = rawMenIn + rawWomenIn;
            const menIn = totalRawIn > 0 ? Math.round((rawMenIn / totalRawIn) * visitorsIn) : 0;
            const womenIn = totalRawIn > 0 ? visitorsIn - menIn : 0;

            // Adjust outgoing gender counts
            const totalRawOut = rawMenOut + rawWomenOut;
            const menOut = totalRawOut > 0 ? Math.round((rawMenOut / totalRawOut) * visitorsOut) : 0;
            const womenOut = totalRawOut > 0 ? visitorsOut - menOut : 0;

            return {
                timestamp,
                visitorsIn,
                visitorsOut,
                menIn,
                menOut,
                womenIn,
                womenOut,
                groupIn: parseInt(row[7]) || 0,
                groupOut: parseInt(row[8]) || 0,
                passersby,
                captureRate: passersby > 0 ? ((visitorsIn / passersby) * 100).toFixed(2) : '0.00',
                accumulatedIn: 0,
                accumulatedOut: 0,
                liveVisitors: 0
            };
        })
        .filter(row => row !== null);

    // Calculate accumulated values
    let currentDate = null;
    for (let i = 0; i < window.dashboardState.hourData.length; i++) {
        const row = window.dashboardState.hourData[i];

        if (!currentDate || !isSameDay(currentDate, row.timestamp)) {
            currentDate = row.timestamp;
            row.accumulatedIn = row.visitorsIn;
            row.accumulatedOut = row.visitorsOut;
        } else {
            row.accumulatedIn = window.dashboardState.hourData[i-1].accumulatedIn + row.visitorsIn;
            row.accumulatedOut = window.dashboardState.hourData[i-1].accumulatedOut + row.visitorsOut;
        }

        row.liveVisitors = Math.max(0, row.accumulatedIn - (i > 0 ? window.dashboardState.hourData[i-1].accumulatedOut : 0));
    }
}

function processDayData() {
    const dayMap = new Map();

    window.dashboardState.hourData.forEach(hour => {
        if (!hour.timestamp) return;

        const dateKey = hour.timestamp.toISOString().split('T')[0];

        if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, {
                visitorsIn: 0,
                visitorsOut: 0,
                menIn: 0,
                menOut: 0,
                womenIn: 0,
                womenOut: 0,
                groupIn: 0,
                groupOut: 0,
                passersby: 0,
                openingHoursStats: {
                    visitorsIn: 0,
                    passersby: 0
                },
                liveVisitorsSum: 0,
                liveVisitorsCount: 0
            });
        }

        const dayStats = dayMap.get(dateKey);

        // Accumulate the already adjusted hourly values
        dayStats.visitorsIn += hour.visitorsIn;
        dayStats.visitorsOut += hour.visitorsOut;
        dayStats.menIn += hour.menIn;
        dayStats.menOut += hour.menOut;
        dayStats.womenIn += hour.womenIn;
        dayStats.womenOut += hour.womenOut;
        dayStats.groupIn += hour.groupIn;
        dayStats.groupOut += hour.groupOut;
        dayStats.passersby += hour.passersby;

        if (isOpeningHour(hour.timestamp)) {
            dayStats.openingHoursStats.visitorsIn += hour.visitorsIn;
            dayStats.openingHoursStats.passersby += hour.passersby;
            dayStats.liveVisitorsSum += hour.liveVisitors;
            dayStats.liveVisitorsCount++;
        }
    });

    // Convert accumulated data to final day data
    window.dashboardState.dayData = Array.from(dayMap.entries()).map(([dateStr, stats]) => {
        // Calculate capture rate using only opening hours data
        const openingHoursVisitors = stats.openingHoursStats.visitorsIn || 0;
        const openingHoursPassersby = stats.openingHoursStats.passersby || 1; // Prevent division by zero

        return {
            date: new Date(dateStr),
            ...stats,
            captureRate: ((openingHoursVisitors / openingHoursPassersby) * 100).toFixed(2),
            conversion: ((stats.groupIn / (stats.visitorsIn || 1)) * 100).toFixed(2),
            dwellTime: stats.liveVisitorsCount > 0 ?
                ((stats.liveVisitorsSum / stats.liveVisitorsCount) / (stats.visitorsIn || 1) * 60 * 10).toFixed(0) : '0', // Multiplied by 10
            dataAccuracy: ((Math.min(stats.visitorsIn, stats.visitorsOut) /
                Math.max(stats.visitorsIn, stats.visitorsOut || 1)) * 100).toFixed(1)
        };
    });

    // Sort by date
    window.dashboardState.dayData.sort((a, b) => a.date - b.date);
}

function updateMonthlyKPIs() {
    const selectedMonth = window.dashboardState.selectedDate.getMonth();
    const selectedYear = window.dashboardState.selectedDate.getFullYear();

    const monthlyData = window.dashboardState.dayData.filter(day => {
        const date = new Date(day.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const monthlyTotals = monthlyData.reduce((acc, day) => ({
        visitorsIn: acc.visitorsIn + day.visitorsIn,
        menIn: acc.menIn + day.menIn,
        womenIn: acc.womenIn + day.womenIn,
        groupIn: acc.groupIn + day.groupIn,
        captureRate: acc.captureRate + parseFloat(day.captureRate)
    }), { visitorsIn: 0, menIn: 0, womenIn: 0, groupIn: 0, captureRate: 0 });

    const totalVisitors = monthlyTotals.menIn + monthlyTotals.womenIn;
    const menPercentage = totalVisitors > 0 ? ((monthlyTotals.menIn / totalVisitors) * 100).toFixed(1) : '0.0';
    const womenPercentage = totalVisitors > 0 ? ((monthlyTotals.womenIn / totalVisitors) * 100).toFixed(1) : '0.0';
    const avgCaptureRate = monthlyData.length > 0 ? (monthlyTotals.captureRate / monthlyData.length).toFixed(1) : '0.0';

    // Calculate conversion rate as sum of group entering divided by sum of visitors entering
    const conversionRate = monthlyTotals.visitorsIn > 0 ? ((monthlyTotals.groupIn / monthlyTotals.visitorsIn) * 100).toFixed(1) : '0.0';

    document.getElementById('monthlyVisitors').textContent = monthlyTotals.visitorsIn.toLocaleString();
    document.getElementById('menPercentage').textContent = menPercentage + '%';
    document.getElementById('womenPercentage').textContent = womenPercentage + '%';
    document.getElementById('avgCaptureRate').textContent = avgCaptureRate + '%';
    document.getElementById('conversionRate').textContent = conversionRate + '%';
}

function updateTickers() {
    // Get top 3 customer days
    const topCustomerDays = [...window.dashboardState.dayData]
        .sort((a, b) => b.visitorsIn - a.visitorsIn)
        .slice(0, 3);

    // Get top 3 capture rate days
    const topCaptureRateDays = [...window.dashboardState.dayData]
        .filter(day => {
            const rate = parseFloat(day.captureRate);
            return !isNaN(rate) && isFinite(rate) && rate > 0 && day.visitorsIn > 0;
        })
        .sort((a, b) => parseFloat(b.captureRate) - parseFloat(a.captureRate))
        .slice(0, 3);

    // Update customers ticker
    const customersContent = document.getElementById('customersTickerContent');
    customersContent.innerHTML = topCustomerDays.length > 0 ?
        topCustomerDays.map(day => `
            <div class="ticker-item">
                <div class="ticker-date">${formatTickerDate(day.date)}</div>
                <div class="ticker-value">${day.visitorsIn.toLocaleString()} customers</div>
            </div>
        `).join('') :
        '<div class="ticker-item">No customer data available</div>';

    // Update capture rate ticker
    const captureRateContent = document.getElementById('captureRateTickerContent');
    captureRateContent.innerHTML = topCaptureRateDays.length > 0 ?
        topCaptureRateDays.map(day => `
            <div class="ticker-item capture-rate">
                <div class="ticker-date">${formatTickerDate(day.date)}</div>
                <div class="ticker-value">${day.captureRate}% capture</div>
            </div>
        `).join('') :
        '<div class="ticker-item capture-rate">No capture rate data available</div>';
}
