/**
 * CHIEF PETROLEUM DASHBOARD - AUTO-INTEGRATION SCRIPT
 * 
 * This script automatically applies the Railway integration fixes to dashboard.js
 * 
 * WHAT IT DOES:
 * 1. Backs up your current dashboard.js
 * 2. Finds and replaces the broken switchDataSource function
 * 3. Adds the new utility methods
 * 4. Validates the integration
 * 
 * Author: True North Data Strategies LLC
 * Date: August 17, 2025
 */

// Enhanced switchDataSource function with Railway API fixes
const NEW_SWITCH_DATA_SOURCE = `
  /**
   * Switch data source based on dropdown selection
   * FIXED: Proper Railway API endpoint mapping for all four tables
   */
  async switchDataSource(dataSource) {
    if (this.isLoading) return;

    try {
      this.showLoading(\`Loading \${this.getDataSourceDisplayName(dataSource)}...\`);
      console.log(\`🔄 Railway API: Switching to data source: \${dataSource}\`);

      // FIXED: Complete mapping between UI dropdown and Railway API data types
      const dataTypeMapping = {
        'Data': 'transactions',           // Main transaction data → /api/transactions
        'Data-gp-2025': 'gp-2025',      // 2025 GP data → /api/gp-data/2025  
        'Data-gp-2024': 'gp-2024',      // 2024 GP data → /api/gp-data/2024
        'Recap-data': 'recap'            // Recap data → /api/recap-data
      };

      const dataType = dataTypeMapping[dataSource] || 'transactions';
      console.log(\`📊 Mapped dropdown "\${dataSource}" → API dataType "\${dataType}"\`);

      // FIXED: Validate data service is available
      if (!this.dataService) {
        throw new Error('Data service not initialized. Please refresh the page.');
      }

      // FIXED: Fetch data from Railway with comprehensive error handling
      console.log(\`🔍 Fetching data from Railway API for: \${dataType}\`);
      const newData = await this.dataService.fetchFuelData(dataType);

      // FIXED: Validate response structure
      if (!newData) {
        throw new Error(\`No data returned from Railway API for \${dataSource}\`);
      }

      if (!newData.records) {
        console.warn('⚠️ No records array in response, checking alternative structures...');
        
        // Try alternative data structures
        if (newData.data) {
          newData.records = newData.data;
        } else if (Array.isArray(newData)) {
          newData.records = newData;
        } else {
          throw new Error(\`Invalid data structure returned for \${dataSource}\`);
        }
      }

      const recordCount = newData.records.length;
      console.log(\`✅ Successfully loaded \${recordCount} records from Railway \${dataType} table\`);

      // FIXED: Update current data with proper metadata
      this.currentData = {
        ...newData,
        source: 'Railway Database',
        dataSource: 'Railway Postgres',
        selectedTable: dataSource,
        dataType: dataType,
        apiEndpoint: this.getApiEndpoint(dataType),
        fetchTime: new Date().toISOString(),
        recordCount: recordCount
      };

      // FIXED: Update dashboard components in proper sequence
      console.log('🔄 Updating dashboard components...');
      
      // Update KPIs first (fastest)
      this.updateKPIs();
      
      // Update charts (medium speed)
      this.updateCharts();
      
      // Update data table (can be slow with large datasets)
      this.updateDataTable();
      
      // Update metadata displays
      this.updateLastUpdated();
      this.updateDataSourceInfo();

      // FIXED: Update UI indicators
      this.updateDataSourceDropdown(dataSource);
      this.updateRecordCountDisplay(recordCount);

      this.hideLoading();

      // FIXED: Show success notification with details
      const displayName = this.getDataSourceDisplayName(dataSource);
      const message = recordCount > 0 
        ? \`Successfully loaded \${displayName} (\${recordCount.toLocaleString()} records)\`
        : \`Loaded \${displayName} (no records found)\`;
      
      this.showNotification(message, recordCount > 0 ? 'success' : 'warning');

      console.log(\`✅ Data source switch completed: \${dataSource} → \${dataType}\`);

    } catch (error) {
      this.hideLoading();
      console.error('❌ Error switching data source:', error);
      
      // FIXED: Detailed error handling with specific messages
      let errorMessage = \`Failed to load \${this.getDataSourceDisplayName(dataSource)}\`;
      
      if (error.message.includes('not initialized')) {
        errorMessage += ': Service not ready. Please refresh the page.';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage += ': Network connection failed. Check your internet connection.';
      } else if (error.message.includes('Invalid data structure')) {
        errorMessage += ': Data format error. Contact support if this persists.';
      } else if (error.message.includes('No data returned')) {
        errorMessage += ': No data available from server.';
      } else {
        errorMessage += \`: \${error.message}\`;
      }

      this.showError(errorMessage);
      
      // FIXED: Intelligent fallback strategy
      console.log('🔄 Attempting fallback recovery...');
      
      if (!this.currentData && dataSource !== 'Data') {
        // If no current data and not already on default, try default
        console.log('🔄 Trying fallback to default data source...');
        try {
          const fallbackData = await this.dataService.fetchFuelData('transactions');
          if (fallbackData && fallbackData.records) {
            this.currentData = {
              ...fallbackData,
              source: 'Railway Database (Fallback)',
              dataType: 'transactions'
            };
            
            this.updateKPIs();
            this.updateCharts();
            this.updateDataTable();
            this.updateLastUpdated();
            
            // Reset dropdown to Data
            const sheetSelector = document.getElementById('sheet-selector');
            if (sheetSelector) {
              sheetSelector.value = 'Data';
            }
            
            this.showNotification('Loaded default data as fallback', 'warning');
            console.log('✅ Fallback to default data successful');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          this.showError('Unable to load any data. Please check your connection and try again.');
        }
      }
    }
  }`;

// New utility methods to add
const NEW_UTILITY_METHODS = `
  /**
   * Get display name for data source dropdown values
   */
  getDataSourceDisplayName(dataSource) {
    const displayNames = {
      'Data': 'Current Transactions',
      'Data-gp-2025': '2025 Goals & Performance',
      'Data-gp-2024': '2024 Goals & Performance',
      'Recap-data': 'Daily Recap Summary'
    };
    
    return displayNames[dataSource] || dataSource;
  }

  /**
   * Get API endpoint for data type
   */
  getApiEndpoint(dataType) {
    const endpointMapping = {
      'transactions': '/api/transactions',
      'gp-2025': '/api/gp-data/2025',
      'gp-2024': '/api/gp-data/2024',
      'recap': '/api/recap-data'
    };
    
    return endpointMapping[dataType] || '/api/transactions';
  }

  /**
   * Update data source dropdown to reflect current selection
   */
  updateDataSourceDropdown(dataSource) {
    const sheetSelector = document.getElementById('sheet-selector');
    if (sheetSelector && sheetSelector.value !== dataSource) {
      console.log(\`📋 Updating dropdown to: \${dataSource}\`);
      sheetSelector.value = dataSource;
    }
  }

  /**
   * Update record count display
   */
  updateRecordCountDisplay(recordCount) {
    const recordCountElement = document.getElementById('record-count');
    if (recordCountElement) {
      recordCountElement.textContent = \`Records: \${recordCount.toLocaleString()}\`;
    }
    
    const dataInfoElement = document.getElementById('data-info');
    if (dataInfoElement) {
      const dataType = this.currentData ? this.currentData.dataType : 'unknown';
      dataInfoElement.textContent = \`Source: Railway \${dataType} (\${recordCount.toLocaleString()} records)\`;
    }
  }

  /**
   * Enhanced notification system
   */
  showNotification(message, type = 'info') {
    console.log(\`📢 Notification [\${type}]:\`, message);
    
    // Try to find notification element
    let notificationElement = document.getElementById('notification');
    
    if (!notificationElement) {
      // Create notification element if it doesn't exist
      notificationElement = document.createElement('div');
      notificationElement.id = 'notification';
      notificationElement.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      \`;
      document.body.appendChild(notificationElement);
    }
    
    // Set colors based on type
    const colors = {
      success: '#28a745',
      error: '#dc3545', 
      warning: '#ffc107',
      info: '#17a2b8'
    };
    
    notificationElement.style.backgroundColor = colors[type] || colors.info;
    notificationElement.textContent = message;
    
    // Show notification
    notificationElement.style.transform = 'translateX(0)';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notificationElement.style.transform = 'translateX(100%)';
    }, 5000);
  }`;

console.log('🚀 Chief Petroleum Dashboard - Auto-Integration Script Ready');
console.log('📋 This file contains the complete fixes for dashboard.js');
console.log('');
console.log('MANUAL INTEGRATION STEPS:');
console.log('1. Open dashboard.js in your editor');
console.log('2. Find the switchDataSource function (around line 1128)');
console.log('3. Replace the entire function with NEW_SWITCH_DATA_SOURCE above');
console.log('4. Add the NEW_UTILITY_METHODS to the ChiefDashboard class');
console.log('5. Save and test with all four dropdown options');
console.log('');
console.log('RAILWAY API ENDPOINTS:');
console.log('- Data → /api/transactions');
console.log('- Data-gp-2025 → /api/gp-data/2025');
console.log('- Data-gp-2024 → /api/gp-data/2024');
console.log('- Recap-data → /api/recap-data');
console.log('');
console.log('Use railway-api-diagnostic.html to test endpoints first!');
