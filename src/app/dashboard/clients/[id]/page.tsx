// ============================================
// CLIENT DETAIL PAGE
// Displays client information with tabs
// ============================================

import { getClientById } from '@/lib/actions/client';
import { deleteClient } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, ShieldCheck, MapPin, Mail, Phone, Calendar, User, Building, FileText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { KycUploadArea } from '@/components/clients/kyc-upload-area';
import { DeleteClientDialog } from '@/components/clients/delete-client-dialog';

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getClientById(params.id);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      case 'BLACKLISTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === 'INDIVIDUAL' ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground mt-1">
            {client.clientCode} • {client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteClientDialog clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipe</span>
              <Badge variant={getTypeBadgeVariant(client.clientType)}>
                {client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC</span>
              <Badge variant={getKycBadgeVariant(client.kycStatus)}>
                {client.kycStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusBadgeVariant(client.status)}>
                {client.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Klien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Kode Klien:</span>
              <span className="ml-2 font-mono">{client.clientCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">QR Code:</span>
              <span className="ml-2 font-mono">{client.qrCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">NIK:</span>
              <span className="ml-2">{client.nik || '-'}</span>
            </div>
            {client.npwp && (
              <div>
                <span className="text-muted-foreground">NPWP:</span>
                <span className="ml-2">{client.npwp}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timestamp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Dibuat:</span>
              <span className="ml-2">
                {format(new Date(client.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
              </span>
            </div>
            {client.createdBy && (
              <div>
                <span className="text-muted-foreground">Oleh:</span>
                <span className="ml-2">{client.createdBy.name}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Diupdate:</span>
              <span className="ml-2">
                {format(new Date(client.updatedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
              </span>
            </div>
            {client.kycVerifiedAt && (
              <div>
                <span className="text-muted-foreground">KYC Verified:</span>
                <span className="ml-2">
                  {format(new Date(client.kycVerifiedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">
            {client.clientType === 'INDIVIDUAL' ? 'Data Pribadi' : 'Data Perusahaan'}
          </TabsTrigger>
          <TabsTrigger value="documents">Riwayat Dokumen</TabsTrigger>
          <TabsTrigger value="kyc">KYC Upload</TabsTrigger>
        </TabsList>

        {/* Data Pribadi / Data Perusahaan */}
        <TabsContent value="info" className="space-y-4">
          {client.clientType === 'INDIVIDUAL' ? (
            <>
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Nama Depan</span>
                    <p className="font-medium mt-1">{client.firstName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nama Belakang</span>
                    <p className="font-medium mt-1">{client.lastName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">NIK</span>
                    <p className="font-medium mt-1">{client.nik || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tanggal Lahir</span>
                    <p className="font-medium mt-1">
                      {client.dateOfBirth
                        ? format(new Date(client.dateOfBirth), 'dd MMMM yyyy', { locale: idLocale })
                        : '-'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Tempat Lahir</span>
                    <p className="font-medium mt-1">{client.placeOfBirth || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Corporate Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Informasi Perusahaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Nama Perusahaan</span>
                    <p className="font-medium mt-1">{client.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tipe Perusahaan</span>
                    <p className="font-medium mt-1">{client.companyType || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">NPWP</span>
                    <p className="font-medium mt-1">{client.npwp || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Email</span>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {client.email || '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Telepon</span>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {client.phone || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Alamat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Alamat Lengkap</span>
                <p className="font-medium mt-1">{client.address || '-'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-sm text-muted-foreground">Kota</span>
                  <p className="font-medium mt-1">{client.city || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Provinsi</span>
                  <p className="font-medium mt-1">{client.province || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kode Pos</span>
                  <p className="font-medium mt-1">{client.postalCode || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents History */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Riwayat Dokumen
              </CardTitle>
              <CardDescription>
                Daftar dokumen yang terkait dengan klien ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.documents && client.documents.length > 0 ? (
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.documentNumber} • {doc.documentType}
                        </p>
                      </div>
                      <Badge variant={doc.status === 'SIGNED' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada dokumen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Upload */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Upload Dokumen KYC
              </CardTitle>
              <CardDescription>
                Unggah dokumen KTP dan NPWP untuk verifikasi KYC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {client.clientType === 'INDIVIDUAL' && (
                <KycUploadArea
                  clientId={client.id}
                  documentType="KTP"
                  fileUrl={client.ktpUrl || null}
                />
              )}
              <KycUploadArea
                clientId={client.id}
                documentType="NPWP"
                fileUrl={client.npwpUrl || null}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}