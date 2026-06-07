'use client';

// ============================================
// NOTARIS SETTINGS COMPONENT
// Kantor Notaris information management
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, Globe, FileText, Shield, User, Clock } from 'lucide-react';

interface NotarisSettings {
  id: string;
  officeName: string;
  officeAddress: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  notarisName: string;
  notarisNumber?: string;
  notarisRegion?: string;
  documentPrefix: string;
  invoicePrefix: string;
  logoUrl?: string;
  notes?: string;
  // UU PDP Compliance
  privacyPolicy?: string;
  dataRetentionYears?: number;
  auditLogRetentionMonths?: number;
  dpoEmail?: string;
  dpoName?: string;
}

// Default privacy policy template compliant with UU PDP
function getDefaultPrivacyPolicy(): string {
  return `# KEBIJAKAN PRIVASI KANTOR NOTARIS

Kebijakan Privasi ini menjelaskan bagaimana [Nama Kantor Notaris] mengumpulkan, menggunakan, melindungi, dan menghapus Data Pribadi Anda sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).

## 1. DATA YANG DIKUMPULKAN

Kami mengumpulkan Data Pribadi yang diperlukan untuk keperluan notaris dan layanan hukum, meliputi:

### a. Identitas Pribadi
- Nama lengkap (sesuai KTP)
- Nomor Induk Kependudukan (NIK)
- Tanggal dan tempat lahir
- Alamat lengkap
- Nomor telepon
- Alamat email

### b. Data Profesional dan Keuangan
- Nomor Pokok Wajib Pajak (NPWP)
- Dokumen identitas perusahaan (untuk korporasi)

### c. Dokumen Pendukung
- Fotokopi KTP/KK
- Fotokopi NPWP
- Dokumen lain yang diperlukan untuk layanan notaris

## 2. TUJUAN PENGOLAHAN DATA

Data Pribadi Anda kami proses untuk tujuan:
- Verifikasi identitas (KYC - Know Your Customer)
- Pembuatan dan perubahan akta
- Pemberian layanan notaris dan PPAT
- Kepatuhan hukum dan peraturan
- Penyimpanan arsip sesuai ketentuan
- Komunikasi terkait layanan notaris

## 3. DASAR HUKUM PENGOLAHAN

Pengolahan Data Pribadi dilakukan berdasarkan:
- Persetujuan Anda (Pasal 7 UU PDP)
- Kepatuhan kewajiban hukum (Pasal 6 huruf a)
- Pelaksanaan perjanjian (Pasal 6 huruf b)
- Kepentingan sah notaris (Pasal 6 huruf e)

## 4. HAK ANDA SEBAGAI SUBJEK DATA Pribadi

Sesuai Pasal 26 UU PDP, Anda memiliki hak untuk:
- Memperoleh konfirmasi tentang keberadaan Data Pribadi Anda
- Mengakses dan memperoleh Data Pribadi Anda
- Mengoreksi Data Pribadi yang tidak akurat
- Menghapus Data Pribadi Anda (dengan pengecualian tertentu)
- Menolak pemrosesan Data Pribadi Anda
- Meminta pemindahan Data Pribadi Anda
- Membatasi pemrosesan Data Pribadi Anda
- Menarik persetujuan pemrosesan Data Pribadi

## 5. KEAMANAN DATA Pribadi

Kami menerapkan langkah-langkah keamanan fisik dan teknis untuk melindungi Data Pribadi Anda, termasuk:
- Enkripsi data dan password
- Akses terbatas berdasarkan peran
- Pencatatan aktivitas (audit trail) selama minimal 6 bulan
- Backup rutin dan proteksi terhadap kehilangan data

## 6. RETENSI DATA

Data Pribadi Anda akan disimpan sesuai dengan:
- Ketentuan retensi dokumen notaris (umumnya 10 tahun)
- Audit log disimpan minimal 6 bulan (Pasal 31 UU PDP)
- Setelah masa retensi berakhir, data akan dihapus atau diarsipkan dengan aman

## 7. PEMBERITAHUAN PELANGGARAN DATA

Jika terjadi pelanggaran Data Pribadi yang berpotensi merugikan Anda, kami akan memberitahu Anda paling lambat 3 x 24 jam sejak pelanggaran diketahui (Pasal 34 UU PDP).

## 8. DATA PROTECTION OFFICER (DPO)

Untuk pertanyaan atau permintaan terkait Data Pribadi Anda, silakan hubungi:
- Nama DPO: [Nama DPO]
- Email: [Email DPO]
- Telepon: [Nomor Telepon]

## 9. PERUBAHAN KEBIJAKAN

Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan kepada Anda.

## 10. KONTAK

Untuk pertanyaan lebih lanjut, hubungi:
[Nama Kantor Notaris]
[Alamat Lengkap]
[Email]
[Telepon]
`;
}

export default function NotarisSettingsComponent() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    officeName: '',
    officeAddress: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    notarisName: '',
    notarisNumber: '',
    notarisRegion: '',
    documentPrefix: 'AKTA',
    invoicePrefix: 'INV',
    notes: '',
    // UU PDP Compliance
    privacyPolicy: '',
    dataRetentionYears: 10,
    auditLogRetentionMonths: 6,
    dpoEmail: '',
    dpoName: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notaris');
      const data = await response.json();

      if (data.success && data.settings) {
        setFormData({
          officeName: data.settings.officeName || '',
          officeAddress: data.settings.officeAddress || '',
          city: data.settings.city || '',
          province: data.settings.province || '',
          postalCode: data.settings.postalCode || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          website: data.settings.website || '',
          notarisName: data.settings.notarisName || '',
          notarisNumber: data.settings.notarisNumber || '',
          notarisRegion: data.settings.notarisRegion || '',
          documentPrefix: data.settings.documentPrefix || 'AKTA',
          invoicePrefix: data.settings.invoicePrefix || 'INV',
          notes: data.settings.notes || '',
          // UU PDP Compliance
          privacyPolicy: data.settings.privacyPolicy || getDefaultPrivacyPolicy(),
          dataRetentionYears: data.settings.dataRetentionYears || 10,
          auditLogRetentionMonths: data.settings.auditLogRetentionMonths || 6,
          dpoEmail: data.settings.dpoEmail || '',
          dpoName: data.settings.dpoName || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings/notaris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pengaturan berhasil disimpan');
        fetchSettings();
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <div className="grid gap-6">
        {/* Kantor Notaris Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Kantor Notaris
            </CardTitle>
            <CardDescription>Data kantor notaris Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officeName">Nama Kantor *</Label>
                <Input
                  id="officeName"
                  value={formData.officeName}
                  onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                  placeholder="Kantor Notaris & PPAT"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Resmi *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="notaris@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telepon *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="021-12345678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://notaris.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="officeAddress">Alamat Lengkap *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="officeAddress"
                  value={formData.officeAddress}
                  onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                  placeholder="Jalan, Nomor, RT/RW, Kelurahan, Kecamatan"
                  className="pl-10"
                  rows={2}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Kota *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Jakarta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provinsi *</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="DKI Jakarta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Kode Pos *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="12345"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notaris Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Notaris
            </CardTitle>
            <CardDescription>Data Notaris pribadi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notarisName">Nama Notaris *</Label>
                <Input
                  id="notarisName"
                  value={formData.notarisName}
                  onChange={(e) => setFormData({ ...formData, notarisName: e.target.value })}
                  placeholder="Nama lengkap Notaris"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notarisNumber">Nomor SK Notaris</Label>
                <Input
                  id="notarisNumber"
                  value={formData.notarisNumber}
                  onChange={(e) => setFormData({ ...formData, notarisNumber: e.target.value })}
                  placeholder="XX/VII/2024/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notarisRegion">Wilayah Kerja</Label>
                <Input
                  id="notarisRegion"
                  value={formData.notarisRegion}
                  onChange={(e) => setFormData({ ...formData, notarisRegion: e.target.value })}
                  placeholder="Jakarta Selatan"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pengaturan Dokumen
            </CardTitle>
            <CardDescription>Prefix untuk nomor dokumen dan invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentPrefix">Prefix Dokumen</Label>
                <Input
                  id="documentPrefix"
                  value={formData.documentPrefix}
                  onChange={(e) => setFormData({ ...formData, documentPrefix: e.target.value })}
                  placeholder="AKTA"
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: AKTA-2024-0001
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Prefix Invoice</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV"
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: INV-2024-0001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UU PDP Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Kepatuhan UU PDP
            </CardTitle>
            <CardDescription>
              Pengaturan kepatuhan Undang-Undang Perlindungan Data Pribadi (UU PDP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Protection Officer */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dpoName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nama Data Protection Officer
                </Label>
                <Input
                  id="dpoName"
                  value={formData.dpoName}
                  onChange={(e) => setFormData({ ...formData, dpoName: e.target.value })}
                  placeholder="Nama DPO"
                />
                <p className="text-xs text-muted-foreground">
                  Penanggung jawab perlindungan data di kantor notaris
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpoEmail">Email DPO</Label>
                <Input
                  id="dpoEmail"
                  type="email"
                  value={formData.dpoEmail}
                  onChange={(e) => setFormData({ ...formData, dpoEmail: e.target.value })}
                  placeholder="dpo@notaris.com"
                />
              </div>
            </div>

            {/* Data Retention Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataRetentionYears" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Retensi Data Klien (Tahun)
                </Label>
                <Input
                  id="dataRetentionYears"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.dataRetentionYears}
                  onChange={(e) => setFormData({ ...formData, dataRetentionYears: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-muted-foreground">
                  Durasi penyimpanan data klien (Pasal 32 UU PDP)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auditLogRetentionMonths" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Retensi Audit Log (Bulan)
                </Label>
                <Input
                  id="auditLogRetentionMonths"
                  type="number"
                  min="6"
                  max="120"
                  value={formData.auditLogRetentionMonths}
                  onChange={(e) => setFormData({ ...formData, auditLogRetentionMonths: parseInt(e.target.value) || 6 })}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 bulan sesuai Pasal 31 UU PDP
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-2">
              <Label htmlFor="privacyPolicy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Kebijakan Privasi
              </Label>
              <Textarea
                id="privacyPolicy"
                value={formData.privacyPolicy}
                onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                placeholder="Kebijakan privasi kantor notaris..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Kebijakan privasi akan ditampilkan saat mengumpulkan data klien. Template default sesuai UU PDP sudah disediakan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
            <CardDescription>Catatan tambahan untuk kantor notaris</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </div>
    </form>
  );
}