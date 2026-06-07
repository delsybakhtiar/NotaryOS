'use client';

// ============================================
// TRANSACTION LIST PAGE
// Main page for managing transactions
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TransactionServiceTypeEnum,
  TransactionStatusEnum,
  TransactionPriorityEnum,
} from '@/lib/validations/transaction';
import { useTransactions } from '@/hooks/use-transactions';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    search: '',
    serviceType: '',
    status: '',
    priority: '',
    page: 1,
    pageSize: 20,
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useTransactions(filters);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleRowClick = (transaction: any) => {
    window.location.href = `/dashboard/transactions/${transaction.id}`;
  };

  const handleExport = () => {
    toast.info('Fitur ekspor sedang dalam pengembangan');
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Transaksi</h1>
            <p className="text-muted-foreground">Kelola transaksi notaris</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Gagal memuat data transaksi</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground">Kelola transaksi notaris</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            Transaksi Baru
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.transactions.filter((t: any) => t.status === 'DRAFT').length || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dalam Proses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.transactions.filter((t: any) => 
                  ['SUBMITTED', 'REVIEW', 'PROCESSING', 'READY_TO_SIGN', 'SIGNING'].includes(t.status)
                ).length || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.transactions.filter((t: any) => t.status === 'COMPLETED').length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Cari transaksi..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={filters.serviceType} onValueChange={(v) => handleFilterChange('serviceType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipe Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Layanan</SelectItem>
                {TransactionServiceTypeEnum.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'PENDIRIAN_PT' ? 'Pendirian PT' :
                     type === 'AJB' ? 'Akta Jual Beli' :
                     type === 'WARIS' ? 'Waris' :
                     type === 'LEGALISASI' ? 'Legalisasi' :
                     type === 'PERUBAHAN_PT' ? 'Perubahan PT' :
                     type === 'PEMBERIAN_HAK' ? 'Pemberian Hak' :
                     type === 'SURAT_KUASA' ? 'Surat Kuasa' :
                     type === 'PERJANJIAN' ? 'Perjanjian' :
                     type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                {TransactionStatusEnum.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'DRAFT' ? 'Draft' :
                     status === 'SUBMITTED' ? 'Diajukan' :
                     status === 'REVIEW' ? 'Review' :
                     status === 'PROCESSING' ? 'Proses' :
                     status === 'READY_TO_SIGN' ? 'Siap TTD' :
                     status === 'SIGNING' ? 'TTD' :
                     status === 'SIGNED' ? 'Ditandatangani' :
                     status === 'DELIVERY' ? 'Pengiriman' :
                     status === 'COMPLETED' ? 'Selesai' :
                     status === 'ON_HOLD' ? 'Ditahan' :
                     status === 'CANCELLED' ? 'Dibatalkan' :
                     status === 'ARCHIVED' ? 'Diarsipkan' :
                     status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={filters.priority} onValueChange={(v) => handleFilterChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Prioritas</SelectItem>
                  {TransactionPriorityEnum.options.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority === 'LOW' ? 'Rendah' :
                       priority === 'NORMAL' ? 'Normal' :
                       priority === 'HIGH' ? 'Tinggi' :
                       priority === 'URGENT' ? 'Urgent' :
                       priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Daftar Transaksi
              {!isLoading && data && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({data.pagination.total} transaksi)
                </span>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <TransactionTable
              transactions={data?.transactions || []}
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {data.pagination.page} dari {data.pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filters.page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={filters.page >= data.pagination.totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}