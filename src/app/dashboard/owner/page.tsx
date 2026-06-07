'use client';

// ============================================
// OWNER DASHBOARD
// Full overview for Owner/Admin role
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, Package, Clock, TrendingUp, Users, FileText, DollarSign, Settings } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface OwnerDashboardStats {
  activeTransactions: number;
  overdueTransactions: number;
  pendingDeliveries: number;
  slaAtRisk: number;
  totalClients: number;
  totalDocuments: number;
  monthlyRevenue: number;
  todayActivities: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  type: 'transaction' | 'document' | 'delivery' | 'client';
}

export default function OwnerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<OwnerDashboardStats>({
    activeTransactions: 0,
    overdueTransactions: 0,
    pendingDeliveries: 0,
    slaAtRisk: 0,
    totalClients: 0,
    totalDocuments: 0,
    monthlyRevenue: 0,
    todayActivities: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/owner');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      // Mock recent activities for now
      setRecentActivities([
        {
          id: '1',
          action: 'Transaksi baru dibuat',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 3600000),
          type: 'transaction',
        },
        {
          id: '2',
          action: 'Dokumen akta diupload',
          user: 'Jane Smith',
          timestamp: new Date(Date.now() - 7200000),
          type: 'document',
        },
        {
          id: '3',
          action: 'Pengiriman selesai',
          user: 'Courier Team',
          timestamp: new Date(Date.now() - 10800000),
          type: 'delivery',
        },
        {
          id: '4',
          action: 'Klien baru terdaftar',
          user: 'Admin',
          timestamp: new Date(Date.now() - 14400000),
          type: 'client',
        },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'delivery':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'client':
        return <Users className="h-5 w-5 text-purple-600" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Owner</h1>
          <p className="text-muted-foreground mt-1">Ringkasan lengkap aktivitas kantor notaris</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          OWNER
        </Badge>
      </div>

      {/* Critical Alerts */}
      {(stats.overdueTransactions > 0 || stats.slaAtRisk > 0) && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertTriangle className="h-5 w-5" />
              Perhatian Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {stats.overdueTransactions > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">
                    {stats.overdueTransactions} Transaksi Terlambat
                  </span>
                </div>
              )}
              {stats.slaAtRisk > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {stats.slaAtRisk} SLA Berisiko
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
            <CardTitle className="text-sm font-medium">Transaksi Aktif</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Dalam proses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdueTransactions > 0 ? 'text-red-600' : ''}`}>
              {stats.overdueTransactions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Melewati deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengiriman Pending</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu proses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLA Berisiko</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.slaAtRisk > 0 ? 'text-orange-600' : ''}`}>
              {stats.slaAtRisk}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mendekati deadline</p>
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
            <CardTitle className="text-sm font-medium">Total Dokumen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumen akta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.monthlyRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total pendapatan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">Aksi log tercatat</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>10 aktivitas terakhir di sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    oleh {activity.user} • {activity.timestamp.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Link href="/dashboard/transactions">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Activity className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Transaksi</CardTitle>
                <CardDescription>Kelola transaksi akta</CardDescription>
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

          <Link href="/dashboard/documents">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Dokumen</CardTitle>
                <CardDescription>Kelola dokumen akta</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Settings className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Pengaturan</CardTitle>
                <CardDescription>Konfigurasi sistem</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}