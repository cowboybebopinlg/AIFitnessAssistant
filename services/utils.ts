/**
 * Converts a Date object to a string in 'YYYY-MM-DD' format.
 * @param {Date} date - The date to be formatted.
 * @returns {string} The formatted date string.
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
