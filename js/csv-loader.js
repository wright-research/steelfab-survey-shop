/**
 * CSV Loader Module - Minimal CSV Data Loading
 * Loads CSV data for KPI calculations without displaying it
 */

let csvData = null;
let isDataLoaded = false;

/**
 * Load CSV data from file
 * @returns {Promise<Array>} Promise that resolves to array of data objects
 */
async function loadCSVData() {
    try {
        const response = await fetch('Data/SteelFab_Shop_Clean.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        csvData = parseCSV(csvText);
        isDataLoaded = true;

        // Store CSV data in DataModule for global access
        if (window.DataModule) {
            window.DataModule.csvData = csvData;

            // Build lookup tables for bidirectional filtering
            if (window.DataModule.buildLookupTables) {
                window.DataModule.buildLookupTables(csvData);
            }
        }

        return csvData;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        throw error;
    }
}

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of objects with column headers as keys
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }

    return data;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Get the loaded CSV data
 * @returns {Array|null} The loaded CSV data or null if not loaded
 */
function getCSVData() {
    return csvData;
}

/**
 * Check if data is loaded
 * @returns {boolean} True if data is loaded, false otherwise
 */
function isCSVDataLoaded() {
    return isDataLoaded;
}

/**
 * Filter data based on current filter settings
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered data
 */
function getFilteredData(filters) {
    if (!csvData) return [];

    let filteredData = [...csvData];

    // Apply role filter
    if (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) {
        filteredData = filteredData.filter(row => {
            return filters.selectedRoles.includes(row.Role);
        });
    }

    // Apply location filter
    if (filters.locationMode === 'compare' && filters.selectedLocations.length > 0) {
        filteredData = filteredData.filter(row => {
            return filters.selectedLocations.includes(row.Location);
        });
    }

    return filteredData;
}

/**
 * Initialize CSV data loading
 */
async function initializeCSVLoader() {
    try {
        await loadCSVData();
    } catch (error) {
        console.error('Error initializing CSV loader:', error);
        throw error;
    }
}

// Export functions for use in other modules
window.CSVLoaderModule = {
    loadCSVData,
    getCSVData,
    isCSVDataLoaded,
    getFilteredData,
    initializeCSVLoader
}; 