/**
 * Performance Monitor Service
 * Tracks and monitors performance metrics for the application
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.observers = [];
    this.maxMetrics = 1000; // Keep only the last 1000 metrics
    this.reportingInterval = 30000; // Report every 30 seconds
    this.reportingTimer = null;
    
    // Track performance entry types we're interested in
    this.entryTypes = ['measure', 'navigation', 'paint', 'resource'];
    
    this.init();
  }

  init() {
    // Start periodic reporting
    this.startReporting();
    
    // Listen for performance entries if supported
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.startPerformanceObserver();
    }
  }

  /**
   * Start performance observer to capture performance entries
   * @returns {void}
   */
  startPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry(entry);
        }
      });

      // Observe all the entry types we're interested in
      observer.observe({ entryTypes: this.entryTypes });
    }
  }

  /**
   * Record a performance entry
   * @param {PerformanceEntry} entry - Performance entry to record
   * @returns {void}
   */
  recordPerformanceEntry(entry) {
    const metric = {
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
      size: entry.transferSize || entry.decodedBodySize || null
    };

    this.recordMetric('performance.entry', metric);
  }

  /**
   * Record a custom performance metric
   * @param {string} name - Metric name
   * @param {Object} data - Metric data
   * @returns {void}
   */
  recordMetric(name, data) {
    const metric = {
      name,
      data,
      timestamp: Date.now(),
      ...data // Allow override with properties in data
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify observers
    this.notifyObservers(metric);
  }

  /**
   * Measure the execution time of a function
   * @param {string} name - Name of the measurement
   * @param {Function} fn - Function to measure
   * @returns {*} Result of the function
   */
  async measure(name, fn) {
    const startMark = `start-${name}-${Date.now()}`;
    const endMark = `end-${name}-${Date.now()}`;
    
    performance.mark(startMark);
    
    try {
      const result = await fn();
      
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      
      // Get the measurement
      const measureEntry = performance.getEntriesByName(name).pop();
      if (measureEntry) {
        this.recordMetric('function.execution', {
          name,
          duration: measureEntry.duration,
          startMark,
          endMark
        });
      }
      
      return result;
    } catch (error) {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      
      // Record the error as a metric
      const measureEntry = performance.getEntriesByName(name).pop();
      this.recordMetric('function.error', {
        name,
        duration: measureEntry ? measureEntry.duration : 0,
        error: error.message,
        startMark,
        endMark
      });
      
      throw error;
    } finally {
      // Clear the marks to prevent memory leaks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    }
  }

  /**
   * Start tracking response time for an operation
   * @param {string} operation - Operation name
   * @returns {Function} Function to call when operation completes
   */
  startResponseTimeTracking(operation) {
    const startTime = Date.now();
    const trackingId = `${operation}-${startTime}`;
    
    return (success = true, additionalData = {}) => {
      const duration = Date.now() - startTime;
      
      this.recordMetric('response.time', {
        operation,
        trackingId,
        duration,
        success,
        ...additionalData
      });
      
      return duration;
    };
  }

  /**
   * Add an observer to receive notifications about metrics
   * @param {Function} observer - Function to call when a metric is recorded
   * @returns {void}
   */
  addObserver(observer) {
    this.observers.push(observer);
  }

  /**
   * Remove an observer
   * @param {Function} observer - Observer to remove
   * @returns {boolean} True if observer was removed
   */
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Notify all observers about a new metric
   * @param {Object} metric - The metric that was recorded
   * @returns {void}
   */
  notifyObservers(metric) {
    for (const observer of this.observers) {
      try {
        observer(metric);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    }
  }

  /**
   * Start periodic reporting of performance metrics
   * @returns {void}
   */
  startReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    this.reportingTimer = setInterval(() => {
      this.reportMetrics();
    }, this.reportingInterval);
  }

  /**
   * Stop periodic reporting
   * @returns {void}
   */
  stopReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }
  }

  /**
   * Report metrics to the console or a remote service
   * @returns {void}
   */
  reportMetrics() {
    if (this.metrics.length === 0) {
      return;
    }

    // Calculate aggregate metrics
    const summary = this.getAggregateMetrics();
    
    console.group('Performance Report');
    console.log('Summary:', summary);
    console.log('Recent Metrics:', this.metrics.slice(-10)); // Last 10 metrics
    console.groupEnd();
    
    // In a real application, this would send to a remote metrics service
    this.sendMetricsToRemote(summary);
  }

  /**
   * Send metrics to a remote service
   * @param {Object} summary - Aggregate metrics summary
   * @returns {void}
   */
  async sendMetricsToRemote(summary) {
    // In a real implementation, this would send metrics to a remote service
    // For this implementation, we'll just store in localStorage
    try {
      localStorage.setItem('performanceSummary', JSON.stringify({
        ...summary,
        reportedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Could not store performance summary:', error);
    }
  }

  /**
   * Get aggregate performance metrics
   * @returns {Object} Aggregate metrics
   */
  getAggregateMetrics() {
    if (this.metrics.length === 0) {
      return {};
    }

    // Group metrics by name
    const grouped = {};
    for (const metric of this.metrics) {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }
      grouped[metric.name].push(metric);
    }

    const result = {};
    for (const [name, metrics] of Object.entries(grouped)) {
      // Calculate statistics for numeric values
      const durations = metrics
        .map(m => m.data?.duration || m.duration)
        .filter(d => d !== undefined && d !== null && !isNaN(d));

      if (durations.length > 0) {
        const sortedDurations = durations.sort((a, b) => a - b);
        const count = durations.length;

        result[name] = {
          count,
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg: durations.reduce((sum, d) => sum + d, 0) / count,
          median: sortedDurations[Math.floor(count / 2)],
          p95: sortedDurations[Math.floor(count * 0.95)] || sortedDurations[sortedDurations.length - 1],
          p99: sortedDurations[Math.floor(count * 0.99)] || sortedDurations[sortedDurations.length - 1]
        };
      } else {
        // For non-duration metrics, just count them
        result[name] = {
          count: metrics.length
        };
      }
    }

    return result;
  }

  /**
   * Get the application's performance score
   * @returns {Object} Performance score with details
   */
  getPerformanceScore() {
    const summary = this.getAggregateMetrics();
    
    // Calculate a simple performance score based on response times
    let score = 100;
    let details = [];
    
    // Check API response times
    if (summary['response.time']) {
      const avgResponseTime = summary['response.time'].avg;
      
      if (avgResponseTime > 2000) {
        score -= 30;
        details.push(`Slow average response time: ${avgResponseTime.toFixed(2)}ms`);
      } else if (avgResponseTime > 1000) {
        score -= 15;
        details.push(`Average response time could be improved: ${avgResponseTime.toFixed(2)}ms`);
      } else {
        details.push(`Good average response time: ${avgResponseTime.toFixed(2)}ms`);
      }
    }
    
    // Check function execution times
    if (summary['function.execution']) {
      const avgExecutionTime = summary['function.execution'].avg;
      
      if (avgExecutionTime > 500) {
        score -= 20;
        details.push(`Slow function execution: ${avgExecutionTime.toFixed(2)}ms`);
      }
    }
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      details,
      summary
    };
  }

  /**
   * Clear all stored metrics
   * @returns {void}
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get metrics for a specific time range
   * @param {number} startTime - Start time in milliseconds
   * @param {number} endTime - End time in milliseconds
   * @returns {Array} Metrics in the specified time range
   */
  getMetricsByTime(startTime, endTime) {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Destroy the performance monitor and clean up resources
   * @returns {void}
   */
  destroy() {
    this.stopReporting();
    this.clearMetrics();
    this.observers = [];
  }
}

// Export a singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;