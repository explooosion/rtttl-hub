import { sanitizeTrackName } from "./track_name_validator";

const NAME_SPLIT_REGEX = /[\s\-_.()[\]]+/;

/**
 * Derives a short, capitalized track-name prefix from an uploaded file name.
 *
 * Strips the file extension, splits the remaining name on common separators
 * (space, "-", "_", ".", brackets), and capitalizes the first letter of the
 * first resulting word. Falls back to `fallback` when nothing usable remains
 * (e.g. an empty name, or a name made entirely of non-ASCII characters).
 */
export function deriveNameFromFilename(fileName: string, fallback: string): string {
  const lastDotIdx = fileName.lastIndexOf(".");
  const withoutExt = lastDotIdx > 0 ? fileName.slice(0, lastDotIdx) : fileName;

  const firstWord = withoutExt.split(NAME_SPLIT_REGEX).find((part) => part.length > 0) ?? "";
  const capitalized = firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "";

  const sanitized = sanitizeTrackName(capitalized);
  return sanitized || fallback;
}
