'use client';

// ============================================
// KYC REVIEW PAGE
// For Admin to review and approve/reject KYC
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';

interface KycReviewPageProps {
  client: any;
}

export default function KycReviewPage({ client }: KycReviewPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'VERIFY' | 'REJECT' | null>(null);

  const isVerified = client.kycStatus === 'VERIFIED';
  const isRejected = client.kycStatus === 'REJECTED';
  const isPending = client.kycStatus === 'PENDING';

  const handleSubmit = async (action: 'VERIFY' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionNotes.trim()) {
      alert('Harap isi alasan penolakan');
      return;
    }

    setSelectedAction(action);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('clientId', client.id);
      formData.append('action', action === 'VERIFY' ? 'verify' : 'reject');
      formData.append('notes', rejectionNotes);

      const response = await fetch('/api/clients/kyc/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || 'Terjadi kesalahan');
        setLoading(false);
        return;
      }

      alert(
        action === 'VERIFY'
          ? 'KYC berhasil disetujui!'
          : 'KYC berhasil ditolak!'
      );

      router.push(`/dashboard/clients/${client.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-600 hover:bg-green-700">VERIFIED</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">REJECTED</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">PENDING</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getClientTypeBadge = (type: string) => {
    return type === 'INDIVIDUAL' ? (
      <Badge>Individual</Badge>
    ) : (
      <Badge variant="secondary">Corporate</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Review KYC</h1>
            <p className="text-muted-foreground mt-1">
              Review verifikasi KYC untuk {client.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getClientTypeBadge(client.clientType)}
          {getStatusBadge(client.kycStatus)}
        </div>
      </div>

      {/* Status Alert */}
      {isVerified && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">KYC Terverifikasi</AlertTitle>
          <AlertDescription>
            KYC klien ini telah disetujui pada{' '}
            {new Date(client.kycVerifiedAt).toLocaleDateString('id-ID')}
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>KYC Ditolak</AlertTitle>
          <AlertDescription>
            {client.kycRejectNotes || 'Tidak ada catatan penolakan'}
          </AlertDescription>
        </Alert>
      )}

      {isPending && (
        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Menunggu Review</AlertTitle>
          <AlertDescription>
            KYC klien ini masih menunggu review dari Notaris
          </AlertDescription>
        </Alert>
      )}

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Klien
          </CardTitle>
          <CardDescription>
            {client.clientCode} • Dibuat pada{' '}
            {new Date(client.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Nama Lengkap</Label>
              <p className="font-semibold text-lg">{client.name}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Tipe Klien</Label>
              <p>{client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}</p>
            </div>

            {client.clientType === 'INDIVIDUAL' && (
              <>
                <div>
                  <Label className="text-muted-foreground">NIK</Label>
                  <p>{client.nik || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Tempat, Tanggal Lahir</Label>
                  <p>
                    {client.placeOfBirth || '-'},{' '}
                    {client.dateOfBirth
                      ? new Date(client.dateOfBirth).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </>
            )}

            {client.clientType === 'CORPORATE' && (
              <>
                <div>
                  <Label className="text-muted-foreground">Jenis Perusahaan</Label>
                  <p>{client.companyType || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">NPWP</Label>
                  <p>{client.npwp || '-'}</p>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p>{client.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Telepon</Label>
                <p>{client.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <Label className="text-muted-foreground">Alamat</Label>
              <p>{client.address || '-'}</p>
              <p className="text-sm text-muted-foreground">
                {client.city && `${client.city}, `}
                {client.province && `${client.province}`}
                {client.postalCode && ` ${client.postalCode}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumen KYC
          </CardTitle>
          <CardDescription>
            Dokumen yang telah diupload untuk verifikasi KYC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {client.clientType === 'INDIVIDUAL' && (
              <div className="space-y-2">
                <Label>KTP (Kartu Tanda Penduduk)</Label>
                {client.ktpUrl ? (
                  <a
                    href={client.ktpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Lihat Dokumen KTP</span>
                    </div>
                  </a>
                ) : (
                  <p className="text-muted-foreground italic">
                    Tidak ada dokumen KTP
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>NPWP (Nomor Pokok Wajib Pajak)</Label>
              {client.npwpUrl ? (
                <a
                  href={client.npwpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Lihat Dokumen NPWP</span>
                  </div>
                </a>
              ) : (
                <p className="text-muted-foreground italic">
                  Tidak ada dokumen NPWP
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Actions */}
      {isPending && session?.user?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Verifikasi</CardTitle>
            <CardDescription>
              Tentukan keputusan untuk KYC klien ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reject Notes */}
            <div className="space-y-2">
              <Label htmlFor="rejectionNotes">
                Catatan Penolakan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectionNotes"
                placeholder="Jelaskan alasan penolakan KYC..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={4}
                className={
                  selectedAction === 'REJECT' && !rejectionNotes.trim()
                    ? 'border-destructive'
                    : ''
                }
              />
              <p className="text-sm text-muted-foreground">
                Wajib diisi jika Anda menolak KYC
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSubmit('VERIFY')}
                disabled={loading || selectedAction === 'REJECT'}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {loading && selectedAction === 'VERIFY'
                  ? 'Memproses...'
                  : 'Setujui KYC'}
              </Button>

              <Button
                onClick={() => handleSubmit('REJECT')}
                disabled={loading || selectedAction === 'VERIFY'}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <ShieldX className="mr-2 h-4 w-4" />
                {loading && selectedAction === 'REJECT'
                  ? 'Memproses...'
                  : 'Tolak KYC'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Info */}
      {client.kycVerifiedBy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Diverifikasi oleh {client.kycVerifiedBy?.name || 'Admin'} pada{' '}
              {client.kycVerifiedAt
                ? new Date(client.kycVerifiedAt).toLocaleString('id-ID')
                : '-'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}