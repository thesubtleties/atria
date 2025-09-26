/**
 * Hook for consistent event status styling across the application
 * Returns color and style information based on event status
 */
export const useEventStatusStyle = () => {
  /**
   * Get the Mantine color for a given event status
   * @param {string} status - The event status (DRAFT, PUBLISHED, ARCHIVED, etc.)
   * @returns {string} The Mantine color name
   */
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'yellow';
      case 'PUBLISHED':
        return 'green';
      case 'ARCHIVED':
        return 'gray';
      case 'DELETED':
        return 'red';
      default:
        return 'gray';
    }
  };

  /**
   * Get a descriptive label for the status
   * @param {string} status - The event status
   * @returns {string} Human-readable label
   */
  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'Draft';
      case 'PUBLISHED':
        return 'Published';
      case 'ARCHIVED':
        return 'Archived';
      case 'DELETED':
        return 'Deleted';
      default:
        return status || 'Unknown';
    }
  };

  /**
   * Get badge/background styles for status display
   * @param {string} status - The event status
   * @returns {object} Style object with background and color
   */
  const getStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return {
          background: 'rgba(252, 211, 77, 0.1)', // Yellow tint
          borderColor: 'rgba(252, 211, 77, 0.3)',
          color: '#ca8a04', // Amber text
        };
      case 'PUBLISHED':
        return {
          background: 'rgba(34, 197, 94, 0.1)', // Green tint
          borderColor: 'rgba(34, 197, 94, 0.3)',
          color: '#15803d', // Green text
        };
      case 'ARCHIVED':
        return {
          background: 'rgba(107, 114, 128, 0.1)', // Gray tint
          borderColor: 'rgba(107, 114, 128, 0.3)',
          color: '#4b5563', // Gray text
        };
      case 'DELETED':
        return {
          background: 'rgba(239, 68, 68, 0.1)', // Red tint
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#dc2626', // Red text
        };
      default:
        return {
          background: 'rgba(107, 114, 128, 0.05)',
          borderColor: 'rgba(107, 114, 128, 0.2)',
          color: '#6b7280',
        };
    }
  };

  return {
    getStatusColor,
    getStatusLabel,
    getStatusStyles,
  };
};