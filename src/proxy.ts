// ============================================
// MIDDLEWARE - Authentication & RBAC
// Protects all dashboard and API routes
// ============================================

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

/**
 * Role Access Rules
 * Defines which roles can access which routes
 */
interface RoleAccessRule {
  allowedRoles: UserRole[];
  path: string;
}

const ROLE_ACCESS_RULES: RoleAccessRule[] = [
  // OWNER Dashboard - ADMIN only
  { allowedRoles: [UserRole.ADMIN], path: '/dashboard/owner' },

  // NOTARIS Dashboard - ADMIN only
  { allowedRoles: [UserRole.ADMIN], path: '/dashboard/notaris' },

  // STAFF Dashboard - STAFF and ADMIN
  { allowedRoles: [UserRole.STAFF, UserRole.ADMIN], path: '/dashboard/staff' },

  // FINANCE Dashboard - FINANCE and ADMIN
  { allowedRoles: [UserRole.FINANCE, UserRole.ADMIN], path: '/dashboard/finance' },

  // KURIR Dashboard - KURIR and ADMIN
  { allowedRoles: [UserRole.KURIR, UserRole.ADMIN], path: '/dashboard/kurir' },

  // CLIENTS Management - ADMIN and STAFF
  { allowedRoles: [UserRole.ADMIN, UserRole.STAFF], path: '/dashboard/clients' },

  // DOCUMENTS Management - ADMIN and STAFF
  { allowedRoles: [UserRole.ADMIN, UserRole.STAFF], path: '/dashboard/documents' },

  // TRANSACTIONS - All authenticated users
  { allowedRoles: [UserRole.ADMIN, UserRole.STAFF, UserRole.KURIR, UserRole.FINANCE], path: '/dashboard/transactions' },

  // SETTINGS - ADMIN only
  { allowedRoles: [UserRole.ADMIN], path: '/dashboard/settings' },
];

/**
 * API Access Rules
 */
const API_ACCESS_RULES: RoleAccessRule[] = [
  // Dashboard APIs
  { allowedRoles: [UserRole.ADMIN], path: '/api/dashboard/owner' },
  { allowedRoles: [UserRole.ADMIN], path: '/api/dashboard/notaris' },
  { allowedRoles: [UserRole.STAFF, UserRole.ADMIN], path: '/api/dashboard/staff' },
  { allowedRoles: [UserRole.FINANCE, UserRole.ADMIN], path: '/api/dashboard/finance' },
  { allowedRoles: [UserRole.KURIR, UserRole.ADMIN], path: '/api/dashboard/kurir' },

  // Transaction APIs - All authenticated users
  {
    allowedRoles: [UserRole.ADMIN, UserRole.STAFF, UserRole.KURIR, UserRole.FINANCE],
    path: '/api/transactions',
  },

  // Client APIs - ADMIN and STAFF
  { allowedRoles: [UserRole.ADMIN, UserRole.STAFF], path: '/api/clients' },

  // Document APIs - ADMIN and STAFF
  { allowedRoles: [UserRole.ADMIN, UserRole.STAFF], path: '/api/documents' },

  // Settings APIs - ADMIN only
  { allowedRoles: [UserRole.ADMIN], path: '/api/settings' },
];

/**
 * Check if user role is allowed for a given path
 */
function checkAccess(path: string, userRole: UserRole | undefined, rules: RoleAccessRule[]): boolean {
  if (!userRole) {
    return false;
  }

  // Find the most specific matching rule
  const matchingRule = rules.find((rule) => path.startsWith(rule.path));

  if (!matchingRule) {
    // If no specific rule, check if it's a dashboard or API route
    if (path.startsWith('/dashboard/') || path.startsWith('/api/')) {
      // By default, require authentication for all dashboard and API routes
      // But allow access if not explicitly denied
      return true;
    }
    return true; // Public route
  }

  return matchingRule.allowedRoles.includes(userRole);
}

/**
 * Get denied redirect path based on user role
 */
function getDeniedRedirect(userRole: UserRole | undefined): string {
  if (!userRole) {
    return '/login';
  }

  switch (userRole) {
    case UserRole.ADMIN:
      return '/dashboard/notaris'; // Admin goes to notaris dashboard
    case UserRole.STAFF:
      return '/dashboard/staff';
    case UserRole.KURIR:
      return '/dashboard/kurir';
    case UserRole.FINANCE:
      return '/dashboard/finance';
    default:
      return '/dashboard';
  }
}

/**
 * Main Middleware with RBAC
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Get user role from token
    const userRole = token?.role as UserRole | undefined;

    console.log('[MIDDLEWARE] Auth check:', {
      pathname,
      userRole,
      hasToken: !!token,
    });

    // Check dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const hasAccess = checkAccess(pathname, userRole, ROLE_ACCESS_RULES);

      if (!hasAccess) {
        console.warn('[MIDDLEWARE] Access denied to dashboard:', {
          pathname,
          userRole,
        });

        // Redirect to appropriate dashboard or login
        const redirectPath = token ? getDeniedRedirect(userRole) : '/login';
        return NextResponse.redirect(new URL(redirectPath, req.url));
      }
    }

    // Check API routes
    if (pathname.startsWith('/api')) {
      // Skip auth routes and public APIs
      const publicApiPaths = [
        '/api/auth',
        '/api/setup',
      ];

      const isPublicApi = publicApiPaths.some((path) => pathname.startsWith(path));

      if (isPublicApi) {
        return NextResponse.next();
      }

      // Check access to protected APIs
      const hasAccess = checkAccess(pathname, userRole, API_ACCESS_RULES);

      if (!hasAccess) {
        console.warn('[MIDDLEWARE] Access denied to API:', {
          pathname,
          userRole,
        });

        if (!token) {
          return new NextResponse(
            JSON.stringify({
              error: 'Unauthorized',
              message: 'Authentication required',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You do not have permission to access this resource',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This callback is for checking if the route is accessible
        // We handle the actual RBAC in the middleware function
        return true;
      },
      jwt: async ({ token, user }) => {
        // Add role to token
        if (user) {
          token.role = user.role;
          token.id = user.id;
          token.isActive = user.isActive;
        }
        return token;
      },
    },
  },
);

/**
 * Middleware Configuration
 * Applies to all routes except static files and public routes
 */
export const config = {
  matcher: [
    // Dashboard routes
    '/dashboard/:path*',

    // API routes (excluding auth and setup)
    '/api/((?!auth|setup).*)/:path*',
  ],
};