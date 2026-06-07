'use client';

// ============================================
// DASHBOARD INDEX WITH ROLE-BASED REDIRECT
// Redirects users to appropriate dashboard based on role
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;

      // Role-based redirect
      switch (role) {
        case 'ADMIN':
          // ADMIN can access both owner and notaris dashboard
          // Default to notaris dashboard for daily operations
          router.replace('/dashboard/notaris');
          break;
        case 'STAFF':
          router.replace('/dashboard/staff');
          break;
        case 'KURIR':
          router.replace('/dashboard/kurir');
          break;
        case 'FINANCE':
          router.replace('/dashboard/finance');
          break;
        default:
          // Fallback to generic dashboard
          router.replace('/dashboard/transactions');
          break;
      }
    }
  }, [status, session, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}