# Chief Petroleum Dashboard - Technical Architecture

## System Overview

The Chief Petroleum Dashboard is a client-side web application designed for fuel transaction data analysis. After the Railway API removal, it operates as a completely self-contained solution using CSV file uploads for data input.

## Architecture Principles

- **Client-Side Only**: No server dependencies or external APIs
- **CSV-First**: All data processing from uploaded CSV files
- **Modular Design**: Separated concerns with dedicated managers
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## Core Components

### 1. Dashboard Controller (`dashboard.js`)

**Primary Responsibilities:**
- Application initialization and lifecycle management
- CSV file upload and processing
- Data validation and transformation
- UI state management
- Event handling and coordination

**Key Methods:**
- `init()` - Initialize dashboard components
- `handleCSVUpload()` - Process uploaded CSV files
- `loadDashboardData()` - Load and display data
- `updateKPIs()` - Calculate and display key metrics
- `updateCharts()` - Refresh all visualizations

### 2. Chart Manager (`chart-manager.js`)

**Primary Responsibilities:**
- Chart creation and rendering using Chart.js
- Data visualization management
- Chart responsiveness and theming
- Interactive chart features

**Chart Types:**
- Sales trend charts (line/bar)
- Customer analysis (pie/doughnut)
- Product breakdown (bar)
- Profit analysis (line)

### 3. Theme Manager (`theme-manager.js`)

**Primary Responsibilities:**
- UI theme switching (light/dark/auto)
- Color scheme management
- Chart theme coordination
- User preference persistence

## Data Flow Architecture

```
CSV Upload → File Reading → Data Parsing → Validation → Processing → Storage → Visualization
     ↓            ↓            ↓           ↓           ↓          ↓           ↓
File Input → FileReader → parseCSVData → validation → transform → memory → charts/KPIs
```

## Data Structure

### CSV Data Format
```javascript
{
  records: [
    {
      Date: "2024-01-15",
      Customer: "ABC Corp",
      "Product Type": "Diesel",
      "Gallon Qty": 500,
      Sales: 1250.00,
      "Actual Profit By Item": 125.00
      // ... additional fields
    }
  ],
  summary: {
    totalRecords: 1000,
    totalSales: 125000.00,
    totalGallons: 50000,
    totalProfit: 12500.00,
    avgProfitMargin: 10.0,
    activeCustomers: 25
  },
  source: "CSV Upload",
  datasetName: "Q1-2024-Data",
  uploadedAt: "2024-01-15T10:30:00Z"
}
```

## State Management

### Application State
- `currentData`: Currently active dataset
- `uploadedDatasets`: Collection of all uploaded datasets
- `currentDataset`: Name of active dataset
- `isLoading`: Loading state indicator

### UI State
- Chart instances and configurations
- Filter selections
- Theme preferences
- Modal states

## Error Handling Strategy

### Levels of Error Handling
1. **File Level**: CSV parsing and validation errors
2. **Data Level**: Data transformation and calculation errors  
3. **UI Level**: Chart rendering and display errors
4. **User Level**: Friendly error messages and recovery options

### Error Recovery
- Graceful degradation for missing data
- Fallback to empty states
- User notification system
- Retry mechanisms where appropriate

## Performance Considerations

### Data Processing
- Streaming CSV parsing for large files
- Lazy loading of chart data
- Debounced UI updates
- Memory management for multiple datasets

### UI Responsiveness
- Async/await for non-blocking operations
- Loading states for user feedback
- Progressive chart rendering
- Responsive design patterns

## Security Considerations

### Client-Side Security
- Input validation and sanitization
- XSS prevention in dynamic content
- Safe CSV parsing practices
- No external data transmission

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- ES6+ JavaScript support
- FileReader API
- Canvas API (for charts)
- CSS Grid and Flexbox

## Deployment Architecture

### Static Hosting
- No server-side requirements
- CDN-friendly static assets
- Single-page application structure
- Progressive Web App capabilities

### File Structure
```
chief-petroleum-dashboard/
├── index.html
├── dashboard.js
├── chart-manager.js
├── theme-manager.js
├── styles.css
├── memory-bank/
└── assets/
```

## Future Architecture Considerations

### Potential Enhancements
- IndexedDB for persistent storage
- Web Workers for heavy data processing
- Service Worker for offline capabilities
- WebAssembly for performance-critical calculations

### Scalability
- Modular component loading
- Plugin architecture for extensions
- API abstraction layer for future integrations
- Microservice-ready design patterns
