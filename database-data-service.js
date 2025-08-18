// Chief Petroleum Dashboard - Database Data Service
// FIXED: Correct API endpoint mapping for all four Railway tables

class DatabaseDataService {
  constructor() {
    // Use environment config if available, fallback to default
    this.apiBaseUrl = (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) || 'https://api-server-final-production.up.railway.app';
    
    console.log('🔧 Database Service initialized with API URL:', this.apiBaseUrl);

    this.cache = new Map();
    this.cacheTimeout = (window.ENV_CONFIG && window.ENV_CONFIG.CACHE_TIMEOUT) || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * FIXED: Fetch transactions with filtering
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
   * FIXED: Fetch GP data for specific year with correct endpoint
   */
  async fetchGPData(year, filters = {}) {
    const cacheKey = `gp_${year}_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Using cached GP ${year} data`);
        return cached.data;
      }
    }

    console.log(`🔍 Fetching GP ${year} data from Railway API...`);
    const params = new URLSearchParams(filters);
    const url = `${this.apiBaseUrl}/api/gp-data/${year}?${params}`;
    console.log('🌐 GP API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ GP ${year} API request failed:`, response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} for GP ${year} data`);
    }
    
    const data = await response.json();
    console.log(`✅ Received GP ${year} data:`, {
      total: data.total || 0,
      count: data.data ? data.data.length : 0
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
   * FIXED: Fetch recap data with correct endpoint
   */
  async fetchRecapData(filters = {}) {
    const cacheKey = `recap_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📦 Using cached recap data');
        return cached.data;
      }
    }

    console.log('🔍 Fetching recap data from Railway API...');
    const params = new URLSearchParams(filters);
    const url = `${this.apiBaseUrl}/api/recap-data?${params}`;
    console.log('🌐 Recap API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Recap API request failed:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} for recap data`);
    }
    
    const data = await response.json();
    console.log('✅ Received recap data:', {
      total: data.total || 0,
      count: data.data ? data.data.length : 0
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
   * FIXED: Fetch KPIs with filtering
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
   * FIXED: Get GP data for specific year (alias method)
   */
  async getGPData(year) {
    const cacheKey = `gp_data_${year}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    console.log(`🔍 Getting GP data for year ${year}...`);
    const response = await this.fetchGPData(year);

    // Process for dashboard compatibility
    const processedData = this.processDataForDashboard(response, `gp-${year}`);

    // Cache the result
    this.cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    return processedData;
  }

  /**
   * FIXED: Process data for dashboard compatibility
   * Transforms database response to match existing dashboard expectations
   */
  processDataForDashboard(data, dataType) {
    if (!data || !data.data) {
      console.warn(`⚠️ No data received for ${dataType}`);
      return {
        sheetName: dataType,
        sheetType: this.getSheetType(dataType),
        headers: this.getHeaders(dataType),
        records: [],
        summary: this.calculateSummary([], dataType)
      };
    }

    console.log(`📊 Processing ${data.data.length} records for ${dataType}`);

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
   * FIXED: Get headers for compatibility - Updated to match Railway API field names
   */
  getHeaders(dataType) {
    switch (dataType) {
      case 'transactions':
        return ['date', 'customer', 'customer_address', 'product_type', 'gallon_qty', 'actual_profit', 'sales'];
      case 'gp-2024':
        return ['date', 'dooley_daily', 'dooley_rolling', 'chief_daily', 'chief_rolling', 'sales', 'goal'];
      case 'gp-2025':
        return ['date', 'tw_goal', 'tw_actual', 'hauling_goal', 'hauling_actual', 'transport_goal', 'transport_actual', 'lubes_goal', 'lubes_actual', 'chief_goal', 'chief_actual'];
      case 'recap':
        return ['date', 'driver', 'company', 'gallons', 'profit_includes_delivery_fee', 'delivery_fee', 'margin', 'opis_true'];
      default:
        return [];
    }
  }

  /**
   * FIXED: Calculate summary for compatibility with proper field mapping
   */
  calculateSummary(records, dataType) {
    if (!records || records.length === 0) {
      return {
        totalSales: 0,
        totalGallons: 0,
        totalProfit: 0,
        recordCount: 0,
        customers: new Set(),
        productTypes: new Set(),
        activeCustomers: 0,
        avgProfitMargin: 0
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
        // Use Railway API field names (lowercase with underscores)
        summary.totalSales += parseFloat(record.sales || 0);
        summary.totalGallons += parseFloat(record.gallon_qty || 0);
        summary.totalProfit += parseFloat(record.actual_profit || 0);
        if (record.customer) summary.customers.add(record.customer);
        if (record.product_type) summary.productTypes.add(record.product_type);
      } else if (dataType === 'recap') {
        summary.totalSales += parseFloat(record.profit_includes_delivery_fee || 0);
        summary.totalGallons += parseFloat(record.gallons || 0);
        summary.totalProfit += parseFloat(record.profit_includes_delivery_fee || 0);
        if (record.company) summary.customers.add(record.company);
        if (record.driver) summary.productTypes.add(record.driver);
      } else if (dataType.includes('gp-')) {
        // GP data has different structure
        summary.totalSales += parseFloat(record.chief_actual || record.sales || 0);
        summary.totalGallons += parseFloat(record.gallons || 0);
        summary.totalProfit += parseFloat(record.profit || 0);
      }
    });

    summary.activeCustomers = summary.customers.size;
    summary.productTypeCount = summary.productTypes.size;
    summary.avgProfitMargin = summary.totalSales > 0 ? (summary.totalProfit / summary.totalSales) * 100 : 0;

    return summary;
  }

  /**
   * FIXED: Get sales trend data for charts with proper field mapping
   */
  getSalesTrendData(data, period = 'monthly') {
    const trendMap = {};

    // Handle both data structures (with .transactions, .records, or direct .data)
    const transactions = data.transactions || data.records || data.data || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.warn('⚠️ No transactions data for trend analysis');
      return [];
    }

    transactions.forEach(record => {
      // Try multiple date field names
      const dateStr = record['date'] || record['Date'] || record['transaction_date'];
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

      // Use Railway API field names (lowercase with underscores)
      trendMap[key].sales += parseFloat(record['sales'] || record['Sales'] || 0);
      trendMap[key].gallons += parseFloat(record['gallon_qty'] || record['Gallon Qty'] || 0);
      trendMap[key].profit += parseFloat(record['actual_profit'] || record['Actual Profit By Item'] || 0);
      trendMap[key].transactions++;
    });

    return Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * FIXED: Get top customers with proper field mapping
   */
  getTopCustomers(data, limit = 5) {
    const customerMap = {};

    // Handle both data structures
    const transactions = data.transactions || data.records || data.data || [];

    if (!Array.isArray(transactions)) {
      console.warn('⚠️ No valid transactions data for customer analysis');
      return [];
    }

    transactions.forEach(record => {
      // Try multiple customer field names
      const customer = record['customer'] || record['Customer'] || record['customer_name'] || 'Unknown Customer';

      if (!customerMap[customer]) {
        customerMap[customer] = {
          name: customer,
          sales: 0,
          gallons: 0,
          profit: 0,
          transactions: 0
        };
      }

      // Use Railway API field names
      customerMap[customer].sales += parseFloat(record['sales'] || record['Sales'] || 0);
      customerMap[customer].gallons += parseFloat(record['gallon_qty'] || record['Gallon Qty'] || 0);
      customerMap[customer].profit += parseFloat(record['actual_profit'] || record['Actual Profit By Item'] || 0);
      customerMap[customer].transactions++;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }

  /**
   * FIXED: Get product type analysis with proper field mapping
   */
  getProductTypeAnalysis(data) {
    const productMap = {};

    // Handle both data structures
    const transactions = data.transactions || data.records || data.data || [];

    if (!Array.isArray(transactions)) {
      console.warn('⚠️ No valid transactions data for product analysis');
      return [];
    }

    transactions.forEach(record => {
      // Try multiple product field names
      const product = record['product_type'] || record['Product Type'] || record['Product'] || 'Unknown';

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

      // Use Railway API field names
      productMap[product].gallons += parseFloat(record['gallon_qty'] || record['Gallon Qty'] || 0);
      productMap[product].sales += parseFloat(record['sales'] || record['Sales'] || 0);
      productMap[product].profit += parseFloat(record['actual_profit'] || record['Actual Profit By Item'] || 0);
      productMap[product].transactions++;
    });

    return Object.values(productMap).filter(item => item.sales > 0);
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
      /transaction_date/i, /created_at/i, /updated_at/i
    ];

    const isDateFieldName = dateFieldPatterns.some(pattern => pattern.test(fieldName));

    // Check value patterns
    const isDateValue = value && (
      value instanceof Date ||
      (typeof value === 'string' && (
        value.startsWith('Date(') ||
        value.match(/^\d{4}-\d{2}-\d{2}/) ||
        value.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) ||
        value.includes('T') && value.includes('Z') // ISO format
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

    // Handle ISO date strings
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
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

      // Handle YYYY-MM-DD format (already correct)
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleanDate;
      }

      // Handle MM/DD/YYYY format
      if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [month, day, year] = cleanDate.split('/');
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
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
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Database cache cleared');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const isHealthy = response.ok;
      console.log(`🏥 Health check: ${isHealthy ? '✅ Healthy' : '❌ Failed'}`);
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Get current data from cache or recent fetch
   */
  getCurrentData() {
    // Return the most recent cached data or empty structure
    const cachedTransactions = this.cache.get('transactions_{}');

    if (cachedTransactions && cachedTransactions.data) {
      return {
        transactions: cachedTransactions.data.data || [],
        records: cachedTransactions.data.data || [], // Alias for compatibility
        total: cachedTransactions.data.total || 0
      };
    }

    return {
      transactions: [],
      records: [],
      total: 0
    };
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
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseDataService;
} else {
  window.DatabaseDataService = DatabaseDataService;
}