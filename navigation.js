document.getElementById('hourDataBtn').addEventListener('click', () => switchView('hour'));
document.getElementById('dayDataBtn').addEventListener('click', () => switchView('day'));

function switchView(view) {
    const hourContainer = document.getElementById('hourDataContainer');
    const dayContainer = document.getElementById('dayDataContainer');
    const hourBtn = document.getElementById('hourDataBtn');
    const dayBtn = document.getElementById('dayDataBtn');

    if (view === 'hour') {
        hourContainer.classList.remove('hidden');
        dayContainer.classList.add('hidden');
        hourBtn.classList.add('active');
        dayBtn.classList.remove('active');
    } else {
        hourContainer.classList.add('hidden');
        dayContainer.classList.remove('hidden');
        hourBtn.classList.remove('active');
        dayBtn.classList.add('active');
    }
}

function initializeMonthSelector() {
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    updateMonthDisplay();
}

function changeMonth(delta) {
    window.dashboardState.selectedDate = new Date(
        window.dashboardState.selectedDate.getFullYear(),
        window.dashboardState.selectedDate.getMonth() + delta,
        1
    );
    updateMonthDisplay();
    updateMonthlyKPIs();
    createMonthlyChart();
}

function updateMonthDisplay() {
    const monthName = window.dashboardState.selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthName;
}
