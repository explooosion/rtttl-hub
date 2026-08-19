/**
 * Auth redirect utilities.
 *
 * Encodes the current path as a `redirect` query param when navigating to
 * /login, and resolves the redirect target after successful sign-in.
 *
 * Usage — redirect to login:
 *   navigateToLogin(navigate, location.pathname + location.search);
 *
 * Usage — resolve after login:
 *   const target = resolveRedirectTarget(searchParams);
 *   navigate(target, { replace: true });
 */

export const REDIRECT_PARAM = "redirect";

/** Build the login path with an optional redirect target encoded as a query param. */
export function buildLoginPath(redirectTo?: string) {
  if (!redirectTo || redirectTo === "/login") {
    return "/login";
  }
  return `/login?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}`;
}

/**
 * Navigate to /login, carrying the current page as a redirect target.
 * Pass `undefined` for `currentPath` to omit the redirect param.
 */
export function navigateToLogin(navigate: (path: string) => void, currentPath?: string) {
  navigate(buildLoginPath(currentPath));
}

/**
 * Read the redirect target from URL search params.
 * Returns the fallback path (default: "/") when no valid redirect is present.
 */
export function resolveRedirectTarget(searchParams: URLSearchParams, fallback = "/"): string {
  const raw = searchParams.get(REDIRECT_PARAM);
  if (!raw) {
    return fallback;
  }
  try {
    const decoded = decodeURIComponent(raw);
    // Only allow same-origin relative paths (must start with /)
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    // ignore malformed values
  }
  return fallback;
}
