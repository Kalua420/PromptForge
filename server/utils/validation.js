/**
 * Server-side validation utilities
 */

/**
 * Validate conversation title
 * @param {string} title - Title to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateTitle = (title) => {
  if (!title) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Title must be 100 characters or less' };
  }
  
  return { valid: true, title: trimmed };
};

/**
 * Sanitize HTML from user input
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeHtml = (text) => {
  if (!text) return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate prompt content
 * @param {string} content - Content to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validatePromptContent = (content) => {
  if (!content) {
    return { valid: false, error: 'Content is required' };
  }
  
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  if (trimmed.length > 50000) {
    return { valid: false, error: 'Content must be 50,000 characters or less' };
  }
  
  return { valid: true, content: trimmed };
};
