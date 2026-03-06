import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "~/lib/supabase/middleware";

const ROOT_DOMAIN = "georgeholmes.io";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Extract subdomain (e.g. "george" from "george.georgeholmes.io")
  // Also handle localhost for dev: "george.localhost:3000"
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
  } else if (hostname.includes(".localhost")) {
    subdomain = hostname.split(".localhost")[0];
  }

  // Ignore www subdomain
  if (subdomain === "www") {
    subdomain = null;
  }

  // If we have a subdomain, rewrite to the workspace slug route
  if (subdomain) {
    const url = request.nextUrl.clone();

    // Don't rewrite API routes, static files, or auth routes
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/auth/")
    ) {
      try {
        return await updateSession(request);
      } catch {
        return NextResponse.next();
      }
    }

    // Rewrite: george.georgeholmes.io/ -> /workspace/s/george
    // Rewrite: george.georgeholmes.io/channel/123 -> /workspace/s/george/channel/123
    url.pathname = `/workspace/s/${subdomain}${pathname}`;
    const response = NextResponse.rewrite(url);

    // Still handle supabase session
    try {
      const sessionResponse = await updateSession(request);
      // Copy session cookies to the rewrite response
      sessionResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
      });
    } catch {
      // Continue without session
    }

    return response;
  }

  // Normal (non-subdomain) request — just handle session
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
