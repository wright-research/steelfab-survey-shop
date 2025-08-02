/**
 * Drawer Module - Drawer Show/Hide Functionality
 * Handles drawer interactions and button state management
 */

// Global state to track drawer open/closed
let isDrawerOpen = false;
let currentComparisonMode = 'baseline';

/**
 * Hide the survey filters button
 */
function hideButton() {
    const button = document.getElementById('survey-filters-btn');
    if (button) {
        button.classList.add('hidden');
    }
}

/**
 * Show the survey filters button
 */
function showButton() {
    const button = document.getElementById('survey-filters-btn');
    if (button) {
        button.classList.remove('hidden');
    }
}

/**
 * Set up drawer open/close functionality
 */
function setupDrawerFunctionality() {
    const surveyFiltersBtn = document.getElementById('survey-filters-btn');
    const surveyDrawer = document.getElementById('survey-drawer');

    // Survey Filters button - opens the drawer
    if (surveyFiltersBtn && surveyDrawer) {
        surveyFiltersBtn.addEventListener('click', function (e) {
            // Try to show the drawer
            try {
                surveyDrawer.show();
            } catch (error) {
                console.error('Error calling drawer.show():', error);
                throw error;
            }
        });
    } else {
        throw new Error('Could not set up drawer functionality - missing elements');
    }

    // Listen for drawer events
    if (surveyDrawer) {
        surveyDrawer.addEventListener('sl-show', function (e) {
            // Only hide button if the event is from the drawer itself
            if (e.target === surveyDrawer) {
                isDrawerOpen = true;
                hideButton();
            } else {
            }
        });

        surveyDrawer.addEventListener('sl-hide', function (e) {
            // Only show button if the event is from the drawer itself
            if (e.target === surveyDrawer) {
                isDrawerOpen = false;
                showButton();
            } else {
            }
        });
    } else {
        throw new Error('Could not set up drawer event listeners - missing drawer element');
    }

    // Set up comparison mode functionality
    setupComparisonModeToggle();
}

/**
 * Get current drawer state
 * @returns {boolean} True if drawer is open, false otherwise
 */
function isDrawerCurrentlyOpen() {
    return isDrawerOpen;
}

/**
 * Update the explanatory text based on the selected comparison mode
 * @param {string} mode - The mode to show explanation for ('baseline', 'roles', 'location')
 */
function updateComparisonModeExplanation(mode) {
    const explanationText = document.getElementById('comparison-mode-explanation-text');

    if (explanationText) {
        switch (mode) {
            case 'baseline':
                explanationText.textContent = 'Compare company-wide SteelFab survey results to a smaller section of the company, filtered by roles or locations (or both).';
                break;
            case 'roles':
                explanationText.textContent = 'Compare up to 5 roles within SteelFab to each other.';
                break;
            case 'location':
                explanationText.textContent = 'Compare up to 5 locations within SteelFab to each other.';
                break;
            default:
                console.warn('Unknown comparison mode for explanation:', mode);
                explanationText.textContent = 'Compare company-wide SteelFab survey results to a smaller section of the company, filtered by roles or locations (or both).';
                break;
        }
    }
}

/**
 * Show the specified comparison mode container and hide others
 * @param {string} mode - The mode to show ('baseline', 'roles', 'location')
 */
function showComparisonMode(mode) {
    // Hide all mode containers
    const baselineContainer = document.getElementById('baseline-filters-container');
    const rolesContainer = document.getElementById('roles-mode-container');
    const locationContainer = document.getElementById('location-mode-container');

    if (baselineContainer) baselineContainer.classList.add('hidden');
    if (rolesContainer) rolesContainer.classList.add('hidden');
    if (locationContainer) locationContainer.classList.add('hidden');

    // Show the selected mode container
    switch (mode) {
        case 'baseline':
            if (baselineContainer) baselineContainer.classList.remove('hidden');
            break;
        case 'roles':
            if (rolesContainer) rolesContainer.classList.remove('hidden');
            break;
        case 'location':
            if (locationContainer) locationContainer.classList.remove('hidden');
            break;
        default:
            console.warn('Unknown comparison mode:', mode);
            // Default to baseline
            if (baselineContainer) baselineContainer.classList.remove('hidden');
            break;
    }

    currentComparisonMode = mode;

    // Update the explanatory text
    updateComparisonModeExplanation(mode);

    // Update KPI display when comparison mode changes
    if (window.KPIModule) {
        window.KPIModule.updateKPIDisplay();
    }

    // Update grouped averages table when comparison mode changes
    if (window.updateGroupedAveragesTable) {
        window.updateGroupedAveragesTable();
    }

    // Update charts when comparison mode changes
    if (window.charts) {
        window.charts.updateCharts();
    }
}

/**
 * Set up comparison mode functionality
 */
function setupComparisonModeToggle() {
    // Use a small delay to ensure Shoelace components are ready
    setTimeout(() => {
        const comparisonModeRadioGroup = document.getElementById('comparison-mode-radio-group');

        if (comparisonModeRadioGroup) {
            comparisonModeRadioGroup.addEventListener('sl-change', function (e) {
                const selectedMode = e.target.value;
                showComparisonMode(selectedMode);

                // Reset existing filters when switching modes
                if (selectedMode !== 'baseline' && window.FiltersModule) {
                    window.FiltersModule.resetFilters();
                }
            });

            // Initialize with default mode
            showComparisonMode('baseline');
        } else {
            console.warn('Could not find comparison mode radio group');
        }

        // Set up alert monitoring for comparison mode selects
        setupComparisonModeAlerts();
    }, 100);
}

/**
 * Set up alerts for comparison mode selects when more than 5 items are selected
 */
function setupComparisonModeAlerts() {
    const rolesSelect = document.getElementById('roles-comparison-select');
    const locationsSelect = document.getElementById('locations-comparison-select');

    // Monitor roles select
    if (rolesSelect) {
        rolesSelect.addEventListener('sl-change', function (e) {
            const selectedValues = e.target.value || [];
            if (selectedValues.length > 5) {
                window.alert('Please remove one or more roles! You can compare up to 5 roles at a time.');
            }

            // Update KPI display when roles selection changes
            if (window.KPIModule) {
                window.KPIModule.updateKPIDisplay();
            }

            // Update grouped averages table when roles selection changes
            if (window.updateGroupedAveragesTable) {
                window.updateGroupedAveragesTable();
            }

            // Update charts when roles selection changes
            if (window.charts) {
                window.charts.updateCharts();
            }
        });
    }

    // Monitor locations select
    if (locationsSelect) {
        locationsSelect.addEventListener('sl-change', function (e) {
            const selectedValues = e.target.value || [];
            if (selectedValues.length > 5) {
                window.alert('Please remove one or more locations! You can compare up to 5 locations at a time.');
            }

            // Update KPI display when locations selection changes
            if (window.KPIModule) {
                window.KPIModule.updateKPIDisplay();
            }

            // Update grouped averages table when locations selection changes
            if (window.updateGroupedAveragesTable) {
                window.updateGroupedAveragesTable();
            }

            // Update charts when locations selection changes
            if (window.charts) {
                window.charts.updateCharts();
            }
        });
    }
}

/**
 * Get current comparison mode
 * @returns {string} Current comparison mode
 */
function getCurrentComparisonMode() {
    return currentComparisonMode;
}

// Export functions for use in other modules
window.DrawerModule = {
    setupDrawerFunctionality,
    isDrawerCurrentlyOpen,
    hideButton,
    showButton,
    showComparisonMode,
    setupComparisonModeToggle,
    getCurrentComparisonMode
}; 