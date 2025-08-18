// Chief Petroleum Dashboard - Database Data Service
// Replaces CSV processing with Railway database API calls

class DatabaseDataService {
  constructor() {
    // Use environment config if available, fallback to default
    this.apiBaseUrl = (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) || 'https://api-server-final-production.up.railway.app';
    
    console.log('🔧 Database Service initialized with API URL:', this.apiBaseUrl);

    this.cache = new Map();
    this.cacheTimeout = (window.ENV_CONFIG && window.ENV_CONFIG.CACHE_TIMEOUT) || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch transactions with filtering
   */
  async fetchTransactions(filters = {}) {
    const cacheKey = `transactions_${JSON.stringify(filters)}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📦 Using cached transactions data for filters:', filters);
        return cached.data;
      }
    }

    console.log('🔍 Fetching transactions from Railway API with filters:', filters);
    const params = new URLSearchParams(filters);
    const url = `${this.apiBaseUrl}/api/transactions?${params}`;
    console.log('🌐 API URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Received transactions data:', {
      total: data.total || 0,
      count: data.data ? data.data.length : 0,
      filters: filters
    });

    // Process dates in the response data
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(record => this.processRecordDates(record));
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Fetch KPIs with filtering
   */
  async fetchKPIs(filters = {}) {
    const cacheKey = `kpis_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.apiBaseUrl}/api/kpis?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * Fetch GP data for specific year
   */
  async fetchGPData(year, filters = {}) {
    const cacheKey = `gp_${year}_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.apiBaseUrl}/api/gp-data/${year}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();

    // Process dates in the response data
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(record => this.processRecordDates(record));
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Fetch recap data
   */
  async fetchRecapData(filters = {}) {
    const cacheKey = `recap_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.apiBaseUrl}/api/recap-data?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();

    // Process dates in the response data
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(record => this.processRecordDates(record));
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Fetch GP data for specific year
   */
  async getGPData(year) {
    const cacheKey = `gp_data_${year}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const response = await fetch(`${this.apiBaseUrl}/api/gp-data/${year}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Process for dashboard compatibility
    const processedData = this.processDataForDashboard(data, `gp-${year}`);

    // Cache the result
    this.cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    return processedData;
  }

  /**
   * Fetch customer summary
   */
  async fetchCustomers(limit = 100) {
    const cacheKey = `customers_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const response = await fetch(`${this.apiBaseUrl}/api/customers?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * Fetch product summary
   */
  async fetchProducts() {
    const cacheKey = 'products';
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const response = await fetch(`${this.apiBaseUrl}/api/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * Fetch daily summary
   */
  async fetchDailySummary(filters = {}) {
    const cacheKey = `daily_summary_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.apiBaseUrl}/api/daily-summary?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * Process data for dashboard compatibility
   * Transforms database response to match existing dashboard expectations
   */
  processDataForDashboard(data, dataType) {
    if (!data || !data.data) return null;

    const processedData = {
      sheetName: dataType,
      sheetType: this.getSheetType(dataType),
      headers: this.getHeaders(dataType),
      records: data.data,
      summary: this.calculateSummary(data.data, dataType)
    };

    return processedData;
  }

  /**
   * Get sheet type for compatibility
   */
  getSheetType(dataType) {
    switch (dataType) {
      case 'transactions':
        return 'transactional';
      case 'gp-2024':
      case 'gp-2025':
        return 'yearly';
      case 'recap':
        return 'summary';
      default:
        return 'unknown';
    }
  }

  /**
   * Get headers for compatibility - Updated to match processed column names
   */
  getHeaders(dataType) {
    switch (dataType) {
      case 'transactions':
        return ['Date', 'Customer', 'Customer-Address', 'Product Type', 'Gallon Qty', 'Actual Profit By Item', 'Sales'];
      case 'gp-2024':
        return ['Date', 'Dooley_Daily', 'Dooley_Rolling', 'Chief_Daily', 'Chief_Rolling', 'Sales', 'Goal', 'Gallon Qty'];
      case 'gp-2025':
        return ['Date', 'TW_Goal', 'TW_Actual', 'Hauling_Goal', 'Hauling_Actual', 'Transport_Goal', 'Transport_Actual', 'Lubes_Goal', 'Lubes_Actual', 'Chief_Goal', 'Chief_Actual', 'Sales', 'Goal', 'Gallon Qty'];
      case 'recap':
        return ['date', 'driver', 'company', 'gallons', 'profit_includes_delivery_fee', 'delivery_fee', 'margin', 'opis_true'];
      default:
        return [];
    }
  }

  /**
   * Calculate summary for compatibility
   */
  calculateSummary(records, dataType) {
    if (!records || records.length === 0) {
      return {
        totalSales: 0,
        totalGallons: 0,
        totalProfit: 0,
        recordCount: 0,
        customers: new Set(),
        productTypes: new Set()
      };
    }

    const summary = {
      totalSales: 0,
      totalGallons: 0,
      totalProfit: 0,
      recordCount: records.length,
      customers: new Set(),
      productTypes: new Set()
    };

    records.forEach(record => {
      if (dataType === 'transactions') {
        summary.totalSales += parseFloat(record.sales || 0);
        summary.totalGallons += parseFloat(record.gallon_qty || 0);
        summary.totalProfit += parseFloat(record.actual_profit || 0);
        if (record.customer) summary.customers.add(record.customer);
        if (record.product_type) summary.productTypes.add(record.product_type);
      } else if (dataType === 'recap') {
        summary.totalSales += parseFloat(record.profit_includes_delivery_fee || 0);
        summary.totalGallons += parseFloat(record.gallons || 0);
        if (record.company) summary.customers.add(record.company);
      }
    });

    summary.activeCustomers = summary.customers.size;
    summary.productTypeCount = summary.productTypes.size;

    return summary;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Process dates in a record to convert from Railway format to proper date strings
   */
  processRecordDates(record) {
    const processedRecord = { ...record };

    // Process all fields that might contain dates
    Object.keys(processedRecord).forEach(key => {
      const value = processedRecord[key];

      // Check if this looks like a date field or contains date data
      if (this.isDateField(key, value)) {
        processedRecord[key] = this.convertRailwayDate(value);
      }
    });

    return processedRecord;
  }

  /**
   * Check if a field contains date data
   */
  isDateField(fieldName, value) {
    // Check field name patterns
    const dateFieldPatterns = [
      /date/i, /Date/, /DATE/,
      /Dates25_1/, /Date24/, /Dates24/, /Dates25/
    ];

    const isDateFieldName = dateFieldPatterns.some(pattern => pattern.test(fieldName));

    // Check value patterns
    const isDateValue = value && (
      value instanceof Date ||
      (typeof value === 'string' && (
        value.startsWith('Date(') ||
        value.match(/^\d{4}-\d{2}-\d{2}/) ||
        value.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)
      ))
    );

    return isDateFieldName || isDateValue;
  }

  /**
   * Convert Railway date format to proper date string
   */
  convertRailwayDate(dateValue) {
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

    // Handle regular date strings
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

      // Handle YYYY-MM-DD format (already correct)
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleanDate;
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
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Alias methods for dashboard compatibility
   */
  async getKPIs(filters = {}) {
    return await this.fetchKPIs(filters);
  }

  async getTransactions(filters = {}) {
    return await this.fetchTransactions(filters);
  }

  async getRecapData(filters = {}) {
    return await this.fetchRecapData(filters);
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
          type: product,  // Use 'type' for chart compatibility
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

  /**
   * Get top customers by sales (for chart compatibility)
   * @param {Object} data - Data object containing transactions
   * @param {number} limit - Number of top customers to return
   * @returns {Array} Array of top customer data
   */
  getTopCustomers(data, limit = 5) {
    const customerMap = {};

    // Handle both data structures
    const transactions = data.transactions || data.records || [];

    transactions.forEach(record => {
      const customer = record['Customer'] || record['Customer Name'] || record['customer_name'] || 'Unknown Customer';

      if (!customerMap[customer]) {
        customerMap[customer] = {
          name: customer,
          sales: 0,
          gallons: 0,
          profit: 0,
          transactions: 0
        };
      }

      customerMap[customer].sales += parseFloat(record['Sales'] || record['sales'] || 0);
      customerMap[customer].gallons += parseFloat(record['Gallon Qty'] || record['gallon_qty'] || 0);
      customerMap[customer].profit += parseFloat(record['Actual Profit By Item'] || record['actual_profit_by_item'] || 0);
      customerMap[customer].transactions++;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseDataService;
} else {
  window.DatabaseDataService = DatabaseDataService;
}
