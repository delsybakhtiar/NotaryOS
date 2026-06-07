'use client';

// ============================================
// STAFF DASHBOARD
// Dashboard for Staff role
// Focus on tasks and day-to-day operations
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, AlertTriangle, FileText, Users, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  transactionNumber: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dueDate?: Date;
}

interface StaffDashboardStats {
  myTasks: number;
  dueToday: number;
  overdueTasks: number;
  recentDocuments: number;
  completedToday: number;
}

export default function StaffDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StaffDashboardStats>({
    myTasks: 0,
    dueToday: 0,
    overdueTasks: 0,
    recentDocuments: 0,
    completedToday: 0,
  });
  const [myTasks, setMyTasks] = useState<Task[]>([]);
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
      const response = await fetch('/api/dashboard/staff');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setMyTasks(data.data.tasks);
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date();
  };

  const isDueToday = (task: Task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Staff</h1>
          <p className="text-muted-foreground mt-1">Ringkasan tugas dan aktivitas operasional</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          STAFF
        </Badge>
      </div>

      {/* Overdue Alerts */}
      {stats.overdueTasks > 0 && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertTriangle className="h-5 w-5" />
              Tugas Terlambat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-900 dark:text-red-100">
              Anda memiliki <span className="font-bold">{stats.overdueTasks}</span> tugas yang sudah melewati deadline.
              Segera selesaikan tugas tersebut.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tugas Saya</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Total tugas aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deadline Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.dueToday > 0 ? 'text-orange-600' : ''}`}>
              {stats.dueToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Harus selesai hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : ''}`}>
              {stats.overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Melewati deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Tugas diselesaikan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dokumen Terbaru</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumen baru hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks List */}
      {myTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tugas Saya</CardTitle>
            <CardDescription>
              Daftar tugas yang sedang Anda kerjakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/transactions/${task.transactionNumber}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {isOverdue(task) && (
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        {isDueToday(task) && !isOverdue(task) && (
                          <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.transactionNumber}
                            {task.dueDate && (
                              <span className="ml-2">
                                • Due: {new Date(task.dueDate).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Link href="/dashboard/transactions">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Activity className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Transaksi</CardTitle>
                <CardDescription>Kelola transaksi</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/clients">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Klien</CardTitle>
                <CardDescription>Manajemen klien</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/documents">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Dokumen</CardTitle>
                <CardDescription>Kelola dokumen</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/transactions?assignedTo=me">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <CheckSquare className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Tugas Saya</CardTitle>
                <CardDescription>
                  {stats.myTasks} tugas aktif
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}