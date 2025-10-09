// src/hooks/useFormatDate.js
import { format, parseISO, isToday } from 'date-fns';

/**
 * Parse a date-only string (YYYY-MM-DD) without timezone issues
 * Creates a Date object at midnight in the LOCAL timezone
 */
export const parseDateOnly = (dateString) => {
  if (!dateString) return null;

  // For date-only strings (no time component), parse manually to avoid timezone issues
  if (dateString.length === 10 && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date at midnight local time (not UTC)
    return new Date(year, month - 1, day);
  }

  // For datetime strings, use parseISO
  return parseISO(dateString);
};

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 * Avoids timezone shifts when converting to string for API submission
 */
export const formatDateOnly = (date) => {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const useFormatDate = (defaultFormat = 'M/d/yyyy') => {
  // Generic formatter with custom format
  const formatWithPattern = (dateString, pattern = defaultFormat) => {
    if (!dateString) return '';

    try {
      const date = parseDateOnly(dateString);
      return format(date, pattern);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Pre-configured formatters
  const formatDate = (dateString) => formatWithPattern(dateString, 'M/d/yyyy');
  const formatDateTime = (dateString) =>
    formatWithPattern(dateString, 'M/d/yyyy h:mm a');
  const formatMonthYear = (dateString) =>
    formatWithPattern(dateString, 'MMMM yyyy');
  // Specific format for input elements (YYYY-MM-DD)
  const formatDateForInput = (dateString) =>
    formatWithPattern(dateString, 'yyyy-MM-dd');

  // Format date with "Today" check
  const formatDateWithToday = (dateString, pattern = 'MMM d, yyyy') => {
    if (!dateString) return '';

    try {
      const date = parseDateOnly(dateString);

      if (isToday(date)) {
        return 'Today';
      }

      return format(date, pattern);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return {
    formatDate,
    formatDateTime,
    formatMonthYear,
    formatWithPattern,
    formatDateForInput,
    formatDateWithToday,
  };
};
