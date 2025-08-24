# Chief Petroleum Dashboard - User Guide

## 🚀 Quick Start

### 1. Upload Your Data (Enhanced)

**Smart File Upload:**

- Drag and drop CSV or Excel files (.csv, .xlsx, .xls) onto the upload zone
- Or click the upload zone to browse and select files
- Select multiple files for batch processing
- View file details and remove unwanted files before processing

**Intelligent Column Mapping:**

- Dashboard automatically analyzes your file structure
- AI-powered system suggests column mappings with confidence scores
- Use the visual drag-and-drop interface to map columns to dashboard fields
- Preview how your data will be processed before final import
- Apply mappings and import your data with validation

**Data Quality Analysis:**

- Receive comprehensive data quality reports
- View completeness, consistency, and accuracy scores
- Get detailed error reports and correction suggestions
- Validate business rules specific to fuel industry data

### 2. View Dashboard Analytics

- **Sales Trends**: Monthly/yearly performance tracking
- **Product Distribution**: Fuel type breakdown
- **Customer Performance**: Top customer rankings
- **Profit Analysis**: Revenue vs profit correlation
- **Geographic Analysis**: Location-based performance

### 3. Column Mapping (New Feature)

**Understanding Column Mapping:**

- The system analyzes your CSV/Excel columns and suggests mappings to dashboard fields
- Green checkmarks indicate high-confidence automatic mappings
- Yellow warnings suggest manual review needed
- Red errors indicate required fields that need mapping

**Using the Mapping Interface:**

1. **Auto-Detect**: Click "Auto-Detect" to apply AI-suggested mappings
2. **Manual Mapping**: Drag CSV columns to dashboard fields
3. **Preview Data**: Review how your data will appear after mapping
4. **Apply Mapping**: Click "Apply Mapping & Import" to process your data

**Required Fields:**

- **Date**: Transaction date (required for time-based analysis)
- **Sales**: Revenue amount (required for financial metrics)
- **Gallon Qty**: Volume quantity (required for volume analytics)

**Optional Fields:**

- Customer, Driver, Product Type, Location, Profit, Cost

### 4. Data Quality Dashboard (New Feature)

**Quality Scores:**

- **Completeness**: Percentage of non-empty data across all fields
- **Consistency**: Data type consistency and format adherence
- **Accuracy**: Business rule validation and error detection
- **Overall**: Composite quality score for quick assessment

**Error Types:**

- **High Priority**: Missing required fields, invalid data types
- **Medium Priority**: Low completeness, duplicate values, calculation errors
- **Low Priority**: Formatting suggestions, potential outliers

### 5. Use Advanced Filtering

- Navigate to "Data Explorer" section
- Apply filters for drivers, customers, products, locations
- Set date ranges for time-based analysis
- View real-time filter results with updated quality metrics

### 4. Explore Location Mapping

- Scroll to "Location Analysis & Mapping" section
- Select map type (Sales, Customers, Deliveries, Profit)
- Generate interactive bubble maps
- View comprehensive location statistics

## 🔍 Advanced Filtering Guide

### Multi-Dimensional Filtering

Filter your data across multiple dimensions simultaneously:

#### Available Filters

- **👤 Driver/Employee**: Select specific drivers for analysis
- **🏢 Customer**: Focus on particular customers or groups
- **⛽ Product Type**: Analyze specific fuel types or products
- **📍 Location**: Filter by geographic locations
- **📅 Date Range**: Set start and end dates for analysis

#### How to Apply Filters

1. **Select Values**: Use multi-select dropdowns (hold Ctrl/Cmd for multiple)
2. **Set Date Range**: Choose start and end dates if needed
3. **Apply Filters**: Click "Apply Filters" button
4. **View Results**: See filtered data count and summary
5. **Clear Filters**: Use "Clear All" to reset

#### Filter Tips

- **Multiple Selections**: Hold Ctrl (Windows) or Cmd (Mac) to select multiple items
- **Date Ranges**: Leave dates blank to include all dates
- **Real-Time Updates**: Filters apply instantly to all charts and data
- **Filter Summary**: Check the summary to see active filters and record count

## 📍 Location Mapping Guide

### Interactive Maps

Visualize your business data geographically:

#### Map Types

1. **💰 Sales by Location**: Revenue performance by location
2. **👥 Customer Distribution**: Geographic customer spread
3. **🚚 Delivery Routes**: Delivery patterns and coverage
4. **📊 Profit by Region**: Regional profitability analysis

#### Using Location Maps

1. **Select Map Type**: Choose from the dropdown menu
2. **Generate Map**: Click "Generate Map" button
3. **Explore Bubbles**: Larger bubbles = higher values
4. **Hover for Details**: Mouse over bubbles for exact values
5. **View Statistics**: Check location stats below the map

#### Map Features

- **Bubble Size**: Represents data magnitude (sales, customers, etc.)
- **Interactive Tooltips**: Hover for detailed information
- **Top 10 Display**: Shows top 10 performing locations
- **Comprehensive Stats**: Total locations, top performers, averages

## 📅 Daily Recap Guide

### Detailed Daily Analysis

Get granular insights for any specific date:

#### Basic Daily Recap

1. **Select Date**: Choose any date from the calendar
2. **Load Recap**: Click "Load Daily Recap"
3. **View Breakdown**: See products, customers, and performance

#### Advanced Daily Filtering

1. **Apply Recap Filters**: Use individual filter dropdowns
   - **Driver**: Focus on specific driver's daily performance
   - **Customer**: Analyze specific customer's daily activity
   - **Product**: View specific product performance for the date
   - **Location**: Geographic daily analysis
2. **Load Filtered Recap**: Get targeted daily insights

#### Daily Recap Features

- **Product Breakdown**: Sales and profit by product type
- **Customer Activity**: Transaction summaries by customer
- **Performance Metrics**: Daily KPIs and comparisons
- **Filtered Analysis**: Combine date selection with other filters

## 🎨 Theme & Visibility

### Theme Switching

- **Toggle Button**: Click the theme toggle in the top navigation
- **Automatic Saving**: Your theme preference is saved automatically
- **Enhanced Visibility**: Chart text optimized for both themes

### Chart Visibility Features

- **Dark Theme**: Pure white chart text with bold fonts
- **Light Theme**: Pure black chart text with bold fonts
- **Font Sizes**: 14px axis labels, 16px titles for clarity
- **High Contrast**: Maximum visibility in both themes

## 📊 Chart Interactions

### Interactive Features

- **Hover Effects**: Mouse over chart elements for details
- **Click Interactions**: Click legend items to show/hide data
- **Zoom Capabilities**: Some charts support zoom functionality
- **Responsive Design**: Charts adapt to screen size

### Chart Types

- **Line Charts**: Sales trends, growth rates, cumulative performance
- **Bar Charts**: Customer performance, year-over-year comparison
- **Pie/Doughnut Charts**: Product distribution, market share
- **Scatter Plots**: Profit analysis, correlation visualization
- **Bubble Maps**: Location-based performance visualization

## 🔧 Troubleshooting

### Common Issues

#### Charts Not Visible

- **Solution**: Switch themes to refresh chart visibility
- **Check**: Ensure data is loaded properly
- **Refresh**: Reload the page if charts don't appear

#### Filters Not Working

- **Check Data**: Ensure CSV data contains the fields you're filtering on
- **Clear Filters**: Use "Clear All" and reapply filters
- **Reload Data**: Try switching datasets and back

#### Location Maps Empty

- **Check Location Data**: Ensure your CSV has location fields
- **Verify Filters**: Location maps respect applied filters
- **Data Format**: Location fields should contain city, state, or address data

### Data Requirements

#### CSV Format

- **Headers**: First row should contain column names
- **Date Format**: Use standard date formats (MM/DD/YYYY, YYYY-MM-DD)
- **Numeric Data**: Sales, profit, quantities should be numeric
- **Location Data**: Include city, state, or address fields for mapping

#### Supported Fields

- **Sales**: Revenue, sales amount, transaction value
- **Customers**: Customer names, customer IDs
- **Products**: Product types, fuel types, product names
- **Locations**: City, state, address, location names
- **Drivers**: Driver names, employee names
- **Dates**: Transaction dates, delivery dates

## 💡 Tips & Best Practices

### Data Preparation

- **Clean Data**: Remove empty rows and invalid entries
- **Consistent Naming**: Use consistent customer and product names
- **Date Consistency**: Use the same date format throughout
- **Location Standardization**: Standardize city/state names

### Effective Analysis

- **Start Broad**: Begin with overall trends, then filter down
- **Compare Periods**: Use date ranges to compare time periods
- **Geographic Insights**: Use location mapping for territorial analysis
- **Driver Performance**: Filter by driver for individual performance review

### Performance Optimization

- **Large Datasets**: Consider filtering to reduce data size for better performance
- **Multiple Files**: Use dataset switching for different time periods
- **Regular Updates**: Upload fresh data regularly for current insights

## 📞 Support

### Getting Help

- **Documentation**: Refer to FEATURES.md for technical details
- **User Guide**: This guide for step-by-step instructions
- **GitHub Issues**: Report bugs or request features on GitHub

### Contact Information

Built by True North Data Strategies LLC for Chief Petroleum

- **Focus**: Enterprise-grade analytics for SMBs
- **Approach**: Real results, practical solutions
- **Specialty**: Fuel operations and business intelligence
