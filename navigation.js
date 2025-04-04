document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to data view buttons with toggle functionality
    const hourBtn = document.getElementById('hourDataBtn');
    const dayBtn = document.getElementById('dayDataBtn');
    const weekBtn = document.getElementById('weekDataBtn');

    hourBtn.addEventListener('click', () => toggleView('hour'));
    dayBtn.addEventListener('click', () => toggleView('day'));
    weekBtn.addEventListener('click', () => toggleView('week'));

    // No default view - all containers remain hidden until a button is clicked

    // Add scroll event listener for date-picker-sticky transparency effect
    window.addEventListener('scroll', handleDatePickerScroll);
    // Initial call to set the correct state
    handleDatePickerScroll();

    // Initialize hamburger menu
    initializeHamburgerMenu();
});

function toggleView(view) {
    // Get all containers and buttons
    const hourContainer = document.getElementById('hourDataContainer');
    const dayContainer = document.getElementById('dayDataContainer');
    const weekContainer = document.getElementById('weekDataContainer');
    const messageContainer = document.getElementById('noDataSelectedMessage');
    const hourBtn = document.getElementById('hourDataBtn');
    const dayBtn = document.getElementById('dayDataBtn');
    const weekBtn = document.getElementById('weekDataBtn');

    // Check if the clicked button is already active (toggle off)
    let isTogglingOff = false;

    if (view === 'hour' && hourBtn.classList.contains('active')) {
        isTogglingOff = true;
    } else if (view === 'day' && dayBtn.classList.contains('active')) {
        isTogglingOff = true;
    } else if (view === 'week' && weekBtn.classList.contains('active')) {
        isTogglingOff = true;
    }

    // Hide all containers first
    hourContainer.classList.add('hidden');
    dayContainer.classList.add('hidden');
    weekContainer.classList.add('hidden');

    // Remove active class from all buttons
    hourBtn.classList.remove('active');
    dayBtn.classList.remove('active');
    weekBtn.classList.remove('active');

    // If not toggling off, show the selected container and activate the button
    if (!isTogglingOff) {
        if (view === 'hour') {
            hourContainer.classList.remove('hidden');
            hourBtn.classList.add('active');
            messageContainer.classList.add('hidden');
        } else if (view === 'day') {
            dayContainer.classList.remove('hidden');
            dayBtn.classList.add('active');
            messageContainer.classList.add('hidden');
        } else if (view === 'week') {
            weekContainer.classList.remove('hidden');
            weekBtn.classList.add('active');
            messageContainer.classList.add('hidden');
        }
    } else {
        // If toggling off, show the message container
        messageContainer.classList.remove('hidden');
    }

    // Trigger a resize event to ensure charts are properly sized
    window.dispatchEvent(new Event('resize'));

    console.log(`View ${isTogglingOff ? 'toggled off' : 'switched to'}: ${view}`);
}

function switchView(view) {
    // Keep the old function for backward compatibility
    toggleView(view);
}

function initializeMonthSelector() {
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    updateMonthDisplay();
}

// Function to handle date picker transparency on scroll
function handleDatePickerScroll() {
    const scrollPosition = window.scrollY;
    const datePickerContainers = document.querySelectorAll('.date-picker-container');

    datePickerContainers.forEach(container => {
        // Add 'scrolled' class when scrolled down more than 50px
        if (scrollPosition > 50) {
            container.classList.add('scrolled');
        } else {
            container.classList.remove('scrolled');
        }
    });
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

// Initialize hamburger menu functionality
function initializeHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerMenu');
    const tabMenu = document.getElementById('tabMenu');
    const tabButtons = document.querySelectorAll('.tab-button');

    if (!hamburgerBtn || !tabMenu) return;

    // Toggle menu when hamburger is clicked
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        tabMenu.classList.toggle('active');
    });

    // Close menu when a tab is clicked
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            tabMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!hamburgerBtn.contains(event.target) &&
            !tabMenu.contains(event.target) &&
            tabMenu.classList.contains('active')) {
            hamburgerBtn.classList.remove('active');
            tabMenu.classList.remove('active');
        }
    });

    // Close menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991 && tabMenu.classList.contains('active')) {
            hamburgerBtn.classList.remove('active');
            tabMenu.classList.remove('active');
        }
    });
}
