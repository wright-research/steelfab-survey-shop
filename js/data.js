/**
 * Data Module - Role and Location Data Management
 * Contains all data definitions and population functions
 */

/**
 * Role options data with clean IDs mapped to CSV values
 */
const ROLE_OPTIONS = [
    { value: 'detail-coordinator', text: 'Detail coordinator', csvValue: 'Detail coordinator' },
    { value: 'fabrication-lead', text: 'Fabrication lead', csvValue: 'Fabrication lead' },
    { value: 'fitter', text: 'Fitter', csvValue: 'Fitter' },
    { value: 'forklift-operator', text: 'Forklift operator', csvValue: 'Forklift operator' },
    { value: 'lead-person', text: 'Lead person', csvValue: 'Lead person' },
    { value: 'machine-operator', text: 'Machine operator', csvValue: 'Machine operator' },
    { value: 'maintenance', text: 'Maintenance', csvValue: 'Maintenance' },
    { value: 'other', text: 'Other', csvValue: 'Other' },
    { value: 'painter', text: 'Painter', csvValue: 'Painter' },
    { value: 'part-runner', text: 'Part runner', csvValue: 'Part runner' },
    { value: 'programmer', text: 'Programmer', csvValue: 'Programmer' },
    { value: 'quality-control', text: 'Quality control', csvValue: 'Quality control' },
    { value: 'supervisor', text: 'Supervisor', csvValue: 'Supervisor' },
    { value: 'welder', text: 'Welder', csvValue: 'Welder' },
];

/**
 * Location options data with clean IDs mapped to CSV values
 */
const LOCATION_OPTIONS = [
    { value: 'baltimore-md', text: 'Baltimore, MD', csvValue: 'Maryland - Baltimore Shop' },
    { value: 'chandler-az', text: 'Chandler, AZ', csvValue: 'Arizona - Chandler Shop' },
    { value: 'charlotte-nc', text: 'Charlotte, NC', csvValue: 'North Carolina - Charlotte Shop' },
    { value: 'dublin-ga', text: 'Dublin, GA', csvValue: 'Georgia - Dublin Shop' },
    { value: 'durant-ok', text: 'Durant, OK', csvValue: 'Oklahoma - Durant Shop' },
    { value: 'emporia-va', text: 'Emporia, VA', csvValue: 'Virginia - Emporia Shop' },
    { value: 'fayetteville-nc', text: 'Fayetteville, NC', csvValue: 'North Carolina - Fayetteville Shop' },
    { value: 'florence-sc', text: 'Florence, SC', csvValue: 'South Carolina - Florence Shop' },
    { value: 'oakwood-tx', text: 'Oakwood, TX', csvValue: 'Texas - Oakwood Shop' },
    { value: 'roanoke-al', text: 'Roanoke, AL', csvValue: 'Alabama - Roanoke Shop' },
    { value: 'rock-hill-sc', text: 'Rock Hill, SC', csvValue: 'South Carolina - Rock Hill Shop' },
    { value: 'spokane-wa', text: 'Spokane, WA', csvValue: 'Washington - Spokane Shop' },
    { value: 'tangent-or', text: 'Tangent, OR', csvValue: 'Oregon - Tangent Shop' },
    { value: 'york-pa', text: 'York, PA', csvValue: 'Pennsylvania - York Shop' },
    { value: 'york-sc', text: 'York, SC', csvValue: 'South Carolina - York Shop' },
];

/**
 * Default values for dropdowns - Currently unused, selects start empty
 */
const DEFAULT_VALUES = {
    role: 'fitter',
    location: 'chandler-az'
};

/**
 * Lookup tables for bidirectional filtering
 */
let roleToLocations = {};
let locationToRoles = {};

/**
 * Build lookup tables from CSV data for bidirectional filtering
 * @param {Array} csvData - Array of survey response objects
 */
function buildLookupTables(csvData) {
    roleToLocations = {};
    locationToRoles = {};

    if (!csvData || csvData.length === 0) {
        return;
    }

    // Build the lookup tables
    csvData.forEach(row => {
        const role = row.Role; // Role is stored in 'Job_Role' column
        const location = row.Location;

        if (!role || !location) return;

        // Build role -> locations mapping
        if (!roleToLocations[role]) {
            roleToLocations[role] = new Set();
        }
        roleToLocations[role].add(location);

        // Build location -> roles mapping
        if (!locationToRoles[location]) {
            locationToRoles[location] = new Set();
        }
        locationToRoles[location].add(role);
    });

    // Convert Sets to Arrays for easier handling
    Object.keys(roleToLocations).forEach(role => {
        roleToLocations[role] = Array.from(roleToLocations[role]);
    });

    Object.keys(locationToRoles).forEach(location => {
        locationToRoles[location] = Array.from(locationToRoles[location]);
    });

}

/**
 * Get available locations for selected roles
 * @param {Array} selectedRoles - Array of selected role CSV values
 * @returns {Array} Array of available location CSV values
 */
function getAvailableLocationsForRoles(selectedRoles) {
    if (!selectedRoles || selectedRoles.length === 0) {
        // If no roles selected, show all locations
        return LOCATION_OPTIONS.map(option => option.csvValue);
    }

    // Get intersection of locations for all selected roles
    let availableLocations = null;

    selectedRoles.forEach(role => {
        const locationsForRole = roleToLocations[role] || [];

        if (availableLocations === null) {
            availableLocations = [...locationsForRole];
        } else {
            // Find intersection
            availableLocations = availableLocations.filter(location =>
                locationsForRole.includes(location)
            );
        }
    });

    return availableLocations || [];
}

/**
 * Get available roles for selected locations
 * @param {Array} selectedLocations - Array of selected location CSV values
 * @returns {Array} Array of available role CSV values
 */
function getAvailableRolesForLocations(selectedLocations) {
    if (!selectedLocations || selectedLocations.length === 0) {
        // If no locations selected, show all roles
        return ROLE_OPTIONS.map(option => option.csvValue);
    }

    // Get intersection of roles for all selected locations
    let availableRoles = null;

    selectedLocations.forEach(location => {
        const rolesForLocation = locationToRoles[location] || [];

        if (availableRoles === null) {
            availableRoles = [...rolesForLocation];
        } else {
            // Find intersection
            availableRoles = availableRoles.filter(role =>
                rolesForLocation.includes(role)
            );
        }
    });

    return availableRoles || [];
}

/**
 * Clear all options from a select element
 * @param {HTMLElement} selectElement - The select element to clear
 */
function clearSelectOptions(selectElement) {
    const existingOptions = selectElement.querySelectorAll('sl-option');
    existingOptions.forEach(option => option.remove());
}

/**
 * Populate role select with comparison options
 * @param {HTMLElement} selectElement - The role select element
 * @param {Array} selectedLocations - Array of selected location CSV values for filtering
 */
function populateRoleOptions(selectElement, selectedLocations = []) {
    // Get available roles based on selected locations
    const availableRoleCsvValues = getAvailableRolesForLocations(selectedLocations);

    // Filter ROLE_OPTIONS to only include available roles
    const filteredRoleOptions = ROLE_OPTIONS.filter(option =>
        availableRoleCsvValues.includes(option.csvValue)
    );

    // Create options HTML string
    const optionsHTML = filteredRoleOptions.map(option =>
        `<sl-option value="${option.value}" data-csv-value="${option.csvValue}">${option.text}</sl-option>`
    ).join('');

    // Set innerHTML and let Shoelace handle the initialization
    selectElement.innerHTML = optionsHTML;

    if (filteredRoleOptions.length === 0) {
        selectElement.innerHTML = '<sl-option value="" disabled>No roles available for selected locations</sl-option>';
    }
}

/**
 * Populate location select with comparison options
 * @param {HTMLElement} selectElement - The location select element
 * @param {Array} selectedRoles - Array of selected role CSV values for filtering
 */
function populateLocationOptions(selectElement, selectedRoles = []) {
    // Preserve any existing HTML default value before populating options
    const existingValue = selectElement.value || selectElement.getAttribute('value');

    // Get available locations based on selected roles
    const availableLocationCsvValues = getAvailableLocationsForRoles(selectedRoles);

    // Filter LOCATION_OPTIONS to only include available locations
    const filteredLocationOptions = LOCATION_OPTIONS.filter(option =>
        availableLocationCsvValues.includes(option.csvValue)
    );

    // Create options HTML string
    const optionsHTML = filteredLocationOptions.map(option =>
        `<sl-option value="${option.value}" data-csv-value="${option.csvValue}">${option.text}</sl-option>`
    ).join('');

    // Set innerHTML and let Shoelace handle the initialization
    selectElement.innerHTML = optionsHTML;

    if (filteredLocationOptions.length === 0) {
        selectElement.innerHTML = '<sl-option value="" disabled>No locations available for selected roles</sl-option>';
    } else {
        // Restore the HTML default value if it exists and is still available
        if (existingValue) {
            const isValueAvailable = filteredLocationOptions.some(option => option.value === existingValue);
            if (isValueAvailable) {
                // Use setTimeout to ensure Shoelace has processed the new options
                setTimeout(() => {
                    selectElement.value = [existingValue];
                }, 50);
            }
        }
    }
}

/**
 * Get filtered data based on current filter settings
 * @returns {Array} Filtered CSV data
 */
function getFilteredData() {
    if (!window.DataModule.csvData) return [];

    // Get current filter state
    const filters = window.FiltersModule?.getCurrentFilterState() || {
        roleMode: 'all',
        locationMode: 'all',
        selectedRoles: [],
        selectedLocations: []
    };

    let filteredData = [...window.DataModule.csvData];

    // Apply role filter
    if (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) {
        const roleCSVValues = filters.selectedRoles.map(roleValue => {
            const roleOption = ROLE_OPTIONS.find(option => option.value === roleValue);
            return roleOption ? roleOption.csvValue : null;
        }).filter(Boolean);

        filteredData = filteredData.filter(row => {
            return roleCSVValues.includes(row.Role);
        });
    }

    // Apply location filter
    if (filters.locationMode === 'compare' && filters.selectedLocations.length > 0) {
        const locationCSVValues = filters.selectedLocations.map(locationValue => {
            const locationOption = LOCATION_OPTIONS.find(option => option.value === locationValue);
            return locationOption ? locationOption.csvValue : null;
        }).filter(Boolean);

        filteredData = filteredData.filter(row => {
            return locationCSVValues.includes(row.Location);
        });
    }

    return filteredData;
}

// Export functions for use in other modules
window.DataModule = {
    ROLE_OPTIONS,
    LOCATION_OPTIONS,
    DEFAULT_VALUES,
    populateRoleOptions,
    populateLocationOptions,
    clearSelectOptions,
    buildLookupTables,
    getAvailableLocationsForRoles,
    getAvailableRolesForLocations,
    getFilteredData,
    csvData: null, // Will be set when CSV loads
    ROLE_OPTIONS,
    LOCATION_OPTIONS
}; 