import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/', '/verify/:path*'],
};

export default async function proxy(request: NextRequest) {
  // auth() automatically reads from request context in proxy
  const session = await auth();
  const url = request.nextUrl;

  // If user is authenticated and tries to visit sign-in, sign-up, or home → redirect to dashboard
  if (
    session &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname.startsWith('/verify') ||
      url.pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to visit dashboard → redirect to sign-in
  if (!session && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}
