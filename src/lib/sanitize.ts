/**
 * Input Sanitization & Validation Utilities
 * Prevents XSS, prompt injection, and other input-based attacks
 */

// ===========================
// TEXT SANITIZATION
// ===========================

/**
 * Remove potentially dangerous HTML/script content
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (can be used for XSS)
    .replace(/data:/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Escape remaining HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize text for AI prompts - prevents prompt injection
 */
export function sanitizeForAI(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Max length to prevent token abuse
  const maxLength = 10000;
  let sanitized = input.slice(0, maxLength);
  
  // Remove potential prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+(previous|all|above)\s+(instructions?|prompts?)/gi,
    /forget\s+(everything|all|previous)/gi,
    /new\s+instructions?:/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /```system/gi,
    /\bACT\s+AS\b/gi,
    /\bYOU\s+ARE\s+NOW\b/gi,
    /\bPRETEND\s+TO\s+BE\b/gi,
    /\bROLE\s*:\s*/gi,
  ];
  
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });
  
  return sanitized.trim();
}

/**
 * Sanitize plain text (no HTML, basic cleaning)
 */
export function sanitizeText(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// ===========================
// VALIDATION FUNCTIONS
// ===========================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// ===========================
// INPUT LIMITS
// ===========================

export const INPUT_LIMITS = {
  // Form fields
  name: 100,
  email: 254,
  phone: 20,
  title: 200,
  company: 200,
  location: 200,
  url: 2000,
  
  // Text areas
  summary: 2000,
  description: 5000,
  jobDescription: 10000,
  experience: 5000,
  skills: 1000,
  achievements: 2000,
  coverLetter: 5000,
  
  // AI inputs
  aiPrompt: 10000,
  
  // Arrays
  maxSkills: 50,
  maxExperiences: 20,
  maxEducation: 10,
  maxProjects: 20,
} as const;

/**
 * Validate input against limits
 */
export function validateInputLength(
  input: string, 
  field: keyof typeof INPUT_LIMITS
): { valid: boolean; message?: string } {
  const limit = INPUT_LIMITS[field];
  if (input.length > limit) {
    return { 
      valid: false, 
      message: `${field} must be ${limit} characters or less` 
    };
  }
  return { valid: true };
}

// ===========================
// SANITIZE OBJECT HELPER
// ===========================

/**
 * Recursively sanitize all string fields in an object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: { forAI?: boolean } = {}
): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = options.forAI 
        ? sanitizeForAI(sanitized[key] as string) as any
        : sanitizeText(sanitized[key] as string) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' 
          ? (options.forAI ? sanitizeForAI(item) : sanitizeText(item))
          : item
      ) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], options);
    }
  }
  
  return sanitized;
}
