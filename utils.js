// Global state
window.dashboardState = {
    hourData: [],
    dayData: [],
    selectedDate: new Date()
};

function parseDate(dateStr) {
    try {
        console.log('Parsing date:', dateStr); // Debug
        const [date, time] = dateStr.split(' ');
        const [day, month, year] = date.split('/');
        const [hour, minute] = time.split(':');

        // Parse components as integers with radix 10
        const parsedDay = parseInt(day, 10);
        const parsedMonth = parseInt(month, 10) - 1; // Months are 0-based
        const parsedYear = parseInt(year, 10);
        const parsedHour = parseInt(hour, 10);
        const parsedMinute = parseInt(minute, 10);

        // Debug logging
        console.log('Parsed components:', {
            day: parsedDay,
            month: parsedMonth,
            year: parsedYear,
            hour: parsedHour,
            minute: parsedMinute
        });

        // Create date ensuring all components are valid numbers
        if ([parsedDay, parsedMonth, parsedYear, parsedHour, parsedMinute].some(isNaN)) {
            console.error('Invalid date components:', dateStr);
            return null;
        }

        const parsedDate = new Date(parsedYear, parsedMonth, parsedDay, parsedHour, parsedMinute);

        // Validate the resulting date
        if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date result:', dateStr);
            return null;
        }

        return parsedDate;
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
}

function isSameDay(date1, date2) {
    // ...existing isSameDay code...
}

function isOpeningHour(date) {
    if (!date) return false;

    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = date.getHours();

    const openingHours = {
        0: { start: 8, end: 16 }, // Sunday
        1: { start: 7, end: 20 }, // Monday
        2: { start: 7, end: 20 }, // Tuesday
        3: { start: 7, end: 20 }, // Wednesday
        4: { start: 7, end: 20 }, // Thursday
        5: { start: 7, end: 20 }, // Friday
        6: { start: 8, end: 20 }  // Saturday
    };

    const hours = openingHours[day];
    return hour >= hours.start && hour < hours.end;
}

// Format date for general use
function formatDate(date) {
    if (!date) return 'Invalid Date';

    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format timestamp specifically for hour data display
function formatTimestamp(date) {
    if (!date) return 'Invalid Date';

    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    // Format as "DD/MM/YYYY HH:MM"
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateShort(date) {
    if (!date) {
        return 'Invalid Date';
    }

    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    // Format as "DD DDD MMM YYYY" (e.g., "Wed 09 Oct 2024")
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // DDD
    const dayOfMonth = dateObj.toLocaleDateString('en-US', { day: '2-digit' }); // DD
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }); // MMM
    const year = dateObj.toLocaleDateString('en-US', { year: 'numeric' }); // YYYY

    return `${dayOfWeek} ${dayOfMonth} ${month} ${year}`;
}

function formatTickerDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function getWeatherEmoji(code) {
    const weatherMap = {
        0: '☀️', // Clear sky
        1: '🌤️', // Mainly clear
        2: '⛅', // Partly cloudy
        3: '☁️', // Overcast
        45: '🌫️', // Foggy
        48: '❄️', // Rime fog
        51: '🌦️', // Light drizzle
        53: '🌧️', // Moderate drizzle
        55: '💧', // Dense drizzle
        61: '🌦️', // Slight rain
        63: '🌧️', // Moderate rain
        65: '⛈️', // Heavy rain
        71: '🌨️', // Slight snow
        73: '❄️', // Moderate snow
        75: '🌨️', // Heavy snow
        77: '❄️', // Snow grains
        80: '🌦️', // Light rain showers
        81: '🌧️', // Moderate rain showers
        82: '⛈️', // Violent rain showers
        85: '🌨️', // Light snow showers
        86: '❄️', // Heavy snow showers
        95: '⚡', // Thunderstorm
        96: '⛈️', // Thunderstorm with slight hail
        99: '🌩️'  // Thunderstorm with heavy hail
    };

    // Return emoji or question mark if code not found
    return weatherMap[code] || '❓';
}

function createEmptyDayStats() {
    // ...existing createEmptyDayStats code...
}

function updateDayStats(stats, hour) {
    // ...existing updateDayStats code...
}

function calculateDayMetrics(stats) {
    // ...existing calculateDayMetrics code...
}

const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
};

const getWeekday = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
};

const calculateDayAverages = (data) => {
    const totals = {};
    const counts = {};

    data.forEach(day => {
        const weekday = getWeekday(day.date);
        if (!totals[weekday]) {
            totals[weekday] = { visitors: 0, passersby: 0, captureRate: 0 };
            counts[weekday] = 0;
        }

        totals[weekday].visitors += day.visitors;
        totals[weekday].passersby += day.passersby;
        totals[weekday].captureRate += day.captureRate;
        counts[weekday]++;
    });

    const averages = {};
    Object.keys(totals).forEach(weekday => {
        averages[weekday] = {
            visitors: totals[weekday].visitors / counts[weekday],
            passersby: totals[weekday].passersby / counts[weekday],
            captureRate: totals[weekday].captureRate / counts[weekday]
        };
    });

    return averages;
};
