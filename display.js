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
    
    window.dashboardState.hourData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(row.timestamp)}</td>
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
    
    window.dashboardState.dayData.forEach(row => {
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
    
    tbody.innerHTML = weekData.map(week => `
        <tr>
            <td>Week ${week.weekNumber}</td>
            <td>${formatDate(week.startDate)} - ${formatDate(week.endDate)}</td>
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
    const weekMap = new Map();
    
    dayData.forEach(day => {
        const date = new Date(day.date);
        const weekNumber = getWeekNumber(date);
        
        if (!weekMap.has(weekNumber)) {
            weekMap.set(weekNumber, {
                weekNumber,
                startDate: getStartOfWeek(date),
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
        
        const week = weekMap.get(weekNumber);
        week.visitorsIn += day.visitorsIn;
        week.passersby += day.passersby;
        week.menIn += day.menIn;
        week.womenIn += day.womenIn;
        week.groupIn += day.groupIn;
        week.dwellTimeSum += parseFloat(day.dwellTime);
        week.accuracySum += parseFloat(day.dataAccuracy);
        week.dayCount++;
    });
    
    // Calculate averages and percentages
    return Array.from(weekMap.values())
        .map(week => ({
            ...week,
            captureRate: ((week.visitorsIn / week.passersby) * 100).toFixed(1),
            menPercentage: ((week.menIn / (week.menIn + week.womenIn)) * 100).toFixed(1),
            womenPercentage: ((week.womenIn / (week.menIn + week.womenIn)) * 100).toFixed(1),
            conversion: ((week.groupIn / week.visitorsIn) * 100).toFixed(1),
            avgDwellTime: (week.dwellTimeSum / week.dayCount).toFixed(0),
            avgAccuracy: (week.accuracySum / week.dayCount).toFixed(1)
        }))
        .sort((a, b) => a.weekNumber - b.weekNumber);
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 7;
    return new Date(d.setDate(diff));
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