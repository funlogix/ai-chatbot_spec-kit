/**
 * Logging Service
 * Implements comprehensive logging and metrics collection for observability
 */
class LoggingService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep only the last 1000 logs
    this.logLevel = 'info'; // debug, info, warn, error
    this.logLevels = {
      'debug': 0,
      'info': 1,
      'warn': 2,
      'error': 3
    };
    this.metrics = new Map(); // Store application metrics
    
    // Initialize with basic metrics
    this.initMetrics();
  }

  /**
   * Initialize metrics tracking
   * @returns {void}
   */
  initMetrics() {
    this.metrics.set('api_calls', { count: 0, errors: 0, success: 0 });
    this.metrics.set('provider_switches', { count: 0 });
    this.metrics.set('user_sessions', { count: 0, active: 0 });
  }

  /**
   * Log a message at the specified level
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  log(level, message, meta = {}) {
    // Check if the log level is enabled
    if (this.logLevels[level] < this.logLevels[this.logLevel]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: {
        ...meta,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId()
      }
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console based on level
    switch (level) {
      case 'error':
        console.error(`[${level.toUpperCase()}] ${message}`, logEntry.meta);
        break;
      case 'warn':
        console.warn(`[${level.toUpperCase()}] ${message}`, logEntry.meta);
        break;
      case 'debug':
        console.debug(`[${level.toUpperCase()}] ${message}`, logEntry.meta);
        break;
      default:
        console.log(`[${level.toUpperCase()}] ${message}`, logEntry.meta);
    }

    // Store in localStorage for persistence
    this.saveToStorage();
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log an API call
   * @param {string} endpoint - API endpoint
   * @param {number} responseTime - Response time in ms
   * @param {boolean} success - Whether the call was successful
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  logApiCall(endpoint, responseTime, success, meta = {}) {
    // Update metrics
    const apiMetrics = this.metrics.get('api_calls') || { count: 0, errors: 0, success: 0 };
    apiMetrics.count += 1;
    if (success) {
      apiMetrics.success += 1;
    } else {
      apiMetrics.errors += 1;
    }
    this.metrics.set('api_calls', apiMetrics);

    const message = success 
      ? `API call to ${endpoint} succeeded in ${responseTime}ms`
      : `API call to ${endpoint} failed after ${responseTime}ms`;
      
    this.info(message, {
      ...meta,
      endpoint,
      responseTime,
      success
    });
  }

  /**
   * Log a provider switch event
   * @param {string} providerId - ID of the provider being switched to
   * @param {string} modelId - ID of the model being used
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  logProviderSwitch(providerId, modelId, meta = {}) {
    // Update metrics
    const providerMetrics = this.metrics.get('provider_switches') || { count: 0 };
    providerMetrics.count += 1;
    this.metrics.set('provider_switches', providerMetrics);

    this.info(`Switched to provider: ${providerId}, model: ${modelId}`, {
      ...meta,
      providerId,
      modelId
    });
  }

  /**
   * Log a user action
   * @param {string} action - User action
   * @param {Object} meta - Additional metadata
   * @returns {void}
   */
  logUserAction(action, meta = {}) {
    this.info(`User action: ${action}`, meta);
  }

  /**
   * Get logs by level
   * @param {string} level - Log level to filter by
   * @returns {Array} Filtered logs
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Array} Logs in the specified time range
   */
  getLogsByTime(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Get all logs
   * @returns {Array} All logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear all logs
   * @returns {void}
   */
  clearLogs() {
    this.logs = [];
    this.saveToStorage();
  }

  /**
   * Get application metrics
   * @returns {Object} Application metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics) {
      metrics[key] = { ...value };
    }
    
    // Add calculated metrics
    const apiCalls = this.metrics.get('api_calls');
    if (apiCalls && apiCalls.count > 0) {
      metrics.api_calls.errorRate = (apiCalls.errors / apiCalls.count) * 100;
      metrics.api_calls.successRate = (apiCalls.success / apiCalls.count) * 100;
    }
    
    return metrics;
  }

  /**
   * Get formatted metrics for observability
   * @returns {Object} Formatted metrics
   */
  getFormattedMetrics() {
    const metrics = this.getMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      metrics: metrics,
      counts: {
        logs: this.logs.length
      },
      system: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled
      }
    };
  }

  /**
   * Save logs and metrics to localStorage
   * @returns {void}
   */
  saveToStorage() {
    try {
      // Save logs and metrics to localStorage
      localStorage.setItem('appLogs', JSON.stringify(this.logs));
      localStorage.setItem('appMetrics', JSON.stringify(this.getMetrics()));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs and metrics from localStorage
   * @returns {void}
   */
  loadFromStorage() {
    try {
      const storedLogs = localStorage.getItem('appLogs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
      
      const storedMetrics = localStorage.getItem('appMetrics');
      if (storedMetrics) {
        const metrics = JSON.parse(storedMetrics);
        this.metrics.clear();
        for (const [key, value] of Object.entries(metrics)) {
          this.metrics.set(key, value);
        }
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  /**
   * Get a unique session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    if (!localStorage.getItem('sessionId')) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return localStorage.getItem('sessionId');
  }

  /**
   * Track a custom metric
   * @param {string} name - Metric name
   * @param {number|Object} value - Metric value
   * @returns {void}
   */
  trackMetric(name, value) {
    if (typeof value === 'number') {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, { count: 0, sum: 0, min: Infinity, max: -Infinity });
      }
      
      const metric = this.metrics.get(name);
      metric.count += 1;
      metric.sum += value;
      metric.min = Math.min(metric.min, value);
      metric.max = Math.max(metric.max, value);
    } else {
      // For object values, just store the object
      this.metrics.set(name, value);
    }
    
    // Trigger save to storage
    this.saveToStorage();
  }

  /**
   * Report metrics to a remote service
   * @param {Object} metrics - Metrics to report
   * @returns {Promise<void>}
   */
  async reportMetrics(metrics) {
    // In a real application, this would send metrics to a remote service
    // For this implementation, we'll log them
    
    const logData = {
      type: 'metrics_report',
      metrics,
      timestamp: new Date().toISOString()
    };
    
    this.info('Reporting metrics', logData);
    
    // In a real implementation, you would send this to a metrics service
    // Example:
    /*
    try {
      await fetch('/api/metrics/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
    */
  }

  /**
   * Generate a performance report
   * @returns {Object} Performance report
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    
    // Calculate additional derived metrics
    const apiCalls = metrics.api_calls || { count: 0, errors: 0, success: 0 };
    const providerSwitches = metrics.provider_switches || { count: 0 };
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalApiCalls: apiCalls.count,
        successfulApiCalls: apiCalls.success,
        failedApiCalls: apiCalls.errors,
        successRate: apiCalls.count > 0 ? (apiCalls.success / apiCalls.count) * 100 : 0,
        errorRate: apiCalls.count > 0 ? (apiCalls.errors / apiCalls.count) * 100 : 0,
        providerSwitches: providerSwitches.count,
        totalLogs: this.logs.length
      },
      details: metrics,
      recommendations: this.generateRecommendations(metrics)
    };
  }

  /**
   * Generate recommendations based on metrics
   * @param {Object} metrics - Application metrics
   * @returns {Array} List of recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    const apiCalls = metrics.api_calls || { count: 0, errors: 0 };
    
    if (apiCalls.count > 0 && (apiCalls.errors / apiCalls.count) > 0.05) { // 5% error rate
      recommendations.push('High API error rate detected. Consider reviewing provider configurations and error handling.');
    }
    
    if (this.logs.some(log => log.level === 'error')) {
      recommendations.push('Errors detected in logs. Review error logs for potential issues.');
    }
    
    return recommendations;
  }
}

// Export a singleton instance
const loggingService = new LoggingService();
loggingService.loadFromStorage(); // Load any previously stored logs
export default loggingService;