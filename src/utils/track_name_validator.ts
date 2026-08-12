/**
 * Validates track names for RTTTL format and ESC/FC firmware compatibility.
 *
 * Constraints:
 * - Only ASCII printable characters (0x20-0x7E)
 * - No colon ':' (RTTTL field separator)
 * - No comma ',' (RTTTL note separator)
 * - Maximum 30 characters (more lenient than original 10-char Nokia spec)
 * - At least 1 non-whitespace character
 *
 * Background:
 * - RTTTL format: "name:defaults:notes"
 * - ESC/FC firmware (BLHeli, Bluejay, AM32) runs on embedded systems
 * - Embedded systems typically support ASCII only
 * - Chinese, Japanese, Korean, etc. may cause parsing/display issues
 */

export interface TrackNameValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_TRACK_NAME_LENGTH = 30;

/**
 * Validates a track name according to RTTTL and ESC/FC firmware constraints.
 */
export function validateTrackName(name: string): TrackNameValidationResult {
  // Check if empty or only whitespace
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: "trackNameRequired",
    };
  }

  // Check length
  if (name.length > MAX_TRACK_NAME_LENGTH) {
    return {
      valid: false,
      error: "trackNameTooLong",
    };
  }

  // Check for forbidden RTTTL separators
  if (name.includes(":")) {
    return {
      valid: false,
      error: "trackNameNoColon",
    };
  }

  if (name.includes(",")) {
    return {
      valid: false,
      error: "trackNameNoComma",
    };
  }

  // Check for non-ASCII characters
  // ASCII printable range: 0x20 (space) to 0x7E (~)
  for (let i = 0; i < name.length; i++) {
    const charCode = name.charCodeAt(i);
    if (charCode < 0x20 || charCode > 0x7e) {
      return {
        valid: false,
        error: "trackNameAsciiOnly",
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes a track name by removing invalid characters.
 * Useful for auto-fixing pasted content.
 */
export function sanitizeTrackName(name: string): string {
  return (
    name
      // Remove colons and commas
      .replace(/[:,]/g, "")
      // Keep only ASCII printable characters
      .replace(/[^\x20-\x7E]/g, "")
      // Trim and limit length
      .trim()
      .slice(0, MAX_TRACK_NAME_LENGTH)
  );
}
