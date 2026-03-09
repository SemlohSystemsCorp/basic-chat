import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

function isUnsupportedBrowser(ua: string): boolean {
  if (!ua) return false;

  // Internet Explorer
  if (/MSIE|Trident/i.test(ua)) return true;

  // Very old Chrome (< 80)
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && parseInt(chromeMatch[1]) < 80) return true;

  // Very old Firefox (< 78)
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch && parseInt(firefoxMatch[1]) < 78) return true;

  // Very old Safari (< 14)
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch && parseInt(safariMatch[1]) < 14) return true;

  // Opera Mini
  if (/Opera Mini/i.test(ua)) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip browser check for static assets, API routes, and the unsupported page itself
  const skipCheck = pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/unsupported-browser' ||
    pathname === '/robots.txt' ||
    pathname === '/llms.txt';

  if (!skipCheck) {
    const ua = request.headers.get('user-agent') || '';
    if (isUnsupportedBrowser(ua)) {
      const url = request.nextUrl.clone();
      url.pathname = '/unsupported-browser';
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
