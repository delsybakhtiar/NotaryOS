'use client';

// ============================================
// EDIT CLIENT FORM PAGE
// Edit existing client information
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateClient } from '@/lib/actions/client';
import { getClientById } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nik: '',
    dateOfBirth: '',
    placeOfBirth: '',
    companyName: '',
    companyType: '',
    npwp: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    status: '',
    kycStatus: '',
  });

  useEffect(() => {
    async function loadClient() {
      try {
        const result = await getClientById(params.id);
        if (result.success && result.client) {
          const c = result.client;
          setClient(c);
          setFormData({
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            nik: c.nik || '',
            dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : '',
            placeOfBirth: c.placeOfBirth || '',
            companyName: c.companyName || '',
            companyType: c.companyType || '',
            npwp: c.npwp || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            city: c.city || '',
            province: c.province || '',
            postalCode: c.postalCode || '',
            notes: c.notes || '',
            status: c.status,
            kycStatus: c.kycStatus,
          });
        } else {
          router.push('/dashboard/clients');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data klien');
      } finally {
        setLoading(false);
      }
    }
    loadClient();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('firstName', formData.firstName);
      form.append('lastName', formData.lastName);
      form.append('nik', formData.nik);
      form.append('dateOfBirth', formData.dateOfBirth);
      form.append('placeOfBirth', formData.placeOfBirth);
      form.append('companyName', formData.companyName);
      form.append('companyType', formData.companyType);
      form.append('npwp', formData.npwp);
      form.append('email', formData.email);
      form.append('phone', formData.phone);
      form.append('address', formData.address);
      form.append('city', formData.city);
      form.append('province', formData.province);
      form.append('postalCode', formData.postalCode);
      form.append('notes', formData.notes);
      form.append('status', formData.status);
      form.append('kycStatus', formData.kycStatus);

      const result = await updateClient(params.id, form);

      if (!result.success) {
        setError(result.error || 'Gagal mengubah data klien');
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/clients/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data klien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Klien</h1>
          <p className="text-muted-foreground mt-1">
            {client?.name} ({client?.clientCode})
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Client Type Info (Read-only) */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipe Klien</p>
                    <p className="font-semibold mt-1">
                      {client?.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Individual Form */}
              {client?.clientType === 'INDIVIDUAL' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informasi Pribadi</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nama Depan *</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nama Belakang *</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nik">NIK</Label>
                      <Input
                        id="nik"
                        maxLength={16}
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                      <Input
                        id="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Corporate Form */}
              {client?.clientType === 'CORPORATE' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informasi Perusahaan</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nama Perusahaan *</Label>
                      <Input
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyType">Tipe Perusahaan</Label>
                      <Select
                        value={formData.companyType}
                        onValueChange={(v) => setFormData({ ...formData, companyType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                          <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                          <SelectItem value="FIRMA">Firma</SelectItem>
                          <SelectItem value="UD">UD (Usaha Dagang)</SelectItem>
                          <SelectItem value="PERUM">Perum (Perusahaan Umum)</SelectItem>
                          <SelectItem value="BUMN">BUMN</SelectItem>
                          <SelectItem value="LAINNYA">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        maxLength={15}
                        value={formData.npwp}
                        onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informasi Kontak</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alamat</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
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
              </div>

              {/* KYC Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status KYC</h3>
                <div className="space-y-2">
                  <Label htmlFor="kycStatus">Status KYC</Label>
                  <Select
                    value={formData.kycStatus}
                    onValueChange={(v) => setFormData({ ...formData, kycStatus: v })}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Catatan</h3>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Tambahkan catatan tambahan..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Link href={`/dashboard/clients/${params.id}`}>
                  <Button type="button" variant="outline" disabled={submitting}>
                    Batal
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}