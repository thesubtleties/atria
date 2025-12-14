/**
 * Shared formatting utilities for consistent data presentation
 */

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours || '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour =
    hour === 0 ? 12
    : hour > 12 ? hour - 12
    : hour;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
};

export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface TruncateOptions {
  maxLength?: number;
  suffix?: string;
  fallback?: string;
  wordBoundary?: boolean;
}

export const truncateText = (text: string, options: TruncateOptions = {}): string => {
  const { maxLength = 80, suffix = '...', fallback = '', wordBoundary = false } = options;

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

export const truncateBio = (text: string): string =>
  truncateText(text, {
    maxLength: 80,
    fallback: 'No bio provided',
    wordBoundary: true,
  });

export const truncateDescription = (text: string): string =>
  truncateText(text, {
    maxLength: 150,
    wordBoundary: true,
  });

export const truncateTitle = (text: string): string =>
  truncateText(text, {
    maxLength: 50,
  });
