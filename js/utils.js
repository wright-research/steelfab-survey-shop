/**
 * Utils Module - Utility Functions
 * Contains utility functions for Shoelace components and data conversion
 */

/**
 * Utility function to check if Shoelace components are ready
 * @returns {Promise} Promise that resolves when Shoelace components are ready
 */
function waitForShoelace() {
    return new Promise((resolve, reject) => {
        const components = [
            'sl-radio-group',
            'sl-select',
            'sl-radio-button',
            'sl-option'
        ];

        components.forEach(component => {
            // Log component readiness for debugging
        });

        Promise.all([
            customElements.whenDefined('sl-radio-group'),
            customElements.whenDefined('sl-select'),
            customElements.whenDefined('sl-radio-button'),
            customElements.whenDefined('sl-option')
        ]).then(() => {
            setTimeout(() => {
                resolve();
            }, 200);
        }).catch(error => {
            reject(error);
        });

        // Add a timeout to prevent hanging forever
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

/**
 * Convert clean role IDs to CSV values
 * @param {string[]} roleIds - Array of clean role IDs
 * @returns {string[]} Array of CSV role values
 */
function convertRoleIdsToCsvValues(roleIds) {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) return [];

    return roleIds.map(id => {
        const option = roleSelect.querySelector(`sl-option[value="${id}"]`);
        return option ? option.dataset.csvValue : id;
    });
}

/**
 * Convert clean location IDs to CSV values
 * @param {string[]} locationIds - Array of clean location IDs
 * @returns {string[]} Array of CSV location values
 */
function convertLocationIdsToCsvValues(locationIds) {
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return [];

    return locationIds.map(id => {
        const option = locationSelect.querySelector(`sl-option[value="${id}"]`);
        return option ? option.dataset.csvValue : id;
    });
}

/**
 * Get current filter values in CSV format
 * @returns {Object} Current filter values mapped to CSV format
 */
function getCurrentFiltersForCsv() {
    const roleRadioGroup = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const roleSelect = document.getElementById('role-select');
    const locationSelect = document.getElementById('location-select');

    const filters = {
        roleMode: roleRadioGroup ? roleRadioGroup.value : 'all',
        locationMode: locationRadioGroup ? locationRadioGroup.value : 'all',
        selectedRoles: [],
        selectedLocations: []
    };

    // Convert role selections to CSV format
    if (filters.roleMode === 'compare' && roleSelect && roleSelect.value) {
        filters.selectedRoles = convertRoleIdsToCsvValues(Array.isArray(roleSelect.value) ? roleSelect.value : [roleSelect.value]);
    }

    // Convert location selections to CSV format
    if (filters.locationMode === 'compare' && locationSelect && locationSelect.value) {
        filters.selectedLocations = convertLocationIdsToCsvValues(Array.isArray(locationSelect.value) ? locationSelect.value : [locationSelect.value]);
    }

    return filters;
}

/**
 * Log current filter state for debugging
 */
function logFilterState() {
    console.log('Current filter state:');
    console.log('- Basic filters:', window.FiltersModule.getCurrentFilterState());
    console.log('- CSV filters:', getCurrentFiltersForCsv());
}

// Export functions for use in other modules
window.UtilsModule = {
    waitForShoelace,
    convertRoleIdsToCsvValues,
    convertLocationIdsToCsvValues,
    getCurrentFiltersForCsv,
    logFilterState
}; 