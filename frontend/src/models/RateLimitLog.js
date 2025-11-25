/**
 * RateLimitLog Model
 * Logs rate limit usage for tracking and monitoring
 */
class RateLimitLog {
  constructor(data = {}) {
    this.logId = data.logId || this.generateId();
    this.providerId = data.providerId || '';
    this.requestCount = data.requestCount !== undefined ? data.requestCount : 1;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.remainingQuota = data.remainingQuota !== undefined ? data.remainingQuota : null;
    this.windowStart = data.windowStart || new Date().toISOString();
    this.windowEnd = data.windowEnd || this.calculateWindowEnd();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate a unique ID for the log entry
   * @returns {string} A unique identifier
   */
  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate the end of the rate limit window (default is 1 minute from now)
   * @returns {string} ISO string for the window end time
   */
  calculateWindowEnd() {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 1); // Default to 1-minute window
    return endTime.toISOString();
  }

  /**
   * Validate the rate limit log instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.logId || typeof this.logId !== 'string' || this.logId.trim() === '') {
      errors.push('logId is required and must be a non-empty string');
    }

    if (!this.providerId || typeof this.providerId !== 'string' || this.providerId.trim() === '') {
      errors.push('providerId is required and must be a non-empty string');
    }

    if (typeof this.requestCount !== 'number' || this.requestCount < 0) {
      errors.push('requestCount must be a non-negative number');
    }

    if (this.timestamp) {
      const date = new Date(this.timestamp);
      if (isNaN(date.getTime())) {
        errors.push('timestamp must be a valid date string');
      }
    }

    if (this.remainingQuota !== null && typeof this.remainingQuota !== 'number') {
      errors.push('remainingQuota must be a number or null');
    } else if (this.remainingQuota !== null && this.remainingQuota < 0) {
      errors.push('remainingQuota must be a non-negative number or null');
    }

    if (this.windowStart) {
      const date = new Date(this.windowStart);
      if (isNaN(date.getTime())) {
        errors.push('windowStart must be a valid date string');
      }
    }

    if (this.windowEnd) {
      const date = new Date(this.windowEnd);
      if (isNaN(date.getTime())) {
        errors.push('windowEnd must be a valid date string');
      }
    }

    if (this.createdAt) {
      const date = new Date(this.createdAt);
      if (isNaN(date.getTime())) {
        errors.push('createdAt must be a valid date string');
      }
    }

    if (this.updatedAt) {
      const date = new Date(this.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push('updatedAt must be a valid date string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Increment the request count
   * @param {number} increment - Number to increment by (default: 1)
   * @returns {void}
   */
  incrementRequestCount(increment = 1) {
    if (typeof increment !== 'number' || increment < 0) {
      throw new Error('Increment must be a non-negative number');
    }
    this.requestCount += increment;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update the remaining quota
   * @param {number} remaining - New remaining quota value
   * @returns {void}
   */
  updateRemainingQuota(remaining) {
    if (typeof remaining !== 'number' || remaining < 0) {
      throw new Error('Remaining quota must be a non-negative number');
    }
    this.remainingQuota = remaining;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if the log entry is within the current window
   * @returns {boolean} True if the log entry is within the window
   */
  isWithinWindow() {
    const now = new Date();
    const windowEnd = new Date(this.windowEnd);
    return now <= windowEnd;
  }

  /**
   * Get rate limit log as a plain object
   * @returns {Object} Plain rate limit log object
   */
  toObject() {
    return {
      logId: this.logId,
      providerId: this.providerId,
      requestCount: this.requestCount,
      timestamp: this.timestamp,
      remainingQuota: this.remainingQuota,
      windowStart: this.windowStart,
      windowEnd: this.windowEnd,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a RateLimitLog instance from a plain object
   * @param {Object} data - Plain object with rate limit log data
   * @returns {RateLimitLog} RateLimitLog instance
   */
  static fromObject(data) {
    return new RateLimitLog(data);
  }

  /**
   * Create a new log entry for a rate limit event
   * @param {string} providerId - ID of the provider
   * @param {number} requestCount - Number of requests being logged
   * @param {number} remainingQuota - Remaining quota after this request
   * @returns {RateLimitLog} New RateLimitLog instance
   */
  static createForProvider(providerId, requestCount = 1, remainingQuota = null) {
    return new RateLimitLog({
      providerId,
      requestCount,
      remainingQuota
    });
  }
}

export default RateLimitLog;