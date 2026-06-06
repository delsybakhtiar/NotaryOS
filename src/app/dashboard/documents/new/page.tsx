'use client';

// ============================================
// NEW DOCUMENT PAGE
// Form for creating new documents
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  FileText,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// Document type labels
const DocumentTypes = [
  { value: 'AKTA_PENDIRIAN', label: 'Akta Pendirian' },
  { value: 'AKTA_PERUBAHAN', label: 'Akta Perubahan' },
  { value: 'AKTA_PEMBERIAN_HAK_TANGGUNGAN', label: 'APHT' },
  { value: 'AKTA_WARIS', label: 'Akta Waris' },
  { value: 'SURAT_KUASA', label: 'Surat Kuasa' },
  { value: 'PERJANJIAN', label: 'Perjanjian' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: 'none',
    title: '',
    documentType: '',
    description: '',
    content: '',
    documentDate: '',
    effectiveDate: '',
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.documentType) {
      toast.error('Mohon lengkapi field yang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Skip clientId if it's "none" (tanpa klien)
        if (key === 'clientId' && value === 'none') {
          return;
        }
        // Only append non-empty values
        if (value) formDataObj.append(key, value);
      });

      const response = await fetch('/api/documents/new', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dokumen berhasil dibuat');
        router.push(`/dashboard/documents/${data.document.id}`);
      } else {
        toast.error(data.error || 'Gagal membuat dokumen');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Terjadi kesalahan saat membuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Buat Dokumen Baru</h2>
          <p className="text-muted-foreground">
            Buat dokumen atau akta baru untuk klien
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Informasi Dokumen</CardTitle>
            </div>
            <CardDescription>
              Lengkapi informasi dasar dokumen yang akan dibuat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="clientId">Klien (Opsional)</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih klien (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Klien</SelectItem>
                  {/* TODO: Fetch clients from API */}
                </SelectContent>
              </Select>
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">
                Tipe Dokumen <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, documentType: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe dokumen" />
                </SelectTrigger>
                <SelectContent>
                  {DocumentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Dokumen <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Masukkan judul dokumen"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Deskripsi singkat tentang dokumen"
                rows={3}
              />
            </div>

            {/* Document Date */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentDate">Tanggal Dokumen</Label>
                <Input
                  id="documentDate"
                  name="documentDate"
                  type="date"
                  value={formData.documentDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Tanggal Berlaku</Label>
                <Input
                  id="effectiveDate"
                  name="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Isi Dokumen</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Tulis isi dokumen di sini..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Untuk saat ini, gunakan textarea sederhana. Fitur Rich Text Editor akan tersedia di masa depan.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Catatan tambahan untuk dokumentasi internal"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/dashboard/documents">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Dokumen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}