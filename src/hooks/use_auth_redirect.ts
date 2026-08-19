import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { buildLoginPath, resolveRedirectTarget } from "../utils/auth_redirect";

/**
 * Hook providing auth-redirect helpers.
 *
 * - `goToLogin()` — navigate to /login, carrying the current URL as redirect target.
 * - `resolveAfterLogin()` — call inside LoginPage after successful sign-in; returns
 *   the redirect target (and navigates there if `autoNavigate` is true).
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const goToLogin = useCallback(
    function goToLogin() {
      navigate(buildLoginPath(location.pathname + location.search));
    },
    [navigate, location],
  );

  const resolveAfterLogin = useCallback(
    function resolveAfterLogin(fallback = "/", autoNavigate = true) {
      const target = resolveRedirectTarget(searchParams, fallback);
      if (autoNavigate) {
        navigate(target, { replace: true });
      }
      return target;
    },
    [navigate, searchParams],
  );

  return { goToLogin, resolveAfterLogin };
}
