/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates German postal code (5 digits)
 */
export function validatePLZ(plz: string): ValidationResult {
  const cleaned = plz.trim();
  if (!cleaned) {
    return { valid: false, error: "PLZ ist erforderlich" };
  }
  if (!/^\d{5}$/.test(cleaned)) {
    return { valid: false, error: "PLZ muss 5 Ziffern enthalten" };
  }
  return { valid: true };
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
  const cleaned = email.trim();
  if (!cleaned) {
    return { valid: false, error: "E-Mail ist erforderlich" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return { valid: false, error: "Ungültige E-Mail-Adresse" };
  }
  return { valid: true };
}

/**
 * Validates German phone number (various formats)
 */
export function validatePhone(phone: string): ValidationResult {
  const cleaned = phone.trim().replace(/[\s\-\/()]/g, "");
  if (!cleaned) {
    return { valid: false, error: "Telefonnummer ist erforderlich" };
  }
  // Allow German formats: +49, 0049, 0...
  if (!/^(\+49|0049|0)\d{8,13}$/.test(cleaned)) {
    return { valid: false, error: "Ungültige Telefonnummer" };
  }
  return { valid: true };
}

/**
 * Validates IBAN (simplified for German IBANs)
 */
export function validateIBAN(iban: string): ValidationResult {
  const cleaned = iban.trim().replace(/\s/g, "");
  if (!cleaned) {
    return { valid: false, error: "IBAN ist erforderlich" };
  }
  // German IBAN: DE followed by 2 check digits and 18 digits
  if (!/^DE\d{20}$/.test(cleaned)) {
    return { valid: false, error: "Ungültige IBAN (Format: DE + 20 Ziffern)" };
  }
  return { valid: true };
}

/**
 * Validates BIC/SWIFT code
 */
export function validateBIC(bic: string): ValidationResult {
  const cleaned = bic.trim().replace(/\s/g, "");
  if (!cleaned) {
    return { valid: false, error: "BIC ist erforderlich" };
  }
  // BIC: 8 or 11 alphanumeric characters
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
    return { valid: false, error: "Ungültige BIC (8 oder 11 Zeichen)" };
  }
  return { valid: true };
}

/**
 * Validates required text field
 */
export function validateRequired(
  value: string,
  fieldName: string
): ValidationResult {
  const cleaned = value.trim();
  if (!cleaned) {
    return { valid: false, error: `${fieldName} ist erforderlich` };
  }
  return { valid: true };
}

/**
 * Validates number is positive
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string
): ValidationResult {
  if (isNaN(value) || value < 0) {
    return { valid: false, error: `${fieldName} muss eine positive Zahl sein` };
  }
  return { valid: true };
}

/**
 * Validates date is not in the future (for historical dates)
 */
export function validatePastDate(
  dateString: string,
  fieldName: string
): ValidationResult {
  if (!dateString) {
    return { valid: false, error: `${fieldName} ist erforderlich` };
  }
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return {
      valid: false,
      error: `${fieldName} darf nicht in der Zukunft liegen`,
    };
  }
  return { valid: true };
}

/**
 * Format IBAN with spaces for display
 */
export function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, "");
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\/()]/g, "");
  // Simple German format: 030 12345678
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    const areaCode = cleaned.substring(0, cleaned.length - 7);
    const rest = cleaned.substring(cleaned.length - 7);
    return `${areaCode} ${rest}`;
  }
  return phone;
}
