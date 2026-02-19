/**
 * Build Information Utility
 *
 * Provides build hash and timestamp for the current build.
 * These are injected at build time via Vite's define config.
 *
 * Usage:
 *   import { BUILD_HASH, BUILD_TIMESTAMP, formatBuildInfo } from '../utils/buildInfo';
 *   console.log(formatBuildInfo()); // "Build: 657ed2b (Dec 4, 2025, 10:30 PM)"
 *
 * The hash is:
 * - 7 characters from git rev-parse --short=7 HEAD
 * - "unknown" if git command fails during build
 * - Updated automatically with each build
 *
 * The timestamp is:
 * - ISO 8601 format of when the commit was made
 * - Displayed in user's local timezone and format
 */

// Declare the global constants injected by Vite at build time
declare const __BUILD_HASH__: string;
declare const __BUILD_TIMESTAMP__: string;

/**
 * The current build hash (7-character git commit hash)
 * Example: "657ed2b"
 */
export const BUILD_HASH: string = __BUILD_HASH__;

/**
 * The commit timestamp in ISO 8601 format
 * Example: "2025-12-04T22:30:00-05:00"
 */
export const BUILD_TIMESTAMP: string = __BUILD_TIMESTAMP__;

/**
 * Formatted build string for simple display
 * Example: "Build: 657ed2b"
 */
export const BUILD_STRING: string = `Build: ${BUILD_HASH}`;

/**
 * Format the build info with localized date/time
 * Returns: "Build: 657ed2b (Dec 4, 2025, 10:30 PM)" or similar based on user's locale
 *
 * @param options - Intl.DateTimeFormat options to customize the date format
 * @returns Formatted build string with hash and localized timestamp
 */
export function formatBuildInfo(options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(BUILD_TIMESTAMP);

  // Default format: "Dec 4, 2025, 10:30 PM" (adapts to user's locale)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };

  const formattedDate = date.toLocaleString(undefined, defaultOptions);
  return `Build: ${BUILD_HASH} (${formattedDate})`;
}

/**
 * Get build info as an object for exports/diagnostics
 * Useful for including in .brain exports, diagnostic reports, etc.
 */
export function getBuildInfo(): { hash: string; timestamp: string; formattedTimestamp: string } {
  const date = new Date(BUILD_TIMESTAMP);
  return {
    hash: BUILD_HASH,
    timestamp: BUILD_TIMESTAMP,
    formattedTimestamp: date.toLocaleString(),
  };
}

/**
 * Format just the timestamp in user's locale
 * @returns Localized date/time string
 */
export function formatBuildTimestamp(options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(BUILD_TIMESTAMP);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };
  return date.toLocaleString(undefined, defaultOptions);
}
