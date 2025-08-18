🛢️ Chief Petroleum Dashboard - Frontend
Modern fuel business analytics dashboard with real-time data integration, interactive charts, and responsive design

A comprehensive business intelligence frontend for Chief Petroleum's operations, featuring real-time KPI tracking, data visualizations, and seamless integration with Railway PostgreSQL backend.

Dashboard Preview

🚀 Quick Start
Live Demo
🌐 View Dashboard

Local Development
# Clone the repository
git clone https://github.com/Jjohnston70/chief-petroleum-dashboard.git
cd chief-petroleum-dashboard

# Open in browser
open index.html
# or
python -m http.server 8000  # For local server
📊 Features
🎯 Key Performance Indicators
Real-time Sales Tracking: Live revenue and transaction monitoring
Volume Analytics: Gallon-based metrics across product types
Profit Margins: Dynamic margin analysis and tracking
Customer Intelligence: Performance rankings and retention metrics
Operational Data: Driver performance and delivery insights
📈 Interactive Visualizations
Sales Trend Charts: Historical and real-time sales analysis
Customer Rankings: Top performers and growth trends
Product Distribution: Mix analysis and inventory insights
Geographic Analytics: Location-based performance metrics
Time-series Analysis: Custom date range filtering
🎨 User Experience
Responsive Design: Works seamlessly on desktop, tablet, and mobile
Dark/Light Themes: Chief Petroleum branded themes with red accents
Real-time Updates: Fresh data on every interaction
Export Functions: Download filtered data as CSV
Interactive Controls: Click, hover, and filter capabilities
🏗️ Architecture
Frontend Stack
HTML5 + CSS3 + Vanilla JavaScript + Chart.js + Responsive Design
Data Flow
Smart Fallback System
📁 Project Structure
📁 chief-petroleum-dashboard/
├── 📄 index.html              # Main dashboard interface
├── 📄 dashboard.js            # Core application logic
├── 📄 chart-manager.js        # Chart.js visualizations
├── 📄 data-service.js         # Data fetching and processing
├── 📄 database-data-service.js # Railway API 
🔌 API Integration
Backend Endpoints
Base URL: https://api-server-final-production.up.railway.app

GET /health                    # Database health check
GET /api/kpis                 # Key performance indicators  
GET /api/transactions          # Sales transactions
GET /api/gp-data/2024         # 2024 GP 
Data Sources
Primary: Railway PostgreSQL (8,832+ records)
Fallback: Google Sheets API (backup)
Demo: Sample data for presentations
🎯 Business Value
Real Metrics Tracked
Sales Performance: Revenue tracking from 8,100+ transactions
Volume Analysis: Gallon-based metrics across product types
Profitability: Margin analysis and profit tracking
Customer Intelligence: Performance ranking and retention
Operational Data: Driver performance and delivery tracking
Decision Support
Real-time dashboards instead of manual spreadsheets
Historical trend analysis for strategic planning
Customer performance insights for sales optimization
Product mix analysis for inventory decisions
Profit margin tracking for pricing strategies
🛡️ Error Handling & Reliability
Robust Fallback System
Automatic failover when Railway API is unavailable
Connection retry logic with user-friendly messages
Sample data mode for demonstrations
Comprehensive error logging for debugging
Graceful degradation ensures dashboard always works
User-Friendly Features
Loading indicators for all data operations
Error messages with clear next steps
Offline mode with cached data
Performance optimization for large datasets
🚀 Deployment
Vercel (Recommended)
# Connect to Vercel
vercel --prod

# Or deploy via GitHub integration
# 1. Connect repository to Vercel
# 2. Auto-deploy on push to main branch
Manual Deployment
# Any static hosting service
# Upload all files to web server
# Ensure index.html is the entry point
🔗 Related Dashboards
The Chief Petroleum ecosystem includes multiple specialized dashboards:

Fleet Medic: Vehicle maintenance and fleet management
Chief Pricing: Fuel pricing optimization
Supplier Dashboard 4.0: Supplier management and analytics
Weather Analytics: Weather impact analysis
Website Analytics: Digital presence tracking
🎨 Customization
Themes
Dark Theme: Chief Petroleum branded with red accents
Light Theme: Clean, professional appearance
Custom Colors: Easily configurable in styles.css
Charts
Chart.js Integration: Fully customizable visualizations
Responsive Design: Adapts to all screen sizes
Interactive Features: Click, hover, zoom capabilities
📱 Mobile Support
Responsive Grid: Adapts to all screen sizes
Touch Optimized: Mobile-friendly interactions
Fast Loading: Optimized for mobile networks
Offline Capable: Works without internet connection
🔧 Development
Local Setup
# No build process required - pure frontend
# Simply open index.html in browser
# Or use local server for development:
python -m http.server 8000
# or
npx serve .
Environment Configuration
// Update API endpoints in database-data-service.js
const API_BASE_URL = 'your-api-endpoint';
📞 Support
Built By
True North Data Strategies LLC

Making enterprise-grade tech accessible to small and midsize businesses
Real results, not shiny gimmicks
Tech that just works
For
Chief Petroleum

Fuel industry operations
Business intelligence and analytics
Data-driven decision making
🎉 Status: Production Ready
✅ Frontend: Fully responsive and optimized
✅ API Integration: Railway PostgreSQL connected
✅ Charts: Interactive Chart.js visualizations
✅ Mobile Ready: Responsive design
✅ Error Handling: Robust fallbacks
✅ Deployment: Vercel ready

Ready for business decisions! 🛢️📊

Last Updated: August 18, 2025 - Clean Frontend Separation Complete
