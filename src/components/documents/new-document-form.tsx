'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createDocument, type CreateDocumentInput } from '@/lib/actions/document';
import { DocumentType } from '@prisma/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  clientCode: string;
}

interface NewDocumentFormProps {
  clients: Client[];
}

export function NewDocumentForm({ clients }: NewDocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: '',
    description: '',
    content: '',
    clientId: '',
    documentDate: '',
    effectiveDate: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: CreateDocumentInput = {
        title: formData.title,
        documentType: formData.documentType as DocumentType,
        description: formData.description || undefined,
        content: formData.content,
        clientId: formData.clientId || undefined,
        documentDate: formData.documentDate ? new Date(formData.documentDate) : undefined,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
        notes: formData.notes || undefined,
      };

      const result = await createDocument(data);

      if (result.success && result.data) {
        toast.success('Dokumen berhasil dibuat');
        router.push(`/dashboard/documents/${result.data.id}`);
      } else {
        toast.error(result.error || 'Gagal membuat dokumen');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Terjadi kesalahan saat membuat dokumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentTypes = [
    { value: DocumentType.AKTA_PENDIRIAN, label: 'Akta Pendirian' },
    { value: DocumentType.AKTA_PERUBAHAN, label: 'Akta Perubahan' },
    { value: DocumentType.AKTA_PEMBERIAN_HAK_TANGGUNGAN, label: 'APHT' },
    { value: DocumentType.AKTA_WARIS, label: 'Akta Waris' },
    { value: DocumentType.SURAT_KUASA, label: 'Surat Kuasa' },
    { value: DocumentType.PERJANJIAN, label: 'Perjanjian' },
    { value: DocumentType.LAINNYA, label: 'Lainnya' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Dokumen Baru</h1>
          <p className="text-muted-foreground mt-1">
            Buat draft dokumen akta atau perjanjian baru
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-4xl">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>
                Masukkan informasi dasar dokumen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Judul Dokumen <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul dokumen"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">
                    Tipe Dokumen <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => handleInputChange('documentType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe dokumen" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang dokumen"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Klien (Opsional)</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => handleInputChange('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih klien" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="" disabled>
                        Tidak ada klien tersedia
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.clientCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentDate">Tanggal Dokumen</Label>
                  <Input
                    id="documentDate"
                    type="date"
                    value={formData.documentDate}
                    onChange={(e) => handleInputChange('documentDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Tanggal Berlaku</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Content */}
          <Card>
            <CardHeader>
              <CardTitle>Konten Dokumen</CardTitle>
              <CardDescription>
                Masukkan isi dokumen. Rich text editor akan segera tersedia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">
                  Isi Dokumen <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Ketik isi dokumen di sini..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={15}
                  required
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Catatan Tambahan</CardTitle>
              <CardDescription>
                Catatan internal untuk referensi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan internal..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Dokumen'}
            </Button>
            <Link href="/dashboard/documents">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}