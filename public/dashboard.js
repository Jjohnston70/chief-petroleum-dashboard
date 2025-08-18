/**
 * Chief Petroleum Dashboard Main Controller
 * Orchestrates all dashboard functionality
 */

class ChiefDashboard {
  constructor() {
    this.dataService = null;
    this.chartManager = null;
    this.themeManager = null;
    this.currentData = null;
    this.currentPeriod = 'monthly';
    this.isLoading = false;
    
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  async init() {
    try {
      console.log('🚀 Initializing Chief Petroleum Dashboard...');
      
      // Show loading indicator
      this.showLoading(true);
      
      // Initialize services with error handling
      this.dataService = new DatabaseDataService();
      this.dataService.dashboard = this; // Reference for filtered data access
      this.chartManager = new ChiefChartManager();
      
      // Store reference for theme manager to access
      window.chartManager = this.chartManager;
      
      // Test data service connection
      console.log('🔍 Testing data service connections...');
      await this.dataService.testApiConnection();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data with fallback handling
      await this.loadDashboardData();
      
      // Initialize theme manager
      this.themeManager = new ChiefThemeManager();
      
      console.log('✅ Dashboard initialized successfully');
      this.showLoading(false);
      
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showLoading(false);
      this.showError('Failed to initialize dashboard: ' + error.message);
    }
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

    // Sheet selector
    const sheetSelector = document.getElementById('sheet-selector');
    if (sheetSelector) {
      sheetSelector.addEventListener('change', (e) => {
        this.switchSheet(e.target.value);
      });

      // Restore saved sheet selection
      const savedSheet = localStorage.getItem('chief-selected-sheet');
      if (savedSheet && this.dataService.getAvailableSheets().includes(savedSheet)) {
        sheetSelector.value = savedSheet;
        this.dataService.switchSheet(savedSheet);
      }
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

    // Date range filter event listeners
    document.getElementById('apply-date-filter').addEventListener('click', () => {
      this.applyDateFilter();
    });

    document.getElementById('clear-date-filter').addEventListener('click', () => {
      this.clearDateFilter();
    });

    // Set default date to 2 business days ago (skipping weekends)
    const defaultRecapDate = this.getBusinessDaysAgo(2);
    document.getElementById('recap-date').value = defaultRecapDate;
  }

  /**
   * Load dashboard data with robust error handling
   */
  async loadDashboardData() {
    try {
      this.showLoading('Loading Chief Petroleum data...');
      
      console.log('📊 Attempting to load dashboard data...');
      
      // Check data service connection status
      const connectionStatus = this.dataService.getConnectionStatus();
      console.log('🔌 Connection status:', connectionStatus);
      
      // Try to fetch KPIs first (lighter request)
      console.log('📈 Fetching KPIs...');
      const kpisData = await this.dataService.fetchKPIs();
      console.log('✅ KPIs loaded successfully');
      
      // Try to fetch transactions
      console.log('📋 Fetching transactions...');
      const transactionsData = await this.dataService.fetchTransactions({ limit: 1000 });
      console.log('✅ Transactions loaded successfully');
      
      // Transform data for dashboard compatibility
      this.currentData = this.transformDataForDashboard(kpisData, transactionsData);
      
      console.log('📊 Data transformation complete:', {
        kpis: Object.keys(kpisData),
        transactions: transactionsData.total || transactionsData.data?.length || 0,
        dataSource: connectionStatus.current_source
      });
      
      // Update all dashboard components
      this.updateKPIs();
      this.updateCharts();
      this.updateDataTable();
      this.updateLastUpdated();
      this.updateDataSourceInfo(connectionStatus.current_source);

      // Load GP charts
      this.loadGPCharts();

      // Auto-load recap data for recent date
      await this.loadDailyRecap();

      this.hideLoading();
      
      // Show success message
      this.showStatusMessage(`✅ Dashboard loaded using ${connectionStatus.current_source}`, 'success');
      
    } catch (error) {
      console.error('❌ Dashboard data loading failed:', error);
      this.hideLoading();
      
      // Try fallback to sample data or show graceful error
      this.handleDataLoadError(error);
    }
  }

  /**
   * Transform API data for dashboard compatibility
   */
  transformDataForDashboard(kpisData, transactionsData) {
    return {
      summary: {
        totalSales: kpisData.total_sales || 0,
        totalGallons: kpisData.total_gallons || 0,
        totalProfit: kpisData.total_profit || 0,
        avgProfitMargin: kpisData.avg_margin || 0,
        activeCustomers: kpisData.active_customers || 0,
        transactionCount: kpisData.total_transactions || 0
      },
      transactions: transactionsData.data || [],
      total: transactionsData.total || 0
    };
  }

  /**
   * Handle data loading errors gracefully
   */
  handleDataLoadError(error) {
    console.log('🔄 Handling data load error with fallback strategy...');
    
    // Show user-friendly error message
    this.showError(`
      <div class="error-details">
        <h4>🔌 Data Connection Issue</h4>
        <p>We're having trouble connecting to the data source.</p>
        <div class="error-actions">
          <button onclick="window.dashboard.retryDataLoad()" class="retry-btn">
            🔄 Retry Connection
          </button>
          <button onclick="window.dashboard.loadSampleData()" class="sample-btn">
            📊 Load Sample Data
          </button>
        </div>
        <details>
          <summary>Technical Details</summary>
          <code>${error.message}</code>
        </details>
      </div>
    `);
  }

  /**
   * Retry data loading
   */
  async retryDataLoad() {
    console.log('🔄 Retrying data load...');
    this.hideError();
    
    // Clear cache and retry
    this.dataService.clearCache();
    this.dataService.apiAvailable = null; // Reset API test
    
    await this.loadDashboardData();
  }

  /**
   * Load sample data for demonstration
   */
  loadSampleData() {
    console.log('📊 Loading sample data for demonstration...');
    this.hideError();
    
    // Sample KPIs
    const sampleKPIs = {
      total_sales: 125000.50,
      total_gallons: 45000,
      total_profit: 15750.25,
      profit_margin: 12.6,
      active_customers: 87,
      transaction_count: 234
    };
    
    // Sample transactions
    const sampleTransactions = [
      {
        id: 'sample_1',
        date: new Date().toISOString().split('T')[0],
        customer: 'ABC Transport',
        product_type: 'Diesel',
        gallons: 500,
        sales: 1750.00,
        profit: 150.00
      },
      {
        id: 'sample_2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        customer: 'XYZ Logistics',
        product_type: 'Gasoline',
        gallons: 300,
        sales: 1080.00,
        profit: 95.00
      }
    ];
    
    // Update dashboard with sample data
    this.currentData = this.transformDataForDashboard(sampleKPIs, { data: sampleTransactions, total: 2 });
    
    this.updateKPIs();
    this.updateCharts();
    this.updateDataTable();
    this.updateLastUpdated();
    this.updateDataSourceInfo('Sample Data');
    
    this.showStatusMessage('📊 Sample data loaded for demonstration', 'info');
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

  /**
   * Switch to a different data sheet
   * @param {string} sheetName - Name of the sheet to switch to
   */
  async switchSheet(sheetName) {
    if (this.isLoading) return;

    try {
      console.log(`🔄 Switching to sheet: ${sheetName}`);

      // Show loading with sheet-specific message
      this.showLoading(`Loading ${sheetName} data...`);

      // Update data service current sheet
      this.dataService.switchSheet(sheetName);

      // Save selection to localStorage
      localStorage.setItem('chief-selected-sheet', sheetName);

      // Load data for the new sheet
      await this.loadDashboardData();

      // Update the page title to reflect current sheet
      this.updatePageTitle(sheetName);

      console.log(`✅ Successfully switched to sheet: ${sheetName}`);

    } catch (error) {
      console.error(`❌ Failed to switch to sheet ${sheetName}:`, error);
      this.showError(`Failed to load ${sheetName}: ${error.message}`);

      // Revert selector to previous sheet
      const currentSheet = this.dataService.getCurrentSheet();
      const sheetSelector = document.getElementById('sheet-selector');
      if (sheetSelector) {
        sheetSelector.value = currentSheet;
      }
    }
  }

  /**
   * Update page title based on current sheet
   * @param {string} sheetName - Current sheet name
   */
  updatePageTitle(sheetName) {
    const sheetInfo = this.dataService.getSheetInfo(sheetName);
    const titleElement = document.querySelector('.company-info p');

    if (titleElement && sheetInfo) {
      titleElement.textContent = `Fuel Business Dashboard - ${sheetInfo.description}`;
    }
  }

  /**
   * Update KPI cards
   */
  updateKPIs() {
    if (!this.currentData) {
      console.log('⚠️ No current data available for KPIs');
      return;
    }
    
    const summary = this.currentData.summary;
    
    if (!summary) {
      console.log('⚠️ No summary data available for KPIs');
      return;
    }
    
    console.log('📊 Updating KPIs with data:', summary);
    
    // Update KPI values with safe fallbacks
    this.updateKPI('total-sales', summary.totalSales || summary.total_sales || 0, 'currency');
    this.updateKPI('total-gallons', summary.totalGallons || summary.total_gallons || 0, 'number');
    this.updateKPI('profit-margin', summary.profitMargin || summary.profit_margin || summary.avgProfitMargin || 0, 'percent');
    this.updateKPI('active-customers', summary.activeCustomers || summary.active_customers || 0, 'number');
    
    // Update change indicators (placeholder - implement trend calculation later)
    this.updateKPIChange('sales-change', 0);
    this.updateKPIChange('gallons-change', 0);
    this.updateKPIChange('margin-change', 0);
    this.updateKPIChange('customers-change', 0);
    
    console.log('✅ KPIs updated successfully');
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
    if (!this.currentData || !this.chartManager) return;

    console.log('📈 Updating charts...');

    const currentSheet = this.dataService.getCurrentSheet();
    const sheetType = this.dataService.getSheetInfo(currentSheet)?.type;

    // Always show basic charts
    this.chartManager.createSalesTrendChart(this.dataService, this.currentPeriod);
    this.chartManager.createProductChart(this.dataService);
    this.chartManager.createCustomerChart(this.dataService);
    this.chartManager.createProfitChart(this.dataService);

    // Force chart resize after creation
    setTimeout(() => {
      if (this.chartManager) {
        this.chartManager.resizeAllCharts();
      }
    }, 100);

    // Hide all advanced charts initially
    this.hideAllAdvancedCharts();

    // Show sheet-specific charts
    if (sheetType === 'yearly' || currentSheet.includes('2024') || currentSheet.includes('2025')) {
      await this.showYearlyCharts(currentSheet);
    } else if (sheetType === 'summary' || currentSheet === 'Recap-data') {
      await this.showSummaryCharts();
    } else if (currentSheet === 'Data') {
      await this.showTransactionalCharts();
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
   * Update data table
   */
  updateDataTable() {
    if (!this.currentData) return;
    
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Get recent transactions (last 50)
    // Fix: Use 'transactions' instead of 'records' based on transformDataForDashboard output
    const transactions = this.currentData.transactions || [];
    console.log(`📊 Updating data table with ${transactions.length} transactions`);
    
    const recentTransactions = transactions
      .filter(record => record['Date'])
      .sort((a, b) => new Date(b['Date']) - new Date(a['Date']))
      .slice(0, 50);
    
    // Add rows
    recentTransactions.forEach(record => {
      const row = this.createTableRow(record);
      tbody.appendChild(row);
    });
  }

  /**
   * Create table row
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
      
      // Prepare CSV data
      const headers = this.currentData.headers;
      const records = this.currentData.records;
      
      let csvContent = headers.join(',') + '\n';
      
      records.forEach(record => {
        const row = headers.map(header => {
          const value = record[header] || '';
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
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
   * Update last updated timestamp
   */
  updateLastUpdated() {
    const element = document.getElementById('update-time');
    if (element) {
      element.textContent = new Date().toLocaleString();
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
   * Show status message
   */
  showStatusMessage(message, type = 'info') {
    console.log(`📝 Status: ${message}`);
    
    // Update status in header
    const statusElement = document.getElementById('data-source');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-${type}`;
    }
    
    // Show temporary notification
    this.showNotification(message, type);
  }

  /**
   * Update data source info in header
   */
  updateDataSourceInfo(source) {
    const dataSourceElement = document.getElementById('data-source');
    if (dataSourceElement) {
      dataSourceElement.textContent = source;
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
   * Show notification (you could implement a toast notification)
   */
  showNotification(message) {
    console.log('💡 Notification:', message);
    
    // Simple browser notification for now
    // You could implement a custom toast component
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Chief Petroleum Dashboard', {
        body: message,
        icon: '../Chief_logo.png'
      });
    }
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
   * Load daily recap for selected date
   */
  async loadDailyRecap() {
    const selectedDate = document.getElementById('recap-date').value;
    if (!selectedDate || !this.currentData) {
      this.showNotification('Please select a date and ensure data is loaded', 'warning');
      return;
    }

    try {
      console.log('📅 Loading daily recap for:', selectedDate);

      const dailyData = this.dataService.getDailyRecap(this.currentData, selectedDate);

      if (!dailyData) {
        this.showNotification(`No data found for ${selectedDate}`, 'info');
        this.hideDailyRecap();
        return;
      }

      this.displayDailyRecap(dailyData);
      this.showNotification(`Daily recap loaded for ${selectedDate}`, 'success');

    } catch (error) {
      console.error('❌ Error loading daily recap:', error);
      this.showNotification('Failed to load daily recap', 'error');
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
    this.updateCharts();
  }

  /**
   * Clear date range filter
   */
  clearDateFilter() {
    this.dateFilter = null;
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    this.showNotification('Date filter cleared', 'info');
    this.updateCharts();
  }

  /**
   * Filter data by date range
   */
  getFilteredData() {
    if (!this.currentData || !this.dateFilter) {
      return this.currentData;
    }

    const filteredRecords = this.currentData.records.filter(record => {
      const recordDate = new Date(record['Date']);
      const fromDate = new Date(this.dateFilter.from);
      const toDate = new Date(this.dateFilter.to);

      return recordDate >= fromDate && recordDate <= toDate;
    });

    // Create filtered data object
    return {
      ...this.currentData,
      records: filteredRecords,
      summary: this.calculateSummary(filteredRecords)
    };
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
   * Load GP time series charts
   */
  async loadGPCharts() {
    try {
      console.log('📊 Loading GP time series charts...');

      // For now, just log that this function exists
      // The actual implementation would depend on having GP data available
      console.log('✅ GP charts function exists (placeholder implementation)');

    } catch (error) {
      console.error('Error loading GP charts:', error);
      this.showNotification('Could not load GP time series charts', 'warning');
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
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new ChiefDashboard();
});

// Export for use in other modules
window.ChiefDashboard = ChiefDashboard;