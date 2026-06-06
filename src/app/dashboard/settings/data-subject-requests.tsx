'use client';

// ============================================
// DATA SUBJECT REQUESTS COMPONENT
// Manages data subject rights requests (UU PDP Pasal 26)
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { UserCheck, Search, Plus, AlertCircle, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DataSubjectRequest {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  requestType: string;
  status: string;
  reason: string | null;
  description: string | null;
  processedBy: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export default function DataSubjectRequests() {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    requestType: 'ALL',
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    rejectionReason: '',
  });

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, v]) => v !== '' && v !== 'ALL')
          .map(([k, v]) => [k, v] as [string, string])
      );

      const response = await fetch(`/api/settings/data-subject-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (request: DataSubjectRequest) => {
    setSelectedRequest(request);
    setFormData({
      status: request.status,
      rejectionReason: request.rejectionReason || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmitProcess = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/settings/data-subject-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          rejectionReason: formData.rejectionReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Permintaan berhasil diproses');
        setIsDialogOpen(false);
        fetchRequests();
      } else {
        toast.error(data.error || 'Gagal memproses permintaan');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getRequestTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACCESS: 'default',
      CORRECTION: 'secondary',
      DELETION: 'destructive',
      RESTRICTION: 'outline',
      OBJECTION: 'outline',
      PORTABILITY: 'default',
    };
    return variants[type] || 'outline';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { variant: 'outline' as const, icon: Clock, label: 'Menunggu' };
      case 'APPROVED':
        return { variant: 'default' as const, icon: CheckCircle2, label: 'Disetujui' };
      case 'REJECTED':
        return { variant: 'destructive' as const, icon: XCircle, label: 'Ditolak' };
      case 'COMPLETED':
        return { variant: 'default' as const, icon: CheckCircle2, label: 'Selesai' };
      default:
        return { variant: 'outline' as const, icon: Clock, label: status };
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ACCESS: 'Akses Data',
      CORRECTION: 'Koreksi Data',
      DELETION: 'Hapus Data',
      RESTRICTION: 'Batas Pemrosesan',
      OBJECTION: 'Tolak Pemrosesan',
      PORTABILITY: 'Pindah Data',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Hak Subjek Data</h2>
        <p className="text-muted-foreground mt-1">
          Kelola permintaan hak subjek data sesuai Pasal 26 UU PDP
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nama klien, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jenis Permintaan</Label>
              <Select
                value={filters.requestType}
                onValueChange={(value) => setFilters({ ...filters, requestType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="ACCESS">Akses Data</SelectItem>
                  <SelectItem value="CORRECTION">Koreksi Data</SelectItem>
                  <SelectItem value="DELETION">Hapus Data</SelectItem>
                  <SelectItem value="RESTRICTION">Batas Pemrosesan</SelectItem>
                  <SelectItem value="OBJECTION">Tolak Pemrosesan</SelectItem>
                  <SelectItem value="PORTABILITY">Pindah Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan</CardTitle>
          <CardDescription>Permintaan dari subjek data klien</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Memuat permintaan...</p>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada permintaan</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Klien</TableHead>
                    <TableHead>Jenis Permintaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diproses Oleh</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const statusBadge = getStatusBadge(request.status);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="text-sm">
                          {format(new Date(request.createdAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.client.name}</div>
                            <div className="text-xs text-muted-foreground">{request.client.email || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRequestTypeBadge(request.requestType)}>
                            {getRequestTypeLabel(request.requestType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                            <statusBadge.icon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.processedAt
                            ? format(new Date(request.processedAt), 'dd MMM yyyy', { locale: idLocale })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessRequest(request)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detail & Proses
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proses Permintaan Hak Subjek Data</DialogTitle>
            <DialogDescription>
              Kelola permintaan sesuai Pasal 26 UU PDP
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Klien</Label>
                <div className="text-sm">
                  <div className="font-medium">{selectedRequest.client.name}</div>
                  <div className="text-muted-foreground">{selectedRequest.client.email || selectedRequest.client.phone || '-'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jenis Permintaan</Label>
                <Badge variant={getRequestTypeBadge(selectedRequest.requestType)}>
                  {getRequestTypeLabel(selectedRequest.requestType)}
                </Badge>
              </div>

              {selectedRequest.description && (
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.description}</p>
                </div>
              )}

              {selectedRequest.reason && (
                <div className="space-y-2">
                  <Label>Alasan</Label>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.reason}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="APPROVED">Disetujui</SelectItem>
                    <SelectItem value="REJECTED">Ditolak</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'REJECTED' && (
                <div className="space-y-2">
                  <Label>Alasan Penolakan</Label>
                  <Textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    placeholder="Jelaskan alasan penolakan..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmitProcess}>
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}