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

  // Compare against the Host header, not request.url's host: on serverless/edge
  // runtimes (Netlify, Vercel edge functions) request.url can reflect an internal
  // routing URL rather than the public-facing domain, which made this check fail
  // on every mutating request once deployed even though it worked locally.
  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
