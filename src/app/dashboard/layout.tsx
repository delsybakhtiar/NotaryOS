// ============================================
// DASHBOARD LAYOUT
// Layout for all dashboard pages
// ============================================

import { type ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/dashboard/user-menu';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
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

        <DashboardNav />
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