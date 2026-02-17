import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Run on all routes except static assets and API routes
export const config = {
  matcher: [
    /*
     * Match all pathnames except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

/** Only these routes are accessible without authentication (home + sign-in). */
function isPublicPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/sign-in');
}

export default async function proxy(request: NextRequest) {
  const session = await auth();
  const url = request.nextUrl;
  const pathname = url.pathname;

  // If user is authenticated and tries to visit a public page → redirect to dashboard
  if (session && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to visit a protected page → redirect to sign-in
  if (!session && !isPublicPath(pathname)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname + url.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
