// Environment configuration for Chief Petroleum Dashboard
const ENV_CONFIG = {
  // API Base URL - defaults to Railway production, can be overridden
  API_BASE_URL: window.API_BASE_URL || 'https://api-server-final-production.up.railway.app',
  
  // Feature flags
  USE_DATABASE: true, // Always use Railway database
  
  // Cache settings
  CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  
  // Debug mode
  DEBUG: window.DEBUG || false
};

// Export for use in other files
window.ENV_CONFIG = ENV_CONFIG;

// Log configuration in debug mode
if (ENV_CONFIG.DEBUG) {
  console.log('🔧 Environment Configuration:', ENV_CONFIG);
}