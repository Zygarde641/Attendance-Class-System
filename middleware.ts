import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public routes - authentication is handled in API routes and client-side
  const pathname = request.nextUrl.pathname;
  
  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/api/init') || pathname.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  // For dashboard routes, let client-side handle redirect
  // API routes will handle their own authentication
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

