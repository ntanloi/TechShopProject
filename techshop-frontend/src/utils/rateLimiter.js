/**
 * Client-side Rate Limiter
 * Implements Fault Tolerance requirement: Rate Limiter client (API call 1 service)
 * 
 * Limits: 50 requests per minute per endpoint
 */

class RateLimiter {
  constructor(maxRequests = 50, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // endpoint -> array of timestamps
  }

  /**
   * Check if request is allowed
   * @param {string} endpoint - API endpoint
   * @returns {boolean} - true if allowed, false if rate limited
   */
  isAllowed(endpoint) {
    const now = Date.now();
    const key = this.getKey(endpoint);

    // Get existing requests for this endpoint
    let timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter((timestamp) => now - timestamp < this.windowMs);

    // Check if limit exceeded
    if (timestamps.length >= this.maxRequests) {
      console.warn(
        `[Rate Limiter] Request blocked for ${endpoint}. Limit: ${this.maxRequests} requests per ${this.windowMs / 1000}s`
      );
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return true;
  }

  /**
   * Get remaining requests for an endpoint
   * @param {string} endpoint - API endpoint
   * @returns {number} - remaining requests
   */
  getRemaining(endpoint) {
    const now = Date.now();
    const key = this.getKey(endpoint);
    const timestamps = this.requests.get(key) || [];

    // Count valid timestamps
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Get time until rate limit resets
   * @param {string} endpoint - API endpoint
   * @returns {number} - milliseconds until reset
   */
  getResetTime(endpoint) {
    const now = Date.now();
    const key = this.getKey(endpoint);
    const timestamps = this.requests.get(key) || [];

    if (timestamps.length === 0) {
      return 0;
    }

    const oldestTimestamp = Math.min(...timestamps);
    const resetTime = oldestTimestamp + this.windowMs - now;

    return Math.max(0, resetTime);
  }

  /**
   * Clear rate limit for an endpoint
   * @param {string} endpoint - API endpoint
   */
  clear(endpoint) {
    const key = this.getKey(endpoint);
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.requests.clear();
  }

  /**
   * Get normalized key for endpoint
   * @param {string} endpoint - API endpoint
   * @returns {string} - normalized key
   */
  getKey(endpoint) {
    // Remove query parameters and normalize
    return endpoint.split("?")[0].toLowerCase();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

export default rateLimiter;
