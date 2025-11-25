/**
 * Cache Manager Utility
 * Implements caching mechanisms to optimize performance
 */
class CacheManager {
  constructor() {
    this.cache = new Map(); // Main cache storage
    this.timers = new Map(); // Timer references for cache expiration
    this.maxCacheSize = 1000; // Maximum number of items in cache
    this.defaultTTL = 300000; // Default time-to-live: 5 minutes (in ms)
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time-to-live in milliseconds (optional, defaults to defaultTTL)
   * @returns {void}
   */
  set(key, value, ttl = this.defaultTTL) {
    if (!key) {
      throw new Error('Cache key is required');
    }

    // If cache is at max size, remove oldest entries (FIFO)
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set up expiration timer
    this._setupExpiration(key, ttl);
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    if (!key) {
      return null;
    }

    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from the cache
   * @param {string} key - Cache key to delete
   * @returns {boolean} True if key was deleted, false if not found
   */
  delete(key) {
    // Clear any existing timer for this key
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   * @returns {void}
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Clear the cache
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      max: this.maxCacheSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Set up expiration timer for a cache entry
   * @param {string} key - Cache key
   * @param {number} ttl - Time-to-live in milliseconds
   * @returns {void}
   */
  _setupExpiration(key, ttl) {
    // Clear any existing timer for this key
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set up new timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Cache the result of an async function
   * @param {string} key - Cache key
   * @param {Function} asyncFn - Async function to cache result of
   * @param {number} ttl - Time-to-live in milliseconds
   * @returns {*} Cached result or result from function call
   */
  async getOrSet(key, asyncFn, ttl = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await asyncFn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Preload frequently accessed data into cache
   * @param {Array} preloadTasks - Array of {key, loader, ttl} objects
   * @returns {Promise<void>}
   */
  async preload(preloadTasks) {
    const promises = preloadTasks.map(task => 
      this.getOrSet(task.key, task.loader, task.ttl)
    );
    
    await Promise.all(promises);
  }
}

// Export a singleton instance
const cacheManager = new CacheManager();
export default cacheManager;