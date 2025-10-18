/**
 * Security utilities for PII redaction, encryption, and data sanitization
 */

// PII Redaction patterns
const EMAIL_PATTERN = /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const PHONE_PATTERN = /(\+?1?\s*)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
const SSN_PATTERN = /\d{3}-\d{2}-\d{4}/g;
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

/**
 * Hash a string to create an anonymized identifier
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Return first 16 chars
}

/**
 * Redact email addresses in text
 */
export async function redactEmails(text: string): Promise<string> {
  const matches = text.match(EMAIL_PATTERN);
  if (!matches) return text;

  let redacted = text;
  for (const email of matches) {
    const hash = await hashString(email);
    redacted = redacted.replace(email, `user-${hash}@redacted.local`);
  }
  return redacted;
}

/**
 * Redact phone numbers in text
 */
export function redactPhones(text: string): string {
  return text.replace(PHONE_PATTERN, 'XXX-XXX-XXXX');
}

/**
 * Redact credit card numbers in text
 */
export function redactCreditCards(text: string): string {
  return text.replace(CREDIT_CARD_PATTERN, 'XXXX-XXXX-XXXX-XXXX');
}

/**
 * Redact SSN in text
 */
export function redactSSN(text: string): string {
  return text.replace(SSN_PATTERN, 'XXX-XX-XXXX');
}

/**
 * Comprehensive PII redaction
 */
export async function redactPII(text: string): Promise<string> {
  let redacted = text;
  redacted = await redactEmails(redacted);
  redacted = redactPhones(redacted);
  redacted = redactCreditCards(redacted);
  redacted = redactSSN(redacted);
  return redacted;
}

/**
 * Strip email signatures and footers
 */
export function stripEmailSignature(text: string): string {
  // Common signature patterns
  const signaturePatterns = [
    /--\s*\n.*$/s,  // Lines after "--"
    /^Best,?\s*$/im,
    /^Regards,?\s*$/im,
    /^Sincerely,?\s*$/im,
    /^Thanks,?\s*$/im,
    /^Sent from my (iPhone|iPad|Android)/im,
  ];

  let cleaned = text;
  for (const pattern of signaturePatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      cleaned = cleaned.substring(0, match.index);
    }
  }

  return cleaned.trim();
}

/**
 * Sanitize log data by removing sensitive information
 */
export async function sanitizeLogData(data: any): Promise<any> {
  if (typeof data === 'string') {
    return await redactPII(data);
  }

  if (Array.isArray(data)) {
    return Promise.all(data.map(item => sanitizeLogData(item)));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Don't log tokens, passwords, or keys
      if (['token', 'password', 'secret', 'key', 'authorization'].some(k => 
          key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = await sanitizeLogData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Generate anonymized user identifier for logging
 */
export async function anonymizeUserId(userId: string): Promise<string> {
  const hash = await hashString(userId);
  return `user-${hash}`;
}

/**
 * OAuth 2.0 Scope definitions
 */
export const OAUTH_SCOPES = {
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
  GMAIL_METADATA: 'https://www.googleapis.com/auth/gmail.metadata',
  OUTLOOK_MAIL_READ: 'Mail.Read',
  OUTLOOK_MAIL_READ_BASIC: 'Mail.ReadBasic',
} as const;

/**
 * Validate that only read-only scopes are being requested
 */
export function validateReadOnlyScopes(scopes: string[]): boolean {
  const allowedScopes = Object.values(OAUTH_SCOPES);
  return scopes.every(scope => allowedScopes.includes(scope as any));
}
