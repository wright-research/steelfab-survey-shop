/**
 * Grouped Averages Module
 * Handles the calculation and display of survey component averages
 */

// Question group mappings
const QUESTION_GROUPS = {
    'Trust': ['Q3_num'],
    'Health': ['Q4_num'],
    'Relationships': ['Q5_num'],
    'Impact': ['Q6_num'],
    'Value': ['Q7_num'],
    'Engagement': ['Q8_num'],
    'Overall Satisfaction': ['Q11_num']
};

// Global variables
let baselineAverages = {};
let isTableInitialized = false;

/**
 * Calculate grouped averages for a given dataset
 * @param {Array} data - Array of survey response objects
 * @returns {Object} Object with group names as keys and averages as values
 */
function calculateGroupedAverages(data) {
    const groupedAverages = {};

    Object.keys(QUESTION_GROUPS).forEach(groupName => {
        const columns = QUESTION_GROUPS[groupName];
        let sum = 0;
        let count = 0;

        data.forEach((row, index) => {
            columns.forEach(col => {
                const value = parseFloat(row[col]);
                if (!isNaN(value)) {
                    sum += value;
                    count++;
                }
            });
        });

        const average = count > 0 ? sum / count : 0;
        groupedAverages[groupName] = average;
    });

    return groupedAverages;
}

/**
 * Get color class for comparison mode based on ranking within each column
 * @param {number} value - The current value
 * @param {number} minValue - The minimum value in this column
 * @param {number} maxValue - The maximum value in this column
 * @param {number} itemCount - Total number of items being compared
 * @returns {string} CSS class name for color
 */
function getComparisonModeColorClass(value, minValue, maxValue, itemCount) {
    // Only apply colors if there are multiple items
    if (itemCount <= 1) {
        return 'score-neutral';
    }

    if (value === maxValue) {
        return 'score-green'; // Highest value
    } else if (value === minValue) {
        return 'score-red'; // Lowest value
    } else {
        return 'score-neutral'; // Middle values
    }
}

/**
 * Create a table row for the grouped averages
 * @param {string} datasetName - Name of the dataset (e.g., "All Responses", "Filtered")
 * @param {Object} averages - Object with group averages
 * @param {boolean} isFiltered - Whether this is filtered data
 * @param {Object} coloringData - Optional data for comparative coloring {mode, allAverages, itemCount}
 * @returns {HTMLTableRowElement} The created row element
 */
function createTableRow(datasetName, averages, isFiltered = false, coloringData = null) {
    const row = document.createElement('tr');
    row.className = isFiltered ? 'filtered-row' : 'baseline-row';

    // Dataset name cell
    const datasetCell = document.createElement('td');
    datasetCell.className = 'dataset-name';
    datasetCell.textContent = datasetName;
    row.appendChild(datasetCell);

    // Average cells for each group
    Object.keys(QUESTION_GROUPS).forEach(groupName => {
        const cell = document.createElement('td');
        cell.className = 'group-average';

        // Add medium-gray background to Overall Satisfaction column
        if (groupName === 'Overall Satisfaction') {
            cell.classList.add('overall-satisfaction-column');
        }

        const average = averages[groupName];
        cell.textContent = average.toFixed(1);

        // Apply conditional formatting based on mode
        if (isFiltered) {
            if (coloringData && coloringData.mode === 'comparison') {
                // Comparison mode: compare against other selections in this column
                const columnValues = coloringData.allAverages.map(item => item[groupName]);
                const minValue = Math.min(...columnValues);
                const maxValue = Math.max(...columnValues);
                const colorClass = getComparisonModeColorClass(average, minValue, maxValue, coloringData.itemCount);
                cell.classList.add(colorClass);
            } else {
                // Baseline mode: compare against baseline
                if (baselineAverages[groupName] !== undefined) {
                    const baselineAvg = baselineAverages[groupName];
                    if (average > baselineAvg) {
                        cell.classList.add('score-green');
                    } else if (average < baselineAvg) {
                        cell.classList.add('score-red');
                    } else {
                        cell.classList.add('score-neutral');
                    }
                }
            }
        }

        row.appendChild(cell);
    });

    return row;
}

/**
 * Update the grouped averages table
 * @param {Object} filters - Current filter state
 */
function updateGroupedAveragesTable(filters = null) {
    const tbody = document.getElementById('grouped-averages-tbody');
    if (!tbody) {
        console.error('Could not find grouped-averages-tbody element');
        return;
    }

    // Check if CSV data is available using the same pattern as KPI module
    if (!window.CSVLoaderModule || !window.CSVLoaderModule.isCSVDataLoaded()) {
        console.error('CSV data not loaded yet, skipping table update');
        return;
    }

    // Get data using the same pattern as other modules
    const allData = window.CSVLoaderModule.getCSVData();
    if (!allData || allData.length === 0) {
        console.error('No CSV data available for grouped averages table');
        return;
    }

    // Calculate baseline averages (always needed)
    const currentBaseline = calculateGroupedAverages(allData);

    // Store baseline for comparison
    if (!isTableInitialized) {
        baselineAverages = { ...currentBaseline };
        isTableInitialized = true;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    // Get current comparison mode
    const comparisonMode = (window.DrawerModule && window.DrawerModule.getCurrentComparisonMode)
        ? window.DrawerModule.getCurrentComparisonMode()
        : 'baseline';

    // Update subtitle visibility and text based on comparison mode
    const subtitle = document.getElementById('grouped-averages-subtitle');
    if (subtitle) {
        if (comparisonMode === 'baseline') {
            subtitle.textContent = 'Conditional formatting of filtered results relative to company baseline.';
            subtitle.classList.remove('hidden');
        } else {
            subtitle.textContent = 'Green indicates highest value, red indicates lowest value per column.';
            subtitle.classList.remove('hidden');
        }
    }

    // Handle different comparison modes
    if (comparisonMode === 'roles') {
        // Roles comparison mode - show individual role rows
        const selectedRoles = window.KPIModule.getSelectedComparisonItems('roles');
        if (selectedRoles && selectedRoles.length > 0) {
            const limitedRoles = selectedRoles.slice(0, 5);

            // Calculate averages for all roles first (for comparative coloring)
            const allRoleAverages = limitedRoles.map(roleData => {
                const roleFilteredData = allData.filter(row => row.Role === roleData.csvValue);
                return calculateGroupedAverages(roleFilteredData);
            });

            // Create rows with comparative coloring
            limitedRoles.forEach((roleData, index) => {
                const roleFilteredData = allData.filter(row => row.Role === roleData.csvValue);
                if (roleFilteredData.length > 0) {
                    const roleAverages = allRoleAverages[index];
                    const coloringData = {
                        mode: 'comparison',
                        allAverages: allRoleAverages,
                        itemCount: limitedRoles.length
                    };
                    const roleRow = createTableRow(roleData.displayName, roleAverages, true, coloringData);
                    tbody.appendChild(roleRow);
                }
            });
        } else {
            // No roles selected, show empty state
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = Object.keys(QUESTION_GROUPS).length + 1;
            emptyCell.textContent = 'Select roles to see comparison data';
            emptyCell.className = 'empty-state';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }
    } else if (comparisonMode === 'location') {
        // Location comparison mode - show individual location rows
        const selectedLocations = window.KPIModule.getSelectedComparisonItems('location');
        if (selectedLocations && selectedLocations.length > 0) {
            const limitedLocations = selectedLocations.slice(0, 5);

            // Calculate averages for all locations first (for comparative coloring)
            const allLocationAverages = limitedLocations.map(locationData => {
                const locationFilteredData = allData.filter(row => row.Location === locationData.csvValue);
                return calculateGroupedAverages(locationFilteredData);
            });

            // Create rows with comparative coloring
            limitedLocations.forEach((locationData, index) => {
                const locationFilteredData = allData.filter(row => row.Location === locationData.csvValue);
                if (locationFilteredData.length > 0) {
                    const locationAverages = allLocationAverages[index];
                    const coloringData = {
                        mode: 'comparison',
                        allAverages: allLocationAverages,
                        itemCount: limitedLocations.length
                    };
                    const locationRow = createTableRow(locationData.displayName, locationAverages, true, coloringData);
                    tbody.appendChild(locationRow);
                }
            });
        } else {
            // No locations selected, show empty state
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = Object.keys(QUESTION_GROUPS).length + 1;
            emptyCell.textContent = 'Select locations to see comparison data';
            emptyCell.className = 'empty-state';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }
    } else {
        // Baseline mode - keep original behavior
        // Add baseline row
        const baselineRow = createTableRow('All Responses', baselineAverages, false);
        tbody.appendChild(baselineRow);

        // Check if filters are active (using same pattern as KPI module)
        const hasFilters = filters && (
            (filters.roleMode === 'compare' && filters.selectedRoles && filters.selectedRoles.length > 0) ||
            (filters.locationMode === 'compare' && filters.selectedLocations && filters.selectedLocations.length > 0)
        );

        if (hasFilters) {
            // Get filtered data using CSVLoaderModule
            const filteredData = window.CSVLoaderModule.getFilteredData(filters);

            if (filteredData.length > 0) {
                const filteredAverages = calculateGroupedAverages(filteredData);
                const filteredRow = createTableRow('Filtered Results', filteredAverages, true);
                tbody.appendChild(filteredRow);
            }
        }
    }
}

/**
 * Initialize the grouped averages table
 */
function initializeGroupedAveragesTable() {
    // Initial load with no filters
    updateGroupedAveragesTable();
}

// Export functions to global scope
window.updateGroupedAveragesTable = updateGroupedAveragesTable;
window.initializeGroupedAveragesTable = initializeGroupedAveragesTable;
window.calculateGroupedAverages = calculateGroupedAverages; 