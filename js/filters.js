/**
 * Filters Module - Radio Button and Select Functionality
 * Handles all filter interactions and state management
 */

let radioFunctionalitySetup = false;

/**
 * Helper function to update KPIs and Charts
 */
function updateKPIsAndCharts() {
    if (window.KPIModule) {
        window.KPIModule.updateKPIDisplay();
    }

    // Update grouped averages table with current filter state
    if (window.updateGroupedAveragesTable) {
        const currentFilters = window.UtilsModule.getCurrentFiltersForCsv();
        window.updateGroupedAveragesTable(currentFilters);
    }

    // Update charts with current filter state
    if (window.charts) {
        window.charts.updateCharts();
    }
}

/**
 * Get selected CSV values from a multi-select element
 * @param {HTMLElement} selectElement - The select element
 * @returns {Array} Array of CSV values
 */
function getSelectedCsvValues(selectElement) {
    const selectedValues = selectElement.value || [];
    return selectedValues.map(value => {
        const option = selectElement.querySelector(`sl-option[value="${value}"]`);
        return option ? option.getAttribute('data-csv-value') : null;
    }).filter(Boolean);
}

/**
 * Update location options based on selected roles
 * @param {Array} selectedRoles - Array of selected role CSV values
 */
function updateLocationOptionsBasedOnRoles(selectedRoles) {
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return;

    const currentLocationValue = locationSelect.value;
    window.DataModule.populateLocationOptions(locationSelect, selectedRoles);

    // Try to preserve selection if still available
    setTimeout(() => {
        if (Array.isArray(currentLocationValue) && currentLocationValue.length > 0) {
            const availableOptions = Array.from(locationSelect.querySelectorAll('sl-option')).map(opt => opt.value);
            const stillAvailable = currentLocationValue.filter(val => availableOptions.includes(val));
            if (stillAvailable.length > 0) {
                locationSelect.value = stillAvailable;
            } else {
                locationSelect.value = [];
            }
        }

        // Update KPIs and charts after location options change
        updateKPIsAndCharts();
    }, 100);
}

/**
 * Update filter label state based on radio button selection
 * @param {string} labelId - ID of the label element
 * @param {string} radioValue - Current radio button value
 */
function updateFilterLabelState(labelId, radioValue) {
    const label = document.getElementById(labelId);
    if (!label) return;

    if (radioValue === 'compare') {
        label.classList.remove('inactive');
        label.classList.add('active');
    } else {
        label.classList.remove('active');
        label.classList.add('inactive');
    }
}

/**
 * Initialize filter label states based on current radio button values
 */
function initializeFilterLabelStates() {
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');

    if (roleRadioGroup) {
        updateFilterLabelState('role-label', roleRadioGroup.value);
    }
    if (locationRadioGroup) {
        updateFilterLabelState('location-label', locationRadioGroup.value);
    }
}

/**
 * Update role options based on selected locations
 * @param {Array} selectedLocations - Array of selected location CSV values
 */
function updateRoleOptionsBasedOnLocations(selectedLocations) {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) return;

    const currentRoleValue = roleSelect.value;
    window.DataModule.populateRoleOptions(roleSelect, selectedLocations);

    // Try to preserve selection if still available
    setTimeout(() => {
        if (Array.isArray(currentRoleValue) && currentRoleValue.length > 0) {
            const availableOptions = Array.from(roleSelect.querySelectorAll('sl-option')).map(opt => opt.value);
            const stillAvailable = currentRoleValue.filter(val => availableOptions.includes(val));
            if (stillAvailable.length > 0) {
                roleSelect.value = stillAvailable;
            } else {
                roleSelect.value = [];
            }
        }

        // Update KPIs and charts after role options change
        updateKPIsAndCharts();
    }, 100);
}

/**
 * Set up radio button and select widget functionality
 */
function setupRadioSelectFunctionality() {
    // Guard to prevent multiple setups
    if (radioFunctionalitySetup) {
        return;
    }

    // Get radio groups and select elements
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const roleSelect = document.getElementById('role-select');
    const locationSelect = document.getElementById('location-select');

    // Set up role radio group listener
    if (roleRadioGroup && roleSelect) {
        roleRadioGroup.addEventListener('sl-change', function (e) {
            try {
                // Use the radio group's value property directly
                const currentValue = roleRadioGroup.value;

                // Update label state
                updateFilterLabelState('role-label', currentValue);

                if (currentValue === 'compare') {
                    roleSelect.removeAttribute('disabled');

                    // Check if location filter is active and get selected locations
                    const locationSelect = document.getElementById('location-select');
                    const selectedLocations = (locationSelect && !locationSelect.hasAttribute('disabled'))
                        ? getSelectedCsvValues(locationSelect)
                        : [];

                    window.DataModule.populateRoleOptions(roleSelect, selectedLocations);

                    // Update KPIs and charts after options are populated
                    setTimeout(() => {
                        updateKPIsAndCharts();
                    }, 200);
                } else {
                    roleSelect.setAttribute('disabled', '');
                    roleSelect.value = []; // Clear multiple selections
                    window.DataModule.clearSelectOptions(roleSelect);

                    // Reset location options to show all when role filtering is disabled
                    const locationSelect = document.getElementById('location-select');
                    if (locationSelect && !locationSelect.hasAttribute('disabled')) {
                        updateLocationOptionsBasedOnRoles([]);
                    }

                    // Update KPIs and charts immediately
                    updateKPIsAndCharts();
                }
            } catch (error) {
                throw error;
            }
        });

        // Add event listener for role select changes
        roleSelect.addEventListener('sl-change', function (e) {
            // Get selected role CSV values
            const selectedRoles = getSelectedCsvValues(roleSelect);

            // Update location options based on selected roles
            updateLocationOptionsBasedOnRoles(selectedRoles);

            // Update KPIs and charts when role selection changes
            updateKPIsAndCharts();
        });
    } else {
        throw new Error('Could not set up role radio listener - missing elements');
    }

    // Set up location radio group listener
    if (locationRadioGroup && locationSelect) {
        locationRadioGroup.addEventListener('sl-change', function (e) {
            try {
                // Use the radio group's value property directly
                const currentValue = locationRadioGroup.value;

                // Update label state
                updateFilterLabelState('location-label', currentValue);

                if (currentValue === 'compare') {
                    locationSelect.removeAttribute('disabled');

                    // Check if role filter is active and get selected roles
                    const roleSelect = document.getElementById('role-select');
                    const selectedRoles = (roleSelect && !roleSelect.hasAttribute('disabled'))
                        ? getSelectedCsvValues(roleSelect)
                        : [];

                    window.DataModule.populateLocationOptions(locationSelect, selectedRoles);

                    // Update KPIs and charts after options are populated
                    setTimeout(() => {
                        updateKPIsAndCharts();
                    }, 200);
                } else {
                    locationSelect.setAttribute('disabled', '');
                    locationSelect.value = []; // Clear multiple selections
                    window.DataModule.clearSelectOptions(locationSelect);

                    // Reset role options to show all when location filtering is disabled
                    const roleSelect = document.getElementById('role-select');
                    if (roleSelect && !roleSelect.hasAttribute('disabled')) {
                        updateRoleOptionsBasedOnLocations([]);
                    }

                    // Update KPIs and charts immediately
                    updateKPIsAndCharts();
                }
            } catch (error) {
                throw error;
            }
        });

        // Add event listener for location select changes
        locationSelect.addEventListener('sl-change', function (e) {
            // Get selected location CSV values
            const selectedLocations = getSelectedCsvValues(locationSelect);

            // Update role options based on selected locations
            updateRoleOptionsBasedOnLocations(selectedLocations);

            // Update KPIs and charts when location selection changes
            updateKPIsAndCharts();
        });
    }

    // Add event listeners to select elements to prevent dropdown interference
    setupSelectEventHandlers(roleSelect);
    setupSelectEventHandlers(locationSelect);

    // Initialize filter label states
    initializeFilterLabelStates();

    // Check for HTML default values and trigger filtering if needed
    checkAndTriggerHtmlDefaults();

    // Mark as set up
    radioFunctionalitySetup = true;
}

/**
 * Set up event handlers for select elements to prevent dropdown interference
 * @param {HTMLElement} selectElement - The select element to add handlers to
 */
function setupSelectEventHandlers(selectElement) {
    if (!selectElement) return;

    const selectEvents = ['sl-show', 'sl-hide', 'sl-after-show', 'sl-after-hide', 'sl-focus', 'sl-blur'];

    selectEvents.forEach(eventName => {
        selectElement.addEventListener(eventName, function (e) {
            e.stopPropagation(); // Prevent event from bubbling to drawer
        });
    });
}

/**
 * Get current filter selections
 * @returns {Object} Current filter state
 */
function getCurrentFilterState() {
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const roleSelect = document.getElementById('role-select');
    const locationSelect = document.getElementById('location-select');

    return {
        roleMode: roleRadioGroup ? roleRadioGroup.value : 'all',
        locationMode: locationRadioGroup ? locationRadioGroup.value : 'all',
        selectedRoles: roleSelect && roleSelect.value ? (Array.isArray(roleSelect.value) ? roleSelect.value : [roleSelect.value]) : [],
        selectedLocations: locationSelect && locationSelect.value ? (Array.isArray(locationSelect.value) ? locationSelect.value : [locationSelect.value]) : []
    };
}

/**
 * Reset all filters to default state
 */
function resetFilters() {
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const roleSelect = document.getElementById('role-select');
    const locationSelect = document.getElementById('location-select');

    // Reset radio groups to 'all'
    if (roleRadioGroup) roleRadioGroup.value = 'all';
    if (locationRadioGroup) locationRadioGroup.value = 'all';

    // Clear and disable select elements
    if (roleSelect) {
        roleSelect.value = [];
        roleSelect.setAttribute('disabled', '');
        window.DataModule.clearSelectOptions(roleSelect);
    }
    if (locationSelect) {
        locationSelect.value = [];
        locationSelect.setAttribute('disabled', '');
        window.DataModule.clearSelectOptions(locationSelect);
    }

    // Reset filter label states
    updateFilterLabelState('role-label', 'all');
    updateFilterLabelState('location-label', 'all');

    // Update KPIs and charts after reset
    updateKPIsAndCharts();
}

/**
 * Check for HTML default values and trigger filtering if needed
 */
function checkAndTriggerHtmlDefaults() {
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const roleSelect = document.getElementById('role-select');
    const locationSelect = document.getElementById('location-select');

    // Use a timeout to ensure Shoelace components are fully ready
    setTimeout(() => {
        let shouldTriggerUpdate = false;

        // Check if location filter has HTML default values
        if (locationRadioGroup && locationRadioGroup.value === 'compare') {
            // Get the HTML default value before populating options
            const htmlDefaultValue = locationSelect.getAttribute('value') || locationSelect.value;

            // Populate location options to ensure they exist
            window.DataModule.populateLocationOptions(locationSelect, []);

            // Explicitly set the HTML default value after populating options
            if (htmlDefaultValue) {
                setTimeout(() => {
                    // Convert to array format expected by multi-select
                    const valueArray = Array.isArray(htmlDefaultValue) ? htmlDefaultValue : [htmlDefaultValue];
                    locationSelect.value = valueArray;

                    // Trigger a change event to ensure all listeners are notified
                    locationSelect.dispatchEvent(new CustomEvent('sl-change', {
                        detail: { value: valueArray },
                        bubbles: true
                    }));
                }, 100);
            }
            shouldTriggerUpdate = true;
        }

        // Check if role filter has HTML default values  
        if (roleRadioGroup && roleRadioGroup.value === 'compare') {
            // Get the HTML default value before populating options
            const htmlDefaultValue = roleSelect.getAttribute('value') || roleSelect.value;

            // Populate role options to ensure they exist
            window.DataModule.populateRoleOptions(roleSelect, []);

            // Explicitly set the HTML default value after populating options
            if (htmlDefaultValue) {
                setTimeout(() => {
                    // Convert to array format expected by multi-select
                    const valueArray = Array.isArray(htmlDefaultValue) ? htmlDefaultValue : [htmlDefaultValue];
                    roleSelect.value = valueArray;

                    // Trigger a change event to ensure all listeners are notified
                    roleSelect.dispatchEvent(new CustomEvent('sl-change', {
                        detail: { value: valueArray },
                        bubbles: true
                    }));
                }, 100);
            }
            shouldTriggerUpdate = true;
        }

        // If any HTML defaults were found, trigger the data update after a brief delay
        if (shouldTriggerUpdate) {
            setTimeout(() => {
                updateKPIsAndCharts();
            }, 200);
        }
    }, 100);
}

// Export functions for use in other modules
window.FiltersModule = {
    setupRadioSelectFunctionality,
    getCurrentFilterState,
    resetFilters
}; 