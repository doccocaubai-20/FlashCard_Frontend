/**
 * Cleans and truncates a dictionary definition for short-text displays (like cards, lists, tooltips).
 * Removes text inside parentheses, extracts the first two primary meanings, and truncates if necessary.
 * 
 * @param {string} text The raw dictionary definition.
 * @param {number} maxLength The maximum character length of the result.
 * @returns {string} The cleaned and shortened definition.
 */
export function cleanDefinition(text, maxLength = 50) {
  if (!text) return '';
  
  // Remove text inside parentheses (both normal and Chinese brackets)
  let cleaned = text
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/【[^】]*】/g, '');
  
  // Split by '/' or ';' to get alternative meanings
  const parts = cleaned.split(';').flatMap(p => p.split('/')).map(p => p.trim()).filter(Boolean);
  
  // Take the first 2 parts at most to keep it short
  let result = parts.slice(0, 2).join(' / ');
  
  // Clean up double spaces or trailing punctuation
  result = result.replace(/\s+/g, ' ').trim();
  
  // If result is empty after stripping (e.g. text was just "(động từ)"), fallback to splitting raw text
  if (!result) {
    const rawParts = text.split(';').flatMap(p => p.split('/')).map(p => p.trim()).filter(Boolean);
    result = rawParts.slice(0, 2).join(' / ');
  }
  
  // Truncate if still too long
  if (result.length > maxLength) {
    result = result.slice(0, maxLength).trim() + '...';
  }
  
  return result || text;
}
