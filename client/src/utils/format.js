/**
 * Formatting utilities
 */

import { DATE_FORMAT_OPTIONS } from './constants.js';

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options = DATE_FORMAT_OPTIONS[format] || DATE_FORMAT_OPTIONS.short;
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncate = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format credit amount with commas
 * @param {number} amount - Credit amount
 * @returns {string} - Formatted amount
 */
export const formatCredits = (amount) => {
  return amount.toLocaleString();
};
