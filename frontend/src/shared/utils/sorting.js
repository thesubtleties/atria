/**
 * Utility functions for sorting user data
 */

/**
 * Sorts by last name, then first name (natural alphabetical order)
 * @param {string} aLastName - First person's last name
 * @param {string} aFirstName - First person's first name  
 * @param {string} bLastName - Second person's last name
 * @param {string} bFirstName - Second person's first name
 * @returns {number} Sort comparison result (-1, 0, or 1)
 */
export const compareByLastName = (aLastName, aFirstName, bLastName, bFirstName) => {
  const aLast = (aLastName || '').toLowerCase().trim();
  const bLast = (bLastName || '').toLowerCase().trim();
  const aFirst = (aFirstName || '').toLowerCase().trim();
  const bFirst = (bFirstName || '').toLowerCase().trim();

  // First compare by last name
  if (aLast !== bLast) {
    return aLast.localeCompare(bLast);
  }
  
  // If last names are the same, compare by first name
  return aFirst.localeCompare(bFirst);
};

/**
 * Gets the sort value for name sorting - tries individual fields first, falls back to full_name
 * @param {Object} person - Person object with name fields
 * @returns {string} Sort key for comparison
 */
export const getNameSortValue = (person) => {
  // If we have individual first/last name fields, use them for proper sorting
  if (person.last_name && person.first_name) {
    const lastName = (person.last_name || '').toLowerCase().trim();
    const firstName = (person.first_name || '').toLowerCase().trim();
    // Create a sortable key: "lastname, firstname"
    return `${lastName}, ${firstName}`;
  }
  
  // Fallback to full_name if individual fields aren't available
  const fullName = (person.full_name || '').toLowerCase().trim();
  
  // Try to extract last name from full_name for better sorting
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1]; // Last word is likely the last name
    const firstName = nameParts.slice(0, -1).join(' '); // Everything else is first name
    return `${lastName}, ${firstName}`;
  }
  
  // If only one name part, just return it
  return fullName;
};

/**
 * Sorts an array of people by last name, then first name
 * @param {Array} people - Array of person objects
 * @param {string} sortOrder - 'asc' or 'desc' 
 * @returns {Array} Sorted array
 */
export const sortByLastName = (people, sortOrder = 'asc') => {
  return [...people].sort((a, b) => {
    const aValue = getNameSortValue(a);
    const bValue = getNameSortValue(b);
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};