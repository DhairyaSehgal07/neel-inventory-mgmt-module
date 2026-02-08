import { NextRequest } from 'next/server';

/**
 * Get the base URL for the app (e.g. https://example.com).
 * Used for generating product URLs in QR codes.
 */
export function getBaseUrl(request?: NextRequest): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (request) {
    const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host');
    const proto = request.headers.get('x-forwarded-proto') ?? 'http';
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  }
  return 'http://localhost:3000';
}
