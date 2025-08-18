// Chief Petroleum Dashboard - Database Data Service with Fallback
// Handles Railway database API calls with Google Sheets fallback

class DatabaseDataService {
  constructor() {
    // Updated Railway API URL - endpoints are at root level, not /api
    this.apiBaseUrl = 'https://api-server-final-production.up.railway.app';
    
    // Fallback to Google Sheets if API fails
    this.fallbackToSheets = true;
    this.sheetsService = null;
    
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Available data sources for compatibility
    this.availableSheets = ['Data', 'Data-gp-2024', 'Data-gp-2025', 'Recap-data'];
    this.currentSheet = 'Data';
    
    // Track API availability
    this.apiAvailable = null; // null = untested, true = working, false = failed
    
    console.log('🚀 Database Data Service initialized with fallback support');
  }

  /**
   * Test API availability
   */
  async testApiConnection() {
    try {
      console.log('🔍 Testing Railway API connection...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Use the health endpoint that exists in your api-server.js
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const healthData = await response.json();
        this.apiAvailable = true;
        console.log('✅ Railway API is available:', healthData);
        return true;
      } else {
        console.log('⚠️ Railway API returned:', response.status);
        this.apiAvailable = false;
        return false;
      }
    } catch (error) {
      console.log('❌ Railway API connection failed:', error.message);
      this.apiAvailable = false;
      return false;
    }
  }

  /**
   * Initialize fallback to Google Sheets
   */
  initializeFallback() {
    if (!this.sheetsService && window.ChiefDataService) {
      console.log('🔄 Initializing Google Sheets fallback...');
      this.sheetsService = new ChiefDataService();
      return true;
    }
    return false;
  }

  /**
   * Fetch transactions with automatic fallback
   */
  async fetchTransactions(filters = {}) {
    const cacheKey = `transactions_${JSON.stringify(filters)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 Returning cached transactions data');
        return cached.data;
      }
    }

    // Try Railway API first (if not already failed)
    if (this.apiAvailable !== false) {
      try {
        console.log('🚀 Fetching transactions from Railway API...');
        
        const params = new URLSearchParams(filters);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${this.apiBaseUrl}/api/transactions?${params}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.apiAvailable = true;
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        console.log('✅ Successfully fetched transactions from Railway API');
        return data;
        
      } catch (error) {
        console.log('❌ Railway API failed for transactions:', error.message);
        this.apiAvailable = false;
        // Continue to fallback
      }
    }

    // Fallback to Google Sheets
    console.log('🔄 Falling back to Google Sheets for transactions...');
    if (this.initializeFallback()) {
      try {
        const data = await this.sheetsService.fetchSheetData(this.currentSheet);
        
        // Transform sheets data to API format for compatibility
        const transformedData = this.transformSheetsToApiFormat(data, 'transactions');
        
        // Apply filters if provided
        const filteredData = this.applyFilters(transformedData, filters);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: filteredData,
          timestamp: Date.now()
        });
        
        console.log('✅ Successfully fetched transactions from Google Sheets fallback');
        return filteredData;
        
      } catch (error) {
        console.error('❌ Both Railway API and Google Sheets failed:', error);
        throw new Error('Unable to fetch transactions from any data source');
      }
    } else {
      throw new Error('No data source available - both API and fallback failed');
    }
  }

  /**
   * Fetch KPIs with automatic fallback
   */
  async fetchKPIs(filters = {}) {
    const cacheKey = `kpis_${JSON.stringify(filters)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📊 Returning cached KPIs data');
        return cached.data;
      }
    }

    // Try Railway API first
    if (this.apiAvailable !== false) {
      try {
        console.log('🚀 Fetching KPIs from Railway API...');
        
        const params = new URLSearchParams(filters);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${this.apiBaseUrl}/api/kpis?${params}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.apiAvailable = true;
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        console.log('✅ Successfully fetched KPIs from Railway API');
        return data;
        
      } catch (error) {
        console.log('❌ Railway API failed for KPIs:', error.message);
        this.apiAvailable = false;
        // Continue to fallback
      }
    }

    // Fallback to Google Sheets
    console.log('🔄 Falling back to Google Sheets for KPIs...');
    if (this.initializeFallback()) {
      try {
        const data = await this.sheetsService.fetchSheetData(this.currentSheet);
        
        // Calculate KPIs from sheets data
        const kpis = this.calculateKPIsFromSheetsData(data, filters);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: kpis,
          timestamp: Date.now()
        });
        
        console.log('✅ Successfully calculated KPIs from Google Sheets fallback');
        return kpis;
        
      } catch (error) {
        console.error('❌ Both Railway API and Google Sheets failed for KPIs:', error);
        throw new Error('Unable to fetch KPIs from any data source');
      }
    } else {
      throw new Error('No data source available for KPIs');
    }
  }

  /**
   * Transform Google Sheets data to API format
   */
  transformSheetsToApiFormat(sheetsData, dataType) {
    console.log('🔄 Transforming sheets data to API format...');
    
    if (!sheetsData || !sheetsData.length) {
      return { data: [], total: 0 };
    }

    switch (dataType) {
      case 'transactions':
        return {
          data: sheetsData.map(row => ({
            id: row.id || `${row.Date}_${row.Customer}_${Math.random()}`,
            date: row.Date || row.date,
            customer: row.Customer || row.customer,
            product_type: row['Product Type'] || row.product_type || row.Product,
            gallon_qty: parseFloat(row.Gallons || row.gallon_qty || row.gallons || 0),
            sales: parseFloat(row.Sales || row.sales || 0),
            actual_profit: parseFloat(row.Profit || row.actual_profit || row.profit || 0),
            cost: parseFloat(row.Cost || row.cost || 0),
            margin_by_product: parseFloat(row.Margin || row.margin_by_product || row.margin || 0)
          })),
          total: sheetsData.length
        };
      
      default:
        return { data: sheetsData, total: sheetsData.length };
    }
  }

  /**
   * Calculate KPIs from sheets data
   */
  calculateKPIsFromSheetsData(data, filters = {}) {
    console.log('📊 Calculating KPIs from sheets data...');
    
    if (!data || !data.length) {
      return {
        total_sales: 0,
        total_gallons: 0,
        total_profit: 0,
        avg_margin: 0,
        active_customers: 0,
        total_transactions: 0
      };
    }

    // Apply filters to data
    let filteredData = data;
    if (filters.start_date || filters.end_date) {
      filteredData = this.applyDateFilters(data, filters);
    }

    const totalSales = filteredData.reduce((sum, row) => {
      const sales = parseFloat(row.Sales || row.sales || 0);
      return sum + (isNaN(sales) ? 0 : sales);
    }, 0);

    const totalGallons = filteredData.reduce((sum, row) => {
      const gallons = parseFloat(row.Gallons || row.gallon_qty || row.gallons || 0);
      return sum + (isNaN(gallons) ? 0 : gallons);
    }, 0);

    const totalProfit = filteredData.reduce((sum, row) => {
      const profit = parseFloat(row.Profit || row.actual_profit || row.profit || 0);
      return sum + (isNaN(profit) ? 0 : profit);
    }, 0);

    const uniqueCustomers = new Set(
      filteredData.map(row => row.Customer || row.customer).filter(Boolean)
    ).size;

    const avgMargin = filteredData.reduce((sum, row) => {
      const margin = parseFloat(row.Margin || row.margin_by_product || row.margin || 0);
      return sum + (isNaN(margin) ? 0 : margin);
    }, 0) / filteredData.length;

    return {
      total_sales: totalSales,
      total_gallons: totalGallons,
      total_profit: totalProfit,
      avg_margin: avgMargin,
      active_customers: uniqueCustomers,
      total_transactions: filteredData.length
    };
  }

  /**
   * Apply date filters to data
   */
  applyDateFilters(data, filters) {
    if (!filters.start_date && !filters.end_date) {
      return data;
    }

    return data.filter(row => {
      const rowDate = new Date(row.Date || row.date);
      
      if (isNaN(rowDate.getTime())) {
        return false; // Invalid date
      }

      if (filters.start_date) {
        const startDate = new Date(filters.start_date);
        if (rowDate < startDate) return false;
      }

      if (filters.end_date) {
        const endDate = new Date(filters.end_date);
        if (rowDate > endDate) return false;
      }

      return true;
    });
  }

  /**
   * Apply general filters to data
   */
  applyFilters(apiData, filters) {
    if (!apiData.data || !filters) {
      return apiData;
    }

    let filteredData = apiData.data;

    // Apply date filters
    if (filters.start_date || filters.end_date) {
      filteredData = this.applyDateFilters(filteredData, filters);
    }

    // Apply other filters as needed
    if (filters.customer) {
      filteredData = filteredData.filter(row => 
        (row.customer || '').toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    if (filters.product_type) {
      filteredData = filteredData.filter(row => 
        (row.product_type || '').toLowerCase().includes(filters.product_type.toLowerCase())
      );
    }

    return {
      data: filteredData,
      total: filteredData.length
    };
  }

  /**
   * Switch data source (for compatibility)
   */
  switchSheet(sheetName) {
    if (this.availableSheets.includes(sheetName)) {
      this.currentSheet = sheetName;
      console.log(`📊 Switched to data source: ${sheetName}`);
      
      // Clear cache when switching sheets
      this.cache.clear();
      
      if (this.sheetsService) {
        this.sheetsService.switchSheet(sheetName);
      }
    }
  }

  /**
   * Get available data sources
   */
  getAvailableSheets() {
    return this.availableSheets;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      api_available: this.apiAvailable,
      fallback_available: !!this.sheetsService,
      current_source: this.apiAvailable ? 'Railway API' : 'Google Sheets'
    };
  }

  /**
   * Fetch fuel data (legacy compatibility method)
   */
  async fetchFuelData(sheetName = null) {
    console.log('📊 Fetching fuel data (legacy compatibility)...');
    
    // If sheet name provided, switch to it temporarily
    const originalSheet = this.currentSheet;
    if (sheetName) {
      this.switchSheet(sheetName);
    }
    
    try {
      // Try to get both transactions and KPIs
      const [transactionsData, kpisData] = await Promise.all([
        this.fetchTransactions(),
        this.fetchKPIs()
      ]);
      
      // Format as expected by legacy dashboard code
      const result = {
        records: transactionsData.data || [],
        summary: kpisData,
        headers: this.getDataHeaders(transactionsData.data || []),
        total: transactionsData.total || 0,
        sheet: this.currentSheet
      };
      
      console.log('✅ Fuel data fetched successfully:', {
        records: result.records.length,
        sheet: result.sheet
      });
      
      return result;
      
    } finally {
      // Restore original sheet if we changed it
      if (sheetName && originalSheet !== sheetName) {
        this.switchSheet(originalSheet);
      }
    }
  }

  /**
   * Get data headers from sample data
   */
  getDataHeaders(data) {
    if (!data || !data.length) {
      return ['Date', 'Customer', 'Product Type', 'Gallons', 'Sales', 'Profit'];
    }
    
    // Extract headers from first data row
    const firstRow = data[0];
    return Object.keys(firstRow);
  }

  /**
   * Get current sheet (legacy compatibility)
   */
  getCurrentSheet() {
    return this.currentSheet;
  }

  /**
   * Get sheet info (legacy compatibility)
   */
  getSheetInfo(sheetName) {
    // This would normally come from a sheets configuration
    // For now, return basic info
    const sheetTypes = {
      'Data': { type: 'transactional', description: 'Current transactional data' },
      'Data-gp-2025': { type: 'yearly', description: '2025 fuel business data' },
      'Data-gp-2024': { type: 'yearly', description: '2024 fuel business data' },
      'Recap-data': { type: 'summary', description: 'Summary and recap analytics' }
    };
    
    return sheetTypes[sheetName] || { type: 'unknown', description: 'Unknown data source' };
  }

  /**
   * Get current data from cache or recent fetch
   * @returns {Object} Current data object with transactions
   */
  getCurrentData() {
    // Return the most recent cached data or empty structure
    const cachedTransactions = this.cache.get('transactions_{}');
    
    if (cachedTransactions && cachedTransactions.data) {
      return {
        transactions: cachedTransactions.data.data || [],
        total: cachedTransactions.data.total || 0
      };
    }
    
    return {
      transactions: [],
      total: 0
    };
  }

  /**
   * Get sales trend data for charts
   * @param {Object} data - Data object containing transactions
   * @param {string} period - Period type: 'daily', 'weekly', or 'monthly'
   * @returns {Array} Array of trend data points
   */
  getSalesTrendData(data, period = 'monthly') {
    const trendMap = {};
    
    // Handle both data structures (with .transactions or .records)
    const transactions = data.transactions || data.records || [];
    
    transactions.forEach(record => {
      const dateStr = record['Date'] || record['date'];
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      
      let key;
      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else { // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!trendMap[key]) {
        trendMap[key] = {
          period: key,
          sales: 0,
          gallons: 0,
          profit: 0,
          transactions: 0
        };
      }
      
      // Handle different field names from Railway API
      trendMap[key].sales += parseFloat(record['Sales'] || record['sales'] || 0);
      trendMap[key].gallons += parseFloat(record['Gallon Qty'] || record['gallon_qty'] || 0);
      trendMap[key].profit += parseFloat(record['Actual Profit By Item'] || record['actual_profit_by_item'] || 0);
      trendMap[key].transactions++;
    });
    
    return Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get product type analysis
   * @param {Object} data - Data object containing transactions
   * @returns {Array} Array of product analysis data
   */
  getProductTypeAnalysis(data) {
    const productMap = {};
    
    // Handle both data structures
    const transactions = data.transactions || data.records || [];
    
    transactions.forEach(record => {
      const product = record['Product Type'] || record['product_type'] || 'Unknown';
      
      if (!productMap[product]) {
        productMap[product] = {
          product: product,
          gallons: 0,
          sales: 0,
          profit: 0,
          transactions: 0
        };
      }
      
      productMap[product].gallons += parseFloat(record['Gallon Qty'] || record['gallon_qty'] || 0);
      productMap[product].sales += parseFloat(record['Sales'] || record['sales'] || 0);
      productMap[product].profit += parseFloat(record['Actual Profit By Item'] || record['actual_profit_by_item'] || 0);
      productMap[product].transactions++;
    });
    
    return Object.values(productMap);
  }

  /**
   * Get customer analysis
   * @param {Object} data - Data object containing transactions
   * @returns {Array} Array of customer analysis data
   */
  getCustomerAnalysis(data) {
    const customerMap = {};
    
    // Handle both data structures
    const transactions = data.transactions || data.records || [];
    
    transactions.forEach(record => {
      const customer = record['Customer Name'] || record['customer_name'] || 'Unknown';
      
      if (!customerMap[customer]) {
        customerMap[customer] = {
          customer: customer,
          totalSales: 0,
          totalGallons: 0,
          totalProfit: 0,
          transactionCount: 0,
          avgTransaction: 0
        };
      }
      
      customerMap[customer].totalSales += parseFloat(record['Sales'] || record['sales'] || 0);
      customerMap[customer].totalGallons += parseFloat(record['Gallon Qty'] || record['gallon_qty'] || 0);
      customerMap[customer].totalProfit += parseFloat(record['Actual Profit By Item'] || record['actual_profit_by_item'] || 0);
      customerMap[customer].transactionCount++;
    });
    
    // Calculate averages
    Object.values(customerMap).forEach(customer => {
      customer.avgTransaction = customer.transactionCount > 0 
        ? customer.totalSales / customer.transactionCount 
        : 0;
    });
    
    return Object.values(customerMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 20); // Top 20 customers
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.DatabaseDataService = DatabaseDataService;
}
