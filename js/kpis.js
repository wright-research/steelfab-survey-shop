/**
 * KPIs Module - Key Performance Indicators
 * Calculates and displays survey metrics based on "_num" columns
 */

// Columns with "_num" suffix to include in average calculations (excluding 'Avg_num_response')
const NUM_COLUMNS = [
    'Q3_num', 'Q4_num', 'Q5_num', 'Q6_num', 'Q7_num', 'Q8_num','Q11_num'
];

/**
 * Get current comparison mode from drawer module
 * @returns {string} Current comparison mode ('baseline', 'roles', 'location')
 */
function getCurrentComparisonMode() {
    if (window.DrawerModule && window.DrawerModule.getCurrentComparisonMode) {
        return window.DrawerModule.getCurrentComparisonMode();
    }
    return 'baseline'; // Default fallback
}

/**
 * Get color class for filtered average score based on delta from total average
 * @param {number} filteredAverage - The filtered average score
 * @param {number} totalAverage - The total average score 
 * @returns {string} CSS class name for color
 */
function getAverageScoreColorClass(filteredAverage, totalAverage) {
    if (filteredAverage > totalAverage) {
        return 'score-green'; // Above 82.1
    } else if (filteredAverage < totalAverage) {
        return 'score-red'; // Below 82.1
    } else {
        return 'score-neutral'; // Exactly 82.1
    }
    console.log(filteredAverage, totalAverage);
}

/**
 * Calculate the average of all "_num" columns for a dataset
 * @param {Array} data - Array of survey response objects
 * @returns {number} Average value across all "_num" columns
 */
function calculateAverageResponse(data) {
    if (!data || data.length === 0) return 0;

    let totalSum = 0;
    let totalCount = 0;

    data.forEach(row => {
        NUM_COLUMNS.forEach(column => {
            const value = parseFloat(row[column]);
            if (!isNaN(value)) {
                totalSum += value;
                totalCount++;
            }
        });
    });

    return totalCount > 0 ? totalSum / totalCount : 0;
}

/**
 * Get selected roles or locations for comparison modes
 * @param {string} mode - 'roles' or 'location'
 * @returns {Array} Array of selected items with their data
 */
function getSelectedComparisonItems(mode) {
    if (!window.CSVLoaderModule || !window.CSVLoaderModule.isCSVDataLoaded()) {
        return [];
    }

    const allData = window.CSVLoaderModule.getCSVData();
    const totalAverage = calculateAverageResponse(allData);

    if (mode === 'roles') {
        const roleSelect = document.getElementById('roles-comparison-select');
        if (!roleSelect || !roleSelect.value || roleSelect.value.length === 0) {
            return [];
        }

        const selectedRoles = roleSelect.value.map(value => {
            const option = roleSelect.querySelector(`sl-option[value="${value}"]`);
            return option ? option.getAttribute('data-csv-value') || value : value;
        }).filter(Boolean);


        return selectedRoles.slice(0, 5).map(value => {
            const roleOption = window.DataModule.ROLE_OPTIONS.find(option => option.value === value);
            const csvValue = roleOption ? roleOption.csvValue : value;
            const filteredData = allData.filter(row => row.Role === csvValue);
            const average = calculateAverageResponse(filteredData);



            return {
                displayName: roleOption ? roleOption.text : value,
                csvValue: csvValue,
                count: filteredData.length,
                average: Math.round(average * 10) / 10,
                totalAverage: totalAverage
            };
        });
    }

    if (mode === 'location') {
        const locationSelect = document.getElementById('locations-comparison-select');
        if (!locationSelect || !locationSelect.value || locationSelect.value.length === 0) {
            return [];
        }

        const selectedLocations = locationSelect.value.map(value => {
            const option = locationSelect.querySelector(`sl-option[value="${value}"]`);
            return option ? option.getAttribute('data-csv-value') || value : value;
        }).filter(Boolean);


        return selectedLocations.slice(0, 5).map(value => {
            const locationOption = window.DataModule.LOCATION_OPTIONS.find(option => option.value === value);
            const csvValue = locationOption ? locationOption.csvValue : value;
            const filteredData = allData.filter(row => row['Location'] === csvValue);
            const average = calculateAverageResponse(filteredData);

            return {
                displayName: locationOption ? locationOption.text : value,
                csvValue: csvValue,
                count: filteredData.length,
                average: Math.round(average * 10) / 10,
                totalAverage: totalAverage
            };
        });
    }

    return [];
}

/**
 * Get color class for comparison mode based on ranking
 * @param {number} value - The current value
 * @param {number} minValue - The minimum value in the set
 * @param {number} maxValue - The maximum value in the set
 * @param {number} itemCount - Total number of items
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
 * Create KPI HTML for roles or location comparison mode
 * @param {string} mode - 'roles' or 'location'
 * @param {Array} items - Array of selected items with their data
 * @returns {string} HTML string for comparison mode KPI display
 */
function createComparisonModeKPIHTML(mode, items) {
    if (!items || items.length === 0) {
        return '<div class="kpi-container kpi-comparison-empty">Select ' +
            (mode === 'roles' ? 'roles' : 'locations') +
            ' to see comparison data</div>';
    }

    const modeLabel = mode === 'roles' ? 'Role' : 'Location';

    // Calculate min and max values for color coding
    const averages = items.map(item => item.average);
    const minAverage = Math.min(...averages);
    const maxAverage = Math.max(...averages);

    const cardsHTML = items.map(item => `
        <div class="kpi-card kpi-comparison-card">
            <div class="kpi-comparison-header">${item.displayName}</div>
            <div class="kpi-value">${item.count}</div>
            <div class="kpi-label">Responses</div>
            <div class="kpi-value ${getComparisonModeColorClass(item.average, minAverage, maxAverage, items.length)}">${item.average}</div>
            <div class="kpi-label">Average Score</div>
        </div>
    `).join('');

    return `
        <div class="kpi-container kpi-comparison-mode">
            <div class="kpi-comparison-title">${modeLabel} Comparison</div>
            <div class="kpi-comparison-cards">
                ${cardsHTML}
            </div>
        </div>
    `;
}

/**
 * Get current KPI data based on filter state
 * @returns {Object} KPI data object
 */
function getCurrentKPIData() {
    // Check if CSV data is available
    if (!window.CSVLoaderModule || !window.CSVLoaderModule.isCSVDataLoaded()) {
        return {
            totalResponses: 0,
            averageResponse: 0,
            filteredResponses: 0,
            filteredPercent: 0,
            averageFilteredResponse: 0,
            hasFilters: false
        };
    }

    const allData = window.CSVLoaderModule.getCSVData();
    const totalResponses = allData.length;
    const averageResponse = calculateAverageResponse(allData);

    // Check if any filters are applied
    const filters = window.UtilsModule.getCurrentFiltersForCsv();
    const hasFilters = (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) ||
        (filters.locationMode === 'compare' && filters.selectedLocations.length > 0);

    let filteredData = allData;
    let filteredResponses = totalResponses;
    let filteredPercent = 100;
    let averageFilteredResponse = averageResponse;

    if (hasFilters) {
        // Apply filters to get filtered dataset
        filteredData = window.CSVLoaderModule.getFilteredData(filters);
        filteredResponses = filteredData.length;
        filteredPercent = totalResponses > 0 ? (filteredResponses / totalResponses) * 100 : 0;
        averageFilteredResponse = calculateAverageResponse(filteredData);
    }

    return {
        totalResponses,
        averageResponse: Math.round(averageResponse * 10) / 10, // Round to 1 decimal place
        filteredResponses,
        filteredPercent, // Keep raw percentage for rounding in display
        averageFilteredResponse: Math.round(averageFilteredResponse * 10) / 10, // Round to 1 decimal place
        hasFilters
    };
}

/**
 * Create KPI HTML structure
 * @param {Object} kpiData - KPI data object
 * @returns {string} HTML string for KPI display
 */
function createKPIHTML(kpiData) {
    const { totalResponses, averageResponse, filteredResponses, filteredPercent, averageFilteredResponse, hasFilters } = kpiData;

    if (hasFilters) {
        // 4-column layout when filters are applied with grouped sections
        return `
            <div class="kpi-container kpi-4-column">
                <div class="kpi-group">
                    <div class="kpi-group-header">Total</div>
                    <div class="kpi-group-cards">
                        <div class="kpi-card">
                            <div class="kpi-value">${totalResponses}</div>
                            <div class="kpi-label">Responses</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value">${averageResponse}</div>
                            <div class="kpi-label">Average Overall Score</div>
                        </div>
                    </div>
                </div>
                <div class="kpi-group">
                    <div class="kpi-group-header">Filtered</div>
                    <div class="kpi-group-cards">
                        <div class="kpi-card">
                            <div class="kpi-value">${filteredResponses}</div>
                            <div class="kpi-label">Responses<br/>(${Math.round(filteredPercent)}% of total)</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value ${getAverageScoreColorClass(averageFilteredResponse, averageResponse)}">${averageFilteredResponse}</div>
                            <div class="kpi-label">Average Overall Score</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // 2-column layout when no filters are applied
        return `
            <div class="kpi-container kpi-2-column">
                <div class="kpi-card">
                    <div class="kpi-value">${totalResponses}</div>
                    <div class="kpi-label">Responses</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${averageResponse}</div>
                    <div class="kpi-label">Average Overall Score</div>
                </div>
            </div>
        `;
    }
}

/**
 * Update KPI display
 */
function updateKPIDisplay() {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;

    const comparisonMode = getCurrentComparisonMode();

    // Handle comparison modes differently
    if (comparisonMode === 'roles') {
        const selectedRoles = getSelectedComparisonItems('roles');
        kpiContainer.innerHTML = createComparisonModeKPIHTML('roles', selectedRoles);
    } else if (comparisonMode === 'location') {
        const selectedLocations = getSelectedComparisonItems('location');
        kpiContainer.innerHTML = createComparisonModeKPIHTML('location', selectedLocations);
    } else {
        // Default to baseline mode (original functionality)
        const kpiData = getCurrentKPIData();
        kpiContainer.innerHTML = createKPIHTML(kpiData);
    }

    // Also update filter status when KPIs are updated
    updateFilterStatus();
}

/**
 * Format a list of items with proper grammar
 * @param {Array} items - Array of items to format
 * @returns {string} Formatted string with proper grammar
 */
function formatListWithGrammar(items) {
    if (!items || items.length === 0) return '';

    if (items.length === 1) {
        return items[0];
    } else if (items.length === 2) {
        return items.join(' and ');
    } else {
        return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    }
}

/**
 * Generate filter status text
 * @returns {string} Filter status text or empty string if no filters
 */
function generateFilterStatusText() {
    const filters = window.UtilsModule.getCurrentFiltersForCsv();

    if (!filters ||
        (!filters.selectedRoles || filters.selectedRoles.length === 0) &&
        (!filters.selectedLocations || filters.selectedLocations.length === 0)) {
        return '';
    }

    const roleDisplayNames = [];
    const locationDisplayNames = [];

    // Convert selected roles to display names
    if (filters.selectedRoles && filters.selectedRoles.length > 0) {
        filters.selectedRoles.forEach(csvValue => {
            const roleOption = window.DataModule.ROLE_OPTIONS.find(option => option.csvValue === csvValue);
            if (roleOption) {
                roleDisplayNames.push(roleOption.text);
            }
        });
    }

    // Convert selected locations to display names
    if (filters.selectedLocations && filters.selectedLocations.length > 0) {
        filters.selectedLocations.forEach(csvValue => {
            const locationOption = window.DataModule.LOCATION_OPTIONS.find(option => option.csvValue === csvValue);
            if (locationOption) {
                locationDisplayNames.push(locationOption.text);
            }
        });
    }

    // Build the filter status text based on what filters are applied
    let statusText = 'Filtered to show ';

    if (roleDisplayNames.length > 0 && locationDisplayNames.length > 0) {
        // Both roles and locations are filtered
        const locationWord = locationDisplayNames.length === 1 ? 'location' : 'locations';
        statusText += `${formatListWithGrammar(roleDisplayNames)}s in ${formatListWithGrammar(locationDisplayNames)} ${locationWord} only.`;
    } else if (roleDisplayNames.length > 0) {
        // Only roles are filtered - always use "roles" (plural) since there are multiple people in each role
        statusText += `${formatListWithGrammar(roleDisplayNames)} roles only.`;
    } else if (locationDisplayNames.length > 0) {
        // Only locations are filtered - use singular/plural based on count
        const locationWord = locationDisplayNames.length === 1 ? 'location' : 'locations';
        statusText += `${formatListWithGrammar(locationDisplayNames)} ${locationWord} only.`;
    }

    return statusText;
}

/**
 * Update filter status display
 */
function updateFilterStatus() {
    const filterStatusContainer = document.getElementById('filter-status');
    const filterStatusText = document.getElementById('filter-status-text');

    if (!filterStatusContainer || !filterStatusText) return;

    const statusText = generateFilterStatusText();

    if (statusText) {
        filterStatusText.textContent = statusText;
        filterStatusContainer.classList.remove('hidden');
    } else {
        filterStatusContainer.classList.add('hidden');
    }
}

/**
 * Initialize KPI display in the DOM
 */
function initializeKPIDisplay() {
    // Find or create the KPI container
    let kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) {
        kpiContainer = document.createElement('div');
        kpiContainer.id = 'kpi-container';
        kpiContainer.className = 'kpi-container';

        // Insert after the h1 title
        const title = document.querySelector('h1');
        if (title) {
            title.parentNode.insertBefore(kpiContainer, title.nextSibling);
        } else {
            document.body.appendChild(kpiContainer);
        }
    }

    // Initial display
    updateKPIDisplay();
    updateFilterStatus();
}

// Export functions for use in other modules
window.KPIModule = {
    calculateAverageResponse,
    getCurrentKPIData,
    updateKPIDisplay,
    initializeKPIDisplay,
    updateFilterStatus,
    getSelectedComparisonItems,
    getComparisonModeColorClass
}; 