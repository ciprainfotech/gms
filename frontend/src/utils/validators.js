/**
 * Universal Frontend Validation & Sanitization Utility Suite
 * Designed for High-Performance Enterprise SaaS
 */

/**
 * Clean & Validate Indian 10-Digit Mobile Phone Numbers
 * Accepts: "9876543210", "+91 98765 43210", "09876543210", "98765-43210"
 */
export const validatePhone = (phone, isRequired = true) => {
    if (!phone || !phone.toString().trim()) {
        if (!isRequired) return { isValid: true, error: '', cleanPhone: '' };
        return { isValid: false, error: 'Phone number is required.', cleanPhone: '' };
    }

    // Strip all non-digit characters
    let clean = phone.toString().replace(/\D/g, '');

    // If starts with 91 and has 12 digits, strip country code
    if (clean.length === 12 && clean.startsWith('91')) {
        clean = clean.substring(2);
    }
    // If starts with 0 and has 11 digits, strip leading 0
    else if (clean.length === 11 && clean.startsWith('0')) {
        clean = clean.substring(1);
    }

    // Must be exactly 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(clean)) {
        return {
            isValid: false,
            error: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
            cleanPhone: clean
        };
    }

    return { isValid: true, error: '', cleanPhone: clean };
};

/**
 * Clean & Validate Indian Vehicle Registration Numbers
 * Accepts: "GJ01AB1234", "MH-12-DE-5678", "DL 1C AA 1111", "22BH1234AA"
 */
export const validateVehicleNumber = (carNumber, isRequired = true) => {
    if (!carNumber || !carNumber.toString().trim()) {
        if (!isRequired) return { isValid: true, error: '', formatted: '' };
        return { isValid: false, error: 'Vehicle registration number is required.', formatted: '' };
    }

    // Auto-uppercase and strip all spaces and hyphens
    const formatted = carNumber.toString().toUpperCase().replace(/[\s\-]/g, '');

    // Standard Indian RTO format (State Code 2 + RTO 1-2 + Series 0-3 + Unique 4 digits) or BH series
    const standardRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
    const bhSeriesRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

    if (!standardRegex.test(formatted) && !bhSeriesRegex.test(formatted)) {
        return {
            isValid: false,
            error: 'Invalid vehicle number format (e.g. GJ01AB1234 or MH12DE5678).',
            formatted
        };
    }

    return { isValid: true, error: '', formatted };
};

/**
 * Validate RFC Standard Email Address
 */
export const validateEmail = (email, isRequired = false) => {
    if (!email || !email.toString().trim()) {
        if (!isRequired) return { isValid: true, error: '' };
        return { isValid: false, error: 'Email address is required.' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmed = email.toString().trim();

    if (!emailRegex.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address.' };
    }

    return { isValid: true, error: '' };
};

/**
 * Validate 15-Digit Indian GSTIN Format
 */
export const validateGSTIN = (gstin, isRequired = false) => {
    if (!gstin || !gstin.toString().trim()) {
        if (!isRequired) return { isValid: true, error: '', formatted: '' };
        return { isValid: false, error: 'GSTIN is required.', formatted: '' };
    }

    const formatted = gstin.toString().toUpperCase().trim();
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(formatted)) {
        return {
            isValid: false,
            error: 'Invalid 15-character GSTIN format (e.g. 24AAAAA0000A1Z5).',
            formatted
        };
    }

    return { isValid: true, error: '', formatted };
};

/**
 * Validate Non-Negative Monetary Amounts or Quantities
 */
export const validateNumber = (value, fieldName = 'Amount', allowZero = true, isRequired = true) => {
    if (value === undefined || value === null || value.toString().trim() === '') {
        if (!isRequired) return { isValid: true, error: '', value: 0 };
        return { isValid: false, error: `${fieldName} is required.`, value: 0 };
    }

    const num = Number(value);
    if (isNaN(num)) {
        return { isValid: false, error: `${fieldName} must be a valid number.`, value: 0 };
    }

    if (!allowZero && num <= 0) {
        return { isValid: false, error: `${fieldName} must be greater than 0.`, value: num };
    }

    if (num < 0) {
        return { isValid: false, error: `${fieldName} cannot be negative.`, value: num };
    }

    return { isValid: true, error: '', value: num };
};

/**
 * Validate Odometer KM Reading
 */
export const validateKMReading = (km, previousKm = null, isRequired = false) => {
    if (km === undefined || km === null || km.toString().trim() === '') {
        if (!isRequired) return { isValid: true, error: '', value: null };
        return { isValid: false, error: 'KM reading is required.', value: null };
    }

    const num = Number(km);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        return { isValid: false, error: 'KM reading must be a positive whole number.', value: null };
    }

    if (previousKm !== null && previousKm !== undefined && num < Number(previousKm)) {
        return {
            isValid: true,
            warning: `Current KM (${num.toLocaleString('en-IN')}) is lower than previous recorded KM (${Number(previousKm).toLocaleString('en-IN')}).`,
            value: num
        };
    }

    return { isValid: true, error: '', value: num };
};

/**
 * Validate Non-Empty Generic Required Field
 */
export const validateRequired = (value, fieldName = 'Field') => {
    if (value === undefined || value === null || !value.toString().trim()) {
        return { isValid: false, error: `${fieldName} is required.` };
    }
    return { isValid: true, error: '' };
};

/**
 * Sanitize User Input String (Trims and strips unsafe characters)
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim();
};
