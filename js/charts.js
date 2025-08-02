// Charts Module - handles the 4 category bar charts
class Charts {
    constructor() {
        this.chartInstances = {};
        this.chartQuestions = {
            'Q9_cat': 'What do you enjoy most about working at SteelFab?',
            'Q10_cat': 'What do you enjoy least about working at SteelFab?',
            'Q12_cat': 'What one or two things would you change about your work experience at SteelFab?',
        };
        this.seriesColors = [
            '#4A90E2', '#50C878', '#FF6B6B', '#FFB84D', '#9B59B6'
        ];
    }

    // Count occurrences of each category in a column
    countCategories(data, column) {
        const counts = {};
        let totalProcessed = 0;
        let emptyCount = 0;

        data.forEach(row => {
            const value = row[column];
            if (value && value.trim() !== '') {
                const category = value.trim();
                counts[category] = (counts[category] || 0) + 1;
                totalProcessed++;
            } else {
                emptyCount++;
            }
        });

        return counts;
    }

    // Get top 5 categories with counts
    getTop5Categories(counts) {
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }

    // Get all categories with counts (for Q15 chart)
    getAllCategories(counts) {
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);
    }

    // Get all categories except specified exclusions (for Q16 chart)
    getAllCategoriesExcluding(counts, exclusions = []) {
        return Object.entries(counts)
            .filter(([category, count]) => !exclusions.includes(category))
            .sort((a, b) => b[1] - a[1]);
    }

    // Break long category names into multiple lines for better readability
    breakCategoryName(categoryName) {
        if (!categoryName || categoryName.length <= 15) {
            return [categoryName];
        }

        // Trim whitespace and handle specific cases first
        const trimmedName = categoryName.trim();

        if (trimmedName === 'Physical Environment') {
            return ['Physical', 'Environment'];
        }
        if (trimmedName === 'Heavy Workload') {
            return ['Heavy', 'Workload'];
        }
        if (trimmedName === 'General Comments') {
            return ['General', 'Comments'];
        }
        if (trimmedName === 'Leadership Comments') {
            return ['Leadership', 'Comments'];
        }
        if (trimmedName === 'Communication Issues') {
            return ['Communication', 'Issues'];
        }
        if (trimmedName === 'Interpersonal Issues') {
            return ['Interpersonal', 'Issues'];
        }
        if (trimmedName === 'Work-Life Balance') {
            return ['Work-Life', 'Balance'];
        }
        if (trimmedName === 'No Response') {
            return ['No', 'Response'];
        }


        // Common break patterns for better readability
        const breakPatterns = [
            ' & ',
            ' and ',
            ' - ',
            ' / ',
            ' or ',
            ' with ',
            ' at ',
            ' of ',
            ' in '
        ];

        // Try to find a natural break point
        for (const pattern of breakPatterns) {
            if (categoryName.includes(pattern)) {
                const parts = categoryName.split(pattern);
                if (parts.length === 2) {
                    // Preserve spacing properly
                    if (pattern.includes('&')) {
                        return [parts[0] + ' &', parts[1]];
                    } else if (pattern.includes('and')) {
                        return [parts[0] + ' and', parts[1]];
                    } else if (pattern.includes('-')) {
                        return [parts[0] + ' -', parts[1]];
                    } else if (pattern.includes('/')) {
                        return [parts[0] + ' /', parts[1]];
                    } else {
                        return [parts[0] + pattern, parts[1]];
                    }
                }
            }
        }

        // If no natural break point, split at around 15-20 characters
        if (categoryName.length > 20) {
            const words = categoryName.split(' ');
            let firstLine = '';
            let secondLine = '';

            for (let i = 0; i < words.length; i++) {
                if (firstLine.length + words[i].length + 1 <= 18) {
                    firstLine += (firstLine ? ' ' : '') + words[i];
                } else {
                    secondLine = words.slice(i).join(' ');
                    break;
                }
            }

            return secondLine ? [firstLine, secondLine] : [categoryName];
        }

        return [categoryName];
    }

    // Create a bar chart with datasets
    createChart(canvasId, datasets, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found`);
            return;
        }

        const ctx = canvas.getContext('2d');

        // Get device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // Get display size
        const rect = canvas.getBoundingClientRect();

        // Set actual size in memory (scaled up for retina)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale back down using CSS
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Scale the drawing context so everything is drawn at the correct size
        ctx.scale(dpr, dpr);

        // Destroy existing chart if it exists
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        // If no datasets provided, show empty chart
        if (!datasets || datasets.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            


            // Center the text properly (using CSS dimensions, not scaled canvas dimensions)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2; 
            ctx.fillText('Select items to see comparison data', centerX, centerY);           
            
            return;
        }

        // Get all unique categories from all datasets
        const allCategories = new Set();
        datasets.forEach(dataset => {
            if (dataset.rawData) {
                dataset.rawData.forEach(item => allCategories.add(item[0]));
            }
        });

        // Convert to sorted array based on first dataset order
        const firstDatasetOrder = datasets[0].rawData ? datasets[0].rawData.map(item => item[0]) : [];
        const labels = Array.from(allCategories)
            .sort((a, b) => {
                const aIndex = firstDatasetOrder.indexOf(a);
                const bIndex = firstDatasetOrder.indexOf(b);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            })
            .map(category => this.breakCategoryName(category));

        // Process each dataset
        const processedDatasets = datasets.map(dataset => {
            const dataMap = new Map(dataset.rawData);
            const rawValues = Array.from(allCategories).map(category => dataMap.get(category) || 0);
            const totalResponses = rawValues.reduce((sum, value) => sum + value, 0);
            const percentages = rawValues.map(value =>
                totalResponses > 0 ? (value / totalResponses) * 100 : 0
            );

            return {
                label: dataset.label,
                data: percentages,
                backgroundColor: dataset.backgroundColor,
                borderColor: '#1c1c1c',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                rawValues: rawValues,
                totalResponses: totalResponses
            };
        });

        this.chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: processedDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: processedDatasets.length > 1,
                        position: 'top',
                        labels: {
                            color: '#1c1c1c',
                            font: {
                                size: 12,
                                weight: 500
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'rect'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function () {
                                return ''; // Remove the title (x-axis label)
                            },
                            label: function (context) {
                                const percentage = context.parsed.y;
                                const rawValue = context.dataset.rawValues[context.dataIndex];
                                const totalResponses = context.dataset.totalResponses;
                                return `${context.dataset.label}: ${percentage.toFixed(1)}% (${rawValue}/${totalResponses} responses)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percent of Total',
                            color: '#1c1c1c',
                            font: {
                                size: 14,
                                weight: 500
                            }
                        },
                        ticks: {
                            color: '#1c1c1c',
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1c1c1c',
                            maxRotation: 0,
                            minRotation: 0,
                            padding: 10,
                            font: {
                                size: 12
                            },
                            autoSkip: false,
                            maxTicksLimit: false
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize all charts
    initializeCharts(data) {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded!');
            return;
        }

        // Check if data exists and has the expected structure
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('No data available for charts');
            return;
        }

        // Update chart titles with actual questions
        this.updateChartTitles();

        // Create charts for each category column
        Object.keys(this.chartQuestions).forEach((column, index) => {
            const counts = this.countCategories(data, column);
            const chartData = this.getAllCategories(counts);
            const canvasId = `chart-q${column.replace('Q', '').replace('_cat', '')}`;

            // Initialize with baseline data only (no filtered data on initial load)
            const datasets = [{
                label: 'All Responses',
                backgroundColor: '#ABDBF0',
                rawData: chartData
            }];

            this.createChart(canvasId, datasets, this.chartQuestions[column]);
        });
    }

    // Update chart titles in HTML
    updateChartTitles() {
        const titles = document.querySelectorAll('.chart-title');
        const questions = Object.values(this.chartQuestions);

        titles.forEach((title, index) => {
            if (questions[index]) {
                title.textContent = questions[index];
            }
        });
    }

    // Get current filter state and update all charts
    updateCharts() {
        // Get current comparison mode
        const comparisonMode = (window.DrawerModule && window.DrawerModule.getCurrentComparisonMode)
            ? window.DrawerModule.getCurrentComparisonMode()
            : 'baseline';

        // Get baseline data
        const baselineData = window.CSVLoaderModule?.getCSVData();
        if (!baselineData || baselineData.length === 0) {
            console.error('No baseline data available for chart updates');
            return;
        }

        // Update each chart based on comparison mode
        Object.keys(this.chartQuestions).forEach((column) => {
            const canvasId = `chart-q${column.replace('Q', '').replace('_cat', '')}`;

            if (comparisonMode === 'roles') {
                this.updateChartsForRoles(canvasId, column, baselineData);
            } else if (comparisonMode === 'location') {
                this.updateChartsForLocations(canvasId, column, baselineData);
            } else {
                this.updateChartsForBaseline(canvasId, column, baselineData);
            }
        });
    }

    // Update charts for baseline mode (preserve existing functionality)
    updateChartsForBaseline(canvasId, column, baselineData) {
        // Get the current filter state
        const filters = window.UtilsModule?.getCurrentFiltersForCsv();
        const hasFilters = filters && (
            (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) ||
            (filters.locationMode === 'compare' && filters.selectedLocations.length > 0)
        );

        // Calculate baseline category counts
        const baselineCounts = this.countCategories(baselineData, column);
        const baselineChartData = this.getAllCategories(baselineCounts);

        // Prepare baseline dataset
        const datasets = [{
            label: 'All Responses',
            backgroundColor: '#ABDBF0',
            rawData: baselineChartData
        }];

        // Add filtered dataset if filters are applied
        if (hasFilters) {
            const filteredData = window.CSVLoaderModule?.getFilteredData(filters);
            if (filteredData && filteredData.length > 0) {
                const filteredCounts = this.countCategories(filteredData, column);
                const filteredChartData = this.getAllCategories(filteredCounts);

                datasets.push({
                    label: 'Filtered Results',
                    backgroundColor: '#4A90E2',
                    rawData: filteredChartData
                });
            }
        }

        this.createChart(canvasId, datasets, this.chartQuestions[column]);
    }

    // Update charts for roles comparison mode
    updateChartsForRoles(canvasId, column, baselineData) {
        const selectedRoles = window.KPIModule?.getSelectedComparisonItems('roles');
        if (!selectedRoles || selectedRoles.length === 0) {
            // Show empty chart
            this.createChart(canvasId, [], this.chartQuestions[column]);
            return;
        }

        // Create dataset for each role (limit to 5)
        const datasets = selectedRoles.slice(0, 5).map((roleData, index) => {
            const roleFilteredData = baselineData.filter(row => row.Role === roleData.csvValue);
            const roleCounts = this.countCategories(roleFilteredData, column);
            const roleChartData = this.getAllCategories(roleCounts);

            return {
                label: roleData.displayName,
                backgroundColor: this.seriesColors[index % this.seriesColors.length],
                rawData: roleChartData
            };
        });

        this.createChart(canvasId, datasets, this.chartQuestions[column]);
    }

    // Update charts for locations comparison mode
    updateChartsForLocations(canvasId, column, baselineData) {
        const selectedLocations = window.KPIModule?.getSelectedComparisonItems('location');
        if (!selectedLocations || selectedLocations.length === 0) {
            // Show empty chart
            this.createChart(canvasId, [], this.chartQuestions[column]);
            return;
        }

        // Create dataset for each location (limit to 5)
        const datasets = selectedLocations.slice(0, 5).map((locationData, index) => {
            const locationFilteredData = baselineData.filter(row => row.Location === locationData.csvValue);
            const locationCounts = this.countCategories(locationFilteredData, column);
            const locationChartData = this.getAllCategories(locationCounts);

            return {
                label: locationData.displayName,
                backgroundColor: this.seriesColors[index % this.seriesColors.length],
                rawData: locationChartData
            };
        });

        this.createChart(canvasId, datasets, this.chartQuestions[column]);
    }
}

// Initialize charts when data is loaded
let charts = new Charts();

// Export for use in other modules
window.Charts = Charts;
window.charts = charts; 