'use client';

// ============================================
// KURIR DASHBOARD
// Dashboard for Courier (KURIR) role
// Focus on delivery management
// ============================================

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Delivery {
  id: string;
  transactionNumber: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  assignedTo?: string;
  pickupAddress?: string;
}

interface KurirDashboardStats {
  pickupQueue: number;
  onDelivery: number;
  deliveredToday: number;
  failedDeliveries: number;
  totalToday: number;
}

export default function KurirDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<KurirDashboardStats>({
    pickupQueue: 0,
    onDelivery: 0,
    deliveredToday: 0,
    failedDeliveries: 0,
    totalToday: 0,
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
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
      const response = await fetch('/api/dashboard/kurir');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setDeliveries(data.data.deliveries);
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PICKED_UP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'IN_TRANSIT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RETURNED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'ASSIGNED':
        return 'Ditugaskan';
      case 'PICKED_UP':
        return 'Diambil';
      case 'IN_TRANSIT':
        return 'Dalam Pengiriman';
      case 'DELIVERED':
        return 'Terkirim';
      case 'FAILED':
        return 'Gagal';
      case 'RETURNED':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Kurir</h1>
          <p className="text-muted-foreground mt-1">Ringkasan pengiriman dan tugas pengantaran</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          KURIR
        </Badge>
      </div>

      {/* Key Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Antrian Pickup</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pickupQueue}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap diambil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dalam Pengiriman</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.onDelivery}</div>
            <p className="text-xs text-muted-foreground mt-1">Sedang mengantar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terkirim Hari Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveredToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Berhasil dikirim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gagal Kirim</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.failedDeliveries > 0 ? 'text-red-600' : ''}`}>
              {stats.failedDeliveries}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Perlu follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hari Ini</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua pengiriman</p>
          </CardContent>
        </Card>
      </div>

      {/* Pickup Queue */}
      {deliveries.filter((d) => d.status === 'PENDING' || d.status === 'ASSIGNED').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Antrian Pickup
            </CardTitle>
            <CardDescription>
              Paket yang siap untuk diambil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries
                .filter((d) => d.status === 'PENDING' || d.status === 'ASSIGNED')
                .map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/dashboard/transactions/${delivery.transactionNumber}`}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="mt-1">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{delivery.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{delivery.transactionNumber}</p>
                            {delivery.pickupAddress && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Pickup: {delivery.pickupAddress}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* On Delivery */}
      {deliveries.filter((d) => d.status === 'IN_TRANSIT').length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Sedang Diantar
            </CardTitle>
            <CardDescription>
              Paket yang sedang dalam proses pengiriman
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries
                .filter((d) => d.status === 'IN_TRANSIT')
                .map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/dashboard/transactions/${delivery.transactionNumber}`}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors cursor-pointer">
                      <div className="mt-1">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{delivery.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{delivery.transactionNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {delivery.deliveryAddress}
                            </p>
                          </div>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                        {delivery.recipientPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(`tel:${delivery.recipientPhone}`, '_self');
                            }}
                          >
                            <Phone className="h-4 w-4" />
                            Hubungi Penerima
                          </Button>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Deliveries */}
      {deliveries.filter((d) => d.status === 'FAILED').length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
              Pengiriman Gagal
            </CardTitle>
            <CardDescription>
              Paket yang gagal dikirim - perlu follow-up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries
                .filter((d) => d.status === 'FAILED')
                .map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/dashboard/transactions/${delivery.transactionNumber}`}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-colors cursor-pointer">
                      <div className="mt-1">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{delivery.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{delivery.transactionNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {delivery.deliveryAddress}
                            </p>
                          </div>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                      </div>
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
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/dashboard/transactions?status=PICKED_UP">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Package className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Antrian Pickup</CardTitle>
                <CardDescription>
                  {stats.pickupQueue} paket siap diambil
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/transactions?status=IN_TRANSIT">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <Truck className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Dalam Pengiriman</CardTitle>
                <CardDescription>
                  {stats.onDelivery} paket sedang diantar
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/transactions?status=DELIVERED">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full group hover:border-primary/50">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="group-hover:text-primary transition-colors">Riwayat Pengiriman</CardTitle>
                <CardDescription>
                  {stats.deliveredToday} paket terkirim hari ini
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}