'use client';

// ============================================
// DASHBOARD PAGE
// Main dashboard for NotaryOS
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users, FileText, DollarSign, LogOut, Activity } from 'lucide-react';
import { UserRole } from '@prisma/client';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case UserRole.STAFF:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.FINANCE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Notaris (Admin)';
      case UserRole.STAFF:
        return 'Staff Operasional';
      case UserRole.FINANCE:
        return 'Finance';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">NotaryOS</h1>
              <p className="text-xs text-muted-foreground">Sistem Administrasi Kantor Notaris</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session.user.name || session.user.email}</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(session.user.role)}`}>
              {getRoleLabel(session.user.role)}
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Selamat Datang, {session.user.name?.split(' ')[0] || 'Pengguna'}!</h2>
          <p className="text-muted-foreground">Berikut adalah ringkasan aktivitas sistem NotaryOS</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Klien</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Klien terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Akta</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Dokumen akta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">Total pendapatan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktivitas Hari Ini</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aksi log tercatat</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Akses fitur-fitur utama NotaryOS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto py-8 flex flex-col gap-2" disabled>
                <Users className="h-8 w-8" />
                <span>Manajemen Klien</span>
                <span className="text-xs text-muted-foreground">Kelola data klien & KYC</span>
              </Button>
              <Button variant="outline" className="h-auto py-8 flex flex-col gap-2" disabled>
                <FileText className="h-8 w-8" />
                <span>Dokumen Akta</span>
                <span className="text-xs text-muted-foreground">Buat & kelola dokumen akta</span>
              </Button>
              <Button variant="outline" className="h-auto py-8 flex flex-col gap-2" disabled>
                <DollarSign className="h-8 w-8" />
                <span>Keuangan</span>
                <span className="text-xs text-muted-foreground">Invoice & pembayaran</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Akun</span>
                <span className="text-green-600 font-medium">Aktif</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{getRoleLabel(session.user.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keamanan</span>
                <span className="text-green-600 font-medium">Terlindungi</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 NotaryOS. Sistem Administrasi Kantor Notaris dengan keamanan data berlapis.
          </p>
        </div>
      </footer>
    </div>
  );
}