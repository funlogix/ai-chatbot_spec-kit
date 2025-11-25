// backend/src/models/RateLimitLog.js
class RateLimitLog {
  constructor({
    id,
    providerId,
    userId,
    endpoint,
    timestamp,
    limit,
    remaining,
    resetTime
  }) {
    this.id = id;
    this.providerId = providerId;
    this.userId = userId;
    this.endpoint = endpoint;
    this.timestamp = timestamp || new Date().toISOString();
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }

  static validate(data) {
    const required = ['providerId', 'userId', 'endpoint', 'limit', 'remaining'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (typeof data.providerId !== 'string' || data.providerId.trim().length === 0) {
      throw new Error('providerId must be a non-empty string');
    }
    
    if (typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new Error('userId must be a non-empty string');
    }
    
    if (typeof data.endpoint !== 'string' || data.endpoint.trim().length === 0) {
      throw new Error('endpoint must be a non-empty string');
    }
    
    if (typeof data.limit !== 'number' || data.limit < 0) {
      throw new Error('limit must be a non-negative number');
    }
    
    if (typeof data.remaining !== 'number' || data.remaining < 0) {
      throw new Error('remaining must be a non-negative number');
    }

    return true;
  }
}

module.exports = RateLimitLog;