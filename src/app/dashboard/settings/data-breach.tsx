'use client';

// ============================================
// DATA BREACH MANAGEMENT COMPONENT
// Manages data breach incidents (UU PDP Pasal 34)
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AlertTriangle, Search, Plus, Bell, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataBreach {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  affectedDataTypes: string | null;
  affectedClientIds: string | null;
  estimatedAffectedCount: number;
  detectedAt: string;
  occurredAt: string | null;
  containedAt: string | null;
  resolvedAt: string | null;
  notifiedAt: string | null;
  notifiedTo: string | null;
  notificationMethod: string | null;
  rootCause: string | null;
  notes: string | null;
  createdAt: string;
}

export default function DataBreachManagement() {
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    severity: 'ALL',
  });

  // Dialog state for creating/editing
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState<DataBreach | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as string,
    status: 'DETECTED' as string,
    affectedDataTypes: '',
    affectedClientIds: '',
    estimatedAffectedCount: 0,
    detectedAt: new Date().toISOString().split('T')[0],
    occurredAt: '',
    containedAt: '',
    resolvedAt: '',
    notifiedAt: '',
    notifiedTo: '',
    notificationMethod: '',
    rootCause: '',
    notes: '',
  });

  useEffect(() => {
    fetchBreaches();
  }, [filters]);

  const fetchBreaches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, v]) => v !== '' && v !== 'ALL')
          .map(([k, v]) => [k, v] as [string, string])
      );

      const response = await fetch(`/api/settings/data-breach?${params}`);
      const data = await response.json();

      if (data.success) {
        setBreaches(data.breaches);
      }
    } catch (error) {
      console.error('Error fetching breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBreach = () => {
    setIsCreateMode(true);
    setSelectedBreach(null);
    setFormData({
      title: '',
      description: '',
      severity: 'MEDIUM',
      status: 'DETECTED',
      affectedDataTypes: '',
      affectedClientIds: '',
      estimatedAffectedCount: 0,
      detectedAt: new Date().toISOString().split('T')[0],
      occurredAt: '',
      containedAt: '',
      resolvedAt: '',
      notifiedAt: '',
      notifiedTo: '',
      notificationMethod: '',
      rootCause: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleViewBreach = (breach: DataBreach) => {
    setIsCreateMode(false);
    setSelectedBreach(breach);
    setFormData({
      title: breach.title,
      description: breach.description,
      severity: breach.severity,
      status: breach.status,
      affectedDataTypes: breach.affectedDataTypes || '',
      affectedClientIds: breach.affectedClientIds || '',
      estimatedAffectedCount: breach.estimatedAffectedCount,
      detectedAt: breach.detectedAt.split('T')[0],
      occurredAt: breach.occurredAt?.split('T')[0] || '',
      containedAt: breach.containedAt?.split('T')[0] || '',
      resolvedAt: breach.resolvedAt?.split('T')[0] || '',
      notifiedAt: breach.notifiedAt?.split('T')[0] || '',
      notifiedTo: breach.notifiedTo || '',
      notificationMethod: breach.notificationMethod || '',
      rootCause: breach.rootCause || '',
      notes: breach.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmitBreach = async () => {
    try {
      const url = isCreateMode
        ? '/api/settings/data-breach'
        : `/api/settings/data-breach/${selectedBreach?.id}`;

      const response = await fetch(url, {
        method: isCreateMode ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isCreateMode ? 'Insiden berhasil dicatat' : 'Insiden berhasil diupdate');
        setIsDialogOpen(false);
        fetchBreaches();
      } else {
        toast.error(data.error || 'Gagal menyimpan insiden');
      }
    } catch (error) {
      console.error('Error saving breach:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'outline',
      CRITICAL: 'destructive',
    };
    return variants[severity] || 'outline';
  };

  const getStatusBadge = (status: string) => {
    const icons: Record<string, any> = {
      DETECTED: AlertCircle,
      INVESTIGATING: Clock,
      CONTAINED: Bell,
      RESOLVED: CheckCircle2,
      NOTIFIED: CheckCircle2,
    };
    return {
      icon: icons[status] || Clock,
      label: {
        DETECTED: 'Terdeteksi',
        INVESTIGATING: 'Diselidiki',
        CONTAINED: 'Dikendalikan',
        RESOLVED: 'Selesai',
        NOTIFIED: 'Diberitahu',
      }[status] || status,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Insiden Data</h2>
        <p className="text-muted-foreground mt-1">
          Kelola insiden pelanggaran data sesuai Pasal 34 UU PDP
        </p>
      </div>

      {/* Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Pasal 34 UU PDP: Pemberitahuan pelanggaran data harus dilakukan paling lambat 3 x 24 jam sejak pelanggaran diketahui jika berpotensi merugikan subjek data.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Judul, deskripsi..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
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
                  <SelectItem value="DETECTED">Terdeteksi</SelectItem>
                  <SelectItem value="INVESTIGATING">Diselidiki</SelectItem>
                  <SelectItem value="CONTAINED">Dikendalikan</SelectItem>
                  <SelectItem value="RESOLVED">Selesai</SelectItem>
                  <SelectItem value="NOTIFIED">Diberitahu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleCreateBreach} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Catat Insiden
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breaches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Insiden</CardTitle>
          <CardDescription>Riwayat insiden pelanggaran data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Memuat insiden...</p>
          ) : breaches.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada insiden tercatat</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu Deteksi</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Klien Terdampak</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaches.map((breach) => {
                    const statusBadge = getStatusBadge(breach.status);
                    return (
                      <TableRow key={breach.id}>
                        <TableCell className="text-sm">
                          {format(new Date(breach.detectedAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                        </TableCell>
                        <TableCell className="font-medium">{breach.title}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadge(breach.severity)}>
                            {breach.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <statusBadge.icon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {breach.estimatedAffectedCount || 0}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBreach(breach)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detail
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? 'Catat Insiden Data Baru' : 'Detail Insiden Data'}</DialogTitle>
            <DialogDescription>
              Sesuai Pasal 34 UU PDP, beritahu klien paling lambat 3x24 jam
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Insiden *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Kebocoran database klien"
                />
              </div>

              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - Dampak minimal</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Dampak sedang</SelectItem>
                    <SelectItem value="HIGH">High - Dampak tinggi</SelectItem>
                    <SelectItem value="CRITICAL">Critical - Dampak kritis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan insiden secara detail..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Waktu Deteksi *</Label>
                <Input
                  type="date"
                  value={formData.detectedAt}
                  onChange={(e) => setFormData({ ...formData, detectedAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Waktu Kejadian</Label>
                <Input
                  type="date"
                  value={formData.occurredAt}
                  onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah Klien Terdampak</Label>
                <Input
                  type="number"
                  value={formData.estimatedAffectedCount}
                  onChange={(e) => setFormData({ ...formData, estimatedAffectedCount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DETECTED">Terdeteksi</SelectItem>
                  <SelectItem value="INVESTIGATING">Sedang Diselidiki</SelectItem>
                  <SelectItem value="CONTAINED">Dikendalikan</SelectItem>
                  <SelectItem value="RESOLVED">Selesai</SelectItem>
                  <SelectItem value="NOTIFIED">Diberitahu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Waktu Dikendalikan</Label>
                <Input
                  type="date"
                  value={formData.containedAt}
                  onChange={(e) => setFormData({ ...formData, containedAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Waktu Diselesaikan</Label>
                <Input
                  type="date"
                  value={formData.resolvedAt}
                  onChange={(e) => setFormData({ ...formData, resolvedAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Penyebab Utama</Label>
              <Textarea
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                placeholder="Analisis penyebab utama..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notifikasi</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="date"
                  value={formData.notifiedAt}
                  onChange={(e) => setFormData({ ...formData, notifiedAt: e.target.value })}
                  placeholder="Waktu notifikasi"
                />
                <Input
                  value={formData.notifiedTo}
                  onChange={(e) => setFormData({ ...formData, notifiedTo: e.target.value })}
                  placeholder="Dinotifikasi ke (contoh: clients, OJK, Kominfo)"
                />
                <Input
                  value={formData.notificationMethod}
                  onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value })}
                  placeholder="Metode (email, surat, dll)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitBreach}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}