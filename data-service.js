/**
 * Chief Petroleum Data Service - Railway Postgres Database
 * COMPLETE FIX: Handles all four Railway tables with proper mapping
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
   * COMPLETE FIX: Main method to fetch fuel data with all Railway tables
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
      
      // COMPLETE FIX: Proper mapping to Railway API endpoints
      switch (dataType) {
        case 'transactions':
        case 'Data':
          console.log('📊 Fetching transactions from Railway...');
          data = await this.fetchTransactionsData();
          break;
          
        case 'gp-2024':
        case 'Data-gp-2024':
          console.log('📊 Fetching GP 2024 data from Railway...');
          data = await this.fetchGPData(2024);
          break;
          
        case 'gp-2025':
        case 'Data-gp-2025':
          console.log('📊 Fetching GP 2025 data from Railway...');
          data = await this.fetchGPData(2025);
          break;
          
        case 'recap':
        case 'Recap-data':
          console.log('📊 Fetching recap data from Railway...');
          data = await this.fetchRecapData();
          break;
          
        default:
          console.warn(`⚠️ Unknown data type: ${dataType}, defaulting to transactions`);
          data = await this.fetchTransactionsData();
      }

      // Validate we got data
      if (!data || !data.records) {
        throw new Error(`No valid data structure returned for ${dataType}`);
      }

      if (data.records.length === 0) {
        console.warn(`⚠️ No records found for ${dataType}`);
      } else {
        console.log(`✅ Successfully loaded ${data.records.length} records for ${dataType}`);
      }

      // Cache the results
      this.dataCache[dataType] = data;
      this.lastFetch[dataType] = Date.now();

      console.log(`✅ Data fetched successfully for: ${dataType}`);
      return data;

    } catch (error) {
      console.error(`❌ Error fetching data for ${dataType}:`, error);
      
      // Clear any bad cache
      delete this.dataCache[dataType];
      delete this.lastFetch[dataType];
      
      throw error;
    }
  }

  /**
   * FIXED: Fetch transactions data with proper field mapping
   */
  async fetchTransactionsData() {
    const response = await this.databaseService.fetchTransactions({ limit: 10000 });
    
    if (!response || !response.data) {
      throw new Error('Invalid transactions response from Railway API');
    }

    console.log(`📊 Processing ${response.data.length} transaction records...`);

    // Transform to dashboard format with field mapping
    const processedData = {
      dataName: 'transactions',
      dataType: 'transactional',
      headers: this.getTransactionHeaders(),
      records: this.mapTransactionFields(response.data),
      summary: this.calculateTransactionsSummary(response.data)
    };

    return processedData;
  }

  /**
   * FIXED: Get transaction headers for dashboard compatibility
   */
  getTransactionHeaders() {
    return [
      'Date', 'Customer', 'Customer-Address', 'Product Type', 
      'Gallon Qty', 'Sales', 'Actual Profit By Item', 'Actual Cost by item'
    ];
  }

  /**
   * FIXED: Map Railway transaction fields to dashboard field names
   */
  mapTransactionFields(records) {
    return records.map(record => ({
      // Map Railway API fields (lowercase_underscore) to Dashboard fields (Title Case)
      'Date': record.date || record.transaction_date,
      'Customer': record.customer || record.customer_name,
      'Customer-Address': record.customer_address || record.address,
      'Product Type': record.product_type || record.productType,
      'Gallon Qty': parseFloat(record.gallon_qty || record.gallons || 0),
      'Sales': parseFloat(record.sales || record.revenue || 0),
      'Actual Profit By Item': parseFloat(record.actual_profit || record.profit || 0),
      'Actual Cost by item': parseFloat(record.actual_cost || record.cost || 0),
      // Keep original fields for compatibility
      ...record
    }));
  }

  /**
   * FIXED: Fetch GP data with proper error handling
   */
  async fetchGPData(year) {
    const response = await this.databaseService.fetchGPData(year);
    
    if (!response || !response.data) {
      throw new Error(`Invalid GP ${year} response from Railway API`);
    }

    console.log(`📊 Processing ${response.data.length} GP ${year} records...`);

    // Transform to dashboard format
    const processedData = {
      dataName: `gp-${year}`,
      dataType: 'yearly',
      headers: this.getGPHeaders(year),
      records: this.mapGPFields(response.data, year),
      summary: this.calculateGPSummary(response.data, year)
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
        'Chief_Goal', 'Chief_Actual', 'Sales', 'Gallon Qty'
      ];
    }
    return ['Date', 'Sales', 'Goal', 'Actual'];
  }

  /**
   * FIXED: Map GP fields to dashboard format
   */
  mapGPFields(records, year) {
    return records.map(record => {
      const mapped = {
        'Date': record.date,
        'Sales': parseFloat(record.sales || record.revenue || 0),
        'Gallon Qty': parseFloat(record.gallons || record.gallon_qty || 0),
        // Keep original fields
        ...record
      };

      // Add year-specific field mappings
      if (year === 2024) {
        Object.assign(mapped, {
          'Chief_Daily': parseFloat(record.chief_daily || 0),
          'Chief_Rolling': parseFloat(record.chief_rolling || 0),
          'Dooley_Daily': parseFloat(record.dooley_daily || 0),
          'Dooley_Rolling': parseFloat(record.dooley_rolling || 0)
        });
      } else if (year === 2025) {
        Object.assign(mapped, {
          'Chief_Goal': parseFloat(record.chief_goal || 0),
          'Chief_Actual': parseFloat(record.chief_actual || 0),
          'TW_Goal': parseFloat(record.tw_goal || 0),
          'TW_Actual': parseFloat(record.tw_actual || 0)
        });
      }

      return mapped;
    });
  }

  /**
   * FIXED: Fetch recap data
   */
  async fetchRecapData() {
    const response = await this.databaseService.fetchRecapData({ limit: 5000 });
    
    if (!response || !response.data) {
      throw new Error('Invalid recap response from Railway API');
    }

    console.log(`📊 Processing ${response.data.length} recap records...`);

    // Transform to dashboard format
    const processedData = {
      dataName: 'recap',
      dataType: 'summary',
      headers: this.getRecapHeaders(),
      records: this.mapRecapFields(response.data),
      summary: this.calculateRecapSummary(response.data)
    };

    return processedData;
  }

  /**
   * Get recap headers
   */
  getRecapHeaders() {
    return [
      'Date', 'Driver', 'Company', 'Gallons', 'Profit', 
      'Delivery Fee', 'Margin', 'OPIS True'
    ];
  }

  /**
   * FIXED: Map recap fields to dashboard format
   */
  mapRecapFields(records) {
    return records.map(record => ({
      'Date': record.date,
      'Driver': record.driver,
      'Company': record.company,
      'Gallons': parseFloat(record.gallons || 0),
      'Profit': parseFloat(record.profit_includes_delivery_fee || record.profit || 0),
      'Delivery Fee': parseFloat(record.delivery_fee || 0),
      'Margin': parseFloat(record.margin || 0),
      'OPIS True': record.opis_true ? 'TRUE' : 'FALSE',
      // Keep original fields
      ...record
    }));
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
      summary.totalGallons += parseFloat(record.gallon_qty || record.gallons || 0);
      summary.totalProfit += parseFloat(record.actual_profit || record.profit || 0);
      summary.totalCost += parseFloat(record.actual_cost || record.cost || 0);
      
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
      totalActual: 0,
      recordCount: records.length,
      year: year
    };

    records.forEach(record => {
      summary.totalSales += parseFloat(record.sales || record.revenue || 0);
      
      if (year === 2025) {
        summary.totalActual += parseFloat(record.chief_actual || 0);
        summary.totalGoal += parseFloat(record.chief_goal || 0);
      } else if (year === 2024) {
        summary.totalActual += parseFloat(record.chief_rolling || 0);
      }
    });

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
      summary.totalProfit += parseFloat(record.profit_includes_delivery_fee || record.profit || 0);
      summary.totalDeliveryFees += parseFloat(record.delivery_fee || 0);
      
      if (record.driver) summary.drivers.add(record.driver);
      if (record.company) summary.companies.add(record.company);
    });

    summary.activeDrivers = summary.drivers.size;
    summary.activeCompanies = summary.companies.size;

    return summary;
  }

  /**
   * FIXED: Get top customers by sales
   */
  async getTopCustomers(limit = 5) {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getTopCustomers(data, limit);
  }

  /**
   * FIXED: Get product type analysis
   */
  async getProductTypeAnalysis() {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getProductTypeAnalysis(data);
  }

  /**
   * FIXED: Get sales trend data
   */
  async getSalesTrendData(period = 'monthly') {
    if (!this.databaseService) return [];
    
    const data = await this.fetchFuelData('transactions');
    return this.databaseService.getSalesTrendData(data, period);
  }

  /**
   * FIXED: Get daily recap for specific date
   */
  async getDailyRecap(targetDate) {
    if (!this.databaseService) {
      console.error('❌ Database service not available for daily recap');
      return null;
    }

    const dateStr = new Date(targetDate).toISOString().split('T')[0];
    console.log('📅 Getting daily recap for date:', dateStr);

    try {
      // Fetch transactions for specific date
      const response = await this.databaseService.fetchTransactions({
        startDate: dateStr,
        endDate: dateStr
      });

      const dayRecords = response.data || [];
      console.log(`📊 Found ${dayRecords.length} records for ${dateStr}`);

      if (dayRecords.length === 0) {
        console.log('📅 No records found for date:', dateStr);
        return null;
      }

      // Calculate daily metrics using mapped fields
      const mappedRecords = this.mapTransactionFields(dayRecords);
      const metrics = this.calculateDailyMetrics(mappedRecords);
      const productBreakdown = this.calculateProductBreakdown(mappedRecords);
      const customerBreakdown = this.calculateCustomerBreakdown(mappedRecords);

      return {
        metrics,
        productBreakdown,
        customerBreakdown,
        records: mappedRecords
      };
      
    } catch (error) {
      console.error('❌ Error getting daily recap:', error);
      return null;
    }
  }

  /**
   * Calculate daily metrics from mapped records
   */
  calculateDailyMetrics(records) {
    let totalSales = 0;
    let totalGallons = 0;
    let totalProfit = 0;
    const uniqueCustomers = new Set();

    records.forEach(record => {
      totalSales += parseFloat(record['Sales'] || 0);
      totalGallons += parseFloat(record['Gallon Qty'] || 0);
      totalProfit += parseFloat(record['Actual Profit By Item'] || 0);

      const customer = record['Customer'];
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
   * Calculate product breakdown from mapped records
   */
  calculateProductBreakdown(records) {
    const productMap = {};

    records.forEach(record => {
      const product = record['Product Type'] || 'Unknown';
      const sales = parseFloat(record['Sales'] || 0);
      const gallons = parseFloat(record['Gallon Qty'] || 0);
      const profit = parseFloat(record['Actual Profit By Item'] || 0);

      if (!productMap[product]) {
        productMap[product] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }

      productMap[product].gallons += gallons;
      productMap[product].sales += sales;
      productMap[product].profit += profit;
      productMap[product].deliveries += 1;
    });

    return productMap;
  }

  /**
   * Calculate customer breakdown from mapped records
   */
  calculateCustomerBreakdown(records) {
    const customerMap = {};

    records.forEach(record => {
      const customer = record['Customer'] || 'Unknown';
      const sales = parseFloat(record['Sales'] || 0);
      const gallons = parseFloat(record['Gallon Qty'] || 0);
      const profit = parseFloat(record['Actual Profit By Item'] || 0);

      if (!customerMap[customer]) {
        customerMap[customer] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }

      customerMap[customer].gallons += gallons;
      customerMap[customer].sales += sales;
      customerMap[customer].profit += profit;
      customerMap[customer].deliveries += 1;
    });

    return customerMap;
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
   * Set current data type (for compatibility)
   */
  setCurrentSheet(dataType) {
    console.log(`📋 Data type set to: ${dataType} (Railway database mode)`);
  }

  /**
   * Get available data types
   */
  getAvailableSheets() {
    return ['transactions', 'gp-2024', 'gp-2025', 'recap'];
  }

  /**
   * Get data type information
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
      return { 
        hasPartialData: false,
        error: error.message 
      };
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
        ? (summary2025.totalActual / summary2025.totalGoal) * 100 
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
   * Check if database is connected
   */
  isConnected() {
    return this.initialized && this.databaseService !== null;
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
}

// Export for use in other modules
window.ChiefDataService = ChiefDataService;