'use client';

// ============================================
// KYC REVIEW PAGE - Server Component wrapper
// ============================================

import { getClientById } from '@/lib/actions/client';
import { verifyKyc } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ShieldCheck, ShieldX, ArrowLeft, User, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function KycReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <KycReviewPageContent paramsPromise={params} />;
}

function KycReviewPageContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectNotes, setRejectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load client data
  useState(() => {
    async function loadData() {
      try {
        const resolvedParams = await paramsPromise;
        setParams(resolvedParams);

        const result = await getClientById(resolvedParams.id);
        if (result.success) {
          setClient(result.client);
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Gagal mengambil data klien',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Terjadi kesalahan saat memuat data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  });

  const handleVerify = async (action: 'verify' | 'reject') => {
    if (!params) return;

    setSubmitting(true);

    try {
      const kycStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED';
      const notes = action === 'reject' ? rejectNotes : undefined;

      const result = await verifyKyc(params.id, kycStatus, notes);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `KYC berhasil ${action === 'verify' ? 'disetujui' : 'ditolak'}`,
        });

        router.push('/dashboard/clients');
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memverifikasi KYC',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data KYC...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Data tidak ditemukan</h2>
            <p className="text-muted-foreground mb-4">Klien tidak ditemukan atau telah dihapus</p>
            <Link href="/dashboard/clients">
              <Button>Kembali ke Daftar Klien</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Review KYC</h1>
            <p className="text-muted-foreground">
              {client.clientCode} - {client.name}
            </p>
          </div>
        </div>
        <Badge variant={getKycBadgeVariant(client.kycStatus)} className="text-sm px-4 py-2">
          KYC: {client.kycStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-sm">Kode Klien</Label>
                  <p className="font-medium">{client.clientCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Tipe Klien</Label>
                  <Badge variant={client.clientType === 'INDIVIDUAL' ? 'default' : 'secondary'}>
                    {client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}
                  </Badge>
                </div>
              </div>

              {client.clientType === 'INDIVIDUAL' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground text-sm">Nama Depan</Label>
                      <p className="font-medium">{client.firstName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Nama Belakang</Label>
                      <p className="font-medium">{client.lastName || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">NIK</Label>
                    <p className="font-medium font-mono">{client.nik || 'Belum diisi'}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground text-sm">Tempat Lahir</Label>
                      <p className="font-medium">{client.placeOfBirth || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal Lahir
                      </Label>
                      <p className="font-medium">
                        {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {client.clientType === 'CORPORATE' && (
                <>
                  <div>
                    <Label className="text-muted-foreground text-sm">Nama Perusahaan</Label>
                    <p className="font-medium">{client.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Jenis Perusahaan</Label>
                    <p className="font-medium">{client.companyType || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">NPWP</Label>
                    <p className="font-medium font-mono">{client.npwp || 'Belum diisi'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="font-medium">{client.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </Label>
                  <p className="font-medium">{client.phone || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Lengkap
                </Label>
                <p className="font-medium">
                  {client.address && `${client.address}, `}
                  {client.city && `${client.city}, `}
                  {client.province && `${client.province}`}
                  {client.postalCode && ` ${client.postalCode}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documents (placeholder for future) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dokumen KYC
              </CardTitle>
              <CardDescription>
                Dokumen yang perlu diverifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {client.clientType === 'INDIVIDUAL' && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">KTP (Kartu Tanda Penduduk)</p>
                        <p className="text-sm text-muted-foreground">
                          NIK: {client.nik || 'Belum diisi'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.nik ? 'default' : 'secondary'}>
                      {client.nik ? 'Tersedia' : 'Belum Upload'}
                    </Badge>
                  </div>
                )}

                {client.npwp && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">NPWP</p>
                        <p className="text-sm text-muted-foreground">
                          Nomor: {client.npwp}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Tersedia</Badge>
                  </div>
                )}

                {!client.nik && client.clientType === 'INDIVIDUAL' && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada dokumen KYC yang diupload
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tindakan KYC</CardTitle>
              <CardDescription>
                Verifikasi atau tolak data KYC klien ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.kycStatus === 'PENDING' && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" disabled={submitting}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Setujui KYC
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Setujui KYC?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Anda akan menyetujui verifikasi KYC untuk klien{' '}
                          <strong>{client.name}</strong>. Tindakan ini akan mengubah status KYC
                          menjadi <strong>VERIFIED</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleVerify('verify')}>
                          Ya, Setujui
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={submitting}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak KYC
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tolak KYC?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Anda akan menolak verifikasi KYC untuk klien{' '}
                          <strong>{client.name}</strong>. Tindakan ini akan mengubah status KYC
                          menjadi <strong>REJECTED</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2 py-4">
                        <Label htmlFor="reject-notes">Alasan Penolakan (Opsional)</Label>
                        <Textarea
                          id="reject-notes"
                          placeholder="Jelaskan mengapa KYC ditolak..."
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleVerify('reject')}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ya, Tolak
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {client.kycStatus === 'VERIFIED' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={submitting}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Batalkan Verifikasi
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Batalkan Verifikasi?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anda akan membatalkan verifikasi KYC untuk klien{' '}
                        <strong>{client.name}</strong>. Status KYC akan berubah menjadi{' '}
                        <strong>REJECTED</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-4">
                      <Label htmlFor="cancel-notes">Alasan Pembatalan (Opsional)</Label>
                      <Textarea
                        id="cancel-notes"
                        placeholder="Jelaskan mengapa verifikasi dibatalkan..."
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleVerify('reject')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ya, Batalkan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {client.kycStatus === 'REJECTED' && (
                <div className="text-center py-6">
                  <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                  <p className="font-medium mb-1">KYC Ditolak</p>
                  <p className="text-sm text-muted-foreground">
                    Edit klien untuk mengubah data dan minta verifikasi ulang
                  </p>
                  <Link href={`/dashboard/clients/${client.id}/edit`} className="mt-4 block">
                    <Button variant="outline" className="w-full">
                      Edit Klien
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informasi Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Dibuat pada:</span>
                <p className="font-medium">
                  {new Date(client.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {client.kycVerifiedAt && (
                <div>
                  <span className="text-muted-foreground">Diverifikasi pada:</span>
                  <p className="font-medium">
                    {new Date(client.kycVerifiedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Dibuat oleh:</span>
                <p className="font-medium">{client.createdBy?.name || 'System'}</p>
                <p className="text-xs text-muted-foreground">{client.createdBy?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}