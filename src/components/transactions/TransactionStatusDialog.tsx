'use client';

import { useState } from 'react';
import { TransactionStatus } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getAllowedNextStatuses } from '@/lib/validations/transaction';
import { toast } from 'sonner';

interface TransactionStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: TransactionStatus;
  transactionId: string;
  onStatusChange: (status: TransactionStatus, notes?: string) => Promise<void>;
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.DRAFT]: 'Draft',
  [TransactionStatus.SUBMITTED]: 'Diajukan',
  [TransactionStatus.REVIEW]: 'Review',
  [TransactionStatus.PROCESSING]: 'Diproses',
  [TransactionStatus.READY_TO_SIGN]: 'Siap TTD',
  [TransactionStatus.SIGNING]: 'Penandatanganan',
  [TransactionStatus.SIGNED]: 'Ditandatangani',
  [TransactionStatus.DELIVERY]: 'Pengiriman',
  [TransactionStatus.COMPLETED]: 'Selesai',
  [TransactionStatus.ON_HOLD]: 'Tertunda',
  [TransactionStatus.CANCELLED]: 'Dibatalkan',
  [TransactionStatus.ARCHIVED]: 'Arsip',
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  [TransactionStatus.DRAFT]: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  [TransactionStatus.SUBMITTED]: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  [TransactionStatus.REVIEW]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  [TransactionStatus.PROCESSING]: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  [TransactionStatus.READY_TO_SIGN]: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  [TransactionStatus.SIGNING]: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  [TransactionStatus.SIGNED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [TransactionStatus.DELIVERY]: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
  [TransactionStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  [TransactionStatus.ON_HOLD]: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  [TransactionStatus.CANCELLED]: 'bg-red-100 text-red-800 hover:bg-red-200',
  [TransactionStatus.ARCHIVED]: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
};

const TRANSITION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  DRAFT: {
    SUBMITTED: 'Submit transaksi untuk review',
    CANCELLED: 'Batalkan transaksi',
    ARCHIVED: 'Arsipkan transaksi',
  },
  SUBMITTED: {
    REVIEW: 'Mulai review dokumen',
    CANCELLED: 'Batalkan transaksi',
  },
  REVIEW: {
    PROCESSING: 'Mulai proses pembuatan dokumen',
    READY_TO_SIGN: 'Dokumen siap untuk ditandatangani',
    ON_HOLD: 'Tahan sementara transaksi',
    CANCELLED: 'Batalkan transaksi',
  },
  PROCESSING: {
    READY_TO_SIGN: 'Dokumen siap untuk ditandatangani',
    ON_HOLD: 'Tahan sementara transaksi',
    CANCELLED: 'Batalkan transaksi',
  },
  READY_TO_SIGN: {
    SIGNING: 'Mulai proses penandatanganan',
    ON_HOLD: 'Tahan sementara transaksi',
    CANCELLED: 'Batalkan transaksi',
  },
  SIGNING: {
    SIGNED: 'Proses penandatanganan selesai',
    ON_HOLD: 'Tahan sementara transaksi',
  },
  SIGNED: {
    DELIVERY: 'Mulai proses pengiriman',
    COMPLETED: 'Tandai transaksi sebagai selesai',
    ON_HOLD: 'Tahan sementara transaksi',
  },
  DELIVERY: {
    DELIVERED: 'Dokumen telah dikirim',
    COMPLETED: 'Tandai transaksi sebagai selesai',
  },
  COMPLETED: {
    ARCHIVED: 'Arsipkan transaksi',
  },
  ON_HOLD: {
    REVIEW: 'Lanjutkan ke review',
    PROCESSING: 'Lanjutkan ke proses',
    READY_TO_SIGN: 'Lanjutkan ke penandatanganan',
    SIGNING: 'Lanjutkan ke penandatanganan',
    DELIVERY: 'Lanjutkan ke pengiriman',
    CANCELLED: 'Batalkan transaksi',
  },
  CANCELLED: {
    ARCHIVED: 'Arsipkan transaksi',
  },
  DELIVERED: {
    COMPLETED: 'Tandai transaksi sebagai selesai',
    ARCHIVED: 'Arsipkan transaksi',
  },
};

export function TransactionStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  transactionId,
  onStatusChange,
}: TransactionStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedNextStatuses = getAllowedNextStatuses(currentStatus);

  const handleStatusSelect = (status: TransactionStatus) => {
    setSelectedStatus(status);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);

    try {
      await onStatusChange(selectedStatus, notes || undefined);
      toast.success(`Status berhasil diubah ke ${STATUS_LABELS[selectedStatus]}`);
      onOpenChange(false);
      setSelectedStatus(null);
      setNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setSelectedStatus(null);
      setNotes('');
    }
  };

  const getTransitionDescription = (toStatus: TransactionStatus): string => {
    return TRANSITION_DESCRIPTIONS[currentStatus]?.[toStatus] || `Ubah ke ${STATUS_LABELS[toStatus]}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ubah Status Transaksi</DialogTitle>
          <DialogDescription>
            Transaksi saat ini: <span className="font-semibold">{STATUS_LABELS[currentStatus]}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Options */}
          <div className="space-y-3">
            <Label>Pilih Status Baru</Label>
            <div className="grid grid-cols-2 gap-3">
              {allowedNextStatuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  onClick={() => handleStatusSelect(status as TransactionStatus)}
                  className="h-auto py-4 flex flex-col items-start gap-1"
                >
                  <span className="font-semibold">{STATUS_LABELS[status as TransactionStatus]}</span>
                  <span className="text-xs opacity-70">
                    {getTransitionDescription(status as TransactionStatus)}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {selectedStatus && (
            <div className="space-y-2">
              <Label htmlFor="notes">
                Catatan Perubahan {selectedStatus === TransactionStatus.ON_HOLD ? '(Wajib)' : '(Opsional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder="Masukkan catatan untuk perubahan status..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required={selectedStatus === TransactionStatus.ON_HOLD}
              />
            </div>
          )}

          {/* Warning for certain status changes */}
          {selectedStatus === TransactionStatus.CANCELLED && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Perhatian: Transaksi yang dibatalkan tidak dapat dikembalikan ke status sebelumnya.
              </p>
            </div>
          )}

          {selectedStatus === TransactionStatus.ARCHIVED && (
            <div className="bg-muted border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                ℹ️ Transaksi yang diarsip tidak akan muncul di daftar aktif.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || (selectedStatus === TransactionStatus.ON_HOLD && !notes.trim()) || isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : `Ubah ke ${selectedStatus && STATUS_LABELS[selectedStatus]}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}