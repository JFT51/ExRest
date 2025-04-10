// Tab Navigation Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get all tab buttons and content sections
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Function to activate a tab
    function activateTab(tabId) {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to the specified tab button and content
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Store the active tab in localStorage for persistence
            localStorage.setItem('activeTab', tabId);
        }
    }
    
    // Add click event to each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the tab to activate
            const tabToActivate = button.getAttribute('data-tab');
            activateTab(tabToActivate);
        });
    });
    
    // Add click event to the KPI Explanations link in the banner
    const kpiExplanationsLink = document.getElementById('kpiExplanationsLink');
    if (kpiExplanationsLink) {
        kpiExplanationsLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            activateTab('kpi-explanations');
        });
    }
    
    // Check if there's a stored active tab
    const storedActiveTab = localStorage.getItem('activeTab');
    
    // If there is, activate that tab
    if (storedActiveTab) {
        const tabToActivate = document.querySelector(`.tab-button[data-tab="${storedActiveTab}"]`);
        if (tabToActivate) {
            activateTab(storedActiveTab);
        } else {
            // If the stored tab doesn't exist, activate the first tab
            activateTab(tabButtons[0].getAttribute('data-tab'));
        }
    } else {
        // If no stored tab, activate the first tab
        activateTab(tabButtons[0].getAttribute('data-tab'));
    }
});
