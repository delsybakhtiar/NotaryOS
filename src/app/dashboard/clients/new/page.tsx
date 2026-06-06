'use client';

// ============================================
// NEW CLIENT FORM PAGE
// Form to add new client
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Shield, FileText, Info } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  const [formData, setFormData] = useState({
    // Individual fields
    firstName: '',
    lastName: '',
    nik: '',
    dateOfBirth: '',
    placeOfBirth: '',
    // Corporate fields
    companyName: '',
    companyType: '',
    npwp: '',
    // Common fields
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    // UU PDP Consent
    dataConsentGiven: false,
    canContactForMarketing: false,
  });

  // Fetch privacy policy on mount
  useEffect(() => {
    fetch('/api/settings/notaris')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.privacyPolicy) {
          setPrivacyPolicy(data.settings.privacyPolicy);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData();
      form.append('clientType', clientType);
      
      if (clientType === 'INDIVIDUAL') {
        form.append('firstName', formData.firstName);
        form.append('lastName', formData.lastName);
        form.append('nik', formData.nik);
        form.append('dateOfBirth', formData.dateOfBirth);
        form.append('placeOfBirth', formData.placeOfBirth);
      } else {
        form.append('companyName', formData.companyName);
        form.append('companyType', formData.companyType);
        form.append('npwp', formData.npwp);
      }
      
      form.append('email', formData.email);
      form.append('phone', formData.phone);
      form.append('address', formData.address);
      form.append('city', formData.city);
      form.append('province', formData.province);
      form.append('postalCode', formData.postalCode);
      form.append('notes', formData.notes);

      const result = await createClient(form);

      if (!result.success) {
        setError(result.error || 'Gagal membuat klien');
        setLoading(false);
        return;
      }

      router.push('/dashboard/clients');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold">Tambah Klien Baru</h1>
          <p className="text-muted-foreground mt-1">Isi formulir untuk menambah klien baru</p>
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

            <Tabs value={clientType} onValueChange={(v) => setClientType(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="INDIVIDUAL">Individual</TabsTrigger>
                <TabsTrigger value="CORPORATE">Corporate</TabsTrigger>
              </TabsList>

              {/* Individual Form */}
              <TabsContent value="INDIVIDUAL" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nama Depan *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Masukkan nama depan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nama Belakang *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Masukkan nama belakang"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>
                    <Input
                      id="nik"
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="16 digit NIK"
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
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Corporate Form */}
              <TabsContent value="CORPORATE" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nama Perusahaan *</Label>
                    <Input
                      id="companyName"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Masukkan nama perusahaan"
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
                      type="text"
                      maxLength={15}
                      value={formData.npwp}
                      onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                      placeholder="15 digit NPWP"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Contact Information */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Informasi Kontak</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@contoh.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="62xxx"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Alamat</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Kota</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Masukkan kota"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Masukkan provinsi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Kode Pos</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Masukkan kode pos"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan tambahan..."
                  rows={3}
                />
              </div>
            </div>

            {/* UU PDP - Consent & Privacy Policy */}
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="dataConsentGiven"
                    checked={formData.dataConsentGiven}
                    onCheckedChange={(checked) => setFormData({ ...formData, dataConsentGiven: checked as boolean })}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="dataConsentGiven" className="cursor-pointer font-medium">
                      Saya menyetujui pengolahan Data Pribadi saya sesuai Kebijakan Privasi
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Wajib disetujui sesuai Pasal 7 UU PDP
                    </p>
                  </div>
                  <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" type="button">
                        <FileText className="h-4 w-4 mr-1" />
                        Lihat Kebijakan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Kebijakan Privasi
                        </DialogTitle>
                        <DialogDescription>
                          Kebijakan Privasi ini mengatur pengolahan Data Pribadi sesuai UU PDP
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed">
                          {privacyPolicy || 'Kebijakan privasi belum diatur oleh administrator.'}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="canContactForMarketing"
                    checked={formData.canContactForMarketing}
                    onCheckedChange={(checked) => setFormData({ ...formData, canContactForMarketing: checked as boolean })}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="canContactForMarketing" className="cursor-pointer">
                      Saya bersedia dihubungi untuk informasi layanan dan penawaran
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Opsional - dapat dicentang jika diinginkan
                    </p>
                  </div>
                </div>

                {!formData.dataConsentGiven && (
                  <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Anda harus menyetujui pengolahan Data Pribadi sesuai Kebijakan Privasi sebelum menyimpan data klien.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 justify-end">
              <Link href="/dashboard/clients">
                <Button type="button" variant="outline" disabled={loading}>
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !formData.dataConsentGiven}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Klien'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}