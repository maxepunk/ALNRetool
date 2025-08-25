/**
 * Standardized field validation utilities
 * 
 * Provides consistent validation patterns across all field editors
 * with reusable validation rules and error message formatting.
 * Central validation logic for the entire application.
 * 
 * @module utils/fieldValidation
 * 
 * **Architecture:**
 * - Functional validation rules
 * - Composable validators
 * - Standardized error messages
 * - Type-specific validation configs
 * 
 * **Features:**
 * - Common validation patterns (required, email, URL, etc.)
 * - Custom validation support
 * - Array validation helpers
 * - File validation utilities
 * - Error message formatting
 * 
 * **Usage:**
 * ```typescript
 * // Single field validation
 * const result = validationRules.email('test@example.com');
 * 
 * // Multiple rules
 * const errors = validateFields(formData, {
 *   email: fieldValidationConfigs.email,
 *   name: fieldValidationConfigs.text.name
 * });
 * ```
 */

/**
 * Validation rule interface.
 * @interface ValidationRule
 * 
 * @property {Function} test - Validation test function
 * @property {string|Function} message - Error message or message generator
 */
export interface ValidationRule {
  test: (value: any, field?: any) => boolean;
  message: string | ((value: any, field?: any) => string);
}

/**
 * Validation result interface.
 * @interface ValidationResult
 * 
 * @property {boolean} isValid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Common validation rules collection.
 * Pre-built validators for standard field types.
 * 
 * @constant validationRules
 * @type {Object}
 * 
 * **Available Rules:**
 * - required: Non-empty validation
 * - minLength/maxLength: String length validation
 * - email: Email format validation
 * - url: URL format validation
 * - number: Numeric value validation
 * - min/max: Numeric range validation
 * - arrayMinLength/arrayMaxLength: Array size validation
 * - noDuplicates: Array uniqueness validation
 * - fileSize: File size limit validation
 * - fileType: File extension validation
 */
export const validationRules = {
  required: (value: any): ValidationResult => ({
    isValid: value !== null && value !== undefined && value !== '',
    error: 'This field is required'
  }),

  minLength: (min: number) => (value: string): ValidationResult => ({
    isValid: !value || value.length >= min,
    error: `Must be at least ${min} characters`
  }),

  maxLength: (max: number) => (value: string): ValidationResult => ({
    isValid: !value || value.length <= max,
    error: `Must not exceed ${max} characters`
  }),

  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: !value || emailRegex.test(value),
      error: 'Please enter a valid email address'
    };
  },

  url: (value: string): ValidationResult => {
    try {
      if (!value) return { isValid: true };
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  },

  number: (value: any): ValidationResult => ({
    isValid: value === '' || value === null || value === undefined || !isNaN(Number(value)),
    error: 'Must be a valid number'
  }),

  min: (minValue: number) => (value: number): ValidationResult => ({
    isValid: value == null || value >= minValue,
    error: `Must be at least ${minValue}`
  }),

  max: (maxValue: number) => (value: number): ValidationResult => ({
    isValid: value == null || value <= maxValue,
    error: `Must not exceed ${maxValue}`
  }),

  arrayMinLength: (min: number) => (value: any[]): ValidationResult => ({
    isValid: !Array.isArray(value) || value.length >= min,
    error: `Must have at least ${min} items`
  }),

  arrayMaxLength: (max: number) => (value: any[]): ValidationResult => ({
    isValid: !Array.isArray(value) || value.length <= max,
    error: `Cannot have more than ${max} items`
  }),

  noDuplicates: (value: any[]): ValidationResult => {
    if (!Array.isArray(value)) return { isValid: true };
    const uniqueValues = new Set(value);
    return {
      isValid: uniqueValues.size === value.length,
      error: 'Duplicate values are not allowed'
    };
  },

  fileSize: (maxSize: number) => (file: File): ValidationResult => ({
    isValid: file.size <= maxSize,
    error: `File size must not exceed ${Math.round(maxSize / (1024 * 1024))}MB`
  }),

  fileType: (allowedTypes: string[]) => (file: File): ValidationResult => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return {
      isValid: allowedTypes.includes(fileExtension),
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
};

/**
 * Validate a single field with multiple rules.
 * Runs rules in sequence, stopping at first failure.
 * 
 * @function validateField
 * @param {any} value - Value to validate
 * @param {ValidationRule[]} rules - Array of validation rules
 * @returns {ValidationResult} Validation result with error if failed
 * 
 * @example
 * const rules = [
 *   { test: v => !!v, message: 'Required' },
 *   { test: v => v.length > 3, message: 'Too short' }
 * ];
 * const result = validateField('ab', rules); // { isValid: false, error: 'Too short' }
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    const result = rule.test(value);
    if (!result) {
      return {
        isValid: false,
        error: typeof rule.message === 'function' ? rule.message(value) : rule.message
      };
    }
  }
  return { isValid: true };
}

/**
 * Validate multiple fields at once.
 * Returns error messages for all failed validations.
 * 
 * @function validateFields
 * @param {Record<string, any>} values - Field values to validate
 * @param {Record<string, ValidationRule[]>} fieldRules - Validation rules per field
 * @returns {Record<string, string>} Error messages by field key
 * 
 * @example
 * const errors = validateFields(
 *   { email: 'invalid', name: '' },
 *   {
 *     email: fieldValidationConfigs.email,
 *     name: fieldValidationConfigs.text.required
 *   }
 * );
 * // { email: 'Please enter a valid email', name: 'This field is required' }
 */
export function validateFields(
  values: Record<string, any>,
  fieldRules: Record<string, ValidationRule[]>
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [fieldKey, rules] of Object.entries(fieldRules)) {
    const value = values[fieldKey];
    const result = validateField(value, rules);
    if (!result.isValid && result.error) {
      errors[fieldKey] = result.error;
    }
  }
  
  return errors;
}

/**
 * Standard validation configurations for common field types.
 * Pre-configured rule sets for typical form fields.
 * 
 * @constant fieldValidationConfigs
 * @type {Object}
 * 
 * **Configurations:**
 * - text.required: Required text field
 * - text.name: Name field with length limits
 * - email: Email format validation
 * - url: URL format validation
 * - number: Numeric validation
 */
export const fieldValidationConfigs = {
  text: {
    required: [{ test: (v: any) => validationRules.required(v).isValid, message: 'This field is required' }],
    name: [
      { test: (v: any) => validationRules.required(v).isValid, message: 'Name is required' },
      { test: (v: string) => validationRules.minLength(1)(v).isValid, message: 'Name cannot be empty' },
      { test: (v: string) => validationRules.maxLength(255)(v).isValid, message: 'Name too long (max 255 characters)' }
    ]
  },
  
  email: [
    { test: (v: string) => validationRules.email(v).isValid, message: 'Please enter a valid email address' }
  ],
  
  url: [
    { test: (v: string) => validationRules.url(v).isValid, message: 'Please enter a valid URL (e.g., https://example.com)' }
  ],
  
  number: [
    { test: (v: any) => validationRules.number(v).isValid, message: 'Must be a valid number' }
  ]
};

/**
 * Standardize error message format.
 * Handles both string and ValidationResult formats.
 * 
 * @function formatErrorMessage
 * @param {string|ValidationResult} error - Error to format
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error: string | ValidationResult): string {
  if (typeof error === 'string') return error;
  return error.error || 'Invalid value';
}

/**
 * Create a validator for array items.
 * Used by ArrayFieldEditor for validating new items.
 * 
 * @function createArrayItemValidator
 * @param {boolean} [allowDuplicates=false] - Whether duplicates are allowed
 * @param {number} [maxItems] - Maximum number of items allowed
 * @param {Function} [customValidator] - Custom validation function
 * @returns {Function} Validator function for array items
 * 
 * @example
 * const validator = createArrayItemValidator(false, 5);
 * const error = validator('newItem', ['existing1', 'existing2']);
 */
export function createArrayItemValidator(
  allowDuplicates: boolean = false,
  maxItems?: number,
  customValidator?: (value: string) => string | null
) {
  return (value: string, existingItems?: string[]): string | null => {
    // Required validation
    const requiredResult = validationRules.required(value.trim());
    if (!requiredResult.isValid) return requiredResult.error || 'Value cannot be empty';
    
    // Custom validation
    if (customValidator) {
      const customError = customValidator(value);
      if (customError) return customError;
    }
    
    // Duplicate validation
    if (!allowDuplicates && existingItems?.includes(value.trim())) {
      return 'This value already exists';
    }
    
    // Max items validation
    if (maxItems && existingItems && existingItems.length >= maxItems) {
      return `Maximum ${maxItems} items allowed`;
    }
    
    return null;
  };
}