// ============================================
// CLIENT KYC REVIEW PAGE
// Server Component - Review and approve/reject KYC
// ============================================

import { getClientById } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, FileText, User, Building2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import KYCReviewForm from './kyc-review-form';

async function KycReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only ADMIN can review KYC
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const result = await getClientById(id);

  if (!result.success || !result.client) {
    redirect('/dashboard/clients');
  }

  const client = result.client;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Klien
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Review KYC - {client.name}</h1>
          <p className="text-muted-foreground mt-1">
            Verifikasi Know Your Customer (KYC) untuk klien
          </p>
        </div>
        <Badge variant={getKycBadgeVariant(client.kycStatus)} className="text-sm px-4 py-2">
          Status KYC: {client.kycStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {client.clientType === 'INDIVIDUAL' ? (
                  <>
                    <User className="h-5 w-5" />
                    Informasi Klien Individual
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5" />
                    Informasi Perusahaan
                  </>
                )}
              </CardTitle>
              <CardDescription>Kode Klien: {client.clientCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                  <p className="text-base font-semibold">{client.name}</p>
                </div>

                {client.clientType === 'INDIVIDUAL' && (
                  <>
                    {client.firstName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nama Depan</label>
                        <p className="text-base">{client.firstName}</p>
                      </div>
                    )}
                    {client.lastName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nama Belakang</label>
                        <p className="text-base">{client.lastName}</p>
                      </div>
                    )}
                    {client.nik && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">NIK</label>
                        <p className="text-base font-mono">{client.nik}</p>
                      </div>
                    )}
                    {client.dateOfBirth && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir</label>
                        <p className="text-base">
                          {format(new Date(client.dateOfBirth), 'dd MMMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                    )}
                    {client.placeOfBirth && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tempat Lahir</label>
                        <p className="text-base">{client.placeOfBirth}</p>
                      </div>
                    )}
                  </>
                )}

                {client.clientType === 'CORPORATE' && (
                  <>
                    {client.companyType && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Jenis Perusahaan</label>
                        <p className="text-base">{client.companyType}</p>
                      </div>
                    )}
                  </>
                )}

                {client.npwp && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                    <p className="text-base font-mono">{client.npwp}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                    <p className="text-base font-mono">{client.phone}</p>
                  </div>
                )}
              </div>

              {client.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                  <p className="text-base">{client.address}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {client.city && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kota</label>
                    <p className="text-base">{client.city}</p>
                  </div>
                )}
                {client.province && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provinsi</label>
                    <p className="text-base">{client.province}</p>
                  </div>
                )}
                {client.postalCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kode Pos</label>
                    <p className="text-base">{client.postalCode}</p>
                  </div>
                )}
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
              <CardDescription>Review dokumen identifikasi klien</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {client.ktpUrl ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">KTP</label>
                    <a href={client.ktpUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Lihat Dokumen KTP
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">KTP</label>
                    <p className="text-sm text-muted-foreground mt-1">Belum diupload</p>
                  </div>
                )}

                {client.npwpUrl ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                    <a href={client.npwpUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Lihat Dokumen NPWP
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                    <p className="text-sm text-muted-foreground mt-1">Belum diupload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection Notes (if rejected) */}
          {client.kycStatus === 'REJECTED' && client.kycRejectNotes && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  Alasan Penolakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 dark:text-red-300">{client.kycRejectNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Review Actions */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Status Verifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Status Saat Ini</span>
                <Badge variant={getKycBadgeVariant(client.kycStatus)}>{client.kycStatus}</Badge>
              </div>

              {client.kycStatus === 'PENDING' && (
                <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-3" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Klien menunggu verifikasi KYC
                  </p>
                </div>
              )}

              {client.kycStatus === 'VERIFIED' && (
                <>
                  {client.kycVerifiedAt && (
                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Terverifikasi pada
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {format(new Date(client.kycVerifiedAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Klien telah berhasil melalui verifikasi KYC
                  </p>
                </>
              )}

              {client.kycStatus === 'REJECTED' && (
                <p className="text-sm text-muted-foreground">
                  Klien ditolak. Silakan review alasan penolakan di bawah.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Review Form */}
          {client.kycStatus === 'PENDING' && (
            <KYCReviewForm clientId={client.id} clientName={client.name} />
          )}

          {/* Change Status (for VERIFIED/REJECTED) */}
          {(client.kycStatus === 'VERIFIED' || client.kycStatus === 'REJECTED') && (
            <KYCReviewForm clientId={client.id} clientName={client.name} currentStatus={client.kycStatus} />
          )}

          {/* Created By */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembuatan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dibuat oleh</span>
                <span className="font-medium">{client.createdBy?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{client.createdBy?.email || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">
                  {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan Tambahan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default KycReviewPage;