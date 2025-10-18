/**
 * Shared AI Utilities
 * Helper functions for AI processing
 */

/**
 * Extracts plain text from HTML email body
 */
export function htmlToPlainText(html: string): string {
  // TODO: Implement HTML stripping
  // - Remove tags
  // - Preserve structure
  // - Handle special entities
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Normalizes email addresses for comparison
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Truncates text to max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Extracts email address from "Name <email@domain.com>" format
 */
export function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "", email: raw.trim() };
}

/**
 * Calculates time difference in hours
 */
export function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

/**
 * Checks if text contains any of the keywords (case-insensitive)
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}
