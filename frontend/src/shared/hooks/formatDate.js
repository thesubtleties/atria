// src/hooks/useFormatDate.js
import { format, parseISO } from 'date-fns';

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

  return {
    formatDate,
    formatDateTime,
    formatMonthYear,
    formatWithPattern,
    formatDateForInput,
  };
};
