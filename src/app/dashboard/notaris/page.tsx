'use client';

// ============================================
// NOTARIS DASHBOARD
// Dashboard for Notaris (ADMIN role)
// Focus on document review and signing
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, AlertTriangle, CheckCircle2, PenTool, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface NotarisDashboardStats {
  waitingReview: number;
  waitingSignature: number;
  urgentTransactions: number;
  deadlineToday: number;
  totalClients: number;
  todaySignatures: number;
}

export default function NotarisDashboardPage() {
  console.log('NOTARIS_PAGE_RENDER');

  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<NotarisDashboardStats>({
    waitingReview: 0,
    waitingSignature: 0,
    urgentTransactions: 0,
    deadlineToday: 0,
    totalClients: 0,
    todaySignatures: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('NOTARIS_EFFECT_1 - Auth Check');
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    console.log('NOTARIS_EFFECT_2 - Fetch Data', { status });
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    console.log('NOTARIS_FETCH - Fetching dashboard data');
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/notaris');
      console.log('NOTARIS_FETCH - Response received', { status: response.status });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        console.log('NOTARIS_FETCH - Stats updated', data.data);
      }
    } catch (error) {
      console.error('NOTARIS_FETCH - Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    console.log('NOTARIS_RENDER - Loading state', { status, loading });
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
    console.log('NOTARIS_RENDER - No session, returning null');
    return null;
  }

  console.log('NOTARIS_RENDER - Rendering dashboard', { sessionUser: session.user?.email });
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Notaris</h1>
          <p className="text-muted-foreground mt-1">Ringkasan dokumen dan transaksi yang memerlukan perhatian</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          NOTARIS
        </Badge>
      </div>

      {/* Urgent Alerts */}
      {(stats.urgentTransactions > 0 || stats.deadlineToday > 0) && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-5 w-5" />
              Perlu Perhatian Segera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {stats.urgentTransactions > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {stats.urgentTransactions} Transaksi Mendesak
                  </span>
                </div>
              )}
              {stats.deadlineToday > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">
                    {stats.deadlineToday} Deadline Hari Ini
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumen perlu review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Tanda Tangan</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.waitingSignature > 0 ? 'text-blue-600' : ''}`}>
              {stats.waitingSignature}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Siap ditandatangani</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Mendesak</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.urgentTransactions > 0 ? 'text-orange-600' : ''}`}>
              {stats.urgentTransactions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Prioritas tinggi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deadline Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.deadlineToday > 0 ? 'text-red-600' : ''}`}>
              {stats.deadlineToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Perlu selesai hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Klien</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">Klien terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tanda Tangan Hari Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todaySignatures}</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumen ditandatangani</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Link href="/dashboard/documents">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Review Dokumen</CardTitle>
                <CardDescription>
                  {stats.waitingReview} dokumen menunggu review
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/transactions">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <PenTool className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Tanda Tangan</CardTitle>
                <CardDescription>
                  {stats.waitingSignature} siap ditandatangani
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/clients">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Klien</CardTitle>
                <CardDescription>Manajemen data klien</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/transactions?status=IN_PROGRESS">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Activity className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Transaksi</CardTitle>
                <CardDescription>Kelola transaksi aktif</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Priority Tasks */}
      {stats.waitingReview > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Prioritas</CardTitle>
            <CardDescription>Aksi yang memerlukan perhatian notaris</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Review Dokumen Akta</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.waitingReview} dokumen menunggu
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Urgent</Badge>
              </div>

              {stats.waitingSignature > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <PenTool className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Tanda Tangan Dokumen</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.waitingSignature} dokumen siap
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}