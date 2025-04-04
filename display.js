function displayHourData() {
    const table = document.getElementById('hourDataTable');

    // Set headers
    const headerRow = document.createElement('tr');
    const headers = [
        'Timestamp', 'Visitors IN', 'Visitors OUT', 'Men IN', 'Men OUT',
        'Women IN', 'Women OUT', 'Group IN', 'Group OUT', 'Passersby',
        'Capture Rate', 'Acc. Visitors IN', 'Acc. Visitors OUT', 'Live Visitors'
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    table.querySelector('thead').innerHTML = '';
    table.querySelector('thead').appendChild(headerRow);

    // Set data
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    // Sort hour data chronologically
    const sortedHourData = [...window.dashboardState.hourData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    sortedHourData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTimestamp(row.timestamp)}</td>
            <td>${row.visitorsIn}</td>
            <td>${row.visitorsOut}</td>
            <td>${row.menIn}</td>
            <td>${row.menOut}</td>
            <td>${row.womenIn}</td>
            <td>${row.womenOut}</td>
            <td>${row.groupIn}</td>
            <td>${row.groupOut}</td>
            <td>${row.passersby}</td>
            <td>${row.captureRate}%</td>
            <td>${row.accumulatedIn}</td>
            <td>${row.accumulatedOut}</td>
            <td>${row.liveVisitors}</td>
        `;
        tbody.appendChild(tr);
    });
}

function displayDayData() {
    const table = document.getElementById('dayDataTable');

    // Set headers
    const headerRow = document.createElement('tr');
    const headers = [
        'Date', 'Visitors IN', 'Visitors OUT', 'Men IN', 'Men OUT',
        'Women IN', 'Women OUT', 'Group IN', 'Group OUT', 'Passersby',
        'Capture Rate', 'Conversion', 'Dwell Time', 'Data Accuracy',
        'Weather', 'Temp.', 'Precip.', 'Wind'
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    table.querySelector('thead').innerHTML = '';
    table.querySelector('thead').appendChild(headerRow);

    // Set data
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    // Get the first day from hourDataContainer
    let firstDay = null;
    if (window.dashboardState.hourData && window.dashboardState.hourData.length > 0) {
        // Sort hour data chronologically
        const sortedHourData = [...window.dashboardState.hourData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Get the date of the first hour entry
        if (sortedHourData[0] && sortedHourData[0].timestamp) {
            const firstHourDate = new Date(sortedHourData[0].timestamp);
            firstDay = new Date(firstHourDate.getFullYear(), firstHourDate.getMonth(), firstHourDate.getDate());
        }
    }

    // Sort day data chronologically
    const sortedDayData = [...window.dashboardState.dayData].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter day data to start from the same first day as hourDataContainer
    const filteredDayData = firstDay ?
        sortedDayData.filter(day => new Date(day.date) >= firstDay) :
        sortedDayData;

    filteredDayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateShort(row.date)}</td>
            <td>${row.visitorsIn}</td>
            <td>${row.visitorsOut}</td>
            <td>${row.menIn}</td>
            <td>${row.menOut}</td>
            <td>${row.womenIn}</td>
            <td>${row.womenOut}</td>
            <td>${row.groupIn}</td>
            <td>${row.groupOut}</td>
            <td>${row.passersby}</td>
            <td>${row.captureRate}%</td>
            <td>${row.conversion}%</td>
            <td>${row.dwellTime} min</td>
            <td>${row.dataAccuracy}%</td>
            <td>${row.weather}</td>
            <td>${row.temperature}°C</td>
            <td>${row.precipitation}mm</td>
            <td>${row.windspeed}km/h</td>
        `;
        tbody.appendChild(tr);
    });
}

function displayWeekData() {
    const tbody = document.getElementById('weekDataTable').querySelector('tbody');
    const weekData = calculateWeekData(window.dashboardState.dayData);

    console.log('Week data:', weekData);

    if (!weekData || weekData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">No week data available</td></tr>';
        return;
    }

    tbody.innerHTML = weekData.map(week => `
        <tr>
            <td>Week ${String(week.weekNumber).padStart(2, '0')} ${week.weekYear}</td>
            <td>${formatDateShort(week.startDate)} - ${formatDateShort(week.endDate)}</td>
            <td>${week.visitorsIn.toLocaleString()}</td>
            <td>${week.passersby.toLocaleString()}</td>
            <td>${week.captureRate}%</td>
            <td>${week.menPercentage}% / ${week.womenPercentage}%</td>
            <td>${week.groupIn.toLocaleString()}</td>
            <td>${week.conversion}%</td>
            <td>${week.avgDwellTime} min</td>
            <td>${week.avgAccuracy}%</td>
        </tr>
    `).join('');
}

function calculateWeekData(dayData) {
    console.log('Original day data length:', dayData.length);

    // Get the first day from hourDataContainer
    let firstDay = null;
    if (window.dashboardState.hourData && window.dashboardState.hourData.length > 0) {
        // Sort hour data chronologically
        const sortedHourData = [...window.dashboardState.hourData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Get the date of the first hour entry
        if (sortedHourData[0] && sortedHourData[0].timestamp) {
            const firstHourDate = new Date(sortedHourData[0].timestamp);
            firstDay = new Date(firstHourDate.getFullYear(), firstHourDate.getMonth(), firstHourDate.getDate());
            console.log('First day from hour data:', formatDate(firstDay));
        }
    }

    // Filter day data to start from the same first day as hourDataContainer
    // but with more robust date handling
    const filteredDayData = firstDay ?
        dayData.filter(day => {
            if (!day.date) return false;
            try {
                const dayDate = new Date(day.date);
                if (isNaN(dayDate.getTime())) return false;
                return dayDate >= firstDay;
            } catch (e) {
                console.error('Error comparing dates:', e);
                return false;
            }
        }) :
        dayData;

    console.log('Filtered day data length:', filteredDayData.length);

    const weekMap = new Map();

    console.log('Filtered day data:', filteredDayData);

    filteredDayData.forEach(day => {
        // Ensure day.date is a valid date
        if (!day.date) {
            console.warn('Day has no date:', day);
            return;
        }

        const date = new Date(day.date);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', day.date);
            return;
        }

        const weekNumber = getWeekNumber(date);

        // Get the year for the week
        // For weeks that span across years, the year is determined by the Thursday of that week
        const weekStart = getStartOfWeek(date);
        const weekThursday = new Date(weekStart);
        weekThursday.setDate(weekStart.getDate() + 3); // Thursday is 3 days after Monday
        const weekYear = weekThursday.getFullYear();

        // Create a unique key for the week using both year and week number
        const weekKey = `${weekYear}-${weekNumber}`;

        console.log(`Day ${formatDate(date)}: Week ${weekNumber}, Year ${weekYear}, Key ${weekKey}`);

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, {
                weekNumber,
                weekYear,
                startDate: weekStart,
                endDate: getEndOfWeek(date),
                visitorsIn: 0,
                passersby: 0,
                menIn: 0,
                womenIn: 0,
                groupIn: 0,
                dwellTimeSum: 0,
                accuracySum: 0,
                dayCount: 0
            });
        }

        const week = weekMap.get(weekKey);
        // Add values with proper error handling
        const visitorsIn = parseInt(day.visitorsIn || 0);
        const passersby = parseInt(day.passersby || 0);
        const menIn = parseInt(day.menIn || 0);
        const womenIn = parseInt(day.womenIn || 0);
        const groupIn = parseInt(day.groupIn || 0);
        const dwellTime = parseFloat(day.dwellTime || 0);
        const dataAccuracy = parseFloat(day.dataAccuracy || 0);

        // Add values to week totals, handling NaN values
        week.visitorsIn += isNaN(visitorsIn) ? 0 : visitorsIn;
        week.passersby += isNaN(passersby) ? 0 : passersby;
        week.menIn += isNaN(menIn) ? 0 : menIn;
        week.womenIn += isNaN(womenIn) ? 0 : womenIn;
        week.groupIn += isNaN(groupIn) ? 0 : groupIn;
        week.dwellTimeSum += isNaN(dwellTime) ? 0 : dwellTime;
        week.accuracySum += isNaN(dataAccuracy) ? 0 : dataAccuracy;
        week.dayCount++;
    });

    // Log the week map
    console.log('Week map size:', weekMap.size);
    console.log('Week map keys:', Array.from(weekMap.keys()));

    // Calculate averages and percentages
    const result = Array.from(weekMap.values())
        .map(week => {
            // Avoid division by zero
            const captureRate = week.passersby > 0 ? ((week.visitorsIn / week.passersby) * 100).toFixed(1) : '0.0';
            const totalGender = week.menIn + week.womenIn;
            const menPercentage = totalGender > 0 ? ((week.menIn / totalGender) * 100).toFixed(1) : '0.0';
            const womenPercentage = totalGender > 0 ? ((week.womenIn / totalGender) * 100).toFixed(1) : '0.0';
            const conversion = week.visitorsIn > 0 ? ((week.groupIn / week.visitorsIn) * 100).toFixed(1) : '0.0';
            const avgDwellTime = week.dayCount > 0 ? (week.dwellTimeSum / week.dayCount).toFixed(0) : '0';
            const avgAccuracy = week.dayCount > 0 ? (week.accuracySum / week.dayCount).toFixed(1) : '0.0';

            return {
                ...week,
                captureRate,
                menPercentage,
                womenPercentage,
                conversion,
                avgDwellTime,
                avgAccuracy
            };
        })
        .sort((a, b) => {
            // First sort by week year
            if (a.weekYear !== b.weekYear) return a.weekYear - b.weekYear;

            // Then sort by week number
            return a.weekNumber - b.weekNumber;
        });

    console.log('Calculated week data:', result);
    return result;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getStartOfWeek(date) {
    // Ensure we have a Date object
    const d = new Date(date);

    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const day = d.getDay();

    // Calculate the difference to get to Monday
    // If today is Sunday (0), we need to go back 6 days
    // If today is Monday (1), we need to go back 0 days
    // If today is Tuesday (2), we need to go back 1 day, etc.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);

    // Set the date to Monday and reset time to midnight
    const result = new Date(d.setDate(diff));
    result.setHours(0, 0, 0, 0);

    return result;
}

function getEndOfWeek(date) {
    // Ensure we have a Date object
    const d = new Date(date);

    // Get the start of the week (Monday)
    const startOfWeek = getStartOfWeek(d);

    // Add 6 days to get to Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Set time to end of day (23:59:59.999)
    endOfWeek.setHours(23, 59, 59, 999);

    return endOfWeek;
}

// Add this to the existing event listeners
document.getElementById('weekDataBtn').addEventListener('click', function() {
    // ...existing button state handling...
    displayWeekData();
});

// Update the initial display call
window.addEventListener('DOMContentLoaded', () => {
    // ...existing initialization...
    displayWeekData();
});