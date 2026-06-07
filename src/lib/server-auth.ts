// ============================================
// SERVER-SIDE AUTH UTILITIES
// For protected routes and API handlers
// ============================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Get authenticated user from session
 * Returns null if not authenticated
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    isActive: session.user.isActive,
  };
}

/**
 * Require authentication for server components
 * Throws redirect if not authenticated
 */
export async function requireAuth() {
  const user = await getAuthUser();

  if (!user) {
    // This will be caught by the caller
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

/**
 * Require specific role for server components
 * Throws error if user doesn't have the required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getAuthUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Create unauthorized response for API routes
 */
export function unauthorizedResponse(message: string = 'Authentication required') {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
    },
    { status: 401 },
  );
}

/**
 * Create forbidden response for API routes
 */
export function forbiddenResponse(message: string = 'You do not have permission to access this resource') {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message,
    },
    { status: 403 },
  );
}