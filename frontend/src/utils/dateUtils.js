/**
 * Shared date utilities for Cipra GMS frontend.
 *
 * Why this file exists:
 * - JavaScript's new Date('2026-08-15') parses YYYY-MM-DD strings as UTC midnight.
 * - In IST (UTC+5:30) this can display as the previous day in some environments.
 * - Always parse YYYY-MM-DD by appending 'T00:00:00' (local time) to anchor the date.
 */

/**
 * Safely parse any date string into a local-timezone Date object.
 * @param {string|Date|null} value
 * @returns {Date|null}
 */
export const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const str = String(value).trim();
    // Plain YYYY-MM-DD: append local midnight to avoid UTC timezone shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const d = new Date(str + 'T00:00:00');
        return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Format a date value as dd/mm/yyyy (Indian standard format).
 * Returns 'N/A' for null/undefined/invalid dates.
 * @param {string|Date|null} value
 * @returns {string}
 */
export const formatDate = (value) => {
    const d = parseDate(value);
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Format a date as dd Mon yyyy (e.g. "15 Aug 2026")
 * @param {string|Date|null} value
 * @returns {string}
 */
export const formatDateShort = (value) => {
    const d = parseDate(value);
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Format a full ISO datetime as dd/mm/yyyy hh:mm AM/PM
 * @param {string|Date|null} value
 * @returns {string}
 */
export const formatDateTime = (value) => {
    const d = parseDate(value);
    if (!d) return 'N/A';
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return datePart + ' ' + timePart;
};

/**
 * Returns today's date as YYYY-MM-DD in LOCAL timezone (not UTC).
 * Use instead of new Date().toISOString().split('T')[0] which gives UTC date.
 * @returns {string}
 */
export const getTodayString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
};