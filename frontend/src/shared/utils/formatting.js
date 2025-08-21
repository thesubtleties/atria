/**
 * Shared formatting utilities for consistent data presentation
 */

/**
 * Converts 24-hour time string to 12-hour format with AM/PM
 * @param {string} timeStr - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Capitalizes snake_case or underscore-separated words
 * @param {string} str - String to capitalize (e.g., "PANEL_DISCUSSION")
 * @returns {string} Formatted string (e.g., "Panel Discussion")
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Truncates text with customizable options
 * @param {string} text - Text to truncate
 * @param {Object} options - Truncation options
 * @param {number} options.maxLength - Maximum character length (default: 80)
 * @param {string} options.suffix - Suffix to add when truncated (default: '...')
 * @param {string} options.fallback - Fallback text when input is empty
 * @param {boolean} options.wordBoundary - Truncate at word boundary (default: false)
 * @returns {string} Truncated text
 */
export const truncateText = (text, options = {}) => {
  const {
    maxLength = 80,
    suffix = '...',
    fallback = '',
    wordBoundary = false
  } = options;
  
  if (!text) return fallback;
  if (text.length <= maxLength) return text;
  
  let truncated = text.substring(0, maxLength);
  
  // If wordBoundary is true, cut at the last complete word
  if (wordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
  }
  
  return truncated + suffix;
};

/**
 * Convenience preset for truncating bio text
 * @param {string} text - Bio text to truncate
 * @returns {string} Truncated bio with fallback
 */
export const truncateBio = (text) => truncateText(text, { 
  maxLength: 80, 
  fallback: 'No bio provided',
  wordBoundary: true 
});

/**
 * Convenience preset for truncating descriptions
 * @param {string} text - Description text to truncate
 * @returns {string} Truncated description
 */
export const truncateDescription = (text) => truncateText(text, { 
  maxLength: 150,
  wordBoundary: true 
});

/**
 * Convenience preset for truncating titles
 * @param {string} text - Title text to truncate
 * @returns {string} Truncated title
 */
export const truncateTitle = (text) => truncateText(text, { 
  maxLength: 50 
});