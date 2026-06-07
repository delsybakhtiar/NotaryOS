'use client';

import { useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeliveryStatus } from '@prisma/client';
import { toast } from 'sonner';

interface Courier {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface Delivery {
  id: string;
  status: DeliveryStatus;
  recipientName: string;
  recipientPhone?: string | null;
  deliveryAddress: string;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  specialInstructions?: string | null;
  trackingNumber?: string | null;
  courierId?: string | null;
  courierName?: string | null;
  courierCompany?: string | null;
  courier?: Courier;
  pickedUpAt?: Date | null;
  inTransitAt?: Date | null;
  deliveredAt?: Date | null;
  attemptedAt?: Date | null;
  notes?: string | null;
  failureReason?: string | null;
  receivedBy?: string | null;
  createdAt: Date;
}

interface DeliveryPanelProps {
  transactionId: string;
  delivery: Delivery | null;
  availableCouriers?: Courier[];
  onUpdateDelivery: (formData: FormData) => Promise<void>;
  onUpdateStatus: (
    deliveryId: string,
    status: DeliveryStatus,
    trackingNumber?: string,
    notes?: string,
    failureReason?: string
  ) => Promise<void>;
  canEdit: boolean;
  userRole?: string;
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Menunggu',
  [DeliveryStatus.ASSIGNED]: 'Diassigned',
  [DeliveryStatus.PICKED_UP]: 'Diambil',
  [DeliveryStatus.IN_TRANSIT]: 'Dalam Perjalanan',
  [DeliveryStatus.DELIVERED]: 'Terkirim',
  [DeliveryStatus.FAILED]: 'Gagal',
  [DeliveryStatus.RETURNED]: 'Dikembalikan',
};

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  [DeliveryStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  [DeliveryStatus.PICKED_UP]: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  [DeliveryStatus.IN_TRANSIT]: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  [DeliveryStatus.DELIVERED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [DeliveryStatus.FAILED]: 'bg-red-100 text-red-800 hover:bg-red-200',
  [DeliveryStatus.RETURNED]: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
};

export function DeliveryPanel({
  transactionId,
  delivery,
  availableCouriers = [],
  onUpdateDelivery,
  onUpdateStatus,
  canEdit,
  userRole,
}: DeliveryPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: delivery?.recipientName || '',
    recipientPhone: delivery?.recipientPhone || '',
    deliveryAddress: delivery?.deliveryAddress || '',
    city: delivery?.city || '',
    province: delivery?.province || '',
    postalCode: delivery?.postalCode || '',
    specialInstructions: delivery?.specialInstructions || '',
    courierId: delivery?.courierId || '',
  });
  const [statusData, setStatusData] = useState({
    status: delivery?.status || DeliveryStatus.PENDING,
    trackingNumber: delivery?.trackingNumber || '',
    notes: delivery?.notes || '',
    failureReason: delivery?.failureReason || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCourier = userRole === 'KURIR';
  const canUpdateStatus = isCourier || userRole === 'ADMIN' || userRole === 'STAFF';

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      await onUpdateDelivery(formDataToSend);
      toast.success('Informasi pengiriman berhasil diperbarui');
      setEditDialogOpen(false);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui pengiriman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!delivery) return;

    setIsSubmitting(true);

    try {
      await onUpdateStatus(
        delivery.id,
        statusData.status,
        statusData.trackingNumber || undefined,
        statusData.notes || undefined,
        statusData.status === DeliveryStatus.FAILED ? statusData.failureReason : undefined
      );
      toast.success(`Status pengiriman berhasil diubah ke ${STATUS_LABELS[statusData.status]}`);
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status pengiriman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextStatuses = (currentStatus: DeliveryStatus): DeliveryStatus[] => {
    const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED],
      [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.FAILED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.FAILED]: [DeliveryStatus.RETURNED, DeliveryStatus.ASSIGNED],
      [DeliveryStatus.RETURNED]: [DeliveryStatus.ASSIGNED],
    };
    return transitions[currentStatus] || [];
  };

  if (!delivery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengiriman</CardTitle>
          <CardDescription>Informasi pengiriman dokumen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Pengiriman belum disiapkan</p>
            {canEdit && (
              <Button
                className="mt-4"
                onClick={() => setEditDialogOpen(true)}
              >
                Buat Pengiriman
              </Button>
            )}
          </div>
        </CardContent>

        {/* Create Delivery Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Pengiriman Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi pengiriman untuk dokumen transaksi ini
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Nama Penerima *</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">No. Telepon</Label>
                  <Input
                    id="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Alamat Pengiriman *</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    rows={2}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">Instruksi Khusus</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    rows={2}
                    placeholder="Contoh: Tolong hubungi sebelum antar..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Buat Pengiriman'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pengiriman</CardTitle>
            <CardDescription>Informasi pengiriman dokumen</CardDescription>
          </div>
          <Badge className={STATUS_COLORS[delivery.status]}>
            {STATUS_LABELS[delivery.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Information */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Penerima</p>
              <p className="text-sm">{delivery.recipientName}</p>
              {delivery.recipientPhone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {delivery.recipientPhone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Alamat Pengiriman</p>
              <p className="text-sm">{delivery.deliveryAddress}</p>
              {(delivery.city || delivery.province || delivery.postalCode) && (
                <p className="text-sm text-muted-foreground">
                  {[delivery.city, delivery.province, delivery.postalCode].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {delivery.specialInstructions && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Instruksi Khusus</p>
                <p className="text-sm text-muted-foreground">{delivery.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Courier Information */}
          {(delivery.courier || delivery.courierName) && (
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Kurir</p>
                <p className="text-sm">
                  {delivery.courier?.name || delivery.courierName}
                  {delivery.courierCompany && ` (${delivery.courierCompany})`}
                </p>
                {delivery.courier?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {delivery.courier.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracking Number */}
          {delivery.trackingNumber && (
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">No. Resi</p>
                <p className="text-sm font-mono">{delivery.trackingNumber}</p>
              </div>
            </div>
          )}

          {/* Delivery Timeline */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline Pengiriman
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                Dibuat:{' '}
                {new Date(delivery.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {delivery.pickedUpAt && (
                <div>
                  Diambil:{' '}
                  {new Date(delivery.pickedUpAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {delivery.inTransitAt && (
                <div>
                  Dalam Perjalanan:{' '}
                  {new Date(delivery.inTransitAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {delivery.deliveredAt && (
                <div>
                  Terkirim:{' '}
                  {new Date(delivery.deliveredAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {delivery.receivedBy && (
                <div className="col-span-2">
                  Diterima Oleh: <span className="font-medium text-foreground">{delivery.receivedBy}</span>
                </div>
              )}
            </div>
            {delivery.failureReason && (
              <div className="text-sm text-destructive mt-2">
                Alasan Gagal: {delivery.failureReason}
              </div>
            )}
            {delivery.notes && (
              <div className="text-sm text-muted-foreground mt-2">
                Catatan: {delivery.notes}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              Edit
            </Button>
          )}
          {canUpdateStatus && getNextStatuses(delivery.status).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              Update Status
            </Button>
          )}
          {delivery.courier && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const phone = delivery.courier?.phone || delivery.recipientPhone;
                if (phone) window.open(`tel:${phone}`, '_blank');
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              Hubungi
            </Button>
          )}
        </div>
      </CardContent>

      {/* Edit Delivery Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengiriman</DialogTitle>
            <DialogDescription>
              Perbarui informasi pengiriman
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-recipientName">Nama Penerima *</Label>
                <Input
                  id="edit-recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-recipientPhone">No. Telepon</Label>
                <Input
                  id="edit-recipientPhone"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deliveryAddress">Alamat Pengiriman *</Label>
                <Textarea
                  id="edit-deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-courierId">Kurir</Label>
                <Select
                  value={formData.courierId}
                  onValueChange={(value) => setFormData({ ...formData, courierId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCouriers.map((courier) => (
                      <SelectItem key={courier.id} value={courier.id}>
                        {courier.name || courier.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Pengiriman</DialogTitle>
            <DialogDescription>
              Ubah status pengiriman dari {STATUS_LABELS[delivery.status]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status Baru</Label>
              <Select
                value={statusData.status}
                onValueChange={(value) => setStatusData({ ...statusData, status: value as DeliveryStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getNextStatuses(delivery.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingNumber">No. Resi</Label>
              <Input
                id="trackingNumber"
                value={statusData.trackingNumber}
                onChange={(e) => setStatusData({ ...statusData, trackingNumber: e.target.value })}
                placeholder="Masukkan nomor resi..."
              />
            </div>

            {statusData.status === DeliveryStatus.FAILED && (
              <div className="space-y-2">
                <Label htmlFor="failureReason">Alasan Kegagalan *</Label>
                <Textarea
                  id="failureReason"
                  value={statusData.failureReason}
                  onChange={(e) => setStatusData({ ...statusData, failureReason: e.target.value })}
                  rows={3}
                  required
                  placeholder="Jelaskan mengapa pengiriman gagal..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={statusData.notes}
                onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                rows={2}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={
                isSubmitting ||
                (statusData.status === DeliveryStatus.FAILED && !statusData.failureReason.trim())
              }
            >
              {isSubmitting ? 'Memproses...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}