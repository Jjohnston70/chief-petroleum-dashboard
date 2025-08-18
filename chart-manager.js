/**
 * Chief Petroleum Chart Manager
 * Handles all chart creation and updates with Chart.js
 */

class ChiefChartManager {
  constructor() {
    this.charts = {};
    this.isDarkTheme = false;
    
    // Chief Petroleum brand colors - Optimized for visibility
    this.colors = {
      primary: '#0077cc', // Chief blue - visible on both themes
      secondary: '#ff6b35', // Orange accent
      accent: '#ffd700', // Gold
      success: '#10b981', // Green
      warning: '#f59e0b', // Amber
      danger: '#ef4444', // Red
      purple: '#8b5cf6', // Purple
      teal: '#14b8a6', // Teal
      pink: '#ec4899', // Pink
      indigo: '#6366f1', // Indigo
      gray: '#64748b' // Neutral gray
    };
    
    // Chart.js default configuration - Improved readability
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 13; // Slightly smaller for better fit
    Chart.defaults.font.weight = '500'; // Medium weight for better readability
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 15; // Reduced padding
    Chart.defaults.plugins.legend.labels.boxWidth = 12; // Smaller legend boxes
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.elements.point.radius = 4; // Smaller points
    Chart.defaults.elements.line.borderWidth = 2; // Thinner lines
  }

  /**
   * Update theme for all charts
   */
  updateTheme(isDark) {
    this.isDarkTheme = isDark;
    
    // Update Chart.js defaults for theme - Better contrast
    Chart.defaults.color = isDark ? '#f1f5f9' : '#334155'; // Higher contrast text
    Chart.defaults.borderColor = isDark ? '#64748b' : '#cbd5e1'; // Visible borders
    Chart.defaults.backgroundColor = isDark ? '#1e293b' : '#ffffff';

    // Update grid lines for better visibility
    Chart.defaults.scales.linear.grid.color = isDark ? '#475569' : '#e2e8f0';
    Chart.defaults.scales.category.grid.color = isDark ? '#475569' : '#e2e8f0';
    
    // Recreate all existing charts with new theme
    Object.keys(this.charts).forEach(chartId => {
      const chart = this.charts[chartId];
      if (chart && chart.data) {
        const data = chart.data;
        const options = chart.options;
        this.updateChart(chartId, data, options);
      }
    });
  }

  /**
   * Get theme-aware colors
   */
  getThemeColors() {
    return {
      text: this.isDarkTheme ? '#ffffff' : '#4a5568',
      background: this.isDarkTheme ? '#2d3748' : '#ffffff',
      border: this.isDarkTheme ? '#4a5568' : '#e2e8f0',
      grid: this.isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9'
    };
  }

  /**
   * Get color palette for charts with good visibility
   */
  getColorPalette(count = 10) {
    const palette = [
      this.colors.primary,   // Blue
      this.colors.secondary, // Orange
      this.colors.success,   // Green
      this.colors.warning,   // Amber
      this.colors.danger,    // Red
      this.colors.purple,    // Purple
      this.colors.teal,      // Teal
      this.colors.pink,      // Pink
      this.colors.indigo,    // Indigo
      this.colors.accent     // Gold
    ];

    // If we need more colors, generate variations
    if (count > palette.length) {
      for (let i = palette.length; i < count; i++) {
        const baseColor = palette[i % palette.length];
        // Create lighter/darker variations
        const variation = this.adjustColorBrightness(baseColor, (i % 2 === 0) ? 20 : -20);
        palette.push(variation);
      }
    }

    return palette.slice(0, count);
  }

  /**
   * Adjust color brightness for variations
   */
  adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Create sales trend chart
   */
  createSalesTrendChart(data, period = 'monthly') {
    const chartData = this.prepareSalesTrendData(data, period);
    const themeColors = this.getThemeColors();
    
    const config = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Sales Revenue',
            data: chartData.sales,
            borderColor: this.colors.primary,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.1),
            borderWidth: 2, // Thinner line
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: this.isDarkTheme ? '#1e293b' : '#ffffff',
            pointBorderWidth: 1,
            pointRadius: 3, // Smaller points
            pointHoverRadius: 5
          },
          {
            label: 'Profit',
            data: chartData.profit,
            borderColor: this.colors.success,
            backgroundColor: this.hexToRgba(this.colors.success, 0.1),
            borderWidth: 2, // Thinner line
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.success,
            pointBorderColor: this.isDarkTheme ? '#1e293b' : '#ffffff',
            pointBorderWidth: 1,
            pointRadius: 3, // Smaller points
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Sales & Profit Trend (${period.charAt(0).toUpperCase() + period.slice(1)})`,
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { 
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };
    
    return this.createChart('sales-chart', config);
  }

  /**
   * Create product type distribution chart
   */
  createProductChart(data) {
    const productData = this.prepareProductData(data);
    const themeColors = this.getThemeColors();
    
    const config = {
      type: 'doughnut',
      data: {
        labels: productData.labels,
        datasets: [{
          data: productData.values,
          backgroundColor: this.getColorPalette(productData.labels.length),
          borderColor: this.isDarkTheme ? '#1e293b' : '#ffffff',
          borderWidth: 2, // Thinner borders
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Fuel Type Sales Distribution',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'right',
            labels: {
              color: themeColors.text,
              padding: 10,
              usePointStyle: true,
              font: { size: 11 },
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    return this.createChart('product-chart', config);
  }

  /**
   * Create customer performance chart
   */
  createCustomerChart(data) {
    const customerData = this.prepareCustomerData(data);
    const themeColors = this.getThemeColors();
    
    const config = {
      type: 'bar',
      data: {
        labels: customerData.labels,
        datasets: [
          {
            label: 'Sales Revenue',
            data: customerData.sales,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.8),
            borderColor: this.colors.primary,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Profit',
            data: customerData.profit,
            backgroundColor: this.hexToRgba(this.colors.success, 0.8),
            borderColor: this.colors.success,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Top Customer Performance',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { 
              color: themeColors.text,
              maxRotation: 45
            }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: { 
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };
    
    return this.createChart('customer-chart', config);
  }

  /**
   * Create profit vs cost analysis chart
   */
  createProfitChart(data) {
    const profitData = this.prepareProfitData(data);
    const themeColors = this.getThemeColors();
    
    const config = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Transactions',
          data: profitData.points,
          backgroundColor: this.hexToRgba(this.colors.primary, 0.6),
          borderColor: this.colors.primary,
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Profit vs. Sales Analysis',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              title: function() {
                return 'Transaction Details';
              },
              label: function(context) {
                const point = context.parsed;
                const margin = point.x > 0 ? ((point.y / point.x) * 100).toFixed(1) : 0;
                return [
                  `Sales: $${point.x.toLocaleString()}`,
                  `Profit: $${point.y.toLocaleString()}`,
                  `Margin: ${margin}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Sales Revenue ($)',
              color: themeColors.text
            },
            grid: { color: themeColors.grid },
            ticks: { 
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Profit ($)',
              color: themeColors.text
            },
            grid: { color: themeColors.grid },
            ticks: { 
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };
    
    return this.createChart('profit-chart', config);
  }

  /**
   * Create or update a chart
   */
  createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element ${canvasId} not found`);
      return null;
    }
    
    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, config);
    
    return this.charts[canvasId];
  }

  /**
   * Update existing chart with new data
   */
  updateChart(canvasId, newData, newOptions = null) {
    const chart = this.charts[canvasId];
    if (!chart) return;
    
    chart.data = newData;
    if (newOptions) {
      chart.options = newOptions;
    }
    chart.update('active');
  }

  /**
   * Prepare sales trend data
   */
  prepareSalesTrendData(data, period) {
    // Check if data is a dataService object or direct data
    if (data.getSalesTrendData && typeof data.getSalesTrendData === 'function') {
      // Data service object (Google Sheets)
      const currentData = data.dashboard?.getFilteredData() || data.getCurrentData();
      const salesTrend = data.getSalesTrendData(currentData, period);

      return {
        labels: salesTrend.map(item => String(this.formatPeriodLabel(item.period, period))),
        sales: salesTrend.map(item => this.ensureNumeric(item.sales)),
        profit: salesTrend.map(item => this.ensureNumeric(item.profit))
      };
    } else {
      // Direct data object (CSV)
      const salesTrend = this.calculateSalesTrendFromRecords(data.records, period);

      return {
        labels: salesTrend.map(item => String(this.formatPeriodLabel(item.period, period))),
        sales: salesTrend.map(item => this.ensureNumeric(item.sales)),
        profit: salesTrend.map(item => this.ensureNumeric(item.profit))
      };
    }
  }

  /**
   * Calculate sales trend from records (for CSV data)
   */
  calculateSalesTrendFromRecords(records, period) {
    const trendMap = {};

    records.forEach(record => {
      const date = record['Date'];
      if (!date) return;

      let key;
      const recordDate = new Date(date);
      if (period === 'daily') {
        key = recordDate.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(recordDate);
        weekStart.setDate(recordDate.getDate() - recordDate.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else { // monthly
        key = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
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
   * Prepare product distribution data
   */
  prepareProductData(data) {
    // Check if data is a dataService object or direct data
    if (data.getProductTypeAnalysis && typeof data.getProductTypeAnalysis === 'function') {
      // Data service object (Google Sheets)
      const currentData = data.dashboard?.getFilteredData() || data.getCurrentData();
      const productAnalysis = data.getProductTypeAnalysis(currentData);

      return {
        labels: productAnalysis.map(item => String(item.type || 'Unknown')),
        values: productAnalysis.map(item => this.ensureNumeric(item.sales))
      };
    } else {
      // Direct data object (CSV)
      const productAnalysis = this.calculateProductAnalysisFromRecords(data.records);

      return {
        labels: productAnalysis.map(item => String(item.type || 'Unknown')),
        values: productAnalysis.map(item => this.ensureNumeric(item.sales))
      };
    }
  }

  /**
   * Calculate product analysis from records (for CSV data)
   */
  calculateProductAnalysisFromRecords(records) {
    if (!records || records.length === 0) {
      return [{
        type: 'No Data',
        sales: 0,
        gallons: 0,
        transactions: 0
      }];
    }

    const productMap = {};

    records.forEach(record => {
      const product = record['Product Type'] || record['Product'] || 'Unknown';
      const sales = this.ensureNumeric(record['Sales']);

      if (!productMap[product]) {
        productMap[product] = {
          type: product,
          sales: 0,
          gallons: 0,
          transactions: 0
        };
      }

      productMap[product].sales += sales;
      productMap[product].gallons += this.ensureNumeric(record['Gallon Qty']);
      productMap[product].transactions++;
    });

    const result = Object.values(productMap)
      .filter(item => item.sales > 0) // Only include items with sales
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 products

    // If no products with sales, return a placeholder
    if (result.length === 0) {
      return [{
        type: 'No Sales Data',
        sales: 0,
        gallons: 0,
        transactions: 0
      }];
    }

    return result;
  }

  /**
   * Prepare customer performance data
   */
  prepareCustomerData(data) {
    // Check if data is a dataService object or direct data
    if (data.getTopCustomers && typeof data.getTopCustomers === 'function') {
      // Data service object (Google Sheets)
      const currentData = data.dashboard?.getFilteredData() || data.getCurrentData();
      const topCustomers = data.getTopCustomers(currentData, 8);

      return {
        labels: topCustomers.map(customer => {
          // Truncate long customer names
          const name = customer.name || 'Unknown Customer';
          return String(name.length > 20 ? name.substring(0, 17) + '...' : name);
        }),
        sales: topCustomers.map(customer => this.ensureNumeric(customer.sales)),
        profit: topCustomers.map(customer => this.ensureNumeric(customer.profit))
      };
    } else {
      // Direct data object (CSV)
      const topCustomers = this.calculateTopCustomersFromRecords(data.records, 8);

      return {
        labels: topCustomers.map(customer => {
          // Truncate long customer names
          const name = customer.name || 'Unknown Customer';
          return String(name.length > 20 ? name.substring(0, 17) + '...' : name);
        }),
        sales: topCustomers.map(customer => this.ensureNumeric(customer.sales)),
        profit: topCustomers.map(customer => this.ensureNumeric(customer.profit))
      };
    }
  }

  /**
   * Calculate top customers from records (for CSV data)
   */
  calculateTopCustomersFromRecords(records, limit = 8) {
    const customerMap = {};

    records.forEach(record => {
      const customer = record['Customer'] || 'Unknown Customer';
      const sales = record['Sales'] || 0;
      const profit = record['Actual Profit By Item'] || 0;

      if (!customerMap[customer]) {
        customerMap[customer] = {
          name: customer,
          sales: 0,
          profit: 0,
          gallons: 0,
          transactions: 0
        };
      }

      customerMap[customer].sales += sales;
      customerMap[customer].profit += profit;
      customerMap[customer].gallons += record['Gallon Qty'] || 0;
      customerMap[customer].transactions++;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }

  /**
   * Prepare profit analysis data
   */
  prepareProfitData(data) {
    let records;

    // Check if data is a dataService object or direct data
    if (data.getCurrentData && typeof data.getCurrentData === 'function') {
      // Data service object (Google Sheets)
      const currentData = data.dashboard?.getFilteredData() || data.getCurrentData();
      records = currentData.records;
    } else {
      // Direct data object (CSV)
      records = data.records;
    }

    // Sample transactions for scatter plot
    const points = records
      .filter(record => {
        const sales = this.ensureNumeric(record['Sales']);
        const profit = this.ensureNumeric(record['Actual Profit By Item']);
        return sales > 0 && profit > 0;
      })
      .slice(0, 100) // Limit points for performance
      .map(record => ({
        x: this.ensureNumeric(record['Sales']),
        y: this.ensureNumeric(record['Actual Profit By Item'])
      }));

    return { points };
  }

  /**
   * Format period labels for charts
   */
  formatPeriodLabel(period, type) {
    if (type === 'daily') {
      return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (type === 'weekly') {
      return 'Week of ' + new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else { // monthly
      const [year, month] = period.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
  }

  /**
   * Prepare year-over-year comparison data
   * @param {Object} data2024 - 2024 data
   * @param {Object} data2025 - 2025 data
   */
  prepareYearComparisonData(data2024, data2025) {
    const trend2024 = data2024.getSalesTrendData ? data2024.getSalesTrendData(data2024, 'monthly') : [];
    const trend2025 = data2025.getSalesTrendData ? data2025.getSalesTrendData(data2025, 'monthly') : [];

    // Create a map of months for easier comparison
    const months2024 = {};
    const months2025 = {};

    trend2024.forEach(item => {
      const monthKey = item.period.substring(5); // Get MM part from YYYY-MM
      months2024[monthKey] = item.sales;
    });

    trend2025.forEach(item => {
      const monthKey = item.period.substring(5); // Get MM part from YYYY-MM
      months2025[monthKey] = item.sales;
    });

    // Generate labels for all months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const labels = [];
    const sales2024 = [];
    const sales2025 = [];

    for (let i = 1; i <= 12; i++) {
      const monthKey = String(i).padStart(2, '0');
      labels.push(monthNames[i - 1]);
      sales2024.push(months2024[monthKey] || 0);
      sales2025.push(months2025[monthKey] || 0);
    }

    return { labels, sales2024, sales2025 };
  }

  /**
   * Prepare growth rate data
   * @param {Object} data2024 - 2024 data
   * @param {Object} data2025 - 2025 data
   */
  prepareGrowthRateData(data2024, data2025) {
    const trend2024 = data2024.getSalesTrendData ? data2024.getSalesTrendData(data2024, 'monthly') : [];
    const trend2025 = data2025.getSalesTrendData ? data2025.getSalesTrendData(data2025, 'monthly') : [];

    // Create maps for easier lookup
    const months2024 = {};
    const months2025 = {};

    trend2024.forEach(item => {
      const monthKey = item.period.substring(5);
      months2024[monthKey] = { sales: item.sales, profit: item.profit };
    });

    trend2025.forEach(item => {
      const monthKey = item.period.substring(5);
      months2025[monthKey] = { sales: item.sales, profit: item.profit };
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const labels = [];
    const salesGrowth = [];
    const profitGrowth = [];

    for (let i = 1; i <= 12; i++) {
      const monthKey = String(i).padStart(2, '0');
      const data2024Month = months2024[monthKey];
      const data2025Month = months2025[monthKey];

      labels.push(monthNames[i - 1]);

      // Calculate growth rates
      if (data2024Month && data2025Month) {
        const salesGrowthRate = data2024Month.sales > 0
          ? ((data2025Month.sales - data2024Month.sales) / data2024Month.sales) * 100
          : 0;
        const profitGrowthRate = data2024Month.profit > 0
          ? ((data2025Month.profit - data2024Month.profit) / data2024Month.profit) * 100
          : 0;

        salesGrowth.push(salesGrowthRate);
        profitGrowth.push(profitGrowthRate);
      } else {
        salesGrowth.push(0);
        profitGrowth.push(0);
      }
    }

    return { labels, salesGrowth, profitGrowth };
  }

  /**
   * Prepare cumulative performance data
   * @param {Object} data - Source data
   */
  prepareCumulativeData(data) {
    let salesTrend;

    // Check if data is a dataService object or direct data
    if (data.getSalesTrendData && typeof data.getSalesTrendData === 'function') {
      // Data service object (Google Sheets)
      salesTrend = data.getSalesTrendData(data, 'monthly');
    } else {
      // Direct data object (CSV)
      salesTrend = this.calculateSalesTrendFromRecords(data.records, 'monthly');
    }

    const labels = [];
    const cumulativeSales = [];
    const cumulativeProfit = [];

    let runningSales = 0;
    let runningProfit = 0;

    salesTrend.forEach(item => {
      runningSales += item.sales || 0;
      runningProfit += item.profit || 0;

      labels.push(this.formatPeriodLabel(item.period, 'monthly'));
      cumulativeSales.push(runningSales);
      cumulativeProfit.push(runningProfit);
    });

    return { labels, cumulativeSales, cumulativeProfit };
  }

  /**
   * Prepare historical trend data from multiple datasets
   * @param {Array} historicalDataSets - Array of {sheet, data} objects
   */
  prepareHistoricalTrendData(historicalDataSets) {
    const allMonths = new Set();
    const datasets = [];

    // Collect all unique months across all datasets
    historicalDataSets.forEach(({sheet, data}) => {
      const trend = data.getSalesTrendData ? data.getSalesTrendData(data, 'monthly') : [];
      trend.forEach(item => allMonths.add(item.period));
    });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort();
    const labels = sortedMonths.map(period => this.formatPeriodLabel(period, 'monthly'));

    // Create dataset for each sheet
    historicalDataSets.forEach(({sheet, data}) => {
      const trend = data.getSalesTrendData ? data.getSalesTrendData(data, 'monthly') : [];
      const monthMap = {};

      trend.forEach(item => {
        monthMap[item.period] = item.sales;
      });

      const dataPoints = sortedMonths.map(month => monthMap[month] || 0);

      datasets.push({
        label: this.formatSheetLabel(sheet),
        data: dataPoints
      });
    });

    return { labels, datasets };
  }

  /**
   * Prepare seasonal pattern data
   * @param {Object} data - Source data
   */
  prepareSeasonalData(data) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyData = {};

    // Initialize monthly data
    monthNames.forEach((month, index) => {
      monthlyData[index + 1] = { sales: [], total: 0, count: 0 };
    });

    // Aggregate data by month
    if (data.records) {
      data.records.forEach(record => {
        const date = record['Date'];
        if (date) {
          const month = date.getMonth() + 1;
          const sales = record['Sales'] || 0;

          if (monthlyData[month]) {
            monthlyData[month].sales.push(sales);
            monthlyData[month].total += sales;
            monthlyData[month].count++;
          }
        }
      });
    }

    // Calculate averages and peaks
    const avgSales = [];
    const peakSales = [];

    monthNames.forEach((month, index) => {
      const monthData = monthlyData[index + 1];
      const avg = monthData.count > 0 ? monthData.total / monthData.count : 0;
      const peak = monthData.sales.length > 0 ? Math.max(...monthData.sales) : 0;

      avgSales.push(avg);
      peakSales.push(peak);
    });

    return {
      labels: monthNames,
      avgSales,
      peakSales
    };
  }

  /**
   * Get color for dataset by index
   * @param {number} index - Dataset index
   */
  getDatasetColor(index) {
    const colors = [
      this.colors.primary,
      this.colors.success,
      this.colors.accent,
      this.colors.gold,
      this.colors.warning,
      this.colors.gray
    ];
    return colors[index % colors.length];
  }

  /**
   * Prepare customer retention data
   * @param {Object} data - Source data
   */
  prepareCustomerRetentionData(data) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyCustomers = {};
    const customerVisits = {};

    // Initialize monthly data
    monthNames.forEach((month, index) => {
      monthlyCustomers[index + 1] = {
        new: new Set(),
        returning: new Set(),
        loyal: new Set()
      };
    });

    // Track customer visits
    if (data.records) {
      data.records.forEach(record => {
        const customer = record['Customer'];
        const date = record['Date'];

        if (customer && date) {
          if (!customerVisits[customer]) {
            customerVisits[customer] = [];
          }
          customerVisits[customer].push(date);
        }
      });
    }

    // Categorize customers by month
    Object.keys(customerVisits).forEach(customer => {
      const visits = customerVisits[customer].sort((a, b) => a - b);

      visits.forEach((visit, index) => {
        const month = visit.getMonth() + 1;

        if (monthlyCustomers[month]) {
          if (index === 0) {
            // First visit = new customer
            monthlyCustomers[month].new.add(customer);
          } else if (visits.length >= 3) {
            // 3+ visits = loyal customer
            monthlyCustomers[month].loyal.add(customer);
          } else {
            // 2nd visit = returning customer
            monthlyCustomers[month].returning.add(customer);
          }
        }
      });
    });

    // Convert to arrays
    const newCustomers = [];
    const returningCustomers = [];
    const loyalCustomers = [];

    monthNames.forEach((month, index) => {
      const monthData = monthlyCustomers[index + 1];
      newCustomers.push(monthData.new.size);
      returningCustomers.push(monthData.returning.size);
      loyalCustomers.push(monthData.loyal.size);
    });

    return {
      labels: monthNames,
      newCustomers,
      returningCustomers,
      loyalCustomers
    };
  }

  /**
   * Format sheet name for display
   * @param {string} sheetName - Raw sheet name
   */
  formatSheetLabel(sheetName) {
    const labelMap = {
      'Data': 'Current Data',
      'Data-gp-2024': '2024 Data',
      'Data-gp-2025': '2025 Data',
      'Recap-data': 'Summary Data'
    };
    return labelMap[sheetName] || sheetName;
  }

  /**
   * Convert hex color to rgba
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Ensure value is numeric for Chart.js
   */
  ensureNumeric(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Create year-over-year comparison chart
   * @param {Object} data2024 - 2024 data
   * @param {Object} data2025 - 2025 data
   */
  createYearOverYearChart(data2024, data2025) {
    const comparisonData = this.prepareYearComparisonData(data2024, data2025);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'bar',
      data: {
        labels: comparisonData.labels,
        datasets: [
          {
            label: '2024 Sales',
            data: comparisonData.sales2024,
            backgroundColor: this.hexToRgba(this.colors.secondary, 0.8),
            borderColor: this.colors.secondary,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: '2025 Sales',
            data: comparisonData.sales2025,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.8),
            borderColor: this.colors.primary,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Year-over-Year Sales Comparison',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              },
              afterBody: function(tooltipItems) {
                if (tooltipItems.length === 2) {
                  const value2024 = tooltipItems[0].parsed.y;
                  const value2025 = tooltipItems[1].parsed.y;
                  const growth = value2024 > 0 ? ((value2025 - value2024) / value2024 * 100).toFixed(1) : 0;
                  return `Growth: ${growth}%`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };

    return this.createChart('year-comparison-chart', config);
  }

  /**
   * Create growth rate chart
   * @param {Object} data2024 - 2024 data
   * @param {Object} data2025 - 2025 data
   */
  createGrowthRateChart(data2024, data2025) {
    const growthData = this.prepareGrowthRateData(data2024, data2025);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'line',
      data: {
        labels: growthData.labels,
        datasets: [
          {
            label: 'Sales Growth Rate (%)',
            data: growthData.salesGrowth,
            borderColor: this.colors.success,
            backgroundColor: this.hexToRgba(this.colors.success, 0.1),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.success,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Profit Growth Rate (%)',
            data: growthData.profitGrowth,
            borderColor: this.colors.gold,
            backgroundColor: this.hexToRgba(this.colors.gold, 0.1),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.gold,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Month-over-Month Growth Rates',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return value.toFixed(1) + '%';
              }
            }
          }
        }
      }
    };

    return this.createChart('growth-rate-chart', config);
  }

  /**
   * Create cumulative performance chart
   * @param {Object} data - Data for cumulative analysis
   */
  createCumulativeChart(data) {
    const cumulativeData = this.prepareCumulativeData(data);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'line',
      data: {
        labels: cumulativeData.labels,
        datasets: [
          {
            label: 'Cumulative Sales',
            data: cumulativeData.cumulativeSales,
            borderColor: this.colors.primary,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.1),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative Profit',
            data: cumulativeData.cumulativeProfit,
            borderColor: this.colors.success,
            backgroundColor: this.hexToRgba(this.colors.success, 0.1),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.success,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
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
            text: 'Cumulative Performance Trajectory',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            title: {
              display: true,
              text: 'Cumulative Sales ($)',
              color: themeColors.text
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            title: {
              display: true,
              text: 'Cumulative Profit ($)',
              color: themeColors.text
            }
          }
        }
      }
    };

    return this.createChart('cumulative-chart', config);
  }

  /**
   * Create historical trend analysis chart
   * @param {Array} historicalDataSets - Array of data from different sheets/years
   */
  createHistoricalTrendChart(historicalDataSets) {
    const historicalData = this.prepareHistoricalTrendData(historicalDataSets);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'line',
      data: {
        labels: historicalData.labels,
        datasets: historicalData.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: this.getDatasetColor(index),
          backgroundColor: this.hexToRgba(this.getDatasetColor(index), 0.1),
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: this.getDatasetColor(index),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Historical Trend Analysis - Multi-Year Comparison',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };

    return this.createChart('historical-trend-chart', config);
  }

  /**
   * Create seasonal pattern analysis chart
   * @param {Object} data - Data for seasonal analysis
   */
  createSeasonalPatternChart(data) {
    const seasonalData = this.prepareSeasonalData(data);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'radar',
      data: {
        labels: seasonalData.labels,
        datasets: [
          {
            label: 'Average Monthly Sales',
            data: seasonalData.avgSales,
            borderColor: this.colors.primary,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.2),
            borderWidth: 2,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Peak Performance',
            data: seasonalData.peakSales,
            borderColor: this.colors.success,
            backgroundColor: this.hexToRgba(this.colors.success, 0.2),
            borderWidth: 2,
            pointBackgroundColor: this.colors.success,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Seasonal Sales Pattern Analysis',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: themeColors.grid },
            pointLabels: { color: themeColors.text },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };

    return this.createChart('seasonal-pattern-chart', config);
  }

  /**
   * Create customer retention analysis chart
   * @param {Object} data - Data for customer retention analysis
   */
  createCustomerRetentionChart(data) {
    const retentionData = this.prepareCustomerRetentionData(data);
    const themeColors = this.getThemeColors();

    const config = {
      type: 'bar',
      data: {
        labels: retentionData.labels,
        datasets: [
          {
            label: 'New Customers',
            data: retentionData.newCustomers,
            backgroundColor: this.hexToRgba(this.colors.accent, 0.8),
            borderColor: this.colors.accent,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Returning Customers',
            data: retentionData.returningCustomers,
            backgroundColor: this.hexToRgba(this.colors.success, 0.8),
            borderColor: this.colors.success,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Loyal Customers (3+ visits)',
            data: retentionData.loyalCustomers,
            backgroundColor: this.hexToRgba(this.colors.gold, 0.8),
            borderColor: this.colors.gold,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Customer Retention & Loyalty Analysis',
            color: themeColors.text,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            labels: { color: themeColors.text }
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value} customers`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: themeColors.grid },
            ticks: { color: themeColors.text }
          },
          y: {
            stacked: true,
            grid: { color: themeColors.grid },
            ticks: {
              color: themeColors.text,
              callback: function(value) {
                return value + ' customers';
              }
            }
          }
        }
      }
    };

    return this.createChart('customer-retention-chart', config);
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }

  /**
   * Resize all charts
   */
  resizeAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.resize();
    });
  }

  /**
   * Get chart info for tooltips
   */
  getChartInfo(chartType) {
    const info = {
      'sales-trend': 'Sales Trend Analysis: Shows total sales revenue over time with trend lines. Helps identify growth patterns, seasonal variations, and performance trends. Green indicates positive growth, red shows decline.',
      'product-distribution': 'Fuel Type Distribution: Displays the percentage breakdown of different fuel types sold by volume (gallons). Shows which products are most popular and helps with inventory planning.',
      'customer-performance': 'Top Customer Performance: Ranks customers by total sales revenue and transaction volume. Helps identify your most valuable customers and potential growth opportunities.',
      'profit-analysis': 'Profit vs Sales Analysis: Scatter plot showing the relationship between sales volume and profit margins. Each point represents a time period - helps identify optimal pricing strategies.',
      'year-comparison': 'Year-over-Year Comparison: Side-by-side comparison of current year vs previous year performance by month. Shows growth or decline in sales, gallons sold, and customer count.',
      'growth-rate': 'Growth Rate Trends: Shows month-to-month percentage change in key metrics. Positive values indicate growth, negative values show decline. Helps track business momentum.',
      'cumulative': 'Cumulative Performance: Running total of sales and key metrics throughout the year. Shows overall business trajectory and helps with forecasting and goal tracking.',
      'historical-trend': 'Historical Trend Analysis: Multi-year view of business performance showing long-term trends, seasonal patterns, and year-over-year growth across all available data.',
      'seasonal-pattern': 'Seasonal Pattern Analysis: Radar chart showing average performance by month across all years. Helps identify seasonal trends for inventory and staffing planning.',
      'customer-retention': 'Customer Retention Analysis: Shows customer acquisition, retention, and churn rates over time. Helps understand customer loyalty and identify retention opportunities.'
    };

    return info[chartType] || 'Chart analysis and insights for business performance tracking';
  }
}

// Export for use in other modules
window.ChiefChartManager = ChiefChartManager;