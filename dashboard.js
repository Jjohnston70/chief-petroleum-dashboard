/**
 * Chief Petroleum Dashboard Main Controller
 * Orchestrates all dashboard functionality
 */

class ChiefDashboard {
  constructor() {
    this.chartManager = null;
    this.themeManager = null;
    this.currentData = null;
    this.currentPeriod = 'monthly';
    this.isLoading = false;
    this.uploadedDatasets = {}; // Store multiple uploaded datasets
    this.currentDataset = null; // Track current active dataset
    this.uploadedRecapDatasets = {}; // Store multiple uploaded recap datasets
    this.currentRecapData = null; // Track current active recap dataset
    this.currentRecapDataset = null; // Track current active recap dataset name

    // Enhanced upload system
    this.selectedFiles = []; // Store selected files for processing
    this.columnMappings = {}; // Store column mappings
    this.mappingTemplates = {}; // Store saved mapping templates
    this.pendingUpload = null; // Store pending upload data

    this.init();
  }

  /**
   * Initialize the dashboard
   */
  async init() {
    try {
      console.log('🚀 Initializing Chief Petroleum Dashboard...');

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Initialize services
      this.chartManager = new ChiefChartManager();

      // Store reference for theme manager to access
      window.chartManager = this.chartManager;

      // Set up event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadDashboardData();

      console.log('✅ Dashboard initialized successfully');

    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showError('Failed to initialize dashboard: ' + error.message);
    }
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
      this.showNotification('An unexpected error occurred. Please try refreshing the page.', 'error');
      event.preventDefault(); // Prevent the default browser error handling
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('❌ JavaScript error:', event.error);
      this.showNotification('A technical error occurred. Please try refreshing the page.', 'error');
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }

    // Data source dropdown removed - CSV upload only mode

    // Time period selector
    const timePeriodSelect = document.getElementById('time-period');
    if (timePeriodSelect) {
      timePeriodSelect.addEventListener('change', (e) => {
        this.currentPeriod = e.target.value;
        this.updateCharts();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }

    // Note: Data source toggle removed - using Railway database only

    // Modal close button
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.hideError();
      });
    }

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideError();
        this.refreshData();
      });
    }

    // Theme change listener
    document.addEventListener('themeChange', (e) => {
      this.onThemeChange(e.detail);
    });

    // Window resize listener
    window.addEventListener('resize', () => {
      if (this.chartManager) {
        this.chartManager.resizeAllCharts();
      }
    });

    // Auto-refresh every 5 minutes
    setInterval(() => {
      if (!this.isLoading) {
        this.refreshData(true); // Silent refresh
      }
    }, 5 * 60 * 1000);

    // Daily recap event listeners
    document.getElementById('load-daily-recap').addEventListener('click', () => {
      this.loadDailyRecap();
    });

    // Enhanced CSV upload event listeners
    this.setupDragAndDropListeners();
    this.setupColumnMappingListeners();

    document.getElementById('upload-csv').addEventListener('click', () => {
      this.handleEnhancedCSVUpload();
    });

    // Recap CSV upload event listeners
    document.getElementById('upload-recap-csv').addEventListener('click', () => {
      this.handleRecapCSVUpload();
    });

    // Dataset switcher event listener
    document.getElementById('active-dataset').addEventListener('change', (e) => {
      this.switchDataset(e.target.value);
    });

    // Recap dataset switcher event listener
    document.getElementById('recap-dataset-selector').addEventListener('change', (e) => {
      this.switchRecapDataset(e.target.value);
    });

    // Product filter event listener
    document.getElementById('product-filter').addEventListener('change', (e) => {
      this.updateProductChart(e.target.value);
    });

    // Sales period dropdown event listener
    document.getElementById('sales-period').addEventListener('change', async (e) => {
      this.currentPeriod = e.target.value;
      await this.updateSalesTrendChart();
    });

    // Initialize datasets storage
    this.uploadedDatasets = {};
    this.currentPeriod = 'monthly'; // Default period

    // Date range filter event listeners
    const applyBtn = document.getElementById('apply-date-filter');
    const clearBtn = document.getElementById('clear-date-filter');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyDateFilter();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearDateFilter();
      });
    }

    // Navigation dropdown event listeners
    this.setupNavigationDropdown();

    // Test button removed - CSV upload only mode

    // Data explorer event listeners
    const viewHeadersBtn = document.getElementById('view-headers-btn');
    const viewSampleBtn = document.getElementById('view-sample-data-btn');

    if (viewHeadersBtn) {
      viewHeadersBtn.addEventListener('click', () => {
        this.showDataHeaders();
      });
    }

    if (viewSampleBtn) {
      viewSampleBtn.addEventListener('click', () => {
        this.showSampleData();
      });
    }

    // AI Query event listener
    const executeQueryBtn = document.getElementById('execute-query-btn');
    if (executeQueryBtn) {
      executeQueryBtn.addEventListener('click', () => {
        this.executeAIQuery();
      });
    }

    // Enter key support for AI query
    const queryInput = document.getElementById('natural-query-input');
    if (queryInput) {
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.executeAIQuery();
        }
      });
    }

    // Custom chart builder event listener
    const createChartBtn = document.getElementById('create-custom-chart-btn');
    if (createChartBtn) {
      createChartBtn.addEventListener('click', () => {
        this.createCustomChart();
      });
    }

    // Chart data selector
    const chartDataSelect = document.getElementById('chart-data-select');
    if (chartDataSelect) {
      chartDataSelect.addEventListener('change', () => this.onChartDataSourceChange());
    }

    // AI data selector
    const aiDataSelect = document.getElementById('ai-data-select');
    if (aiDataSelect) {
      aiDataSelect.addEventListener('change', () => this.onAIDataSourceChange());
    }

    // Explorer filter event listeners
    const applyFiltersBtn = document.getElementById('apply-explorer-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyExplorerFilters();
      });
    }

    // Add change listeners to multi-select dropdowns for visual feedback
    const multiSelectIds = ['driver-filter', 'customer-filter', 'product-filter-explorer', 'location-filter'];
    multiSelectIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.updateFilterSelectionCount(id));
      }
    });

    const clearFiltersBtn = document.getElementById('clear-explorer-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearExplorerFilters();
      });
    }

    // Location mapping event listener
    const generateMapBtn = document.getElementById('generate-map-btn');
    if (generateMapBtn) {
      generateMapBtn.addEventListener('click', () => {
        this.generateLocationMap();
      });
    }

    // GP period selector
    const gpPeriodSelector = document.getElementById('gp-period-selector');
    if (gpPeriodSelector) {
      gpPeriodSelector.addEventListener('change', () => {
        this.updateGPCharts();
      });
    }

    // Filter help panel
    const filterHelpBtn = document.getElementById('filter-help-btn');
    const filterHelpPanel = document.getElementById('filter-help-panel');
    const closeHelpBtn = document.getElementById('close-help-btn');

    if (filterHelpBtn && filterHelpPanel) {
      filterHelpBtn.addEventListener('click', () => {
        filterHelpPanel.style.display = filterHelpPanel.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (closeHelpBtn && filterHelpPanel) {
      closeHelpBtn.addEventListener('click', () => {
        filterHelpPanel.style.display = 'none';
      });
    }

    // Set default date to 2 business days ago (skipping weekends)
    const defaultRecapDate = this.getBusinessDaysAgo(2);
    document.getElementById('recap-date').value = defaultRecapDate;

    // Try to find a date with actual data if the default doesn't work
    this.setDefaultRecapDateWithData();
  }

  /**
   * Load dashboard data - CSV Upload Only Mode
   */
  async loadDashboardData() {
    try {
      console.log('🚀 Initializing Chief Petroleum Dashboard (CSV Upload Mode)...');

      // Check if we have any uploaded datasets
      if (Object.keys(this.uploadedDatasets).length > 0) {
        // Use the most recently uploaded dataset
        const datasetNames = Object.keys(this.uploadedDatasets);
        const latestDataset = datasetNames[datasetNames.length - 1];
        this.currentData = this.uploadedDatasets[latestDataset];
        this.currentDataset = latestDataset;

        console.log(`📊 Using uploaded dataset: ${latestDataset}`);
        this.showNotification(`Loaded dataset: ${latestDataset}`, 'success');

        // Update all dashboard components
        this.updateKPIs();
        this.updateCharts();
        this.updateDataTable();
        this.updateLastUpdated();
        this.updateDatasetSwitcher(latestDataset);
        this.updateRecapDataRange();
        this.setDefaultRecapDateWithData();
      } else {
        // No data uploaded yet - show empty state
        console.log('📋 No data uploaded yet - showing empty dashboard');
        this.showEmptyState();
      }

      console.log('✅ Dashboard initialized successfully');

    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showNotification('Failed to initialize dashboard: ' + error.message, 'error');
    }
  }

  /**
   * Show empty state when no data is uploaded
   */
  showEmptyState() {
    // Clear all dashboard components
    this.currentData = null;

    // Show empty KPIs
    this.updateKPIs();

    // Clear charts
    if (this.chartManager) {
      this.chartManager.clearAllCharts();
    }

    // Clear data table
    this.updateDataTable();

    // Show helpful message
    this.showNotification('Welcome! Please upload a CSV file to get started.', 'info');

    console.log('📋 Empty state displayed - ready for CSV upload');
  }



  /**
   * Refresh data - CSV Upload Mode
   */
  async refreshData(silent = false) {
    if (this.isLoading) return;

    try {
      if (!silent) {
        this.showLoading('Refreshing dashboard...');
      }

      // Refresh current dataset if available
      if (this.currentData && this.currentDataset) {
        // Update all dashboard components with current data
        this.updateKPIs();
        this.updateCharts();
        this.updateDataTable();
        this.updateLastUpdated();

        if (!silent) {
          this.showNotification('Dashboard refreshed successfully!');
        }
      } else {
        // No data available - show empty state
        this.showEmptyState();
        if (!silent) {
          this.showNotification('No data to refresh. Please upload a CSV file.', 'info');
        }
      }

    } catch (error) {
      console.error('❌ Refresh failed:', error);
      if (!silent) {
        this.showError('Failed to refresh dashboard: ' + error.message);
      }
    }
  }

  /**
   * Update KPI cards
   */
  updateKPIs() {
    if (!this.currentData) {
      console.warn('⚠️ No current data available for KPI update');
      return;
    }

    try {
      // Use filtered data if date filter is active
      const dataToUse = this.getFilteredData() || this.currentData;
      const summary = dataToUse?.summary;

      if (!summary) {
        console.warn('⚠️ No summary data available for KPI update');
        return;
      }

      // Update KPI values with null checks
      this.updateKPI('total-sales', summary.totalSales || 0, 'currency');
      this.updateKPI('total-gallons', summary.totalGallons || 0, 'number');
      this.updateKPI('profit-margin', summary.avgProfitMargin || 0, 'percent');
      this.updateKPI('active-customers', summary.activeCustomers || 0, 'number');

    } catch (error) {
      console.error('❌ Error updating KPIs:', error);
      this.showNotification('Error updating dashboard metrics', 'error');
    }

    // Update change indicators (you could calculate vs previous period)
    this.updateKPIChange('sales-change', 0); // Placeholder - implement trend calculation
    this.updateKPIChange('gallons-change', 0);
    this.updateKPIChange('margin-change', 0);
    this.updateKPIChange('customers-change', 0);
  }

  /**
   * Update individual KPI
   */
  updateKPI(elementId, value, format) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let formattedValue;

    switch (format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value || 0);
        break;
      case 'percent':
        formattedValue = (value || 0).toFixed(1) + '%';
        break;
      case 'number':
        formattedValue = new Intl.NumberFormat('en-US').format(value || 0);
        break;
      default:
        formattedValue = value || 0;
    }

    element.textContent = formattedValue;

    // Add animation effect
    element.style.transform = 'scale(1.05)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Update KPI change indicator
   */
  updateKPIChange(elementId, changePercent) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = changePercent >= 0;
    const formattedChange = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(1) + '%';

    element.textContent = formattedChange;
    element.className = 'kpi-change ' + (isPositive ? 'positive' : 'negative');
  }

  /**
   * Update all charts based on current sheet
   */
  async updateCharts() {
    if (!this.currentData || !this.chartManager) {
      console.warn('⚠️ Cannot update charts: missing data or chart manager');
      return;
    }

    try {
      console.log('📈 Updating charts...');

      // Determine data source and use appropriate service
      // Create charts using CSV data only
      if (this.currentData && this.currentData.records) {
        console.log('📊 Using CSV data for charts');
        await this.chartManager.createSalesTrendChart(this.currentData, this.currentPeriod);
        this.chartManager.createCustomerChart(this.currentData);
        this.chartManager.createProfitChart(this.currentData);
      } else {
        console.log('📊 No data available for charts');
      }

      // Update product chart with current filter
      const productFilter = document.getElementById('product-filter')?.value || 'all';
      this.updateProductChart(productFilter);

      // Force chart resize after creation
      setTimeout(() => {
        if (this.chartManager) {
          this.chartManager.resizeAllCharts();
        }
      }, 100);

      // Show CSV charts if data is available
      if (this.currentData && this.currentData.records) {
        await this.showCSVCharts();
      }

    } catch (error) {
      console.error('❌ Error updating charts:', error);
      this.showNotification(`Failed to update charts: ${error.message}`, 'error');
    }
  }

  /**
   * Show charts for CSV data
   */
  async showCSVCharts() {
    // Show cumulative performance
    this.showChartContainer('cumulative-container');
    this.chartManager.createCumulativeChart(this.currentData);

    // Show customer retention analysis
    this.showChartContainer('customer-retention-container');
    await this.createCustomerRetentionChart();

    // Show other relevant charts based on data content
    const datasetName = this.currentData.datasetName || '';

    if (datasetName.toLowerCase().includes('recap')) {
      await this.showSummaryCharts();
    } else if (datasetName.includes('2024') || datasetName.includes('2025')) {
      // Try to show yearly charts if we have both years
      await this.showYearlyCharts(datasetName);
    }
  }

  /**
   * Hide all advanced chart containers and destroy charts for performance
   */
  hideAllAdvancedCharts() {
    const advancedCharts = [
      'year-comparison-container',
      'growth-rate-container',
      'cumulative-container',
      'historical-trend-container',
      'seasonal-pattern-container',
      'customer-retention-container'
    ];

    advancedCharts.forEach(chartId => {
      const container = document.getElementById(chartId);
      if (container) {
        container.style.display = 'none';

        // Destroy the chart to free memory
        const canvasId = chartId.replace('-container', '');
        if (this.chartManager.charts[canvasId]) {
          this.chartManager.charts[canvasId].destroy();
          delete this.chartManager.charts[canvasId];
        }
      }
    });
  }

  /**
   * Show yearly comparison charts with enhanced error handling
   */
  async showYearlyCharts() {
    try {
      // For CSV-only mode, show cumulative chart for current data
      if (this.currentData && this.currentData.records) {
        console.log('📊 Creating yearly charts from CSV data');

        // Show cumulative chart for current data
        this.showChartContainer('cumulative-container');
        this.chartManager.createCumulativeChart(this.currentData);

        // Check if we have multiple years of data in the current dataset
        const years = new Set();
        this.currentData.records.forEach(record => {
          const date = new Date(record.Date || record.date);
          if (!isNaN(date.getTime())) {
            years.add(date.getFullYear());
          }
        });

        if (years.size > 1) {
          this.showNotification(`📊 Showing data for ${Array.from(years).sort().join(', ')}`, 'info');
        } else if (years.size === 1) {
          this.showNotification(`📊 Showing ${Array.from(years)[0]} data`, 'info');
        }
      } else {
        console.log('📊 No data available for yearly charts');
        this.showNotification('No data available for yearly analysis. Please upload a CSV file.', 'warning');
      }

    } catch (error) {
      console.error('❌ Error creating yearly charts:', error);
      this.showNotification(`Failed to load yearly charts: ${error.message}`, 'error');
    }
  }

  /**
   * Show summary/recap charts
   */
  async showSummaryCharts() {
    // Show historical trend analysis
    this.showChartContainer('historical-trend-container');
    await this.createHistoricalTrendChart();

    // Show seasonal patterns
    this.showChartContainer('seasonal-pattern-container');
    await this.createSeasonalPatternChart();
  }

  /**
   * Show transactional data charts
   */
  async showTransactionalCharts() {
    // Show customer retention analysis
    this.showChartContainer('customer-retention-container');
    await this.createCustomerRetentionChart();

    // Show cumulative performance
    this.showChartContainer('cumulative-container');
    this.chartManager.createCumulativeChart(this.currentData);
  }

  /**
   * Show a chart container with smooth transition
   */
  showChartContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'block';
      // Trigger reflow for smooth transition
      container.offsetHeight;
      container.style.opacity = '1';
    }
  }

  /**
   * Create historical trend analysis chart - CSV Only Mode
   */
  async createHistoricalTrendChart() {
    try {
      // For CSV-only mode, use all uploaded datasets
      const historicalData = [];

      if (Object.keys(this.uploadedDatasets).length > 0) {
        // Use all uploaded datasets for historical analysis
        Object.keys(this.uploadedDatasets).forEach(datasetName => {
          const dataset = this.uploadedDatasets[datasetName];
          if (dataset && dataset.records && dataset.records.length > 0) {
            historicalData.push({
              sheet: datasetName,
              data: dataset
            });
          }
        });
      } else if (this.currentData && this.currentData.records) {
        // Use current data if no multiple datasets
        historicalData.push({
          sheet: this.currentData.datasetName || 'Current Data',
          data: this.currentData
        });
      }

      // Create the historical trend chart
      if (historicalData.length > 0) {
        this.chartManager.createHistoricalTrendChart(historicalData);
        console.log(`📊 Created historical trend chart with ${historicalData.length} datasets`);
      } else {
        this.createPlaceholderChart('historical-trend-chart', 'Historical Trend Analysis', 'No data available. Please upload CSV files.');
        console.log('📊 No data available for historical trend chart');
      }

    } catch (error) {
      console.error('❌ Error creating historical trend chart:', error);
      this.createPlaceholderChart('historical-trend-chart', 'Historical Trend Analysis', 'Error loading data');
    }
  }

  /**
   * Create seasonal pattern analysis chart
   */
  async createSeasonalPatternChart() {
    try {
      // Use current data for seasonal analysis
      if (this.currentData) {
        this.chartManager.createSeasonalPatternChart(this.currentData);
      } else {
        this.createPlaceholderChart('seasonal-pattern-chart', 'Seasonal Pattern Analysis', 'No data available');
      }
    } catch (error) {
      console.error('❌ Error creating seasonal pattern chart:', error);
      this.createPlaceholderChart('seasonal-pattern-chart', 'Seasonal Pattern Analysis', 'Error loading data');
    }
  }

  /**
   * Create customer retention analysis chart
   */
  async createCustomerRetentionChart() {
    try {
      // Use current data for customer retention analysis
      if (this.currentData) {
        this.chartManager.createCustomerRetentionChart(this.currentData);
      } else {
        this.createPlaceholderChart('customer-retention-chart', 'Customer Retention Analysis', 'No data available');
      }
    } catch (error) {
      console.error('❌ Error creating customer retention chart:', error);
      this.createPlaceholderChart('customer-retention-chart', 'Customer Retention Analysis', 'Error loading data');
    }
  }

  /**
   * Create a placeholder chart for advanced analytics
   */
  createPlaceholderChart(canvasId, title, description) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (this.chartManager.charts[canvasId]) {
      this.chartManager.charts[canvasId].destroy();
    }

    // Create a simple placeholder chart
    const config = {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: title,
          data: [12, 19, 3, 5, 2, 3],
          borderColor: this.chartManager.colors.primary,
          backgroundColor: this.chartManager.hexToRgba(this.chartManager.colors.primary, 0.1),
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${title} (Coming Soon)`,
            color: this.chartManager.getThemeColors().text
          },
          subtitle: {
            display: true,
            text: description,
            color: this.chartManager.getThemeColors().text
          }
        }
      }
    };

    this.chartManager.charts[canvasId] = new Chart(ctx, config);
  }

  /**
   * Update data table with dynamic headers
   */
  updateDataTable() {
    if (!this.currentData) return;

    const table = document.getElementById('transactions-table');
    const tbody = document.getElementById('transactions-body');
    if (!table || !tbody) return;

    // Update table headers based on current data
    this.updateTableHeaders();

    // Clear existing rows
    tbody.innerHTML = '';

    // Use filtered data if date filter is active
    const dataToUse = this.getFilteredData() || this.currentData;

    // Get recent transactions (last 50)
    // Fix: Handle both 'records' (CSV data) and 'transactions' (Railway API data)
    const transactions = dataToUse.transactions || dataToUse.records || [];
    console.log(`📊 Updating data table with ${transactions.length} transactions`);

    const recentTransactions = transactions
      .filter(record => record['Date'])
      .sort((a, b) => new Date(b['Date']) - new Date(a['Date']))
      .slice(0, 50);

    // Add rows
    recentTransactions.forEach(record => {
      const row = this.createDynamicTableRow(record);
      tbody.appendChild(row);
    });
  }

  /**
   * Update table headers based on current data
   */
  updateTableHeaders() {
    const thead = document.querySelector('#transactions-table thead tr');
    if (!thead || !this.currentData.records.length) return;

    // Get column names from the first record
    const sampleRecord = this.currentData.records[0];
    const availableColumns = Object.keys(sampleRecord);

    // Define priority columns and their display names
    const priorityColumns = [
      { key: 'Date', display: 'Date' },
      { key: 'Customer', display: 'Customer' },
      { key: 'Product Type', display: 'Product Type' },
      { key: 'Product', display: 'Product' },
      { key: 'Gallon Qty', display: 'Gallons' },
      { key: 'Sales', display: 'Sales' },
      { key: 'Actual Profit By Item', display: 'Profit' },
      { key: 'DELIVERY FEE', display: 'Delivery Fee' },
      { key: 'TOTAL', display: 'Total' }
    ];

    // Find which priority columns exist in the data
    const columnsToShow = [];
    priorityColumns.forEach(col => {
      if (availableColumns.includes(col.key)) {
        columnsToShow.push(col);
      }
    });

    // Add any other important columns not in priority list
    availableColumns.forEach(col => {
      if (!priorityColumns.find(p => p.key === col) &&
        !col.toLowerCase().includes('id') &&
        col !== 'ProfitMargin' &&
        col !== 'RevenuePerGallon') {
        columnsToShow.push({ key: col, display: col });
      }
    });

    // Limit to first 8 columns for readability
    const finalColumns = columnsToShow.slice(0, 8);

    // Update header
    thead.innerHTML = finalColumns.map(col => `<th>${col.display}</th>`).join('');

    // Store current columns for row creation
    this.currentTableColumns = finalColumns;
  }

  /**
   * Create dynamic table row based on current columns
   */
  createDynamicTableRow(record) {
    const row = document.createElement('tr');

    if (!this.currentTableColumns) {
      // Fallback to original method if columns not set
      return this.createTableRow(record);
    }

    const formatValue = (value, columnKey) => {
      if (!value && value !== 0) return '';

      // Format based on column type
      if (columnKey === 'Date') {
        return new Date(value).toLocaleDateString('en-US');
      } else if (columnKey.toLowerCase().includes('sales') ||
        columnKey.toLowerCase().includes('profit') ||
        columnKey.toLowerCase().includes('fee') ||
        columnKey.toLowerCase().includes('total') ||
        columnKey.toLowerCase().includes('cost')) {
        const numValue = Number(value);
        if (isNaN(numValue)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numValue);
      } else if (columnKey.toLowerCase().includes('gallon') ||
        columnKey.toLowerCase().includes('qty') ||
        columnKey.toLowerCase().includes('quantity')) {
        const numValue = Number(value);
        if (isNaN(numValue)) return '0';
        return numValue.toLocaleString();
      } else if (typeof value === 'number') {
        if (isNaN(value)) return '0';
        return value.toLocaleString();
      } else {
        return String(value);
      }
    };

    // Create cells for each column
    const cells = this.currentTableColumns.map(col => {
      const value = record[col.key];
      const formattedValue = formatValue(value, col.key);
      return `<td>${formattedValue}</td>`;
    });

    row.innerHTML = cells.join('');
    return row;
  }

  /**
   * Create table row (fallback method)
   */
  createTableRow(record) {
    const row = document.createElement('tr');

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value || 0);
    };

    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US');
    };

    row.innerHTML = `
      <td>${formatDate(record['Date'])}</td>
      <td>${record['Customer'] || ''}</td>
      <td>${record['Product Type'] || ''}</td>
      <td>${(record['Gallon Qty'] || 0).toLocaleString()}</td>
      <td>${formatCurrency(record['Sales'])}</td>
      <td>${formatCurrency(record['Actual Profit By Item'])}</td>
    `;

    return row;
  }

  /**
   * Export data to CSV
   */
  exportData() {
    if (!this.currentData) {
      this.showError('No data available to export');
      return;
    }

    try {
      console.log('📊 Exporting data...');

      // Prepare CSV data - handle both Railway database and CSV/Sheets data structures
      let headers, records;

      if (this.currentData.headers) {
        // CSV/Sheets data structure
        headers = this.currentData.headers;
        records = this.currentData.records;
      } else if (this.currentData.records && this.currentData.records.length > 0) {
        // Railway database structure - generate headers from first record
        headers = Object.keys(this.currentData.records[0]);
        records = this.currentData.records;
      } else if (this.currentData.transactions && this.currentData.transactions.length > 0) {
        // Alternative Railway structure using transactions field
        headers = Object.keys(this.currentData.transactions[0]);
        records = this.currentData.transactions;
      } else {
        this.showError('No data available to show headers');
        return;
      }

      if (!headers || !records) {
        this.showError('Unable to determine data structure for export');
        return;
      }

      let csvContent = headers.join(',') + '\n';

      records.forEach(record => {
        const row = headers.map(header => {
          let value = record[header] || '';

          // Normalize dates using the new utility function
          if (header.toLowerCase().includes('date') || value instanceof Date ||
            (typeof value === 'string' && value.startsWith('Date('))) {
            value = this.normalizeDate(value);
          }

          // Convert to string for CSV
          value = String(value);

          // Escape values containing commas or quotes
          if (value.includes(',') || value.includes('"')) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `chief-petroleum-data-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Data exported successfully!');
      }

    } catch (error) {
      console.error('❌ Export failed:', error);
      this.showError('Failed to export data: ' + error.message);
    }
  }

  /**
   * Update last updated timestamp and data range information
   */
  updateLastUpdated() {
    const element = document.getElementById('update-time');
    if (element) {
      element.textContent = new Date().toLocaleString();
    }

    // Update data range information
    this.updateDataRangeInfo();

    // Update data source information
    this.updateDataSourceInfo();
  }

  /**
   * Update data source information
   */
  updateDataSourceInfo() {
    const dataSourceElement = document.getElementById('data-source');
    if (dataSourceElement && this.currentData) {
      const source = this.currentData.dataSource || this.currentData.source || 'Google Sheets';
      dataSourceElement.textContent = source;

      // Add visual indicators for different data sources
      if (source === 'Railway Database') {
        dataSourceElement.style.color = 'var(--success-color, #28a745)';
        dataSourceElement.style.fontWeight = '600';
        dataSourceElement.title = 'Live data from Railway PostgreSQL database';
      } else if (source === 'CSV Upload') {
        dataSourceElement.style.color = 'var(--chief-primary)';
        dataSourceElement.style.fontWeight = '500';
        dataSourceElement.title = 'Data from uploaded CSV files';
      } else {
        dataSourceElement.style.color = 'var(--text-muted)';
        dataSourceElement.style.fontWeight = 'normal';
        dataSourceElement.title = 'Data from Google Sheets';
      }
    }
  }

  /**
   * Initialize data source dropdown with default value
   */
  initializeDataSourceDropdown() {
    const sheetSelector = document.getElementById('sheet-selector');
    if (sheetSelector) {
      // Set default to "Current Data" (transactions)
      sheetSelector.value = 'Data';
      console.log('📊 Data source dropdown initialized to:', sheetSelector.value);
    }
  }



  /**
   * Update data range information display
   */
  async updateDataRangeInfo() {
    if (!this.currentData || !this.currentData.records) return;

    // Calculate date range for main data
    const mainDataRange = this.calculateDataRange(this.currentData.records);
    const dataRangeElement = document.getElementById('data-range');
    if (dataRangeElement && mainDataRange) {
      dataRangeElement.textContent = mainDataRange;
    }

    // Load and display recap data range
    this.updateRecapDataRange();
  }

  /**
   * Update recap data range information - CSV Only Mode
   */
  updateRecapDataRange() {
    try {
      const recapDataRangeElement = document.getElementById('recap-data-range');
      if (!recapDataRangeElement) {
        console.warn('⚠️ Recap data range element not found');
        return;
      }

      // Check if we have dedicated recap data
      if (this.currentRecapData && this.currentRecapData.records && this.currentRecapData.records.length > 0) {
        const dataRange = this.calculateDataRange(this.currentRecapData.records);
        recapDataRangeElement.textContent = `${dataRange.start} to ${dataRange.end} (${this.currentRecapData.records.length} recap records)`;
        console.log('📊 Updated recap data range from dedicated recap data');
      } else if (this.currentData && this.currentData.records && this.currentData.records.length > 0) {
        // Fallback to main data range
        const dataRange = this.calculateDataRange(this.currentData.records);
        recapDataRangeElement.textContent = `${dataRange.start} to ${dataRange.end} (${this.currentData.records.length} main data records)`;
        console.log('📊 Updated recap data range from main data');
      } else {
        recapDataRangeElement.textContent = 'No data available - please upload CSV files';
        console.log('📊 No data available for recap range');
      }

    } catch (error) {
      console.error('❌ Error updating recap data range:', error);
      const recapDataRangeElement = document.getElementById('recap-data-range');
      if (recapDataRangeElement) {
        recapDataRangeElement.textContent = 'Error loading data range';
      }
    }
  }

  /**
   * Calculate date range from records
   */
  calculateDataRange(records) {
    if (!records || records.length === 0) return 'No data available';

    // Extract valid dates from records
    const dates = records
      .map(record => record['Date'])
      .filter(date => date && !isNaN(new Date(date).getTime()))
      .map(date => new Date(date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return 'No valid dates found';

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Format dates nicely
    const formatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    const startFormatted = startDate.toLocaleDateString('en-US', formatOptions);
    const endFormatted = endDate.toLocaleDateString('en-US', formatOptions);

    if (startFormatted === endFormatted) {
      return `${startFormatted} (${dates.length} records)`;
    } else {
      return `${startFormatted} to ${endFormatted} (${dates.length} records)`;
    }
  }

  /**
   * Show loading overlay with smooth transition
   */
  showLoading(message = 'Loading...') {
    this.isLoading = true;
    const overlay = document.getElementById('loading-overlay');
    const messageElement = overlay?.querySelector('p');

    if (overlay) {
      // Set message first
      if (messageElement) {
        messageElement.textContent = message;
      }

      // Show overlay and trigger transition
      overlay.style.display = 'flex';

      // Force reflow to ensure display change is applied
      overlay.offsetHeight;

      // Add show class for smooth transition
      overlay.classList.add('show');

      // Add loading states to other elements
      this.addLoadingStates();
    }
  }

  /**
   * Hide loading overlay with smooth transition
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      // Remove show class for smooth transition
      overlay.classList.remove('show');

      // Hide overlay after transition completes
      setTimeout(() => {
        if (!this.isLoading) {
          overlay.style.display = 'none';
        }
      }, 300);

      // Remove loading states from other elements
      this.removeLoadingStates();
    }

    this.isLoading = false;
  }

  /**
   * Add loading states to UI elements
   */
  addLoadingStates() {
    // Add loading class to charts
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      container.classList.add('loading');
    });

    // Add loading class to KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      card.classList.add('updating');
    });

    // Add loading class to sheet selector
    const sheetSelector = document.querySelector('.sheet-selector-container');
    if (sheetSelector) {
      sheetSelector.classList.add('loading');
    }
  }

  /**
   * Remove loading states from UI elements
   */
  removeLoadingStates() {
    // Remove loading class from charts
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      container.classList.remove('loading');
    });

    // Remove loading class from KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      card.classList.remove('updating');
    });

    // Remove loading class from sheet selector
    const sheetSelector = document.querySelector('.sheet-selector-container');
    if (sheetSelector) {
      sheetSelector.classList.remove('loading');
    }
  }

  /**
   * Show error modal
   */
  showError(message) {
    const modal = document.getElementById('error-modal');
    const messageElement = document.getElementById('error-message');

    if (modal && messageElement) {
      messageElement.textContent = message;
      modal.classList.add('show');
    }
  }

  /**
   * Hide error modal
   */
  hideError() {
    const modal = document.getElementById('error-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * Show notification toast
   * @param {string} message - Notification message
   * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
   */
  showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Add icon based on type
    const icons = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle'
    };

    notification.innerHTML = `
      <i class="${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to container
    notificationContainer.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);

    // Add slide-in animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }



  /**
   * Handle theme changes
   */
  onThemeChange(themeData) {
    console.log('🎨 Dashboard received theme change to:', themeData.theme);

    // Don't update chart manager here as it's already handled by theme manager
    // This prevents double theme updates and recursion
    console.log('🎨 Chart manager theme update handled by theme manager');
  }

  /**
   * Setup drag and drop listeners for enhanced file upload
   */
  setupDragAndDropListeners() {
    const dragDropZone = document.getElementById('drag-drop-zone');
    const fileInput = document.getElementById('csv-file');
    const uploadBtn = document.getElementById('upload-csv');

    if (!dragDropZone || !fileInput) return;

    // Click to browse files
    dragDropZone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFileSelection(Array.from(e.target.files));
    });

    // Drag and drop events
    dragDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropZone.classList.add('drag-over');
    });

    dragDropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!dragDropZone.contains(e.relatedTarget)) {
        dragDropZone.classList.remove('drag-over');
      }
    });

    dragDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropZone.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files).filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      });

      if (files.length === 0) {
        this.showNotification('Please drop CSV or Excel files only', 'warning');
        return;
      }

      this.handleFileSelection(files);
    });
  }

  /**
   * Setup column mapping modal listeners
   */
  setupColumnMappingListeners() {
    const modal = document.getElementById('column-mapping-modal');
    const closeBtn = document.getElementById('column-mapping-close');
    const cancelBtn = document.getElementById('cancel-mapping');
    const applyBtn = document.getElementById('apply-mapping');
    const autoDetectBtn = document.getElementById('auto-detect-mapping');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideColumnMappingModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideColumnMappingModal());
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyColumnMapping());
    }

    if (autoDetectBtn) {
      autoDetectBtn.addEventListener('click', () => this.autoDetectColumnMapping());
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideColumnMappingModal();
        }
      });
    }
  }

  /**
   * Handle file selection from drag-drop or file input
   */
  handleFileSelection(files) {
    this.selectedFiles = files;
    this.updateFileList();
    this.updateUploadButton();
  }

  /**
   * Update the file list display
   */
  updateFileList() {
    const fileList = document.getElementById('file-list');
    const fileItems = document.getElementById('file-items');

    if (!fileList || !fileItems) return;

    if (this.selectedFiles.length === 0) {
      fileList.style.display = 'none';
      return;
    }

    fileList.style.display = 'block';
    fileItems.innerHTML = '';

    this.selectedFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';

      // Determine file icon based on extension
      const fileName = file.name.toLowerCase();
      let fileIcon = 'fas fa-file';
      if (fileName.endsWith('.csv')) {
        fileIcon = 'fas fa-file-csv';
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        fileIcon = 'fas fa-file-excel';
      }

      fileItem.innerHTML = `
        <div class="file-info">
          <i class="${fileIcon} file-icon"></i>
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${this.formatFileSize(file.size)})</span>
        </div>
        <button class="file-remove" onclick="dashboard.removeFile(${index})" title="Remove file">
          <i class="fas fa-times"></i>
        </button>
      `;
      fileItems.appendChild(fileItem);
    });
  }

  /**
   * Remove a file from selection
   */
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updateFileList();
    this.updateUploadButton();
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Update upload button state
   */
  updateUploadButton() {
    const uploadBtn = document.getElementById('upload-csv');
    if (uploadBtn) {
      uploadBtn.disabled = this.selectedFiles.length === 0;
    }
  }

  /**
   * Enhanced CSV upload handler with column mapping
   */
  async handleEnhancedCSVUpload() {
    if (this.selectedFiles.length === 0) {
      this.showNotification('Please select CSV files first', 'warning');
      return;
    }

    // For now, process the first file (can be extended for multiple files)
    const file = this.selectedFiles[0];

    try {
      const fileName = file.name.toLowerCase();
      const fileType = fileName.endsWith('.csv') ? 'CSV' : 'Excel';

      this.showLoading(`Analyzing ${fileType} structure...`);

      // Read and analyze the file
      const csvText = await this.readFileContent(file);
      const analysis = this.analyzeCSVStructure(csvText);

      this.hideLoading();

      // Show column mapping modal
      this.showColumnMappingModal(file, analysis);

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error analyzing file:', error);
      this.showNotification('Error analyzing file: ' + error.message, 'error');
    }
  }

  /**
   * Handle CSV file upload - Local Processing Only (Legacy method)
   */
  async handleCSVUpload() {
    const fileInput = document.getElementById('csv-file');
    const datasetNameInput = document.getElementById('dataset-name');
    const file = fileInput.files[0];

    if (!file) {
      this.showNotification('Please select a CSV file first', 'warning');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showNotification('Please select a valid CSV file', 'error');
      return;
    }

    // Get dataset name (use filename if not provided)
    let datasetName = datasetNameInput.value.trim();
    if (!datasetName) {
      datasetName = file.name.replace('.csv', '');
    }

    try {
      this.showLoading(`Processing ${datasetName}...`);

      // Read the CSV file
      const csvText = await this.readCSVFile(file);

      // Parse and process the CSV data
      const processedData = this.processCSVData(csvText, datasetName);

      // Store the dataset locally
      this.uploadedDatasets[datasetName] = processedData;
      this.currentData = processedData;
      this.currentDataset = datasetName;

      // Update local dashboard
      this.updateDatasetSwitcher(datasetName);
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();

      // Update data explorer with new data
      this.updateDataExplorer();

      // Populate filter dropdowns
      this.populateFilterDropdowns();

      this.hideLoading();

      // Show success message
      this.showNotification(`Dataset "${datasetName}" uploaded successfully!
        📊 Processed ${processedData.records.length} records`, 'success');

      // Clear the inputs
      fileInput.value = '';
      datasetNameInput.value = '';

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error processing CSV file:', error);
      this.showNotification('Error processing CSV file: ' + error.message, 'error');
    }
  }

  /**
   * Handle Recap CSV file upload - Local Processing Only
   */
  async handleRecapCSVUpload() {
    const fileInput = document.getElementById('recap-csv-file');
    const datasetNameInput = document.getElementById('recap-dataset-name');
    const file = fileInput.files[0];

    if (!file) {
      this.showNotification('Please select a recap CSV file first', 'warning');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showNotification('Please select a valid CSV file', 'error');
      return;
    }

    // Get dataset name (use filename if not provided)
    let datasetName = datasetNameInput.value.trim();
    if (!datasetName) {
      datasetName = file.name.replace('.csv', '') + ' (Recap)';
    }

    try {
      this.showLoading(`Processing recap data: ${datasetName}...`);

      // Read the CSV file
      const csvText = await this.readCSVFile(file);

      // Parse and process the CSV data specifically for recap
      const processedData = this.processRecapCSVData(csvText, datasetName);

      // Store the recap dataset separately
      if (!this.uploadedRecapDatasets) {
        this.uploadedRecapDatasets = {};
      }
      this.uploadedRecapDatasets[datasetName] = processedData;
      this.currentRecapData = processedData;
      this.currentRecapDataset = datasetName;

      // Update recap dataset switcher
      this.updateRecapDatasetSwitcher(datasetName);

      // Update recap data range info and set default date
      this.updateRecapDataRange();
      this.setDefaultRecapDateWithData();

      this.hideLoading();

      // Show success message
      this.showNotification(`Recap dataset "${datasetName}" uploaded successfully!
        📊 Processed ${processedData.records.length} recap records`, 'success');

      // Clear the inputs
      fileInput.value = '';
      datasetNameInput.value = '';

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error processing recap CSV file:', error);
      this.showNotification('Error processing recap CSV file: ' + error.message, 'error');
    }
  }

  /**
   * Update the dataset switcher dropdown
   */
  updateDatasetSwitcher(activeDataset) {
    const switcher = document.getElementById('dataset-switcher');
    const select = document.getElementById('active-dataset');
    const info = document.getElementById('dataset-info');

    // Show the switcher
    switcher.style.display = 'flex';

    // Clear and populate the select
    select.innerHTML = '<option value="">Select Dataset...</option>';

    Object.keys(this.uploadedDatasets).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.selected = name === activeDataset;
      select.appendChild(option);
    });

    // Update info
    const datasetCount = Object.keys(this.uploadedDatasets).length;
    const currentRecords = this.uploadedDatasets[activeDataset]?.records.length || 0;
    info.textContent = `${datasetCount} datasets uploaded, ${currentRecords} records in "${activeDataset}"`;
  }

  /**
   * Switch to a different dataset
   */
  switchDataset(datasetName) {
    if (!datasetName || !this.uploadedDatasets[datasetName]) {
      return;
    }

    try {
      this.showLoading(`Switching to ${datasetName}...`);

      // Set as current data
      this.currentData = this.uploadedDatasets[datasetName];

      // Update all dashboard components
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();

      // Update info
      this.updateDatasetSwitcher(datasetName);

      // Update data explorer with new data
      this.updateDataExplorer();

      // Update filter dropdowns
      this.populateFilterDropdowns();

      this.hideLoading();
      this.showNotification(`Switched to dataset "${datasetName}"`, 'success');

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error switching dataset:', error);
      this.showNotification('Error switching dataset: ' + error.message, 'error');
    }
  }



  /**
   * Read file content (CSV or Excel)
   */
  readFileContent(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      return this.readCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return this.readExcelFile(file);
    } else {
      return Promise.reject(new Error('Unsupported file format'));
    }
  }

  /**
   * Read CSV file content
   */
  readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Read Excel file content and convert to CSV format
   */
  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get first sheet name
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to CSV format
          const csvText = XLSX.utils.sheet_to_csv(worksheet);

          resolve(csvText);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get Excel sheet names for sheet selection
   */
  getExcelSheetNames(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook.SheetNames);
        } catch (error) {
          reject(new Error('Failed to read Excel file: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Read specific Excel sheet and convert to CSV
   */
  readExcelSheet(file, sheetName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          if (!workbook.SheetNames.includes(sheetName)) {
            reject(new Error(`Sheet "${sheetName}" not found`));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);

          resolve(csvText);
        } catch (error) {
          reject(new Error('Failed to parse Excel sheet: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Process CSV data into dashboard format
   */
  processCSVData(csvText, datasetName = 'CSV Upload') {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse header row
    const headers = this.parseCSVRow(lines[0]);
    console.log('📊 CSV Headers:', headers);

    // Parse data rows
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVRow(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`⚠️ Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`);
        continue;
      }

      // Create record object
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      // Process the record (parse numbers, dates, etc.)
      this.processCSVRecord(record);

      // Skip empty records
      if (!this.isEmptyCSVRecord(record)) {
        records.push(record);
      }
    }

    console.log(`✅ Processed ${records.length} records from CSV`);

    // Calculate summary statistics
    const summary = this.calculateSummaryFromRecords(records);

    return {
      records,
      headers,
      summary,
      source: `CSV Upload (${datasetName})`,
      datasetName: datasetName,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Process Recap CSV data into dashboard format
   */
  processRecapCSVData(csvText, datasetName = 'Recap CSV Upload') {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('Recap CSV file must have at least a header row and one data row');
    }

    // Parse header row
    const headers = this.parseCSVRow(lines[0]);
    console.log('📊 Recap CSV Headers:', headers);

    // Parse data rows
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVRow(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`⚠️ Recap row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`);
        continue;
      }

      // Create record object
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      // Process the record (parse numbers, dates, etc.) - reuse existing method
      this.processCSVRecord(record);

      // Skip empty records
      if (!this.isEmptyCSVRecord(record)) {
        records.push(record);
      }
    }

    console.log(`✅ Processed ${records.length} recap records from CSV`);

    // Calculate recap-specific summary statistics - reuse existing method
    const summary = this.calculateSummaryFromRecords(records);

    return {
      records,
      headers,
      summary,
      source: `Recap CSV Upload (${datasetName})`,
      datasetName: datasetName,
      uploadedAt: new Date().toISOString(),
      type: 'recap'
    };
  }

  /**
   * Switch to a different recap dataset
   */
  switchRecapDataset(datasetName) {
    if (!datasetName || !this.uploadedRecapDatasets || !this.uploadedRecapDatasets[datasetName]) {
      console.log('📊 No recap dataset selected or dataset not found');
      this.currentRecapData = null;
      this.currentRecapDataset = null;
      this.updateRecapDataRange();
      return;
    }

    console.log(`📊 Switching to recap dataset: ${datasetName}`);
    this.currentRecapData = this.uploadedRecapDatasets[datasetName];
    this.currentRecapDataset = datasetName;

    // Update recap data range info
    this.updateRecapDataRange();

    this.showNotification(`Switched to recap dataset: ${datasetName}`, 'success');
  }

  /**
   * Update recap dataset switcher dropdown
   */
  updateRecapDatasetSwitcher(selectedDataset = null) {
    const switcher = document.getElementById('recap-dataset-switcher');
    const selector = document.getElementById('recap-dataset-selector');

    if (!switcher || !selector) {
      console.warn('⚠️ Recap dataset switcher elements not found');
      return;
    }

    // Clear existing options
    selector.innerHTML = '<option value="">No recap data uploaded</option>';

    // Add uploaded recap datasets
    if (this.uploadedRecapDatasets && Object.keys(this.uploadedRecapDatasets).length > 0) {
      Object.keys(this.uploadedRecapDatasets).forEach(datasetName => {
        const option = document.createElement('option');
        option.value = datasetName;
        option.textContent = datasetName;
        if (datasetName === selectedDataset) {
          option.selected = true;
        }
        selector.appendChild(option);
      });

      // Show the switcher
      switcher.style.display = 'block';
    } else {
      // Hide the switcher if no datasets
      switcher.style.display = 'none';
    }
  }

  /**
   * Update recap data range information
   */
  updateRecapDataRange() {
    const rangeElement = document.getElementById('recap-data-range');

    if (!rangeElement) {
      console.warn('⚠️ Recap data range element not found');
      return;
    }

    if (!this.currentRecapData || !this.currentRecapData.records || this.currentRecapData.records.length === 0) {
      rangeElement.textContent = 'No recap data available';
      return;
    }

    try {
      const dataRange = this.calculateDataRange(this.currentRecapData.records);
      rangeElement.textContent = `${dataRange.start} to ${dataRange.end} (${this.currentRecapData.records.length} records)`;
    } catch (error) {
      console.error('❌ Error calculating recap data range:', error);
      rangeElement.textContent = `${this.currentRecapData.records.length} records available`;
    }
  }

  /**
   * Parse a CSV row handling quoted values and commas
   */
  parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  }

  /**
   * Advanced data validation system
   */
  validateDataQuality(records, headers) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: [],
      quality: {
        completeness: 0,
        consistency: 0,
        accuracy: 0,
        overall: 0
      },
      fieldAnalysis: {}
    };

    // Analyze each field
    headers.forEach(header => {
      const fieldData = records.map(record => record[header]);
      const fieldAnalysis = this.analyzeField(header, fieldData);
      validation.fieldAnalysis[header] = fieldAnalysis;

      // Add field-specific errors and warnings
      validation.errors.push(...fieldAnalysis.errors);
      validation.warnings.push(...fieldAnalysis.warnings);
      validation.suggestions.push(...fieldAnalysis.suggestions);
    });

    // Calculate overall quality scores
    validation.quality = this.calculateDataQuality(validation.fieldAnalysis);

    // Add general data validation rules
    this.validateGeneralRules(records, validation);

    return validation;
  }

  /**
   * Analyze individual field quality
   */
  analyzeField(fieldName, values) {
    const analysis = {
      fieldName,
      totalValues: values.length,
      emptyValues: 0,
      uniqueValues: 0,
      dataType: 'unknown',
      errors: [],
      warnings: [],
      suggestions: [],
      patterns: [],
      outliers: []
    };

    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v.toString().trim() !== '');
    analysis.emptyValues = values.length - nonEmptyValues.length;
    analysis.uniqueValues = new Set(nonEmptyValues).size;

    if (nonEmptyValues.length === 0) {
      analysis.errors.push({
        type: 'EMPTY_FIELD',
        field: fieldName,
        message: `Field "${fieldName}" contains no data`,
        severity: 'high'
      });
      return analysis;
    }

    // Detect data type and validate
    analysis.dataType = this.detectDataType(nonEmptyValues);

    // Type-specific validation
    switch (analysis.dataType) {
      case 'date':
        this.validateDateField(fieldName, nonEmptyValues, analysis);
        break;
      case 'currency':
      case 'number':
        this.validateNumericField(fieldName, nonEmptyValues, analysis);
        break;
      case 'text':
        this.validateTextField(fieldName, nonEmptyValues, analysis);
        break;
    }

    // Check completeness
    const completeness = (nonEmptyValues.length / values.length) * 100;
    if (completeness < 80) {
      analysis.warnings.push({
        type: 'LOW_COMPLETENESS',
        field: fieldName,
        message: `Field "${fieldName}" is only ${completeness.toFixed(1)}% complete`,
        severity: 'medium'
      });
    }

    // Check for duplicates in key fields
    if (this.isKeyField(fieldName) && analysis.uniqueValues < nonEmptyValues.length) {
      analysis.warnings.push({
        type: 'DUPLICATE_VALUES',
        field: fieldName,
        message: `Field "${fieldName}" contains duplicate values`,
        severity: 'medium'
      });
    }

    return analysis;
  }

  /**
   * Validate date fields
   */
  validateDateField(fieldName, values, analysis) {
    let invalidDates = 0;
    let futureDates = 0;
    let oldDates = 0;
    const currentYear = new Date().getFullYear();

    values.forEach((value, index) => {
      const date = new Date(value);

      if (isNaN(date.getTime())) {
        invalidDates++;
      } else {
        const year = date.getFullYear();
        if (year > currentYear + 1) {
          futureDates++;
        } else if (year < 1900) {
          oldDates++;
        }
      }
    });

    if (invalidDates > 0) {
      analysis.errors.push({
        type: 'INVALID_DATES',
        field: fieldName,
        message: `${invalidDates} invalid date(s) found in "${fieldName}"`,
        severity: 'high',
        count: invalidDates
      });
    }

    if (futureDates > 0) {
      analysis.warnings.push({
        type: 'FUTURE_DATES',
        field: fieldName,
        message: `${futureDates} future date(s) found in "${fieldName}"`,
        severity: 'low',
        count: futureDates
      });
    }

    if (oldDates > 0) {
      analysis.warnings.push({
        type: 'OLD_DATES',
        field: fieldName,
        message: `${oldDates} very old date(s) found in "${fieldName}"`,
        severity: 'low',
        count: oldDates
      });
    }
  }

  /**
   * Validate numeric fields
   */
  validateNumericField(fieldName, values, analysis) {
    let invalidNumbers = 0;
    let negativeValues = 0;
    let zeroValues = 0;
    const numericValues = [];

    values.forEach(value => {
      const num = parseFloat(value.toString().replace(/[$,]/g, ''));

      if (isNaN(num)) {
        invalidNumbers++;
      } else {
        numericValues.push(num);
        if (num < 0) negativeValues++;
        if (num === 0) zeroValues++;
      }
    });

    if (invalidNumbers > 0) {
      analysis.errors.push({
        type: 'INVALID_NUMBERS',
        field: fieldName,
        message: `${invalidNumbers} invalid number(s) found in "${fieldName}"`,
        severity: 'high',
        count: invalidNumbers
      });
    }

    // Check for outliers in financial fields
    if (this.isFinancialField(fieldName) && numericValues.length > 0) {
      const outliers = this.detectOutliers(numericValues);
      if (outliers.length > 0) {
        analysis.warnings.push({
          type: 'OUTLIERS_DETECTED',
          field: fieldName,
          message: `${outliers.length} potential outlier(s) detected in "${fieldName}"`,
          severity: 'low',
          count: outliers.length,
          values: outliers
        });
      }
    }

    // Check for negative values in fields that shouldn't have them
    if (this.shouldBePositive(fieldName) && negativeValues > 0) {
      analysis.warnings.push({
        type: 'NEGATIVE_VALUES',
        field: fieldName,
        message: `${negativeValues} negative value(s) found in "${fieldName}"`,
        severity: 'medium',
        count: negativeValues
      });
    }
  }

  /**
   * Validate text fields
   */
  validateTextField(fieldName, values, analysis) {
    let emptyStrings = 0;
    let inconsistentCase = 0;
    const patterns = {};

    values.forEach(value => {
      const str = value.toString().trim();

      if (str === '') {
        emptyStrings++;
        return;
      }

      // Check for inconsistent casing in name fields
      if (this.isNameField(fieldName)) {
        const hasLower = /[a-z]/.test(str);
        const hasUpper = /[A-Z]/.test(str);
        if (hasLower && !hasUpper) {
          inconsistentCase++;
        }
      }

      // Detect common patterns
      const pattern = this.detectTextPattern(str);
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    if (inconsistentCase > values.length * 0.1) {
      analysis.suggestions.push({
        type: 'INCONSISTENT_CASE',
        field: fieldName,
        message: `Consider standardizing case in "${fieldName}"`,
        severity: 'low',
        count: inconsistentCase
      });
    }

    analysis.patterns = Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  /**
   * Detect statistical outliers
   */
  detectOutliers(values) {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(value => value < lowerBound || value > upperBound);
  }

  /**
   * Helper methods for field type detection
   */
  isKeyField(fieldName) {
    const keyFields = ['id', 'key', 'number', 'code'];
    return keyFields.some(key => fieldName.toLowerCase().includes(key));
  }

  isFinancialField(fieldName) {
    const financialFields = ['sales', 'cost', 'profit', 'price', 'amount', 'revenue'];
    return financialFields.some(field => fieldName.toLowerCase().includes(field));
  }

  shouldBePositive(fieldName) {
    const positiveFields = ['sales', 'quantity', 'qty', 'gallon', 'amount'];
    return positiveFields.some(field => fieldName.toLowerCase().includes(field));
  }

  isNameField(fieldName) {
    const nameFields = ['name', 'customer', 'driver', 'client'];
    return nameFields.some(field => fieldName.toLowerCase().includes(field));
  }

  detectTextPattern(text) {
    if (/^\d+$/.test(text)) return 'numeric';
    if (/^[A-Z]+$/.test(text)) return 'uppercase';
    if (/^[a-z]+$/.test(text)) return 'lowercase';
    if (/^[A-Z][a-z]+$/.test(text)) return 'title_case';
    if (/^\w+@\w+\.\w+$/.test(text)) return 'email';
    if (/^\d{3}-\d{3}-\d{4}$/.test(text)) return 'phone';
    return 'mixed';
  }

  /**
   * Calculate overall data quality scores
   */
  calculateDataQuality(fieldAnalysis) {
    const fields = Object.values(fieldAnalysis);
    if (fields.length === 0) return { completeness: 0, consistency: 0, accuracy: 0, overall: 0 };

    // Completeness: percentage of non-empty values
    const completeness = fields.reduce((sum, field) => {
      return sum + ((field.totalValues - field.emptyValues) / field.totalValues);
    }, 0) / fields.length * 100;

    // Consistency: based on data type consistency and patterns
    const consistency = fields.reduce((sum, field) => {
      const typeConsistency = field.dataType !== 'unknown' ? 1 : 0;
      return sum + typeConsistency;
    }, 0) / fields.length * 100;

    // Accuracy: based on validation errors
    const totalErrors = fields.reduce((sum, field) => sum + field.errors.length, 0);
    const accuracy = Math.max(0, 100 - (totalErrors / fields.length * 10));

    const overall = (completeness + consistency + accuracy) / 3;

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      accuracy: Math.round(accuracy),
      overall: Math.round(overall)
    };
  }

  /**
   * Validate general business rules
   */
  validateGeneralRules(records, validation) {
    // Check for required field combinations
    const requiredFields = ['Date', 'Sales'];
    const missingRequired = requiredFields.filter(field =>
      !Object.keys(validation.fieldAnalysis).includes(field)
    );

    if (missingRequired.length > 0) {
      validation.errors.push({
        type: 'MISSING_REQUIRED_FIELDS',
        message: `Missing required fields: ${missingRequired.join(', ')}`,
        severity: 'high',
        fields: missingRequired
      });
    }

    // Check for logical inconsistencies
    records.forEach((record, index) => {
      if (record.Sales && record['Actual Cost by item'] && record['Actual Profit By Item']) {
        const sales = parseFloat(record.Sales) || 0;
        const cost = parseFloat(record['Actual Cost by item']) || 0;
        const profit = parseFloat(record['Actual Profit By Item']) || 0;

        const expectedProfit = sales - cost;
        const difference = Math.abs(profit - expectedProfit);

        if (difference > 0.01) { // Allow for small rounding differences
          validation.warnings.push({
            type: 'PROFIT_CALCULATION_MISMATCH',
            message: `Row ${index + 2}: Profit calculation doesn't match (Sales - Cost)`,
            severity: 'medium',
            row: index + 2,
            expected: expectedProfit,
            actual: profit
          });
        }
      }
    });
  }

  /**
   * Analyze CSV structure for column mapping
   */
  analyzeCSVStructure(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = this.parseCSVRow(lines[0]);
    const sampleRows = [];

    // Analyze first 5 rows for data types
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = this.parseCSVRow(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        sampleRows.push(row);
      }
    }

    // Detect column types and suggest mappings
    const columnAnalysis = headers.map(header => {
      const samples = sampleRows.map(row => row[header]).filter(val => val && val.trim());
      const dataType = this.detectDataType(samples);
      const suggestedMapping = this.suggestColumnMapping(header, dataType, samples);

      return {
        name: header,
        dataType,
        samples: samples.slice(0, 3), // First 3 non-empty samples
        suggestedMapping,
        confidence: this.calculateMappingConfidence(header, dataType)
      };
    });

    return {
      headers,
      sampleRows: sampleRows.slice(0, 3),
      columnAnalysis,
      totalRows: lines.length - 1
    };
  }

  /**
   * Detect data type from sample values
   */
  detectDataType(samples) {
    if (samples.length === 0) return 'text';

    let numberCount = 0;
    let dateCount = 0;
    let currencyCount = 0;

    samples.forEach(sample => {
      const cleaned = sample.toString().trim();

      // Check for currency
      if (/^\$?[\d,]+\.?\d*$/.test(cleaned) || /^\$/.test(cleaned)) {
        currencyCount++;
      }
      // Check for numbers
      else if (!isNaN(parseFloat(cleaned)) && isFinite(cleaned)) {
        numberCount++;
      }
      // Check for dates
      else if (!isNaN(Date.parse(cleaned))) {
        dateCount++;
      }
    });

    const total = samples.length;
    if (currencyCount / total > 0.7) return 'currency';
    if (numberCount / total > 0.7) return 'number';
    if (dateCount / total > 0.7) return 'date';

    return 'text';
  }

  /**
   * Suggest column mapping based on header name and data type
   */
  suggestColumnMapping(header, dataType, samples) {
    const headerLower = header.toLowerCase();

    // Date field mappings
    if (dataType === 'date' || headerLower.includes('date') || headerLower.includes('time')) {
      return 'Date';
    }

    // Sales/Revenue mappings
    if (dataType === 'currency' || headerLower.includes('sales') || headerLower.includes('revenue') || headerLower.includes('amount')) {
      return 'Sales';
    }

    // Quantity mappings
    if ((dataType === 'number' && (headerLower.includes('gallon') || headerLower.includes('qty') || headerLower.includes('quantity')))) {
      return 'Gallon Qty';
    }

    // Profit mappings
    if (dataType === 'currency' && (headerLower.includes('profit') || headerLower.includes('margin'))) {
      return 'Actual Profit By Item';
    }

    // Cost mappings
    if (dataType === 'currency' && (headerLower.includes('cost') || headerLower.includes('expense'))) {
      return 'Actual Cost by item';
    }

    // Customer mappings
    if (headerLower.includes('customer') || headerLower.includes('client')) {
      return 'Customer';
    }

    // Driver mappings
    if (headerLower.includes('driver') || headerLower.includes('operator')) {
      return 'Driver';
    }

    // Product mappings
    if (headerLower.includes('product') || headerLower.includes('fuel') || headerLower.includes('type')) {
      return 'Product Type';
    }

    // Location mappings
    if (headerLower.includes('location') || headerLower.includes('address') || headerLower.includes('city') || headerLower.includes('state')) {
      return 'Location';
    }

    return null; // No suggested mapping
  }

  /**
   * Calculate confidence score for mapping suggestion
   */
  calculateMappingConfidence(header, dataType) {
    const headerLower = header.toLowerCase();
    let confidence = 0;

    // Exact matches get high confidence
    if (headerLower === 'date' || headerLower === 'sales' || headerLower === 'customer') {
      confidence = 0.9;
    }
    // Partial matches get medium confidence
    else if (headerLower.includes('date') || headerLower.includes('sales') || headerLower.includes('customer')) {
      confidence = 0.7;
    }
    // Data type matches get low confidence
    else if (dataType === 'date' || dataType === 'currency') {
      confidence = 0.5;
    }
    else {
      confidence = 0.3;
    }

    return confidence;
  }

  /**
   * Show column mapping modal
   */
  showColumnMappingModal(file, analysis) {
    const modal = document.getElementById('column-mapping-modal');
    if (!modal) return;

    this.pendingUpload = { file, analysis };

    // Populate CSV columns
    this.populateCSVColumns(analysis.columnAnalysis);

    // Populate dashboard fields
    this.populateDashboardFields();

    // Show preview
    this.updateMappingPreview(analysis.sampleRows);

    // Apply auto-detected mappings
    this.applyAutoDetectedMappings(analysis.columnAnalysis);

    modal.style.display = 'flex';
  }

  /**
   * Hide column mapping modal
   */
  hideColumnMappingModal() {
    const modal = document.getElementById('column-mapping-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.pendingUpload = null;
    this.columnMappings = {};
  }

  /**
   * Process individual CSV record (parse dates, numbers, etc.)
   */
  processCSVRecord(record) {
    // Common field mappings and processing
    const dateFields = ['Date', 'date', 'DATE', 'Transaction Date', 'Order Date'];
    const numberFields = ['Sales', 'sales', 'Gallon Qty', 'gallon_qty', 'Actual Profit By Item', 'profit', 'Actual Cost by item', 'cost'];

    // Process date fields
    for (const field of dateFields) {
      if (record[field]) {
        record['Date'] = this.parseCSVDate(record[field]);
        break;
      }
    }

    // Process number fields
    numberFields.forEach(field => {
      if (record[field]) {
        const standardField = this.mapToStandardField(field);
        record[standardField] = this.parseCSVNumber(record[field]);
      }
    });

    // Calculate derived fields
    if (record['Sales'] && record['Actual Profit By Item']) {
      record['ProfitMargin'] = (record['Actual Profit By Item'] / record['Sales']) * 100;
    }

    if (record['Sales'] && record['Gallon Qty']) {
      record['RevenuePerGallon'] = record['Sales'] / record['Gallon Qty'];
    }
  }

  /**
   * Populate CSV columns in mapping modal
   */
  populateCSVColumns(columnAnalysis) {
    const container = document.getElementById('csv-columns-list');
    if (!container) return;

    container.innerHTML = '';

    columnAnalysis.forEach((column, index) => {
      const columnItem = document.createElement('div');
      columnItem.className = 'column-item';
      columnItem.draggable = true;
      columnItem.dataset.columnIndex = index;
      columnItem.dataset.columnName = column.name;

      columnItem.innerHTML = `
        <div class="column-info">
          <div class="column-name">${column.name}</div>
          <div class="column-type">${column.dataType} • ${column.samples.length} samples</div>
        </div>
        <i class="fas fa-grip-vertical"></i>
      `;

      // Add drag events
      columnItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          columnName: column.name,
          columnIndex: index
        }));
        columnItem.classList.add('dragging');
      });

      columnItem.addEventListener('dragend', () => {
        columnItem.classList.remove('dragging');
      });

      container.appendChild(columnItem);
    });
  }

  /**
   * Populate dashboard fields in mapping modal
   */
  populateDashboardFields() {
    const container = document.getElementById('dashboard-fields-list');
    if (!container) return;

    const dashboardFields = [
      { name: 'Date', description: 'Transaction date', required: true },
      { name: 'Sales', description: 'Sales amount/revenue', required: true },
      { name: 'Gallon Qty', description: 'Quantity in gallons', required: true },
      { name: 'Actual Profit By Item', description: 'Profit per transaction', required: false },
      { name: 'Actual Cost by item', description: 'Cost per transaction', required: false },
      { name: 'Customer', description: 'Customer name', required: false },
      { name: 'Driver', description: 'Driver name', required: false },
      { name: 'Product Type', description: 'Fuel/product type', required: false },
      { name: 'Location', description: 'Delivery location', required: false }
    ];

    container.innerHTML = '';

    dashboardFields.forEach(field => {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'field-item';
      fieldItem.dataset.fieldName = field.name;

      fieldItem.innerHTML = `
        <div class="column-info">
          <div class="column-name">
            ${field.name}
            ${field.required ? '<span class="required-badge">Required</span>' : ''}
          </div>
          <div class="column-type">${field.description}</div>
        </div>
        <div class="mapping-status" id="mapping-${field.name.replace(/\s+/g, '-')}">
          <i class="fas fa-circle-notch"></i>
        </div>
      `;

      // Add drop events
      fieldItem.addEventListener('dragover', (e) => {
        e.preventDefault();
        fieldItem.classList.add('drop-target');
      });

      fieldItem.addEventListener('dragleave', () => {
        fieldItem.classList.remove('drop-target');
      });

      fieldItem.addEventListener('drop', (e) => {
        e.preventDefault();
        fieldItem.classList.remove('drop-target');

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        this.createColumnMapping(data.columnName, field.name);
        this.updateMappingDisplay();
      });

      container.appendChild(fieldItem);
    });
  }

  /**
   * Create a column mapping
   */
  createColumnMapping(csvColumn, dashboardField) {
    this.columnMappings[csvColumn] = dashboardField;
    console.log(`📊 Mapped: ${csvColumn} → ${dashboardField}`);
  }

  /**
   * Update mapping display
   */
  updateMappingDisplay() {
    // Update visual indicators for mapped fields
    Object.entries(this.columnMappings).forEach(([csvColumn, dashboardField]) => {
      const statusElement = document.getElementById(`mapping-${dashboardField.replace(/\s+/g, '-')}`);
      if (statusElement) {
        statusElement.innerHTML = `
          <i class="fas fa-check-circle" style="color: var(--chief-success, #10b981);"></i>
          <small>${csvColumn}</small>
        `;
      }
    });
  }

  /**
   * Auto-detect column mappings
   */
  autoDetectColumnMapping() {
    if (!this.pendingUpload) return;

    this.columnMappings = {};

    this.pendingUpload.analysis.columnAnalysis.forEach(column => {
      if (column.suggestedMapping && column.confidence > 0.5) {
        this.columnMappings[column.name] = column.suggestedMapping;
      }
    });

    this.updateMappingDisplay();
    this.showNotification(`Auto-detected ${Object.keys(this.columnMappings).length} column mappings`, 'success');
  }

  /**
   * Apply auto-detected mappings on modal open
   */
  applyAutoDetectedMappings(columnAnalysis) {
    columnAnalysis.forEach(column => {
      if (column.suggestedMapping && column.confidence > 0.7) {
        this.columnMappings[column.name] = column.suggestedMapping;
      }
    });

    this.updateMappingDisplay();
  }

  /**
   * Update mapping preview table
   */
  updateMappingPreview(sampleRows) {
    const container = document.getElementById('mapping-preview-table');
    if (!container || !sampleRows.length) return;

    const table = document.createElement('table');

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    Object.keys(sampleRows[0]).forEach(column => {
      const th = document.createElement('th');
      const mappedField = this.columnMappings[column];
      th.innerHTML = `
        ${column}
        ${mappedField ? `<br><small style="color: var(--chief-primary);">→ ${mappedField}</small>` : ''}
      `;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    sampleRows.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
  }

  /**
   * Apply column mapping and process file
   */
  async applyColumnMapping() {
    if (!this.pendingUpload) return;

    try {
      this.hideColumnMappingModal();
      this.showLoading('Processing CSV with column mappings...');

      const { file, analysis } = this.pendingUpload;
      const csvText = await this.readCSVFile(file);

      // Process with custom mappings
      const processedData = this.processCSVDataWithMapping(csvText, this.columnMappings, file.name);

      // Get dataset name
      const datasetNameInput = document.getElementById('dataset-name');
      let datasetName = datasetNameInput ? datasetNameInput.value.trim() : '';
      if (!datasetName) {
        datasetName = file.name.replace('.csv', '');
      }

      // Store the dataset
      this.uploadedDatasets[datasetName] = processedData;
      this.currentData = processedData;
      this.currentDataset = datasetName;

      // Update dashboard
      this.updateDatasetSwitcher(datasetName);
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();
      this.updateDataExplorer();
      this.populateFilterDropdowns();

      this.hideLoading();

      // Clear selections
      this.selectedFiles = [];
      this.updateFileList();
      this.updateUploadButton();

      if (datasetNameInput) datasetNameInput.value = '';

      this.showNotification(`Dataset "${datasetName}" uploaded successfully with custom mappings!
        📊 Processed ${processedData.records.length} records`, 'success');

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error processing CSV with mappings:', error);
      this.showNotification('Error processing CSV: ' + error.message, 'error');
    }
  }

  /**
   * Process CSV data with custom column mappings
   */
  processCSVDataWithMapping(csvText, mappings, fileName = 'CSV Upload') {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const originalHeaders = this.parseCSVRow(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVRow(lines[i]);

      if (values.length !== originalHeaders.length) {
        console.warn(`⚠️ Row ${i + 1} has ${values.length} columns, expected ${originalHeaders.length}. Skipping.`);
        continue;
      }

      const record = {};

      // Apply mappings
      originalHeaders.forEach((header, index) => {
        const mappedField = mappings[header] || header;
        record[mappedField] = values[index];
      });

      // Process the record
      this.processCSVRecord(record);

      if (!this.isEmptyCSVRecord(record)) {
        records.push(record);
      }
    }

    console.log(`✅ Processed ${records.length} records with custom mappings`);

    const summary = this.calculateSummaryFromRecords(records);

    return {
      records,
      headers: Object.values(mappings).concat(
        originalHeaders.filter(h => !mappings[h])
      ),
      summary,
      source: `CSV Upload (${fileName})`,
      datasetName: fileName.replace('.csv', ''),
      uploadedAt: new Date().toISOString(),
      mappings: mappings
    };
  }

  /**
   * Map field names to standard field names
   */
  mapToStandardField(field) {
    const mapping = {
      'sales': 'Sales',
      'gallon_qty': 'Gallon Qty',
      'profit': 'Actual Profit By Item',
      'cost': 'Actual Cost by item'
    };
    return mapping[field] || field;
  }

  /**
   * Parse date from CSV (handles common date formats)
   */
  parseCSVDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;

    const cleanDate = dateStr.trim();

    // Try standard JavaScript date parsing first
    let date = new Date(cleanDate);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return date;
    }

    // Try MM/DD/YYYY format
    const mmddyyyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      date = new Date(mmddyyyy[3], mmddyyyy[1] - 1, mmddyyyy[2]);
      if (!isNaN(date.getTime())) return date;
    }

    // Try DD/MM/YYYY format
    const ddmmyyyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      date = new Date(ddmmyyyy[3], ddmmyyyy[2] - 1, ddmmyyyy[1]);
      if (!isNaN(date.getTime())) return date;
    }

    console.warn('Could not parse date:', dateStr);
    return null;
  }

  /**
   * Parse number from CSV (handles currency, commas, etc.)
   */
  parseCSVNumber(value) {
    if (!value || value === '' || value === null || value === undefined) return 0;

    // Convert to string and handle empty strings
    const stringValue = String(value).trim();
    if (stringValue === '' || stringValue === 'null' || stringValue === 'undefined') return 0;

    // Remove currency symbols, commas, spaces
    const cleaned = stringValue
      .replace(/[$,\s]/g, '')
      .replace(/[^\d.-]/g, '');

    if (cleaned === '' || cleaned === '-') return 0;

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Format number as currency
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  }

  /**
   * Format number with commas
   */
  formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value || 0);
  }

  /**
   * Check if CSV record is empty
   */
  isEmptyCSVRecord(record) {
    const values = Object.values(record);
    return values.every(v => !v || v.toString().trim() === '');
  }

  /**
   * Calculate summary statistics from records
   */
  calculateSummaryFromRecords(records) {
    if (!records || records.length === 0) {
      return {
        totalSales: 0,
        totalGallons: 0,
        totalProfit: 0,
        avgProfitMargin: 0,
        activeCustomers: 0,
        totalTransactions: 0
      };
    }

    const totalSales = records.reduce((sum, r) => sum + (r['Sales'] || 0), 0);
    const totalGallons = records.reduce((sum, r) => sum + (r['Gallon Qty'] || 0), 0);
    const totalProfit = records.reduce((sum, r) => sum + (r['Actual Profit By Item'] || 0), 0);
    const avgProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const activeCustomers = new Set(records.map(r => r['Customer']).filter(c => c)).size;

    return {
      totalSales,
      totalGallons,
      totalProfit,
      avgProfitMargin,
      activeCustomers,
      totalTransactions: records.length
    };
  }

  /**
   * Show/hide chart explanations
   */
  showChartExplanation(chartType) {
    const explanationId = `${chartType}-explanation`;
    const explanation = document.getElementById(explanationId);

    if (explanation) {
      if (explanation.style.display === 'none') {
        explanation.style.display = 'block';
        explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        explanation.style.display = 'none';
      }
    }
  }

  /**
   * Update product chart based on filter selection
   */
  updateProductChart(filterType = 'all') {
    if (!this.currentData || !this.chartManager) return;

    // Get filtered data based on selection
    const dataToUse = this.getFilteredData() || this.currentData;
    // Handle both data structures (transactions for Railway, records for CSV/Sheets)
    let filteredRecords = dataToUse.transactions || dataToUse.records || [];

    // Apply product type filter
    if (filterType !== 'all') {
      filteredRecords = this.filterRecordsByProductType(filteredRecords, filterType);
    }

    // Create a filtered data object that matches the expected structure
    const filteredDataObject = {
      records: filteredRecords,
      transactions: filteredRecords, // Support both field names
      source: this.currentData.source
    };

    // Update the chart with the filtered data object
    this.chartManager.createProductChart(filteredDataObject);

    console.log(`📊 Product chart updated with filter: ${filterType}, showing ${filteredRecords.length} records`);
  }

  /**
   * Update sales trend chart based on period selection
   */
  async updateSalesTrendChart() {
    if (!this.currentData || !this.chartManager) return;

    console.log(`📈 Updating sales trend chart with period: ${this.currentPeriod}`);

    // Determine data source and use appropriate service
    const isCSVData = this.currentData.source && this.currentData.source.includes('CSV Upload');

    if (isCSVData) {
      // For CSV data, pass the data directly
      await this.chartManager.createSalesTrendChart(this.currentData, this.currentPeriod);
    } else {
      // For Railway database data, pass the database service
      await this.chartManager.createSalesTrendChart(this.databaseService, this.currentPeriod);
    }
  }

  /**
   * Filter records by product type
   */
  filterRecordsByProductType(records, filterType) {
    return records.filter(record => {
      // Handle both Railway database field names (lowercase with underscore) and CSV field names (capitalized with space)
      const productType = (record['Product Type'] || record['product_type'] || record['Product'] || '').toLowerCase();

      switch (filterType) {
        case 'diesel':
          return productType.includes('diesel') || productType.includes('#2');
        case 'gasoline':
          return productType.includes('gasoline') || productType.includes('gas') || productType.includes('unleaded');
        case 'heating':
          return productType.includes('heating') || productType.includes('heat') || productType.includes('home');
        case 'other':
          return !productType.includes('diesel') &&
            !productType.includes('#2') &&
            !productType.includes('gasoline') &&
            !productType.includes('gas') &&
            !productType.includes('unleaded') &&
            !productType.includes('heating') &&
            !productType.includes('heat') &&
            !productType.includes('home');
        default:
          return true;
      }
    });
  }

  /**
   * Calculate product distribution from records
   */
  calculateProductDistribution(records) {
    const productMap = {};

    records.forEach(record => {
      const product = record['Product Type'] || record['Product'] || 'Unknown';
      const sales = record['Sales'] || 0;
      const gallons = record['Gallon Qty'] || 0;

      if (!productMap[product]) {
        productMap[product] = {
          name: product,
          sales: 0,
          gallons: 0,
          transactions: 0
        };
      }

      productMap[product].sales += sales;
      productMap[product].gallons += gallons;
      productMap[product].transactions++;
    });

    // Convert to array and sort by sales
    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 products
  }

  /**
   * Load daily recap for selected date - CSV Only Mode
   */
  async loadDailyRecap() {
    const selectedDate = document.getElementById('recap-date').value;
    if (!selectedDate) {
      this.showNotification('Please select a date', 'warning');
      return;
    }

    try {
      console.log('📅 Loading daily recap for:', selectedDate);
      this.showLoading(`Loading daily recap for ${selectedDate}...`);

      // Prioritize recap data if available, otherwise use main data
      let dataSource = null;
      let dataSourceName = '';

      if (this.currentRecapData && this.currentRecapData.records && this.currentRecapData.records.length > 0) {
        dataSource = this.currentRecapData;
        dataSourceName = 'recap data';
        console.log('📊 Using dedicated recap data for daily recap');
      } else if (this.currentData && this.currentData.records && this.currentData.records.length > 0) {
        dataSource = this.currentData;
        dataSourceName = 'main data';
        console.log('📊 Using main data for daily recap');
      } else {
        this.hideLoading();
        this.showNotification('No data available. Please upload a CSV file or recap data first.', 'warning');
        this.hideDailyRecap();
        return;
      }

      // Filter data by selected date with improved date handling
      const dailyRecords = dataSource.records.filter(record => {
        try {
          // Try multiple date field names and formats
          const dateValue = record.Date || record.date || record.DATE || record['Date'];
          if (!dateValue) {
            console.warn('⚠️ Record missing date field:', record);
            return false;
          }

          // Parse the record date - handle various formats
          let recordDate;
          if (typeof dateValue === 'string') {
            // Handle common date formats
            if (dateValue.includes('/')) {
              // MM/DD/YYYY or DD/MM/YYYY format
              recordDate = new Date(dateValue);
            } else if (dateValue.includes('-')) {
              // YYYY-MM-DD format
              recordDate = new Date(dateValue);
            } else {
              // Try parsing as-is
              recordDate = new Date(dateValue);
            }
          } else {
            recordDate = new Date(dateValue);
          }

          // Validate the parsed date
          if (isNaN(recordDate.getTime())) {
            console.warn('⚠️ Invalid date in record:', dateValue, record);
            return false;
          }

          // Parse selected date
          const selectedDateObj = new Date(selectedDate + 'T00:00:00'); // Add time to avoid timezone issues

          // Compare dates (ignore time)
          const recordDateString = recordDate.toDateString();
          const selectedDateString = selectedDateObj.toDateString();

          const matches = recordDateString === selectedDateString;

          if (matches) {
            console.log('✅ Date match found:', {
              recordDate: recordDateString,
              selectedDate: selectedDateString,
              originalValue: dateValue
            });
          }

          return matches;

        } catch (error) {
          console.error('❌ Error filtering record by date:', error, record);
          return false;
        }
      });

      console.log(`📅 Filtered ${dailyRecords.length} records for date ${selectedDate} from ${dataSource.records.length} total records`);

      if (dailyRecords.length === 0) {
        console.log(`📅 No data found for ${selectedDate}`);
        this.hideLoading();

        // Show helpful message with suggestions
        const availableDates = this.getAvailableDatesFromData(dataSource.records);
        let message = `No data found for ${selectedDate}.`;

        if (availableDates.length > 0) {
          const recentDates = availableDates.slice(0, 3);
          message += ` Try these dates with data: ${recentDates.join(', ')}`;
        } else {
          message += ' Please check your data or try a different date.';
        }

        this.showNotification(message, 'info');
        this.hideDailyRecap();
        return;
      }

      // Create daily recap data structure
      const dailyData = this.calculateDailyMetrics(dailyRecords);

      this.displayDailyRecap(dailyData);
      this.hideLoading();
      this.showNotification(`Daily recap loaded for ${selectedDate} (${dailyRecords.length} records from ${dataSourceName})`, 'success');

    } catch (error) {
      console.error('❌ Error loading daily recap:', error);
      this.hideLoading();
      this.showNotification(`Failed to load daily recap: ${error.message}`, 'error');
      this.hideDailyRecap();
    }
  }

  /**
   * Suggest alternative dates that might have recap data - CSV Only Mode
   */
  suggestAlternativeRecapDates() {
    try {
      // Use current data source (recap data or main data)
      const dataSource = this.currentRecapData || this.currentData;
      if (!dataSource || !dataSource.records) {
        console.log('📅 No data available for date suggestions');
        return;
      }

      // Get available dates from the data
      const availableDates = this.getAvailableDatesFromData(dataSource.records);

      if (availableDates.length > 0) {
        const suggestions = availableDates.slice(0, 5); // Show up to 5 recent dates
        console.log('📅 Suggested dates with data:', suggestions);
        this.showNotification(`Try these dates with data: ${suggestions.join(', ')}`, 'info');
      } else {
        console.log('📅 No dates found in data');
        this.showNotification('No dates found in the current data. Please check your CSV files.', 'warning');
      }
    } catch (error) {
      console.error('❌ Error suggesting alternative dates:', error);
      this.showNotification('Could not suggest alternative dates', 'error');
    }
  }

  /**
   * Display daily recap data
   */
  displayDailyRecap(dailyData) {
    const { metrics, productBreakdown, customerBreakdown } = dailyData;

    // Show the recap sections
    document.getElementById('daily-metrics-grid').style.display = 'grid';
    document.getElementById('daily-product-breakdown').style.display = 'block';
    document.getElementById('daily-customers-breakdown').style.display = 'block';

    // Update metrics
    document.getElementById('daily-deliveries').textContent = metrics.totalDeliveries;
    document.getElementById('daily-sales').textContent = this.formatCurrency(metrics.totalSales);
    document.getElementById('daily-profit').textContent = this.formatCurrency(metrics.totalProfit);
    document.getElementById('daily-gallons').textContent = this.formatNumber(metrics.totalGallons);
    document.getElementById('daily-customers').textContent = metrics.uniqueCustomers;
    document.getElementById('daily-margin').textContent = metrics.avgProfitMargin.toFixed(1) + '%';

    // Update product breakdown table
    this.updateProductBreakdownTable(productBreakdown);

    // Update customer breakdown table
    this.updateCustomerBreakdownTable(customerBreakdown);
  }

  /**
   * Update product breakdown table
   */
  updateProductBreakdownTable(productBreakdown) {
    const tbody = document.getElementById('daily-product-table-body');
    if (!tbody) {
      console.error('❌ Product table body element not found - check HTML structure');
      return;
    }

    // Clear existing content
    tbody.innerHTML = '';

    // Check if we have data to display
    const productEntries = Object.entries(productBreakdown);
    if (productEntries.length === 0) {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No product data available for this date
        </td>
      `;
      console.log('📊 No product data to display');
      return;
    }

    // Populate table with data
    productEntries.forEach(([product, data]) => {
      const avgPrice = data.gallons > 0 ? data.sales / data.gallons : 0;
      const row = tbody.insertRow();
      row.innerHTML = `
        <td style="font-weight: 500;">${product}</td>
        <td>${this.formatNumber(data.gallons)}</td>
        <td>${this.formatCurrency(data.sales)}</td>
        <td>${this.formatCurrency(data.profit)}</td>
        <td>${this.formatCurrency(avgPrice)}</td>
        <td>${data.count || 0}</td>
      `;
    });

    console.log(`📊 Updated product breakdown table with ${productEntries.length} products`);
  }

  /**
   * Update customer breakdown table
   */
  updateCustomerBreakdownTable(customerBreakdown) {
    const tbody = document.getElementById('daily-customers-table-body');
    if (!tbody) {
      console.error('❌ Customer table body element not found - check HTML structure');
      return;
    }

    // Clear existing content
    tbody.innerHTML = '';

    // Check if we have data to display
    const customerEntries = Object.entries(customerBreakdown);
    if (customerEntries.length === 0) {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No customer data available for this date
        </td>
      `;
      console.log('📊 No customer data to display');
      return;
    }

    // Sort customers by sales and take top 10
    const sortedCustomers = customerEntries
      .sort(([, a], [, b]) => b.sales - a.sales)
      .slice(0, 10);

    sortedCustomers.forEach(([customer, data]) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td style="font-weight: 500;">${customer}</td>
        <td>${data.count || 0}</td>
        <td>${this.formatNumber(data.gallons)}</td>
        <td>${this.formatCurrency(data.sales)}</td>
        <td>${this.formatCurrency(data.profit)}</td>
      `;
    });

    console.log(`📊 Updated customer breakdown table with ${sortedCustomers.length} customers`);
  }

  /**
   * Apply date range filter
   */
  applyDateFilter() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;

    if (!fromDate || !toDate) {
      this.showNotification('Please select both start and end dates', 'warning');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      this.showNotification('Start date must be before end date', 'warning');
      return;
    }

    this.dateFilter = { from: fromDate, to: toDate };
    this.showNotification(`Date filter applied: ${fromDate} to ${toDate}`, 'success');

    // Update all dashboard components with filtered data
    this.updateKPIs();
    this.updateCharts();
    this.updateDataTable();
  }

  /**
   * Clear date range filter
   */
  clearDateFilter() {
    this.dateFilter = null;
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    this.showNotification('Date filter cleared', 'info');

    // Update all dashboard components to show all data
    this.updateKPIs();
    this.updateCharts();
    this.updateDataTable();
  }

  /**
   * Filter data by date range
   */
  getFilteredData() {
    if (!this.currentData || !this.dateFilter) {
      return this.currentData;
    }

    console.log('🔍 Debug: Applying date filter...', this.dateFilter);
    console.log('🔍 Debug: Total records before filter:', this.currentData.records.length);

    const filteredRecords = this.currentData.records.filter(record => {
      const recordDate = new Date(record['Date']);

      // Debug: Log first few dates to see format
      if (this.currentData.records.indexOf(record) < 3) {
        console.log('🔍 Debug: Record date:', record['Date'], '→ Parsed:', recordDate);
      }

      // Skip records with invalid dates
      if (isNaN(recordDate.getTime())) {
        console.log('⚠️ Invalid date found:', record['Date']);
        return false;
      }

      const fromDate = new Date(this.dateFilter.from);
      const toDate = new Date(this.dateFilter.to);

      // Set time to start/end of day for proper comparison
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      const matches = recordDate >= fromDate && recordDate <= toDate;

      // Debug: Log first few comparisons
      if (this.currentData.records.indexOf(record) < 3) {
        console.log('🔍 Debug: Date comparison:', {
          recordDate: recordDate.toDateString(),
          fromDate: fromDate.toDateString(),
          toDate: toDate.toDateString(),
          matches: matches
        });
      }

      return matches;
    });

    console.log(`📅 Date filter result: ${filteredRecords.length} of ${this.currentData.records.length} records match filter`);

    // If no records match, show warning but return all data to prevent blank charts
    if (filteredRecords.length === 0) {
      console.warn('⚠️ No records match the selected date range. Showing all data instead.');
      this.showNotification('No data found for selected date range. Showing all data.', 'warning');
      return this.currentData; // Return all data instead of empty result
    }

    // Create filtered data object
    return {
      ...this.currentData,
      records: filteredRecords,
      summary: this.calculateSummary(filteredRecords)
    };
  }

  /**
   * Show data headers in a modal
   */
  showDataHeaders() {
    if (!this.currentData || !this.currentData.headers) {
      this.showNotification('No data available to show headers', 'warning');
      return;
    }

    const headers = this.currentData.headers;
    const headerList = headers.map((header, index) =>
      `<li><strong>${index + 1}.</strong> ${header}</li>`
    ).join('');

    const modalContent = `
      <div class="data-modal">
        <h3>📊 Data Headers (${headers.length} columns)</h3>
        <ul class="header-list">
          ${headerList}
        </ul>
        <p class="data-info">Total records: ${this.currentData.records?.length || 0}</p>
      </div>
    `;

    this.showModal('Data Headers', modalContent);
  }

  /**
   * Show sample data in a modal
   */
  showSampleData() {
    if (!this.currentData || !this.currentData.records || this.currentData.records.length === 0) {
      this.showNotification('No data available to show sample', 'warning');
      return;
    }

    const sampleSize = Math.min(5, this.currentData.records.length);
    const sampleRecords = this.currentData.records.slice(0, sampleSize);
    const headers = this.currentData.headers || Object.keys(sampleRecords[0]);

    const tableHeaders = headers.map(header => `<th>${header}</th>`).join('');
    const tableRows = sampleRecords.map(record => {
      const cells = headers.map(header => {
        const value = record[header];
        const displayValue = value !== null && value !== undefined ? String(value) : '';
        return `<td>${displayValue.length > 50 ? displayValue.substring(0, 47) + '...' : displayValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const modalContent = `
      <div class="data-modal">
        <h3>📋 Sample Data (${sampleSize} of ${this.currentData.records.length} records)</h3>
        <div class="table-container">
          <table class="sample-data-table">
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.showModal('Sample Data', modalContent);
  }



  /**
   * Calculate summary for filtered data
   */
  calculateSummary(records) {
    const summary = {
      totalSales: 0,
      totalGallons: 0,
      totalProfit: 0,
      totalCost: 0,
      recordCount: records.length,
      customers: new Set(),
      productTypes: new Set(),
      activeCustomers: 0,
      productTypeCount: 0,
      avgProfitMargin: 0,
      avgRevenuePerGallon: 0
    };

    records.forEach(record => {
      summary.totalSales += record['Sales'] || 0;
      summary.totalGallons += record['Gallon Qty'] || 0;
      summary.totalProfit += record['Actual Profit By Item'] || 0;
      summary.totalCost += record['Actual Cost by item'] || 0;

      if (record['Customer']) summary.customers.add(record['Customer']);
      if (record['Product Type']) summary.productTypes.add(record['Product Type']);
    });

    summary.avgProfitMargin = summary.totalSales > 0 ? (summary.totalProfit / summary.totalSales) * 100 : 0;
    summary.avgRevenuePerGallon = summary.totalGallons > 0 ? summary.totalSales / summary.totalGallons : 0;
    summary.activeCustomers = summary.customers.size;
    summary.productTypeCount = summary.productTypes.size;

    return summary;
  }

  /**
   * Calculate daily metrics from filtered records
   */
  calculateDailyMetrics(records) {
    const metrics = {
      totalSales: 0,
      totalGallons: 0,
      totalProfit: 0,
      totalCost: 0,
      totalDeliveries: records.length, // Total number of transactions/deliveries
      transactionCount: records.length,
      uniqueCustomers: 0,
      avgProfitMargin: 0,
      avgRevenuePerGallon: 0
    };

    const productBreakdown = {};
    const customerBreakdown = {};
    const uniqueCustomerSet = new Set();

    records.forEach(record => {
      // Calculate totals
      const sales = this.parseCSVNumber(record.Sales || record.sales || 0);
      const gallons = this.parseCSVNumber(record['Gallon Qty'] || record.gallon_qty || 0);
      const profit = this.parseCSVNumber(record['Actual Profit By Item'] || record.actual_profit || 0);
      const cost = this.parseCSVNumber(record['Actual Cost by item'] || record.actual_cost || 0);

      metrics.totalSales += sales;
      metrics.totalGallons += gallons;
      metrics.totalProfit += profit;
      metrics.totalCost += cost;

      // Product breakdown
      const productType = record['Product Type'] || record.product_type || 'Unknown';
      if (!productBreakdown[productType]) {
        productBreakdown[productType] = { sales: 0, gallons: 0, profit: 0, count: 0 };
      }
      productBreakdown[productType].sales += sales;
      productBreakdown[productType].gallons += gallons;
      productBreakdown[productType].profit += profit;
      productBreakdown[productType].count += 1;

      // Customer breakdown
      const customer = record.Customer || record.customer || 'Unknown';
      uniqueCustomerSet.add(customer); // Track unique customers
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = { sales: 0, gallons: 0, profit: 0, count: 0 };
      }
      customerBreakdown[customer].sales += sales;
      customerBreakdown[customer].gallons += gallons;
      customerBreakdown[customer].profit += profit;
      customerBreakdown[customer].count += 1;
    });

    // Set unique customers count
    metrics.uniqueCustomers = uniqueCustomerSet.size;

    // Calculate averages
    metrics.avgProfitMargin = metrics.totalSales > 0 ? (metrics.totalProfit / metrics.totalSales) * 100 : 0;
    metrics.avgRevenuePerGallon = metrics.totalGallons > 0 ? metrics.totalSales / metrics.totalGallons : 0;

    console.log('📊 Daily metrics calculated:', {
      deliveries: metrics.totalDeliveries,
      customers: metrics.uniqueCustomers,
      sales: metrics.totalSales,
      profit: metrics.totalProfit
    });

    return {
      metrics,
      productBreakdown,
      customerBreakdown,
      records
    };
  }

  /**
   * Hide daily recap sections
   */
  hideDailyRecap() {
    document.getElementById('daily-metrics-grid').style.display = 'none';
    document.getElementById('daily-product-breakdown').style.display = 'none';
    document.getElementById('daily-customers-breakdown').style.display = 'none';
  }

  /**
   * Get available dates from data records
   */
  getAvailableDatesFromData(records) {
    const dates = new Set();

    records.forEach(record => {
      try {
        const dateValue = record.Date || record.date || record.DATE || record['Date'];
        if (dateValue) {
          const recordDate = new Date(dateValue);
          if (!isNaN(recordDate.getTime())) {
            // Format as YYYY-MM-DD for consistency
            const formattedDate = recordDate.toISOString().split('T')[0];
            dates.add(formattedDate);
          }
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // Convert to array and sort (most recent first)
    return Array.from(dates).sort().reverse();
  }

  /**
   * Get date N business days ago (skipping weekends)
   * @param {number} businessDays - Number of business days to go back
   * @returns {string} Date in YYYY-MM-DD format
   */
  getBusinessDaysAgo(businessDays) {
    const today = new Date();
    let currentDate = new Date(today);
    let daysBack = 0;

    while (daysBack < businessDays) {
      currentDate.setDate(currentDate.getDate() - 1);

      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysBack++;
      }
    }

    return currentDate.toISOString().split('T')[0];
  }

  /**
   * Try to set a default recap date that has actual data - CSV Only Mode
   */
  setDefaultRecapDateWithData() {
    try {
      // Use current data source (recap data or main data)
      const dataSource = this.currentRecapData || this.currentData;
      if (!dataSource || !dataSource.records) {
        console.log('📅 No data available for default date setting');
        return;
      }

      // Get available dates from the data
      const availableDates = this.getAvailableDatesFromData(dataSource.records);

      if (availableDates.length > 0) {
        // Set the most recent date as default
        const mostRecentDate = availableDates[0];
        const recapDateInput = document.getElementById('recap-date');
        if (recapDateInput) {
          recapDateInput.value = mostRecentDate;
          console.log(`📅 Set default recap date to most recent: ${mostRecentDate}`);
        }
      } else {
        console.log('📅 No dates found in data for default setting');
      }
    } catch (error) {
      console.error('❌ Error setting default recap date:', error);
    }
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats() {
    if (!this.currentData) return null;

    return {
      totalRecords: this.currentData.records.length,
      dataSourceId: this.currentData.datasetName || 'CSV Upload',
      lastUpdate: new Date().toISOString(),
      summary: this.currentData.summary
    };
  }

  /**
   * Show a modal dialog
   */
  showModal(title, content) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2>${title}</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add click outside to close
    const overlay = document.querySelector('.modal-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Execute AI query on the data
   */
  async executeAIQuery() {
    const queryInput = document.getElementById('natural-query-input');
    const resultsContainer = document.getElementById('query-results');
    const resultsContent = document.getElementById('results-content');
    const executeBtn = document.getElementById('execute-query-btn');

    if (!queryInput || !queryInput.value.trim()) {
      this.showNotification('Please enter a question about your data', 'warning');
      return;
    }

    const query = queryInput.value.trim();

    try {
      // Show loading state
      executeBtn.disabled = true;
      executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
      resultsContainer.style.display = 'block';
      resultsContent.innerHTML = '<div class="loading-message"><i class="fas fa-brain"></i> AI is analyzing your data...</div>';

      // Use selected AI data if available, otherwise use current data
      const dataToAnalyze = this.selectedAIData || this.currentData;

      if (!dataToAnalyze || !dataToAnalyze.records) {
        throw new Error('No data available. Please select a dataset first.');
      }

      // Process AI query with selected data
      const response = await this.processAIQuery(query, dataToAnalyze);

      // Display results
      resultsContent.innerHTML = this.formatAIResponse(response);

    } catch (error) {
      console.error('AI Query Error:', error);
      resultsContent.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Sorry, I couldn't process your question right now. Please try again or rephrase your question.</p>
        </div>
      `;
    } finally {
      // Reset button
      executeBtn.disabled = false;
      executeBtn.innerHTML = '<i class="fas fa-search"></i> Ask AI';
    }
  }

  /**
   * Process AI query (mock implementation)
   */
  async processAIQuery(query, dataToAnalyze = null) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const currentData = dataToAnalyze || this.getFilteredData() || this.currentData;
    if (!currentData || !currentData.records) {
      throw new Error('No data available');
    }

    console.log(`🤖 Processing AI query with ${currentData.records.length} records`);

    // Simple pattern matching for common queries
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('top') && lowerQuery.includes('customer')) {
      return this.getTopCustomersAnalysis(currentData);
    } else if (lowerQuery.includes('profit') && lowerQuery.includes('trend')) {
      return this.getProfitTrendAnalysis(currentData);
    } else if (lowerQuery.includes('sales') && lowerQuery.includes('month')) {
      return this.getMonthlySalesAnalysis(currentData);
    } else if (lowerQuery.includes('product') && lowerQuery.includes('type')) {
      return this.getProductTypeAnalysis(currentData);
    } else if (lowerQuery.includes('highest') && lowerQuery.includes('sales')) {
      return this.getHighestSalesAnalysis(currentData);
    } else {
      return this.getGeneralDataSummary(currentData);
    }
  }

  /**
   * Get top customers analysis for AI - CSV Only Mode
   */
  getTopCustomersAnalysis(data) {
    const customerSales = {};

    // Calculate customer totals from current data
    const records = data.records || [];
    records.forEach(record => {
      const customer = record.Customer || record.customer || 'Unknown';
      const sales = this.parseCSVNumber(record.Sales || record.sales || 0);
      const profit = this.parseCSVNumber(record['Actual Profit By Item'] || record.profit || 0);

      if (!customerSales[customer]) {
        customerSales[customer] = { name: customer, sales: 0, profit: 0 };
      }
      customerSales[customer].sales += sales;
      customerSales[customer].profit += profit;
    });

    // Get top 5 customers
    const customers = Object.values(customerSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      type: 'top_customers',
      title: 'Top 5 Customers by Sales',
      data: customers,
      summary: customers.length > 0 ?
        `Your top customer is ${customers[0]?.name} with $${customers[0]?.sales?.toLocaleString()} in sales.` :
        'No customer data available.'
    };
  }

  /**
   * Get profit trend analysis for AI
   */
  getProfitTrendAnalysis(data) {
    // Simple CSV-only implementation
    const records = data.records || [];
    const totalProfit = records.reduce((sum, record) =>
      sum + this.parseCSVNumber(record['Actual Profit By Item'] || record.actual_profit || 0), 0);
    const avgProfit = records.length > 0 ? totalProfit / records.length : 0;

    return {
      type: 'profit_trend',
      title: 'Profit Trend Analysis',
      data: [{ period: 'Current', profit: totalProfit }],
      summary: `Total profit: $${totalProfit.toLocaleString()}. Average per transaction: $${avgProfit.toLocaleString()}.`
    };
  }

  /**
   * Get monthly sales analysis for AI
   */
  getMonthlySalesAnalysis(data) {
    // Simple CSV-only implementation
    const records = data.records || [];
    const totalSales = records.reduce((sum, record) =>
      sum + this.parseCSVNumber(record.Sales || record.sales || 0), 0);

    return {
      type: 'monthly_sales',
      title: 'Monthly Sales Analysis',
      data: [{ period: 'Current', sales: totalSales }],
      summary: `Total sales: $${totalSales.toLocaleString()} across ${records.length} transactions.`
    };
  }

  /**
   * Get product type analysis for AI
   */
  getProductTypeAnalysis(data) {
    // Simple CSV-only implementation
    const productSales = {};
    const records = data.records || [];

    records.forEach(record => {
      const productType = record['Product Type'] || record.product_type || 'Unknown';
      const sales = this.parseCSVNumber(record.Sales || record.sales || 0);

      if (!productSales[productType]) {
        productSales[productType] = { type: productType, sales: 0 };
      }
      productSales[productType].sales += sales;
    });

    const products = Object.values(productSales).sort((a, b) => b.sales - a.sales);
    const topProduct = products[0];

    return {
      type: 'product_analysis',
      title: 'Product Type Analysis',
      data: products,
      summary: topProduct ?
        `You sell ${products.length} different product types. ${topProduct.type} is your best seller with $${topProduct.sales.toLocaleString()} in sales.` :
        'No product data available.'
    };
  }

  /**
   * Get highest sales analysis for AI
   */
  getHighestSalesAnalysis(data) {
    const records = data.records.sort((a, b) => (b.Sales || 0) - (a.Sales || 0)).slice(0, 5);
    return {
      type: 'highest_sales',
      title: 'Highest Sales Transactions',
      data: records,
      summary: `Your highest single sale was $${records[0]?.Sales?.toLocaleString()} to ${records[0]?.Customer}.`
    };
  }

  /**
   * Get general data summary for AI
   */
  getGeneralDataSummary(data) {
    const summary = this.calculateSummary(data.records);
    return {
      type: 'general_summary',
      title: 'Data Summary',
      data: summary,
      summary: `You have ${summary.recordCount} transactions totaling $${summary.totalSales.toLocaleString()} in sales with ${summary.activeCustomers} active customers.`
    };
  }

  /**
   * Format AI response for display
   */
  formatAIResponse(response) {
    let html = `
      <div class="ai-response">
        <div class="ai-response-header">
          <i class="fas fa-robot"></i>
          <h4>${response.title}</h4>
        </div>
        <div class="ai-summary">
          <p>${response.summary}</p>
        </div>
    `;

    // Add specific formatting based on response type
    if (response.type === 'top_customers' && response.data.length > 0) {
      html += '<div class="ai-data-table"><h5>Customer Details:</h5><ul>';
      response.data.forEach((customer, index) => {
        const sales = customer.sales || 0;
        const profit = customer.profit || 0;
        html += `<li>${index + 1}. ${customer.name} - $${sales.toLocaleString()} sales, $${profit.toLocaleString()} profit</li>`;
      });
      html += '</ul></div>';
    } else if (response.type === 'product_analysis' && response.data.length > 0) {
      html += '<div class="ai-data-table"><h5>Product Breakdown:</h5><ul>';
      response.data.forEach(product => {
        const sales = product.sales || 0;
        html += `<li>${product.type} - $${sales.toLocaleString()} sales</li>`;
      });
      html += '</ul></div>';
    } else if (response.type === 'highest_sales' && response.data.length > 0) {
      html += '<div class="ai-data-table"><h5>Top Transactions:</h5><ul>';
      response.data.forEach((record, index) => {
        const sales = record.Sales || 0;
        const customer = record.Customer || 'Unknown';
        const productType = record['Product Type'] || 'Unknown';
        html += `<li>${index + 1}. $${sales.toLocaleString()} - ${customer} (${productType})</li>`;
      });
      html += '</ul></div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Load GP time series charts
   */
  async loadGPCharts() {
    try {
      console.log('📊 Loading GP time series charts...');

      let gp2024Data, gp2025Data;

      // Load from Railway database
      console.log('🚀 Loading GP data from Railway database...');
      const [gp2024Response, gp2025Response] = await Promise.all([
        this.databaseService.getGPData('2024'),
        this.databaseService.getGPData('2025')
      ]);

      gp2024Data = gp2024Response;
      gp2025Data = gp2025Response;

      console.log('🔍 Debug GP Data 2024:', gp2024Data);
      console.log('🔍 Debug GP Data 2025:', gp2025Data);

      if (gp2024Data && gp2025Data) {
        console.log('📊 Creating GP charts with data...');
        await this.createGPComparisonChart(gp2024Data, gp2025Data);
        this.createGPTimelineChart(gp2024Data, gp2025Data);
      } else {
        console.warn('⚠️ GP data not loaded properly:', { gp2024Data, gp2025Data });
        this.showNotification('GP data sheets not found or empty', 'warning');
      }

    } catch (error) {
      console.error('Error loading GP charts:', error);
      this.showNotification('Could not load GP time series charts', 'warning');
    }
  }

  /**
   * Update GP charts when period changes
   */
  async updateGPCharts() {
    await this.loadGPCharts();
  }

  /**
   * Create GP comparison chart (2024 vs 2025)
   */
  async createGPComparisonChart(data2024, data2025) {
    const canvas = document.getElementById('gp-comparison-chart');
    if (!canvas) return;

    const period = document.getElementById('gp-period-selector')?.value || 'monthly';

    // Prepare comparison data
    const trends2024 = await this.dataService.getSalesTrendData(data2024, period);
    const trends2025 = await this.dataService.getSalesTrendData(data2025, period);

    console.log('🔍 Debug GP Trends 2024:', trends2024);
    console.log('🔍 Debug GP Trends 2025:', trends2025);

    // Create month mapping for comparison
    const monthMap2024 = {};
    const monthMap2025 = {};

    trends2024.forEach(item => {
      monthMap2024[item.period] = item.sales;
    });

    trends2025.forEach(item => {
      monthMap2025[item.period] = item.sales;
    });

    // Get all unique periods and sort them
    const allPeriods = [...new Set([...trends2024.map(t => t.period), ...trends2025.map(t => t.period)])].sort();

    const labels = allPeriods.map(period => {
      if (period.includes('-')) {
        const [year, month] = period.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
      return period;
    });

    const sales2024 = allPeriods.map(period => monthMap2024[period] || 0);
    const sales2025 = allPeriods.map(period => monthMap2025[period] || 0);

    // Destroy existing chart if it exists
    if (this.gpComparisonChart) {
      this.gpComparisonChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.gpComparisonChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '2024 Sales',
            data: sales2024,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: '2025 Sales',
            data: sales2025,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${period.charAt(0).toUpperCase() + period.slice(1)} Sales Comparison`,
            color: '#ffffff'
          },
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: {
              color: '#ffffff',
              callback: function (value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create GP timeline chart (combined view)
   */
  createGPTimelineChart(data2024, data2025) {
    const canvas = document.getElementById('gp-timeline-chart');
    if (!canvas) return;

    // Combine all data points chronologically
    const allRecords = [
      ...data2024.records.map(r => ({ ...r, year: '2024' })),
      ...data2025.records.map(r => ({ ...r, year: '2025' }))
    ];

    // Sort by date
    allRecords.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Group by month for timeline
    const monthlyData = {};
    allRecords.forEach(record => {
      const date = new Date(record.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { sales: 0, profit: 0, count: 0 };
      }

      monthlyData[monthKey].sales += record.Sales || 0;
      monthlyData[monthKey].profit += record['Actual Profit By Item'] || 0;
      monthlyData[monthKey].count++;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    });

    const salesData = sortedMonths.map(month => monthlyData[month].sales);
    const profitData = sortedMonths.map(month => monthlyData[month].profit);

    // Destroy existing chart if it exists
    if (this.gpTimelineChart) {
      this.gpTimelineChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.gpTimelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sales Revenue',
            data: salesData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Profit',
            data: profitData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Combined GP Data Timeline (2024-2025)',
            color: '#ffffff'
          },
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: '#ffffff',
              callback: function (value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
              color: '#ffffff',
              callback: function (value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /**
   * Set up navigation dropdown functionality
   */
  setupNavigationDropdown() {
    const dropdownBtn = document.getElementById('nav-dropdown-btn');
    const dropdownMenu = document.getElementById('nav-dropdown-menu');

    if (!dropdownBtn || !dropdownMenu) return;

    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('show');

      if (isOpen) {
        this.closeNavigationDropdown();
      } else {
        this.openNavigationDropdown();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        this.closeNavigationDropdown();
      }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeNavigationDropdown();
      }
    });

    // Prevent dropdown from closing when clicking inside
    dropdownMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Open navigation dropdown
   */
  openNavigationDropdown() {
    const dropdownBtn = document.getElementById('nav-dropdown-btn');
    const dropdownMenu = document.getElementById('nav-dropdown-menu');

    if (dropdownBtn && dropdownMenu) {
      dropdownBtn.classList.add('active');
      dropdownMenu.classList.add('show');
    }
  }

  /**
   * Close navigation dropdown
   */
  closeNavigationDropdown() {
    const dropdownBtn = document.getElementById('nav-dropdown-btn');
    const dropdownMenu = document.getElementById('nav-dropdown-menu');

    if (dropdownBtn && dropdownMenu) {
      dropdownBtn.classList.remove('active');
      dropdownMenu.classList.remove('show');
    }
  }



  /**
   * Process and normalize date values for consistent formatting
   */
  normalizeDate(dateValue) {
    if (!dateValue) return '';

    // Handle JavaScript Date objects
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Handle Date constructor strings like "Date(2025,0,3)"
    if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) + 1; // JavaScript months are 0-based
        const day = parseInt(match[3]);
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }

    // Handle date strings
    if (typeof dateValue === 'string') {
      const cleanDate = dateValue.trim();

      // Handle MM/DD/YYYY format
      if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [month, day, year] = cleanDate.split('/');
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      // Handle YYYY-MM-DD format
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
          return cleanDate; // Already in correct format
        }
      }

      // Try general date parsing
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        return date.toISOString().split('T')[0];
      }
    }

    // Return original value if can't parse
    return String(dateValue);
  }



  /**
   * Run comprehensive dashboard tests
   */
  async runDashboardTests() {
    console.log('🧪 Starting comprehensive dashboard tests...');

    const testResults = {
      dataLoading: false,
      dateFiltering: false,
      chartRendering: false,
      sheetSwitching: false,
      kpiUpdates: false
    };

    try {
      // Test 1: Data Loading
      console.log('🧪 Test 1: Data Loading');
      if (this.currentData && this.currentData.records && this.currentData.records.length > 0) {
        testResults.dataLoading = true;
        console.log('✅ Data loading: PASS');
      } else {
        console.log('❌ Data loading: FAIL - No data loaded');
      }

      // Test 2: Date Filtering
      console.log('🧪 Test 2: Date Filtering');
      const originalRecordCount = this.currentData?.records?.length || 0;
      this.dateFilter = { from: '2024-01-01', to: '2024-12-31' };
      const filteredData = this.getFilteredData();
      if (filteredData && filteredData.records) {
        testResults.dateFiltering = true;
        console.log('✅ Date filtering: PASS');
        console.log(`📊 Original records: ${originalRecordCount}, Filtered: ${filteredData.records.length}`);
      } else {
        console.log('❌ Date filtering: FAIL');
      }
      this.dateFilter = null; // Reset

      // Test 3: Chart Rendering
      console.log('🧪 Test 3: Chart Rendering');
      const chartElements = ['sales-chart', 'product-chart', 'customer-chart', 'profit-chart'];
      let chartsRendered = 0;
      chartElements.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas && this.chartManager.charts[chartId]) {
          chartsRendered++;
        }
      });
      if (chartsRendered >= 2) { // At least 2 charts should render
        testResults.chartRendering = true;
        console.log(`✅ Chart rendering: PASS (${chartsRendered}/${chartElements.length} charts)`);
      } else {
        console.log(`❌ Chart rendering: FAIL (${chartsRendered}/${chartElements.length} charts)`);
      }

      // Test 4: Sheet Switching
      console.log('🧪 Test 4: Sheet Switching');
      const availableSheets = this.dataService.getAvailableSheets();
      if (availableSheets.length >= 4) {
        testResults.sheetSwitching = true;
        console.log('✅ Sheet switching: PASS');
        console.log('📋 Available sheets:', availableSheets);
      } else {
        console.log('❌ Sheet switching: FAIL - Not all sheets available');
      }

      // Test 5: KPI Updates
      console.log('🧪 Test 5: KPI Updates');
      const kpiElements = ['total-sales', 'total-gallons', 'profit-margin', 'active-customers'];
      let kpisUpdated = 0;
      kpiElements.forEach(kpiId => {
        const element = document.getElementById(kpiId);
        if (element && element.textContent !== '$0.00' && element.textContent !== '0' && element.textContent !== '0.0%') {
          kpisUpdated++;
        }
      });
      if (kpisUpdated >= 2) {
        testResults.kpiUpdates = true;
        console.log(`✅ KPI updates: PASS (${kpisUpdated}/${kpiElements.length} KPIs)`);
      } else {
        console.log(`❌ KPI updates: FAIL (${kpisUpdated}/${kpiElements.length} KPIs)`);
      }

    } catch (error) {
      console.error('🧪 Test error:', error);
    }

    // Summary
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log('🧪 Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log('📊 Detailed results:', testResults);

    if (passedTests === totalTests) {
      this.showNotification('All dashboard tests passed! 🎉', 'success');
    } else {
      this.showNotification(`${passedTests}/${totalTests} tests passed. Check console for details.`, 'warning');
    }

    return testResults;
  }

  /**
   * Update data explorer with current dataset
   */
  updateDataExplorer() {
    if (!this.currentData || !this.currentData.headers || !this.currentData.records) {
      console.log('📊 No data available for data explorer');
      this.clearDataExplorer();
      return;
    }

    console.log('📊 Updating data explorer with current dataset');

    // Populate axis dropdowns with field names
    this.populateAxisDropdowns(this.currentData.headers);

    // Update headers display
    this.updateHeadersDisplay(this.currentData.headers);

    // Update sample data display
    this.updateSampleDataDisplay(this.currentData.records, this.currentData.headers);
  }

  /**
   * Clear data explorer when no data is available
   */
  clearDataExplorer() {
    // Clear axis dropdowns
    const xAxisSelect = document.getElementById('x-axis-select');
    const yAxisSelect = document.getElementById('y-axis-select');
    const groupBySelect = document.getElementById('group-by-select');

    if (xAxisSelect) xAxisSelect.innerHTML = '<option value="">No data available</option>';
    if (yAxisSelect) yAxisSelect.innerHTML = '<option value="">No data available</option>';
    if (groupBySelect) groupBySelect.innerHTML = '<option value="">None</option>';

    // Clear displays
    const headersDisplay = document.getElementById('headers-display');
    const sampleDisplay = document.getElementById('sample-data-display');

    if (headersDisplay) headersDisplay.style.display = 'none';
    if (sampleDisplay) sampleDisplay.style.display = 'none';
  }

  /**
   * Populate axis dropdown menus with field names
   */
  populateAxisDropdowns(headers) {
    const xAxisSelect = document.getElementById('x-axis-select');
    const yAxisSelect = document.getElementById('y-axis-select');
    const groupBySelect = document.getElementById('group-by-select');

    if (!xAxisSelect || !yAxisSelect || !groupBySelect) {
      console.warn('⚠️ Axis dropdown elements not found');
      return;
    }

    // Clear existing options
    xAxisSelect.innerHTML = '<option value="">Select X-Axis Field</option>';
    yAxisSelect.innerHTML = '<option value="">Select Y-Axis Field</option>';
    groupBySelect.innerHTML = '<option value="">None</option>';

    // Add field options
    headers.forEach(header => {
      // X-Axis options (all fields)
      const xOption = document.createElement('option');
      xOption.value = header;
      xOption.textContent = header;
      xAxisSelect.appendChild(xOption);

      // Y-Axis options (all fields)
      const yOption = document.createElement('option');
      yOption.value = header;
      yOption.textContent = header;
      yAxisSelect.appendChild(yOption);

      // Group By options (all fields)
      const groupOption = document.createElement('option');
      groupOption.value = header;
      groupOption.textContent = header;
      groupBySelect.appendChild(groupOption);
    });

    console.log(`📊 Populated axis dropdowns with ${headers.length} fields`);
  }

  /**
   * Update headers display
   */
  updateHeadersDisplay(headers) {
    const headersGrid = document.getElementById('headers-grid');

    if (!headersGrid) {
      console.warn('⚠️ Headers grid element not found');
      return;
    }

    headersGrid.innerHTML = headers.map((header, index) =>
      `<div class="header-item">
        <span class="header-number">${index + 1}</span>
        <span class="header-name">${header}</span>
      </div>`
    ).join('');
  }

  /**
   * Update sample data display
   */
  updateSampleDataDisplay(records, headers) {
    const sampleTableHead = document.getElementById('sample-table-head');
    const sampleTableBody = document.getElementById('sample-table-body');

    if (!sampleTableHead || !sampleTableBody) {
      console.warn('⚠️ Sample table elements not found');
      return;
    }

    // Update headers
    sampleTableHead.innerHTML = `<tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>`;

    // Update body with first 10 records
    const sampleRecords = records.slice(0, 10);
    sampleTableBody.innerHTML = sampleRecords.map(record =>
      `<tr>${headers.map(header => {
        const value = record[header];
        const displayValue = value !== null && value !== undefined ? String(value) : '';
        return `<td>${displayValue.length > 30 ? displayValue.substring(0, 27) + '...' : displayValue}</td>`;
      }).join('')}</tr>`
    ).join('');
  }

  /**
   * Universal data selector - populate any selector with available datasets
   */
  populateUniversalDataSelector(selectorId, includeFiltered = true, includeRecap = false) {
    const selector = document.getElementById(selectorId);
    if (!selector) {
      console.warn(`⚠️ Data selector ${selectorId} not found`);
      return;
    }

    // Clear existing options
    selector.innerHTML = '<option value="">Select Dataset...</option>';

    // Add current data if available
    if (this.currentData && this.currentData.records) {
      const option = document.createElement('option');
      option.value = 'current';
      option.textContent = `Current Data (${this.currentData.records.length} records)`;
      selector.appendChild(option);
    }

    // Add filtered data if available and requested
    if (includeFiltered && this.filteredData && this.filteredData.records) {
      const option = document.createElement('option');
      option.value = 'filtered';
      option.textContent = `Filtered Data (${this.filteredData.records.length} records)`;
      selector.appendChild(option);
    }

    // Add recap data if available and requested
    if (includeRecap && this.currentRecapData && this.currentRecapData.records) {
      const option = document.createElement('option');
      option.value = 'recap';
      option.textContent = `Recap Data (${this.currentRecapData.records.length} records)`;
      selector.appendChild(option);
    }

    // Add other available datasets from uploaded files
    if (this.uploadedFiles && this.uploadedFiles.length > 0) {
      this.uploadedFiles.forEach((file, index) => {
        if (file.data && file.data.records) {
          const option = document.createElement('option');
          option.value = `file_${index}`;
          option.textContent = `${file.name} (${file.data.records.length} records)`;
          selector.appendChild(option);
        }
      });
    }

    // Add uploaded recap datasets if available and requested
    if (includeRecap && this.uploadedRecapDatasets) {
      Object.entries(this.uploadedRecapDatasets).forEach(([name, data]) => {
        if (data && data.records) {
          const option = document.createElement('option');
          option.value = `recap_${name}`;
          option.textContent = `${name} Recap (${data.records.length} records)`;
          selector.appendChild(option);
        }
      });
    }

    console.log(`📊 Universal data selector ${selectorId} populated`);
  }

  /**
   * Get dataset from universal selector value
   */
  getDatasetFromSelectorValue(selectorValue) {
    if (!selectorValue) return null;

    if (selectorValue === 'current') {
      return this.currentData;
    } else if (selectorValue === 'filtered') {
      return this.filteredData;
    } else if (selectorValue === 'recap') {
      return this.currentRecapData;
    } else if (selectorValue.startsWith('file_')) {
      const fileIndex = parseInt(selectorValue.replace('file_', ''));
      return this.uploadedFiles[fileIndex]?.data;
    } else if (selectorValue.startsWith('recap_')) {
      const recapName = selectorValue.replace('recap_', '');
      return this.uploadedRecapDatasets[recapName];
    }

    return null;
  }

  /**
   * Populate chart data selector with available datasets (legacy method)
   */
  populateChartDataSelector() {
    this.populateUniversalDataSelector('chart-data-select', true, false);
  }

  /**
   * Handle chart data source change
   */
  onChartDataSourceChange() {
    const selector = document.getElementById('chart-data-select');
    const selectedValue = selector?.value;

    if (!selectedValue) {
      this.clearChartBuilderFields();
      return;
    }

    // Use universal data selector method
    const selectedData = this.getDatasetFromSelectorValue(selectedValue);

    if (selectedData && selectedData.records) {
      this.populateChartBuilderFields(selectedData.headers || Object.keys(selectedData.records[0] || {}));
      this.selectedChartData = selectedData;
      console.log(`📊 Selected chart data source: ${selectedValue} (${selectedData.records.length} records)`);
    } else {
      this.clearChartBuilderFields();
      this.showNotification('Selected dataset is not available', 'warning');
    }
  }

  /**
   * Handle AI data source change
   */
  onAIDataSourceChange() {
    const selector = document.getElementById('ai-data-select');
    const selectedValue = selector?.value;

    if (!selectedValue) {
      this.selectedAIData = null;
      return;
    }

    // Use universal data selector method
    const selectedData = this.getDatasetFromSelectorValue(selectedValue);

    if (selectedData && selectedData.records) {
      this.selectedAIData = selectedData;
      console.log(`🤖 Selected AI data source: ${selectedValue} (${selectedData.records.length} records)`);
      this.showNotification(`AI will analyze ${selectedData.records.length} records from selected dataset`, 'info');
    } else {
      this.selectedAIData = null;
      this.showNotification('Selected dataset is not available for AI analysis', 'warning');
    }
  }

  /**
   * Populate chart builder field selectors
   */
  populateChartBuilderFields(headers) {
    const xAxisSelect = document.getElementById('x-axis-select');
    const yAxisSelect = document.getElementById('y-axis-select');
    const groupBySelect = document.getElementById('group-by-select');

    // Clear existing options
    [xAxisSelect, yAxisSelect, groupBySelect].forEach(select => {
      if (select) {
        select.innerHTML = '';
        if (select.id === 'group-by-select') {
          select.innerHTML = '<option value="">None</option>';
        }
      }
    });

    // Add header options
    headers.forEach(header => {
      [xAxisSelect, yAxisSelect, groupBySelect].forEach(select => {
        if (select) {
          const option = document.createElement('option');
          option.value = header;
          option.textContent = header;
          select.appendChild(option);
        }
      });
    });

    console.log(`📊 Chart builder fields populated with ${headers.length} options`);
  }

  /**
   * Clear chart builder field selectors
   */
  clearChartBuilderFields() {
    const selectors = ['x-axis-select', 'y-axis-select', 'group-by-select'];
    selectors.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.innerHTML = '';
        if (id === 'group-by-select') {
          select.innerHTML = '<option value="">None</option>';
        }
      }
    });
    this.selectedChartData = null;
  }

  /**
   * Create custom chart based on user selections
   */
  createCustomChart() {
    const dataSource = document.getElementById('chart-data-select').value;
    const chartType = document.getElementById('chart-type-select').value;
    const xAxis = document.getElementById('x-axis-select').value;
    const yAxis = document.getElementById('y-axis-select').value;
    const groupBy = document.getElementById('group-by-select').value;

    if (!dataSource) {
      this.showNotification('Please select a data source first', 'warning');
      return;
    }

    if (!this.selectedChartData || !this.selectedChartData.records) {
      this.showNotification('Selected data source is not available', 'warning');
      return;
    }

    if (!xAxis || !yAxis) {
      this.showNotification('Please select both X-Axis and Y-Axis fields', 'warning');
      return;
    }

    try {
      console.log(`📊 Creating custom ${chartType} chart: ${xAxis} vs ${yAxis} from ${dataSource}`);

      // Process data for chart
      const chartData = this.processDataForCustomChart(this.selectedChartData.records, xAxis, yAxis, groupBy);

      // Create chart
      this.renderCustomChart(chartType, chartData, xAxis, yAxis, groupBy);

      // Show chart container
      const chartContainer = document.getElementById('custom-chart-container');
      if (chartContainer) {
        chartContainer.style.display = 'block';
      }

      this.showNotification(`Custom ${chartType} chart created successfully!`, 'success');

    } catch (error) {
      console.error('❌ Error creating custom chart:', error);
      this.showNotification('Error creating custom chart: ' + error.message, 'error');
    }
  }

  /**
   * Process data for custom chart creation
   */
  processDataForCustomChart(records, xField, yField, groupByField) {
    const processedData = {};

    records.forEach(record => {
      const xValue = record[xField];
      const yValue = this.parseCSVNumber(record[yField]);
      const groupValue = groupByField ? record[groupByField] : 'All Data';

      if (xValue !== null && xValue !== undefined && !isNaN(yValue)) {
        if (!processedData[groupValue]) {
          processedData[groupValue] = {};
        }

        if (!processedData[groupValue][xValue]) {
          processedData[groupValue][xValue] = [];
        }

        processedData[groupValue][xValue].push(yValue);
      }
    });

    // Aggregate data (sum for now, could be configurable)
    Object.keys(processedData).forEach(group => {
      Object.keys(processedData[group]).forEach(xVal => {
        const values = processedData[group][xVal];
        processedData[group][xVal] = values.reduce((sum, val) => sum + val, 0);
      });
    });

    return processedData;
  }

  /**
   * Render custom chart using Chart.js
   */
  renderCustomChart(chartType, data, xField, yField, groupByField) {
    const canvas = document.getElementById('custom-chart');

    if (!canvas) {
      console.error('❌ Custom chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (this.customChart) {
      this.customChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Get theme-aware colors for maximum visibility
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    const themeColors = {
      text: isDarkTheme ? '#ffffff' : '#000000', // Pure white for dark theme, pure black for light theme
      background: isDarkTheme ? '#2d3748' : '#ffffff',
      border: isDarkTheme ? '#64748b' : '#e2e8f0', // More visible borders
      grid: isDarkTheme ? 'rgba(255, 255, 255, 0.4)' : '#f1f5f9' // Even brighter grid lines
    };

    // Prepare Chart.js data
    const datasets = [];
    const colors = ['#0077cc', '#ff6b35', '#ffd700', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
    let colorIndex = 0;

    Object.keys(data).forEach(group => {
      const groupData = data[group];
      const labels = Object.keys(groupData).sort();
      const values = labels.map(label => groupData[label]);

      datasets.push({
        label: group,
        data: chartType === 'scatter' ?
          labels.map((label, index) => ({ x: label, y: values[index] })) :
          values,
        backgroundColor: colors[colorIndex % colors.length] + '80',
        borderColor: colors[colorIndex % colors.length],
        borderWidth: 2,
        fill: chartType === 'area'
      });

      colorIndex++;
    });

    const chartConfig = {
      type: chartType === 'area' ? 'line' : chartType,
      data: {
        labels: chartType === 'scatter' ? undefined : Object.keys(data[Object.keys(data)[0]]).sort(),
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${xField} vs ${yField}${groupByField ? ` (Grouped by ${groupByField})` : ''}`,
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: Object.keys(data).length > 1,
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xField,
              color: themeColors.text,
              font: { size: 16, weight: 'bold' }
            },
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              font: { size: 14, weight: 'bold' }
            }
          },
          y: {
            title: {
              display: true,
              text: yField,
              color: themeColors.text,
              font: { size: 16, weight: 'bold' }
            },
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              font: { size: 14, weight: 'bold' }
            }
          }
        }
      }
    };

    this.customChart = new Chart(ctx, chartConfig);
    console.log('📊 Custom chart rendered successfully');

    // Force update chart text colors after creation
    setTimeout(() => {
      this.forceChartTextVisibility(this.customChart);
    }, 100);
  }

  /**
   * Force chart text to be visible by directly manipulating canvas elements
   */
  forceChartTextVisibility(chart) {
    if (!chart || !chart.canvas) return;

    try {
      const isDarkTheme = document.documentElement.classList.contains('dark-theme');
      if (!isDarkTheme) return; // Only needed for dark theme

      // Force redraw with white text
      chart.options.scales.x.ticks.color = '#ffffff';
      chart.options.scales.y.ticks.color = '#ffffff';
      chart.options.scales.x.title.color = '#ffffff';
      chart.options.scales.y.title.color = '#ffffff';
      chart.options.plugins.title.color = '#ffffff';
      chart.options.plugins.legend.labels.color = '#ffffff';

      // Update the chart
      chart.update('none');

      console.log('🎨 Forced chart text visibility update');
    } catch (error) {
      console.warn('⚠️ Could not force chart text visibility:', error);
    }
  }

  /**
   * Populate filter dropdowns with unique values from current data
   */
  populateFilterDropdowns() {
    if (!this.currentData || !this.currentData.records) {
      console.log('📊 No data available for filter dropdowns');
      this.clearFilterDropdowns();
      return;
    }

    const records = this.currentData.records;
    console.log('📊 Populating filter dropdowns with data');

    // Extract unique values for each filter
    const drivers = [...new Set(records.map(r => r.Driver || r.driver || r.Employee || r.employee).filter(v => v))];
    const customers = [...new Set(records.map(r => r.Customer || r.customer).filter(v => v))];
    const products = [...new Set(records.map(r => r['Product Type'] || r.product_type || r.Product || r.product).filter(v => v))];
    const locations = [...new Set(records.map(r => r.Location || r.location || r.City || r.city || r.State || r.state).filter(v => v))];

    // Populate explorer filters
    this.populateDropdown('driver-filter', drivers);
    this.populateDropdown('customer-filter', customers);
    this.populateDropdown('product-filter-explorer', products);
    this.populateDropdown('location-filter', locations);

    // Populate recap filters
    this.populateDropdown('recap-driver-filter', drivers, false);
    this.populateDropdown('recap-customer-filter', customers, false);
    this.populateDropdown('recap-product-filter', products, false);
    this.populateDropdown('recap-location-filter', locations, false);

    // Populate location mapping product filter
    this.populateDropdown('map-product-select', products, false);

    // Populate chart builder data selector
    this.populateChartDataSelector();

    // Populate AI data selector
    this.populateUniversalDataSelector('ai-data-select', true, true);

    // Set date range defaults
    this.setDateRangeDefaults(records);

    console.log(`📊 Populated filters: ${drivers.length} drivers, ${customers.length} customers, ${products.length} products, ${locations.length} locations`);
  }

  /**
   * Populate a single dropdown with options
   */
  populateDropdown(elementId, options, isMultiple = true) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown) {
      console.warn(`⚠️ Dropdown element ${elementId} not found`);
      return;
    }

    // Store current selections to preserve them
    const currentSelections = this.getSelectedValues(elementId);

    // Clear existing options
    dropdown.innerHTML = '';

    // Add "All" option for multi-select dropdowns
    if (isMultiple) {
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = `All (${options.length} items)`;
      allOption.style.fontWeight = 'bold';
      allOption.style.backgroundColor = '#f0f0f0';
      dropdown.appendChild(allOption);
    } else {
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'All';
      dropdown.appendChild(allOption);
    }

    // Add new options sorted alphabetically
    options.sort().forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;

      // Restore previous selection if it exists
      if (currentSelections.includes(option)) {
        optionElement.selected = true;
      }

      dropdown.appendChild(optionElement);
    });

    // Update dropdown appearance for multi-select
    if (isMultiple && dropdown.multiple) {
      dropdown.size = Math.min(6, options.length + 1); // Show up to 6 items
      dropdown.title = `Select multiple items (Ctrl+Click or Cmd+Click)`;
    }

    // Update selection count if it's a multi-select
    if (isMultiple) {
      this.updateFilterSelectionCount(elementId);
    }

    console.log(`📊 Populated ${elementId} with ${options.length} options`);
  }

  /**
   * Update filter selection count display
   */
  updateFilterSelectionCount(elementId) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown || !dropdown.multiple) return;

    const selectedValues = this.getSelectedValues(elementId);
    const selectedCount = selectedValues.length;

    // Find or create count display element
    let countElement = document.getElementById(`${elementId}-count`);
    if (!countElement) {
      countElement = document.createElement('span');
      countElement.id = `${elementId}-count`;
      countElement.className = 'filter-selection-count';

      // Insert after the dropdown
      dropdown.parentNode.insertBefore(countElement, dropdown.nextSibling);
    }

    // Update count display
    if (selectedCount === 0) {
      countElement.textContent = 'All';
      countElement.className = 'filter-selection-count empty';
    } else {
      countElement.textContent = selectedCount;
      countElement.className = 'filter-selection-count';
    }

    console.log(`📊 ${elementId} selection count: ${selectedCount}`);
  }

  /**
   * Set default date range based on data
   */
  setDateRangeDefaults(records) {
    const dates = records.map(r => new Date(r.Date || r.date)).filter(d => !isNaN(d));
    if (dates.length === 0) return;

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const startInput = document.getElementById('date-range-start');
    const endInput = document.getElementById('date-range-end');

    if (startInput) startInput.value = minDate.toISOString().split('T')[0];
    if (endInput) endInput.value = maxDate.toISOString().split('T')[0];
  }

  /**
   * Clear all filter dropdowns
   */
  clearFilterDropdowns() {
    const dropdownIds = [
      'driver-filter', 'customer-filter', 'product-filter-explorer', 'location-filter',
      'recap-driver-filter', 'recap-customer-filter', 'recap-product-filter', 'recap-location-filter'
    ];

    dropdownIds.forEach(id => {
      const dropdown = document.getElementById(id);
      if (dropdown) {
        const firstOption = dropdown.querySelector('option');
        dropdown.innerHTML = '';
        if (firstOption) {
          dropdown.appendChild(firstOption);
        }
      }
    });
  }

  /**
   * Apply explorer filters to data
   */
  applyExplorerFilters() {
    if (!this.currentData || !this.currentData.records) {
      this.showNotification('No data available to filter', 'warning');
      return;
    }

    try {
      // Get filter values
      const filters = this.getExplorerFilterValues();

      // Apply filters to data
      const filteredRecords = this.applyFiltersToRecords(this.currentData.records, filters);

      // Update displays with filtered data
      this.updateFilteredDisplays(filteredRecords, filters);

      // Update filter summary
      this.updateFilterSummary(filters, filteredRecords.length, this.currentData.records.length);

      this.showNotification(`Applied filters: ${filteredRecords.length} of ${this.currentData.records.length} records match`, 'success');

    } catch (error) {
      console.error('❌ Error applying filters:', error);
      this.showNotification('Error applying filters: ' + error.message, 'error');
    }
  }

  /**
   * Get current filter values from UI
   */
  getExplorerFilterValues() {
    return {
      drivers: this.getSelectedValues('driver-filter'),
      customers: this.getSelectedValues('customer-filter'),
      products: this.getSelectedValues('product-filter-explorer'),
      locations: this.getSelectedValues('location-filter'),
      dateStart: document.getElementById('date-range-start')?.value,
      dateEnd: document.getElementById('date-range-end')?.value
    };
  }

  /**
   * Get selected values from a multi-select dropdown
   */
  getSelectedValues(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return [];

    return Array.from(element.selectedOptions)
      .map(option => option.value)
      .filter(value => value !== '');
  }

  /**
   * Apply filters to records
   */
  applyFiltersToRecords(records, filters) {
    return records.filter(record => {
      // Driver filter
      if (filters.drivers.length > 0) {
        const driver = record.Driver || record.driver || record.Employee || record.employee;
        if (!driver || !filters.drivers.includes(driver)) return false;
      }

      // Customer filter
      if (filters.customers.length > 0) {
        const customer = record.Customer || record.customer;
        if (!customer || !filters.customers.includes(customer)) return false;
      }

      // Product filter
      if (filters.products.length > 0) {
        const product = record['Product Type'] || record.product_type || record.Product || record.product;
        if (!product || !filters.products.includes(product)) return false;
      }

      // Location filter
      if (filters.locations.length > 0) {
        const location = record.Location || record.location || record.City || record.city || record.State || record.state;
        if (!location || !filters.locations.includes(location)) return false;
      }

      // Date range filter
      if (filters.dateStart || filters.dateEnd) {
        const recordDate = new Date(record.Date || record.date);
        if (isNaN(recordDate)) return false;

        if (filters.dateStart) {
          const startDate = new Date(filters.dateStart);
          if (recordDate < startDate) return false;
        }

        if (filters.dateEnd) {
          const endDate = new Date(filters.dateEnd);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (recordDate > endDate) return false;
        }
      }

      return true;
    });
  }

  /**
   * Update displays with filtered data
   */
  updateFilteredDisplays(filteredRecords, filters) {
    // Update sample data display
    if (filteredRecords.length > 0) {
      this.updateSampleDataDisplay(filteredRecords, this.currentData.headers);

      // Show sample data section
      const sampleDisplay = document.getElementById('sample-data-display');
      if (sampleDisplay) {
        sampleDisplay.style.display = 'block';
      }
    }

    // Store filtered data for chart creation
    this.filteredData = {
      records: filteredRecords,
      headers: this.currentData.headers,
      filters: filters
    };
  }

  /**
   * Update filter summary display
   */
  updateFilterSummary(filters, filteredCount, totalCount) {
    const summaryElement = document.getElementById('filter-summary');
    const countElement = summaryElement?.querySelector('.filter-count');

    if (!countElement) return;

    const activeFilters = [];
    if (filters.drivers.length > 0) activeFilters.push(`${filters.drivers.length} driver(s)`);
    if (filters.customers.length > 0) activeFilters.push(`${filters.customers.length} customer(s)`);
    if (filters.products.length > 0) activeFilters.push(`${filters.products.length} product(s)`);
    if (filters.locations.length > 0) activeFilters.push(`${filters.locations.length} location(s)`);
    if (filters.dateStart || filters.dateEnd) activeFilters.push('date range');

    if (activeFilters.length === 0) {
      countElement.textContent = 'No filters applied';
    } else {
      countElement.textContent = `${filteredCount}/${totalCount} records | Filters: ${activeFilters.join(', ')}`;
    }
  }

  /**
   * Clear all explorer filters
   */
  clearExplorerFilters() {
    // Clear all dropdowns
    const dropdownIds = ['driver-filter', 'customer-filter', 'product-filter-explorer', 'location-filter'];
    dropdownIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.selectedIndex = 0;
        // Clear multiple selections
        Array.from(element.options).forEach(option => option.selected = false);
      }
    });

    // Clear date inputs
    const dateStart = document.getElementById('date-range-start');
    const dateEnd = document.getElementById('date-range-end');
    if (dateStart) dateStart.value = '';
    if (dateEnd) dateEnd.value = '';

    // Reset displays
    if (this.currentData) {
      this.updateSampleDataDisplay(this.currentData.records, this.currentData.headers);
    }

    // Clear filtered data
    this.filteredData = null;

    // Update summary
    const countElement = document.querySelector('#filter-summary .filter-count');
    if (countElement) {
      countElement.textContent = 'No filters applied';
    }

    this.showNotification('All filters cleared', 'success');
  }

  /**
   * Generate location-based map visualization
   */
  generateLocationMap() {
    const mapType = document.getElementById('map-type-select')?.value || 'sales';

    if (!this.currentData || !this.currentData.records) {
      this.showNotification('No data available for mapping', 'warning');
      return;
    }

    try {
      console.log(`📍 Generating ${mapType} map`);

      // Get map-specific filters
      const mapFilters = this.getMapFilters();

      // Apply filters to get data for mapping
      let dataToMap = this.currentData.records;

      // Apply explorer filters first if they exist
      if (this.filteredData && this.filteredData.records) {
        dataToMap = this.filteredData.records;
      }

      // Apply map-specific filters
      dataToMap = this.applyMapFilters(dataToMap, mapFilters);

      if (dataToMap.length === 0) {
        this.showNotification('No data matches current filters for mapping', 'warning');
        return;
      }

      console.log(`📍 Using ${dataToMap.length} records for mapping`);

      // Process location data
      const locationData = this.processLocationData(dataToMap, mapType);

      // Create map visualization
      this.createLocationVisualization(locationData, mapType);

      // Generate location statistics
      this.generateLocationStats(locationData, mapType);

      // Show map container
      const mapContainer = document.getElementById('map-container');
      const statsContainer = document.getElementById('location-stats');

      if (mapContainer) mapContainer.style.display = 'block';
      if (statsContainer) statsContainer.style.display = 'block';

      this.showNotification(`${mapType} map generated with ${locationData.length} locations!`, 'success');

    } catch (error) {
      console.error('❌ Error generating location map:', error);
      this.showNotification('Error generating map: ' + error.message, 'error');
    }
  }

  /**
   * Get map-specific filter values
   */
  getMapFilters() {
    return {
      dateStart: document.getElementById('map-date-start')?.value,
      dateEnd: document.getElementById('map-date-end')?.value,
      product: document.getElementById('map-product-select')?.value
    };
  }

  /**
   * Apply map-specific filters to records
   */
  applyMapFilters(records, filters) {
    return records.filter(record => {
      // Date range filter
      if (filters.dateStart || filters.dateEnd) {
        const recordDate = new Date(record.Date || record.date);
        if (isNaN(recordDate)) return false;

        if (filters.dateStart) {
          const startDate = new Date(filters.dateStart);
          if (recordDate < startDate) return false;
        }

        if (filters.dateEnd) {
          const endDate = new Date(filters.dateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (recordDate > endDate) return false;
        }
      }

      // Product filter
      if (filters.product) {
        const product = record['Product Type'] || record.product_type || record.Product || record.product;
        if (!product || product !== filters.product) return false;
      }

      return true;
    });
  }

  /**
   * Process location data for mapping
   */
  processLocationData(records, mapType) {
    const locationMap = {};

    records.forEach(record => {
      // Extract location information
      const location = record.Location || record.location || record.City || record.city ||
        record.State || record.state || record.Address || record.address || 'Unknown';

      if (!locationMap[location]) {
        locationMap[location] = {
          name: location,
          sales: 0,
          customers: new Set(),
          deliveries: 0,
          profit: 0,
          gallons: 0,
          records: []
        };
      }

      const locationData = locationMap[location];

      // Aggregate data by location
      locationData.sales += this.parseCSVNumber(record.Sales || record.sales || 0);
      locationData.profit += this.parseCSVNumber(record['Actual Profit By Item'] || record.actual_profit || 0);
      locationData.gallons += this.parseCSVNumber(record['Gallon Qty'] || record.gallon_qty || 0);
      locationData.deliveries += 1;

      const customer = record.Customer || record.customer;
      if (customer) {
        locationData.customers.add(customer);
      }

      locationData.records.push(record);
    });

    // Convert to array and sort by the selected metric
    const locations = Object.values(locationMap).map(loc => ({
      ...loc,
      customerCount: loc.customers.size
    }));

    // Sort by the map type metric
    const sortKey = mapType === 'sales' ? 'sales' :
      mapType === 'customers' ? 'customerCount' :
        mapType === 'deliveries' ? 'deliveries' : 'profit';

    return locations.sort((a, b) => b[sortKey] - a[sortKey]);
  }

  /**
   * Create location visualization (simplified map representation)
   */
  createLocationVisualization(locationData, mapType) {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    // Create a simple visual representation of locations
    const maxValue = locationData.length > 0 ? locationData[0][this.getMapMetric(mapType)] : 0;

    mapElement.innerHTML = `
      <div class="location-map-content">
        <h4>📍 ${mapType.charAt(0).toUpperCase() + mapType.slice(1)} by Location</h4>
        <div class="location-bubbles">
          ${locationData.slice(0, 10).map((location) => {
      const value = location[this.getMapMetric(mapType)];
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const size = Math.max(20, Math.min(100, percentage));

      return `
              <div class="location-bubble" style="width: ${size}px; height: ${size}px;" title="${location.name}: ${this.formatMapValue(value, mapType)}">
                <div class="bubble-label">${location.name}</div>
                <div class="bubble-value">${this.formatMapValue(value, mapType)}</div>
              </div>
            `;
    }).join('')}
        </div>
        <div class="map-legend">
          <div class="legend-item">
            <div class="legend-bubble small"></div>
            <span>Lower ${mapType}</span>
          </div>
          <div class="legend-item">
            <div class="legend-bubble large"></div>
            <span>Higher ${mapType}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get the metric key for map type
   */
  getMapMetric(mapType) {
    switch (mapType) {
      case 'sales': return 'sales';
      case 'customers': return 'customerCount';
      case 'deliveries': return 'deliveries';
      case 'profit': return 'profit';
      default: return 'sales';
    }
  }

  /**
   * Format map value for display
   */
  formatMapValue(value, mapType) {
    switch (mapType) {
      case 'sales':
      case 'profit':
        return this.formatCurrency(value);
      case 'customers':
        return `${value} customers`;
      case 'deliveries':
        return `${value} deliveries`;
      default:
        return value.toString();
    }
  }

  /**
   * Generate location statistics
   */
  generateLocationStats(locationData, mapType) {
    const statsGrid = document.getElementById('location-stats-grid');
    if (!statsGrid) return;

    const totalLocations = locationData.length;
    const totalSales = locationData.reduce((sum, loc) => sum + loc.sales, 0);
    const totalCustomers = locationData.reduce((sum, loc) => sum + loc.customerCount, 0);
    const totalDeliveries = locationData.reduce((sum, loc) => sum + loc.deliveries, 0);
    const avgSalesPerLocation = totalLocations > 0 ? totalSales / totalLocations : 0;

    const topLocation = locationData[0];

    statsGrid.innerHTML = `
      <div class="stat-item">
        <div class="stat-label">Total Locations</div>
        <div class="stat-value">${totalLocations}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Top Location</div>
        <div class="stat-value">${topLocation?.name || 'N/A'}</div>
        <div class="stat-change">${topLocation ? this.formatMapValue(topLocation[this.getMapMetric(mapType)], mapType) : ''}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Total Sales</div>
        <div class="stat-value">${this.formatCurrency(totalSales)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Total Customers</div>
        <div class="stat-value">${totalCustomers}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Total Deliveries</div>
        <div class="stat-value">${totalDeliveries}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Avg Sales/Location</div>
        <div class="stat-value">${this.formatCurrency(avgSalesPerLocation)}</div>
      </div>
    `;
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new ChiefDashboard();

  // Make test function available globally for console access
  window.runDashboardTests = () => {
    if (window.dashboard) {
      return window.dashboard.runDashboardTests();
    } else {
      console.error('Dashboard not initialized');
    }
  };

  // Make chart explanation function available globally
  window.showChartExplanation = (chartType) => {
    if (window.dashboard) {
      window.dashboard.showChartExplanation(chartType);
    } else {
      console.error('Dashboard not initialized');
    }
  };
});

// Export for use in other modules
window.ChiefDashboard = ChiefDashboard;
