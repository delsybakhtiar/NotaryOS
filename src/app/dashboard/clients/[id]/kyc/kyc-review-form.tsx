'use client';

// ============================================
// KYC REVIEW FORM COMPONENT
// Client Component - Form for approve/reject KYC
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface KYCReviewFormProps {
  clientId: string;
  clientName: string;
  currentStatus?: 'VERIFIED' | 'REJECTED';
}

export default function KYCReviewForm({ clientId, clientName, currentStatus }: KYCReviewFormProps) {
  const router = useRouter();
  const [action, setAction] = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation: Notes required for rejection
    if (action === 'reject' && !notes.trim()) {
      setError('Mohon isi alasan penolakan');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('clientId', clientId);
      formData.append('action', action!);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const response = await fetch('/api/clients/kyc/verify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memverifikasi KYC');
      }

      setSuccess(data.message || 'Berhasil memverifikasi KYC');

      // Show notification to staff (simulated)
      console.log(`[NOTIFICATION] KYC ${action === 'verify' ? 'approved' : 'rejected'} for client: ${clientName}`);

      // Refresh and redirect after 1.5 seconds
      setTimeout(() => {
        router.refresh();
        router.push('/dashboard/clients');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  const isPending = !currentStatus || currentStatus === 'PENDING';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isPending ? 'Review dan Verifikasi' : 'Ubah Status Verifikasi'}
        </CardTitle>
        <CardDescription>
          {isPending
            ? 'Review data dan dokumen KYC, lalu setujui atau tolak klien ini'
            : 'Anda dapat mengubah status verifikasi klien ini'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Keputusan</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={action === 'verify' ? 'default' : 'outline'}
                className={action === 'verify' ? 'border-green-500' : ''}
                onClick={() => setAction('verify')}
                disabled={loading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Setujui KYC
              </Button>
              <Button
                type="button"
                variant={action === 'reject' ? 'destructive' : 'outline'}
                className={action === 'reject' ? 'border-red-500' : ''}
                onClick={() => setAction('reject')}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak KYC
              </Button>
            </div>
          </div>

          {/* Notes for Rejection */}
          {action === 'reject' && (
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="notes"
                placeholder="Jelaskan mengapa KYC ditolak (contoh: Dokumen tidak lengkap, NIK tidak valid, dll)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Alasan penolakan akan tercatat dan bisa dilihat oleh staff
              </p>
            </div>
          )}

          {/* Optional Notes for Verification */}
          {action === 'verify' && (
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Catatan (Opsional)
              </label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan atau catatan untuk staff (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Catatan ini akan tercatat di audit log
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!action || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                {action === 'verify' ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui Klien
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak Klien
                  </>
                )}
              </>
            )}
          </Button>

          {/* Warning */}
          {isPending && (
            <p className="text-xs text-center text-muted-foreground">
              Tindakan ini akan tercatat di audit log dan memberitahu staff yang terkait
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}