/**
 * Chief Petroleum Data Service
 * Handles all data fetching from Google Sheets with multi-sheet support
 */

class ChiefDataService {
  constructor() {
    // Your Google Sheet ID (extracted from the URL you provided)
    this.spreadsheetId = '1c9rl5seseNeqgZasuaxiz_-sh_NJYawtcZmCNf7GqFg';

    // Database service for Railway migration
    this.databaseService = null;
    this.useDatabaseMode = false;

    // Sheet configuration with correct GIDs from your URLs
    this.sheets = {
      'Data': {
        name: 'Data',
        gid: '1265088056',
        description: 'Current transactional data',
        type: 'transactional'
      },
      'Data-gp-2025': {
        name: 'Data-gp-2025',
        gid: '903255539',
        description: '2025 fuel business data',
        type: 'yearly'
      },
      'Data-gp-2024': {
        name: 'Data-gp-2024',
        gid: '1753994333',
        description: '2024 fuel business data',
        type: 'yearly'
      },
      'Recap-data': {
        name: 'Recap-data',
        gid: '860700499',
        description: 'Summary and recap analytics',
        type: 'summary'
      }
    };

    // Default sheet
    this.currentSheet = 'Data';

    // Cache for performance - now per sheet
    this.dataCache = {};
    this.lastFetch = {};
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    console.log('🚀 Chief Petroleum Multi-Sheet Data Service initialized');
    console.log('📊 Available sheets:', Object.keys(this.sheets));

    // Initialize database service if available
    this.initializeDatabaseService();
  }

  /**
   * Initialize database service for Railway migration
   */
  async initializeDatabaseService() {
    try {
      // Check if DatabaseDataService is available
      if (typeof DatabaseDataService !== 'undefined') {
        this.databaseService = new DatabaseDataService();

        // Test database connectivity
        const isHealthy = await this.databaseService.healthCheck();
        if (isHealthy) {
          this.useDatabaseMode = true;
          console.log('✅ Database service initialized successfully');
        } else {
          console.log('⚠️ Database service not healthy, falling back to CSV mode');
        }
      }
    } catch (error) {
      console.log('⚠️ Database service not available, using CSV mode:', error.message);
    }
  }

  /**
   * Main method to fetch and process fuel business data
   * @param {string} sheetName - Name of the sheet to fetch (defaults to current sheet)
   */
  async fetchFuelData(sheetName = null) {
    const targetSheet = sheetName || this.currentSheet;

    try {
      // Check cache first
      if (this.dataCache[targetSheet] &&
          (Date.now() - (this.lastFetch[targetSheet] || 0)) < this.cacheTimeout) {
        console.log(`📋 Using cached data for sheet: ${targetSheet}`);
        return this.dataCache[targetSheet];
      }

      console.log(`🔄 Fetching fresh data from sheet: ${targetSheet}...`);

      // Validate sheet exists
      if (!this.sheets[targetSheet]) {
        throw new Error(`Sheet "${targetSheet}" not found. Available sheets: ${Object.keys(this.sheets).join(', ')}`);
      }

      // Try JSON method first (more robust)
      const data = await this.fetchViaJSON(targetSheet);

      // Process the raw data into fuel business format
      const processedData = this.processFuelData(data, targetSheet);

      // Cache the results
      this.dataCache[targetSheet] = processedData;
      this.lastFetch[targetSheet] = Date.now();

      console.log(`✅ Data fetched and processed successfully for sheet: ${targetSheet}`);
      return processedData;

    } catch (error) {
      console.error(`❌ Error fetching data from sheet ${targetSheet}:`, error);

      // Try fallback method
      try {
        console.log(`🔄 Trying fallback CSV method for sheet: ${targetSheet}...`);
        const csvData = await this.fetchViaCSV(targetSheet);
        const processedData = this.processFuelDataFromCSV(csvData, targetSheet);

        this.dataCache[targetSheet] = processedData;
        this.lastFetch[targetSheet] = Date.now();

        return processedData;
      } catch (fallbackError) {
        console.error(`❌ Fallback method also failed for sheet ${targetSheet}:`, fallbackError);

        // Provide more specific error messages
        let errorMessage = `Unable to fetch data from sheet "${targetSheet}".`;

        if (fallbackError.message.includes('404')) {
          errorMessage += ' The sheet may not exist or may not be publicly accessible.';
        } else if (fallbackError.message.includes('403')) {
          errorMessage += ' Access denied. Please check sheet permissions.';
        } else if (fallbackError.message.includes('Failed to fetch')) {
          errorMessage += ' Network connection issue. Please check your internet connection.';
        } else {
          errorMessage += ` Error: ${fallbackError.message}`;
        }

        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Fetch data using Google Visualization JSON API
   * @param {string} sheetName - Name of the sheet to fetch
   */
  async fetchViaJSON(sheetName) {
    const sheet = this.sheets[sheetName];
    const jsonUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:json&gid=${sheet.gid}`;

    const response = await fetch(jsonUrl);
    const text = await response.text();

    // Parse the JSONP response
    const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
    if (!match) {
      throw new Error('Invalid JSON response format');
    }

    const data = JSON.parse(match[1]);

    if (data.status === 'error') {
      throw new Error(`Google Sheets API Error: ${data.errors[0].detailed_message}`);
    }

    return data.table;
  }

  /**
   * Fallback: Fetch data via CSV export
   * @param {string} sheetName - Name of the sheet to fetch
   */
  async fetchViaCSV(sheetName) {
    const sheet = this.sheets[sheetName];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${sheet.gid}`;

    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    return this.parseCSV(csvText);
  }

  /**
   * Parse CSV data into structured format
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      return values;
    });
    
    return {
      cols: headers.map(h => ({ label: h })),
      rows: rows.map(row => ({ c: row.map(v => ({ v: v })) }))
    };
  }

  /**
   * Process JSON data into fuel business format
   * @param {Object} table - The data table from Google Sheets
   * @param {string} sheetName - Name of the source sheet
   */
  processFuelData(table, sheetName) {
    const originalHeaders = table.cols.map(col => col.label || '');
    const rows = table.rows || [];

    console.log(`📊 Processing sheet "${sheetName}" - Headers found:`, originalHeaders);
    console.log(`📈 Rows count: ${rows.length}`);

    const processedData = {
      sheetName: sheetName,
      sheetType: this.sheets[sheetName]?.type || 'unknown',
      headers: originalHeaders, // Will be updated after processing
      records: [],
      summary: {
        totalSales: 0,
        totalGallons: 0,
        totalProfit: 0,
        totalCost: 0,
        recordCount: 0,
        customers: new Set(),
        productTypes: new Set()
      }
    };

    // Process each row
    rows.forEach((row, index) => {
      if (!row.c) return;
      
      const record = {};
      const values = row.c.map(cell => cell ? (cell.v || '') : '');
      
      // Map headers to values
      headers.forEach((header, i) => {
        record[header] = values[i] || '';
      });
      
      // Skip empty rows
      if (this.isEmptyRecord(record)) return;

      // Process data based on sheet type
      this.processRecordBySheetType(record, sheetName);

      // Parse date field (handle different date column names)
      const dateField = this.getDateField(record, sheetName);
      if (dateField) {
        const rawDateValue = record[dateField];
        console.log(`🔍 Debug: Raw date value from field '${dateField}':`, rawDateValue, typeof rawDateValue);
        record['Date'] = this.parseDate(rawDateValue);
        console.log(`🔍 Debug: Parsed date result:`, record['Date']);
      } else {
        // Fallback: try to extract date from any field that might contain it
        console.warn('⚠️ No date field found, trying fallback methods...');
        const fallbackDate = this.extractDateFromRecord(record);
        if (fallbackDate) {
          record['Date'] = fallbackDate;
          console.log('✅ Extracted fallback date:', fallbackDate);
        }
      }
      
      processedData.records.push(record);

      // Update summary based on processed data
      this.updateSummaryBySheetType(processedData.summary, record, sheetName);
    });
    
    // Calculate averages
    processedData.summary.avgProfitMargin = processedData.summary.totalSales > 0 
      ? (processedData.summary.totalProfit / processedData.summary.totalSales) * 100 
      : 0;
      
    processedData.summary.avgRevenuePerGallon = processedData.summary.totalGallons > 0
      ? processedData.summary.totalSales / processedData.summary.totalGallons
      : 0;
      
    processedData.summary.activeCustomers = processedData.summary.customers.size;
    processedData.summary.productTypeCount = processedData.summary.productTypes.size;

    // Update headers to reflect processed column names
    processedData.headers = this.getProcessedHeaders(processedData.records, sheetName, originalHeaders);

    console.log('📊 Processed Summary:', processedData.summary);
    console.log('📊 Final Headers:', processedData.headers);

    return processedData;
  }

  /**
   * Process CSV data (fallback method)
   * @param {Object} table - The data table from CSV
   * @param {string} sheetName - Name of the source sheet
   */
  processFuelDataFromCSV(table, sheetName) {
    return this.processFuelData(table, sheetName);
  }

  /**
   * Helper: Check if record is empty
   */
  isEmptyRecord(record) {
    const values = Object.values(record);
    return values.every(v => !v || v.toString().trim() === '');
  }

  /**
   * Get processed headers based on the actual processed data
   * This ensures export headers match the processed column names
   */
  getProcessedHeaders(records, sheetName, originalHeaders) {
    if (!records || records.length === 0) {
      return originalHeaders;
    }

    // Get headers from the first processed record
    const processedHeaders = Object.keys(records[0]);

    // For yearly data (GP sheets), use a specific order for better readability
    if (sheetName === 'Data-gp-2025') {
      return [
        'Date',
        'TW_Goal', 'TW_Actual',
        'Hauling_Goal', 'Hauling_Actual',
        'Transport_Goal', 'Transport_Actual',
        'Lubes_Goal', 'Lubes_Actual',
        'Chief_Goal', 'Chief_Actual',
        'Lubes_Pct', 'Hauling_Pct', 'Tankwagon_Pct', 'Transport_Pct', 'Chief_Pct',
        'Sales', 'Goal', 'Gallon Qty'
      ].filter(header => processedHeaders.includes(header));
    } else if (sheetName === 'Data-gp-2024') {
      return [
        'Date',
        'Dooley_Daily', 'Dooley_Rolling',
        'Lubes_Daily', 'Lubes_Rolling',
        'Hauling_Daily', 'Hauling_Rolling',
        'Tankwagon_Daily', 'Tankwagon_Rolling',
        'Transport_Daily', 'Transport_Rolling',
        'Chief_Daily', 'Chief_Rolling',
        'Lubes_Pct', 'Tankwagon_Pct', 'Hauling_Pct', 'Transport_Pct', 'Chief_Pct',
        'Sales', 'Goal', 'Gallon Qty'
      ].filter(header => processedHeaders.includes(header));
    }

    // For other sheets, return processed headers as-is
    return processedHeaders;
  }

  /**
   * Helper: Parse number from string
   */
  parseNumber(value) {
    if (!value) return 0;
    
    // Remove currency symbols, commas, etc.
    const cleaned = value.toString()
      .replace(/[$,\s]/g, '')
      .replace(/[^\d.-]/g, '');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Helper: Parse date from various formats including Google Sheets serial numbers
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // If it's already a Date object, return it
      if (dateStr instanceof Date) {
        return isNaN(dateStr.getTime()) ? null : dateStr;
      }

      // Convert to string and clean up
      const cleanDateStr = String(dateStr).trim();

      // Handle Google Sheets serial date numbers
      // Google Sheets uses Excel-style serial dates (days since 1900-01-01, but with a bug that treats 1900 as a leap year)
      const numericValue = parseFloat(cleanDateStr);
      if (!isNaN(numericValue) && numericValue > 1 && numericValue < 100000) {
        // This looks like a serial date number
        console.log('🔍 Detected serial date number:', numericValue);

        // Excel/Google Sheets epoch: January 1, 1900 (but with leap year bug)
        // We need to subtract 2 days to account for the 1900 leap year bug and 0-based indexing
        const excelEpoch = new Date(1900, 0, 1);
        const serialDate = new Date(excelEpoch.getTime() + (numericValue - 2) * 24 * 60 * 60 * 1000);

        console.log('🔍 Converted serial date:', numericValue, '→', serialDate);

        if (!isNaN(serialDate.getTime()) && serialDate.getFullYear() > 1900 && serialDate.getFullYear() < 2100) {
          return serialDate;
        }
      }

      // Try parsing as standard date string
      let date = new Date(cleanDateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        return date;
      }

      // Handle MM-DD-YYYY or M-D-YYYY format
      if (cleanDateStr.includes('-')) {
        const parts = cleanDateStr.split('-');
        if (parts.length === 3) {
          // Try MM-DD-YYYY
          date = new Date(parts[2], parts[0] - 1, parts[1]);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }

          // Try DD-MM-YYYY
          date = new Date(parts[2], parts[1] - 1, parts[0]);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }
        }
      }

      // Handle MM/DD/YYYY or M/D/YYYY format
      if (cleanDateStr.includes('/')) {
        const parts = cleanDateStr.split('/');
        if (parts.length === 3) {
          // Try MM/DD/YYYY
          date = new Date(parts[2], parts[0] - 1, parts[1]);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }

          // Try DD/MM/YYYY
          date = new Date(parts[2], parts[1] - 1, parts[0]);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Date parsing error for:', dateStr, error);
      return null;
    }
  }

  /**
   * Helper: Calculate profit margin percentage
   */
  calculateProfitMargin(profit, sales) {
    if (!sales || sales === 0) return 0;
    return (profit / sales) * 100;
  }

  /**
   * Helper: Calculate revenue per gallon
   */
  calculateRevenuePerGallon(sales, gallons) {
    if (!gallons || gallons === 0) return 0;
    return sales / gallons;
  }

  /**
   * Helper: Calculate cost per gallon
   */
  calculateCostPerGallon(cost, gallons) {
    if (!gallons || gallons === 0) return 0;
    return cost / gallons;
  }

  /**
   * Get top customers by sales
   */
  getTopCustomers(data, limit = 5) {
    const customerMap = {};

    // Handle different sheet types
    if (data.sheetType === 'yearly') {
      // For yearly data, create time-based "customers"
      const monthlyData = {};

      data.records.forEach(record => {
        if (!record['Date']) return;

        const monthKey = `${record['Date'].getFullYear()}-${String(record['Date'].getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            name: monthKey,
            sales: 0,
            transactions: 0
          };
        }

        monthlyData[monthKey].sales += record['Sales'] || 0;
        monthlyData[monthKey].transactions++;
      });

      return Object.values(monthlyData)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);
    } else {
      // Handle transactional data with actual customers
      data.records.forEach(record => {
        const customer = record['Customer'] || 'Unknown Customer';

        if (!customerMap[customer]) {
          customerMap[customer] = {
            name: customer,
            sales: 0,
            gallons: 0,
            profit: 0,
            transactions: 0
          };
        }

        customerMap[customer].sales += record['Sales'] || 0;
        customerMap[customer].gallons += record['Gallon Qty'] || 0;
        customerMap[customer].profit += record['Actual Profit By Item'] || 0;
        customerMap[customer].transactions++;
      });

      return Object.values(customerMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);
    }
  }

  /**
   * Get product type analysis
   */
  getProductTypeAnalysis(data) {
    const productMap = {};

    // Handle different sheet types
    if (data.sheetType === 'yearly') {
      // For yearly data, create categories based on data columns
      if (data.sheetName === 'Data-gp-2025') {
        productMap['TW Operations'] = {
          type: 'TW Operations',
          sales: data.records.reduce((sum, r) => sum + (r['TW_Actual'] || 0), 0),
          goal: data.records.reduce((sum, r) => sum + (r['TW_Goal'] || 0), 0),
          transactions: data.records.length
        };
        productMap['Hauling Operations'] = {
          type: 'Hauling Operations',
          sales: data.records.reduce((sum, r) => sum + (r['Hauling_Goal'] || 0), 0),
          transactions: data.records.length
        };
      } else if (data.sheetName === 'Data-gp-2024') {
        productMap['Dooley Operations'] = {
          type: 'Dooley Operations',
          sales: data.records.reduce((sum, r) => sum + (r['Dooley_Rolling'] || 0), 0),
          daily: data.records.reduce((sum, r) => sum + (r['Dooley_Daily'] || 0), 0),
          transactions: data.records.length
        };
        productMap['Lubes Operations'] = {
          type: 'Lubes Operations',
          sales: data.records.reduce((sum, r) => sum + (r['Lubes_Rolling'] || 0), 0),
          daily: data.records.reduce((sum, r) => sum + (r['Lubes_Daily'] || 0), 0),
          transactions: data.records.length
        };
      }
    } else {
      // Handle transactional data with Product Type
      data.records.forEach(record => {
        const productType = record['Product Type'] || record['Customer'] || 'General';

        if (!productMap[productType]) {
          productMap[productType] = {
            type: productType,
            sales: 0,
            gallons: 0,
            profit: 0,
            transactions: 0
          };
        }

        productMap[productType].sales += record['Sales'] || 0;
        productMap[productType].gallons += record['Gallon Qty'] || 0;
        productMap[productType].profit += record['Actual Profit By Item'] || 0;
        productMap[productType].transactions++;
      });

      // Calculate averages for transactional data
      Object.values(productMap).forEach(product => {
        product.avgPrice = product.gallons > 0 ? product.sales / product.gallons : 0;
        product.avgProfitMargin = product.sales > 0 ? (product.profit / product.sales) * 100 : 0;
      });
    }

    return Object.values(productMap).sort((a, b) => b.sales - a.sales);
  }

  /**
   * Get sales trend data for charts
   */
  getSalesTrendData(data, period = 'monthly') {
    const trendMap = {};
    
    data.records.forEach(record => {
      const date = record['Date'];
      if (!date) return;
      
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
      
      trendMap[key].sales += record['Sales'] || 0;
      trendMap[key].gallons += record['Gallon Qty'] || 0;
      trendMap[key].profit += record['Actual Profit By Item'] || 0;
      trendMap[key].transactions++;
    });
    
    return Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Clear cache to force fresh data fetch
   * @param {string} sheetName - Optional sheet name to clear specific cache
   */
  clearCache(sheetName = null) {
    if (sheetName) {
      delete this.dataCache[sheetName];
      delete this.lastFetch[sheetName];
      console.log(`🗑️ Cache cleared for sheet: ${sheetName}`);
    } else {
      this.dataCache = {};
      this.lastFetch = {};
      console.log('🗑️ All data cache cleared');
    }
  }

  /**
   * Set the current active sheet
   * @param {string} sheetName - Name of the sheet to set as current
   */
  setCurrentSheet(sheetName) {
    if (!this.sheets[sheetName]) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${Object.keys(this.sheets).join(', ')}`);
    }
    this.currentSheet = sheetName;
    console.log(`📋 Current sheet set to: ${sheetName}`);
  }

  /**
   * Get current sheet name
   */
  getCurrentSheet() {
    return this.currentSheet;
  }

  /**
   * Get current sheet data
   */
  getCurrentData() {
    return this.dataCache[this.currentSheet];
  }

  /**
   * Get daily recap data for specific date
   */
  getDailyRecap(data, targetDate) {
    const dateStr = new Date(targetDate).toLocaleDateString();
    const dayRecords = data.records.filter(record => {
      const recordDate = new Date(record['Date']).toLocaleDateString();
      return recordDate === dateStr;
    });

    if (dayRecords.length === 0) {
      return null;
    }

    // Calculate daily metrics
    const metrics = {
      date: targetDate,
      totalDeliveries: dayRecords.length,
      totalSales: dayRecords.reduce((sum, r) => sum + (r['Sales'] || 0), 0),
      totalProfit: dayRecords.reduce((sum, r) => sum + (r['Actual Profit By Item'] || 0), 0),
      totalGallons: dayRecords.reduce((sum, r) => sum + (r['Gallon Qty'] || 0), 0),
      uniqueCustomers: new Set(dayRecords.map(r => r['Customer']).filter(c => c)).size,
      avgProfitMargin: 0
    };

    metrics.avgProfitMargin = metrics.totalSales > 0 ? (metrics.totalProfit / metrics.totalSales) * 100 : 0;

    // Product breakdown
    const productBreakdown = {};
    dayRecords.forEach(record => {
      const product = record['Product Type'] || 'Unknown';
      if (!productBreakdown[product]) {
        productBreakdown[product] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }
      productBreakdown[product].gallons += record['Gallon Qty'] || 0;
      productBreakdown[product].sales += record['Sales'] || 0;
      productBreakdown[product].profit += record['Actual Profit By Item'] || 0;
      productBreakdown[product].deliveries += 1;
    });

    // Customer breakdown
    const customerBreakdown = {};
    dayRecords.forEach(record => {
      const customer = record['Customer'] || 'Unknown';
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = {
          gallons: 0,
          sales: 0,
          profit: 0,
          deliveries: 0
        };
      }
      customerBreakdown[customer].gallons += record['Gallon Qty'] || 0;
      customerBreakdown[customer].sales += record['Sales'] || 0;
      customerBreakdown[customer].profit += record['Actual Profit By Item'] || 0;
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
   * Get days between deliveries for each customer
   */
  getCustomerDeliveryFrequency(data) {
    const customerDeliveries = {};

    // Group deliveries by customer
    data.records.forEach(record => {
      const customer = record['Customer'];
      const date = new Date(record['Date']);

      if (customer && !isNaN(date.getTime())) {
        if (!customerDeliveries[customer]) {
          customerDeliveries[customer] = [];
        }
        customerDeliveries[customer].push(date);
      }
    });

    // Calculate frequency for each customer
    const frequencyData = [];
    Object.entries(customerDeliveries).forEach(([customer, dates]) => {
      if (dates.length > 1) {
        // Sort dates
        dates.sort((a, b) => a - b);

        // Calculate days between deliveries
        const daysBetween = [];
        for (let i = 1; i < dates.length; i++) {
          const diffTime = dates[i] - dates[i-1];
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysBetween.push(diffDays);
        }

        const avgDaysBetween = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
        const lastDelivery = dates[dates.length - 1];
        const daysSinceLastDelivery = Math.ceil((new Date() - lastDelivery) / (1000 * 60 * 60 * 24));

        frequencyData.push({
          customer,
          totalDeliveries: dates.length,
          avgDaysBetween: Math.round(avgDaysBetween),
          lastDelivery: lastDelivery.toLocaleDateString(),
          daysSinceLastDelivery,
          isOverdue: daysSinceLastDelivery > avgDaysBetween * 1.5
        });
      }
    });

    return frequencyData.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }

  /**
   * Get available sheet names
   */
  getAvailableSheets() {
    return Object.keys(this.sheets);
  }

  /**
   * Get sheet metadata
   * @param {string} sheetName - Name of the sheet
   */
  getSheetInfo(sheetName) {
    return this.sheets[sheetName] || null;
  }

  /**
   * Get all sheets metadata
   */
  getAllSheetsInfo() {
    return this.sheets;
  }

  /**
   * Check if data is cached for a sheet
   * @param {string} sheetName - Name of the sheet to check
   */
  isCached(sheetName) {
    return !!(this.dataCache[sheetName] &&
             (Date.now() - (this.lastFetch[sheetName] || 0)) < this.cacheTimeout);
  }

  /**
   * Process record based on sheet type
   */
  processRecordBySheetType(record, sheetName) {
    const sheetType = this.sheets[sheetName]?.type;

    switch (sheetType) {
      case 'transactional':
        // Handle main Data sheet with transactions
        this.processTransactionalRecord(record);
        break;

      case 'yearly':
        // Handle Data-gp-2024 and Data-gp-2025 sheets
        this.processYearlyRecord(record, sheetName);
        break;

      case 'summary':
        // Handle Recap-data sheet
        this.processSummaryRecord(record);
        break;

      default:
        // Try to auto-detect and process
        this.processGenericRecord(record);
    }
  }

  /**
   * Process transactional data record (main Data sheet)
   */
  processTransactionalRecord(record) {
    // Convert numeric fields for transaction data
    record['Sales'] = this.parseNumber(record['Sales'] || record['TOTAL'] || 0);
    record['Gallon Qty'] = this.parseNumber(record['Gallon Qty'] || 0);
    record['Actual Profit By Item'] = this.parseNumber(record['Actual Profit By Item'] || 0);
    record['Actual Cost by item'] = this.parseNumber(record['Actual Cost by item'] || 0);

    // Add calculated fields
    record['ProfitMargin'] = this.calculateProfitMargin(record['Actual Profit By Item'], record['Sales']);
    record['RevenuePerGallon'] = this.calculateRevenuePerGallon(record['Sales'], record['Gallon Qty']);
    record['CostPerGallon'] = this.calculateCostPerGallon(record['Actual Cost by item'], record['Gallon Qty']);
  }

  /**
   * Process yearly data record (Data-gp-2024, Data-gp-2025)
   */
  processYearlyRecord(record, sheetName) {
    if (sheetName === 'Data-gp-2025') {
      // Map Data-gp-2025 columns (CORRECTED)
      record['Date'] = this.parseDate(record['Dates25_1']);
      record['TW_Goal'] = this.parseNumber(record['TW Running Total Goal25'] || 0);
      record['TW_Actual'] = this.parseNumber(record['TW Rolling Total Actual QB25'] || 0);
      record['Hauling_Goal'] = this.parseNumber(record['Hauling Running Total Goal25'] || 0);
      record['Hauling_Actual'] = this.parseNumber(record['Hauling  Rolling Total Actual QB25'] || 0);
      record['Transport_Goal'] = this.parseNumber(record['Transport Fuels Running Total Goal25'] || 0);
      record['Transport_Actual'] = this.parseNumber(record['Transport Fuels Rolling Total Actual QB25'] || 0);
      record['Lubes_Goal'] = this.parseNumber(record['Lubes/Dooley Running Total Goal25'] || 0);
      record['Lubes_Actual'] = this.parseNumber(record['Lubes/Dooley Rolling Total Actual QB25'] || 0);
      record['Chief_Goal'] = this.parseNumber(record['Chief Running Total Goal25'] || 0);
      record['Chief_Actual'] = this.parseNumber(record['Chief Rolling Total Actual QB25'] || 0);

      // Percentages
      record['Lubes_Pct'] = this.parseNumber(record['Lubes/Dooley %25'] || 0);
      record['Hauling_Pct'] = this.parseNumber(record['Hauling %25'] || 0);
      record['Tankwagon_Pct'] = this.parseNumber(record['Tankwagon %25'] || 0);
      record['Transport_Pct'] = this.parseNumber(record['Transport Fuels %25'] || 0);
      record['Chief_Pct'] = this.parseNumber(record['Chief %25'] || 0);

      // Calculate unified metrics
      record['Sales'] = record['Chief_Actual'];
      record['Goal'] = record['Chief_Goal'];
      record['Gallon Qty'] = record['Chief_Actual'];

    } else if (sheetName === 'Data-gp-2024') {
      // Map Data-gp-2024 columns (CORRECTED)
      record['Date'] = this.parseDate(record['Dates24']);
      record['Dooley_Daily'] = this.parseNumber(record['Dooley Daily24'] || 0);
      record['Dooley_Rolling'] = this.parseNumber(record['Dooley Rolling24'] || 0);
      record['Lubes_Daily'] = this.parseNumber(record['Lubes Daily24'] || 0);
      record['Lubes_Rolling'] = this.parseNumber(record['Lubes Rolling24'] || 0);
      record['Hauling_Daily'] = this.parseNumber(record['Hauling Income Daily24'] || 0);
      record['Hauling_Rolling'] = this.parseNumber(record['Hauling Income Rolling24'] || 0);
      record['Tankwagon_Daily'] = this.parseNumber(record['Tankwagon Daily24'] || 0);
      record['Tankwagon_Rolling'] = this.parseNumber(record['Tankwagon Rolling24'] || 0);
      record['Transport_Daily'] = this.parseNumber(record['Transport Fuels Daily24'] || 0);
      record['Transport_Rolling'] = this.parseNumber(record['Transport Fuels Rolling24'] || 0);
      record['Chief_Daily'] = this.parseNumber(record['Chief Petroleum Daily24'] || 0);
      record['Chief_Rolling'] = this.parseNumber(record['Chief Petroleum Rolling24'] || 0);

      // Percentages
      record['Lubes_Pct'] = this.parseNumber(record['Lubes/Dooley GP %24'] || 0);
      record['Tankwagon_Pct'] = this.parseNumber(record['Tankwagon Last GP %24'] || 0);
      record['Hauling_Pct'] = this.parseNumber(record['Hauling  GP %24'] || 0);
      record['Transport_Pct'] = this.parseNumber(record['Transport Fuels  GP %24'] || 0);
      record['Chief_Pct'] = this.parseNumber(record['Chief GP %24'] || 0);

      // Calculate unified metrics
      record['Sales'] = record['Chief_Rolling'];
      record['Daily_Total'] = record['Chief_Daily'];
      record['Gallon Qty'] = record['Chief_Rolling'];
    }

    // Common calculated fields
    record['Actual Profit By Item'] = record['Sales'] * 0.1; // Estimate 10% profit margin
  }

  /**
   * Process summary data record (Recap-data)
   */
  processSummaryRecord(record) {
    // Handle recap data fields - match actual CSV column names
    record['Sales'] = this.parseNumber(
      record['PROFIT INCLUDES DELIEVERY FEE'] || 0
    );

    record['Gallon Qty'] = this.parseNumber(
      record['GALLONS'] || 0
    );

    record['Actual Profit By Item'] = this.parseNumber(
      record['PROFIT INCLUDES DELIEVERY FEE'] || 0
    );

    // Additional fields from Recap CSV
    record['Delivery Fee'] = this.parseNumber(
      record['DELIVERY FEE'] || 0
    );

    record['Margin'] = this.parseNumber(
      record['Margin (Greeen if includes deliver Fee)'] || 0
    );

    record['Driver'] = record['DRIVER'] || '';
    record['Company'] = record['COMPANY'] || '';
    record['OPIS'] = record['OPIS-true'] === 'TRUE';
  }

  /**
   * Process generic record (fallback)
   */
  processGenericRecord(record) {
    // Try to find sales-like fields
    const salesFields = ['Sales', 'TOTAL', 'Revenue', 'Amount'];
    for (const field of salesFields) {
      if (record[field]) {
        record['Sales'] = this.parseNumber(record[field]);
        break;
      }
    }
  }

  /**
   * Get the date field name for a sheet
   */
  getDateField(record, sheetName) {
    // Expanded list of possible date field names
    const possibleDateFields = [
      'Date', 'DATE', 'date',
      'Date24', 'Dates24', 'Dates25_1', 'Dates25', // GP-specific date fields
      'Transaction Date', 'Order Date',
      'Created Date', 'Timestamp',
      // Check for any field containing 'date' (case insensitive)
      ...Object.keys(record).filter(key =>
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time')
      )
    ];

    // Remove duplicates
    const uniqueFields = [...new Set(possibleDateFields)];

    for (const field of uniqueFields) {
      if (record[field] && record[field].toString().trim() !== '') {
        // Additional validation - check if it looks like a date
        const value = record[field].toString().trim();
        if (this.looksLikeDate(value)) {
          console.log(`🔍 Found date field: ${field} with value: ${value}`);
          return field;
        }
      }
    }

    console.warn('⚠️ No valid date field found in record:', Object.keys(record));
    return null;
  }

  /**
   * Check if a value looks like a date
   */
  looksLikeDate(value) {
    if (!value || value.toString().trim() === '') return false;

    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime())) return true;

    // Check common date patterns
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // M/D/YYYY or MM/DD/YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/,       // YYYY-M-D or YYYY-MM-DD
      /^\d{1,2}-\d{1,2}-\d{4}$/,       // M-D-YYYY or MM-DD-YYYY
      /^\d{4}\/\d{1,2}\/\d{1,2}$/      // YYYY/M/D or YYYY/MM/DD
    ];

    return datePatterns.some(pattern => pattern.test(value.toString().trim()));
  }

  /**
   * Extract date from any field in the record (fallback method)
   */
  extractDateFromRecord(record) {
    // Try all fields in the record to find anything that looks like a date
    for (const [key, value] of Object.entries(record)) {
      if (value && this.looksLikeDate(value)) {
        console.log(`🔍 Found date in field '${key}': ${value}`);
        return this.parseDate(value);
      }
    }

    // If no date found, try to generate one from filename or current date
    // This is a last resort for testing purposes
    const today = new Date();
    console.warn('⚠️ No date found in record, using current date as fallback');
    return today;
  }

  /**
   * Update summary based on sheet type
   */
  updateSummaryBySheetType(summary, record, sheetName) {
    const sheetType = this.sheets[sheetName]?.type;

    // Common updates
    summary.recordCount++;
    summary.totalSales += record['Sales'] || 0;

    if (sheetType === 'transactional') {
      summary.totalGallons += record['Gallon Qty'] || 0;
      summary.totalProfit += record['Actual Profit By Item'] || 0;
      summary.totalCost += record['Actual Cost by item'] || 0;

      if (record['Customer']) {
        summary.customers.add(record['Customer']);
      }
      if (record['Product Type']) {
        summary.productTypes.add(record['Product Type']);
      }
    } else if (sheetType === 'yearly') {
      // For yearly data, use different metrics
      summary.totalGoal = (summary.totalGoal || 0) + (record['Goal'] || 0);
      summary.totalActual = (summary.totalActual || 0) + (record['Actual'] || 0);
    }
  }

  /**
   * Get year-over-year comparison data with enhanced error handling
   * @param {string} sheet2024 - Name of 2024 data sheet
   * @param {string} sheet2025 - Name of 2025 data sheet
   */
  async getYearOverYearData(sheet2024 = 'Data-gp-2024', sheet2025 = 'Data-gp-2025') {
    try {
      // Validate sheet existence
      if (!this.sheets[sheet2024]) {
        throw new Error(`Sheet "${sheet2024}" not found in configuration`);
      }
      if (!this.sheets[sheet2025]) {
        throw new Error(`Sheet "${sheet2025}" not found in configuration`);
      }

      console.log(`🔄 Fetching year-over-year data: ${sheet2024} vs ${sheet2025}`);

      const results = await Promise.allSettled([
        this.fetchFuelData(sheet2024),
        this.fetchFuelData(sheet2025)
      ]);

      const data2024 = results[0].status === 'fulfilled' ? results[0].value : null;
      const data2025 = results[1].status === 'fulfilled' ? results[1].value : null;

      // Handle partial failures
      if (!data2024 && !data2025) {
        throw new Error('Failed to fetch data from both years');
      }

      if (!data2024) {
        console.warn(`⚠️ Could not fetch ${sheet2024} data:`, results[0].reason);
      }
      if (!data2025) {
        console.warn(`⚠️ Could not fetch ${sheet2025} data:`, results[1].reason);
      }

      const comparison = (data2024 && data2025)
        ? this.calculateYearComparison(data2024, data2025)
        : null;

      return {
        year2024: data2024,
        year2025: data2025,
        comparison: comparison,
        hasPartialData: !data2024 || !data2025,
        errors: {
          sheet2024: results[0].status === 'rejected' ? results[0].reason.message : null,
          sheet2025: results[1].status === 'rejected' ? results[1].reason.message : null
        }
      };
    } catch (error) {
      console.error('❌ Error fetching year-over-year data:', error);
      throw new Error(`Year-over-year comparison failed: ${error.message}`);
    }
  }

  /**
   * Calculate year-over-year comparison metrics
   * @param {Object} data2024 - 2024 data
   * @param {Object} data2025 - 2025 data
   */
  calculateYearComparison(data2024, data2025) {
    const summary2024 = data2024.summary;
    const summary2025 = data2025.summary;

    return {
      salesGrowth: this.calculateGrowthRate(summary2024.totalSales, summary2025.totalSales),
      gallonsGrowth: this.calculateGrowthRate(summary2024.totalGallons, summary2025.totalGallons),
      profitGrowth: this.calculateGrowthRate(summary2024.totalProfit, summary2025.totalProfit),
      customerGrowth: this.calculateGrowthRate(summary2024.activeCustomers, summary2025.activeCustomers),
      marginChange: summary2025.avgProfitMargin - summary2024.avgProfitMargin
    };
  }

  /**
   * Calculate growth rate percentage
   * @param {number} oldValue - Previous period value
   * @param {number} newValue - Current period value
   */
  calculateGrowthRate(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
}

// Export for use in other modules
window.ChiefDataService = ChiefDataService;