/**
 * Utility functions for sorting user data
 */

export const compareByLastName = (
  aLastName: string,
  aFirstName: string,
  bLastName: string,
  bFirstName: string,
): number => {
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

type Person = {
  last_name?: string;
  first_name?: string;
  full_name?: string;
};

export const getNameSortValue = (person: Person): string => {
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
  const nameParts = fullName.split(' ').filter((part) => part.length > 0);
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1]; // Last word is likely the last name
    const firstName = nameParts.slice(0, -1).join(' '); // Everything else is first name
    return `${lastName}, ${firstName}`;
  }

  // If only one name part, just return it
  return fullName;
};

export const sortByLastName = <T extends Person>(
  people: T[],
  sortOrder: 'asc' | 'desc' = 'asc',
): T[] => {
  return [...people].sort((a, b) => {
    const aValue = getNameSortValue(a);
    const bValue = getNameSortValue(b);

    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};
