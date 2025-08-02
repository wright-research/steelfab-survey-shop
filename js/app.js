/**
 * App Module - Main Application Coordinator
 * Initializes and coordinates all other modules
 */

/**
 * Initialize the application
 */
function initializeApp() {

    // Set up drawer functionality immediately
    window.DrawerModule.setupDrawerFunctionality();

    // Initialize CSV loader first
    window.CSVLoaderModule.initializeCSVLoader().then(() => {
        // Initialize KPI display after CSV data is loaded
        window.KPIModule.initializeKPIDisplay();

        // Initialize grouped averages table after CSV data is loaded
        window.initializeGroupedAveragesTable();

        // Initialize charts after CSV data is loaded with a small delay
        setTimeout(() => {
            if (window.DataModule.csvData && window.DataModule.csvData.length > 0) {
                window.charts.initializeCharts(window.DataModule.csvData);
            } else {
                console.error('CSV data not available for charts initialization');
            }
        }, 100);

        // Wait for Shoelace components to be ready before setting up radio functionality
        window.UtilsModule.waitForShoelace().then(() => {
            window.FiltersModule.setupRadioSelectFunctionality();
        }).catch(error => {
            // Try to set up radio functionality anyway
            window.FiltersModule.setupRadioSelectFunctionality();
        });

        // Fallback: Try to set up radio functionality after a simple delay
        setTimeout(() => {
            window.FiltersModule.setupRadioSelectFunctionality();
        }, 1000);
    }).catch(error => {
        // Still try to set up the UI even if CSV loading fails
        window.KPIModule.initializeKPIDisplay();
        window.initializeGroupedAveragesTable();
        window.FiltersModule.setupRadioSelectFunctionality();
    });

    // Set up global keyboard shortcuts (optional)
    setupKeyboardShortcuts();

    // Set up development helpers (optional)
    setupDevelopmentHelpers();
}

/**
 * Set up keyboard shortcuts for easier development and testing
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Press 'f' to open/close filters drawer
        if (e.key === 'f' && e.ctrlKey) {
            e.preventDefault();
            const drawer = document.getElementById('survey-drawer');
            if (drawer) {
                if (window.DrawerModule.isDrawerCurrentlyOpen()) {
                    drawer.hide();
                } else {
                    drawer.show();
                }
            }
        }

        // Press 'r' to reset filters
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            window.FiltersModule.resetFilters();
        }
    });
}

/**
 * Set up development helpers for easier debugging
 */
function setupDevelopmentHelpers() {
    // Add global functions for easier console debugging
    window.SurveyApp = {
        // Get current filter state
        getFilters: () => window.FiltersModule.getCurrentFilterState(),

        // Get filters in CSV format
        getFiltersForCsv: () => window.UtilsModule.getCurrentFiltersForCsv(),

        // Log current state
        logState: () => window.UtilsModule.logFilterState(),

        // Reset filters
        resetFilters: () => window.FiltersModule.resetFilters(),

        // Access to all modules
        modules: {
            data: window.DataModule,
            drawer: window.DrawerModule,
            filters: window.FiltersModule,
            utils: window.UtilsModule
        }
    };
}

/**
 * Handle application errors gracefully
 */
function handleAppError(error, context) {

}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function () {
    try {
        initializeApp();
    } catch (error) {
        handleAppError(error, 'initialization');
    }
});

// Export functions for use in other modules
window.AppModule = {
    initializeApp,
    handleAppError
}; 