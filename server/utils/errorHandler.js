/**
 * Centralized error handling utilities for server
 */

/**
 * Log error with context
 * @param {string} context - Context where error occurred
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional metadata
 */
export const logError = (context, error, metadata = {}) => {
  console.error(`[${context}]`, {
    message: error.message,
    stack: error.stack,
    ...metadata,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} context - Context for logging
 * @param {Error} error - Original error object
 */
export const sendError = (res, status, message, context, error = null) => {
  if (error) {
    logError(context, error);
  }
  
  res.status(status).json({ error: message });
};

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped handler with error catching
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  logError('GlobalErrorHandler', err, {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
  });
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({ error: message });
};
