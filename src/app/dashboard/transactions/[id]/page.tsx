'use client';

// ============================================
// TRANSACTION DETAIL PAGE
// Comprehensive transaction detail view
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  History,
  Edit,
  Printer,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useTransaction, useTransitionTransactionStatus } from '@/hooks/use-transactions';
import { TaskPanel } from '@/components/transactions/TaskPanel';
import { DocumentChecklist } from '@/components/transactions/DocumentChecklist';
import { DeliveryPanel } from '@/components/transactions/DeliveryPanel';
import { TransactionTimeline } from '@/components/transactions/TransactionTimeline';
import { TransactionStatusDialog } from '@/components/transactions/TransactionStatusDialog';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  REVIEW: 'Review',
  PROCESSING: 'Diproses',
  READY_TO_SIGN: 'Siap TTD',
  SIGNING: 'Penandatanganan',
  SIGNED: 'Ditandatangani',
  DELIVERY: 'Pengiriman',
  COMPLETED: 'Selesai',
  ON_HOLD: 'Ditahan',
  CANCELLED: 'Dibatalkan',
  ARCHIVED: 'Diarsipkan',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  REVIEW: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  PROCESSING: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  READY_TO_SIGN: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  SIGNING: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  SIGNED: 'bg-green-100 text-green-800 hover:bg-green-200',
  DELIVERY: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-200',
  ON_HOLD: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Rendah',
  NORMAL: 'Normal',
  HIGH: 'Tinggi',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PENDIRIAN_PT: 'Pendirian PT',
  AJB: 'Akta Jual Beli',
  WARIS: 'Waris/Inheritance',
  LEGALISASI: 'Legalisasi Dokumen',
  PERUBAHAN_PT: 'Perubahan PT',
  PEMBERIAN_HAK: 'Pemberian Hak Tanggungan',
  SURAT_KUASA: 'Surat Kuasa',
  PERJANJIAN: 'Perjanjian',
  LAINNYA: 'Lainnya',
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const id = params.id as string;
  const { data: transactionData, isLoading: isLoadingTransaction, isError, error, refetch } = useTransaction(id);
  const transitionStatusMutation = useTransitionTransactionStatus();

  const transaction = transactionData?.transaction;
  const userRole = session?.user?.role;
  const currentUserId = session?.user?.id;
  const canEdit = userRole === 'ADMIN' || userRole === 'STAFF';

  const handleStatusChange = async (newStatus: string, notes?: string) => {
    try {
      await transitionStatusMutation.mutateAsync({
        id,
        newStatus,
        notes,
      });
      toast.success('Status transaksi berhasil diubah');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status transaksi');
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, status: string, notes?: string) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('status', status);
    if (notes) formData.append('notes', notes);

    const response = await fetch(`/api/transactions/${id}/tasks/${taskId}/status`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }

    refetch();
  };

  const handleChecklistStatusUpdate = async (
    checklistId: string,
    status: string,
    fileId?: string,
    notes?: string,
    rejectionReason?: string
  ) => {
    const formData = new FormData();
    formData.append('checklistId', checklistId);
    formData.append('status', status);
    if (fileId) formData.append('fileId', fileId);
    if (notes) formData.append('verificationNotes', notes);
    if (rejectionReason) formData.append('rejectionReason', rejectionReason);

    const response = await fetch(`/api/transactions/${id}/checklist/${checklistId}/status`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update checklist status');
    }

    refetch();
  };

  const handleDeliveryUpdate = async (formData: FormData) => {
    const response = await fetch(`/api/transactions/${id}/delivery`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update delivery');
    }

    refetch();
  };

  const handleDeliveryStatusUpdate = async (
    deliveryId: string,
    status: string,
    trackingNumber?: string,
    notes?: string,
    failureReason?: string
  ) => {
    const formData = new FormData();
    formData.append('deliveryId', deliveryId);
    formData.append('status', status);
    if (trackingNumber) formData.append('trackingNumber', trackingNumber);
    if (notes) formData.append('notes', notes);
    if (failureReason) formData.append('failureReason', failureReason);

    const response = await fetch(`/api/transactions/${id}/delivery/${deliveryId}/status`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update delivery status');
    }

    refetch();
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Detail Transaksi</h1>
            <p className="text-muted-foreground">Informasi lengkap transaksi notaris</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/transactions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{error || 'Gagal memuat data transaksi'}</p>
              <Button onClick={() => refetch()}>Coba Lagi</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const delivery = transaction.deliveries && transaction.deliveries.length > 0 ? transaction.deliveries[0] : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/dashboard/transactions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detail Transaksi</h1>
          <p className="text-muted-foreground">Informasi lengkap transaksi notaris</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Bagikan
          </Button>
          {canEdit && (
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-xl">{transaction.transactionNumber}</CardTitle>
                <Badge className={STATUS_COLORS[transaction.status]}>
                  {STATUS_LABELS[transaction.status]}
                </Badge>
                <Badge className={PRIORITY_COLORS[transaction.priority]}>
                  {PRIORITY_LABELS[transaction.priority]}
                </Badge>
              </div>
              <CardDescription>{SERVICE_TYPE_LABELS[transaction.serviceType] || transaction.serviceType}</CardDescription>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusDialogOpen(true)}
              >
                Ubah Status
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Client Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">Klien</span>
              </div>
              {transaction.client ? (
                <div>
                  <p className="font-medium">{transaction.client.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.client.clientCode}</p>
                  {transaction.client.email && (
                    <p className="text-sm text-muted-foreground">{transaction.client.email}</p>
                  )}
                  {transaction.client.phone && (
                    <p className="text-sm text-muted-foreground">{transaction.client.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada klien</p>
              )}
            </div>

            {/* Created By */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Dibuat Oleh</span>
              </div>
              {transaction.createdBy ? (
                <div>
                  <p className="font-medium">{transaction.createdBy.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.createdBy.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unknown</p>
              )}
            </div>

            {/* Scheduled Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Jadwal</span>
              </div>
              {transaction.scheduledDate ? (
                <p className="font-medium">
                  {new Date(transaction.scheduledDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada jadwal</p>
              )}
              {transaction.completedAt && (
                <p className="text-sm text-muted-foreground">
                  Selesai: {new Date(transaction.completedAt).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>

            {/* Assigned Staff */}
            {transaction.assignedUser && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">PIC</span>
                </div>
                <div>
                  <p className="font-medium">{transaction.assignedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.assignedUser.role}</p>
                  {transaction.assignedUser.email && (
                    <p className="text-sm text-muted-foreground">{transaction.assignedUser.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="space-y-3 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Catatan</span>
                </div>
                <p className="text-sm bg-muted p-3 rounded-lg">{transaction.notes}</p>
              </div>
            )}

            {/* Internal Notes */}
            {transaction.internalNotes && (userRole === 'ADMIN' || userRole === 'STAFF') && (
              <div className="space-y-3 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Catatan Internal</span>
                </div>
                <p className="text-sm bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  {transaction.internalNotes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="tasks">
            Tugas
            {transaction.tasks && transaction.tasks.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {transaction.tasks.filter((t: any) => t.status === 'COMPLETED').length}/{transaction.tasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            Dokumen
            {transaction.checklists && transaction.checklists.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {transaction.checklists.filter((c: any) => c.status === 'VERIFIED' || c.status === 'UPLOADED').length}/
                {transaction.checklists.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivery">Pengiriman</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Timeline */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline Transaksi
              </CardTitle>
              <CardDescription>
                Riwayat progress transaksi dari awal hingga selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTimeline
                transaction={transaction}
                allowedNextStatuses={transaction.allowedNextStatuses || []}
                onStatusChange={canEdit ? handleStatusChange : undefined}
              />
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Progress Tugas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transaction.tasks && transaction.tasks.length > 0
                    ? `${Math.round(
                        (transaction.tasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'SKIPPED')
                          .length /
                          transaction.tasks.length) *
                          100
                      )}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transaction.tasks?.filter((t: any) => t.status === 'COMPLETED' || t.status === 'SKIPPED').length || 0} dari{' '}
                  {transaction.tasks?.length || 0} tugas selesai
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Progress Dokumen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transaction.checklists && transaction.checklists.length > 0
                    ? `${Math.round(
                        (transaction.checklists.filter(
                          (c: any) => c.status === 'VERIFIED' || c.status === 'UPLOADED'
                        ).length /
                          transaction.checklists.length) *
                          100
                      )}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transaction.checklists?.filter((c: any) => c.status === 'VERIFIED' || c.status === 'UPLOADED')
                    .length || 0}{' '}
                  dari {transaction.checklists?.length || 0} dokumen selesai
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Status Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {delivery
                    ? STATUS_LABELS[delivery.status] || delivery.status
                    : 'Belum dibuat'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {delivery?.trackingNumber ? `No. Resi: ${delivery.trackingNumber}` : 'Tidak ada resi'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <TaskPanel
            transactionId={id}
            tasks={transaction.tasks || []}
            availableStaff={[]} // TODO: Fetch staff list
            onUpdateStatus={handleTaskStatusUpdate}
            canEdit={canEdit}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentChecklist
            transactionId={id}
            checklists={transaction.checklists || []}
            onUpdateStatus={handleChecklistStatusUpdate}
            canEdit={canEdit}
            userRole={userRole}
          />
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery">
          <DeliveryPanel
            transactionId={id}
            delivery={delivery || undefined}
            onUpdateDelivery={handleDeliveryUpdate}
            onUpdateDeliveryStatus={handleDeliveryStatusUpdate}
            canEdit={canEdit}
            userRole={userRole}
          />
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Riwayat semua aktivitas pada transaksi ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Transaksi Dibuat</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.createdBy?.name || 'System'} membuat transaksi {transaction.transactionNumber}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>

                {transaction.tasks?.map((task: any) =>
                  task.completedAt ? (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Tugas Selesai</p>
                        <p className="text-sm text-muted-foreground">
                          {task.title} selesai oleh {task.completedBy || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(task.completedAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ) : null
                )}

                {transaction.checklists?.map((checklist: any) =>
                  checklist.verifiedAt ? (
                    <div key={checklist.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Dokumen Diverifikasi</p>
                        <p className="text-sm text-muted-foreground">
                          {checklist.documentName} diverifikasi oleh {checklist.verifiedBy || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(checklist.verifiedAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ) : null
                )}

                {delivery?.deliveredAt && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dokumen Diantar</p>
                      <p className="text-sm text-muted-foreground">
                        Pengiriman selesai{delivery.receivedBy ? ` (diterima oleh ${delivery.receivedBy})` : ''}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(delivery.deliveredAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                )}

                {transaction.completedAt && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100">Transaksi Selesai</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Transaksi {transaction.transactionNumber} telah selesai
                      </p>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {new Date(transaction.completedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <TransactionStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        currentStatus={transaction.status}
        allowedNextStatuses={transaction.allowedNextStatuses || []}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}