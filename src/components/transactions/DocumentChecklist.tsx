'use client';

import { useState } from 'react';
import {
  FileCheck,
  FileX,
  Upload,
  Eye,
  Check,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export interface ChecklistItem {
  id: string;
  documentType: string;
  documentName: string;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  required: boolean;
  fileId?: string | null;
  uploadedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  rejectionReason?: string | null;
}

interface DocumentChecklistProps {
  transactionId: string;
  checklists: ChecklistItem[];
  onUpdateStatus: (
    checklistId: string,
    status: 'UPLOADED' | 'VERIFIED' | 'REJECTED',
    fileId?: string,
    notes?: string,
    rejectionReason?: string
  ) => Promise<void>;
  canEdit: boolean;
  userRole?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Belum Diunggah',
  UPLOADED: 'Terverifikasi',
  VERIFIED: 'Diterima',
  REJECTED: 'Ditolak',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  UPLOADED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  VERIFIED: 'bg-green-100 text-green-800 hover:bg-green-200',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  UPLOADED: Upload,
  VERIFIED: Check,
  REJECTED: X,
};

export function DocumentChecklist({
  transactionId,
  checklists,
  onUpdateStatus,
  canEdit,
  userRole,
}: DocumentChecklistProps) {
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const requiredChecklists = checklists.filter((c) => c.required);
  const optionalChecklists = checklists.filter((c) => !c.required);

  const getStatusPercentage = () => {
    if (checklists.length === 0) return 0;
    const completed = checklists.filter(
      (c) => c.status === 'VERIFIED' || c.status === 'UPLOADED'
    ).length;
    return Math.round((completed / checklists.length) * 100);
  };

  const handleVerify = async () => {
    if (!selectedItem) return;

    setIsProcessing(true);
    try {
      await onUpdateStatus(selectedItem.id, 'VERIFIED', undefined, notes || undefined);
      toast.success('Dokumen berhasil diverifikasi');
      setVerifyDialogOpen(false);
      setSelectedItem(null);
      setNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi dokumen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;

    setIsProcessing(true);
    try {
      await onUpdateStatus(
        selectedItem.id,
        'REJECTED',
        undefined,
        undefined,
        notes || 'Dokumen tidak lengkap atau tidak sesuai'
      );
      toast.success('Dokumen ditolak');
      setRejectDialogOpen(false);
      setSelectedItem(null);
      setNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menolak dokumen');
    } finally {
      setIsProcessing(false);
    }
  };

  const canVerify = userRole === 'ADMIN' || userRole === 'STAFF';
  const canUpload = canEdit;

  const ChecklistRow = ({ item }: { item: ChecklistItem }) => {
    const StatusIcon = STATUS_ICONS[item.status];

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium">{item.documentName}</h4>
            {item.required && (
              <Badge variant="destructive" className="text-xs">
                Wajib
              </Badge>
            )}
            <Badge className={STATUS_COLORS[item.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {STATUS_LABELS[item.status]}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            {item.uploadedAt && (
              <p>
                Diunggah: {new Date(item.uploadedAt).toLocaleDateString('id-ID')}{' '}
                {new Date(item.uploadedAt).toLocaleTimeString('id-ID')}
              </p>
            )}
            {item.verifiedAt && (
              <p>
                Diverifikasi oleh: {item.verifiedBy} -{' '}
                {new Date(item.verifiedAt).toLocaleDateString('id-ID')}
              </p>
            )}
            {item.verificationNotes && (
              <p className="text-muted-foreground italic">Catatan: {item.verificationNotes}</p>
            )}
            {item.rejectionReason && (
              <p className="text-destructive italic">Alasan penolakan: {item.rejectionReason}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {canUpload && item.status === 'PENDING' && (
          <Button variant="outline" size="sm" className="ml-4">
            <Upload className="h-4 w-4 mr-2" />
            Unggah
          </Button>
        )}

        {canVerify && item.status === 'UPLOADED' && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700"
              onClick={() => {
                setSelectedItem(item);
                setVerifyDialogOpen(true);
                setNotes('');
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Terima
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                setSelectedItem(item);
                setRejectDialogOpen(true);
                setNotes('');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Tolak
            </Button>
          </div>
        )}

        {(item.status === 'VERIFIED' || item.status === 'REJECTED') && (
          <Button variant="ghost" size="sm" className="ml-4">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Checklist Dokumen</h3>
          <p className="text-sm text-muted-foreground">
            Kelola dokumen yang diperlukan untuk transaksi ini
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{getStatusPercentage()}%</div>
          <div className="text-sm text-muted-foreground">Selesai</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${getStatusPercentage()}%` }}
        />
      </div>

      {/* Required Documents */}
      {requiredChecklists.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Dokumen Wajib ({requiredChecklists.length})
          </h4>
          {requiredChecklists.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Optional Documents */}
      {optionalChecklists.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileX className="h-4 w-4" />
            Dokumen Opsional ({optionalChecklists.length})
          </h4>
          {optionalChecklists.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {checklists.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Tidak ada checklist dokumen untuk transaksi ini</p>
        </div>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Dokumen</DialogTitle>
            <DialogDescription>
              Verifikasi dokumen "{selectedItem?.documentName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifyNotes">Catatan Verifikasi (Opsional)</Label>
              <Textarea
                id="verifyNotes"
                placeholder="Masukkan catatan verifikasi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={handleVerify} disabled={isProcessing}>
              {isProcessing ? 'Memproses...' : 'Verifikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak dokumen "{selectedItem?.documentName}". Dokumen yang ditolak
              perlu diunggah ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="rejectReason">
              Alasan Penolakan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejectReason"
              placeholder="Jelaskan mengapa dokumen ini ditolak..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!notes.trim() || isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Memproses...' : 'Tolak Dokumen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}