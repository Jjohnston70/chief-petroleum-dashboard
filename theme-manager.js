/**
 * Chief Petroleum Theme Manager
 * Handles light/dark theme switching with proper font colors
 */

class ChiefThemeManager {
  constructor() {
    this.currentTheme = 'dark'; // Default to dark theme
    this.themeToggleBtn = null;
    this.themeIcon = null;
    this.body = null;

    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Get DOM elements
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.body = document.getElementById('app-body');

    // Load saved theme or detect system preference
    this.loadSavedTheme();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial theme
    this.applyTheme(this.currentTheme);

    console.log('🎨 Theme Manager initialized');
  }

  /**
   * Load saved theme from localStorage or detect system preference
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('chief-dashboard-theme');

    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Default to dark theme with black background and dark red headers
      this.currentTheme = 'dark';
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Theme toggle button
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('chief-dashboard-theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.currentTheme);
        }
      });
    }

    // Keyboard shortcut (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.saveTheme();

    // Notify other components
    this.notifyThemeChange();
  }

  /**
   * Apply the specified theme
   */
  applyTheme(theme) {
    if (!this.body) return;

    // Remove existing theme classes
    this.body.classList.remove('light-theme', 'dark-theme', 'chief-dark-theme');

    // Add new theme class
    if (theme === 'dark') {
      this.body.classList.add('chief-dark-theme');
    } else {
      this.body.classList.add('light-theme');
    }

    // Force styles for dark theme
    if (theme === 'dark') {
      this.body.style.backgroundColor = '#000000';
      this.body.style.color = '#ffffff';
    }

    // Update theme icon
    this.updateThemeIcon(theme);

    // Update logo for theme
    this.updateLogoForTheme(theme);

    // Update meta theme color for mobile browsers
    this.updateMetaThemeColor(theme);

    console.log(`🎨 Theme applied: ${theme}`);
  }

  /**
   * Update theme toggle icon
   */
  updateThemeIcon(theme) {
    if (!this.themeIcon) return;

    // Clear existing classes
    this.themeIcon.className = '';

    // Add appropriate icon
    if (theme === 'dark') {
      this.themeIcon.className = 'fas fa-sun';
      this.themeToggleBtn.title = 'Switch to Light Theme';
    } else {
      this.themeIcon.className = 'fas fa-moon';
      this.themeToggleBtn.title = 'Switch to Dark Theme';
    }
  }

  /**
   * Update logo visibility/style based on theme
   */
  updateLogoForTheme(theme) {
    const logo = document.getElementById('company-logo');
    if (!logo) return;

    // You can adjust logo opacity or switch to a different logo for dark theme
    if (theme === 'dark') {
      logo.style.filter = 'brightness(1.2) contrast(0.9)';
    } else {
      logo.style.filter = 'none';
    }
  }

  /**
   * Update meta theme color for mobile browsers
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    // Set theme color based on current theme
    if (theme === 'dark') {
      metaThemeColor.content = '#8B0000'; // Dark red for Chief Petroleum
    } else {
      metaThemeColor.content = '#0077cc'; // Chief primary color
    }
  }

  /**
   * Save current theme to localStorage
   */
  saveTheme() {
    localStorage.setItem('chief-dashboard-theme', this.currentTheme);
  }

  /**
   * Notify other components of theme change
   */
  notifyThemeChange() {
    // Prevent multiple simultaneous theme changes
    if (this.isNotifyingThemeChange) {
      console.log('🎨 Theme change notification already in progress, skipping...');
      return;
    }

    this.isNotifyingThemeChange = true;

    try {
      // Dispatch custom event
      const themeChangeEvent = new CustomEvent('themeChange', {
        detail: { theme: this.currentTheme, isDark: this.currentTheme === 'dark' }
      });
      document.dispatchEvent(themeChangeEvent);

      // Update charts if chart manager exists with a small delay
      if (window.chartManager) {
        setTimeout(() => {
          window.chartManager.updateTheme(this.currentTheme === 'dark');
        }, 50);
      }
    } catch (error) {
      console.error('❌ Error notifying theme change:', error);
    } finally {
      // Reset flag after a delay
      setTimeout(() => {
        this.isNotifyingThemeChange = false;
      }, 300);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme. Use "light" or "dark"');
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme();
    this.notifyThemeChange();
  }

  /**
   * Get theme-specific CSS custom properties
   */
  getThemeVariables() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    return {
      bgPrimary: computedStyle.getPropertyValue('--bg-primary').trim(),
      bgSecondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
      textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
      borderColor: computedStyle.getPropertyValue('--border-color').trim(),
      chiefPrimary: computedStyle.getPropertyValue('--chief-primary').trim(),
      chiefSecondary: computedStyle.getPropertyValue('--chief-secondary').trim(),
      chiefAccent: computedStyle.getPropertyValue('--chief-accent').trim()
    };
  }

  /**
   * Apply custom theme colors (for advanced customization)
   */
  applyCustomColors(colors) {
    const root = document.documentElement;

    Object.keys(colors).forEach(colorKey => {
      const cssProperty = `--${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssProperty, colors[colorKey]);
    });
  }

  /**
   * Reset to default theme colors
   */
  resetToDefaultColors() {
    const root = document.documentElement;

    // Remove any custom color overrides
    const customProperties = [
      '--chief-primary',
      '--chief-secondary',
      '--chief-accent',
      '--chief-gold'
    ];

    customProperties.forEach(property => {
      root.style.removeProperty(property);
    });
  }

  /**
   * Get system preference
   */
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Check if system preference is different from current theme
   */
  isSystemPreferenceDifferent() {
    return this.getSystemPreference() !== this.currentTheme;
  }

  /**
   * Sync with system preference
   */
  syncWithSystemPreference() {
    const systemPreference = this.getSystemPreference();
    this.setTheme(systemPreference);

    // Remove saved preference to allow auto-switching
    localStorage.removeItem('chief-dashboard-theme');
  }

  /**
   * Enable/disable theme transitions
   */
  enableTransitions(enable = true) {
    const root = document.documentElement;

    if (enable) {
      root.style.setProperty('--transition-duration', '0.3s');
    } else {
      root.style.setProperty('--transition-duration', '0s');
    }
  }

  /**
   * Animate theme transition
   */
  animateThemeTransition() {
    this.enableTransitions(false);

    // Brief delay to ensure no transitions during immediate changes
    setTimeout(() => {
      this.enableTransitions(true);
    }, 50);
  }

  /**
   * Add theme-aware event listener
   */
  onThemeChange(callback) {
    document.addEventListener('themeChange', callback);
  }

  /**
   * Remove theme-aware event listener
   */
  offThemeChange(callback) {
    document.removeEventListener('themeChange', callback);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ChiefThemeManager();
});

// Export for use in other modules
window.ChiefThemeManager = ChiefThemeManager;
