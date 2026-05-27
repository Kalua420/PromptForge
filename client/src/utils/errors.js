/**
 * Centralized error handling utilities
 */

/**
 * Extract error message from API error response
 * @param {Error} error - The error object from API call
 * @param {string} fallback - Fallback message if no error message found
 * @returns {string} - The error message
 */
export const getApiError = (error, fallback = 'An error occurred') => {
  return error?.response?.data?.error || fallback;
};

/**
 * Log error to console with context
 * @param {string} context - Context where error occurred
 * @param {Error} error - The error object
 */
export const logError = (context, error) => {
  console.error(`[${context}]`, error);
};
