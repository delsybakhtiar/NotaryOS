// ============================================
// MIDDLEWARE
// Role-based access control for protected routes
// ============================================

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Public routes
    const publicRoutes = ['/login', '/api/auth'];

    // Check if route is public
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Protected dashboard routes
    if (pathname.startsWith('/dashboard')) {
      // Require authentication
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Check role for specific routes
      if (pathname.startsWith('/dashboard/clients')) {
        // Only ADMIN and STAFF can access client management
        if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      if (pathname.startsWith('/dashboard/finance')) {
        // Only ADMIN and FINANCE can access finance module
        if (token.role !== 'ADMIN' && token.role !== 'FINANCE') {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      if (pathname.startsWith('/dashboard/documents')) {
        // Only ADMIN and STAFF can access document management
        if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};