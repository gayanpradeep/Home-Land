// Defense-in-depth CSRF check for cookie-authenticated mutations.
// SameSite=Lax already blocks the cookie on cross-site POSTs in modern browsers;
// this verifies Origin/Host as a second layer for older or misconfigured clients.

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin requests from fetch() in the same app always send Origin
    // on cross-origin and same-origin POSTs in most browsers; absence is suspicious.
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}
