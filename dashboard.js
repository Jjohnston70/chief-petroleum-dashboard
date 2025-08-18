/**
 * Chief Petroleum Dashboard Main Controller
 * Orchestrates all dashboard functionality
 */

class ChiefDashboard {
  constructor() {
    this.dataService = null;
    this.databaseService = null; // Railway database service
    this.chartManager = null;
    this.themeManager = null;
    this.currentData = null;
    this.currentPeriod = 'monthly';
    this.isLoading = false;
    this.uploadedDatasets = {}; // Store multiple uploaded datasets
    this.currentDataset = null; // Track current active dataset

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
      this.databaseService = new DatabaseDataService(); // Railway database service
      this.dataService = new ChiefDataService(); // Google Sheets fallback
      this.dataService.dashboard = this; // Reference for filtered data access
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

    // Data source selector (restored functionality)
    const sheetSelector = document.getElementById('sheet-selector');
    if (sheetSelector) {
      console.log('📊 Data source dropdown found, adding event listener');
      sheetSelector.addEventListener('change', (e) => {
        console.log('📊 Data source changed to:', e.target.value);
        this.switchDataSource(e.target.value);
      });
    } else {
      console.error('❌ Data source dropdown not found!');
    }

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

    // CSV upload event listeners
    document.getElementById('upload-csv').addEventListener('click', () => {
      this.handleCSVUpload();
    });

    // Dataset switcher event listener
    document.getElementById('active-dataset').addEventListener('change', (e) => {
      this.switchDataset(e.target.value);
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

    // Test button (for development/debugging)
    const testBtn = document.getElementById('test-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.testDataSourceDropdown();
      });

      // Always show test button for debugging
      testBtn.style.display = 'inline-block';
      testBtn.innerHTML = '<i class="fas fa-vial"></i> Test Dropdown';
      testBtn.title = 'Test Data Source Dropdown';
    }

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
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      this.showLoading('Loading Chief Petroleum data...');

      // Load data from Railway database only
      console.log('🚀 Loading data from Railway database...');

      // Test Railway connection first
      const healthCheck = await this.databaseService.healthCheck();
      console.log('🔍 Railway health check result:', healthCheck);

      if (!healthCheck) {
        throw new Error('Railway health check failed - database is not available');
      }

      this.currentData = await this.loadFromDatabase();
      console.log('✅ Database data loaded successfully');
      this.showNotification('Connected to Railway database', 'success');

      console.log('📊 Data loaded:', this.currentData.summary);

      // Update all dashboard components
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();

      // Initialize data source dropdown
      this.initializeDataSourceDropdown();

      // Load GP charts
      this.loadGPCharts();

      // Auto-load recap data for 2 business days ago
      console.log('🔄 Auto-loading daily recap...');
      await this.loadDailyRecap();

      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      console.error('❌ Dashboard data loading failed:', error);

      // Provide specific error messages based on error type
      let userMessage = 'Failed to load dashboard data';
      if (error.message.includes('health check failed')) {
        userMessage = 'Cannot connect to database. Please check your internet connection and try again.';
      } else if (error.message.includes('fetch')) {
        userMessage = 'Network error while loading data. Please try refreshing the page.';
      } else {
        userMessage = `Failed to load data: ${error.message}`;
      }

      this.showNotification(userMessage, 'error');
      throw error;
    }
  }

  /**
   * Load data from Railway database
   */
  async loadFromDatabase() {
    try {
      // Fetch KPIs and transaction data from Railway API
      const [kpis, transactions, recapData] = await Promise.all([
        this.databaseService.getKPIs(),
        this.databaseService.getTransactions({ limit: 1000 }),
        this.databaseService.getRecapData({ limit: 100 })
      ]);

      // Transform database data to match expected format
      const transactionData = transactions.data || [];

      // Process dates in transaction data
      const processedTransactionData = transactionData.map(record => {
        const processedRecord = { ...record };

        // Normalize all date fields using the utility function
        Object.keys(processedRecord).forEach(key => {
          if (key.toLowerCase().includes('date') || processedRecord[key] instanceof Date) {
            processedRecord[key] = this.normalizeDate(processedRecord[key]);
          }
        });

        return processedRecord;
      });

      const transformedData = {
        records: processedTransactionData,        // For compatibility with CSV/Sheets code
        transactions: processedTransactionData,   // For Railway-specific code
        summary: {
          totalRecords: parseInt(kpis.total_transactions) || 0,
          totalSales: parseFloat(kpis.total_sales) || 0,
          totalGallons: parseFloat(kpis.total_gallons) || 0,
          totalProfit: parseFloat(kpis.total_profit) || 0,
          avgProfitMargin: parseFloat(kpis.avg_margin) || 0,  // Use consistent field name
          avgMargin: parseFloat(kpis.avg_margin) || 0,
          activeCustomers: parseInt(kpis.active_customers) || 0,
          dateRange: {
            start: kpis.earliest_date,
            end: kpis.latest_date
          }
        },
        recapData: recapData.data || [],
        source: 'Railway Database',  // Use consistent field name
        dataSource: 'Railway Database',
        lastUpdated: new Date().toISOString()
      };

      return transformedData;
    } catch (error) {
      console.error('❌ Database loading failed:', error);
      throw new Error(`Database loading failed: ${error.message}`);
    }
  }

  /**
   * Refresh data
   */
  async refreshData(silent = false) {
    if (this.isLoading) return;
    
    try {
      if (!silent) {
        this.showLoading('Refreshing data...');
      }
      
      // Clear cache to force fresh data
      this.dataService.clearCache();
      
      // Reload data
      await this.loadDashboardData();
      
      if (!silent) {
        this.showNotification('Data refreshed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      if (!silent) {
        this.showError('Failed to refresh data: ' + error.message);
      }
    }
  }

  // Note: Sheet switching functionality removed - using Railway database only

  /**
   * Update KPI cards
   */
  updateKPIs() {
    if (!this.currentData) return;

    // Use filtered data if date filter is active
    const dataToUse = this.getFilteredData() || this.currentData;
    const summary = dataToUse.summary;
    
    // Update KPI values
    this.updateKPI('total-sales', summary.totalSales, 'currency');
    this.updateKPI('total-gallons', summary.totalGallons, 'number');
    this.updateKPI('profit-margin', summary.avgProfitMargin, 'percent');
    this.updateKPI('active-customers', summary.activeCustomers, 'number');
    
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
    const isCSVData = this.currentData.source && this.currentData.source.includes('CSV Upload');

    if (isCSVData) {
      // For CSV data, pass the data directly
      console.log('📊 Using CSV data for charts');
      await this.chartManager.createSalesTrendChart(this.currentData, this.currentPeriod);
      this.chartManager.createCustomerChart(this.currentData);
      this.chartManager.createProfitChart(this.currentData);
    } else {
      // For Railway database data, pass the database service
      console.log('📊 Using Railway database service for charts');
      await this.chartManager.createSalesTrendChart(this.databaseService, this.currentPeriod);
      this.chartManager.createCustomerChart(this.databaseService);
      this.chartManager.createProfitChart(this.databaseService);
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

    // Always show advanced charts for CSV data
    if (isCSVData) {
      await this.showCSVCharts();
    } else {
      // Hide all advanced charts initially for Google Sheets
      this.hideAllAdvancedCharts();

      // Show sheet-specific charts
      const currentSheet = this.dataService.getCurrentSheet();
      const sheetType = this.dataService.getSheetInfo(currentSheet)?.type;

      if (sheetType === 'yearly' || currentSheet.includes('2024') || currentSheet.includes('2025')) {
        await this.showYearlyCharts(currentSheet);
      } else if (sheetType === 'summary' || currentSheet === 'Recap-data') {
        await this.showSummaryCharts();
      } else if (currentSheet === 'Data') {
        await this.showTransactionalCharts();
      }
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
  async showYearlyCharts(currentSheet) {
    try {
      // Show year-over-year comparison if we have both 2024 and 2025 data
      const yearData = await this.dataService.getYearOverYearData();

      if (yearData.hasPartialData) {
        // Show warning for partial data
        this.showNotification('⚠️ Some year-over-year data is unavailable. Showing available charts.', 'warning');
      }

      if (yearData.year2024 && yearData.year2025) {
        this.showChartContainer('year-comparison-container');
        this.chartManager.createYearOverYearChart(yearData.year2024, yearData.year2025);

        this.showChartContainer('growth-rate-container');
        this.chartManager.createGrowthRateChart(yearData.year2024, yearData.year2025);
      } else if (yearData.year2024 || yearData.year2025) {
        // Show single year data with note
        const availableYear = yearData.year2024 ? '2024' : '2025';
        this.showNotification(`📊 Showing ${availableYear} data only. Year-over-year comparison requires both years.`, 'info');
      }

      // Show cumulative chart for current year data
      if (this.currentData) {
        this.showChartContainer('cumulative-container');
        this.chartManager.createCumulativeChart(this.currentData);
      }

    } catch (error) {
      console.error('❌ Error creating yearly charts:', error);
      this.showNotification(`Failed to load yearly comparison charts: ${error.message}`, 'error');
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
   * Create historical trend analysis chart
   */
  async createHistoricalTrendChart() {
    try {
      // Fetch data from all available sheets
      const allSheets = this.dataService.getAvailableSheets();
      const historicalData = [];

      for (const sheetName of allSheets) {
        if (sheetName !== 'Recap-data') {
          try {
            const data = await this.dataService.fetchFuelData(sheetName);
            historicalData.push({
              sheet: sheetName,
              data: data
            });
          } catch (error) {
            console.warn(`Could not fetch data for ${sheetName}:`, error);
          }
        }
      }

      // Create the historical trend chart
      if (historicalData.length > 0) {
        this.chartManager.createHistoricalTrendChart(historicalData);
      } else {
        this.createPlaceholderChart('historical-trend-chart', 'Historical Trend Analysis', 'No historical data available');
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
   * Switch data source based on dropdown selection
   */
  async switchDataSource(dataSource) {
    if (this.isLoading) return;

    try {
      this.showLoading(`Loading ${dataSource}...`);
      console.log(`🔄 Switching to data source: ${dataSource}`);

      // Map dropdown values to data types
      let dataType;
      switch (dataSource) {
        case 'Data':
          dataType = 'transactions';
          break;
        case 'Data-gp-2025':
          dataType = 'gp-2025';
          break;
        case 'Data-gp-2024':
          dataType = 'gp-2024';
          break;
        case 'Recap-data':
          dataType = 'recap';
          break;
        default:
          dataType = 'transactions';
      }

      // Fetch data from the appropriate source
      const newData = await this.dataService.fetchFuelData(dataType);

      if (!newData) {
        throw new Error(`No data available for ${dataSource}`);
      }

      // Update current data
      this.currentData = newData;
      this.currentData.source = 'Railway Database';
      this.currentData.dataSource = 'Railway Database';

      // Update all dashboard components
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();

      // Update data source info
      this.updateDataSourceInfo();

      this.hideLoading();
      this.showNotification(`Switched to ${dataSource}`, 'success');

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error switching data source:', error);
      this.showError(`Failed to switch to ${dataSource}: ${error.message}`);
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

    // Load and display recap data range from Recap-data sheet
    await this.updateRecapDataRange();
  }

  /**
   * Update recap data range information from Recap-data sheet
   */
  async updateRecapDataRange() {
    try {
      const recapDataRangeElement = document.getElementById('recap-data-range');
      if (!recapDataRangeElement) return;

      // Try to fetch recap data from Recap-data sheet
      const recapData = await this.dataService.fetchFuelData('Recap-data');
      if (recapData && recapData.records) {
        const recapDataRange = this.calculateDataRange(recapData.records);
        recapDataRangeElement.textContent = recapDataRange;
      } else {
        // Fallback to main data range
        const mainDataRange = this.calculateDataRange(this.currentData.records);
        recapDataRangeElement.textContent = mainDataRange + ' (from main data)';
      }
    } catch (error) {
      console.warn('Could not load recap data range:', error);
      // Fallback to main data range
      const recapDataRangeElement = document.getElementById('recap-data-range');
      if (recapDataRangeElement && this.currentData) {
        const mainDataRange = this.calculateDataRange(this.currentData.records);
        recapDataRangeElement.textContent = mainDataRange + ' (from main data)';
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
    console.log('🎨 Theme changed to:', themeData.theme);

    // Update any theme-specific elements
    if (this.chartManager) {
      this.chartManager.updateTheme(themeData.isDark);
    }
  }

  /**
   * Handle CSV file upload with dataset management AND Railway database upload
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

      // Update local dashboard
      this.updateDatasetSwitcher(datasetName);
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();

      // 🚀 NEW: Also upload to Railway database
      this.showLoading(`Uploading ${datasetName} to Railway database...`);
      const railwayResult = await this.uploadToRailwayDatabase(processedData, datasetName);

      this.hideLoading();

      if (railwayResult.success) {
        this.showNotification(`Dataset "${datasetName}" uploaded successfully!
          📊 Local: ${processedData.records.length} records
          🚀 Railway: ${railwayResult.uploaded} records uploaded`, 'success');
      } else {
        this.showNotification(`Dataset "${datasetName}" uploaded locally (${processedData.records.length} records)
          ⚠️ Railway upload failed: ${railwayResult.error}`, 'warning');
      }

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

      this.hideLoading();
      this.showNotification(`Switched to dataset "${datasetName}"`, 'success');

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error switching dataset:', error);
      this.showNotification('Error switching dataset: ' + error.message, 'error');
    }
  }

  /**
   * 🚀 NEW: Upload processed data to Railway database
   */
  async uploadToRailwayDatabase(processedData, datasetName) {
    const API_BASE = 'https://api-server-production-8953.up.railway.app/api';

    try {
      // Determine which table to use based on dataset name
      let endpoint = '';
      let tableName = '';

      if (datasetName.toLowerCase().includes('recap')) {
        endpoint = '/recap-data';
        tableName = 'recap_data';
      } else if (datasetName.toLowerCase().includes('gp-2024')) {
        endpoint = '/gp-data/2024';
        tableName = 'gp_data_2024';
      } else if (datasetName.toLowerCase().includes('gp-2025')) {
        endpoint = '/gp-data/2025';
        tableName = 'gp_data_2025';
      } else {
        // Default to transactions table
        endpoint = '/transactions';
        tableName = 'transactions';
      }

      console.log(`🚀 Uploading ${processedData.records.length} records to ${tableName}...`);

      let uploadedCount = 0;
      let errorCount = 0;

      // Upload in batches of 50 to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < processedData.records.length; i += batchSize) {
        const batch = processedData.records.slice(i, i + batchSize);

        for (const record of batch) {
          try {
            const transformedRecord = this.transformRecordForRailway(record, tableName);

            const response = await fetch(`${API_BASE}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(transformedRecord)
            });

            if (response.ok) {
              uploadedCount++;
            } else {
              console.error('❌ Railway upload error:', await response.text());
              errorCount++;
            }
          } catch (error) {
            console.error('❌ Error uploading record:', error);
            errorCount++;
          }
        }

        // Update progress
        const progress = Math.round(((i + batchSize) / processedData.records.length) * 100);
        this.showLoading(`Uploading to Railway: ${progress}% (${uploadedCount}/${processedData.records.length})`);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        uploaded: uploadedCount,
        errors: errorCount,
        tableName: tableName
      };

    } catch (error) {
      console.error('❌ Railway database upload failed:', error);
      return {
        success: false,
        error: error.message,
        uploaded: 0
      };
    }
  }

  /**
   * Transform record for Railway database format
   */
  transformRecordForRailway(record, tableName) {
    const transformed = {};

    if (tableName === 'transactions') {
      transformed.date = this.parseCSVDate(record.Date);
      transformed.customer = record.Customer || null;
      transformed.customer_address = record['Customer-Address'] || null;
      transformed.product_type = record['Product Type'] || null;
      transformed.gallon_qty = this.parseCSVNumber(record['Gallon Qty']);
      transformed.actual_profit = this.parseCSVNumber(record['Actual Profit By Item']);
      transformed.actual_cost = this.parseCSVNumber(record['Actual Cost by item']);
      transformed.sales = this.parseCSVNumber(record.Sales);
      transformed.margin_by_product = this.parseCSVNumber(record['Margin by Product']);
      transformed.unleaded_cost = this.parseCSVNumber(record['Unleaded cost']);
      transformed.clear_cost = this.parseCSVNumber(record['Clear Cost']);
      transformed.dyed_cost = this.parseCSVNumber(record['Dyed Cost']);
    } else if (tableName === 'recap_data') {
      transformed.date = this.parseCSVDate(record.Date);
      transformed.driver = record.DRIVER || null;
      transformed.company = record.COMPANY || null;
      transformed.gallons = this.parseCSVNumber(record.GALLONS);
      transformed.profit_includes_delivery_fee = this.parseCSVNumber(record['PROFIT INCLUDES DELIEVERY FEE']);
      transformed.delivery_fee = this.parseCSVNumber(record['DELIVERY FEE']);
      transformed.margin = this.parseCSVNumber(record['Margin (Greeen if includes deliver Fee)']);
      transformed.opis_true = record['OPIS-true'] === 'TRUE';
    }
    // Add more table transformations as needed for GP data

    return transformed;
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
      summary,
      source: `CSV Upload (${datasetName})`,
      datasetName: datasetName,
      uploadedAt: new Date().toISOString()
    };
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
   * Load daily recap for selected date
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

      // Use the async method that queries Railway database directly
      const dailyData = await this.dataService.getDailyRecap(selectedDate);

      if (!dailyData) {
        console.log(`📅 No data found for ${selectedDate}, trying to find alternative date`);
        this.hideLoading();
        this.showNotification(`No data found for ${selectedDate}. Try selecting a different date.`, 'info');
        this.hideDailyRecap();

        // Suggest alternative dates with data
        await this.suggestAlternativeRecapDates();
        return;
      }

      this.displayDailyRecap(dailyData);
      this.hideLoading();
      this.showNotification(`Daily recap loaded for ${selectedDate}`, 'success');

    } catch (error) {
      console.error('❌ Error loading daily recap:', error);
      this.hideLoading();
      this.showNotification(`Failed to load daily recap: ${error.message}`, 'error');
      this.hideDailyRecap();
    }
  }

  /**
   * Suggest alternative dates that might have recap data
   */
  async suggestAlternativeRecapDates() {
    try {
      const suggestions = [];

      // Check the last 7 business days
      for (let i = 1; i <= 7; i++) {
        const testDate = this.getBusinessDaysAgo(i);
        const hasData = await this.dataService.getDailyRecap(testDate);

        if (hasData) {
          suggestions.push(testDate);
        }

        // Only suggest up to 3 dates
        if (suggestions.length >= 3) break;
      }

      if (suggestions.length > 0) {
        console.log('📅 Suggested dates with data:', suggestions);
        this.showNotification(`Try these dates: ${suggestions.join(', ')}`, 'info');
      }
    } catch (error) {
      console.log('📅 Could not suggest alternative dates');
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
    tbody.innerHTML = '';

    Object.entries(productBreakdown).forEach(([product, data]) => {
      const avgPrice = data.gallons > 0 ? data.sales / data.gallons : 0;
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${product}</td>
        <td>${this.formatNumber(data.gallons)}</td>
        <td>${this.formatCurrency(data.sales)}</td>
        <td>${this.formatCurrency(data.profit)}</td>
        <td>${this.formatCurrency(avgPrice)}</td>
        <td>${data.deliveries}</td>
      `;
    });
  }

  /**
   * Update customer breakdown table
   */
  updateCustomerBreakdownTable(customerBreakdown) {
    const tbody = document.getElementById('daily-customers-table-body');
    tbody.innerHTML = '';

    // Sort customers by sales
    const sortedCustomers = Object.entries(customerBreakdown)
      .sort(([,a], [,b]) => b.sales - a.sales)
      .slice(0, 10); // Top 10 customers

    sortedCustomers.forEach(([customer, data]) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${customer}</td>
        <td>${data.deliveries}</td>
        <td>${this.formatNumber(data.gallons)}</td>
        <td>${this.formatCurrency(data.sales)}</td>
        <td>${this.formatCurrency(data.profit)}</td>
      `;
    });
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
      productTypes: new Set()
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
   * Hide daily recap sections
   */
  hideDailyRecap() {
    document.getElementById('daily-metrics-grid').style.display = 'none';
    document.getElementById('daily-product-breakdown').style.display = 'none';
    document.getElementById('daily-customers-breakdown').style.display = 'none';
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
   * Try to set a default recap date that has actual data
   */
  async setDefaultRecapDateWithData() {
    if (!this.dataService) return;

    try {
      // Try the last 10 business days to find one with data
      for (let i = 1; i <= 10; i++) {
        const testDate = this.getBusinessDaysAgo(i);
        const hasData = await this.dataService.getDailyRecap(testDate);

        if (hasData) {
          document.getElementById('recap-date').value = testDate;
          console.log(`📅 Found data for ${testDate}, setting as default recap date`);
          break;
        }
      }
    } catch (error) {
      console.log('📅 Could not find recent date with recap data, keeping default');
    }
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats() {
    if (!this.currentData) return null;

    return {
      totalRecords: this.currentData.records.length,
      dataSourceId: this.dataService.spreadsheetId,
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

      // Simulate AI processing (replace with actual AI service)
      const response = await this.processAIQuery(query);

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
  async processAIQuery(query) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const currentData = this.getFilteredData() || this.currentData;
    if (!currentData || !currentData.records) {
      throw new Error('No data available');
    }

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
   * Get top customers analysis for AI
   */
  getTopCustomersAnalysis(data) {
    const customers = this.dataService.getTopCustomers(data, 5);
    return {
      type: 'top_customers',
      title: 'Top 5 Customers by Sales',
      data: customers,
      summary: `Your top customer is ${customers[0]?.name} with $${customers[0]?.sales?.toLocaleString()} in sales.`
    };
  }

  /**
   * Get profit trend analysis for AI
   */
  getProfitTrendAnalysis(data) {
    const trends = this.dataService.getSalesTrendData(data, 'monthly');
    const avgProfit = trends.reduce((sum, item) => sum + item.profit, 0) / trends.length;
    return {
      type: 'profit_trend',
      title: 'Profit Trend Analysis',
      data: trends,
      summary: `Your average monthly profit is $${avgProfit.toLocaleString()}. ${trends.length > 1 ?
        (trends[trends.length - 1].profit > trends[trends.length - 2].profit ?
          'Profit is trending upward.' : 'Profit is trending downward.') : ''}`
    };
  }

  /**
   * Get monthly sales analysis for AI
   */
  getMonthlySalesAnalysis(data) {
    const trends = this.dataService.getSalesTrendData(data, 'monthly');
    const totalSales = trends.reduce((sum, item) => sum + item.sales, 0);
    const bestMonth = trends.reduce((best, current) =>
      current.sales > best.sales ? current : best, trends[0]);

    return {
      type: 'monthly_sales',
      title: 'Monthly Sales Analysis',
      data: trends,
      summary: `Total sales across all months: $${totalSales.toLocaleString()}. Best performing month: ${bestMonth.period} with $${bestMonth.sales.toLocaleString()}.`
    };
  }

  /**
   * Get product type analysis for AI
   */
  getProductTypeAnalysis(data) {
    const products = this.dataService.getProductTypeAnalysis(data);
    const topProduct = products.reduce((best, current) =>
      current.sales > best.sales ? current : best, products[0]);

    return {
      type: 'product_analysis',
      title: 'Product Type Analysis',
      data: products,
      summary: `You sell ${products.length} different product types. ${topProduct.type} is your best seller with $${topProduct.sales.toLocaleString()} in sales.`
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
        html += `<li>${index + 1}. ${customer.name} - $${customer.sales.toLocaleString()} sales, $${customer.profit.toLocaleString()} profit</li>`;
      });
      html += '</ul></div>';
    } else if (response.type === 'product_analysis' && response.data.length > 0) {
      html += '<div class="ai-data-table"><h5>Product Breakdown:</h5><ul>';
      response.data.forEach(product => {
        html += `<li>${product.type} - $${product.sales.toLocaleString()} sales</li>`;
      });
      html += '</ul></div>';
    } else if (response.type === 'highest_sales' && response.data.length > 0) {
      html += '<div class="ai-data-table"><h5>Top Transactions:</h5><ul>';
      response.data.forEach((record, index) => {
        html += `<li>${index + 1}. $${record.Sales?.toLocaleString()} - ${record.Customer} (${record['Product Type']})</li>`;
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
              callback: function(value) {
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
              callback: function(value) {
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
              callback: function(value) {
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
   * Test data source dropdown functionality
   */
  async testDataSourceDropdown() {
    console.log('🧪 Testing data source dropdown...');

    const sheetSelector = document.getElementById('sheet-selector');
    if (!sheetSelector) {
      console.error('❌ Data source dropdown not found!');
      this.showNotification('Data source dropdown not found!', 'error');
      return;
    }

    console.log('✅ Data source dropdown found');
    console.log('📊 Current value:', sheetSelector.value);
    console.log('📊 Available options:', Array.from(sheetSelector.options).map(opt => opt.value));

    // Test switching to different data sources
    const testSources = ['Data', 'Data-gp-2025', 'Data-gp-2024', 'Recap-data'];

    for (const source of testSources) {
      console.log(`🔄 Testing switch to: ${source}`);
      try {
        await this.switchDataSource(source);
        console.log(`✅ Successfully switched to: ${source}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
      } catch (error) {
        console.error(`❌ Failed to switch to ${source}:`, error);
      }
    }

    this.showNotification('Data source dropdown test completed - check console for results', 'info');
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
   * Test Railway database connection
   */
  async testRailwayConnection() {
    console.log('🧪 Testing Railway database connection...');

    try {
      // Test 1: Health check
      console.log('1️⃣ Testing health endpoint...');
      const healthCheck = await this.databaseService.healthCheck();
      console.log('Health check result:', healthCheck);

      if (!healthCheck) {
        throw new Error('Health check failed');
      }

      // Test 2: KPIs endpoint
      console.log('2️⃣ Testing KPIs endpoint...');
      const kpis = await this.databaseService.getKPIs();
      console.log('KPIs result:', kpis);

      // Test 3: Transactions endpoint
      console.log('3️⃣ Testing transactions endpoint...');
      const transactions = await this.databaseService.getTransactions({ limit: 5 });
      console.log('Transactions result:', transactions);

      // Test 4: Reload dashboard data
      console.log('4️⃣ Reloading dashboard data...');
      await this.loadDashboardData();

      this.showNotification('✅ Railway connection test successful!', 'success');

    } catch (error) {
      console.error('❌ Railway connection test failed:', error);
      this.showNotification(`❌ Railway test failed: ${error.message}`, 'error');
    }
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