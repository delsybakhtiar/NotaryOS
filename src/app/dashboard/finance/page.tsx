'use client';

// ============================================
// FINANCE DASHBOARD
// Dashboard for Finance role
// Coming Soon - Phase 6
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, FileText, Calendar, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinanceDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Finance</h1>
          <p className="text-muted-foreground mt-1">Manajemen keuangan kantor notaris</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          FINANCE
        </Badge>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-5 w-5" />
            Modul Finance - Coming Soon
          </CardTitle>
          <CardDescription className="text-blue-800 dark:text-blue-200">
            Modul manajemen keuangan akan tersedia pada Phase 6
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Modul ini akan mencakup fitur-fitur berikut:
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Manajemen Invoice</p>
                  <p className="text-xs text-muted-foreground">Buat dan kirim invoice ke klien</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tracking Pembayaran</p>
                  <p className="text-xs text-muted-foreground">Status pembayaran dan reminder otomatis</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Laporan Keuangan</p>
                  <p className="text-xs text-muted-foreground">Laporan bulanan dan tahunan</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Analisis Pendapatan</p>
                  <p className="text-xs text-muted-foreground">Grafik dan analisis tren pendapatan</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Untuk informasi lebih lanjut, hubungi administrator sistem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoice</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Segera hadir</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulanan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Segera hadir</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Tertunda</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Segera hadir</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jatuh Tempo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Segera hadir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}