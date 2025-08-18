/**
 * Chief Petroleum Data Service - Railway Postgres Database
 * Handles all data operations through Railway database API
 */

class ChiefDataService {
  constructor() {
    // Initialize database service
    this.databaseService = null;
    this.initialized = false;
    
    // Data cache
    this.dataCache = {};
    this.lastFetch = {};
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    console.log('🚀 Chief Petroleum Data Service initialized (Railway Postgres Mode)');
    
    // Initialize database connection
    this.initializeDatabaseService();
  }

  /**
   * Initialize database service
   */
  async initializeDatabaseService() {
    try {
      // Check if DatabaseDataService is available
      if (typeof DatabaseDataService !== 'undefined') {
        this.databaseService = new DatabaseDataService();
        
        // Test database connectivity
        const isHealthy = await this.databaseService.healthCheck();
        if (isHealthy) {
          this.initialized = true;
          console.log('✅ Railway Postgres database connected successfully');
        } else {
          throw new Error('Database health check failed');
        }
      } else {
        throw new Error('DatabaseDataService not loaded');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.showError('Unable to connect to database. Please check your connection.');
    }
  }

  /**
   * Main method to fetch fuel data
   * @param {string} dataType - Type of data to fetch: 'transactions', 'gp-2024', 'gp-2025', 'recap'
   */
  async fetchFuelData(dataType = 'transactions') {
    try {
      // Check cache first
      if (this.dataCache[dataType] && 
          (Date.now() - (this.lastFetch[dataType] || 0)) < this.cacheTimeout) {
        console.log(`📋 Using cached data for: ${dataType}`);
        return this.dataCache[dataType];
      }

      console.log(`🔄 Fetching fresh data from Railway: ${dataType}...`);
      
      if (!this.databaseService) {
        throw new Error('Database service not initialized');
      }

      let data;
      switch (dataType) {
        case 'transactions':
        case 'Data':
          data = await this.fetchTransactionsData();
          break;
        case 'gp-2024':
        case 'Data-gp-2024':
          data = await this.fetchGPData(2024);
          break;
        case 'gp-2025':
        case 'Data-gp-2025':
          data = await this.fetchGPData(2025);
          break;
        case 'recap':
        case 'Recap-data':
          data = await this.fetchRecapData();
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // Cache the results
      this.dataCache[dataType] = data;
      this.lastFetch[dataType] = Date.now();

      console.log(`✅ Data fetched successfully for: ${dataType}`);
      return data;

    } catch (error) {
      console.error(`❌ Error fetching data for ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch transactions data
   */
  async fetchTransactionsData() {
    const response = await this.databaseService.fetchTransactions({ limit: 10000 });
    
    // Transform to dashboard format
    const processedData = {
      dataName: 'transactions',
      dataType: 'transactional',
      headers: ['Date', 'Customer', 'Product Type', 'Gallon Qty', 'Sales', 'Actual Profit By Item'],
      records: response.data || [],
      summary: this.calculateTransactionsSummary(response.data || [])
    };

    return processedData;
  }

  /**
   * Fetch GP data for a specific year
   */
  async fetchGPData(year) {
    const response = await this.databaseService.fetchGPData(year);
    
    // Transform to dashboard format
    const processedData = {
      dataName: `gp-${year}`,
      dataType: 'yearly',
      headers: this.getGPHeaders(year),
      records: response.data || [],
      summary: this.calculateGPSummary(response.data || [], year)
    };

    return processedData;
  }

  /**
   * Fetch recap data
   */
  async fetchRecapData() {
    const response = await this.databaseService.fetchRecapData({ limit: 5000 });
    
    // Transform to dashboard format
    const processedData = {
      dataName: 'recap',
      dataType: 'summary',
      headers: ['Date', 'Driver', 'Company', 'Gallons', 'Profit', 'Delivery Fee', 'Margin'],
      records: response.data || [],
      summary: this.calculateRecapSummary(response.data || [])
    };

    return processedData;
  }

  /**
   * Get headers for GP data based on year
   */
  getGPHeaders(year) {
    if (year === 2024) {
      return [
        'Date', 'Dooley_Daily', 'Dooley_Rolling', 'Lubes_Daily', 'Lubes_Rolling',
        'Hauling_Daily', 'Hauling_Rolling', 'Tankwagon_Daily', 'Tankwagon_Rolling',
        'Transport_Daily', 'Transport_Rolling', 'Chief_Daily', 'Chief_Rolling'
      ];
    } else if (year === 2025) {
      return [
        'Date', 'TW_Goal', 'TW_Actual', 'Hauling_Goal', 'Hauling_Actual',
        'Transport_Goal', 'Transport_Actual', 'Lubes_Goal', 'Lubes_Actual',
        'Chief_Goal', 'Chief_Actual'
      ];
    }
    return [];
  }

  /**
   * Calculate summary for transactions data
   */
  calculateTransactionsSummary(records) {
    const summary = {
      totalSales: 0,
      totalGallons: 0,
      totalProfit: 0,
      totalCost: 0,
      recordCount: records.length,
      customers: new Set(),
      productTypes: new Set(),
      avgProfitMargin: 0,
      avgRevenuePerGallon: 0,
      activeCustomers: 0,
      productTypeCount: 0
    };

    records.forEach(record => {
      summary.totalSales += parseFloat(record.sales || 0);
      summary.totalGallons += parseFloat(record.gallon_qty || 0);
      summary.totalProfit += parseFloat(record.actual_profit || 0);
      summary.totalCost += parseFloat(record.actual_cost || 0);
      
      if (record.customer) summary.customers.add(record.customer);
      if (record.product_type) summary.productTypes.add(record.product_type);
    });

    summary.activeCustomers = summary.customers.size;
    summary.productTypeCount = summary.productTypes.size;
    summary.avgProfitMargin = summary.totalSales > 0 
      ? (summary.totalProfit / summary.totalSales) * 100 
      : 0;
    summary.avgRevenuePerGallon = summary.totalGallons > 0
      ? summary.totalSales / summary.totalGallons
      : 0;

    return summary;
  }

  /**
   * Calculate summary for GP data
   */
  calculateGPSummary(records, year) {
    const summary = {
      totalSales: 0,
      totalGoal: 0,
      recordCount: records.length,
      year: year
    };

    if (year === 2025) {
      records.forEach(record => {
        summary.totalSales += parseFloat(record.chief_rolling_total_actual || 0);
        summary.totalGoal += parseFloat(record.chief_running_total_goal || 0);
      });
    } else if (year === 2024) {
      records.forEach(record => {
        summary.totalSales += parseFloat(record.chief_petroleum_rolling || 0);
      });
    }

    return summary;
  }

  /**
   * Calculate summary for recap data
   */
  calculateRecapSummary(records) {
    const summary = {
      totalGallons: 0,
      totalProfit: 0,
      totalDeliveryFees: 0,
      recordCount: records.length,
      drivers: new Set(),
      companies: new Set()
    };

    records.forEach(record => {
      summary.totalGallons += parseFloat(record.gallons || 0);
      summary.totalProfit += parseFloat(record.profit_includes_delivery_fee || 0);
      summary.totalDeliveryFees += parseFloat(record.delivery_fee || 0);
      
      if (record.driver) summary.drivers.add(record.driver);
      if (record.company) summary.companies.add(record.company);
    });

    summary.activeDrivers = summary.drivers.size;
    summary.activeCompanies = summary.companies.size;

    return summary;
  }

  /**
   * Get top customers by sales
   */
  async getTopCustomers(limit = 5) {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getTopCustomers(data, limit);
  }

  /**
   * Get product type analysis
   */
  async getProductTypeAnalysis() {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getProductTypeAnalysis(data);
  }

  /**
   * Get sales trend data
   */
  async getSalesTrendData(period = 'monthly') {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getSalesTrendData(data, period);
  }

  /**
   * Get daily recap for specific date
   */
  async getDailyRecap(targetDate) {
    if (!this.databaseService) return null;

    const dateStr = new Date(targetDate).toISOString().split('T')[0];
    
    // Fetch transactions for specific date
    const response = await this.databaseService.fetchTransactions({
      startDate: dateStr,
      endDate: dateStr
    });

    const dayRecords = response.data || [];
    
    if (dayRecords.length === 0) {
      return null;
    }

    // Calculate daily metrics
    const metrics = {
      date: targetDate,
      totalDeliveries: dayRecords.length,
      totalSales: dayRecords.reduce((sum, r) => sum + parseFloat(r.sales || 0), 0),
      totalProfit: dayRecords.reduce((sum, r) => sum + parseFloat(r.actual_profit || 0), 0),
      totalGallons: dayRecords.reduce((sum, r) => sum + parseFloat(r.gallon_qty || 0), 0),
      uniqueCustomers: new Set(dayRecords.map(r => r.customer).filter(c => c)).size,
      avgProfitMargin: 0
    };

    metrics.avgProfitMargin = metrics.totalSales > 0 
      ? (metrics.totalProfit / metrics.totalSales) * 100 
      : 0;

    // Product breakdown
    const productBreakdown = {};
    dayRecords.forEach(record => {
      const product = record.product_type || 'Unknown';
      if (!productBreakdown[product]) {
        productBreakdown[product] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }
      productBreakdown[product].gallons += parseFloat(record.gallon_qty || 0);
      productBreakdown[product].sales += parseFloat(record.sales || 0);
      productBreakdown[product].profit += parseFloat(record.actual_profit || 0);
      productBreakdown[product].deliveries += 1;
    });

    // Customer breakdown
    const customerBreakdown = {};
    dayRecords.forEach(record => {
      const customer = record.customer || 'Unknown';
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }
      customerBreakdown[customer].gallons += parseFloat(record.gallon_qty || 0);
      customerBreakdown[customer].sales += parseFloat(record.sales || 0);
      customerBreakdown[customer].profit += parseFloat(record.actual_profit || 0);
      customerBreakdown[customer].deliveries += 1;
    });

    return {
      metrics,
      productBreakdown,
      customerBreakdown,
      records: dayRecords
    };
  }

  /**
   * Clear cache
   */
  clearCache(dataType = null) {
    if (dataType) {
      delete this.dataCache[dataType];
      delete this.lastFetch[dataType];
      console.log(`🗑️ Cache cleared for: ${dataType}`);
    } else {
      this.dataCache = {};
      this.lastFetch = {};
      console.log('🗑️ All data cache cleared');
    }
  }

  /**
   * Get current data type
   */
  getCurrentDataType() {
    return 'transactions';
  }

  /**
   * Get current data type (alias for compatibility)
   */
  getCurrentSheet() {
    return this.getCurrentDataType();
  }

  /**
   * Set current data type (for compatibility - no-op since we only use database)
   */
  setCurrentSheet(dataType) {
    console.log(`📋 Data type set to: ${dataType} (Railway database mode)`);
  }

  /**
   * Get available data types (for compatibility)
   */
  getAvailableSheets() {
    return ['transactions', 'gp-2024', 'gp-2025', 'recap'];
  }

  /**
   * Get data type information (for compatibility)
   */
  getSheetInfo(dataType) {
    const infoMap = {
      'transactions': { type: 'transactional', description: 'Transaction Data' },
      'Data': { type: 'transactional', description: 'Transaction Data' },
      'gp-2024': { type: 'yearly', description: '2024 GP Data' },
      'Data-gp-2024': { type: 'yearly', description: '2024 GP Data' },
      'gp-2025': { type: 'yearly', description: '2025 GP Data' },
      'Data-gp-2025': { type: 'yearly', description: '2025 GP Data' },
      'recap': { type: 'summary', description: 'Recap Data' },
      'Recap-data': { type: 'summary', description: 'Recap Data' }
    };
    return infoMap[dataType] || { type: 'unknown', description: 'Unknown Data Type' };
  }

  /**
   * Get daily recap data
   */
  getDailyRecap(data, selectedDate) {
    if (!data || !data.records) return null;

    const targetDate = new Date(selectedDate).toDateString();
    const dayRecords = data.records.filter(record => {
      const recordDate = new Date(record.Date || record.date).toDateString();
      return recordDate === targetDate;
    });

    if (dayRecords.length === 0) return null;

    // Calculate metrics
    const metrics = this.calculateDailyMetrics(dayRecords);

    // Calculate breakdowns
    const productBreakdown = this.calculateProductBreakdown(dayRecords);
    const customerBreakdown = this.calculateCustomerBreakdown(dayRecords);

    return {
      metrics,
      productBreakdown,
      customerBreakdown,
      records: dayRecords
    };
  }

  /**
   * Calculate daily metrics from records
   */
  calculateDailyMetrics(records) {
    let totalSales = 0;
    let totalGallons = 0;
    let totalProfit = 0;
    const uniqueCustomers = new Set();

    records.forEach(record => {
      totalSales += parseFloat(record.Sales || record.sales || 0);
      totalGallons += parseFloat(record['Gallon Qty'] || record.gallons || 0);
      totalProfit += parseFloat(record['Actual Profit By Item'] || record.profit || 0);

      const customer = record.Customer || record.customer;
      if (customer) {
        uniqueCustomers.add(customer);
      }
    });

    const avgProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    return {
      totalDeliveries: records.length,
      totalSales,
      totalGallons,
      totalProfit,
      uniqueCustomers: uniqueCustomers.size,
      avgProfitMargin
    };
  }

  /**
   * Calculate product breakdown from records
   */
  calculateProductBreakdown(records) {
    const productMap = {};

    records.forEach(record => {
      const product = record['Product Type'] || record.product || 'Unknown';
      const sales = parseFloat(record.Sales || record.sales || 0);
      const gallons = parseFloat(record['Gallon Qty'] || record.gallons || 0);
      const profit = parseFloat(record['Actual Profit By Item'] || record.profit || 0);

      if (!productMap[product]) {
        productMap[product] = {
          product,
          sales: 0,
          gallons: 0,
          profit: 0,
          deliveries: 0
        };
      }

      productMap[product].sales += sales;
      productMap[product].gallons += gallons;
      productMap[product].profit += profit;
      productMap[product].deliveries += 1;
    });

    return Object.values(productMap).sort((a, b) => b.sales - a.sales);
  }

  /**
   * Calculate customer breakdown from records
   */
  calculateCustomerBreakdown(records) {
    const customerMap = {};

    records.forEach(record => {
      const customer = record.Customer || record.customer || 'Unknown';
      const sales = parseFloat(record.Sales || record.sales || 0);
      const gallons = parseFloat(record['Gallon Qty'] || record.gallons || 0);
      const profit = parseFloat(record['Actual Profit By Item'] || record.profit || 0);

      if (!customerMap[customer]) {
        customerMap[customer] = {
          customer,
          sales: 0,
          gallons: 0,
          profit: 0,
          deliveries: 0
        };
      }

      customerMap[customer].sales += sales;
      customerMap[customer].gallons += gallons;
      customerMap[customer].profit += profit;
      customerMap[customer].deliveries += 1;
    });

    return Object.values(customerMap).sort((a, b) => b.sales - a.sales);
  }

  /**
   * Get year over year data
   */
  async getYearOverYearData() {
    try {
      const [data2024, data2025] = await Promise.all([
        this.fetchFuelData('gp-2024'),
        this.fetchFuelData('gp-2025')
      ]);

      return {
        hasPartialData: !!(data2024 && data2025),
        data2024,
        data2025
      };
    } catch (error) {
      console.error('Error fetching year over year data:', error);
      return { hasPartialData: false };
    }
  }

  /**
   * Get KPI data
   */
  async getKPIData(filters = {}) {
    if (!this.databaseService) {
      return {
        total_transactions: 0,
        total_sales: 0,
        total_gallons: 0,
        total_profit: 0,
        avg_margin: 0,
        active_customers: 0
      };
    }

    return await this.databaseService.fetchKPIs(filters);
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('❌ Error:', message);
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorModal && errorMessage) {
      errorMessage.textContent = message;
      errorModal.style.display = 'block';
    }
  }

  /**
   * Get year-over-year comparison data
   */
  async getYearOverYearData() {
    try {
      const [data2024, data2025] = await Promise.all([
        this.fetchFuelData('gp-2024'),
        this.fetchFuelData('gp-2025')
      ]);

      return {
        year2024: data2024,
        year2025: data2025,
        comparison: this.calculateYearComparison(data2024, data2025)
      };
    } catch (error) {
      console.error('❌ Error fetching year-over-year data:', error);
      throw error;
    }
  }

  /**
   * Calculate year comparison metrics
   */
  calculateYearComparison(data2024, data2025) {
    const summary2024 = data2024.summary;
    const summary2025 = data2025.summary;

    return {
      salesGrowth: this.calculateGrowthRate(summary2024.totalSales, summary2025.totalSales),
      goalAchievement: summary2025.totalGoal > 0 
        ? (summary2025.totalSales / summary2025.totalGoal) * 100 
        : 0
    };
  }

  /**
   * Calculate growth rate
   */
  calculateGrowthRate(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.initialized && this.databaseService !== null;
  }
}

// Export for use in other modules
window.ChiefDataService = ChiefDataService;