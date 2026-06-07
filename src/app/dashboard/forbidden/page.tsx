'use client';

// ============================================
// 403 FORBIDDEN PAGE (Dashboard)
// Shown when user doesn't have permission to access a resource
// ============================================

import { ShieldX, ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DashboardForbiddenPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Akses Ditolak</CardTitle>
          <CardDescription>
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Halaman ini memerlukan izin khusus yang tidak Anda miliki.
            </p>
            <p>
              Silakan kembali ke dashboard utama atau hubungi administrator jika ini adalah kesalahan.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="default"
              className="w-full gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Utama
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}