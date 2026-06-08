// ============================================
// DASHBOARD LAYOUT
// Protected layout with RBAC
// ============================================

import { type ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/dashboard/user-menu';
import { UserRole } from '@prisma/client';

/**
 * Role-based route access configuration
 */
interface RoleAccessConfig {
  [key: string]: UserRole[];
}

const ROLE_ACCESS: RoleAccessConfig = {
  '/dashboard/owner': [UserRole.ADMIN],
  '/dashboard/notaris': [UserRole.ADMIN],
  '/dashboard/staff': [UserRole.STAFF, UserRole.ADMIN],
  '/dashboard/finance': [UserRole.FINANCE, UserRole.ADMIN],
  '/dashboard/kurir': [UserRole.KURIR, UserRole.ADMIN],
  '/dashboard/clients': [UserRole.ADMIN, UserRole.STAFF],
  '/dashboard/documents': [UserRole.ADMIN, UserRole.STAFF],
  '/dashboard/settings': [UserRole.ADMIN],
};

/**
 * Get allowed redirect path for role
 */
function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard/notaris';
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
 * Check if user can access a specific path
 */
function canAccessPath(path: string, userRole: UserRole): boolean {
  // Check exact matches
  if (ROLE_ACCESS[path]) {
    return ROLE_ACCESS[path].includes(userRole);
  }

  // Check prefix matches
  for (const [route, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (path.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  // Default: allow if it's a dashboard route
  return path.startsWith('/dashboard');
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: { path?: string[] };
}) {
  console.log('[DASHBOARD_LAYOUT] Rendering');

  const session = await getServerSession(authOptions);

  // 1. Check authentication
  if (!session?.user) {
    console.log('[DASHBOARD_LAYOUT] No session, redirecting to login');
    redirect('/login');
  }

  // 2. Check if user is active
  if (!session.user.isActive) {
    redirect('/login?error=account_disabled');
  }

  const userRole = session.user.role;

  // 3. Get current path from params or construct it
  // params.path will be undefined for /dashboard route
  const currentPath = params?.path
    ? `/dashboard/${params.path.join('/')}`
    : '/dashboard';

  // 4. Check RBAC for the specific route
  if (currentPath !== '/dashboard' && !canAccessPath(currentPath, userRole)) {
    // Redirect to appropriate dashboard for their role
    const redirectPath = getRoleRedirect(userRole);
    console.log('[DASHBOARD_LAYOUT] RBAC redirect:', { currentPath, userRole, redirectPath });
    redirect(redirectPath);
  }

  // 5. If accessing dashboard index, redirect based on role
  if (currentPath === '/dashboard') {
    const redirectPath = getRoleRedirect(userRole);
    console.log('[DASHBOARD_LAYOUT] Index redirect:', { currentPath, userRole, redirectPath });
    redirect(redirectPath);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">NotaryOS</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        <DashboardNav userRole={userRole} />
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h2 className="text-lg font-semibold">Sistem Administrasi Kantor Notaris</h2>
            </div>
            <UserMenu user={session.user} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-background mt-auto">
          <div className="px-6 py-4">
            <p className="text-center text-sm text-muted-foreground">
              © 2026 Vura Design. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}