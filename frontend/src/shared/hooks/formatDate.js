// src/hooks/useFormatDate.js
import { format, parseISO, isToday } from 'date-fns';

export const useFormatDate = (defaultFormat = 'M/d/yyyy') => {
  // Generic formatter with custom format
  const formatWithPattern = (dateString, pattern = defaultFormat) => {
    if (!dateString) return '';

    try {
      const date = parseISO(dateString);
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
      const date = parseISO(dateString);

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
